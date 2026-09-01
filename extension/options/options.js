const DEFAULT_CACHE_DAYS = 7;
const NEWS_COUNTRY_OPTIONS = {
  FR: { label: 'Français (FR)', lang: 'fr', country: 'FR', ceid: 'FR:fr' },
  US: { label: 'English (US)', lang: 'en', country: 'US', ceid: 'US:en' },
  DE: { label: 'Deutsch (DE)', lang: 'de', country: 'DE', ceid: 'DE:de' }
};

const OPTION_TEXT = {
  FR: {
    title: 'Paramètres de BreachWatcher',
    cacheTitle: 'Gestion du Cache Local',
    cacheHint: 'Par défaut : 7 jours',
    newsTitle: 'Langue / pays des actualités Google News :',
    save: 'Enregistrer',
    clearCache: 'Vider le cache local',
    logsTitle: 'Journal des requêtes',
    openLogs: 'Ouvrir le journal',
    clearLogs: 'Vider le journal',
    about: 'À propos de l\'extension',
    version: 'Version',
    author: 'Auteur',
    project: 'Projet',
    cacheDesc: 'Pour préserver la fluidité de navigation et éviter les requêtes réseau répétitives, les résultats d\'analyse sont mis en cache localement dans votre navigateur.',
    logsDesc: 'Consultez l\'historique des requêtes envoyées à Have I Been Pwned et FrenchBreaches. Les entrées sont conservées sur la même durée que le cache.'
  },
  US: {
    title: 'BreachWatcher settings',
    cacheTitle: 'Local cache management',
    cacheHint: 'Default: 7 days',
    newsTitle: 'Google News language / country:',
    save: 'Save',
    clearCache: 'Clear local cache',
    logsTitle: 'Request log',
    openLogs: 'Open log',
    clearLogs: 'Clear log',
    about: 'About the extension',
    version: 'Version',
    author: 'Author',
    project: 'Project',
    cacheDesc: 'To keep navigation fluid and avoid repeated network requests, analysis results are cached locally in your browser.',
    logsDesc: 'See the history of requests sent to Have I Been Pwned and FrenchBreaches. Entries are retained for the same duration as the cache.'
  },
  DE: {
    title: 'BreachWatcher-Einstellungen',
    cacheTitle: 'Lokale Cache-Verwaltung',
    cacheHint: 'Standard: 7 Tage',
    newsTitle: 'Sprache / Land der Google News:',
    save: 'Speichern',
    clearCache: 'Lokalen Cache leeren',
    logsTitle: 'Anfrageprotokoll',
    openLogs: 'Protokoll öffnen',
    clearLogs: 'Protokoll leeren',
    about: 'Über die Erweiterung',
    version: 'Version',
    author: 'Autor',
    project: 'Projekt',
    cacheDesc: 'Damit die Navigation flüssig bleibt und wiederholte Netzwerkanfragen vermieden werden, werden Analyseergebnisse lokal im Browser zwischengespeichert.',
    logsDesc: 'Sehen Sie den Verlauf der an Have I Been Pwned und FrenchBreaches gesendeten Anfragen. Einträge werden für dieselbe Dauer wie der Cache aufbewahrt.'
  }
};

const cacheDaysInput = document.getElementById('cacheDays');
const virustotalApiKeyInput = document.getElementById('virustotalApiKey');
const newsCountrySelect = document.getElementById('newsCountry');
const saveBtn = document.getElementById('saveBtn');
const clearCacheBtn = document.getElementById('clearCacheBtn');
const statusMessage = document.getElementById('statusMessage');
const extensionVersion = document.getElementById('extensionVersion');
const openLogsBtn = document.getElementById('openLogsBtn');
const clearLogsBtn = document.getElementById('clearLogsBtn');
const logsStatusMessage = document.getElementById('logsStatusMessage');

let optionLocale = 'FR';

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

function getOptionText() {
  return OPTION_TEXT[optionLocale] || OPTION_TEXT.FR;
}

