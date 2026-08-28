import { extractMainDomain, isCheckableUrl } from '../utils/domain.js';

// Configuration par défaut
const DEFAULT_PROXY_URL = 'http://127.0.0.1:8787';

// Cache mémoire temporaire pour limiter les requêtes répétitives (Domain -> Données)
const domainMemoryCache = new Map();

/**
 * Base de référence locale intégrée à l'extension
 * Permet à l'extension de fonctionner immédiatement même si le Worker local n'est pas démarré.
 */
const EMBEDDED_BREACHES = {
  'cdiscount.com': {
    title: 'Piratage et exfiltration de comptes clients Cdiscount',
    breachDate: '2021-01-29',
    pwnCount: 4200,
    source: 'Have I Been Pwned / Presse',
    dataClasses: ['Coordonnées bancaires', 'Mots de passe', 'Adresses emails', 'Numéros de téléphone'],
    summary: 'En janvier 2021, une exfiltration de données clients a touché Cdiscount via un accès interne compromis, incluant des identifiants et des données d’achats.',
    articles: [
      {
        title: 'Cdiscount : vol de données bancaires et personnelles de clients',
        source: 'Le Figaro Tech',
        url: 'https://www.lefigaro.fr/secteur/high-tech/cdiscount-vol-de-donnees-bancaires-de-clients-20210203',
        publishedAt: '2021-02-03'
      },
      {
        title: 'Cdiscount victime d’un vol de données touchant des milliers de comptes',
        source: '01net',
        url: 'https://www.01net.com/actualites/cdiscount-victime-d-un-vol-de-donnees-2037920.html',
        publishedAt: '2021-02-03'
      }
    ]
  },
  'free.fr': {
    title: 'Cyberattaque et fuite massive de données Free',
    breachDate: '2024-10-26',
    pwnCount: 19000000,
    source: 'Presse / Déclaration CNIL',
    dataClasses: ['IBAN', 'Noms', 'Prénoms', 'Adresses', 'Numéros de téléphone'],
    summary: 'En octobre 2024, Free a subi une attaque majeure ayant entraîné la fuite de données de 19 millions d’abonnés dont 5,1 millions d’IBAN.',
    articles: [
      {
        title: 'Free victime d’une cyberattaque d’ampleur : 19 millions de clients concernés',
        source: 'Le Monde',
        url: 'https://www.lemonde.fr/pixels/article/2024/10/26/free-victime-d-un-piratage-de-donnees-bancaires_6360416_4408996.html',
        publishedAt: '2024-10-26'
      }
    ]
  },
  'deezer.com': {
    title: 'Fuite de données Deezer (2019 / révélée en 2022)',
    breachDate: '2019-04-10',
    pwnCount: 229000000,
    source: 'Have I Been Pwned',
    dataClasses: ['Adresses emails', 'Noms', 'Dates de naissance', 'Adresses IP'],
    summary: 'Une sauvegarde de 2019 chez un prestataire tiers a été exposée en ligne contenant les données de 229 millions d’utilisateurs.',
    articles: [
      {
        title: 'Deezer : les données de plus de 200 millions d’utilisateurs piratées',
        source: 'ZDNet',
        url: 'https://www.zdnet.fr/actualites/deezer-les-donnees-de-plus-de-200-millions-d-utilisateurs-piratees-39951804.htm',
        publishedAt: '2023-01-03'
      }
    ]
  },
  'linkedin.com': {
    title: 'Scraping et fuite de données massives LinkedIn',
    breachDate: '2021-04-08',
    pwnCount: 700000000,
    source: 'Have I Been Pwned',
    dataClasses: ['Adresses emails', 'Noms complets', 'Téléphones', 'Profils professionnels'],
    summary: 'En 2021, une base de données de 700 millions de profils LinkedIn a été mise en vente sur un forum de hackers.',
    articles: [
      {
        title: 'LinkedIn : une base de données de 700 millions d’utilisateurs mise en vente',
        source: 'Les Numériques',
        url: 'https://www.lesnumeriques.com/vie-du-net/linkedin-une-base-de-donnees-de-700-millions-d-utilisateurs-mise-en-vente-n165487.html',
        publishedAt: '2021-06-30'
      }
    ]
  }
};

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
 * Analyse autonome de secours si le proxy Worker est hors-ligne.
 * @param {string} domain
 * @returns {Promise<object>}
 */
