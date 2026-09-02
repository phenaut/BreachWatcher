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
    about: "À propos de l'extension",
    version: 'Version',
    author: 'Auteur',
    project: 'Projet',
    cacheDesc: 'Pour préserver la fluidité de navigation et éviter les requêtes réseau répétitives, les résultats d\'analyse sont mis en cache localement dans votre navigateur.',
    logsDesc: 'Consultez l\'historique des requêtes envoyées à Have I Been Pwned et FrenchBreaches. Les entrées sont conservées sur la même durée que le cache.',
    vtLabel: 'Clé publique VirusTotal (optionnelle) :',
    vtPlaceholder: 'Saisissez votre clé publique VT',
    vtGenerate: 'Pour la générer :',
    vtCreate: 'Créer ma clé API publique VirusTotal',
    vtDocs: 'Documentation API publique',
    vtHelper: 'Utilisée pour afficher un score de réputation VirusTotal dans la popup.',
    hudLabel: "Afficher le HUD à l'arrivée sur un domaine :",
    hudOn: 'Activé',
    hudOff: 'Désactivé',
    saveSuccess: 'Préférences enregistrées ! Cache fixé à {days} jours. Pays de référence : {country}.',
    saveError: 'Erreur lors de l\'enregistrement : {error}',
    cacheClearOk: 'Cache local vidé avec succès ({count} domaine(s) purgé(s)) !',
    cacheClearReset: 'Cache local réinitialisé.',
    cacheClearError: 'Erreur lors du vidage du cache : {error}',
    cacheCleanInProgress: 'Nettoyage...',
    logsClearOk: 'Journal vidé avec succès.',
    logsClearFail: 'Impossible de vider le journal.',
    logsClearError: 'Erreur : {error}',
    logsClearInProgress: 'Suppression…'
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
    logsDesc: 'See the history of requests sent to Have I Been Pwned and FrenchBreaches. Entries are retained for the same duration as the cache.',
    vtLabel: 'Public VirusTotal key (optional):',
    vtPlaceholder: 'Enter your public VT key',
    vtGenerate: 'To generate it:',
    vtCreate: 'Create my public VirusTotal API key',
    vtDocs: 'Public API documentation',
    vtHelper: 'Used to display a VirusTotal reputation score in the popup.',
    hudLabel: 'Show the HUD when arriving on a domain:',
    hudOn: 'Enabled',
    hudOff: 'Disabled',
    saveSuccess: 'Preferences saved! Cache set to {days} days. Reference country: {country}.',
    saveError: 'Error while saving: {error}',
    cacheClearOk: 'Local cache cleared successfully ({count} domain(s) purged)!',
    cacheClearReset: 'Local cache reset.',
    cacheClearError: 'Error while clearing cache: {error}',
    cacheCleanInProgress: 'Cleaning...',
    logsClearOk: 'Log cleared successfully.',
    logsClearFail: 'Unable to clear the log.',
    logsClearError: 'Error: {error}',
    logsClearInProgress: 'Clearing…'
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
    logsDesc: 'Sehen Sie den Verlauf der an Have I Been Pwned und FrenchBreaches gesendeten Anfragen. Einträge werden für dieselbe Dauer wie der Cache aufbewahrt.',
    vtLabel: 'Öffentlicher VirusTotal-Schlüssel (optional):',
    vtPlaceholder: 'Geben Sie Ihren öffentlichen VT-Schlüssel ein',
    vtGenerate: 'Zum Erzeugen:',
    vtCreate: 'Meinen öffentlichen VirusTotal-API-Schlüssel erstellen',
    vtDocs: 'Öffentliche API-Dokumentation',
    vtHelper: 'Wird verwendet, um in der Popup einen VirusTotal-Reputationswert anzuzeigen.',
    hudLabel: 'HUD beim Aufrufen einer Domain anzeigen:',
    hudOn: 'Aktiviert',
    hudOff: 'Deaktiviert',
    saveSuccess: 'Einstellungen gespeichert! Cache auf {days} Tage gesetzt. Referenzland: {country}.',
    saveError: 'Fehler beim Speichern: {error}',
    cacheClearOk: 'Lokaler Cache erfolgreich gelöscht ({count} Domain(en) entfernt)!',
    cacheClearReset: 'Lokaler Cache zurückgesetzt.',
    cacheClearError: 'Fehler beim Leeren des Caches: {error}',
    cacheCleanInProgress: 'Wird geleert...',
    logsClearOk: 'Protokoll erfolgreich geleert.',
    logsClearFail: 'Protokoll konnte nicht geleert werden.',
    logsClearError: 'Fehler: {error}',
    logsClearInProgress: 'Wird gelöscht…'
  }
};