function applyOptionsLocale(localeCode) {
  optionLocale = normalizeCountryCode(localeCode);
  const text = getOptionText();
  document.documentElement.lang = optionLocale === 'US' ? 'en' : optionLocale === 'DE' ? 'de' : 'fr';

  const titleEl = document.querySelector('.header h1');
  if (titleEl) titleEl.textContent = text.title;

  const cards = document.querySelectorAll('.card h2');
  if (cards[0]) cards[0].textContent = text.cacheTitle;
  if (cards[1]) cards[1].textContent = text.logsTitle;
  if (cards[2]) cards[2].textContent = text.about;

  const descriptions = document.querySelectorAll('.description');
  if (descriptions[0]) descriptions[0].textContent = text.cacheDesc;
  if (descriptions[1]) descriptions[1].textContent = text.logsDesc;

  const cacheLabel = document.querySelector('label[for="cacheDays"]');
  if (cacheLabel) cacheLabel.textContent = optionLocale === 'US' ? 'Cache validity period (days):' : optionLocale === 'DE' ? 'Gültigkeitsdauer des Caches (in Tagen):' : 'Durée de validité du cache (en jours) :';

  const cacheHint = document.querySelectorAll('.hint');
  if (cacheHint[0]) cacheHint[0].textContent = text.cacheHint;
  if (cacheHint[1]) cacheHint[1].textContent = optionLocale === 'US' ? 'Used to display a VirusTotal reputation score in the popup.' : optionLocale === 'DE' ? 'Wird verwendet, um in der Popup einen VirusTotal-Reputationswert anzuzeigen.' : 'Utilisée pour afficher un score de réputation VirusTotal dans la popup.';
  if (cacheHint[3]) cacheHint[3].textContent = optionLocale === 'US' ? 'Detected automatically according to your browser if you do not change it.' : optionLocale === 'DE' ? 'Wird automatisch gemäß Ihrem Browser erkannt, wenn Sie es nicht ändern.' : 'Détecté automatiquement selon votre navigateur si vous ne le changez pas.';

  const vtLabel = document.querySelector('label[for="virustotalApiKey"]');
  if (vtLabel) vtLabel.textContent = optionLocale === 'US' ? 'Public VirusTotal key (optional):' : optionLocale === 'DE' ? 'Öffentlicher VirusTotal-Schlüssel (optional):' : 'Clé publique VirusTotal (optionnelle) :';

  const newsLabel = document.querySelector('label[for="newsCountry"]');
  if (newsLabel) newsLabel.textContent = text.newsTitle;

  const clearCacheText = document.getElementById('clearCacheBtn');
  if (clearCacheText) clearCacheText.textContent = text.clearCache;

  const saveText = document.getElementById('saveBtn');
  if (saveText) saveText.textContent = text.save;

  const openLogsText = document.getElementById('openLogsBtn');
  if (openLogsText) openLogsText.textContent = text.openLogs;

  const clearLogsText = document.getElementById('clearLogsBtn');
  if (clearLogsText) clearLogsText.textContent = text.clearLogs;

  const versionText = document.querySelector('.extension-details div dt');
  if (versionText) versionText.textContent = text.version;
  const authorText = document.querySelectorAll('.extension-details div dt')[1];
  const projectText = document.querySelectorAll('.extension-details div dt')[2];
  if (authorText) authorText.textContent = text.author;
  if (projectText) projectText.textContent = text.project;
}

function maskApiKey(value) {
  if (!value) return '';
  return '•'.repeat(Math.max(value.length, 8));
}

extensionVersion.textContent = browser.runtime.getManifest().version;

function showMessage(text, type = 'success') {
  statusMessage.textContent = text;
  statusMessage.className = `status-msg ${type}`;
  statusMessage.classList.remove('hidden');

  setTimeout(() => {
    statusMessage.classList.add('hidden');
  }, 4000);
}

// Charger les options sauvegardées
async function loadOptions() {
  try {
    const data = await browser.storage.sync.get({
      cacheDays: DEFAULT_CACHE_DAYS,
      virustotalApiKey: '',
      newsCountry: detectDefaultCountryCode()
    });
    const storedKey = (data.virustotalApiKey || '').trim();
    const newsCountry = normalizeCountryCode(data.newsCountry);
    cacheDaysInput.value = data.cacheDays || DEFAULT_CACHE_DAYS;
    newsCountrySelect.value = newsCountry;
    applyOptionsLocale(newsCountry);
    virustotalApiKeyInput.dataset.realValue = storedKey;
    virustotalApiKeyInput.value = storedKey ? maskApiKey(storedKey) : '';
  } catch (err) {
    console.error('Erreur chargement options:', err);
  }
}

virustotalApiKeyInput.addEventListener('focus', () => {
  const realValue = (virustotalApiKeyInput.dataset.realValue || '').trim();
  if (realValue && virustotalApiKeyInput.value === maskApiKey(realValue)) {
    virustotalApiKeyInput.value = realValue;
  }
});

virustotalApiKeyInput.addEventListener('blur', () => {
  const realValue = (virustotalApiKeyInput.value || '').trim();
  if (realValue) {
    virustotalApiKeyInput.dataset.realValue = realValue;
    virustotalApiKeyInput.value = maskApiKey(realValue);
  } else {
    virustotalApiKeyInput.dataset.realValue = '';
    virustotalApiKeyInput.value = '';
  }
});

