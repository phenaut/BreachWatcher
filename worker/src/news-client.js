/**
 * Client d'interrogation des API de presse et de sécurité.
 * Masque la clé d'API et normalise la réponse pour l'extension.
 */

/**
 * Recherche des articles relatifs à des piratages, fuites de données ou failles pour un domaine.
 * @param {string} domain Nom de domaine à vérifier
 * @param {object} env Variables d'environnement Cloudflare Worker
 * @returns {Promise<object>}
 */
export async function fetchBreachNews(domain, env) {
  const apiKey = env.NEWS_API_KEY;
  const provider = env.NEWS_PROVIDER || 'generic';

  // Si aucune clé d'API n'est configurée (ex: environnement local initial), on retourne une réponse par défaut sécurisée
  if (!apiKey || apiKey === 'votre_cle_api_secrete_ici') {
    console.warn(`[NewsClient] Aucune clé NEWS_API_KEY définie. Simulation pour le domaine : ${domain}`);
    return generateDemoResponse(domain);
  }

  try {
    switch (provider.toLowerCase()) {
      case 'newsapi':
        return await queryNewsApi(domain, apiKey, env);
      case 'gnews':
        return await queryGNewsApi(domain, apiKey, env);
      default:
        return await queryGenericApi(domain, apiKey, env);
    }
  } catch (error) {
    console.error(`[NewsClient] Erreur lors de l'appel API pour ${domain}:`, error);
    throw error;
  }
}

/**
 * Exemple d'implémentation pour NewsAPI.org
 */
async function queryNewsApi(domain, apiKey, env) {
  const baseUrl = env.NEWS_API_BASE_URL || 'https://newsapi.org/v2';
  // Requête ciblée sur le domaine et des mots-clés de cyberattaque / fuite
  const query = encodeURIComponent(`"${domain}" AND (hack OR breach OR "data leak" OR piratage OR cyberattaque OR "fuite de données")`);
  const url = `${baseUrl}/everything?q=${query}&sortBy=relevancy&pageSize=5&apiKey=${apiKey}`;

  const response = await fetch(url, {
    headers: { 'User-Agent': 'BreachWatcher-Worker/1.0' }
  });

  if (!response.ok) {
    throw new Error(`NewsAPI error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const articles = (data.articles || []).map((art) => ({
    title: art.title,
    source: art.source?.name || 'Presse',
    url: art.url,
    publishedAt: art.publishedAt,
    summary: art.description || ''
  }));

  return {
    domain,
    hasBreach: articles.length > 0,
    count: articles.length,
    articles,
    lastChecked: new Date().toISOString()
  };
}

/**
 * Exemple d'implémentation pour GNews.io
 */
async function queryGNewsApi(domain, apiKey, env) {
  const query = encodeURIComponent(`"${domain}" AND (hack OR breach OR leak OR piratage)`);
  const url = `https://gnews.io/api/v4/search?q=${query}&max=5&token=${apiKey}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`GNews error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const articles = (data.articles || []).map((art) => ({
    title: art.title,
    source: art.source?.name || 'Presse',
    url: art.url,
    publishedAt: art.publishedAt,
    summary: art.description || ''
  }));

  return {
    domain,
    hasBreach: articles.length > 0,
    count: articles.length,
    articles,
    lastChecked: new Date().toISOString()
  };
}

/**
 * Implémentation générique configurable
 */
async function queryGenericApi(domain, apiKey, env) {
  // Par défaut, utilisation d'un endpoint configuré dans NEWS_API_BASE_URL
  const baseUrl = env.NEWS_API_BASE_URL || 'https://newsapi.org/v2';
  const query = encodeURIComponent(`"${domain}" AND (breach OR hack OR piratage)`);
  const url = `${baseUrl}/everything?q=${query}&pageSize=5&apiKey=${apiKey}`;

  const response = await fetch(url, {
    headers: { 'User-Agent': 'BreachWatcher-Worker/1.0' }
  });

  if (!response.ok) {
    throw new Error(`Generic API error: ${response.status}`);
  }

  const data = await response.json();
  const rawArticles = data.articles || data.results || [];
  const articles = rawArticles.map((art) => ({
    title: art.title || art.name,
    source: art.source?.name || art.publisher || 'Presse',
    url: art.url || art.link,
    publishedAt: art.publishedAt || art.pubDate || new Date().toISOString(),
    summary: art.description || art.snippet || ''
  }));

  return {
    domain,
    hasBreach: articles.length > 0,
    count: articles.length,
    articles,
    lastChecked: new Date().toISOString()
  };
}

/**
 * Données fictives pour le test local lorsque aucune clé d'API réelle n'est encore configurée
 */
function generateDemoResponse(domain) {
  // Simule une alerte pour certains domaines d'exemple
  const demoBreachedDomains = ['testbreach.com', 'leakexample.org', 'vuln-site.net'];

  if (demoBreachedDomains.includes(domain.toLowerCase())) {
    return {
      domain,
      hasBreach: true,
      count: 2,
      articles: [
        {
          title: `Fuite de données massive signalée chez ${domain}`,
          source: 'CyberSecurity Daily',
          url: 'https://example.com/cyber-news-1',
          publishedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
          summary: 'Des identifiants et des adresses emails ont été découverts sur un forum spécialisé.'
        },
        {
          title: `Rapport d'incident de sécurité concernant ${domain}`,
          source: 'Le Monde Informatique',
          url: 'https://example.com/cyber-news-2',
          publishedAt: new Date(Date.now() - 86400000 * 12).toISOString(),
          summary: 'Les équipes techniques ont colmaté une vulnérabilité critique sur leurs serveurs.'
        }
      ],
      lastChecked: new Date().toISOString(),
      isDemoMode: true
    };
  }

  return {
    domain,
    hasBreach: false,
    count: 0,
    articles: [],
    lastChecked: new Date().toISOString(),
    isDemoMode: true
  };
}

