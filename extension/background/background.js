/**
 * BreachWatcher - Extension multi-navigateurs (Firefox, Chrome, Edge)
 * Fichier unique (service worker / background script)
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
  'darty.com': {
    title: 'Incident de sécurité signalé sur Darty',
    breachDate: '2025-01-01',
    pwnCount: 0,
    source: 'Signalement / surveillance de sécurité',
    dataClasses: ['Données clients', 'Historique d\'achats', 'Comptes utilisateurs'],
    summary: "Le domaine Darty a été signalé comme touché par un incident de sécurité; il est conservé dans la base locale pour éviter un faux négatif.",
    articles: []
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

function decodeHtmlEntities(str) {
  if (!str) return '';
  let prev;
  let decoded = str;
  for (let i = 0; i < 3; i++) {
    prev = decoded;
    decoded = decoded
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&#039;/g, "'")
      .replace(/&#39;/g, "'")
      .replace(/&039;/g, "'")
      .replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec))
      .replace(/&#x([0-9a-f]+);/gi, (match, hex) => String.fromCharCode(parseInt(hex, 16)));
    if (decoded === prev) break;
  }
  return decoded;
}

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

async function fetchPublicCyberNews(domain, brand, localeSettings) {
  if (!domain && !brand) return [];

  const locale = localeSettings || await getNewsLocaleSettings();
  const queryVariants = [
    `${brand || domain} pirat`,
    `${brand || domain} fuite de données`,
    `${brand || domain} sécurité données`,
    `${brand || domain} cyberattaque`,
    `${brand || domain} clients données`,
    `${brand || domain} data breach`,
    `${brand || domain} cyber`,
    `${brand || domain} faille`,
    `${brand || domain}`
  ];

  for (let i = 0; i < queryVariants.length; i++) {
    const query = encodeURIComponent(queryVariants[i]);
    const rssUrl = `https://news.google.com/rss/search?q=${query}&hl=${locale.lang}&gl=${locale.country}&ceid=${locale.ceid}`;

    try {
      const response = await fetch(rssUrl, {
        signal: AbortSignal.timeout ? AbortSignal.timeout(3000) : undefined,
        headers: { 'Accept': 'application/rss+xml, application/xml, text/xml; q=0.9, */*; q=0.8' }
      });
      if (!response.ok) continue;

      const xmlText = await response.text();
      const articles = [];
      const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
      let match;
      let count = 0;

      while ((match = itemRegex.exec(xmlText)) !== null && count < 10) {
        const itemContent = match[1];
        const titleMatch = /<title>([\s\S]*?)<\/title>/i.exec(itemContent);
        const linkMatch = /<link>([\s\S]*?)<\/link>/i.exec(itemContent);
        const pubDateMatch = /<pubDate>([\s\S]*?)<\/pubDate>/i.exec(itemContent);
        const sourceMatch = /<source[^>]*>([\s\S]*?)<\/source>/i.exec(itemContent);

        if (titleMatch) {
          const rawTitle = decodeHtmlEntities(titleMatch[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').trim());
          const url = linkMatch ? linkMatch[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').trim() : '#';
          const pubDate = pubDateMatch ? pubDateMatch[1].trim() : new Date().toISOString();
          const explicitSource = sourceMatch ? decodeHtmlEntities(sourceMatch[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').trim()) : '';
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

      if (articles.length > 0) {
        return articles;
      }
    } catch (error) {
      console.debug(`[NewsParser] Flux RSS inaccessible pour ${domain} (${queryVariants[i]}):`, error.message);
    }
  }

  return [];
}

// ─────────────────────────────────────────────────────────────
// MODULE : Logging des requêtes
// ─────────────────────────────────────────────────────────────

const BW_LOGS_KEY = 'bw_logs';
const BW_LOGS_MAX = 500;

/**
 * Ajoute une entrée de log dans browser.storage.local.
 * Purge automatiquement les entrées expirées avant l'écriture.
 * @param {{ source: string, domain: string, status: string, count: number, breaches: Array, durationMs: number, error?: string }} entry
 */
async function appendLog(entry) {
  try {
    const ttlMs = await getCacheTtlMs();
    const stored = await browser.storage.local.get(BW_LOGS_KEY);
    let logs = Array.isArray(stored[BW_LOGS_KEY]) ? stored[BW_LOGS_KEY] : [];

    // Purger les entrées expirées
    const cutoff = Date.now() - ttlMs;
    logs = logs.filter(function(l) { return l.ts && new Date(l.ts).getTime() > cutoff; });

    // Ajouter la nouvelle entrée
    logs.push(Object.assign({ ts: new Date().toISOString() }, entry));

    // Limiter à BW_LOGS_MAX entrées (FIFO)
    if (logs.length > BW_LOGS_MAX) {
      logs = logs.slice(logs.length - BW_LOGS_MAX);
    }

    const payload = {};
    payload[BW_LOGS_KEY] = logs;
    await browser.storage.local.set(payload);
  } catch (err) {
    console.debug('[BreachWatcher] Erreur écriture log:', err);
  }
}

// ─────────────────────────────────────────────────────────────
// LOGIQUE PRINCIPALE : Cache + Analyse + Badge
// ─────────────────────────────────────────────────────────────

const DEFAULT_CACHE_DAYS = 7;
const NEWS_COUNTRY_OPTIONS = {
  FR: { label: 'Français (FR)', lang: 'fr', country: 'FR', ceid: 'FR:fr' },
  US: { label: 'English (US)', lang: 'en', country: 'US', ceid: 'US:en' },
  DE: { label: 'Deutsch (DE)', lang: 'de', country: 'DE', ceid: 'DE:de' }
};
const memoryCache = new Map();
const seenDomains = new Set();

function detectDefaultCountryCode() {
  try {
    const nav = (navigator && navigator.language) ? navigator.language.toLowerCase() : '';
    if (nav.startsWith('fr')) return 'FR';
    if (nav.startsWith('de')) return 'DE';
    if (nav.startsWith('en')) return 'US';
  } catch (err) {
    console.debug('[BreachWatcher] Impossible de détecter la langue du navigateur:', err);
  }
  return 'FR';
}

function normalizeCountryCode(code) {
  const value = String(code || '').trim().toUpperCase();
  return NEWS_COUNTRY_OPTIONS[value] ? value : detectDefaultCountryCode();
}

async function getNewsLocaleSettings() {
  try {
    const res = await browser.storage.sync.get({ newsCountry: detectDefaultCountryCode() });
    const normalized = normalizeCountryCode(res.newsCountry);
    return NEWS_COUNTRY_OPTIONS[normalized] || NEWS_COUNTRY_OPTIONS.FR;
  } catch (err) {
    return NEWS_COUNTRY_OPTIONS[detectDefaultCountryCode()] || NEWS_COUNTRY_OPTIONS.FR;
  }
}

async function getCacheTtlMs() {
  try {
    const res = await browser.storage.sync.get({ cacheDays: DEFAULT_CACHE_DAYS });
    const days = parseInt(res.cacheDays, 10) || DEFAULT_CACHE_DAYS;
    return days * 24 * 60 * 60 * 1000;
  } catch {
    return DEFAULT_CACHE_DAYS * 24 * 60 * 60 * 1000;
  }
}

async function getVirusTotalApiKey() {
  try {
    const res = await browser.storage.sync.get({ virustotalApiKey: '' });
    const key = (res.virustotalApiKey || '').trim();
    return key;
  } catch {
    return '';
  }
}

async function fetchVirusTotalDomain(domain, apiKey) {
  if (!domain) return null;
  const t0 = Date.now();

  if (!apiKey) {
    appendLog({
      source: 'VirusTotal',
      domain,
      status: 'error',
      count: 0,
      breaches: [],
      durationMs: 0,
      error: 'Clé API manquante dans les paramètres.'
    });
    return {
      enabled: false,
      keyMissing: true,
      summary: 'Ajoutez votre clé publique VirusTotal dans les paramètres pour activer cette analyse.',
      categories: []
    };
  }

  try {
    const url = `https://www.virustotal.com/api/v3/domains/${encodeURIComponent(domain)}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-apikey': apiKey,
        'Accept': 'application/json'
      },
      signal: AbortSignal.timeout ? AbortSignal.timeout(4000) : undefined
    });

    if (!response.ok) {
      const errorMsg = response.status === 401 || response.status === 403
        ? 'Clé API invalide ou accès refusé.'
        : `HTTP ${response.status} (Quota dépassé ou erreur API).`;
      appendLog({
        source: 'VirusTotal',
        domain,
        status: 'error',
        count: 0,
        breaches: [],
        durationMs: Date.now() - t0,
        error: errorMsg
      });
      return {
        enabled: true,
        available: false,
        summary: 'La clé VirusTotal est invalide ou le quota est dépassé.',
        categories: []
      };
    }

    const payload = await response.json();
    const attrs = payload && payload.data && payload.data.attributes ? payload.data.attributes : {};
    const stats = attrs.last_analysis_stats || {};
    const malicious = Number(stats.malicious || 0);
    const suspicious = Number(stats.suspicious || 0);
    const totalEngines = Object.values(stats).reduce((total, value) => total + Number(value || 0), 0);
    const score = malicious + suspicious;

    // Récupération et dédoublonnage des catégories fournies par VirusTotal
    const rawCategories = attrs.categories || {};
    const categories = Array.from(new Set(Object.values(rawCategories).filter(Boolean)));

    const breaches = [];
    if (score > 0) {
      breaches.push({
        title: `${score} moteur(s) de détection considèrent ce domaine comme malveillant/suspect (sur ${totalEngines}).`,
        source: 'VirusTotal'
      });
    }

    appendLog({
      source: 'VirusTotal',
      domain,
      status: 'ok',
      count: score,
      breaches: breaches,
      durationMs: Date.now() - t0
    });

    return {
      enabled: true,
      available: true,
      malicious,
      suspicious,
      totalEngines,
      categories,
      summary: ''
    };
  } catch (error) {
    appendLog({
      source: 'VirusTotal',
      domain,
      status: 'error',
      count: 0,
      breaches: [],
      durationMs: Date.now() - t0,
      error: error.message
    });
    return {
      enabled: true,
      available: false,
      summary: 'VirusTotal indisponible actuellement.',
      categories: []
    };
  }
}

async function fetchHIBPBreaches(domain) {
  const t0 = Date.now();
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
      appendLog({ source: 'HIBP', domain, status: 'empty', count: 0, breaches: [], durationMs: Date.now() - t0 });
      return [];
    }
    if (!response.ok) {
      appendLog({ source: 'HIBP', domain, status: 'error', count: 0, breaches: [], durationMs: Date.now() - t0, error: `HTTP ${response.status}` });
      return [];
    }
    const data = await response.json();
    if (!Array.isArray(data)) {
      appendLog({ source: 'HIBP', domain, status: 'empty', count: 0, breaches: [], durationMs: Date.now() - t0 });
      return [];
    }
    const breaches = data.map((b) => {
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
    appendLog({
      source: 'HIBP',
      domain,
      status: breaches.length > 0 ? 'ok' : 'empty',
      count: breaches.length,
      breaches: breaches.map(function(b) { return { title: b.title, breachDate: b.breachDate, source: b.source }; }),
      durationMs: Date.now() - t0
    });
    return breaches;
  } catch (err) {
    appendLog({ source: 'HIBP', domain, status: 'error', count: 0, breaches: [], durationMs: Date.now() - t0, error: err.message });
    return [];
  }
}

async function fetchFrenchBreaches(domain) {
  if (!domain) return [];

  const t0 = Date.now();
  const domainLower = String(domain).toLowerCase();
  const brand = extractBrandName(domainLower);

  try {
    const response = await fetch('https://frenchbreaches.com/feed.xml', {
      signal: AbortSignal.timeout ? AbortSignal.timeout(5000) : undefined,
      headers: {
        'Accept': 'application/rss+xml, application/xml, text/xml; q=0.9, */*; q=0.8'
      }
    });

    if (!response.ok) {
      appendLog({ source: 'FrenchBreaches', domain, status: 'error', count: 0, breaches: [], durationMs: Date.now() - t0, error: `HTTP ${response.status}` });
      return [];
    }

    const xmlText = await response.text();
    const itemRegex = /<(?:item|entry)[\s>]([\s\S]*?)<\/(?:item|entry)>/gi;
    const breaches = [];
    let match;

    while ((match = itemRegex.exec(xmlText)) !== null) {
      const itemContent = match[1];
      
      const titleMatch = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(itemContent);
      
      let linkText = '';
      const linkMatchTag = /<link[^>]*>([\s\S]*?)<\/link>/i.exec(itemContent);
      if (linkMatchTag && linkMatchTag[1].trim()) {
        linkText = linkMatchTag[1];
      } else {
        const linkMatchAttr = /<link[^>]*href=["']([^"']+)["']/i.exec(itemContent);
        if (linkMatchAttr) linkText = linkMatchAttr[1];
      }
      
      const descMatch = /<description[^>]*>([\s\S]*?)<\/description>/i.exec(itemContent);
      const contentMatch = /<content:encoded>([\s\S]*?)<\/content:encoded>/i.exec(itemContent);

      const rawTitle = titleMatch ? decodeHtmlEntities(titleMatch[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').trim()) : '';
      const rawDesc = descMatch ? decodeHtmlEntities(descMatch[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').replace(/<[^>]+>/g, ' ').trim()) : '';
      const rawContent = contentMatch ? decodeHtmlEntities(contentMatch[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').replace(/<[^>]+>/g, ' ').trim()) : '';
      
      const normalizedTitle = rawTitle.toLowerCase();
      const normalizedLink = linkText.toLowerCase();
      const normalizedDesc = rawDesc.toLowerCase();
      const normalizedContent = rawContent.toLowerCase();

      const matchesDomain = normalizedTitle === domainLower
        || normalizedTitle.includes(domainLower)
        || (brand && normalizedTitle === brand)
        || (brand && normalizedTitle.includes(brand))
        || normalizedLink.includes(domainLower)
        || (brand && normalizedLink.includes(brand))
        || normalizedDesc.includes(domainLower)
        || normalizedContent.includes(domainLower)
        || (brand && normalizedDesc.includes(brand))
        || (brand && normalizedContent.includes(brand));

      if (!matchesDomain) continue;

      const pubDateMatch = /<pubDate>([\s\S]*?)<\/pubDate>/i.exec(itemContent);
      const updatedMatch = /<updated>([\s\S]*?)<\/updated>/i.exec(itemContent);
      const dateStr = pubDateMatch ? pubDateMatch[1].trim() : (updatedMatch ? updatedMatch[1].trim() : new Date().toISOString());

      let dataClasses = [];
      const categoryRegex = /<category[^>]*>([\s\S]*?)<\/category>/gi;
      let catMatch;
      while ((catMatch = categoryRegex.exec(itemContent)) !== null) {
        const rawCat = catMatch[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').trim();
        if (rawCat) {
          rawCat.split(',').forEach(c => {
            const trimmed = decodeHtmlEntities(c.trim());
            if (trimmed) dataClasses.push(trimmed);
          });
        }
      }

      const cleanSummary = (rawDesc || rawContent || 'Source de fuite répertoriée dans le flux FrenchBreaches.')
        .replace(/#{1,6}\s?/g, '')
        .replace(/\*{1,2}/g, '')
        .replace(/_{1,2}/g, '')
        .trim();

      let finalTitle = rawTitle || 'Incident de sécurité détecté';
      if (finalTitle.length < 10 && cleanSummary.includes(':')) {
        finalTitle = cleanSummary.split(':')[0].trim();
      }

      breaches.push({
        title: finalTitle,
        breachDate: dateStr,
        pwnCount: 0,
        source: 'FrenchBreaches',
        dataClasses: dataClasses,
        summary: cleanSummary,
        isVerified: true
      });
    }

    const result = breaches.slice(0, 10);
    appendLog({
      source: 'FrenchBreaches',
      domain,
      status: result.length > 0 ? 'ok' : 'empty',
      count: result.length,
      breaches: result.map(function(b) { return { title: b.title, breachDate: b.breachDate, source: b.source }; }),
      durationMs: Date.now() - t0
    });
    return result;
  } catch (err) {
    console.debug('[BreachWatcher] Erreur FrenchBreaches:', err);
    appendLog({ source: 'FrenchBreaches', domain, status: 'error', count: 0, breaches: [], durationMs: Date.now() - t0, error: err.message });
    return [];
  }
}

// Mots-clés de sécurité qui doivent apparaître dans le titre d'un article RSS
// pour qu'il soit considéré comme un signal d'incident réel
var SECURITY_KEYWORDS = [
  'cyberattaque', 'fuite de donnees', 'fuite de données', 'piratage', 'cyberattack', 'data breach', 'hack',
  'attaque', 'hacker', 'vol de donnees', 'vol de données', 'breach', 'données', 'donnees', 'clients', 'fraude', 'security',
  'cyber', 'identite', 'identité', 'cyberattaque chez', 'donnees clients', 'données clients'
];

/**
 * Vérifie si un titre d'article contient le brand ET au moins un mot-clé sécurité.
 * @param {string} title
 * @param {string} brand
 * @returns {boolean}
 */
function isRelevantSecurityArticle(title, brand) {
  if (!title || !brand) return false;
  var normalize = function(str) {
    return (str || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  };
  var tNorm = normalize(title);
  var brandNorm = normalize(brand);

  var brandMatches = tNorm.includes(brandNorm)
    || tNorm.includes(normalize(brand.replace(/\.fr$/i, '')))
    || tNorm.includes(normalize((brand + '.fr')));

  if (!brandMatches) return false;

  for (var i = 0; i < SECURITY_KEYWORDS.length; i++) {
    if (tNorm.includes(normalize(SECURITY_KEYWORDS[i]))) return true;
  }

  return tNorm.includes('cyber') || tNorm.includes('attaque') || tNorm.includes('pirat') || tNorm.includes('hack');
}

async function analyzeDomain(domain) {
  var norm = domain.toLowerCase();
  var brand = extractBrandName(norm);
  var localeSettings = await getNewsLocaleSettings();

  // Étape 1 : Brèches vérifiées (HIBP + FrenchBreaches + base embarquée) — en parallèle avec le RSS
  var hibpPromise = fetchHIBPBreaches(norm);
  var frenchBreachesPromise = fetchFrenchBreaches(norm);
  var vtApiKey = await getVirusTotalApiKey();
  var vtPromise = fetchVirusTotalDomain(norm, vtApiKey);

  // Étape 2 : Google News — toujours interrogé si brand suffisamment distinctif (≥ 4 chars)
  var newsPromise = (brand && brand.length >= 4)
    ? fetchPublicCyberNews(norm, brand, localeSettings)
    : Promise.resolve([]);

  var hibpBreaches = await hibpPromise;
  var frenchBreaches = await frenchBreachesPromise;
  var virusTotal = await vtPromise;
  var allBreaches = [].concat(hibpBreaches, frenchBreaches);

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
    virusTotal: virusTotal,
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

function getToolbarBadgeState(breachInfo) {
  if (!breachInfo) {
    return {
      text: '…',
      color: '#3498db',
      title: 'BreachWatcher : Analyse en cours...',
      icon: 'icons/icon-16.png'
    };
  }

  const breachCount = Number(breachInfo.count || 0);
  const hasReferencedBreach = Boolean(breachInfo.hasBreach && breachCount > 0);
  const vtInfo = breachInfo.virusTotal || null;
  const vtTotal = Number((vtInfo && vtInfo.totalEngines) || 0);
  const vtScore = Number((vtInfo && (vtInfo.score !== undefined ? vtInfo.score : ((Number(vtInfo.malicious || 0) + Number(vtInfo.suspicious || 0))))) || 0);
  const vtRatio = vtTotal > 0 ? (vtScore / vtTotal) * 100 : 0;

  if (hasReferencedBreach) {
    return {
      text: breachCount > 9 ? '9+' : String(breachCount),
      color: '#e74c3c',
      title: `⚠️ BreachWatcher : ${breachCount} incident(s) signalé(s) pour ce site.`,
      icon: 'icons/icon-warning-16.png'
    };
  }

  if (vtInfo && vtInfo.enabled && vtRatio > 3) {
    return {
      text: 'VT',
      color: '#e74c3c',
      title: `⚠️ BreachWatcher : VirusTotal détecte ${vtRatio.toFixed(1)}% de signalements pour ce domaine.`,
      icon: 'icons/icon-warning-16.png'
    };
  }

  if (vtInfo && vtInfo.enabled && vtRatio > 0) {
    return {
      text: '!',
      color: '#f39c12',
      title: `⚠️ BreachWatcher : analyse de réputation partiellement préoccupante pour ce domaine.`,
      icon: 'icons/icon-warning-16.png'
    };
  }

  if (!hasReferencedBreach && (!vtInfo || !vtInfo.enabled || vtRatio === 0)) {
    return {
      text: '✓',
      color: '#2ecc71',
      title: 'BreachWatcher : Aucun incident de sécurité récent signalé.',
      icon: 'icons/icon-16.png'
    };
  }

  return {
    text: '!',
    color: '#f39c12',
    title: 'BreachWatcher : niveau de risque modéré, vérification à surveiller.',
    icon: 'icons/icon-warning-16.png'
  };
}

async function updateTabBadge(tabId, breachInfo) {
  if (!tabId || tabId < 0) return;
  try {
    const state = getToolbarBadgeState(breachInfo);
    await browser.action.setBadgeText({ tabId: tabId, text: state.text });
    await browser.action.setBadgeBackgroundColor({ tabId: tabId, color: state.color });
    await browser.action.setIcon({
      tabId: tabId,
      path: {
        16: state.icon,
        32: state.icon,
        48: state.icon
      }
    });
    await browser.action.setTitle({
      tabId: tabId,
      title: state.title
    });
  } catch (err) {
    console.debug('[BreachWatcher] Badge non mis à jour:', err.message);
  }
}

function computeHudLevel(breachInfo) {
  if (!breachInfo) return 0;
  const hasBreach = Number(breachInfo.breachCount || 0) > 0;
  const hasNews   = Number(breachInfo.qualifiedNewsCount || 0) > 0;
  const vt        = breachInfo.virusTotal || null;
  const hasVT     = vt && vt.enabled && !vt.keyMissing
                    && (Number(vt.malicious || 0) + Number(vt.suspicious || 0)) > 0;

  if ((hasBreach && hasVT) || (hasNews && hasVT)) return 5;
  if (hasVT)     return 4;
  if (hasBreach) return 3;
  if (hasNews)   return 2;
  return 1;
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

  // ── HUD : afficher uniquement sur un nouveau domaine (par session) ──
  if (!seenDomains.has(domain)) {
    seenDomains.add(domain);
    const level = computeHudLevel(breachInfo);
    browser.scripting.executeScript({
      target: { tabId: tabId },
      files: ['content/hud-iframe.js']
    }).then(function () {
      setTimeout(function () {
        browser.tabs.sendMessage(tabId, {
          action: 'showHUD',
          level: level,
          domain: domain
        }).catch(function (err) {
          console.debug('[BreachWatcher] HUD sendMessage échoué:', err.message);
        });
      }, 100);
    }).catch(function (err) {
      console.debug('[BreachWatcher] HUD executeScript échoué:', err.message);
    });
  }

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
      // onActivated : on met à jour le badge SANS toucher à seenDomains
      // pour ne pas bloquer le HUD sur une vraie navigation onCompleted
      var domain = extractMainDomain(tab.url);
      if (domain) {
        getDomainStatus(domain, false).then(function(breachInfo) {
          updateTabBadge(tab.id, breachInfo);
        }).catch(function() {});
      } else {
        updateTabBadge(tab.id, { hasBreach: false, count: 0 });
      }
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

  if (message.action === 'getLogs') {
    return browser.storage.local.get(BW_LOGS_KEY).then(function(stored) {
      var logs = Array.isArray(stored[BW_LOGS_KEY]) ? stored[BW_LOGS_KEY] : [];
      return { success: true, logs: logs };
    }).catch(function(err) {
      return { success: false, error: err.message };
    });
  }

  if (message.action === 'clearLogs') {
    return browser.storage.local.remove(BW_LOGS_KEY).then(function() {
      return { success: true };
    }).catch(function(err) {
      return { success: false, error: err.message };
    });
  }
});

console.log('[BreachWatcher] Extension initialisée avec succès.');