// Sauvegarder les options
async function saveOptions() {
  const days = parseInt(cacheDaysInput.value, 10) || DEFAULT_CACHE_DAYS;
  const currentValue = (virustotalApiKeyInput.value || '').trim();
  const realValue = (virustotalApiKeyInput.dataset.realValue || '').trim();
  const virustotalApiKey = currentValue && currentValue !== maskApiKey(realValue)
    ? currentValue
    : (realValue || '');
  const newsCountry = normalizeCountryCode(newsCountrySelect.value || detectDefaultCountryCode());

  try {
    await browser.storage.sync.set({ cacheDays: days, virustotalApiKey, newsCountry });
    applyOptionsLocale(newsCountry);
    virustotalApiKeyInput.dataset.realValue = virustotalApiKey;
    virustotalApiKeyInput.value = virustotalApiKey ? maskApiKey(virustotalApiKey) : '';
    try {
      await browser.runtime.sendMessage({ action: 'clearCache' });
    } catch (err) {
      console.warn('Impossible de vider le cache après mise à jour VT:', err);
    }
    showMessage(`Préférences enregistrées ! Cache fixé à ${days} jours. Pays de référence : ${newsCountry}.`, 'success');
  } catch (err) {
    showMessage(`Erreur lors de l'enregistrement : ${err.message}`, 'error');
  }
}

// Vider le cache local
async function clearCache() {
  clearCacheBtn.disabled = true;
  clearCacheBtn.textContent = 'Nettoyage...';

  try {
    const response = await browser.runtime.sendMessage({ action: 'clearCache' });
    if (response && response.success) {
      showMessage(`Cache local vidé avec succès (${response.clearedCount} domaine(s) purgé(s)) !`, 'success');
    } else {
      showMessage('Cache local réinitialisé.', 'success');
    }
  } catch (err) {
    showMessage(`Erreur lors du vidage du cache : ${err.message}`, 'error');
  } finally {
    clearCacheBtn.disabled = false;
    clearCacheBtn.textContent = 'Vider le cache local';
  }
}

saveBtn.addEventListener('click', saveOptions);
clearCacheBtn.addEventListener('click', clearCache);
document.addEventListener('DOMContentLoaded', loadOptions);

// ── Logs ──────────────────────────────────────────────────────

function showLogsMessage(text, type = 'success') {
  logsStatusMessage.textContent = text;
  logsStatusMessage.className = `status-msg ${type}`;
  logsStatusMessage.classList.remove('hidden');
  setTimeout(() => {
    logsStatusMessage.classList.add('hidden');
  }, 4000);
}

function openLogs() {
  const url = browser.runtime.getURL('logs/logs.html');
  browser.tabs.create({ url });
}

async function clearLogs() {
  clearLogsBtn.disabled = true;
  clearLogsBtn.textContent = 'Suppression…';
  try {
    const response = await browser.runtime.sendMessage({ action: 'clearLogs' });
    if (response && response.success) {
      showLogsMessage('Journal vidé avec succès.', 'success');
    } else {
      showLogsMessage('Impossible de vider le journal.', 'error');
    }
  } catch (err) {
    showLogsMessage(`Erreur : ${err.message}`, 'error');
  } finally {
    clearLogsBtn.disabled = false;
    clearLogsBtn.textContent = 'Vider le journal';
  }
}

openLogsBtn.addEventListener('click', openLogs);
clearLogsBtn.addEventListener('click', clearLogs);
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

function applyLanguage(localeCode) {
  const code = normalizeCountryCode(localeCode);
  const lang = code === 'US' ? 'en' : code === 'DE' ? 'de' : 'fr';
  document.documentElement.lang = lang;
}

function maskApiKey(value) {
  if (!value) return '';
  return '•'.repeat(Math.max(value.length, 8));
}

extensionVersion.textContent = browser.runtime.getManifest().version;

function showMessage(text, type = 'success') {
  statusMessage.textContent = text;
  statusMessage.className = `status-msg ${type}`;
  statusMessage.classList.remove('hidden');

  setTimeout(() => {
    statusMessage.classList.add('hidden');
  }, 4000);
}

