/**
 * Fonctions utilitaires de manipulation et de normalisation des domaines web.
 */

// Liste des suffixes publics courants pour une extraction robuste sans bibliothèque lourde
const MULTI_PART_TLDS = new Set([
  'co.uk', 'gov.uk', 'ac.uk', 'org.uk',
  'com.au', 'net.au', 'org.au', 'edu.au',
  'co.nz', 'org.nz',
  'co.jp', 'ne.jp',
  'com.br', 'org.br',
  'gc.ca'
]);

/**
 * Vérifie si une URL est admissible pour une vérification de brèche.
 * Exclut les pages internes Firefox, fichiers locaux, etc.
 * @param {string} urlString
 * @returns {boolean}
 */
export function isCheckableUrl(urlString) {
  if (!urlString || typeof urlString !== 'string') return false;

  try {
    const parsed = new URL(urlString);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return false;
    }

    const hostname = parsed.hostname.toLowerCase();
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '0.0.0.0' ||
      hostname.endsWith('.local') ||
      hostname.endsWith('.internal')
    ) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Extrait le nom de domaine principal (ex: sub.example.com -> example.com).
 * @param {string} urlString
 * @returns {string|null}
 */
export function extractMainDomain(urlString) {
  if (!isCheckableUrl(urlString)) return null;

  try {
    const parsed = new URL(urlString);
    let hostname = parsed.hostname.toLowerCase();

    // Suppression du www. initial éventuel
    if (hostname.startsWith('www.')) {
      hostname = hostname.slice(4);
    }

    const parts = hostname.split('.');
    if (parts.length <= 2) {
      return hostname;
    }

    // Gestion des TLD composés (ex: google.co.uk)
    const lastTwo = parts.slice(-2).join('.');
    if (MULTI_PART_TLDS.has(lastTwo)) {
      if (parts.length >= 3) {
        return parts.slice(-3).join('.');
      }
      return hostname;
    }

    // Cas standard (ex: sub.domain.com -> domain.com)
    return parts.slice(-2).join('.');
  } catch {
    return null;
  }
}

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
