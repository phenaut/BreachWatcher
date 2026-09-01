const UI_TEXT = {
  FR: {
    loading: 'Vérification des données de sécurité...',
    safeTitle: 'Aucun incident répertorié',
    safeDesc: 'Aucun article de presse récent ou rapport de fuite de données n’a été trouvé pour ce site.',
    dangerTitle: 'Piratages signalés',
    dangerDesc: 'Des incidents ou des compromissions ont été documentés pour ce site.',
    domainLabel: 'Domaine analysé :',
    unsupportedTitle: 'Page non vérifiable',
    unsupportedDesc: 'BreachWatcher ne vérifie que les sites web standards accessibles via HTTP/HTTPS.',
    errorTitle: 'Erreur de communication',
    errorDesc: 'Impossible de récupérer les données pour cet onglet.',
    breachSection: '🛡️ Faille référencée',
    breachPlaceholder: 'Aucune fuite référencée détectée',
    vtSection: '🧪 VirusTotal',
    vtThreatLow: 'Niveau de menace : faible',
    vtThreatModerate: 'Niveau de menace : modéré',
    vtThreatHigh: 'Niveau de menace : élevé',
    newsSection: '📰 Articles de presse',
    newsPlaceholder: 'Aucun article de presse associé détecté',
    cacheLive: 'En direct',
    settings: '⚙️ Réglages',
    refreshTitle: 'Rafraîchir l’analyse',
    unknownDomain: 'Non identifiable',
    internalPage: 'Page locale / interne',
    noInfo: 'Aucune information disponible.',
    articleDefault: 'Article sans titre',
    press: 'Presse',
    malicious: 'Malicieux :',
    suspicious: 'Suspect :',
    idk: 'Identifiant non détecté',
    accountsAffected: 'comptes concernés'
  },
  US: {
    loading: 'Checking security data...',
    safeTitle: 'No incidents recorded',
    safeDesc: 'No recent press article or data breach report was found for this site.',
    dangerTitle: 'Breaches reported',
    dangerDesc: 'Incidents or compromises have been documented for this site.',
    domainLabel: 'Analyzed domain:',
    unsupportedTitle: 'Non-checkable page',
    unsupportedDesc: 'BreachWatcher only checks standard web pages accessible via HTTP/HTTPS.',
    errorTitle: 'Communication error',
    errorDesc: 'Unable to retrieve data for this tab.',
    breachSection: '🛡️ Referenced breach',
    breachPlaceholder: 'No referenced breach detected',
    vtSection: '🧪 VirusTotal',
    vtThreatLow: 'Threat level: low',
    vtThreatModerate: 'Threat level: moderate',
    vtThreatHigh: 'Threat level: high',
    newsSection: '📰 News articles',
    newsPlaceholder: 'No related news article detected',
    cacheLive: 'Live',
    settings: '⚙️ Settings',
    refreshTitle: 'Refresh analysis',
    unknownDomain: 'Unidentified',
    internalPage: 'Local / internal page',
    noInfo: 'No information available.',
    articleDefault: 'Untitled article',
    press: 'Press',
    malicious: 'Malicious:',
    suspicious: 'Suspicious:',
    idk: 'Identifier not detected',
    accountsAffected: 'affected accounts'
  },
  DE: {
    loading: 'Sicherheitsdaten werden geprüft...',
    safeTitle: 'Keine Vorfälle erfasst',
    safeDesc: 'Für diese Website wurde kein aktueller Presseartikel oder Datenleck gefunden.',
    dangerTitle: 'Gemeldete Vorfälle',
    dangerDesc: 'Für diese Website wurden Vorfälle oder Sicherheitsprobleme dokumentiert.',
    domainLabel: 'Analysierte Domain:',
    unsupportedTitle: 'Nicht prüfbare Seite',
    unsupportedDesc: 'BreachWatcher prüft nur Standard-Webseiten, die über HTTP/HTTPS erreichbar sind.',
    errorTitle: 'Kommunikationsfehler',
    errorDesc: 'Die Daten für diese Registerkarte konnten nicht abgerufen werden.',
    breachSection: '🛡️ Gemeldeter Vorfall',
    breachPlaceholder: 'Kein gemeldeter Verstoß erkannt',
    vtSection: '🧪 VirusTotal',
    vtThreatLow: 'Bedrohungsstufe: niedrig',
    vtThreatModerate: 'Bedrohungsstufe: mittel',
    vtThreatHigh: 'Bedrohungsstufe: hoch',
    newsSection: '📰 Nachrichtenartikel',
    newsPlaceholder: 'Kein zugehöriger Nachrichtenartikel erkannt',
    cacheLive: 'Live',
    settings: '⚙️ Einstellungen',
    refreshTitle: 'Analyse aktualisieren',
    unknownDomain: 'Unbekannt',
    internalPage: 'Lokale / interne Seite',
    noInfo: 'Keine Informationen verfügbar.',
    articleDefault: 'Unbenannter Artikel',
    press: 'Presse',
    malicious: 'Bösartig:',
    suspicious: 'Verdächtig:',
    idk: 'Erkennung fehlgeschlagen',
    accountsAffected: 'betroffene Konten'
  }
};