// Charger les options sauvegardées
async function loadOptions() {
  try {
    const data = await browser.storage.sync.get({
      cacheDays: DEFAULT_CACHE_DAYS,
      virustotalApiKey: '',
      newsCountry: detectDefaultCountryCode()
    });
    const storedKey = (data.virustotalApiKey || '').trim();
    const newsCountry = normalizeCountryCode(data.newsCountry);
    cacheDaysInput.value = data.cacheDays || DEFAULT_CACHE_DAYS;
    newsCountrySelect.value = newsCountry;
    applyLanguage(newsCountry);
    virustotalApiKeyInput.dataset.realValue = storedKey;
    virustotalApiKeyInput.value = storedKey ? maskApiKey(storedKey) : '';
  } catch (err) {
    console.error('Erreur chargement options:', err);
  }
}

virustotalApiKeyInput.addEventListener('focus', () => {
  const realValue = (virustotalApiKeyInput.dataset.realValue || '').trim();
  if (realValue && virustotalApiKeyInput.value === maskApiKey(realValue)) {
    virustotalApiKeyInput.value = realValue;
  }
});

virustotalApiKeyInput.addEventListener('blur', () => {
  const realValue = (virustotalApiKeyInput.value || '').trim();
  if (realValue) {
    virustotalApiKeyInput.dataset.realValue = realValue;
    virustotalApiKeyInput.value = maskApiKey(realValue);
  } else {
    virustotalApiKeyInput.dataset.realValue = '';
    virustotalApiKeyInput.value = '';
  }
});

// Sauvegarder les options
async function saveOptions() {
  const days = parseInt(cacheDaysInput.value, 10) || DEFAULT_CACHE_DAYS;
  const currentValue = (virustotalApiKeyInput.value || '').trim();
  const realValue = (virustotalApiKeyInput.dataset.realValue || '').trim();
  const virustotalApiKey = currentValue && currentValue !== maskApiKey(realValue)
    ? currentValue
    : (realValue || '');
  const newsCountry = normalizeCountryCode(newsCountrySelect.value || detectDefaultCountryCode());

  try {
    await browser.storage.sync.set({ cacheDays: days, virustotalApiKey, newsCountry });
    applyLanguage(newsCountry);
    virustotalApiKeyInput.dataset.realValue = virustotalApiKey;
    virustotalApiKeyInput.value = virustotalApiKey ? maskApiKey(virustotalApiKey) : '';
    try {
      await browser.runtime.sendMessage({ action: 'clearCache' });
    } catch (err) {
      console.warn('Impossible de vider le cache après mise à jour VT:', err);
    }
    showMessage(`Préférences enregistrées ! Cache fixé à ${days} jours. Pays de référence : ${newsCountry}.`, 'success');
  } catch (err) {
    showMessage(`Erreur lors de l'enregistrement : ${err.message}`, 'error');
  }
}

// Vider le cache local
async function clearCache() {
  clearCacheBtn.disabled = true;
  clearCacheBtn.textContent = 'Nettoyage...';

  try {
    const response = await browser.runtime.sendMessage({ action: 'clearCache' });
    if (response && response.success) {
      showMessage(`Cache local vidé avec succès (${response.clearedCount} domaine(s) purgé(s)) !`, 'success');
    } else {
      showMessage('Cache local réinitialisé.', 'success');
    }
  } catch (err) {
    showMessage(`Erreur lors du vidage du cache : ${err.message}`, 'error');
  } finally {
    clearCacheBtn.disabled = false;
    clearCacheBtn.textContent = 'Vider le cache local';
  }
}

saveBtn.addEventListener('click', saveOptions);
clearCacheBtn.addEventListener('click', clearCache);
document.addEventListener('DOMContentLoaded', loadOptions);

// ── Logs ──────────────────────────────────────────────────────

function showLogsMessage(text, type = 'success') {
  logsStatusMessage.textContent = text;
  logsStatusMessage.className = `status-msg ${type}`;
  logsStatusMessage.classList.remove('hidden');
  setTimeout(() => {
    logsStatusMessage.classList.add('hidden');
  }, 4000);
}

function openLogs() {
  const url = browser.runtime.getURL('logs/logs.html');
  browser.tabs.create({ url });
}

async function clearLogs() {
  clearLogsBtn.disabled = true;
  clearLogsBtn.textContent = 'Suppression…';
  try {
    const response = await browser.runtime.sendMessage({ action: 'clearLogs' });
    if (response && response.success) {
      showLogsMessage('Journal vidé avec succès.', 'success');
    } else {
      showLogsMessage('Impossible de vider le journal.', 'error');
    }
  } catch (err) {
    showLogsMessage(`Erreur : ${err.message}`, 'error');
  } finally {
    clearLogsBtn.disabled = false;
    clearLogsBtn.textContent = 'Vider le journal';
  }
}

openLogsBtn.addEventListener('click', openLogs);
clearLogsBtn.addEventListener('click', clearLogs);