const cacheDaysInput = document.getElementById('cacheDays');
const virustotalApiKeyInput = document.getElementById('virustotalApiKey');
const newsCountrySelect = document.getElementById('newsCountry');
const hudEnabledInput = document.getElementById('hudEnabled');
const hudEnabledStatus = document.getElementById('hudEnabledStatus');
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
  if (cacheLabel) {
    cacheLabel.textContent = optionLocale === 'US'
      ? 'Cache validity period (days):'
      : optionLocale === 'DE'
        ? 'Gültigkeitsdauer des Caches (in Tagen):'
        : 'Durée de validité du cache (en jours) :';
  }

  const hintNodes = document.querySelectorAll('.hint');
  if (hintNodes[0]) hintNodes[0].textContent = text.cacheHint;
  if (hintNodes[1]) hintNodes[1].textContent = text.vtGenerate;
  if (hintNodes[2]) hintNodes[2].textContent = text.vtHelper;
  if (hintNodes[3]) hintNodes[3].textContent = optionLocale === 'US'
    ? 'Detected automatically according to your browser if you do not change it.'
    : optionLocale === 'DE'
      ? 'Wird automatisch gemäß Ihrem Browser erkannt, wenn Sie es nicht ändern.'
      : 'Détecté automatiquement selon votre navigateur si vous ne le changez pas.';

  const vtLabel = document.querySelector('label[for="virustotalApiKey"]');
  if (vtLabel) vtLabel.textContent = text.vtLabel;

  const vtInput = document.getElementById('virustotalApiKey');
  if (vtInput) vtInput.placeholder = text.vtPlaceholder;

  const vtLinks = document.querySelectorAll('.vt-help a');
  if (vtLinks[0]) vtLinks[0].textContent = text.vtCreate;
  if (vtLinks[1]) vtLinks[1].textContent = text.vtDocs;

  const newsLabel = document.querySelector('label[for="newsCountry"]');
  if (newsLabel) newsLabel.textContent = text.newsTitle;

  const hudLabel = document.getElementById('hudEnabledLabel');
  if (hudLabel) hudLabel.textContent = text.hudLabel;
  if (hudEnabledStatus) hudEnabledStatus.textContent = hudEnabledInput.checked ? text.hudOn : text.hudOff;

  const clearCacheText = document.getElementById('clearCacheBtn');
  if (clearCacheText) clearCacheText.textContent = text.clearCache;

  const saveText = document.getElementById('saveBtn');
  if (saveText) saveText.textContent = text.save;

  const openLogsText = document.getElementById('openLogsBtn');
  if (openLogsText) openLogsText.textContent = text.openLogs;

  const clearLogsText = document.getElementById('clearLogsBtn');
  if (clearLogsText) clearLogsText.textContent = text.clearLogs;

  const detailsDt = document.querySelectorAll('.extension-details div dt');
  if (detailsDt[0]) detailsDt[0].textContent = text.version;
  if (detailsDt[1]) detailsDt[1].textContent = text.author;
  if (detailsDt[2]) detailsDt[2].textContent = text.project;
}

function t(key, params = {}) {
  const text = OPTION_TEXT[optionLocale]?.[key] || OPTION_TEXT.FR[key] || '';
  return Object.entries(params).reduce((acc, [k, v]) => acc.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v)), text);
}

function maskApiKey(value) {
  if (!value) return '';
  return '•'.repeat(Math.max(value.length, 8));
}

function showMessage(text, type = 'success') {
  statusMessage.textContent = text;
  statusMessage.className = `status-msg ${type}`;
  statusMessage.classList.remove('hidden');

  setTimeout(() => {
    statusMessage.classList.add('hidden');
  }, 4000);
}

