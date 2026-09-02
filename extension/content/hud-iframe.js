/* ─────────────────────────────────────────────
   BreachWatcher — HUD iframe GIF
   Injecte une iframe flottante avec le GIF animé
   du niveau détecté. Durée totale : 6 secondes.
   ───────────────────────────────────────────── */

(function () {
  'use strict';

  // Guard : un seul HUD à la fois
  if (document.getElementById('bw-hud-iframe-host')) return;

  // Écoute le message du background
  browser.runtime.onMessage.addListener(function (message) {
    if (!message || message.action !== 'showHUD') return;

    const level = typeof message.level === 'number'
      ? Math.max(0, Math.min(5, message.level))
      : 0;

    // Guard : un seul HUD à la fois
    if (document.getElementById('bw-hud-iframe-host')) return;

    // ── Wrapper positionné fixed ─────────────────────────────────────────────
    const wrapper = document.createElement('div');
    wrapper.id = 'bw-hud-iframe-host';

    // Styles inline blindés contre la page
    const styles = [
      'position: fixed',
      'top: 52px',
      'right: 16px',
      'width: 160px',
      'height: 160px',
      'z-index: 2147483647',
      'pointer-events: none',
      'border: none',
      'margin: 0',
      'padding: 0',
      'background: transparent',
      'display: block',
      'overflow: hidden',
      'border-radius: 10px',
      'box-shadow: 0 4px 24px rgba(0,0,0,0.45)',
      // Apparition en fondu
      'opacity: 0',
      'transition: opacity 0.3s ease'
    ];
    wrapper.setAttribute('style', styles.join(' !important; ') + ' !important');

    // ── iframe pointant vers le GIF de l'extension ───────────────────────────
    const iframe = document.createElement('iframe');
    // 5 GIFs : hud1.gif (0→1), hud2.gif (0→2), hud3.gif (0→3),
    //           hud4.gif (0→4), hud5.gif (0→5)
    // Niveau 0 (démarrage) → on affiche hud1.gif par défaut
    const gifLevel = Math.max(1, level);
    const gifUrl = browser.runtime.getURL('hud/hud' + gifLevel + '.gif');

    const iframeStyles = [
      'width: 160px',
      'height: 160px',
      'border: none',
      'margin: 0',
      'padding: 0',
      'display: block',
      'background: transparent',
      'pointer-events: none'
    ];
    iframe.setAttribute('style', iframeStyles.join('; '));
    iframe.src = gifUrl;
    iframe.setAttribute('scrolling', 'no');
    iframe.setAttribute('frameborder', '0');
    iframe.setAttribute('allowtransparency', 'true');

    wrapper.appendChild(iframe);
    document.documentElement.appendChild(wrapper);

    // ── Fade-in après insertion ───────────────────────────────────────────────
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        wrapper.style.setProperty('opacity', '1', 'important');
      });
    });

    // ── Fade-out à 5500ms ─────────────────────────────────────────────────────
    setTimeout(function () {
      wrapper.style.setProperty('transition', 'opacity 0.4s ease', 'important');
      wrapper.style.setProperty('opacity', '0', 'important');
    }, 5500);

    // ── Suppression à 5900ms ──────────────────────────────────────────────────
    setTimeout(function () {
      if (wrapper && wrapper.parentNode) {
        wrapper.parentNode.removeChild(wrapper);
      }
    }, 5900);
  });

}());