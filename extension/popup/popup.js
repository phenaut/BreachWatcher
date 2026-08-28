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
const dangerSummaryEl = document.getElementById('dangerSummary');
const breachesSection = document.getElementById('breachesSection');
const breachesListEl = document.getElementById('breachesList');
const articlesSection = document.getElementById('articlesSection');
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
 * @param {string} dateString
 * @returns {string}
 */
function formatDate(dateString) {
  if (!dateString) return '';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return dateString;
  }
}

/**
 * Formate un nombre avec séparateurs de milliers.
 * @param {number} num
 * @returns {string}
 */
function formatNumber(num) {
  if (!num) return '0';
  return new Intl.NumberFormat('fr-FR').format(num);
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

  const breaches = breachInfo.breaches || [];
  const articles = breachInfo.articles || [];
  const totalCount = breachInfo.count || (breaches.length + articles.length);

  if (breachInfo.hasBreach && totalCount > 0) {
    incidentCountEl.textContent = String(totalCount);

    // 1. Rendu des brèches historiques
    if (breaches.length > 0) {
      breachesListEl.innerHTML = '';
      breaches.forEach((breach) => {
        const li = document.createElement('li');
        li.className = 'breach-item';

        const headerDiv = document.createElement('div');
        headerDiv.className = 'item-header';

        const titleSpan = document.createElement('strong');
        titleSpan.className = 'breach-title';
        titleSpan.textContent = breach.title || 'Incident de sécurité';

        const dateBadge = document.createElement('span');
        dateBadge.className = 'date-badge';
        dateBadge.textContent = formatDate(breach.breachDate);

        headerDiv.appendChild(titleSpan);
        headerDiv.appendChild(dateBadge);
        li.appendChild(headerDiv);

        if (breach.pwnCount && breach.pwnCount > 0) {
          const countP = document.createElement('div');
          countP.className = 'pwn-count';
          countP.textContent = `👥 ~${formatNumber(breach.pwnCount)} comptes concernés`;
          li.appendChild(countP);
        }

        if (breach.summary) {
          const summaryP = document.createElement('p');
          summaryP.className = 'item-summary';
          summaryP.textContent = breach.summary;
          li.appendChild(summaryP);
        }

        if (breach.dataClasses && breach.dataClasses.length > 0) {
          const tagsDiv = document.createElement('div');
          tagsDiv.className = 'data-tags';
          breach.dataClasses.slice(0, 4).forEach((cls) => {
            const tag = document.createElement('span');
            tag.className = 'data-tag';
            tag.textContent = cls;
            tagsDiv.appendChild(tag);
          });
          li.appendChild(tagsDiv);
        }

        breachesListEl.appendChild(li);
      });
      breachesSection.classList.remove('hidden');
    } else {
      breachesSection.classList.add('hidden');
    }

    // 2. Rendu des articles de presse
    if (articles.length > 0) {
      articlesListEl.innerHTML = '';
      articles.forEach((article) => {
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
      articlesSection.classList.remove('hidden');
    } else {
      articlesSection.classList.add('hidden');
    }

    dangerState.classList.remove('hidden');
  } else {
    safeState.classList.remove('hidden');
  }
}

/**
 * Charge l'état de l'onglet actif.
 * @param {boolean} forceRefresh
 */
async function loadCurrentTab(forceRefresh = false) {
  hideAllStates();
  loadingState.classList.remove('hidden');

  try {
    const response = await browser.runtime.sendMessage({
      action: 'getCurrentTabStatus',
      forceRefresh: forceRefresh
    });

    hideAllStates();

    if (!response || !response.success) {
      if (response && response.reason === 'unsupported_url') {
        currentDomainEl.textContent = 'Page locale / interne';
        unsupportedState.classList.remove('hidden');
      } else {
        errorMessageEl.textContent = response?.error || 'Impossible de récupérer le statut de cet onglet.';
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
  loadCurrentTab(true);
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
document.addEventListener('DOMContentLoaded', () => {
  loadCurrentTab(false);
});
