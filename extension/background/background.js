import { extractMainDomain, extractBrandName, isCheckableUrl } from '../utils/domain.js';
import { KNOWN_BREACHES } from '../data/known-breaches.js';
import { fetchPublicCyberNews } from '../utils/news-parser.js';

// Configuration par défaut
const DEFAULT_CACHE_DAYS = 7;
const memoryCache = new Map();

/**
 * Récupère la durée de validité du cache configurée (en ms).
 * @returns {Promise<number>}
 */
async function getCacheTtlMs() {
  try {
    const res = await browser.storage.sync.get({ cacheDays: DEFAULT_CACHE_DAYS });
    const days = parseInt(res.cacheDays, 10) || DEFAULT_CACHE_DAYS;
    return days * 24 * 60 * 60 * 1000;
  } catch {
    return DEFAULT_CACHE_DAYS * 24 * 60 * 60 * 1000;
  }
}

/**
 * Interroge l'API publique Have I Been Pwned pour un domaine donné.
 * @param {string} domain
 * @returns {Promise<Array>}
 */
async function fetchHIBPBreaches(domain) {
  try {
    const url = `https://haveibeenpwned.com/api/v3/breaches?domain=${encodeURIComponent(domain)}`;
    const response = await fetch(url, {
      signal: AbortSignal.timeout ? AbortSignal.timeout(3000) : undefined,
      headers: {
        'User-Agent': 'BreachWatcher-Firefox-Extension/1.0',
        'Accept': 'application/json'
      }
    });

    if (response.status === 404) {
      return []; // Aucune fuite répertoriée
    }

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    if (!Array.isArray(data)) return [];

    return data.map((b) => {
      const cleanDesc = (b.Description || '').replace(/<[^>]*>?/gm, '');
      return {
        title: b.Title || b.Name,
        breachDate: b.BreachDate,
        pwnCount: b.PwnCount || 0,
        source: 'Have I Been Pwned (Vérifié)',
        dataClasses: b.DataClasses || [],
        summary: cleanDesc,
        isVerified: true
      };
    });
  } catch {
    return [];
  }
}

/**
 * Effectue l'analyse complète d'un nom de domaine en combinant :
 * 1. La base de référence embarquée
 * 2. L'API publique Have I Been Pwned
 * 3. Le flux RSS d'actualités de presse récentes
 * @param {string} domain
 * @returns {Promise<object>}
 */
async function analyzeDomain(domain) {
  const norm = domain.toLowerCase();
  const brand = extractBrandName(norm);

  // 1. Consultation en parallèle de HIBP et des actualités RSS
  const [hibpBreaches, newsArticles] = await Promise.all([
    fetchHIBPBreaches(norm),
    fetchPublicCyberNews(norm, brand)
  ]);

  const allBreaches = [...hibpBreaches];
  const allArticles = [...newsArticles];

  // 2. Intégration de la base locale de référence
  if (KNOWN_BREACHES[norm]) {
    const known = KNOWN_BREACHES[norm];
    const alreadyPresent = allBreaches.some(
      (b) => b.breachDate && b.breachDate.slice(0, 4) === known.breachDate.slice(0, 4)
    );

    if (!alreadyPresent) {
      allBreaches.unshift({
        title: known.title,
        breachDate: known.breachDate,
        pwnCount: known.pwnCount,
        source: known.source,
        dataClasses: known.dataClasses,
        summary: known.summary,
        isVerified: true
      });
    }

    if (known.articles) {
      for (const art of known.articles) {
        if (!allArticles.some((a) => a.title === art.title)) {
          allArticles.push(art);
        }
      }
    }
  }

  const count = allBreaches.length + allArticles.length;
  return {
    domain: norm,
    brand: brand,
    hasBreach: count > 0,
    count: count,
    breachCount: allBreaches.length,
    newsCount: allArticles.length,
    breaches: allBreaches,
    articles: allArticles,
    analyzedAt: new Date().toISOString()
  };
}

/**
 * Récupère le statut d'un domaine (avec lecture/écriture dans le cache local browser.storage).
 * @param {string} domain
 * @param {boolean} forceRefresh
 * @returns {Promise<object>}
 */
