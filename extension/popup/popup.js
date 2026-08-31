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
const breachesPlaceholder = document.getElementById('breachesPlaceholder');
const virusTotalSection = document.getElementById('virusTotalSection');
const vtScoreBar = document.getElementById('vtScoreBar');
const vtScoreValue = document.getElementById('vtScoreValue');
const vtTotalEngines = document.getElementById('vtTotalEngines');
const vtThreatLevel = document.getElementById('vtThreatLevel');
const vtSummary = document.getElementById('vtSummary');
const articlesSection = document.getElementById('articlesSection');
const articlesListEl = document.getElementById('articlesList');
const articlesPlaceholder = document.getElementById('articlesPlaceholder');
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

function renderVirusTotal(vtInfo) {
  if (!vtInfo) {
    virusTotalSection.classList.add('hidden');
    return;
  }

  // Nettoyage préalable d'un éventuel bloc de détails déjà injecté
  const existingDetails = virusTotalSection.querySelector('.vt-categories-container');
  if (existingDetails) {
    existingDetails.remove();
  }

  if (vtInfo.keyMissing) {
    virusTotalSection.classList.add('hidden');
    return;
  }

  if (!vtInfo.enabled) {
    virusTotalSection.classList.add('hidden');
    return;
  }

  const malicious = Number(vtInfo.malicious || 0);
  const suspicious = Number(vtInfo.suspicious || 0);
  const totalEngines = Number(vtInfo.totalEngines || 0);
  const score = malicious + suspicious;
  const ratio = totalEngines > 0 ? Math.min(100, (score / totalEngines) * 100) : 0;

  vtScoreValue.textContent = String(score);
  vtTotalEngines.textContent = String(totalEngines);
  vtScoreBar.style.width = `${ratio}%`;

  if (score === 0) {
    vtThreatLevel.textContent = 'Niveau de menace : faible';
    vtScoreBar.style.background = 'linear-gradient(90deg, #2ecc71 0%, #2ecc71 100%)';
  } else if (score < 5) {
    vtThreatLevel.textContent = 'Niveau de menace : modéré';
    vtScoreBar.style.background = 'linear-gradient(90deg, #f39c12 0%, #f39c12 100%)';
  } else {
    vtThreatLevel.textContent = 'Niveau de menace : élevé';
    vtScoreBar.style.background = 'linear-gradient(90deg, #e74c3c 0%, #e74c3c 100%)';
  }

  if (vtInfo.summary) {
    vtSummary.textContent = vtInfo.summary;
    vtSummary.classList.remove('hidden');
  } else {
    vtSummary.classList.add('hidden');
  }
  // Injection du bloc d'affichage des catégories sous la barre / résumé
  const categoriesContainer = document.createElement('div');
  categoriesContainer.className = 'vt-categories-container';
  categoriesContainer.style.cssText = 'display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; margin-top: 12px; font-size: 0.85em;';
  categoriesContainer.innerHTML = `
    <div style="background: rgba(231, 76, 60, 0.1); border-left: 3px solid #e74c3c; padding: 6px 8px; border-radius: 4px;">
      <span style="color: #e74c3c; font-weight: bold;">Malicieux :</span> ${malicious}
    </div>
    <div style="background: rgba(243, 156, 18, 0.1); border-left: 3px solid #f39c12; padding: 6px 8px; border-radius: 4px;">
      <span style="color: #f39c12; font-weight: bold;">Suspect :</span> ${suspicious}
    </div>
  `;

  virusTotalSection.appendChild(categoriesContainer);
  virusTotalSection.classList.remove('hidden');
}

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
  const vtInfo = breachInfo.virusTotal || { enabled: false, keyMissing: true };
  const vtScore = (vtInfo && vtInfo.enabled && !vtInfo.keyMissing) ? (vtInfo.score || 0) : 0;
  const hasIncident = (breaches.length > 0) || breachInfo.hasBreach || (vtScore > 0);
  const totalCount = breachInfo.count || (breaches.length + (breachInfo.qualifiedNewsCount || 0));

  // 1. Afficher l'état global (safe ou danger)
  if (hasIncident) {
    incidentCountEl.textContent = String(totalCount);
    dangerState.classList.remove('hidden');
    safeState.classList.add('hidden');
  } else {
    safeState.classList.remove('hidden');
    dangerState.classList.add('hidden');
  }

  // 2. BLOC 1 : Faille référencée
  breachesSection.classList.remove('hidden');
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
    breachesListEl.classList.remove('hidden');
    breachesPlaceholder.classList.add('hidden');
  } else {
    breachesListEl.classList.add('hidden');
    breachesPlaceholder.classList.remove('hidden');
  }

  // 3. BLOC 2 : VirusTotal
  renderVirusTotal(vtInfo);

  // 4. BLOC 3 : Articles de presse
  articlesSection.classList.remove('hidden');
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
    articlesListEl.classList.remove('hidden');
    articlesPlaceholder.classList.add('hidden');
  } else {
    articlesListEl.classList.add('hidden');
    articlesPlaceholder.classList.remove('hidden');
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
