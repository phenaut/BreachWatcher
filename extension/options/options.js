const DEFAULT_CACHE_DAYS = 7;

const cacheDaysInput = document.getElementById('cacheDays');
const virustotalApiKeyInput = document.getElementById('virustotalApiKey');
const saveBtn = document.getElementById('saveBtn');
const clearCacheBtn = document.getElementById('clearCacheBtn');
const statusMessage = document.getElementById('statusMessage');
const extensionVersion = document.getElementById('extensionVersion');
const openLogsBtn = document.getElementById('openLogsBtn');
const clearLogsBtn = document.getElementById('clearLogsBtn');
const logsStatusMessage = document.getElementById('logsStatusMessage');

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
    const data = await browser.storage.sync.get({ cacheDays: DEFAULT_CACHE_DAYS, virustotalApiKey: '' });
    const storedKey = (data.virustotalApiKey || '').trim();
    cacheDaysInput.value = data.cacheDays || DEFAULT_CACHE_DAYS;
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

  try {
    await browser.storage.sync.set({ cacheDays: days, virustotalApiKey });
    virustotalApiKeyInput.dataset.realValue = virustotalApiKey;
    virustotalApiKeyInput.value = virustotalApiKey ? maskApiKey(virustotalApiKey) : '';
    try {
      await browser.runtime.sendMessage({ action: 'clearCache' });
    } catch (err) {
      console.warn('Impossible de vider le cache après mise à jour VT:', err);
    }
    showMessage(`Préférences enregistrées ! Cache fixé à ${days} jours.`, 'success');
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
