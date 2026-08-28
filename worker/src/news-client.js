/**
 * Client d'interrogation combinant :
 * 1. Base de données des brèches historiques (Have I Been Pwned - API publique)
 * 2. API de presse récente (NewsAPI, GNews, ou personnalisée)
 * 3. Base locale de référence (sauvegarde / mode démo)
 */

/**
 * Base de référence locale pour les cas de compromissions historiques connus
 * (sert de cache direct / secours hors-ligne).
 */
const KNOWN_HISTORICAL_BREACHES = {
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
 * Extrait le nom de la marque ou entreprise depuis le domaine (ex: cdiscount.com -> cdiscount)
 * @param {string} domain
 * @returns {string}
 */
export function extractBrandName(domain) {
  if (!domain) return '';
  const clean = domain.replace(/^www\./, '');
  return clean.split('.')[0];
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
      signal: AbortSignal.timeout ? AbortSignal.timeout(2500) : undefined,
      headers: {
        'User-Agent': 'BreachWatcher-Firefox-Extension/1.0',
        'Accept': 'application/json'
      }
    });

    if (response.status === 404) {
      return []; // Aucune brèche recensée
    }

    if (!response.ok) {
      console.warn(`[HIBP] Réponse status ${response.status} pour le domaine ${domain}`);
      return [];
    }

    const data = await response.json();
    if (!Array.isArray(data)) return [];

    return data.map((b) => {
      // Nettoyage des balises HTML éventuelles dans la description
      const cleanDesc = (b.Description || '').replace(/<[^>]*>?/gm, '');
      return {
        title: b.Title || b.Name,
        breachDate: b.BreachDate,
        pwnCount: b.PwnCount || 0,
        source: 'Have I Been Pwned (Vérifié)',
        dataClasses: b.DataClasses || [],
        summary: cleanDesc,
        isVerified: b.IsVerified ?? true
      };
    });
  } catch (error) {
    console.warn(`[HIBP] Requête HIBP ignorée pour ${domain} (${error.name || error.message})`);
    return [];
  }
}

/**
 * Interroge l'API de presse récente (NewsAPI, GNews ou générique) avec recherche combinée.
 * @param {string} domain
 * @param {object} env
 * @returns {Promise<Array>}
 */
async function fetchRecentNews(domain, env) {
  const apiKey = env.NEWS_API_KEY;
  if (!apiKey || apiKey === 'votre_cle_api_secrete_ici') {
    return [];
  }

  const brand = extractBrandName(domain);
  const provider = (env.NEWS_PROVIDER || 'generic').toLowerCase();
  const baseUrl = env.NEWS_API_BASE_URL || 'https://newsapi.org/v2';

  // Recherche sur le domaine ET sur le nom de marque avec mots-clés de cyberattaques
  const query = encodeURIComponent(`("${domain}" OR "${brand}") AND (hack OR breach OR "fuite de données" OR piratage OR cyberattaque)`);

  try {
    let url;
    if (provider === 'gnews') {
      url = `https://gnews.io/api/v4/search?q=${query}&max=5&token=${apiKey}`;
    } else {
      url = `${baseUrl}/everything?q=${query}&sortBy=relevancy&pageSize=5&apiKey=${apiKey}`;
    }

    const response = await fetch(url, {
      signal: AbortSignal.timeout ? AbortSignal.timeout(2500) : undefined,
      headers: { 'User-Agent': 'BreachWatcher-Worker/1.0' }
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    const rawArticles = data.articles || data.results || [];

    return rawArticles.map((art) => ({
      title: art.title || art.name,
      source: art.source?.name || art.publisher || 'Presse',
      url: art.url || art.link,
      publishedAt: art.publishedAt || art.pubDate || new Date().toISOString(),
      summary: art.description || art.snippet || ''
    }));
  } catch (err) {
    console.warn(`[NewsClient] Erreur presse pour ${domain}:`, err.message);
    return [];
  }
}

/**
 * Point d'entrée principal pour agréger l'ensemble des informations de brèches et d'actualités.
 * @param {string} domain
 * @param {object} env
 * @returns {Promise<object>}
 */
export async function fetchBreachNews(domain, env) {
  const normalizedDomain = domain.toLowerCase();

  // 1. Récupération parallèle : HIBP + Actualités récentes
  const [hibpBreaches, recentArticles] = await Promise.all([
    fetchHIBPBreaches(normalizedDomain),
    fetchRecentNews(normalizedDomain, env)
  ]);

  const allBreaches = [...hibpBreaches];
  const allArticles = [...recentArticles];

  // 2. Vérification dans la base historique locale si HIBP n'a rien retourné (ex: Cdiscount, Free, etc.)
  if (KNOWN_HISTORICAL_BREACHES[normalizedDomain]) {
    const known = KNOWN_HISTORICAL_BREACHES[normalizedDomain];
    const alreadyPresent = allBreaches.some(
      (b) => (b.breachDate && b.breachDate.slice(0, 4) === known.breachDate.slice(0, 4))
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

  const totalIncidents = allBreaches.length + allArticles.length;
  const hasBreach = totalIncidents > 0;

  return {
    domain: normalizedDomain,
    brand: extractBrandName(normalizedDomain),
    hasBreach: hasBreach,
    count: totalIncidents,
    breachCount: allBreaches.length,
    newsCount: allArticles.length,
    breaches: allBreaches,
    articles: allArticles,
    lastChecked: new Date().toISOString()
  };
}
