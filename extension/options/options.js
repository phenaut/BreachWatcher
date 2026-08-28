const DEFAULT_CACHE_DAYS = 7;

const cacheDaysInput = document.getElementById('cacheDays');
const saveBtn = document.getElementById('saveBtn');
const clearCacheBtn = document.getElementById('clearCacheBtn');
const statusMessage = document.getElementById('statusMessage');

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
    const data = await browser.storage.sync.get({ cacheDays: DEFAULT_CACHE_DAYS });
    cacheDaysInput.value = data.cacheDays || DEFAULT_CACHE_DAYS;
  } catch (err) {
    console.error('Erreur chargement options:', err);
  }
}

// Sauvegarder les options
async function saveOptions() {
  const days = parseInt(cacheDaysInput.value, 10) || DEFAULT_CACHE_DAYS;

  try {
    await browser.storage.sync.set({ cacheDays: days });
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
