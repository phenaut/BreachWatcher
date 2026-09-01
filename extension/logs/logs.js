/**
 * BreachWatcher — Journal des requêtes
 * Affiche les entrées loguées par background.js pour HIBP et FrenchBreaches.
 */

const LOG_TEXT = {
  FR: {
    loading: 'Chargement…',
    noResults: 'Aucune entrée ne correspond aux filtres sélectionnés.',
    refresh: 'Actualiser',
    export: 'Exporter CSV',
    clear: 'Vider',
    source: 'Source',
    status: 'Statut',
    domain: 'Domaine',
    all: 'Toutes',
    allStatus: 'Tous',
    entries: 'entrées',
    entry: 'entrée',
    details: 'Afficher le détail',
    breaches: 'Failles identifiées',
    error: 'Erreur',
    clearConfirm: 'Vider définitivement tout le journal des requêtes ?',
    loadError: 'Impossible de charger le journal :',
    deleteError: 'Erreur lors de la suppression :'
  },
  US: {
    loading: 'Loading…',
    noResults: 'No entries match the selected filters.',
    refresh: 'Refresh',
    export: 'Export CSV',
    clear: 'Clear',
    source: 'Source',
    status: 'Status',
    domain: 'Domain',
    all: 'All',
    allStatus: 'All',
    entries: 'entries',
    entry: 'entry',
    details: 'Show details',
    breaches: 'Identified breaches',
    error: 'Error',
    clearConfirm: 'Clear the entire request log permanently?',
    loadError: 'Unable to load the log:',
    deleteError: 'Deletion error:'
  },
  DE: {
    loading: 'Lädt…',
    noResults: 'Keine Einträge entsprechen den ausgewählten Filtern.',
    refresh: 'Aktualisieren',
    export: 'CSV exportieren',
    clear: 'Leeren',
    source: 'Quelle',
    status: 'Status',
    domain: 'Domain',
    all: 'Alle',
    allStatus: 'Alle',
    entries: 'Einträge',
    entry: 'Eintrag',
    details: 'Details anzeigen',
    breaches: 'Identifizierte Verstöße',
    error: 'Fehler',
    clearConfirm: 'Das gesamte Anforderungsprotokoll dauerhaft löschen?',
    loadError: 'Protokoll konnte nicht geladen werden:',
    deleteError: 'Fehler beim Löschen:'
  }
};

const logsList    = document.getElementById('logsList');
const logCount    = document.getElementById('logCount');
const filterSource = document.getElementById('filterSource');
const filterStatus = document.getElementById('filterStatus');
const filterDomain = document.getElementById('filterDomain');
const refreshBtn  = document.getElementById('refreshBtn');
const exportBtn   = document.getElementById('exportBtn');
const clearLogsBtn = document.getElementById('clearLogsBtn');

let allLogs = [];
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

function getText() {
  return LOG_TEXT[uiLocale] || LOG_TEXT.FR;
}

async function applyUiLocale() {
  try {
    const res = await browser.storage.sync.get({ newsCountry: detectDefaultCountryCode() });
    uiLocale = normalizeCountryCode(res.newsCountry);
    document.documentElement.lang = uiLocale === 'US' ? 'en' : uiLocale === 'DE' ? 'de' : 'fr';
    const t = getText();
    refreshBtn.textContent = `↻ ${t.refresh}`;
    exportBtn.textContent = `⇩ ${t.export}`;
    clearLogsBtn.textContent = `🗑 ${t.clear}`;
    document.querySelector('label[for="filterSource"]').textContent = t.source;
    document.querySelector('label[for="filterStatus"]').textContent = t.status;
    document.querySelector('label[for="filterDomain"]').textContent = t.domain;
    filterSource.options[0].textContent = t.all;
    filterStatus.options[0].textContent = t.allStatus;
  } catch (err) {
    console.warn('[BreachWatcher] Locale de journal non chargée:', err);
  }
}

function formatDate(isoString) {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} `
         + `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  } catch {
    return isoString;
  }
}

function sourceClass(source) {
  if (source === 'HIBP') return 'source-hibp';
  if (source === 'FrenchBreaches') return 'source-frenchbreaches';
  if (source === 'VirusTotal') return 'source-virustotal';
  return '';
}