async function directFallbackCheck(domain) {
  const norm = domain.toLowerCase();
  const breaches = [];
  const articles = [];

  // 1. Consultation de la base embarquée
  if (EMBEDDED_BREACHES[norm]) {
    const item = EMBEDDED_BREACHES[norm];
    breaches.push({
      title: item.title,
      breachDate: item.breachDate,
      pwnCount: item.pwnCount,
      source: item.source,
      dataClasses: item.dataClasses,
      summary: item.summary,
      isVerified: true
    });
    if (item.articles) {
      articles.push(...item.articles);
    }
  }

  // 2. Tentative d'interrogation directe de l'API publique HIBP si accessible
  try {
    const hibpUrl = `https://haveibeenpwned.com/api/v3/breaches?domain=${encodeURIComponent(norm)}`;
    const response = await fetch(hibpUrl, {
      signal: AbortSignal.timeout ? AbortSignal.timeout(2000) : undefined,
      headers: {
        'User-Agent': 'BreachWatcher-Firefox-Extension/1.0',
        'Accept': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data)) {
        data.forEach((b) => {
          if (!breaches.some((x) => x.breachDate && x.breachDate.slice(0, 4) === (b.BreachDate || '').slice(0, 4))) {
            const cleanDesc = (b.Description || '').replace(/<[^>]*>?/gm, '');
            breaches.push({
              title: b.Title || b.Name,
              breachDate: b.BreachDate,
              pwnCount: b.PwnCount || 0,
              source: 'Have I Been Pwned (Vérifié)',
              dataClasses: b.DataClasses || [],
              summary: cleanDesc,
              isVerified: true
            });
          }
        });
      }
    }
  } catch {
    // Silencieux en mode secours
  }

  const count = breaches.length + articles.length;
  return {
    domain: norm,
    hasBreach: count > 0,
    count: count,
    breachCount: breaches.length,
    newsCount: articles.length,
    breaches: breaches,
    articles: articles,
    source: 'direct_fallback',
    lastChecked: new Date().toISOString()
  };
}

/**
 * Interroge le serveur proxy (avec fallback direct transparent si le proxy est injoignable).
 * @param {string} domain
 * @param {boolean} forceRefresh
 * @returns {Promise<object>}
 */
async function checkDomainWithProxy(domain, forceRefresh = false) {
  if (!domain) return { breaches: [], count: 0, hasBreach: false };

  // Vérification dans le cache mémoire local
  if (!forceRefresh && domainMemoryCache.has(domain)) {
    const cached = domainMemoryCache.get(domain);
    if (Date.now() - cached.timestamp < 30 * 60 * 1000) {
      return cached.data;
    }
  }

  const baseUrl = await getProxyUrl();
  const refreshParam = forceRefresh ? '&refresh=true' : '';
  const endpoint = `${baseUrl}/api/check?domain=${encodeURIComponent(domain)}${refreshParam}`;

  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      signal: AbortSignal.timeout ? AbortSignal.timeout(2500) : undefined,
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Réponse HTTP: ${response.status}`);
    }

    const data = await response.json();
    const result = {
      domain: domain,
      brand: data.brand || '',
      hasBreach: Boolean(data.hasBreach || (data.articles && data.articles.length > 0) || (data.breaches && data.breaches.length > 0)),
      count: data.count || ((data.articles?.length || 0) + (data.breaches?.length || 0)),
      breachCount: data.breachCount || (data.breaches?.length || 0),
      newsCount: data.newsCount || (data.articles?.length || 0),
      breaches: data.breaches || [],
      articles: data.articles || [],
      lastChecked: data.lastChecked || new Date().toISOString(),
      cachedAt: data.cachedAt || null
    };

    domainMemoryCache.set(domain, { timestamp: Date.now(), data: result });
    return result;
  } catch (error) {
    // Si le proxy local (ou distant) n'est pas joignable, fallback transparent direct
    console.warn(`[BreachWatcher] Proxy inaccessible (${baseUrl}), basculement en mode direct pour ${domain}`);
    const fallbackResult = await directFallbackCheck(domain);
    domainMemoryCache.set(domain, { timestamp: Date.now(), data: fallbackResult });
    return fallbackResult;
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

// Traitement asynchrone des demandes de statut pour la popup
async function handleGetCurrentTabStatus(message) {
  try {
    const tabs = await browser.tabs.query({ active: true, currentWindow: true });
    const tab = tabs[0];
    if (!tab || !tab.url) {
      return { success: false, reason: 'no_active_tab' };
    }

    const domain = extractMainDomain(tab.url);
    if (!domain) {
      return { success: false, reason: 'unsupported_url', url: tab.url };
    }

    const forceRefresh = Boolean(message.forceRefresh);
    const breachInfo = await checkDomainWithProxy(domain, forceRefresh);
    if (forceRefresh) {
      await updateTabBadge(tab.id, breachInfo);
    }

    return { success: true, tabId: tab.id, url: tab.url, domain, breachInfo };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// 4. Écoute des messages venant de la popup (compatible Firefox Promise)
browser.runtime.onMessage.addListener((message, sender) => {
  if (message && message.action === 'getCurrentTabStatus') {
    return handleGetCurrentTabStatus(message);
  }
});

console.log('[BreachWatcher] Background script initialisé avec succès.');