const currentDomainEl = document.getElementById('currentDomain');
const refreshBtn = document.getElementById('refreshBtn');
const optionsLink = document.getElementById('optionsLink');
const cacheNoticeEl = document.getElementById('cacheNotice');

const loadingState = document.getElementById('loadingState');
const safeState = document.getElementById('safeState');
const dangerState = document.getElementById('dangerState');
const unsupportedState = document.getElementById('unsupportedState');
const errorState = document.getElementById('errorState');

let incidentCountEl = document.getElementById('incidentCount');
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

let uiLocale = 'FR';

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
  return value === 'US' || value === 'DE' || value === 'FR' ? value : detectDefaultCountryCode();
}

function getUiText() {
  return UI_TEXT[uiLocale] || UI_TEXT.FR;
}

async function loadUiLocale() {
  try {
    const res = await browser.storage.sync.get({ newsCountry: detectDefaultCountryCode() });
    uiLocale = normalizeCountryCode(res.newsCountry);
    document.documentElement.lang = uiLocale === 'US' ? 'en' : uiLocale === 'DE' ? 'de' : 'fr';
    const domainLabel = document.querySelector('.label');
    if (domainLabel) domainLabel.textContent = getUiText().domainLabel;
    const refreshTitle = refreshBtn.getAttribute('title');
    if (refreshTitle) refreshBtn.title = getUiText().refreshTitle;
    const optionsTitle = optionsLink.textContent.trim();
    if (optionsTitle) optionsLink.textContent = getUiText().settings;
    document.querySelector('#loadingState p').textContent = getUiText().loading;
    document.querySelector('#safeState h2').textContent = getUiText().safeTitle;
    document.querySelector('#safeState .status-desc').textContent = getUiText().safeDesc;
    const dangerTitleEl = document.querySelector('#dangerState h2');
    if (dangerTitleEl) {
      dangerTitleEl.innerHTML = `${getUiText().dangerTitle} (<span id="incidentCount">0</span>)`;
      incidentCountEl = document.getElementById('incidentCount');
    }
    document.querySelector('#dangerState .status-desc').textContent = getUiText().dangerDesc;
    document.querySelector('#unsupportedState h2').textContent = getUiText().unsupportedTitle;
    document.querySelector('#unsupportedState .status-desc').textContent = getUiText().unsupportedDesc;
    document.querySelector('#errorState h2').textContent = getUiText().errorTitle;
    document.querySelector('#errorState .status-desc').textContent = getUiText().errorDesc;
    document.querySelector('#breachesSection h3').textContent = getUiText().breachSection;
    document.querySelector('#articlesSection h3').textContent = getUiText().newsSection;
    document.querySelector('#virusTotalSection h3').textContent = getUiText().vtSection;
    document.querySelector('#breachesPlaceholder').textContent = getUiText().breachPlaceholder;
    document.querySelector('#articlesPlaceholder').textContent = getUiText().newsPlaceholder;
    const vtTitle = document.querySelector('.vt-title');
    if (vtTitle) vtTitle.textContent = uiLocale === 'US' ? 'Reputation thermometer' : uiLocale === 'DE' ? 'Reputationsthermometer' : 'Thermomètre de réputation';
  } catch (err) {
    console.warn('[BreachWatcher] Locale non chargée:', err);
  }
}

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
    const locale = uiLocale === 'US' ? 'en-US' : uiLocale === 'DE' ? 'de-DE' : 'fr-FR';
    return d.toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric' });
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
  const locale = uiLocale === 'US' ? 'en-US' : uiLocale === 'DE' ? 'de-DE' : 'fr-FR';
  return new Intl.NumberFormat(locale).format(num);
}

