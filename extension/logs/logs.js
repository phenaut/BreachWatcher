/**
 * BreachWatcher — Journal des requêtes
 * Affiche les entrées loguées par background.js pour HIBP et FrenchBreaches.
 */

const logsList    = document.getElementById('logsList');
const logCount    = document.getElementById('logCount');
const filterSource = document.getElementById('filterSource');
const filterStatus = document.getElementById('filterStatus');
const filterDomain = document.getElementById('filterDomain');
const refreshBtn  = document.getElementById('refreshBtn');
const exportBtn   = document.getElementById('exportBtn');
const clearLogsBtn = document.getElementById('clearLogsBtn');

let allLogs = [];

// ── Helpers ──────────────────────────────────────────────────

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

// ── Render ───────────────────────────────────────────────────

function renderLogs(logs) {
  if (logs.length === 0) {
    renderEmptyState('📋', 'Aucune entrée ne correspond aux filtres sélectionnés.');
    logCount.textContent = '0 entrée';
    return;
  }

  logCount.textContent = `${logs.length} entrée${logs.length > 1 ? 's' : ''}`;

  // Affichage du plus récent en premier
  const sorted = [...logs].reverse();
  const fragment = document.createDocumentFragment();

  sorted.forEach((entry, idx) => {
    const hasBreaches = Array.isArray(entry.breaches) && entry.breaches.length > 0;
    const hasError = Boolean(entry.error);
    const hasDetail = hasBreaches || hasError;

    // Conteneur principal
    const logEntry = document.createElement('div');
    logEntry.className = 'log-entry';
    logEntry.dataset.idx = idx;

    // Ligne principale
    const logRow = document.createElement('div');
    logRow.className = 'log-row';

    if (hasDetail) {
      logRow.setAttribute('role', 'button');
      logRow.setAttribute('tabindex', '0');
      logRow.setAttribute('aria-controls', `detail-${idx}`);
    }

    // Colonnes
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
      toggleBtn.title = 'Afficher le détail';
      toggleBtn.textContent = '▶';
      colToggle.appendChild(toggleBtn);
    }

    logRow.append(colDate, colDomain, colSource, colStatus, colCount, colDuration, colToggle);
    logEntry.appendChild(logRow);

    // Section Détail
    if (hasDetail) {
      const logDetail = document.createElement('div');
      logDetail.className = 'log-detail hidden';
      logDetail.id = `detail-${idx}`;

      if (hasBreaches) {
        const breachSection = document.createElement('div');
        breachSection.className = 'log-detail-section';

        const label = document.createElement('div');
        label.className = 'log-detail-label';
        label.textContent = 'Failles identifiées';
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
        label.textContent = 'Erreur';

        const errorText = document.createElement('div');
        errorText.className = 'error-text';
        errorText.textContent = entry.error;

        errorSection.append(label, errorText);
        logDetail.appendChild(errorSection);
      }

      logEntry.appendChild(logDetail);

      // Listeners pour l'ouverture/fermeture du panneau
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

// ── Load logs ────────────────────────────────────────────────

async function loadLogs() {
  renderEmptyState('⏳', 'Chargement…');
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
    renderEmptyState('⚠️', `Impossible de charger le journal : ${err.message}`);
    logCount.textContent = 'Erreur';
  }
}

// ── Clear logs ───────────────────────────────────────────────

async function clearLogs() {
  if (!confirm('Vider définitivement tout le journal des requêtes ?')) return;
  clearLogsBtn.disabled = true;
  try {
    await browser.runtime.sendMessage({ action: 'clearLogs' });
    allLogs = [];
    renderLogs([]);
  } catch (err) {
    alert('Erreur lors de la suppression : ' + err.message);
  } finally {
    clearLogsBtn.disabled = false;
  }
}

// ── Export CSV ───────────────────────────────────────────────

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

// ── Event listeners ──────────────────────────────────────────

refreshBtn.addEventListener('click', loadLogs);
clearLogsBtn.addEventListener('click', clearLogs);
exportBtn.addEventListener('click', exportCsv);

filterSource.addEventListener('change', applyFilters);
filterStatus.addEventListener('change', applyFilters);
filterDomain.addEventListener('input', applyFilters);

// ── Init ─────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', loadLogs);