function badgeClass(status) {
  if (status === 'ok')    return 'badge-ok';
  if (status === 'error') return 'badge-error';
  return 'badge-empty';
}

function formatDuration(ms) {
  if (ms === undefined || ms === null) return '—';
  if (ms < 1000) return `${ms} ms`;
  return `${(ms / 1000).toFixed(1)} s`;
}

function renderEmptyState(iconSymbol, messageText) {
  const container = document.createElement('div');
  container.className = 'empty-state';

  const icon = document.createElement('span');
  icon.className = 'empty-icon';
  icon.textContent = iconSymbol;

  const msg = document.createElement('p');
  msg.textContent = messageText;

  container.appendChild(icon);
  container.appendChild(msg);

  logsList.replaceChildren(container);
}

function renderLogs(logs) {
  if (logs.length === 0) {
    renderEmptyState('📋', getText().noResults);
    logCount.textContent = `0 ${getText().entries}`;
    return;
  }

  logCount.textContent = `${logs.length} ${logs.length > 1 ? getText().entries : getText().entry}`;

  const sorted = [...logs].reverse();
  const fragment = document.createDocumentFragment();

  sorted.forEach((entry, idx) => {
    const hasBreaches = Array.isArray(entry.breaches) && entry.breaches.length > 0;
    const hasError = Boolean(entry.error);
    const hasDetail = hasBreaches || hasError;

    const logEntry = document.createElement('div');
    logEntry.className = 'log-entry';
    logEntry.dataset.idx = idx;

    const logRow = document.createElement('div');
    logRow.className = 'log-row';

    if (hasDetail) {
      logRow.setAttribute('role', 'button');
      logRow.setAttribute('tabindex', '0');
      logRow.setAttribute('aria-controls', `detail-${idx}`);
    }

    const colDate = document.createElement('span');
    colDate.className = 'col-date';
    colDate.textContent = formatDate(entry.ts);

    const colDomain = document.createElement('span');
    colDomain.className = 'col-domain';
    colDomain.title = entry.domain || '';
    colDomain.textContent = entry.domain || '';

    const colSource = document.createElement('span');
    const sClass = sourceClass(entry.source);
    colSource.className = sClass ? `col-source ${sClass}` : 'col-source';
    colSource.textContent = entry.source || '';

    const colStatus = document.createElement('span');
    colStatus.className = 'col-status';
    const badge = document.createElement('span');
    badge.className = `badge ${badgeClass(entry.status)}`;
    badge.textContent = entry.status || '';
    colStatus.appendChild(badge);

    const colCount = document.createElement('span');
    colCount.className = 'col-count';
    colCount.textContent = entry.count > 0 ? entry.count : '—';

    const colDuration = document.createElement('span');
    colDuration.className = 'col-duration';
    colDuration.textContent = formatDuration(entry.durationMs);

    const colToggle = document.createElement('span');
    colToggle.className = 'col-toggle';

    let toggleBtn = null;
    if (hasDetail) {
      toggleBtn = document.createElement('button');
      toggleBtn.className = 'log-toggle';
      toggleBtn.setAttribute('aria-expanded', 'false');
      toggleBtn.setAttribute('aria-controls', `detail-${idx}`);
      toggleBtn.title = getText().details;
      toggleBtn.textContent = '▶';
      colToggle.appendChild(toggleBtn);
    }

    logRow.append(colDate, colDomain, colSource, colStatus, colCount, colDuration, colToggle);
    logEntry.appendChild(logRow);

    if (hasDetail) {
      const logDetail = document.createElement('div');
      logDetail.className = 'log-detail hidden';
      logDetail.id = `detail-${idx}`;

      if (hasBreaches) {
        const breachSection = document.createElement('div');
        breachSection.className = 'log-detail-section';

        const label = document.createElement('div');
        label.className = 'log-detail-label';
        label.textContent = getText().breaches;
        breachSection.appendChild(label);

        entry.breaches.forEach(b => {
          const item = document.createElement('div');
          item.className = 'breach-item';

          const title = document.createElement('div');
          title.className = 'breach-title';
          title.textContent = b.title || '';

          const meta = document.createElement('div');
          meta.className = 'breach-meta';
          meta.textContent = `${b.source || ''}${b.breachDate ? ' · ' + b.breachDate : ''}`;

          item.append(title, meta);
          breachSection.appendChild(item);
        });

        logDetail.appendChild(breachSection);
      }

      if (hasError) {
        const errorSection = document.createElement('div');
        errorSection.className = 'log-detail-section';

        const label = document.createElement('div');
        label.className = 'log-detail-label';
        label.textContent = getText().error;

        const errorText = document.createElement('div');
        errorText.className = 'error-text';
        errorText.textContent = entry.error;

        errorSection.append(label, errorText);
        logDetail.appendChild(errorSection);
      }

      logEntry.appendChild(logDetail);

      const toggleAction = () => {
        if (!toggleBtn) return;
        const expanded = toggleBtn.getAttribute('aria-expanded') === 'true';
        toggleBtn.setAttribute('aria-expanded', expanded ? 'false' : 'true');
        logDetail.classList.toggle('hidden', expanded);
      };

      if (toggleBtn) {
        toggleBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          toggleAction();
        });
      }

      logRow.addEventListener('click', (e) => {
        if (e.target.classList.contains('log-toggle')) return;
        toggleAction();
      });

      logRow.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggleAction();
        }
      });
    }

    fragment.appendChild(logEntry);
  });

  logsList.replaceChildren(fragment);
}

