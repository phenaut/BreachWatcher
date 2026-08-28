import { extractMainDomain, isCheckableUrl } from '../utils/domain.js';

// Configuration par défaut
const DEFAULT_PROXY_URL = 'http://127.0.0.1:8787';

// Cache mémoire temporaire pour limiter les requêtes répétitives (Domain -> Données)
const domainMemoryCache = new Map();

/**
 * Récupère l'URL du proxy configurée dans les options ou la valeur par défaut.
 * @returns {Promise<string>}
 */
async function getProxyUrl() {
  try {
    const result = await browser.storage.sync.get({ proxyUrl: DEFAULT_PROXY_URL });
    return (result.proxyUrl || DEFAULT_PROXY_URL).replace(/\/+$/, '');
  } catch (error) {
    console.warn('[BreachWatcher] Erreur lecture config, utilisation proxy par défaut:', error);
    return DEFAULT_PROXY_URL;
  }
}

/**
 * Interroge le serveur proxy pour vérifier si un domaine a fait l'objet de signalements.
 * @param {string} domain
 * @returns {Promise<object>}
 */
async function checkDomainWithProxy(domain) {
  if (!domain) return { breaches: [], count: 0, hasBreach: false };

  // Vérification dans le cache mémoire local
  if (domainMemoryCache.has(domain)) {
    const cached = domainMemoryCache.get(domain);
    // Cache valide 30 minutes côté client
    if (Date.now() - cached.timestamp < 30 * 60 * 1000) {
      return cached.data;
    }
  }

  const baseUrl = await getProxyUrl();
  const endpoint = `${baseUrl}/api/check?domain=${encodeURIComponent(domain)}`;

  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Réponse HTTP invalide: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const result = {
      domain: domain,
      hasBreach: Boolean(data.hasBreach || (data.articles && data.articles.length > 0)),
      count: data.count || (data.articles ? data.articles.length : 0),
      articles: data.articles || [],
      lastChecked: data.lastChecked || new Date().toISOString(),
      cachedAt: data.cachedAt || null
    };

    domainMemoryCache.set(domain, { timestamp: Date.now(), data: result });
    return result;
  } catch (error) {
    console.error(`[BreachWatcher] Impossible de vérifier le domaine ${domain}:`, error);
    return {
      domain: domain,
      hasBreach: false,
      count: 0,
      articles: [],
      error: error.message
    };
  }
}

/**
 * Met à jour le badge et l'icône de l'onglet selon le résultat de l'analyse.
 * @param {number} tabId
 * @param {object} breachInfo
 */
async function updateTabBadge(tabId, breachInfo) {
  if (!tabId || tabId < 0) return;

  if (breachInfo.hasBreach && breachInfo.count > 0) {
    // Alerte : badge rouge avec nombre d'incidents
    await browser.action.setBadgeText({
      tabId: tabId,
      text: breachInfo.count > 9 ? '9+' : String(breachInfo.count)
    });
    await browser.action.setBadgeBackgroundColor({
      tabId: tabId,
      color: '#d32f2f'
    });
    await browser.action.setTitle({
      tabId: tabId,
      title: `⚠️ BreachWatcher : ${breachInfo.count} incident(s) de sécurité signalé(s) pour ce domaine.`
    });
  } else {
    // Site indemne ou non vérifiable
    await browser.action.setBadgeText({
      tabId: tabId,
      text: ''
    });
    await browser.action.setTitle({
      tabId: tabId,
      title: 'BreachWatcher : Aucun incident de sécurité récent signalé.'
    });
  }
}

/**
 * Traite la navigation pour un onglet donné.
 * @param {number} tabId
 * @param {string} url
 */
async function processTabNavigation(tabId, url) {
  if (!isCheckableUrl(url)) {
    await updateTabBadge(tabId, { hasBreach: false, count: 0 });
    return;
  }

  const domain = extractMainDomain(url);
  if (!domain) return;

  const breachInfo = await checkDomainWithProxy(domain);
  await updateTabBadge(tabId, breachInfo);

  // Sauvegarde de l'état du dernier domaine vérifié pour cet onglet
  try {
    await browser.storage.local.set({
      [`tab_${tabId}`]: {
        url,
        domain,
        breachInfo,
        updatedAt: Date.now()
      }
    });
  } catch (err) {
    console.warn('[BreachWatcher] Erreur stockage session:', err);
  }
}

// 1. Écoute des navigations complètes
browser.webNavigation.onCompleted.addListener((details) => {
  // Uniquement la frame principale
  if (details.frameId === 0) {
    processTabNavigation(details.tabId, details.url);
  }
});

// 2. Écoute des changements d'onglets pour s'assurer que le badge est synchronisé
browser.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    const tab = await browser.tabs.get(activeInfo.tabId);
    if (tab && tab.url) {
      processTabNavigation(tab.id, tab.url);
    }
  } catch (error) {
    console.debug('[BreachWatcher] Onglet inaccessible:', error);
  }
});

// 3. Nettoyage lors de la fermeture d'un onglet
browser.tabs.onRemoved.addListener((tabId) => {
  browser.storage.local.remove(`tab_${tabId}`).catch(() => {});
});

// 4. Écoute des messages venant de la popup
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getCurrentTabStatus') {
    (async () => {
      try {
        const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
        if (!tab || !tab.url) {
          sendResponse({ success: false, reason: 'no_active_tab' });
          return;
        }

        const domain = extractMainDomain(tab.url);
        if (!domain) {
          sendResponse({ success: false, reason: 'unsupported_url', url: tab.url });
          return;
        }

        const breachInfo = await checkDomainWithProxy(domain);
        sendResponse({ success: true, tabId: tab.id, url: tab.url, domain, breachInfo });
      } catch (err) {
        sendResponse({ success: false, error: err.message });
      }
    })();
    return true; // Réponse asynchrone
  }
});

console.log('[BreachWatcher] Background script initialisé avec succès.');

