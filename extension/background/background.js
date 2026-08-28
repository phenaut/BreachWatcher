/**
 * BreachWatcher - Extension Firefox 100% autonome
 * Fichier unique (background script sans modules ES6 pour compatibilité Firefox)
 *
 * Modules embarqués :
 *  - utils/domain.js
 *  - data/known-breaches.js
 *  - utils/news-parser.js
 *  - Logique principale de cache et d'analyse
 */

// ─────────────────────────────────────────────────────────────
// MODULE : utils/domain.js
// ─────────────────────────────────────────────────────────────

const MULTI_PART_TLDS = new Set([
  'co.uk', 'gov.uk', 'ac.uk', 'org.uk',
  'com.au', 'net.au', 'org.au', 'edu.au',
  'co.nz', 'org.nz', 'co.jp', 'ne.jp',
  'com.br', 'org.br', 'gc.ca'
]);

function isCheckableUrl(urlString) {
  if (!urlString || typeof urlString !== 'string') return false;
  try {
    const parsed = new URL(urlString);
    if (!['http:', 'https:'].includes(parsed.protocol)) return false;
    const hostname = parsed.hostname.toLowerCase();
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '0.0.0.0' ||
      hostname.endsWith('.local') ||
      hostname.endsWith('.internal')
    ) return false;
    return true;
  } catch { return false; }
}

function extractMainDomain(urlString) {
  if (!isCheckableUrl(urlString)) return null;
  try {
    const parsed = new URL(urlString);
    let hostname = parsed.hostname.toLowerCase();
    if (hostname.startsWith('www.')) hostname = hostname.slice(4);
    const parts = hostname.split('.');
    if (parts.length <= 2) return hostname;
    const lastTwo = parts.slice(-2).join('.');
    if (MULTI_PART_TLDS.has(lastTwo)) {
      return parts.length >= 3 ? parts.slice(-3).join('.') : hostname;
    }
    return parts.slice(-2).join('.');
  } catch { return null; }
}

function extractBrandName(domain) {
  if (!domain) return '';
  return domain.replace(/^www\./, '').split('.')[0];
}

// ─────────────────────────────────────────────────────────────
// MODULE : data/known-breaches.js
// ─────────────────────────────────────────────────────────────

