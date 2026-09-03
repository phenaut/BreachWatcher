/* ─────────────────────────────────────────────
   BreachWatcher — HUD Popup Script
   Récupère le niveau depuis l'URL, anime le ruban
   Se ferme automatiquement après 5 secondes
   ───────────────────────────────────────────── */

(function () {
  'use strict';

  // ── Icônes SVG inline par niveau ──────────────────────────────────────────
  const ICONS = {
    0: `<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 2 C8 6 6 9 8 13 C9.5 15.5 8 17 7 18.5 C9 17.5 10.5 16 10 13 C12 15 13 18 12 21 C15 19 17 15.5 15 12 C14 13.5 13 13 13.5 11 C15.5 13 16 15 15 17.5 C17.5 15 18 11 16 8 C14.5 9.5 14 9 14 7 C13 8.5 12.5 8 12 2 Z"/>
        </svg>`,
    1: `<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 2 L4 6 L4 12 C4 16.4 7.4 20.5 12 22 C16.6 20.5 20 16.4 20 12 L20 6 Z"/>
          <polyline points="9,12 11,14 15,10"/>
        </svg>`,
    2: `<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="4" y="3" width="16" height="18" rx="2"/>
          <line x1="8" y1="8" x2="16" y2="8"/>
          <line x1="8" y1="12" x2="16" y2="12"/>
          <line x1="8" y1="16" x2="13" y2="16"/>
        </svg>`,
    3: `<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 2 L4 6 L4 12 C4 16.4 7.4 20.5 12 22 C16.6 20.5 20 16.4 20 12 L20 6 Z"/>
          <line x1="12" y1="9" x2="12" y2="13"/>
          <circle cx="12" cy="16" r="0.8" fill="white"/>
        </svg>`,
    4: `<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M18 4 L6 4 L13 12 L6 20 L18 20"/>
        </svg>`,
    5: `<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="5" y1="4" x2="5" y2="13"/>
          <circle cx="5" cy="16.5" r="0.8" fill="white"/>
          <path d="M13 4 L21 4"/>
          <path d="M13 4 L18 12 L13 20"/>
          <path d="M13 20 L21 20"/>
        </svg>`
  };

  const LABELS = {
    0: 'Démarrage',
    1: 'Aucune alerte',
    2: 'Article de presse',
    3: 'Faille',
    4: 'Virus Total',
    5: 'Risque élevé'
  };

  // ── Lecture du niveau depuis les paramètres de l'URL ───────────────────────
  const params = new URLSearchParams(window.location.search);
  const level = Math.max(0, Math.min(5, parseInt(params.get('level') || '0', 10)));

  // ── Construction du ruban ─────────────────────────────────────────────────
  const ribbon = document.getElementById('bw-hud-ribbon');
  const frame  = document.getElementById('bw-hud-frame');
  const gifName = params.get('gif');
  const isGifMode = /^hud[1-5]\.gif$/.test(gifName || '');

  if (isGifMode) {
    const viewport = document.getElementById('bw-hud-viewport');
    const gif = document.createElement('img');
    gif.className = 'bw-hud-gif';
    gif.src = gifName;
    gif.alt = '';
    viewport.replaceChildren(gif);
    frame.classList.add('bw-gif-mode');
  }

  for (let i = 0; i <= 5 && !isGifMode; i++) {
    const cell = document.createElement('div');
    cell.className = 'bw-cell';
    cell.dataset.level = String(i);

    const num = document.createElement('div');
    num.className = 'bw-cell-number';
    num.textContent = String(i);

    const iconWrap = document.createElement('div');
    iconWrap.className = 'bw-cell-icon';
    const iconDocument = new DOMParser().parseFromString(ICONS[i], 'image/svg+xml');
    const icon = iconDocument.documentElement;
    if (icon && icon.tagName.toLowerCase() === 'svg') {
      iconWrap.appendChild(document.importNode(icon, true));
    }

    const label = document.createElement('div');
    label.className = 'bw-cell-label';
    label.textContent = LABELS[i];

    cell.appendChild(num);
    cell.appendChild(iconWrap);
    cell.appendChild(label);
    ribbon.appendChild(cell);
  }

  // ── Animation ─────────────────────────────────────────────────────────────
  const CELL_HEIGHT = 120;

  // Étape 1 : fade-in
  requestAnimationFrame(function () {
    frame.classList.add('bw-visible');

    // Étape 2 : scroll vers le niveau cible après 50ms
    setTimeout(function () {
      if (!isGifMode) {
        ribbon.style.transform = 'translateY(-' + (level * CELL_HEIGHT) + 'px)';
      }
    }, 50);
  });

  // Étape 3 : fade-out à 4500ms
  setTimeout(function () {
    frame.classList.remove('bw-visible');
    frame.classList.add('bw-fadeout');
  }, isGifMode ? 7000 : 4500);

  // Étape 4 : fermeture de la fenêtre à 4900ms
  setTimeout(function () {
    window.close();
  }, isGifMode ? 7400 : 4900);

}());