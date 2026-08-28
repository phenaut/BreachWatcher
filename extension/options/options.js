const DEFAULT_PROXY_URL = 'http://127.0.0.1:8787';

const proxyUrlInput = document.getElementById('proxyUrl');
const saveBtn = document.getElementById('saveBtn');
const testBtn = document.getElementById('testBtn');
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
    const data = await browser.storage.sync.get({ proxyUrl: DEFAULT_PROXY_URL });
    proxyUrlInput.value = data.proxyUrl || DEFAULT_PROXY_URL;
  } catch (err) {
    console.error('Erreur chargement options:', err);
  }
}

// Sauvegarder les options
async function saveOptions() {
  let url = proxyUrlInput.value.trim();
  if (!url) {
    url = DEFAULT_PROXY_URL;
    proxyUrlInput.value = url;
  }

  // Nettoyage du slash final
  url = url.replace(/\/+$/, '');

  try {
    await browser.storage.sync.set({ proxyUrl: url });
    showMessage('Paramètres enregistrés avec succès !', 'success');
  } catch (err) {
    showMessage(`Erreur lors de l'enregistrement : ${err.message}`, 'error');
  }
}

// Tester la connexion au proxy
async function testConnection() {
  const url = (proxyUrlInput.value.trim() || DEFAULT_PROXY_URL).replace(/\/+$/, '');
  testBtn.disabled = true;
  testBtn.textContent = 'Test en cours...';

  try {
    const response = await fetch(`${url}/health`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });

    if (response.ok) {
      const data = await response.json();
      showMessage(`Connexion réussie ! (Statut Worker : ${data.status || 'OK'})`, 'success');
    } else {
      showMessage(`Le serveur a répondu avec le code : ${response.status}`, 'error');
    }
  } catch (err) {
    showMessage(`Impossible de joindre le proxy (${url}) : ${err.message}`, 'error');
  } finally {
    testBtn.disabled = false;
    testBtn.textContent = 'Tester la connexion';
  }
}

saveBtn.addEventListener('click', saveOptions);
testBtn.addEventListener('click', testConnection);
document.addEventListener('DOMContentLoaded', loadOptions);