const KNOWN_BREACHES = {
  'cdiscount.com': {
    title: 'Piratage et exfiltration de comptes clients Cdiscount',
    breachDate: '2021-01-29',
    pwnCount: 4200,
    source: 'Have I Been Pwned / Presse',
    dataClasses: ['Coordonnées bancaires', 'Mots de passe', 'Adresses emails', 'Numéros de téléphone'],
    summary: "En janvier 2021, une exfiltration de comptes clients a touché Cdiscount via un accès interne compromis.",
    articles: [
      {
        title: 'Cdiscount : vol de données bancaires et personnelles de clients',
        source: 'Le Figaro Tech',
        url: 'https://www.lefigaro.fr/secteur/high-tech/cdiscount-vol-de-donnees-bancaires-de-clients-20210203',
        publishedAt: '2021-02-03'
      },
      {
        title: "Cdiscount victime d'un vol de données touchant des milliers de comptes",
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
    dataClasses: ['IBAN', 'Noms', 'Prénoms', 'Adresses postales', 'Numéros de téléphone'],
    summary: "En octobre 2024, Free a subi une attaque majeure exposant les données de 19 millions d'abonnés dont 5,1 millions d'IBAN.",
    articles: [
      {
        title: "Free victime d'une cyberattaque d'ampleur : 19 millions de clients concernés",
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
    summary: "Une sauvegarde de 2019 chez un prestataire tiers a exposé les données de 229 millions d'utilisateurs.",
    articles: [
      {
        title: "Deezer : les données de plus de 200 millions d'utilisateurs piratées",
        source: 'ZDNet',
        url: 'https://www.zdnet.fr/actualites/deezer-les-donnees-de-plus-de-200-millions-d-utilisateurs-piratees-39951804.htm',
        publishedAt: '2023-01-03'
      }
    ]
  },
  'francetravail.fr': {
    title: 'Piratage massif de France Travail (ex-Pôle Emploi)',
    breachDate: '2024-03-08',
    pwnCount: 43000000,
    source: 'Presse / CNIL',
    dataClasses: ['Numéros de Sécurité sociale', 'Noms', 'Prénoms', 'Adresses emails', 'Téléphones'],
    summary: "Une intrusion sur les systèmes de France Travail a exposé les données personnelles de 43 millions de bénéficiaires.",
    articles: [
      {
        title: 'France Travail victime d\'une cyberattaque : 43 millions de personnes concernées',
        source: 'Franceinfo',
        url: 'https://www.francetvinfo.fr/economie/emploi/recherche-d-emploi/pole-emploi/cyberattaque-visant-france-travail-43-millions-de-personnes-potentielles-concernees_6419732.html',
        publishedAt: '2024-03-13'
      }
    ]
  },
  'linkedin.com': {
    title: 'Scraping et fuite de données massives LinkedIn',
    breachDate: '2021-04-08',
    pwnCount: 700000000,
    source: 'Have I Been Pwned',
    dataClasses: ['Adresses emails', 'Noms complets', 'Numéros de téléphone', 'Profils professionnels'],
    summary: "En 2021, une base de 700 millions de profils LinkedIn a été mise en vente sur le darknet.",
    articles: [
      {
        title: "LinkedIn : une base de données de 700 millions d'utilisateurs mise en vente",
        source: 'Les Numériques',
        url: 'https://www.lesnumeriques.com/vie-du-net/linkedin-une-base-de-donnees-de-700-millions-d-utilisateurs-mise-en-vente-n165487.html',
        publishedAt: '2021-06-30'
      }
    ]
  },
  'adobe.com': {
    title: 'Piratage massif des comptes clients Adobe',
    breachDate: '2013-10-04',
    pwnCount: 153000000,
    source: 'Have I Been Pwned',
    dataClasses: ['Adresses emails', 'Mots de passe chiffrés', 'Noms d\'utilisateurs'],
    summary: "En octobre 2013, Adobe a subi l'une des plus grandes cyberattaques de l'époque exposant 153 millions de comptes.",
    articles: []
  },
  'canva.com': {
    title: 'Fuite de données utilisateurs Canva',
    breachDate: '2019-05-24',
    pwnCount: 137000000,
    source: 'Have I Been Pwned',
    dataClasses: ['Adresses emails', 'Noms', 'Mots de passe hachés', 'Villes'],
    summary: "En mai 2019, Canva a été piratée par le groupe Gnosticplayers touchant 137 millions d'utilisateurs.",
    articles: []
  }
};

// ─────────────────────────────────────────────────────────────
// MODULE : utils/news-parser.js
// ─────────────────────────────────────────────────────────────

function parseArticleTitleAndSource(rawTitle) {
  if (!rawTitle) return { title: '', source: 'Presse' };
  const lastDash = rawTitle.lastIndexOf(' - ');
  if (lastDash > 0) {
    return {
      title: rawTitle.substring(0, lastDash).trim(),
      source: rawTitle.substring(lastDash + 3).trim()
    };
  }
  return { title: rawTitle, source: 'Presse' };
}

async function fetchPublicCyberNews(domain, brand) {
  if (!domain && !brand) return [];
  const queryTerms = brand ? `"${brand}"` : `"${domain}"`;
  const query = encodeURIComponent(`${queryTerms} (piratage OR "fuite de données" OR cyberattaque OR "data breach")`);
  const rssUrl = `https://news.google.com/rss/search?q=${query}&hl=fr&gl=FR&ceid=FR:fr`;

  try {
    const response = await fetch(rssUrl, {
      signal: AbortSignal.timeout ? AbortSignal.timeout(3000) : undefined,
      headers: { 'Accept': 'application/rss+xml, application/xml, text/xml; q=0.9, */*; q=0.8' }
    });
    if (!response.ok) return [];

    const xmlText = await response.text();
    const articles = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
    let match;
    let count = 0;

    while ((match = itemRegex.exec(xmlText)) !== null && count < 4) {
      const itemContent = match[1];
      const titleMatch = /<title>([\s\S]*?)<\/title>/i.exec(itemContent);
      const linkMatch = /<link>([\s\S]*?)<\/link>/i.exec(itemContent);
      const pubDateMatch = /<pubDate>([\s\S]*?)<\/pubDate>/i.exec(itemContent);
      const sourceMatch = /<source[^>]*>([\s\S]*?)<\/source>/i.exec(itemContent);

      if (titleMatch) {
        const rawTitle = titleMatch[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').trim();
        const url = linkMatch ? linkMatch[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').trim() : '#';
        const pubDate = pubDateMatch ? pubDateMatch[1].trim() : new Date().toISOString();
        const explicitSource = sourceMatch ? sourceMatch[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').trim() : '';
        const parsed = parseArticleTitleAndSource(rawTitle);
        articles.push({
          title: parsed.title,
          source: explicitSource || parsed.source,
          url: url,
          publishedAt: pubDate
        });
        count++;
      }
    }
    return articles;
  } catch (error) {
    console.debug(`[NewsParser] Flux RSS inaccessible pour ${domain}:`, error.message);
    return [];
  }
}

// ─────────────────────────────────────────────────────────────
// LOGIQUE PRINCIPALE : Cache + Analyse + Badge
// ─────────────────────────────────────────────────────────────

const DEFAULT_CACHE_DAYS = 7;
const memoryCache = new Map();

async function getCacheTtlMs() {
  try {
    const res = await browser.storage.sync.get({ cacheDays: DEFAULT_CACHE_DAYS });
    const days = parseInt(res.cacheDays, 10) || DEFAULT_CACHE_DAYS;
    return days * 24 * 60 * 60 * 1000;
  } catch {
    return DEFAULT_CACHE_DAYS * 24 * 60 * 60 * 1000;
  }
}

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
    if (response.status === 404) return [];
    if (!response.ok) return [];
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

// Mots-clés de sécurité qui doivent apparaître dans le titre d'un article RSS
// pour qu'il soit considéré comme un signal d'incident réel
var SECURITY_KEYWORDS = ['cyberattaque', 'fuite de données', 'piratage', 'cyberattack', 'data breach', 'hack'];

/**
 * Vérifie si un titre d'article contient le brand ET au moins un mot-clé sécurité.
 * @param {string} title
 * @param {string} brand
 * @returns {boolean}
 */
function isRelevantSecurityArticle(title, brand) {
  if (!title || !brand) return false;
  var t = title.toLowerCase();

  // Normalisation des accents pour la comparaison (é → e, etc.)
  var normalize = function(str) {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  };
  var tNorm = normalize(title);
  var brandNorm = normalize(brand);

  // 1. Le brand doit apparaître dans le titre
  if (!tNorm.includes(brandNorm)) return false;

  // 2. Au moins un mot-clé de sécurité doit apparaître dans le titre
  for (var i = 0; i < SECURITY_KEYWORDS.length; i++) {
    if (tNorm.includes(normalize(SECURITY_KEYWORDS[i]))) return true;
  }
  return false;
}

async function analyzeDomain(domain) {
  var norm = domain.toLowerCase();
  var brand = extractBrandName(norm);

  // Étape 1 : Brèches vérifiées (HIBP + base embarquée) — en parallèle avec le RSS
  var hibpPromise = fetchHIBPBreaches(norm);

  // Étape 2 : Google News — toujours interrogé si brand suffisamment distinctif (≥ 4 chars)
  var newsPromise = (brand && brand.length >= 4)
    ? fetchPublicCyberNews(norm, brand)
    : Promise.resolve([]);

  var hibpBreaches = await hibpPromise;
  var allBreaches = [].concat(hibpBreaches);

  if (KNOWN_BREACHES[norm]) {
    var known = KNOWN_BREACHES[norm];
    var alreadyPresent = allBreaches.some(function(b) {
      return b.breachDate && b.breachDate.slice(0, 4) === known.breachDate.slice(0, 4);
    });
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
  }

  // Étape 3 : Filtrage strict des articles RSS
  // Un article n'est retenu QUE si : brand dans le titre ET mot-clé sécurité dans le titre
  var rawArticles = await newsPromise;
  var qualifiedArticles = rawArticles.filter(function(art) {
    return isRelevantSecurityArticle(art.title, brand);
  });

  // Intégration des articles de la base embarquée (toujours fiables, pas de filtre)
  var allArticles = [].concat(qualifiedArticles);
  if (KNOWN_BREACHES[norm] && KNOWN_BREACHES[norm].articles) {
    var knownArts = KNOWN_BREACHES[norm].articles;
    for (var i = 0; i < knownArts.length; i++) {
      if (!allArticles.some(function(a) { return a.title === knownArts[i].title; })) {
        allArticles.push(knownArts[i]);
      }
    }
  }

  // hasBreach = brèches vérifiées OU articles qualifiés (brand + mot-clé sécurité dans le titre)
  var verifiedCount = allBreaches.length;
  var qualifiedNewsCount = qualifiedArticles.length;
  var hasBreach = verifiedCount > 0 || qualifiedNewsCount > 0;
  var totalCount = verifiedCount + qualifiedNewsCount;

  return {
    domain: norm,
    brand: brand,
    hasBreach: hasBreach,
    count: totalCount,
    breachCount: verifiedCount,
    newsCount: allArticles.length,
    qualifiedNewsCount: qualifiedNewsCount,
    breaches: allBreaches,
    articles: allArticles,
    analyzedAt: new Date().toISOString()
  };
}

async function getDomainStatus(domain, forceRefresh) {
  if (!domain) return { breaches: [], count: 0, hasBreach: false };
  const norm = domain.toLowerCase();
  const cacheKey = `cache_${norm}`;
  const ttlMs = await getCacheTtlMs();

  if (!forceRefresh && memoryCache.has(norm)) {
    const mem = memoryCache.get(norm);
    if (Date.now() - mem.timestamp < ttlMs) {
      return Object.assign({}, mem.data, { fromCache: true });
    }
  }

  if (!forceRefresh) {
    try {
      const stored = await browser.storage.local.get(cacheKey);
      if (stored[cacheKey] && stored[cacheKey].timestamp) {
        const age = Date.now() - stored[cacheKey].timestamp;
        if (age < ttlMs) {
          const cachedData = stored[cacheKey].data;
          memoryCache.set(norm, { timestamp: stored[cacheKey].timestamp, data: cachedData });
          return Object.assign({}, cachedData, {
            fromCache: true,
            cachedAt: new Date(stored[cacheKey].timestamp).toISOString()
          });
        }
      }
    } catch (err) {
      console.warn('[BreachWatcher] Erreur lecture cache local:', err);
    }
  }

  const result = await analyzeDomain(norm);
  const now = Date.now();
  memoryCache.set(norm, { timestamp: now, data: result });
  try {
    const entry = {};
    entry[cacheKey] = { timestamp: now, data: result };
    await browser.storage.local.set(entry);
  } catch (err) {
    console.warn('[BreachWatcher] Erreur écriture cache local:', err);
  }
  return Object.assign({}, result, { fromCache: false });
}

async function updateTabBadge(tabId, breachInfo) {
  if (!tabId || tabId < 0) return;
  try {
    if (breachInfo.hasBreach && breachInfo.count > 0) {
      await browser.action.setBadgeText({
        tabId: tabId,
        text: breachInfo.count > 9 ? '9+' : String(breachInfo.count)
      });
      await browser.action.setBadgeBackgroundColor({ tabId: tabId, color: '#d32f2f' });
      await browser.action.setTitle({
        tabId: tabId,
        title: `⚠️ BreachWatcher : ${breachInfo.count} incident(s) signalé(s) pour ce site.`
      });
    } else {
      await browser.action.setBadgeText({ tabId: tabId, text: '' });
      await browser.action.setTitle({
        tabId: tabId,
        title: 'BreachWatcher : Aucun incident de sécurité récent signalé.'
      });
    }
  } catch (err) {
    console.debug('[BreachWatcher] Badge non mis à jour:', err.message);
  }
}

async function processTabNavigation(tabId, url) {
  if (!isCheckableUrl(url)) {
    await updateTabBadge(tabId, { hasBreach: false, count: 0 });
    return;
  }
  const domain = extractMainDomain(url);
  if (!domain) return;
  const breachInfo = await getDomainStatus(domain, false);
  await updateTabBadge(tabId, breachInfo);
  try {
    const entry = {};
    entry[`tab_${tabId}`] = { url, domain, breachInfo, updatedAt: Date.now() };
    await browser.storage.local.set(entry);
  } catch (err) {
    console.warn('[BreachWatcher] Erreur stockage onglet:', err);
  }
}

// ─────────────────────────────────────────────────────────────
// ÉCOUTEURS D'ÉVÉNEMENTS
// ─────────────────────────────────────────────────────────────

browser.webNavigation.onCompleted.addListener(function(details) {
  if (details.frameId === 0) {
    processTabNavigation(details.tabId, details.url);
  }
});

browser.tabs.onActivated.addListener(function(activeInfo) {
  browser.tabs.get(activeInfo.tabId).then(function(tab) {
    if (tab && tab.url) {
      processTabNavigation(tab.id, tab.url);
    }
  }).catch(function() {});
});

browser.tabs.onRemoved.addListener(function(tabId) {
  browser.storage.local.remove('tab_' + tabId).catch(function() {});
});

browser.runtime.onMessage.addListener(function(message, sender) {
  if (!message) return;

  if (message.action === 'getCurrentTabStatus') {
    return browser.tabs.query({ active: true, currentWindow: true }).then(function(tabs) {
      var tab = tabs[0];
      if (!tab || !tab.url) {
        return { success: false, reason: 'no_active_tab' };
      }
      var domain = extractMainDomain(tab.url);
      if (!domain) {
        return { success: false, reason: 'unsupported_url', url: tab.url };
      }
      var forceRefresh = Boolean(message.forceRefresh);
      return getDomainStatus(domain, forceRefresh).then(function(breachInfo) {
        if (forceRefresh) {
          return updateTabBadge(tab.id, breachInfo).then(function() {
            return { success: true, tabId: tab.id, url: tab.url, domain: domain, breachInfo: breachInfo };
          });
        }
        return { success: true, tabId: tab.id, url: tab.url, domain: domain, breachInfo: breachInfo };
      });
    }).catch(function(err) {
      return { success: false, error: err.message };
    });
  }

  if (message.action === 'clearCache') {
    memoryCache.clear();
    return browser.storage.local.get(null).then(function(all) {
      var cacheKeys = Object.keys(all).filter(function(k) { return k.startsWith('cache_'); });
      if (cacheKeys.length > 0) {
        return browser.storage.local.remove(cacheKeys).then(function() {
          return { success: true, clearedCount: cacheKeys.length };
        });
      }
      return { success: true, clearedCount: 0 };
    }).catch(function(err) {
      return { success: false, error: err.message };
    });
  }
});

console.log('[BreachWatcher] Extension initialisée avec succès.');
