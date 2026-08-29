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

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── Render ───────────────────────────────────────────────────

function renderLogs(logs) {
  if (logs.length === 0) {
    logsList.innerHTML = `
      <div class="empty-state">
        <span class="empty-icon">&#128203;</span>
        <p>Aucune entrée ne correspond aux filtres sélectionnés.</p>
      </div>`;
    logCount.textContent = '0 entrée';
    return;
  }

  logCount.textContent = `${logs.length} entrée${logs.length > 1 ? 's' : ''}`;

  // Affichage du plus récent en premier
  const sorted = [...logs].reverse();

  logsList.innerHTML = sorted.map((entry, idx) => {
    const breachesHtml = (Array.isArray(entry.breaches) && entry.breaches.length > 0)
      ? `<div class="log-detail-section">
           <div class="log-detail-label">Failles identifiées</div>
           ${entry.breaches.map(b => `
             <div class="breach-item">
               <div class="breach-title">${escapeHtml(b.title)}</div>
               <div class="breach-meta">${escapeHtml(b.source)}${b.breachDate ? ' · ' + escapeHtml(b.breachDate) : ''}</div>
             </div>`).join('')}
         </div>`
      : '';

    const errorHtml = entry.error
      ? `<div class="log-detail-section">
           <div class="log-detail-label">Erreur</div>
           <div class="error-text">${escapeHtml(entry.error)}</div>
         </div>`
      : '';

    const hasDetail = breachesHtml || errorHtml;

    return `
      <div class="log-entry" data-idx="${idx}">
        <div class="log-row" ${hasDetail ? 'role="button" tabindex="0" aria-controls="detail-' + idx + '"' : ''}>
          <span class="col-date">${escapeHtml(formatDate(entry.ts))}</span>
          <span class="col-domain" title="${escapeHtml(entry.domain)}">${escapeHtml(entry.domain)}</span>
          <span class="col-source ${sourceClass(entry.source)}">${escapeHtml(entry.source)}</span>
          <span class="col-status"><span class="badge ${badgeClass(entry.status)}">${escapeHtml(entry.status)}</span></span>
          <span class="col-count">${entry.count > 0 ? entry.count : '—'}</span>
          <span class="col-duration">${escapeHtml(formatDuration(entry.durationMs))}</span>
          <span class="col-toggle">
            ${hasDetail
              ? `<button class="log-toggle" aria-expanded="false" aria-controls="detail-${idx}" title="Afficher le détail">&#9654;</button>`
              : ''}
          </span>
        </div>
        ${hasDetail
          ? `<div class="log-detail hidden" id="detail-${idx}">${breachesHtml}${errorHtml}</div>`
          : ''}
      </div>`;
  }).join('');

  // Toggle detail panels
  logsList.querySelectorAll('.log-toggle').forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      const detailId = btn.getAttribute('aria-controls');
      const detail = document.getElementById(detailId);
      if (!detail) return;
      const expanded = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', expanded ? 'false' : 'true');
      detail.classList.toggle('hidden', expanded);
    });
  });

  // Allow clicking entire row to toggle
  logsList.querySelectorAll('.log-row[role="button"]').forEach(row => {
    row.addEventListener('click', function(e) {
      if (e.target.classList.contains('log-toggle')) return;
      const btn = row.querySelector('.log-toggle');
      if (btn) btn.click();
    });
    row.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const btn = row.querySelector('.log-toggle');
        if (btn) btn.click();
      }
    });
  });
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
  logsList.innerHTML = `
    <div class="empty-state">
      <span class="empty-icon">&#8987;</span>
      <p>Chargement&#8230;</p>
    </div>`;
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
    logsList.innerHTML = `
      <div class="empty-state">
        <span class="empty-icon">&#9888;</span>
        <p>Impossible de charger le journal : ${escapeHtml(err.message)}</p>
      </div>`;
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
