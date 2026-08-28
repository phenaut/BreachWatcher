// Références DOM
const currentDomainEl = document.getElementById('currentDomain');
const refreshBtn = document.getElementById('refreshBtn');
const optionsLink = document.getElementById('optionsLink');
const cacheNoticeEl = document.getElementById('cacheNotice');

const loadingState = document.getElementById('loadingState');
const safeState = document.getElementById('safeState');
const dangerState = document.getElementById('dangerState');
const unsupportedState = document.getElementById('unsupportedState');
const errorState = document.getElementById('errorState');

const incidentCountEl = document.getElementById('incidentCount');
const articlesListEl = document.getElementById('articlesList');
const errorMessageEl = document.getElementById('errorMessage');

/**
 * Cache tous les panneaux d'état.
 */
function hideAllStates() {
  loadingState.classList.add('hidden');
  safeState.classList.add('hidden');
  dangerState.classList.add('hidden');
  unsupportedState.classList.add('hidden');
  errorState.classList.add('hidden');
}

/**
 * Formate une date ISO en chaîne lisible.
 * @param {string} isoString
 * @returns {string}
 */
function formatDate(isoString) {
  if (!isoString) return '';
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return '';
  }
}

/**
 * Met à jour l'interface avec les données de sécurité du domaine.
 * @param {object} breachInfo
 * @param {string} domain
 */
function renderStatus(breachInfo, domain) {
  hideAllStates();
  currentDomainEl.textContent = domain || 'Non identifiable';

  if (!breachInfo) {
    errorMessageEl.textContent = 'Aucune information disponible.';
    errorState.classList.remove('hidden');
    return;
  }

  if (breachInfo.error) {
    errorMessageEl.textContent = breachInfo.error;
    errorState.classList.remove('hidden');
    return;
  }

  if (breachInfo.cachedAt) {
    const cachedDate = new Date(breachInfo.cachedAt);
    cacheNoticeEl.textContent = `Cache: ${cachedDate.toLocaleTimeString('fr-FR')}`;
  } else {
    cacheNoticeEl.textContent = 'En direct';
  }

  if (breachInfo.hasBreach && breachInfo.articles && breachInfo.articles.length > 0) {
    incidentCountEl.textContent = String(breachInfo.articles.length);
    articlesListEl.innerHTML = '';

    breachInfo.articles.forEach((article) => {
      const li = document.createElement('li');
      li.className = 'article-item';

      const titleDiv = document.createElement('div');
      titleDiv.className = 'article-title';

      const link = document.createElement('a');
      link.href = article.url || '#';
      link.textContent = article.title || 'Article sans titre';
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      titleDiv.appendChild(link);

      const metaDiv = document.createElement('div');
      metaDiv.className = 'article-meta';

      const sourceSpan = document.createElement('span');
      sourceSpan.className = 'article-source';
      sourceSpan.textContent = article.source || 'Presse';

      const dateSpan = document.createElement('span');
      dateSpan.className = 'article-date';
      dateSpan.textContent = formatDate(article.publishedAt);

      metaDiv.appendChild(sourceSpan);
      metaDiv.appendChild(dateSpan);

      li.appendChild(titleDiv);
      li.appendChild(metaDiv);
      articlesListEl.appendChild(li);
    });

    dangerState.classList.remove('hidden');
  } else {
    safeState.classList.remove('hidden');
  }
}

/**
 * Charge l'état de l'onglet actif.
 */
async function loadCurrentTab() {
  hideAllStates();
  loadingState.classList.remove('hidden');

  try {
    const response = await browser.runtime.sendMessage({ action: 'getCurrentTabStatus' });

    if (!response || !response.success) {
      hideAllStates();
      if (response && response.reason === 'unsupported_url') {
        currentDomainEl.textContent = 'Page locale / interne';
        unsupportedState.classList.remove('hidden');
      } else {
        errorMessageEl.textContent = response?.error || 'Onglet inactif ou non pris en charge.';
        errorState.classList.remove('hidden');
      }
      return;
    }

    renderStatus(response.breachInfo, response.domain);
  } catch (error) {
    hideAllStates();
    errorMessageEl.textContent = `Erreur: ${error.message}`;
    errorState.classList.remove('hidden');
  }
}

// Événements
refreshBtn.addEventListener('click', () => {
  loadCurrentTab();
});

optionsLink.addEventListener('click', (e) => {
  e.preventDefault();
  if (browser.runtime.openOptionsPage) {
    browser.runtime.openOptionsPage();
  } else {
    window.open(browser.runtime.getURL('options/options.html'));
  }
});

// Initialisation au chargement du DOM
document.addEventListener('DOMContentLoaded', loadCurrentTab);

