import { getCachedBreachData, setCachedBreachData } from './cache.js';
import { fetchBreachNews } from './news-client.js';

/**
 * En-têtes CORS par défaut autorisant l'extension Firefox et les requêtes locales.
 */
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  'Access-Control-Max-Age': '86400'
};

/**
 * Fabrique une réponse JSON avec les en-têtes CORS.
 * @param {object} body
 * @param {number} status
 * @returns {Response}
 */
function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...corsHeaders
    }
  });
}

/**
 * Valide et assainit le nom de domaine.
 * @param {string} rawDomain
 * @returns {string|null}
 */
function sanitizeDomain(rawDomain) {
  if (!rawDomain || typeof rawDomain !== 'string') return null;

  let domain = rawDomain.trim().toLowerCase();
  // Suppression du protocole éventuel
  domain = domain.replace(/^[a-zA-Z]+:\/\//, '');
  // Suppression du chemin ou des query params
  domain = domain.split('/')[0].split('?')[0].split('#')[0];
  // Suppression du port
  domain = domain.split(':')[0];
  // Suppression de www.
  if (domain.startsWith('www.')) {
    domain = domain.slice(4);
  }

  // Validation basique de la forme du nom de domaine
  const domainRegex = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$/;
  if (!domainRegex.test(domain)) {
    return null;
  }

  return domain;
}

export default {
  /**
   * Point d'entrée principal pour les requêtes HTTP adressées au Worker.
   * @param {Request} request
   * @param {object} env Bindings et variables d'environnement
   * @param {object} ctx Contexte d'exécution
   * @returns {Promise<Response>}
   */
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // 1. Gestion des requêtes préliminaires CORS (Preflight)
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders
      });
    }

    // Uniquement les requêtes GET sont supportées
    if (request.method !== 'GET') {
      return jsonResponse({ error: 'Méthode non autorisée. Utilisez GET.' }, 405);
    }

    // 2. Route de vérification de santé (/health)
    if (url.pathname === '/health' || url.pathname === '/') {
      return jsonResponse({
        status: 'OK',
        service: 'BreachWatcher Proxy',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      });
    }

    // 3. Route de vérification de domaine (/api/check?domain=... ou /check?domain=...)
    if (url.pathname === '/api/check' || url.pathname === '/check') {
      const rawDomain = url.searchParams.get('domain');
      const domain = sanitizeDomain(rawDomain);

      if (!domain) {
        return jsonResponse({
          error: 'Paramètre "domain" manquant ou invalide.',
          example: '/api/check?domain=github.com'
        }, 400);
      }

      const forceRefresh = url.searchParams.get('refresh') === 'true' || url.searchParams.get('refresh') === '1';

      try {
        // A. Consultation du cache KV (7 jours)
        // On ignore le cache si un rafraîchissement est demandé ou si le cache est au format antérieur (sans le champ 'breaches')
        if (!forceRefresh) {
          const cachedData = await getCachedBreachData(env.BREACH_CACHE, domain);
          if (cachedData && Array.isArray(cachedData.breaches)) {
            return jsonResponse({
              ...cachedData,
              source: 'kv_cache'
            });
          }
        }

        // B. Interrogation de l'API de presse/brèche si non présent en cache
        const freshData = await fetchBreachNews(domain, env);

        // C. Enregistrement en arrière-plan dans le cache KV (TTL 7j)
        if (ctx && ctx.waitUntil) {
          ctx.waitUntil(setCachedBreachData(env.BREACH_CACHE, domain, freshData));
        } else {
          await setCachedBreachData(env.BREACH_CACHE, domain, freshData);
        }

        return jsonResponse({
          ...freshData,
          source: 'upstream_api'
        });
      } catch (error) {
        console.error(`[Worker] Erreur de traitement pour ${domain}:`, error);
        return jsonResponse({
          error: 'Erreur lors de la récupération des données de sécurité.',
          domain: domain,
          message: error.message
        }, 500);
      }
    }

    // Route non trouvée
    return jsonResponse({ error: 'Endpoint introuvable.' }, 404);
  }
};