async function getDomainStatus(domain, forceRefresh = false) {
  if (!domain) return { breaches: [], count: 0, hasBreach: false };
  const norm = domain.toLowerCase();
  const cacheKey = `cache_${norm}`;
  const ttlMs = await getCacheTtlMs();

  // 1. Vérification en mémoire vive
  if (!forceRefresh && memoryCache.has(norm)) {
    const mem = memoryCache.get(norm);
    if (Date.now() - mem.timestamp < ttlMs) {
      return { ...mem.data, fromCache: true };
    }
  }

  // 2. Vérification dans le stockage persistant browser.storage.local
  if (!forceRefresh) {
    try {
      const stored = await browser.storage.local.get(cacheKey);
      if (stored[cacheKey] && stored[cacheKey].timestamp) {
        const age = Date.now() - stored[cacheKey].timestamp;
        if (age < ttlMs) {
          const cachedData = stored[cacheKey].data;
          memoryCache.set(norm, { timestamp: stored[cacheKey].timestamp, data: cachedData });
          return { ...cachedData, fromCache: true, cachedAt: new Date(stored[cacheKey].timestamp).toISOString() };
        }
      }
    } catch (err) {
      console.warn('[BreachWatcher] Erreur lecture cache local:', err);
    }
  }

  // 3. Analyse en direct
  const result = await analyzeDomain(norm);

  // 4. Sauvegarde dans le cache (mémoire + stockage local)
  const now = Date.now();
  memoryCache.set(norm, { timestamp: now, data: result });
  try {
    await browser.storage.local.set({
      [cacheKey]: {
        timestamp: now,
        data: result
      }
    });
  } catch (err) {
    console.warn('[BreachWatcher] Erreur écriture cache local:', err);
  }

  return { ...result, fromCache: false };
}

/**
 * Met à jour le badge et le titre de l'extension pour un onglet.
 * @param {number} tabId
 * @param {object} breachInfo
 */
async function updateTabBadge(tabId, breachInfo) {
  if (!tabId || tabId < 0) return;

  if (breachInfo.hasBreach && breachInfo.count > 0) {
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
      title: `⚠️ BreachWatcher : ${breachInfo.count} incident(s) de sécurité signalé(s) pour ce site.`
    });
  } else {
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
 * Traite la navigation sur un onglet.
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

  const breachInfo = await getDomainStatus(domain);
  await updateTabBadge(tabId, breachInfo);

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
    console.warn('[BreachWatcher] Erreur stockage session onglet:', err);
  }
}

// Événement 1 : Fin de chargement d'une page
browser.webNavigation.onCompleted.addListener((details) => {
  if (details.frameId === 0) {
    processTabNavigation(details.tabId, details.url);
  }
});

// Événement 2 : Changement d'onglet actif
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

// Événement 3 : Fermeture d'un onglet
browser.tabs.onRemoved.addListener((tabId) => {
  browser.storage.local.remove(`tab_${tabId}`).catch(() => {});
});

// Événement 4 : Messages depuis la popup ou la page d'options
browser.runtime.onMessage.addListener((message, sender) => {
  if (message && message.action === 'getCurrentTabStatus') {
    return (async () => {
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
        const breachInfo = await getDomainStatus(domain, forceRefresh);
        if (forceRefresh) {
          await updateTabBadge(tab.id, breachInfo);
        }

        return { success: true, tabId: tab.id, url: tab.url, domain, breachInfo };
      } catch (err) {
        return { success: false, error: err.message };
      }
    })();
  }

  if (message && message.action === 'clearCache') {
    return (async () => {
      memoryCache.clear();
      const all = await browser.storage.local.get(null);
      const cacheKeys = Object.keys(all).filter((k) => k.startsWith('cache_'));
      if (cacheKeys.length > 0) {
        await browser.storage.local.remove(cacheKeys);
      }
      return { success: true, clearedCount: cacheKeys.length };
    })();
  }
});

console.log('[BreachWatcher] Extension autonome initialisée avec succès.');