function showLogsMessage(text, type = 'success') {
  logsStatusMessage.textContent = text;
  logsStatusMessage.className = `status-msg ${type}`;
  logsStatusMessage.classList.remove('hidden');
  setTimeout(() => {
    logsStatusMessage.classList.add('hidden');
  }, 4000);
}

async function loadOptions() {
  try {
    const data = await browser.storage.sync.get({
      cacheDays: DEFAULT_CACHE_DAYS,
      virustotalApiKey: '',
      newsCountry: detectDefaultCountryCode(),
      hudEnabled: true
    });
    const storedKey = (data.virustotalApiKey || '').trim();
    const newsCountry = normalizeCountryCode(data.newsCountry);
    cacheDaysInput.value = data.cacheDays || DEFAULT_CACHE_DAYS;
    newsCountrySelect.value = newsCountry;
    hudEnabledInput.checked = data.hudEnabled !== false;
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

async function saveOptions() {
  const days = parseInt(cacheDaysInput.value, 10) || DEFAULT_CACHE_DAYS;
  const currentValue = (virustotalApiKeyInput.value || '').trim();
  const realValue = (virustotalApiKeyInput.dataset.realValue || '').trim();
  const virustotalApiKey = currentValue && currentValue !== maskApiKey(realValue)
    ? currentValue
    : (realValue || '');
  const newsCountry = normalizeCountryCode(newsCountrySelect.value || detectDefaultCountryCode());
  const hudEnabled = hudEnabledInput.checked;

  try {
    await browser.storage.sync.set({ cacheDays: days, virustotalApiKey, newsCountry, hudEnabled });
    applyOptionsLocale(newsCountry);
    virustotalApiKeyInput.dataset.realValue = virustotalApiKey;
    virustotalApiKeyInput.value = virustotalApiKey ? maskApiKey(virustotalApiKey) : '';
    try {
      await browser.runtime.sendMessage({ action: 'clearCache' });
    } catch (err) {
      console.warn('Impossible de vider le cache après mise à jour VT:', err);
    }
    showMessage(t('saveSuccess', { days, country: newsCountry }), 'success');
  } catch (err) {
    showMessage(t('saveError', { error: err.message }), 'error');
  }
}

async function clearCache() {
  clearCacheBtn.disabled = true;
  clearCacheBtn.textContent = t('cacheCleanInProgress');

  try {
    const response = await browser.runtime.sendMessage({ action: 'clearCache' });
    if (response && response.success) {
      showMessage(t('cacheClearOk', { count: response.clearedCount || 0 }), 'success');
    } else {
      showMessage(t('cacheClearReset'), 'success');
    }
  } catch (err) {
    showMessage(t('cacheClearError', { error: err.message }), 'error');
  } finally {
    clearCacheBtn.disabled = false;
    clearCacheBtn.textContent = t('clearCache');
  }
}

function openLogs() {
  const url = browser.runtime.getURL('logs/logs.html');
  browser.tabs.create({ url });
}

async function clearLogs() {
  clearLogsBtn.disabled = true;
  clearLogsBtn.textContent = t('logsClearInProgress');
  try {
    const response = await browser.runtime.sendMessage({ action: 'clearLogs' });
    if (response && response.success) {
      showLogsMessage(t('logsClearOk'), 'success');
    } else {
      showLogsMessage(t('logsClearFail'), 'error');
    }
  } catch (err) {
    showLogsMessage(t('logsClearError', { error: err.message }), 'error');
  } finally {
    clearLogsBtn.disabled = false;
    clearLogsBtn.textContent = t('clearLogs');
  }
}

extensionVersion.textContent = browser.runtime.getManifest().version;

saveBtn.addEventListener('click', saveOptions);
hudEnabledInput.addEventListener('change', () => {
  const text = getOptionText();
  hudEnabledStatus.textContent = hudEnabledInput.checked ? text.hudOn : text.hudOff;
});
clearCacheBtn.addEventListener('click', clearCache);
openLogsBtn.addEventListener('click', openLogs);
clearLogsBtn.addEventListener('click', clearLogs);
document.addEventListener('DOMContentLoaded', loadOptions);
