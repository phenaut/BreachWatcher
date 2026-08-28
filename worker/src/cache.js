/**
 * Module de gestion du cache Cloudflare KV.
 * Les données d'analyse d'un domaine sont conservées pendant 7 jours.
 */

// 7 jours en secondes : 7 * 24 * 60 * 60 = 604 800 secondes
export const CACHE_TTL_SECONDS = 7 * 24 * 60 * 60;

/**
 * Récupère les données en cache KV pour un domaine donné.
 * @param {object} kvNamespace Binding KV (env.BREACH_CACHE)
 * @param {string} domain Nom de domaine normalisé
 * @returns {Promise<object|null>}
 */
export async function getCachedBreachData(kvNamespace, domain) {
  if (!kvNamespace || !domain) {
    return null;
  }

  const key = `domain:${domain.toLowerCase()}`;

  try {
    const rawData = await kvNamespace.get(key, { type: 'json' });
    if (rawData) {
      return {
        ...rawData,
        fromCache: true
      };
    }
    return null;
  } catch (error) {
    console.error(`[Cache] Erreur lors de la lecture KV pour la clé ${key}:`, error);
    return null;
  }
}

/**
 * Enregistre les données d'analyse dans le KV avec un TTL de 7 jours.
 * @param {object} kvNamespace Binding KV (env.BREACH_CACHE)
 * @param {string} domain Nom de domaine normalisé
 * @param {object} data Données retournées par l'API de presse
 * @returns {Promise<boolean>}
 */
export async function setCachedBreachData(kvNamespace, domain, data) {
  if (!kvNamespace || !domain || !data) {
    return false;
  }

  const key = `domain:${domain.toLowerCase()}`;
  const payload = {
    ...data,
    cachedAt: new Date().toISOString()
  };

  try {
    await kvNamespace.put(key, JSON.stringify(payload), {
      expirationTtl: CACHE_TTL_SECONDS
    });
    return true;
  } catch (error) {
    console.error(`[Cache] Erreur lors de l'écriture KV pour la clé ${key}:`, error);
    return false;
  }
}