function applyFilters() {
  const srcFilter = filterSource.value;
  const stFilter  = filterStatus.value;
  const domFilter = filterDomain.value.trim().toLowerCase();

  const filtered = allLogs.filter(entry => {
    if (srcFilter && entry.source !== srcFilter) return false;
    if (stFilter  && entry.status !== stFilter)  return false;
    if (domFilter && !(entry.domain || '').toLowerCase().includes(domFilter)) return false;
    return true;
  });

  renderLogs(filtered);
}

async function loadLogs() {
  renderEmptyState('⏳', getText().loading);
  logCount.textContent = '—';

  try {
    const response = await browser.runtime.sendMessage({ action: 'getLogs' });
    if (response && response.success) {
      allLogs = response.logs || [];
      applyFilters();
    } else {
      throw new Error((response && response.error) || 'Réponse inattendue');
    }
  } catch (err) {
    renderEmptyState('⚠️', `${getText().loadError} ${err.message}`);
    logCount.textContent = 'Erreur';
  }
}

async function clearLogs() {
  if (!confirm(getText().clearConfirm)) return;
  clearLogsBtn.disabled = true;
  try {
    await browser.runtime.sendMessage({ action: 'clearLogs' });
    allLogs = [];
    renderLogs([]);
  } catch (err) {
    alert(`${getText().deleteError} ${err.message}`);
  } finally {
    clearLogsBtn.disabled = false;
  }
}

function exportCsv() {
  const srcFilter = filterSource.value;
  const stFilter  = filterStatus.value;
  const domFilter = filterDomain.value.trim().toLowerCase();

  const filtered = allLogs.filter(entry => {
    if (srcFilter && entry.source !== srcFilter) return false;
    if (stFilter  && entry.status !== stFilter)  return false;
    if (domFilter && !(entry.domain || '').toLowerCase().includes(domFilter)) return false;
    return true;
  });

  const headers = ['Date', 'Domaine', 'Source', 'Statut', 'Failles', 'Durée (ms)', 'Erreur'];
  const rows = filtered.map(e => [
    e.ts || '',
    e.domain || '',
    e.source || '',
    e.status || '',
    String(e.count || 0),
    String(e.durationMs || 0),
    e.error || ''
  ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','));

  const csv = [headers.join(','), ...rows].join('\r\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `breachwatcher-logs-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

refreshBtn.addEventListener('click', loadLogs);
clearLogsBtn.addEventListener('click', clearLogs);
exportBtn.addEventListener('click', exportCsv);
filterSource.addEventListener('change', applyFilters);
filterStatus.addEventListener('change', applyFilters);
filterDomain.addEventListener('input', applyFilters);

document.addEventListener('DOMContentLoaded', async () => {
  await applyUiLocale();
  loadLogs();
});