function renderVirusTotal(vtInfo) {
  if (!vtInfo) {
    virusTotalSection.classList.add('hidden');
    return;
  }

  const existingDetails = virusTotalSection.querySelector('.vt-categories-container');
  if (existingDetails) existingDetails.remove();

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
    vtThreatLevel.textContent = getUiText().vtThreatLow;
    vtScoreBar.style.background = 'linear-gradient(90deg, #2ecc71 0%, #2ecc71 100%)';
  } else if (score < 5) {
    vtThreatLevel.textContent = getUiText().vtThreatModerate;
    vtScoreBar.style.background = 'linear-gradient(90deg, #f39c12 0%, #f39c12 100%)';
  } else {
    vtThreatLevel.textContent = getUiText().vtThreatHigh;
    vtScoreBar.style.background = 'linear-gradient(90deg, #e74c3c 0%, #e74c3c 100%)';
  }

  if (vtInfo.summary) {
    vtSummary.textContent = vtInfo.summary;
    vtSummary.classList.remove('hidden');
  } else {
    vtSummary.classList.add('hidden');
  }

  const categoriesContainer = document.createElement('div');
  categoriesContainer.className = 'vt-categories-container';
  categoriesContainer.style.cssText = 'display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; margin-top: 12px; font-size: 0.85em;';

  const createVtCell = (label, value, bgColor, borderColor, textColor) => {
    const cell = document.createElement('div');
    cell.style.cssText = `background: ${bgColor}; border-left: 3px solid ${borderColor}; padding: 6px 8px; border-radius: 4px;`;
    const span = document.createElement('span');
    span.style.cssText = `color: ${textColor}; font-weight: bold;`;
    span.textContent = label;
    cell.appendChild(span);
    cell.appendChild(document.createTextNode(' ' + String(value)));
    return cell;
  };

  categoriesContainer.appendChild(createVtCell(getUiText().malicious, malicious, 'rgba(231, 76, 60, 0.1)', '#e74c3c', '#e74c3c'));
  categoriesContainer.appendChild(createVtCell(getUiText().suspicious, suspicious, 'rgba(243, 156, 18, 0.1)', '#f39c12', '#f39c12'));

  virusTotalSection.appendChild(categoriesContainer);
  virusTotalSection.classList.remove('hidden');
}

function renderStatus(breachInfo, domain) {
  hideAllStates();
  currentDomainEl.textContent = domain || getUiText().unknownDomain;

  if (!breachInfo) {
    errorMessageEl.textContent = getUiText().noInfo;
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
    cacheNoticeEl.textContent = `Cache: ${cachedDate.toLocaleTimeString(uiLocale === 'US' ? 'en-US' : uiLocale === 'DE' ? 'de-DE' : 'fr-FR')}`;
  } else {
    cacheNoticeEl.textContent = getUiText().cacheLive;
  }

  const breaches = breachInfo.breaches || [];
  const articles = breachInfo.articles || [];
  const vtInfo = breachInfo.virusTotal || { enabled: false, keyMissing: true };
  const vtScore = (vtInfo && vtInfo.enabled && !vtInfo.keyMissing) ? (vtInfo.score || 0) : 0;
  const hasIncident = (breaches.length > 0) || breachInfo.hasBreach || (vtScore > 0);
  const totalCount = breachInfo.count || (breaches.length + (breachInfo.qualifiedNewsCount || 0));

  if (hasIncident) {
    incidentCountEl.textContent = String(totalCount);
    dangerState.classList.remove('hidden');
    safeState.classList.add('hidden');
  } else {
    safeState.classList.remove('hidden');
    dangerState.classList.add('hidden');
  }

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
        countP.textContent = `👥 ~${formatNumber(breach.pwnCount)} ${getUiText().accountsAffected}`;
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

  renderVirusTotal(vtInfo);

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
      link.textContent = article.title || getUiText().articleDefault;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      titleDiv.appendChild(link);

      const metaDiv = document.createElement('div');
      metaDiv.className = 'article-meta';

      const sourceSpan = document.createElement('span');
      sourceSpan.className = 'article-source';
      sourceSpan.textContent = article.source || getUiText().press;

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
        currentDomainEl.textContent = getUiText().internalPage;
        unsupportedState.classList.remove('hidden');
      } else {
        errorMessageEl.textContent = response?.error || getUiText().errorDesc;
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

document.addEventListener('DOMContentLoaded', async () => {
  await loadUiLocale();
  loadCurrentTab(false);
});
