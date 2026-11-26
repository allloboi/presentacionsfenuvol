/* =========================================================
   Presentació web · CE Recursos i Serveis en el Núvol
   IES Lluís Simarro
   ========================================================= */
(function () {
  'use strict';

  /* ---------- Referències ---------- */
  const root = document.documentElement;
  const deck = document.getElementById('deck');
  const slides = Array.from(document.querySelectorAll('.slide'));
  const total = slides.length;

  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const counterCurrent = document.getElementById('counterCurrent');
  const counterTotal = document.getElementById('counterTotal');
  const progress = document.querySelector('.progress');
  const liveRegion = document.getElementById('liveRegion');

  const indexToggle = document.getElementById('indexToggle');
  const indexMenu = document.getElementById('indexMenu');
  const indexItems = Array.from(indexMenu.querySelectorAll('[data-goto]'));

  let current = 0;

  /* ---------- Idiomes (valencià per defecte, castellà i anglès) ---------- */
  const I18N = window.I18N || { meta: {}, dyn: {} };
  const LANGS = ['va', 'es', 'en'];
  const DEFAULT_LANG = 'va';
  let lang = DEFAULT_LANG;

  function storageGet(key) {
    try { return window.localStorage.getItem(key); } catch (err) { return null; }
  }
  function storageSet(key, value) {
    try { window.localStorage.setItem(key, value); } catch (err) { /* sense emmagatzematge */ }
  }

  // Desa el text original (valencià) de l'HTML per a poder tornar-hi
  const i18nNodes = Array.from(document.querySelectorAll('[data-i18n]')).map(function (el) {
    return { el: el, key: el.dataset.i18n, va: el.innerHTML };
  });
  const i18nAttrs = [];
  document.querySelectorAll('[data-i18n-attr]').forEach(function (el) {
    el.dataset.i18nAttr.split(';').forEach(function (pair) {
      const parts = pair.split(':');
      if (parts.length !== 2) return;
      const attr = parts[0].trim();
      i18nAttrs.push({ el: el, attr: attr, key: parts[1].trim(), va: el.getAttribute(attr) });
    });
  });

  // Text dinàmic generat per JavaScript
  function t(key, vars) {
    const table = (I18N.dyn && (I18N.dyn[lang] || I18N.dyn[DEFAULT_LANG])) || {};
    let str = table[key] || (I18N.dyn && I18N.dyn[DEFAULT_LANG] && I18N.dyn[DEFAULT_LANG][key]) || key;
    if (vars) {
      Object.keys(vars).forEach(function (k) { str = str.split('{' + k + '}').join(vars[k]); });
    }
    return str;
  }

  function translated(key, fallback) {
    if (lang === DEFAULT_LANG) return fallback;
    const table = I18N[lang] || {};
    return Object.prototype.hasOwnProperty.call(table, key) ? table[key] : fallback;
  }

  function applyLanguage(newLang, options) {
    const opts = Object.assign({ persist: true, announce: false }, options);
    lang = LANGS.indexOf(newLang) !== -1 ? newLang : DEFAULT_LANG;

    i18nNodes.forEach(function (n) {
      const value = translated(n.key, n.va);
      if (n.el.innerHTML !== value) n.el.innerHTML = value;
    });
    i18nAttrs.forEach(function (a) {
      a.el.setAttribute(a.attr, translated(a.key, a.va));
    });

    const meta = (I18N.meta && I18N.meta[lang]) || {};
    root.lang = meta.htmlLang || 'ca-valencia';

    document.querySelectorAll('.lang-switch [data-lang]').forEach(function (btn) {
      btn.setAttribute('aria-pressed', btn.dataset.lang === lang ? 'true' : 'false');
    });

    // Enllaç de correu amb assumpte en l'idioma triat
    const mailto = document.getElementById('mailtoLink');
    if (mailto) {
      mailto.href = 'mailto:a.llorensboixader@edu.gva.es?subject=' + encodeURIComponent(t('mailSubject'));
    }

    if (opts.persist) storageSet('deck-lang', lang);
    if (opts.announce) liveRegion.textContent = t('langChanged');

    // Refresca els textos que depenen de l'estat
    if (typeof syncToggleAll === 'function') syncToggleAll();
    if (typeof updateUI === 'function' && slides.length) updateUI();
    indexToggle.setAttribute('aria-label', indexMenu.hidden ? t('indexOpen') : t('indexClose'));
    syncThemeLabel();
    if (typeof aiGlobe !== 'undefined' && aiGlobe) aiGlobe.redraw();
    if (typeof cloudSim !== 'undefined' && cloudSim) cloudSim.redraw();
    if (typeof netScene !== 'undefined' && netScene) netScene.redraw();
    if (typeof quiz !== 'undefined' && quiz) quiz.render();
    if (typeof tco !== 'undefined' && tco) tco.render();
  }

  document.querySelectorAll('.lang-switch [data-lang]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      if (btn.dataset.lang !== lang) applyLanguage(btn.dataset.lang, { announce: true });
    });
  });

  /* ---------- Tema dia / nit ---------- */
  const themeToggle = document.getElementById('themeToggle');
  const themeMeta = document.querySelector('meta[name="theme-color"]');

  function currentTheme() {
    return root.dataset.theme === 'light' ? 'light' : 'dark';
  }

  function syncThemeLabel() {
    if (!themeToggle) return;
    const isLight = currentTheme() === 'light';
    themeToggle.setAttribute('aria-pressed', isLight ? 'true' : 'false');
    themeToggle.setAttribute('aria-label', isLight ? t('themeToDark') : t('themeToLight'));
    themeToggle.title = themeToggle.getAttribute('aria-label');
  }

  function applyTheme(theme, options) {
    const opts = Object.assign({ persist: true, announce: false }, options);
    root.dataset.theme = theme === 'light' ? 'light' : 'dark';
    if (themeMeta) themeMeta.setAttribute('content', theme === 'light' ? '#F1F5F9' : '#0F172A');
    syncThemeLabel();
    if (opts.persist) storageSet('deck-theme', root.dataset.theme);
    if (opts.announce) liveRegion.textContent = theme === 'light' ? t('themeChangedLight') : t('themeChangedDark');
    if (typeof aiGlobe !== 'undefined' && aiGlobe) aiGlobe.redraw();
    if (typeof cloudSim !== 'undefined' && cloudSim) cloudSim.redraw();
    if (typeof netScene !== 'undefined' && netScene) netScene.redraw();
    if (typeof quiz !== 'undefined' && quiz) quiz.render();
    if (typeof tco !== 'undefined' && tco) tco.render();
  }

  if (themeToggle) {
    themeToggle.addEventListener('click', function () {
      applyTheme(currentTheme() === 'light' ? 'dark' : 'light', { announce: true });
    });
  }

  /* ---------- Icones ---------- */
  function renderIcons() {
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    } else {
      root.classList.add('no-icons');
    }
  }

  /* ---------- Navegació entre diapositives ---------- */
  function clamp(n) {
    return Math.max(0, Math.min(total - 1, n));
  }

  function goTo(index, options) {
    const opts = Object.assign({ focusHeading: false, announce: true }, options);
    const target = clamp(index);

    slides.forEach(function (slide, i) {
      const active = i === target;
      slide.classList.toggle('is-active', active);
      slide.setAttribute('aria-hidden', active ? 'false' : 'true');
      slide.inert = !active;
    });

    // Torna a l'inici del contingut (mòbil amb scroll intern)
    slides[target].scrollTop = 0;
    current = target;
    updateUI();
    if (typeof aiGlobe !== 'undefined' && aiGlobe) aiGlobe.sync();
    if (typeof cloudSim !== 'undefined' && cloudSim) cloudSim.sync();
    if (typeof netScene !== 'undefined' && netScene) netScene.sync();

    if (opts.focusHeading) {
      const heading = slides[target].querySelector('h1, h2');
      if (heading) heading.focus({ preventScroll: true });
    }
    if (opts.announce) {
      liveRegion.textContent = t('slideOf', { n: target + 1, t: total, title: slides[target].dataset.title });
    }

    // Enllaç directe a la diapositiva (#3, #4...)
    if (window.history && window.history.replaceState) {
      window.history.replaceState(null, '', '#' + (target + 1));
    }
  }

  function next() { if (current < total - 1) goTo(current + 1); }
  function prev() { if (current > 0) goTo(current - 1); }

  function updateUI() {
    counterCurrent.textContent = String(current + 1);
    counterTotal.textContent = String(total);

    root.style.setProperty('--progress', ((current + 1) / total).toFixed(4));
    progress.setAttribute('aria-valuenow', String(current + 1));
    progress.setAttribute('aria-valuemax', String(total));
    progress.setAttribute('aria-valuetext', t('progressText', { n: current + 1, t: total }));

    prevBtn.disabled = current === 0;
    nextBtn.disabled = current === total - 1;

    indexItems.forEach(function (item) {
      if (Number(item.dataset.goto) === current) {
        item.setAttribute('aria-current', 'step');
      } else {
        item.removeAttribute('aria-current');
      }
    });

    const baseTitle = (I18N.meta && I18N.meta[lang] && I18N.meta[lang].docTitle) || '';
    document.title = (current + 1) + '/' + total + ' · ' + slides[current].dataset.title + (baseTitle ? ' — ' + baseTitle : '');
  }

  prevBtn.addEventListener('click', prev);
  nextBtn.addEventListener('click', next);

  // Qualsevol botó amb data-goto fora de l'índex (p. ex. "Començar")
  document.querySelectorAll('.slide [data-goto]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      goTo(Number(btn.dataset.goto), { focusHeading: true });
    });
  });

  /* ---------- Menú d'índex ---------- */
  function openMenu() {
    indexMenu.hidden = false;
    indexToggle.setAttribute('aria-expanded', 'true');
    indexToggle.setAttribute('aria-label', t('indexClose'));
    const active = indexMenu.querySelector('[aria-current="step"]') || indexItems[0];
    active.focus();
  }

  function closeMenu(returnFocus) {
    if (indexMenu.hidden) return;
    indexMenu.hidden = true;
    indexToggle.setAttribute('aria-expanded', 'false');
    indexToggle.setAttribute('aria-label', t('indexOpen'));
    if (returnFocus) indexToggle.focus();
  }

  indexToggle.addEventListener('click', function () {
    if (indexMenu.hidden) openMenu(); else closeMenu(false);
  });

  indexItems.forEach(function (item, i) {
    item.addEventListener('click', function () {
      closeMenu(false);
      goTo(Number(item.dataset.goto), { focusHeading: true });
    });
    item.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        indexItems[(i + 1) % indexItems.length].focus();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        indexItems[(i - 1 + indexItems.length) % indexItems.length].focus();
      } else if (e.key === 'Tab' && !e.shiftKey && i === indexItems.length - 1) {
        closeMenu(false);
      }
    });
  });

  document.addEventListener('click', function (e) {
    if (!indexMenu.hidden && !e.target.closest('.index-nav')) closeMenu(false);
  });

  /* ---------- Teclat (fletxes, espai, passadors) ---------- */
  document.addEventListener('keydown', function (e) {
    if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;

    const t = e.target;

    if (e.key === 'Escape') {
      closeMenu(true);
      return;
    }

    // Dins de l'índex o d'un camp editable no interceptem
    if (t.closest && (t.closest('.index-nav__menu') || t.closest('input, textarea, select, [contenteditable="true"]'))) return;

    // Dins d'un grup de pestanyes, les fletxes mouen entre pestanyes
    const inTablist = t.closest && t.closest('[role="tablist"]');

    switch (e.key) {
      case 'ArrowRight':
      case 'PageDown':
        if (inTablist && e.key === 'ArrowRight') return;
        e.preventDefault();
        next();
        break;
      case 'ArrowLeft':
      case 'PageUp':
        if (inTablist && e.key === 'ArrowLeft') return;
        e.preventDefault();
        prev();
        break;
      case ' ':
      case 'Spacebar':
        // Espai activa els botons i enllaços: no el robem
        if (t.closest && t.closest('button, a, summary, [role="tab"]')) return;
        e.preventDefault();
        if (e.shiftKey) prev(); else next();
        break;
      case 'Home':
        if (inTablist) return;
        e.preventDefault();
        goTo(0);
        break;
      case 'End':
        if (inTablist) return;
        e.preventDefault();
        goTo(total - 1);
        break;
      default:
        break;
    }
  });

  /* ---------- Gestos tàctils (swipe) ---------- */
  (function setupSwipe() {
    const THRESHOLD = 60;      // px mínims en horitzontal
    const MAX_TIME = 900;      // ms
    let startX = null;
    let startY = 0;
    let startT = 0;

    deck.addEventListener('touchstart', function (e) {
      if (e.touches.length !== 1 || e.target.closest('[data-no-swipe]')) {
        startX = null;
        return;
      }
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      startT = Date.now();
    }, { passive: true });

    deck.addEventListener('touchend', function (e) {
      if (startX === null) return;
      const dx = e.changedTouches[0].clientX - startX;
      const dy = e.changedTouches[0].clientY - startY;
      const dt = Date.now() - startT;
      startX = null;

      if (dt > MAX_TIME) return;
      if (Math.abs(dx) < THRESHOLD) return;
      if (Math.abs(dx) < Math.abs(dy) * 1.5) return; // gest majoritàriament vertical = scroll

      if (dx < 0) next(); else prev();
    }, { passive: true });

    deck.addEventListener('touchcancel', function () { startX = null; }, { passive: true });
  })();

  /* ---------- Targetes desplegables (diapositiva 3) ---------- */
  const cards = Array.from(document.querySelectorAll('.card'));
  const toggleAllBtn = document.getElementById('toggleAllCards');

  function setCard(card, open) {
    const btn = card.querySelector('.card__toggle');
    card.classList.toggle('is-open', open);
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  function syncToggleAll() {
    if (!toggleAllBtn) return;
    const allOpen = cards.every(function (c) { return c.classList.contains('is-open'); });
    toggleAllBtn.setAttribute('aria-pressed', allOpen ? 'true' : 'false');
    toggleAllBtn.querySelector('.js-toggle-label').textContent = allOpen ? t('collapseAll') : t('expandAll');
  }

  cards.forEach(function (card) {
    card.querySelector('.card__toggle').addEventListener('click', function () {
      setCard(card, !card.classList.contains('is-open'));
      syncToggleAll();
    });
  });

  if (toggleAllBtn) {
    toggleAllBtn.addEventListener('click', function () {
      const openAll = !cards.every(function (c) { return c.classList.contains('is-open'); });
      cards.forEach(function (c) { setCard(c, openAll); });
      syncToggleAll();
    });
  }

  /* ---------- Components de pestanyes (diapositives 4 i 5) ---------- */
  document.querySelectorAll('[data-tabs]').forEach(function (group) {
    const tablist = group.querySelector('[role="tablist"]');
    const tabs = Array.from(group.querySelectorAll('[role="tab"]'));
    const isTimeline = group.classList.contains('timeline');

    function select(index, setFocus) {
      tabs.forEach(function (tab, i) {
        const selected = i === index;
        const panel = document.getElementById(tab.getAttribute('aria-controls'));

        tab.setAttribute('aria-selected', selected ? 'true' : 'false');
        tab.tabIndex = selected ? 0 : -1;
        if (isTimeline) tab.classList.toggle('is-done', i < index);

        if (panel) {
          if (selected) {
            const wasHidden = panel.hidden;
            panel.hidden = false;
            if (wasHidden) {
              panel.classList.remove('is-entering');
              void panel.offsetWidth; // reinicia l'animació
              panel.classList.add('is-entering');
            }
          } else {
            panel.hidden = true;
            panel.classList.remove('is-entering');
          }
        }
      });

      if (isTimeline) {
        tablist.style.setProperty('--step', tabs.length > 1 ? (index / (tabs.length - 1)).toFixed(4) : '0');
      }

      if (setFocus) {
        tabs[index].focus();
        tabs[index].scrollIntoView({ block: 'nearest', inline: 'nearest' });
      }
    }

    tabs.forEach(function (tab, i) {
      tab.addEventListener('click', function () { select(i, false); });
    });

    tablist.addEventListener('keydown', function (e) {
      const i = tabs.indexOf(document.activeElement);
      if (i === -1) return;
      let nextIndex = null;

      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') nextIndex = (i + 1) % tabs.length;
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') nextIndex = (i - 1 + tabs.length) % tabs.length;
      else if (e.key === 'Home') nextIndex = 0;
      else if (e.key === 'End') nextIndex = tabs.length - 1;

      if (nextIndex !== null) {
        e.preventDefault();
        select(nextIndex, true);
      }
    });

    const initial = tabs.findIndex(function (t) { return t.getAttribute('aria-selected') === 'true'; });
    select(initial === -1 ? 0 : initial, false);
  });

  /* ---------- Copiar el correu (diapositiva 6) ---------- */
  const copyBtn = document.getElementById('copyEmail');
  const copyStatus = document.getElementById('copyStatus');
  let copyTimer = null;

  function fallbackCopy(text) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.className = 'sr-only';
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch (err) { ok = false; }
    document.body.removeChild(ta);
    return ok;
  }

  function showCopyResult(ok, email) {
    clearTimeout(copyTimer);
    if (ok) {
      copyBtn.classList.add('is-copied');
      copyStatus.textContent = t('copied', { email: email });
    } else {
      copyStatus.textContent = t('copyFail');
    }
    copyTimer = setTimeout(function () {
      copyBtn.classList.remove('is-copied');
      copyStatus.textContent = '';
    }, 3000);
  }

  if (copyBtn) {
    copyBtn.addEventListener('click', function () {
      const email = copyBtn.dataset.email;
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(email)
          .then(function () { showCopyResult(true, email); })
          .catch(function () { showCopyResult(fallbackCopy(email), email); });
      } else {
        showCopyResult(fallbackCopy(email), email);
      }
    });
  }

  /* ---------- Animació 3D: xarxa d'IA local (diapositiva 3) ---------- */
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  const aiGlobe = (function setupGlobe() {
    const canvas = document.getElementById('aiGlobe');
    if (!canvas || !canvas.getContext) return null;
    const ctx = canvas.getContext('2d');
    const slide = canvas.closest('.slide');

    const PALETTES = {
      dark: {
        front: '34, 211, 238',   // cian
        back: '2, 132, 199',     // blau cloud
        orbit: '56, 189, 248',
        packet: '253, 186, 116', // taronja suau
        satellite: '#F8FAFC',
        satLabel: 'rgba(248, 250, 252, 0.9)',
        text: '#F8FAFC'
      },
      light: {
        front: '3, 105, 161',
        back: '100, 116, 139',
        orbit: '2, 132, 199',
        packet: '234, 88, 12',
        satellite: '#0284C7',
        satLabel: 'rgba(15, 23, 42, 0.9)',
        text: '#F8FAFC'
      }
    };
    let COLORS = PALETTES.dark;
    const fontFamily = getComputedStyle(document.body).fontFamily;

    // Punts repartits uniformement sobre una esfera (espiral de Fibonacci)
    const N = 150;
    const golden = Math.PI * (3 - Math.sqrt(5));
    const points = [];
    for (let i = 0; i < N; i++) {
      const y = 1 - (i / (N - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      const th = golden * i;
      points.push([Math.cos(th) * r, y, Math.sin(th) * r]);
    }

    // Arestes entre punts propers
    const edges = [];
    for (let a = 0; a < N; a++) {
      for (let b = a + 1; b < N; b++) {
        const dx = points[a][0] - points[b][0];
        const dy = points[a][1] - points[b][1];
        const dz = points[a][2] - points[b][2];
        if (dx * dx + dy * dy + dz * dz < 0.075) edges.push([a, b]);
      }
    }

    // Paquets de dades que viatgen pel nucli
    const packets = [];
    for (let k = 0; k < 7; k++) {
      packets.push({ p: points[Math.floor(Math.random() * N)], t: Math.random(), speed: 0.006 + Math.random() * 0.006, out: Math.random() > 0.5 });
    }

    // Satèl·lits (serveis al núvol) en òrbita inclinada
    const ORBIT_R = 1.42;
    const ORBIT_TILT = 0.45;
    const satellites = [0, (2 * Math.PI) / 3, (4 * Math.PI) / 3];

    let width = 0, height = 0, radius = 0;
    let rotY = 0.6, rotX = -0.28;
    let velY = 0.0035, velX = 0;
    let time = 0;
    let running = false;
    let rafId = null;
    let dragging = false, lastX = 0, lastY = 0;

    function resize() {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width; height = rect.height;
      if (!width || !height) return;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      radius = Math.min(width, height) * 0.3;
      draw();
    }

    function project(p) {
      const cy = Math.cos(rotY), sy = Math.sin(rotY);
      const x1 = p[0] * cy + p[2] * sy;
      const z1 = -p[0] * sy + p[2] * cy;
      const cx = Math.cos(rotX), sx = Math.sin(rotX);
      const y2 = p[1] * cx - z1 * sx;
      const z2 = p[1] * sx + z1 * cx;
      const s = 3.2 / (3.2 - z2);
      return { x: width / 2 + x1 * radius * s, y: height / 2 + y2 * radius * s, z: z2, s: s };
    }

    function orbitPoint(angle) {
      // Cercle al pla XZ, inclinat sobre l'eix X
      const x = Math.cos(angle) * ORBIT_R;
      const z = Math.sin(angle) * ORBIT_R;
      return [x, -z * Math.sin(ORBIT_TILT), z * Math.cos(ORBIT_TILT)];
    }

    function drawCore() {
      const pulse = 1 + Math.sin(time * 0.05) * 0.06;
      const r = radius * 0.34 * pulse;
      const cx = width / 2, cy = height / 2;
      const g = ctx.createRadialGradient(cx, cy, r * 0.1, cx, cy, r * 1.9);
      g.addColorStop(0, 'rgba(34, 211, 238, 0.95)');
      g.addColorStop(0.45, 'rgba(2, 132, 199, 0.55)');
      g.addColorStop(1, 'rgba(2, 132, 199, 0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(cx, cy, r * 1.9, 0, Math.PI * 2); ctx.fill();

      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.beginPath(); ctx.arc(cx, cy, r * 0.82, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(34, 211, 238, 0.9)';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = COLORS.text;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = '800 ' + Math.max(13, r * 0.42) + 'px ' + fontFamily;
      ctx.fillText('Qwen', cx, cy - r * 0.12);
      ctx.fillStyle = 'rgba(203, 213, 225, 0.95)';
      ctx.font = '600 ' + Math.max(9, r * 0.2) + 'px ' + fontFamily;
      ctx.fillText(t('globeCore'), cx, cy + r * 0.28);
    }

    function drawEdges(front) {
      ctx.lineWidth = 1;
      for (let i = 0; i < edges.length; i++) {
        const a = projected[edges[i][0]], b = projected[edges[i][1]];
        const z = (a.z + b.z) / 2;
        if ((z >= 0) !== front) continue;
        const alpha = front ? 0.18 + z * 0.35 : 0.06 + (1 + z) * 0.06;
        ctx.strokeStyle = 'rgba(' + (front ? COLORS.front : COLORS.back) + ',' + alpha.toFixed(3) + ')';
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      }
    }

    function drawPoints(front) {
      for (let i = 0; i < N; i++) {
        const p = projected[i];
        if ((p.z >= 0) !== front) continue;
        const size = (front ? 2.4 : 1.6) * p.s;
        const alpha = front ? 0.65 + p.z * 0.35 : 0.25 + (1 + p.z) * 0.2;
        ctx.fillStyle = 'rgba(' + (front ? COLORS.front : COLORS.back) + ',' + alpha.toFixed(3) + ')';
        ctx.beginPath(); ctx.arc(p.x, p.y, size, 0, Math.PI * 2); ctx.fill();
      }
    }

    function drawOrbit(front) {
      const steps = 90;
      ctx.lineWidth = 1.5;
      for (let i = 0; i < steps; i++) {
        const a = project(orbitPoint((i / steps) * Math.PI * 2));
        const b = project(orbitPoint(((i + 1) / steps) * Math.PI * 2));
        const z = (a.z + b.z) / 2;
        if ((z >= 0) !== front) continue;
        ctx.strokeStyle = 'rgba(' + COLORS.orbit + ',' + (front ? 0.55 : 0.18) + ')';
        ctx.setLineDash([5, 6]);
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      }
      ctx.setLineDash([]);

      satellites.forEach(function (base) {
        const q = project(orbitPoint(base + time * 0.008));
        if ((q.z >= 0) !== front) return;
        const r = (front ? 9 : 6) * q.s;
        ctx.fillStyle = 'rgba(' + COLORS.orbit + ',' + (front ? 0.25 : 0.12) + ')';
        ctx.beginPath(); ctx.arc(q.x, q.y, r * 2, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = front ? COLORS.satellite : 'rgba(' + COLORS.orbit + ', 0.6)';
        ctx.beginPath(); ctx.arc(q.x, q.y, r * 0.75, 0, Math.PI * 2); ctx.fill();
        if (front) {
          ctx.fillStyle = COLORS.satLabel;
          ctx.font = '700 ' + Math.max(10, radius * 0.085) + 'px ' + fontFamily;
          ctx.textAlign = 'center';
          ctx.fillText(t('globeCloud'), q.x, q.y - r * 2.4);
        }
      });
    }

    function drawPackets() {
      const cx = width / 2, cy = height / 2;
      packets.forEach(function (pk) {
        const p = project(pk.p);
        if (p.z < -0.2) return;
        const t = pk.out ? pk.t : 1 - pk.t;
        const x = cx + (p.x - cx) * t;
        const y = cy + (p.y - cy) * t;
        ctx.fillStyle = 'rgba(' + COLORS.packet + ',' + (0.35 + 0.6 * Math.sin(Math.PI * pk.t)).toFixed(3) + ')';
        ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.fill();
      });
    }

    let projected = [];
    function draw() {
      if (!width) return;
      COLORS = root.dataset.theme === 'light' ? PALETTES.light : PALETTES.dark;
      ctx.clearRect(0, 0, width, height);
      projected = points.map(project);
      drawOrbit(false);
      drawEdges(false);
      drawPoints(false);
      drawCore();
      drawPackets();
      drawEdges(true);
      drawPoints(true);
      drawOrbit(true);
    }

    function step() {
      if (!running) return;
      time += 1;
      if (!dragging) {
        rotY += velY;
        rotX += velX;
        velY += (0.0035 - velY) * 0.02; // torna suaument a la rotació base
        velX *= 0.95;
        rotX += (-0.28 - rotX) * 0.01;
      }
      packets.forEach(function (pk) {
        pk.t += pk.speed;
        if (pk.t >= 1) {
          pk.t = 0;
          pk.p = points[Math.floor(Math.random() * N)];
          pk.out = !pk.out;
        }
      });
      draw();
      rafId = requestAnimationFrame(step);
    }

    function start() {
      resize();
      if (reduceMotion.matches) { draw(); return; }
      if (running) return;
      running = true;
      rafId = requestAnimationFrame(step);
    }

    function stop() {
      running = false;
      if (rafId) cancelAnimationFrame(rafId);
      rafId = null;
    }

    // Interacció: arrossegar per a girar
    canvas.addEventListener('pointerdown', function (e) {
      dragging = true; lastX = e.clientX; lastY = e.clientY;
      canvas.setPointerCapture(e.pointerId);
    });
    canvas.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      const dx = e.clientX - lastX, dy = e.clientY - lastY;
      lastX = e.clientX; lastY = e.clientY;
      rotY += dx * 0.008;
      rotX = Math.max(-1.2, Math.min(1.2, rotX + dy * 0.006));
      velY = dx * 0.0015; velX = dy * 0.0008;
      if (!running) draw();
    });
    function endDrag() { dragging = false; }
    canvas.addEventListener('pointerup', endDrag);
    canvas.addEventListener('pointercancel', endDrag);

    if ('ResizeObserver' in window) {
      new ResizeObserver(function () { if (slide.classList.contains('is-active')) resize(); }).observe(canvas);
    }

    return {
      sync: function () { if (slide.classList.contains('is-active')) start(); else stop(); },
      redraw: function () { if (!running) draw(); }
    };
  })();

  /* ---------- Simulació 3D: CPD propi vs núvol (diapositiva 7) ---------- */
  const cloudSim = (function setupCloudSim() {
    const canvas = document.getElementById('cloudSim');
    if (!canvas || !canvas.getContext) return null;
    const ctx = canvas.getContext('2d');
    const slide = canvas.closest('.slide');
    const stage = canvas.parentElement;

    const range = document.getElementById('demandRange');
    const out = document.getElementById('demandOut');
    const peakBtn = document.getElementById('simPeak');
    const failBtn = document.getElementById('simFail');
    const modeBtns = Array.from(document.querySelectorAll('.segmented [data-mode]'));
    const el = {
      cap: document.getElementById('mCap'),
      idle: document.getElementById('mIdle'),
      lost: document.getElementById('mLost'),
      cost: document.getElementById('mCost'),
      status: document.getElementById('simStatus')
    };
    const fontFamily = getComputedStyle(document.body).fontFamily;

    /* --- Model --- */
    const SLABS = 6;                // unitats per rack
    const RACKS = 4;                // CPD propi: 4 racks = 24 unitats = 100 %
    const BASE = SLABS * RACKS;
    const ZONES = 3;                // núvol: 3 zones de disponibilitat
    const PER_ZONE = 16;            // màxim d'instàncies per zona (4 × 4)

    const state = {
      mode: 'onprem',
      demandPct: Number(range.value),
      failure: false,
      build: 1,                     // animació de construcció en canviar de mode (0 → 1)
      yaw: -0.62,
      pitch: 0.58,
      time: 0
    };
    // Escala visual de cada instància al núvol (per a animar l'aparició)
    const instScale = [];
    for (let z = 0; z < ZONES; z++) {
      instScale.push(new Array(PER_ZONE).fill(0));
    }

    function compute() {
      const demand = (state.demandPct / 100) * BASE;
      if (state.mode === 'onprem') {
        const activeRacks = state.failure ? RACKS - 1 : RACKS;
        const cap = activeRacks * SLABS;
        return {
          demand: demand, cap: cap,
          idle: Math.max(0, cap - demand),
          lost: Math.max(0, demand - cap),
          cost: BASE,               // cost fix: es paga tota la capacitat instal·lada
          activeRacks: activeRacks
        };
      }
      const activeZones = state.failure ? ZONES - 1 : ZONES;
      const wanted = Math.max(3, Math.ceil(demand * 1.1)); // 10 % de marge
      const n = Math.min(activeZones * PER_ZONE, wanted);
      return {
        demand: demand, cap: n,
        idle: Math.max(0, n - demand),
        lost: Math.max(0, demand - n),
        cost: n,                    // pagament per ús
        instances: n,
        activeZones: activeZones
      };
    }

    function pct(units) { return Math.round((units / BASE) * 100); }

    /* --- Panell de dades --- */
    let lastStatus = '';
    function updatePanel() {
      const m = compute();
      out.value = state.demandPct + '%';
      out.textContent = state.demandPct + '%';

      el.cap.innerHTML = pct(m.cap) + '%<small>' + (state.mode === 'onprem' ? t('simFixed') : t('simElastic')) + '</small>';
      el.idle.textContent = pct(m.idle) + '%';
      el.lost.textContent = pct(m.lost) + '%';
      el.cost.innerHTML = pct(m.cost) + '%<small>' + (state.mode === 'onprem' ? t('simCostFixed') : t('simCostUse')) + '</small>';

      el.lost.parentElement.classList.toggle('is-bad', m.lost > 0.01);
      el.lost.parentElement.classList.toggle('is-good', m.lost <= 0.01);
      el.idle.parentElement.classList.toggle('is-bad', state.mode === 'onprem' && pct(m.idle) >= 40);

      let msg;
      let level = '';
      if (state.mode === 'onprem') {
        if (m.lost > 0.01) {
          msg = t('simOnpremOver', { lost: pct(m.lost) });
          level = 'is-bad';
        } else {
          msg = t('simOnpremOk', { idle: pct(m.idle) });
          level = pct(m.idle) >= 40 ? 'is-warn' : '';
        }
        if (state.failure) msg = t('simOnpremFail', { cap: pct(m.cap) }) + ' ' + msg;
      } else {
        msg = m.lost > 0.01 ? t('simCloudLimit', { lost: pct(m.lost) }) : t('simCloudOk', { n: m.instances });
        if (state.failure) msg = t('simCloudFail') + ' ' + msg;
        level = m.lost > 0.01 ? 'is-warn' : '';
      }
      el.status.className = 'sim3d__status ' + level;
      if (msg !== lastStatus) {
        el.status.textContent = msg;
        lastStatus = msg;
      }
    }

    /* --- Motor 3D (projecció ortogràfica + algorisme del pintor) --- */
    let width = 0, height = 0, scale = 1;
    const LIGHT = normalize([0.45, 1, 0.65]);

    function normalize(v) {
      const l = Math.hypot(v[0], v[1], v[2]);
      return [v[0] / l, v[1] / l, v[2] / l];
    }

    function rotYaw(x, z) {
      const c = Math.cos(state.yaw), s = Math.sin(state.yaw);
      return [x * c - z * s, x * s + z * c];
    }

    function project(x, y, z) {
      const r = rotYaw(x, z);
      const cp = Math.cos(state.pitch), sp = Math.sin(state.pitch);
      const vy = y * cp - r[1] * sp;
      return {
        x: width / 2 + r[0] * scale,
        y: height * 0.6 - vy * scale,
        d: y * sp + r[1] * cp
      };
    }

    function shade(rgb, normal, alpha) {
      const n = normal;
      const lit = 0.5 + 0.5 * Math.max(0, n[0] * LIGHT[0] + n[1] * LIGHT[1] + n[2] * LIGHT[2]);
      const c = rgb.map(function (v) { return Math.round(Math.min(255, v * lit)); });
      return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + (alpha === undefined ? 1 : alpha) + ')';
    }

    let faces = [];
    // Afig un prisma rectangular centrat en (cx, cz) i amb la base a l'altura y0
    function box(cx, y0, cz, w, h, d, rgb, opts) {
      if (h <= 0.001 || w <= 0.001) return;
      const o = opts || {};
      const x0 = cx - w / 2, x1 = cx + w / 2, z0 = cz - d / 2, z1 = cz + d / 2, y1 = y0 + h;
      const quads = [
        { n: [0, 1, 0], p: [[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]] },  // dalt
        { n: [0, 0, 1], p: [[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]] },  // davant
        { n: [0, 0, -1], p: [[x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0]] }, // darrere
        { n: [1, 0, 0], p: [[x1, y0, z0], [x1, y0, z1], [x1, y1, z1], [x1, y1, z0]] },  // dreta
        { n: [-1, 0, 0], p: [[x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0]] }  // esquerra
      ];
      const sp = Math.sin(state.pitch), cp = Math.cos(state.pitch);
      const center = project(cx, y0 + h / 2, cz);
      const group = { depth: center.d, layer: (typeof o.layer === "number" ? o.layer : 1), faces: [] };
      faces.push(group);
      quads.forEach(function (q) {
        // Eliminació de cares posteriors
        const rn = rotYaw(q.n[0], q.n[2]);
        const facing = q.n[1] * sp + rn[1] * cp;
        if (facing <= 0.001) return;
        const pts = q.p.map(function (v) { return project(v[0], v[1], v[2]); });
        let fill;
        if (o.faceColors) {
          // Colors explícits per cara: dalt / davant-darrere / laterals
          const fc = q.n[1] !== 0 ? o.faceColors.top : (q.n[2] !== 0 ? o.faceColors.front : o.faceColors.side);
          fill = 'rgba(' + fc[0] + ',' + fc[1] + ',' + fc[2] + ',' + (o.alpha === undefined ? 1 : o.alpha) + ')';
        } else {
          fill = shade(rgb, q.n, o.alpha);
        }
        group.faces.push({ pts: pts, fill: fill, stroke: o.stroke || null, lineWidth: o.lineWidth || 0.6 });
      });
    }

    const labels = [];
    function label(text, x, y, z, color) {
      const p = project(x, y, z);
      labels.push({ text: text, x: p.x, y: p.y, color: color });
    }

    function palette() {
      const light = root.dataset.theme === 'light';
      return {
        floor: light ? [226, 232, 240] : [30, 41, 59],
        rack: light ? [148, 163, 184] : [51, 65, 85],
        slabIdle: light ? [203, 213, 225] : [40, 52, 72],
        slabOn: [251, 146, 60],
        slabOver: [239, 68, 68],
        slabDead: light ? [100, 116, 139] : [24, 30, 44],
        zone: light ? [224, 242, 254] : [15, 52, 82],
        zoneDead: light ? [203, 213, 225] : [51, 65, 85],
        inst: [34, 211, 238],
        instFaces: light
          ? { top: [56, 189, 248], front: [2, 132, 199], side: [7, 89, 133] }
          : { top: [165, 243, 252], front: [34, 211, 238], side: [8, 145, 178] },
        instStroke: light ? 'rgba(12, 74, 110, 0.9)' : 'rgba(236, 254, 255, 0.85)',
        instShadow: light ? [100, 116, 139] : [2, 6, 23],
        label: light ? '#0F172A' : '#F8FAFC',
        labelMuted: light ? '#334155' : '#CBD5E1',
        bad: '#EF4444'
      };
    }

    function ease(t) { return 1 - Math.pow(1 - t, 3); }

    function buildScene() {
      faces = [];
      labels.length = 0;
      const C = palette();
      const m = compute();
      const b = ease(state.build);
      const pulse = 0.5 + 0.5 * Math.sin(state.time * 0.15);

      if (state.mode === 'onprem') {
        // Sòl del CPD
        box(0, -0.12, 0, 5.4, 0.12, 2.4, C.floor, { layer: 0 });
        const gapX = 1.25;
        const perRack = m.demand / m.activeRacks;
        const over = m.lost > 0.01;
        for (let r = 0; r < RACKS; r++) {
          const x = (r - (RACKS - 1) / 2) * gapX;
          const dead = state.failure && r === RACKS - 1;
          // Estructura del rack
          box(x, 0, 0, 0.95, 0.08, 1.0, C.rack);
          const lit = dead ? 0 : Math.min(SLABS, perRack);
          for (let sIdx = 0; sIdx < SLABS; sIdx++) {
            const y = 0.1 + sIdx * 0.34 * b;
            let col = C.slabIdle;
            let alpha = 1;
            if (dead) col = C.slabDead;
            else if (sIdx < Math.floor(lit) || (sIdx < Math.ceil(lit) && lit % 1 > 0.35)) {
              col = over ? C.slabOver : C.slabOn;
              if (over) alpha = 0.75 + 0.25 * pulse;
            }
            box(x, y, 0, 0.85, 0.28 * b, 0.9, col, { alpha: alpha });
          }
          box(x, 0.1 + SLABS * 0.34 * b, 0, 0.95, 0.06, 1.0, C.rack);
          if (dead) label('✕', x, 0.3 + SLABS * 0.34 * b, 0, C.bad);
        }
        label(t('simLabelDC'), 0, -0.1, 1.55, C.labelMuted);
        if (over) label(t('simLabelSaturated'), 0, 2.7 * b + 0.2, 0, C.bad);
      } else {
        const C2 = C;
        const zoneGap = 2.15;
        // Repartiment round-robin d'instàncies entre zones actives
        const counts = new Array(ZONES).fill(0);
        const active = [];
        for (let z = 0; z < ZONES; z++) if (!(state.failure && z === 0)) active.push(z);
        for (let i = 0; i < m.instances; i++) counts[active[i % active.length]] += 1;

        for (let z = 0; z < ZONES; z++) {
          const cx = (z - 1) * zoneGap;
          const dead = state.failure && z === 0;
          box(cx, -0.1, 0, 1.95, 0.1, 1.95, dead ? C2.zoneDead : C2.zone, { alpha: dead ? 0.6 : 1, layer: 0 });
          for (let k = 0; k < PER_ZONE; k++) {
            const target = k < counts[z] ? 1 : 0;
            instScale[z][k] += (target - instScale[z][k]) * 0.12;
            const sc = instScale[z][k] * b;
            if (sc < 0.02) continue;
            const gx = (k % 4) - 1.5, gz = Math.floor(k / 4) - 1.5;
            const ix = cx + gx * 0.44, iz = gz * 0.44;
            const size = 0.3 * sc;
            const bob = (Math.sin(state.time * 0.05 + k + z * 3) + 1) * 0.02;
            // Ombra de contacte sobre la plataforma
            box(ix, 0.001, iz, size * 1.1, 0.004, size * 1.1, C2.instShadow, { alpha: 0.45 * sc, layer: 0.5 });
            // Instància
            box(ix, 0.06 + bob, iz, size, size, size, C2.inst, {
              faceColors: C2.instFaces,
              stroke: C2.instStroke,
              lineWidth: 1.1
            });
          }
          label(t('simLabelZone') + ' ' + String.fromCharCode(65 + z), cx, -0.1, 1.2, dead ? C2.bad : C2.labelMuted);
          if (dead) label('✕', cx, 0.5, 0, C2.bad);
        }
        label(t('simLabelRegion'), 0, 1.75, -0.6, C2.label);
      }
    }

    function draw() {
      if (!width) return;
      ctx.clearRect(0, 0, width, height);
      buildScene();
      // Algorisme del pintor per prismes: primer el sòl (capa 0), després de lluny a prop
      faces.sort(function (a, b) { return (a.layer - b.layer) || (a.depth - b.depth); });
      ctx.lineJoin = 'round';
      const flat = [];
      faces.forEach(function (g) { g.faces.forEach(function (f) { flat.push(f); }); });
      flat.forEach(function (f) {
        ctx.beginPath();
        ctx.moveTo(f.pts[0].x, f.pts[0].y);
        for (let i = 1; i < 4; i++) ctx.lineTo(f.pts[i].x, f.pts[i].y);
        ctx.closePath();
        ctx.fillStyle = f.fill;
        ctx.fill();
        ctx.strokeStyle = f.stroke || 'rgba(15, 23, 42, 0.25)';
        ctx.lineWidth = f.lineWidth;
        ctx.stroke();
      });
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      labels.forEach(function (l) {
        ctx.font = '700 ' + Math.max(11, scale * 0.17) + 'px ' + fontFamily;
        ctx.fillStyle = l.color;
        ctx.fillText(l.text, l.x, l.y);
      });
    }

    function resize() {
      const rect = stage.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width; height = rect.height;
      if (!width || !height) return;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      scale = Math.min(width / 7.4, height / 4.4);
      draw();
    }

    /* --- Bucle d'animació --- */
    let running = false, rafId = null;
    function step() {
      if (!running) return;
      state.time += 1;
      if (state.build < 1) state.build = Math.min(1, state.build + 0.035);
      draw();
      rafId = requestAnimationFrame(step);
    }
    function start() {
      resize();
      updatePanel();
      if (reduceMotion.matches) {
        state.build = 1;
        instScale.forEach(function (zone) { zone.fill(1); });
        draw();
        return;
      }
      if (running) return;
      running = true;
      rafId = requestAnimationFrame(step);
    }
    function stop() {
      running = false;
      if (rafId) cancelAnimationFrame(rafId);
      rafId = null;
      stopPeak();
    }
    function redrawIfStatic() {
      if (!running) {
        if (reduceMotion.matches) {
          // Sense animació: col·loca les instàncies al seu estat final
          const m = compute();
          const counts = new Array(ZONES).fill(0);
          const active = [];
          for (let z = 0; z < ZONES; z++) if (!(state.failure && z === 0)) active.push(z);
          if (m.instances) for (let i = 0; i < m.instances; i++) counts[active[i % active.length]] += 1;
          instScale.forEach(function (zone, z) { zone.forEach(function (_, k) { zone[k] = k < counts[z] ? 1 : 0; }); });
        }
        draw();
      }
    }

    /* --- Controls --- */
    function setDemand(v) {
      state.demandPct = Math.round(Math.max(10, Math.min(150, v)));
      range.value = String(state.demandPct);
      updatePanel();
      redrawIfStatic();
    }

    range.addEventListener('input', function () {
      stopPeak();
      setDemand(Number(range.value));
    });

    modeBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (state.mode === btn.dataset.mode) return;
        state.mode = btn.dataset.mode;
        modeBtns.forEach(function (b) { b.setAttribute('aria-pressed', b === btn ? 'true' : 'false'); });
        state.build = reduceMotion.matches ? 1 : 0;
        updatePanel();
        redrawIfStatic();
      });
    });

    failBtn.addEventListener('click', function () {
      state.failure = !state.failure;
      failBtn.setAttribute('aria-pressed', state.failure ? 'true' : 'false');
      updatePanel();
      redrawIfStatic();
    });

    // Pic de demanda: corba de 7 segons que puja fins al 140 % i torna
    let peakRaf = null;
    function stopPeak() {
      if (peakRaf) cancelAnimationFrame(peakRaf);
      peakRaf = null;
      peakBtn.disabled = false;
    }
    peakBtn.addEventListener('click', function () {
      if (reduceMotion.matches) { setDemand(140); return; }
      stopPeak();
      const from = state.demandPct;
      const t0 = performance.now();
      const DURATION = 7000;
      peakBtn.disabled = true;
      (function tick(now) {
        const p = Math.min(1, (now - t0) / DURATION);
        const wave = Math.pow(Math.sin(Math.PI * p), 2);
        setDemand(from + (140 - from) * wave);
        if (p < 1) peakRaf = requestAnimationFrame(tick);
        else stopPeak();
      })(t0);
    });

    // Arrossegar per a girar l'escena
    let dragging = false, lastX = 0, lastY = 0;
    stage.addEventListener('pointerdown', function (e) {
      dragging = true; lastX = e.clientX; lastY = e.clientY;
      stage.setPointerCapture(e.pointerId);
    });
    stage.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      state.yaw += (e.clientX - lastX) * 0.008;
      state.pitch = Math.max(0.2, Math.min(1.2, state.pitch + (e.clientY - lastY) * 0.005));
      lastX = e.clientX; lastY = e.clientY;
      redrawIfStatic();
    });
    function endDrag() { dragging = false; }
    stage.addEventListener('pointerup', endDrag);
    stage.addEventListener('pointercancel', endDrag);

    if ('ResizeObserver' in window) {
      new ResizeObserver(function () { if (slide.classList.contains('is-active')) resize(); }).observe(stage);
    }

    updatePanel();

    return {
      sync: function () { if (slide.classList.contains('is-active')) start(); else stop(); },
      redraw: function () { updatePanel(); redrawIfStatic(); }
    };
  })();

  /* ---------- Diapositiva 3: preguntes de diagnòstic i escenari recomanat ---------- */
  const quiz = (function setupQuiz() {
    const root3 = document.querySelector('.quiz');
    if (!root3) return null;
    const text = document.getElementById('quizText');
    const go = document.getElementById('quizGo');
    const answers = {};          // { it: 'own', where: 'onprem', aws: 'use', goal: ['cost', 'data'] }
    let recommended = null;

    // Punts que cada resposta suma als escenaris A, B i C
    const WEIGHTS = {
      it: { own: { C: 1 }, ext: { A: 1 }, mix: { B: 1 } },
      where: { onprem: { A: 2 }, cloud: { C: 2 }, saas: { B: 1, C: 1 } },
      aws: { no: { A: 1 }, know: { A: 1 }, use: { C: 2 } },
      goal: { cost: { A: 2 }, avail: { A: 1, B: 1 }, branch: { B: 2 }, data: { C: 2 } }
    };

    function compute() {
      const score = { A: 0, B: 0, C: 0 };
      let any = false;
      Object.keys(answers).forEach(function (q) {
        const list = Array.isArray(answers[q]) ? answers[q] : [answers[q]];
        list.forEach(function (a) {
          const w = WEIGHTS[q] && WEIGHTS[q][a];
          if (!w) return;
          any = true;
          Object.keys(w).forEach(function (k) { score[k] += w[k]; });
        });
      });
      if (!any) return null;
      // Empat: s'imposa l'ordre A > B > C (el pas més prudent primer)
      return ['A', 'B', 'C'].reduce(function (best, k) { return score[k] > score[best] ? k : best; }, 'A');
    }

    function render() {
      recommended = compute();
      text.textContent = recommended ? t('quiz' + recommended) : t('quizEmpty');
      go.disabled = !recommended;
      document.querySelectorAll('.pills .pill').forEach(function (pill) {
        pill.classList.toggle('is-recommended', !!recommended && pill.id === 'tab-' + recommended.toLowerCase());
      });
    }

    root3.querySelectorAll('.q').forEach(function (fs) {
      const q = fs.dataset.q;
      const multi = fs.hasAttribute('data-multi');
      const opts = Array.from(fs.querySelectorAll('.opt'));
      opts.forEach(function (btn) {
        btn.addEventListener('click', function () {
          const on = btn.getAttribute('aria-pressed') !== 'true';
          if (multi) {
            btn.setAttribute('aria-pressed', on ? 'true' : 'false');
            answers[q] = opts.filter(function (b) { return b.getAttribute('aria-pressed') === 'true'; })
              .map(function (b) { return b.dataset.a; });
          } else {
            opts.forEach(function (b) { b.setAttribute('aria-pressed', b === btn && on ? 'true' : 'false'); });
            if (on) answers[q] = btn.dataset.a; else delete answers[q];
          }
          render();
        });
      });
    });

    go.addEventListener('click', function () {
      if (!recommended) return;
      const target = document.getElementById('tab-' + recommended.toLowerCase());
      const slideIndex = slides.indexOf(target.closest('.slide'));
      goTo(slideIndex, { focusHeading: true });
      target.click();
    });

    return { render: render };
  })();

  /* ---------- Diapositiva 10: escenari econòmic fictici (cost a 5 anys) ---------- */
  const tco = (function setupTco() {
    const svg = document.getElementById('tcoChart');
    if (!svg) return null;
    const planBtns = Array.from(document.querySelectorAll('[data-plan]'));
    const el = {
      onprem: document.getElementById('tcoOnprem'),
      cloud: document.getElementById('tcoCloud'),
      diff: document.getElementById('tcoDiff'),
      diffBox: document.getElementById('tcoDiffBox'),
      msg: document.getElementById('tcoMsg'),
      rows: document.getElementById('tcoRows'),
      desc: document.getElementById('tcoChartDesc')
    };
    const NS = 'http://www.w3.org/2000/svg';
    let plan = 'lift';

    /* Supòsits fictícis (euros) */
    const ONPREM = {
      capex: 180000, renewal: 60000, renewalYear: 4,
      licences: 25000, energy: 18000, ops: 40000, backup: 15000
    };
    const CLOUD = { migration: 40000, licences: 12000, ops: 20000, backup: 4000 };
    const CAMPAIGN_MONTHS = 5;
    const PLANS = {
      lift: { off: 9500, peak: 9500 },        // dimensionat per al pic tot l'any
      tuned: { off: 6000, peak: 9500 },       // capacitat ajustada a la campanya
      optimized: { off: 4200, peak: 7000 }    // escalat automàtic + reserves + apagat
    };

    function onpremYear(y) {
      let c = ONPREM.licences + ONPREM.energy + ONPREM.ops + ONPREM.backup;
      if (y === 1) c += ONPREM.capex;
      if (y === ONPREM.renewalYear) c += ONPREM.renewal;
      return c;
    }
    function cloudYear(y, p) {
      const usage = PLANS[p].off * (12 - CAMPAIGN_MONTHS) + PLANS[p].peak * CAMPAIGN_MONTHS;
      return usage + CLOUD.licences + CLOUD.ops + CLOUD.backup + (y === 1 ? CLOUD.migration : 0);
    }
    function cumulative(fn) {
      const out = []; let acc = 0;
      for (let y = 1; y <= 5; y++) { acc += fn(y); out.push(acc); }
      return out;
    }

    function locale() {
      const l = root.lang || 'ca';
      return l.indexOf('en') === 0 ? 'en-GB' : (l.indexOf('es') === 0 ? 'es-ES' : 'ca-ES');
    }
    function money(v) {
      return new Intl.NumberFormat(locale(), { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);
    }
    function kEuro(v) { return t('kEuro', { n: Math.round(v / 1000) }); }

    function node(tag, attrs, txt) {
      const n = document.createElementNS(NS, tag);
      Object.keys(attrs).forEach(function (k) { n.setAttribute(k, attrs[k]); });
      if (txt !== undefined) n.textContent = txt;
      svg.appendChild(n);
      return n;
    }

    function drawChart(on, cl) {
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      const W = 640, H = 300, L = 64, R = 92, T = 18, B = 40;
      const max = 900000;
      const x = function (i) { return L + (i / 4) * (W - L - R); };
      const y = function (v) { return T + (1 - v / max) * (H - T - B); };

      // Graella i eix Y
      for (let v = 0; v <= max; v += 150000) {
        node('line', { x1: L, x2: W - R, y1: y(v), y2: y(v), class: 'tco__grid' });
        node('text', { x: L - 10, y: y(v) + 4, 'text-anchor': 'end', class: 'tco__axis' }, kEuro(v));
      }
      // Eix X
      for (let i = 0; i < 5; i++) {
        node('text', { x: x(i), y: H - 14, 'text-anchor': 'middle', class: 'tco__axis' }, t('yearN', { n: i + 1 }));
      }

      // Àrea de diferència entre les dues línies
      const area = on.map(function (v, i) { return x(i) + ',' + y(v); })
        .concat(cl.slice().reverse().map(function (v, i) { return x(4 - i) + ',' + y(v); })).join(' ');
      node('polygon', { points: area, class: cl[4] <= on[4] ? 'tco__gap tco__gap--save' : 'tco__gap tco__gap--loss' });

      function line(data, cls) {
        const d = data.map(function (v, i) { return (i ? 'L' : 'M') + x(i) + ' ' + y(v); }).join(' ');
        const p = node('path', { d: d, class: 'tco__line ' + cls, pathLength: '1' });
        data.forEach(function (v, i) { node('circle', { cx: x(i), cy: y(v), r: 4.5, class: 'tco__dot ' + cls }); });
        return p;
      }
      line(on, 'tco__line--onprem');
      line(cl, 'tco__line--cloud');

      // Etiquetes de valor final
      const yOn = y(on[4]), yCl = y(cl[4]);
      const sep = Math.abs(yOn - yCl) < 18 ? (yOn < yCl ? -9 : 9) : 0;
      node('text', { x: x(4) + 10, y: yOn + 4 + sep, class: 'tco__end tco__end--onprem' }, kEuro(on[4]));
      node('text', { x: x(4) + 10, y: yCl + 4 - sep, class: 'tco__end tco__end--cloud' }, kEuro(cl[4]));
    }

    function renderRows() {
      const yr = t('perYear');
      const rows = [
        [t('tcoInvest'), money(ONPREM.capex) + ' + ' + money(ONPREM.renewal) + ' (' + t('yearN', { n: ONPREM.renewalYear }) + ')', money(CLOUD.migration) + ' ' + t('tcoMigration')],
        [t('tcoLic'), money(ONPREM.licences) + yr, money(CLOUD.licences) + yr],
        [t('tcoEnergy'), money(ONPREM.energy) + yr, t('tcoIncluded')],
        [t('tcoOps'), money(ONPREM.ops) + yr, money(CLOUD.ops) + yr],
        [t('tcoBackup'), money(ONPREM.backup) + yr, money(CLOUD.backup) + yr],
        [t('tcoUsage'), '—', money(PLANS[plan].off) + t('perMonth') + ' / ' + money(PLANS[plan].peak) + t('perMonth') + ' ' + t('tcoInCampaign')]
      ];
      el.rows.innerHTML = '';
      rows.forEach(function (r) {
        const tr = document.createElement('tr');
        r.forEach(function (c, i) {
          const cell = document.createElement(i === 0 ? 'th' : 'td');
          if (i === 0) cell.scope = 'row';
          cell.textContent = c;
          tr.appendChild(cell);
        });
        el.rows.appendChild(tr);
      });
    }

    function render() {
      const on = cumulative(onpremYear);
      const cl = cumulative(function (y) { return cloudYear(y, plan); });
      const diff = on[4] - cl[4];
      const pct = Math.round((Math.abs(diff) / on[4]) * 1000) / 10;
      const pctTxt = new Intl.NumberFormat(locale(), { maximumFractionDigits: 1 }).format(pct) + ' %';

      el.onprem.textContent = money(on[4]);
      el.cloud.textContent = money(cl[4]);
      el.diff.innerHTML = (diff >= 0 ? '−' : '+') + money(Math.abs(diff)) + '<small>' + (diff >= 0 ? t('tcoSaving') : t('tcoExtra')) + ' · ' + pctTxt + '</small>';
      el.diffBox.classList.toggle('is-good', diff >= 0);
      el.diffBox.classList.toggle('is-bad', diff < 0);

      el.msg.className = 'sim3d__status ' + (diff < 0 ? 'is-bad' : '');
      el.msg.textContent = t('tcoMsg_' + plan, { diff: money(Math.abs(diff)), pct: pctTxt });
      el.desc.textContent = t('tcoDesc', { onprem: money(on[4]), cloud: money(cl[4]) });

      drawChart(on, cl);
      renderRows();
    }

    planBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        plan = btn.dataset.plan;
        planBtns.forEach(function (b) { b.setAttribute('aria-pressed', b === btn ? 'true' : 'false'); });
        render();
      });
    });

    return { render: render };
  })();

  /* ---------- Animació 3D de portada: núvol, dades i xarxa ---------- */
  const netScene = (function setupNetScene() {
    const canvas = document.getElementById('netScene');
    if (!canvas || !canvas.getContext) return null;
    const ctx = canvas.getContext('2d');
    const slide = canvas.closest('.slide');
    const holder = canvas.parentElement;

    const TAU = Math.PI * 2;
    let width = 0, height = 0, scale = 1;
    let yaw = 0.5, pitch = 0.42, time = 0;
    let autoSpin = 0.0022;
    let running = false, rafId = null;

    /* --- Paletes (mode nit / mode dia) --- */
    function palette() {
      const light = root.dataset.theme === 'light';
      return light ? {
        grid: '2, 132, 199', gridA: 0.18,
        lan: '124, 58, 237', up: '2, 132, 199', down: '234, 88, 12',
        cloud: '2, 132, 199', cloudCore: '14, 116, 144',
        node: [226, 232, 240], server: [203, 213, 225], router: [14, 116, 144],
        trailer: [241, 245, 249], cab: [2, 132, 199], reefer: [100, 116, 139],
        led: '16, 185, 129', edge: 'rgba(15, 23, 42, 0.35)'
      } : {
        grid: '56, 189, 248', gridA: 0.16,
        lan: '167, 139, 250', up: '34, 211, 238', down: '251, 146, 60',
        cloud: '125, 211, 252', cloudCore: '34, 211, 238',
        node: [100, 116, 139], server: [71, 85, 105], router: [8, 145, 178],
        trailer: [203, 213, 225], cab: [14, 165, 233], reefer: [71, 85, 105],
        led: '52, 211, 153', edge: 'rgba(148, 163, 184, 0.45)'
      };
    }

    /* --- Geometria de l'escena --- */
    const CLOUD_Y = 2.55;
    const ROUTER = [0, 0, 0];
    const nodes = [];
    const NODE_COUNT = 8;
    for (let i = 0; i < NODE_COUNT; i++) {
      const a = (i / NODE_COUNT) * TAU + 0.2;
      const r = i % 2 === 0 ? 2.55 : 2.15;
      nodes.push({
        pos: [Math.cos(a) * r, 0, Math.sin(a) * r],
        type: i % 2 === 0 ? 'server' : 'client',
        phase: Math.random() * TAU
      });
    }

    // Núvol: punts sobre la superfície d'una unió d'esferes
    const blobs = [
      { c: [0, CLOUD_Y, 0], r: 0.95 },
      { c: [-0.95, CLOUD_Y - 0.2, 0.15], r: 0.68 },
      { c: [0.98, CLOUD_Y - 0.15, -0.1], r: 0.72 },
      { c: [0.35, CLOUD_Y + 0.55, 0.05], r: 0.62 },
      { c: [-0.45, CLOUD_Y + 0.45, -0.2], r: 0.58 }
    ];
    const cloudPts = [];
    (function buildCloud() {
      let seed = 7;
      function rnd() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }
      blobs.forEach(function (b) {
        const n = Math.round(90 * b.r);
        for (let i = 0; i < n; i++) {
          const u = rnd() * 2 - 1, th = rnd() * TAU;
          const rr = Math.sqrt(1 - u * u);
          const p = [b.c[0] + rr * Math.cos(th) * b.r, b.c[1] + u * b.r * 0.8, b.c[2] + rr * Math.sin(th) * b.r];
          const inside = blobs.some(function (o) {
            if (o === b) return false;
            const dx = p[0] - o.c[0], dy = (p[1] - o.c[1]) / 0.8, dz = p[2] - o.c[2];
            return dx * dx + dy * dy + dz * dz < o.r * o.r * 0.92;
          });
          if (!inside && p[1] > CLOUD_Y - 0.55) cloudPts.push({ p: p, tw: rnd() * TAU });
        }
      });
    })();

    // Enllaços: xarxa local (estrella + anell) i enllaços amb el núvol
    const links = [];
    nodes.forEach(function (n, i) {
      links.push({ a: ROUTER, b: n.pos, kind: 'lan' });
      links.push({ a: n.pos, b: nodes[(i + 1) % NODE_COUNT].pos, kind: 'lan', faint: true });
    });
    const uplinkTargets = [ROUTER, nodes[0].pos, nodes[4].pos];
    const uplinks = uplinkTargets.map(function (p, i) {
      return { a: [p[0], 0.35, p[2]], b: [blobs[i].c[0] * 0.6, CLOUD_Y - 0.45, blobs[i].c[2] * 0.6], kind: 'wan' };
    });

    /* --- Paquets de dades --- */
    const packets = [];
    function spawnPacket() {
      const wan = Math.random() < 0.45;
      const link = wan ? uplinks[Math.floor(Math.random() * uplinks.length)] : links[Math.floor(Math.random() * links.length)];
      const forward = Math.random() < 0.5;
      packets.push({
        link: link,
        t: 0,
        forward: forward,
        speed: wan ? 0.009 + Math.random() * 0.006 : 0.012 + Math.random() * 0.01,
        // Pujada (cian) o baixada (taronja) si va pel WAN; violeta si és xarxa local
        kind: wan ? (forward ? 'up' : 'down') : 'lan'
      });
    }
    for (let i = 0; i < 18; i++) { spawnPacket(); packets[i].t = Math.random(); }

    /* --- Projecció en perspectiva --- */
    function project(x, y, z) {
      const c = Math.cos(yaw), s = Math.sin(yaw);
      const xr = x * c - z * s, zr = x * s + z * c;
      const cp = Math.cos(pitch), sp = Math.sin(pitch);
      const yv = (y - 1.1) * cp - zr * sp;
      const d = (y - 1.1) * sp + zr * cp;
      const persp = 7 / (7 - d);
      return { x: width / 2 + xr * scale * persp, y: height * 0.52 - yv * scale * persp, d: d, s: persp };
    }
    function lerp3(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }

    /* --- Prismes (servidors, clients i encaminador) --- */
    function boxFaces(cx, y0, cz, w, h, d, rgb) {
      const x0 = cx - w / 2, x1 = cx + w / 2, z0 = cz - d / 2, z1 = cz + d / 2, y1 = y0 + h;
      const quads = [
        { n: [0, 1, 0], l: 1.15, p: [[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]] },
        { n: [0, 0, 1], l: 0.85, p: [[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]] },
        { n: [0, 0, -1], l: 0.85, p: [[x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0]] },
        { n: [1, 0, 0], l: 0.7, p: [[x1, y0, z0], [x1, y0, z1], [x1, y1, z1], [x1, y1, z0]] },
        { n: [-1, 0, 0], l: 0.7, p: [[x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0]] }
      ];
      const c = Math.cos(yaw), s = Math.sin(yaw), sp = Math.sin(pitch), cp = Math.cos(pitch);
      const out = [];
      quads.forEach(function (q) {
        const nz = q.n[0] * s + q.n[2] * c;
        if (q.n[1] * sp + nz * cp <= 0.001) return; // cara posterior
        const col = rgb.map(function (v) { return Math.min(255, Math.round(v * q.l)); });
        out.push({ pts: q.p.map(function (v) { return project(v[0], v[1], v[2]); }), fill: 'rgb(' + col.join(',') + ')' });
      });
      return out;
    }

    function drawPoly(pts, fill, stroke) {
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
      ctx.closePath();
      ctx.fillStyle = fill; ctx.fill();
      if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1; ctx.stroke(); }
    }

    /* --- Dibuix --- */
    function draw() {
      if (!width) return;
      const P = palette();
      ctx.clearRect(0, 0, width, height);

      // 1. Graella del sòl (pla de xarxa)
      ctx.lineWidth = 1;
      for (let i = -4; i <= 4; i++) {
        const fade = 1 - Math.abs(i) / 5;
        ctx.strokeStyle = 'rgba(' + P.grid + ',' + (P.gridA * fade).toFixed(3) + ')';
        let a = project(i * 0.8, 0, -3.4), b = project(i * 0.8, 0, 3.4);
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        a = project(-3.4, 0, i * 0.8); b = project(3.4, 0, i * 0.8);
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      }

      // 2. Enllaços de la xarxa local
      links.forEach(function (l) {
        const a = project(l.a[0], 0.02, l.a[2]), b = project(l.b[0], 0.02, l.b[2]);
        ctx.strokeStyle = 'rgba(' + P.lan + ',' + (l.faint ? 0.18 : 0.38) + ')';
        ctx.lineWidth = l.faint ? 1 : 1.6;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      });

      // 3. Nodes i encaminador, ordenats de lluny a prop
      const solids = nodes.map(function (n) {
        const h = n.type === 'server' ? 0.62 : 0.3;
        const w = n.type === 'server' ? 0.34 : 0.66;
        return { n: n, depth: project(n.pos[0], h / 2, n.pos[2]).d, w: w, h: h, d: n.type === 'server' ? 0.34 : 0.32, rgb: n.type === 'server' ? P.server : P.node };
      });
      solids.push({ router: true, depth: project(0, 0.15, 0).d, w: 0.62, h: 0.3, d: 0.62, rgb: P.router });
      solids.sort(function (a, b) { return a.depth - b.depth; });
      solids.forEach(function (o) {
        const pos = o.router ? ROUTER : o.n.pos;
        if (o.n && o.n.type === 'client') {
          // Camió frigorífic: semiremolc + equip de fred + cabina, ordenats per profunditat
          const parts = [
            { x: pos[0] - 0.07, y: 0.05, w: 0.5, h: 0.24, d: 0.22, rgb: P.trailer },
            { x: pos[0] + 0.2, y: 0.12, w: 0.05, h: 0.12, d: 0.16, rgb: P.reefer },
            { x: pos[0] + 0.32, y: 0.05, w: 0.16, h: 0.2, d: 0.22, rgb: P.cab }
          ].map(function (pt) { pt.depth = project(pt.x, pt.y + pt.h / 2, pos[2]).d; return pt; })
            .sort(function (a, b) { return a.depth - b.depth; });
          parts.forEach(function (pt) {
            boxFaces(pt.x, pt.y, pos[2], pt.w, pt.h, pt.d, pt.rgb).forEach(function (f) { drawPoly(f.pts, f.fill, P.edge); });
          });
        } else {
          boxFaces(pos[0], 0, pos[2], o.w, o.h, o.d, o.rgb).forEach(function (f) { drawPoly(f.pts, f.fill, P.edge); });
        }
        // LED d'activitat
        const blink = o.router ? 0.6 + 0.4 * Math.sin(time * 0.2) : 0.35 + 0.65 * Math.max(0, Math.sin(time * 0.09 + o.n.phase));
        const ledPos = project(pos[0], o.h + 0.03, pos[2]);
        ctx.fillStyle = 'rgba(' + (o.router ? P.up : P.led) + ',' + blink.toFixed(2) + ')';
        ctx.beginPath(); ctx.arc(ledPos.x, ledPos.y, (o.router ? 3.2 : 2.3) * ledPos.s, 0, TAU); ctx.fill();
      });

      // 4. Enllaços amb el núvol (feixos verticals)
      uplinks.forEach(function (u) {
        const a = project(u.a[0], u.a[1], u.a[2]), b = project(u.b[0], u.b[1], u.b[2]);
        const g = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
        g.addColorStop(0, 'rgba(' + P.up + ', 0.15)');
        g.addColorStop(1, 'rgba(' + P.up + ', 0.75)');
        ctx.strokeStyle = g; ctx.lineWidth = 2.2;
        ctx.setLineDash([5, 6]);
        ctx.lineDashOffset = -time * 0.6;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      });
      ctx.setLineDash([]);

      // 5. Paquets de dades amb estela
      packets.forEach(function (pk) {
        const color = pk.kind === 'up' ? P.up : (pk.kind === 'down' ? P.down : P.lan);
        const yA = pk.link.kind === 'wan' ? pk.link.a[1] : 0.05;
        const yB = pk.link.kind === 'wan' ? pk.link.b[1] : 0.05;
        const A = [pk.link.a[0], yA, pk.link.a[2]], B = [pk.link.b[0], yB, pk.link.b[2]];
        for (let k = 4; k >= 0; k--) {
          let tt = pk.t - k * 0.035;
          if (tt < 0) continue;
          if (!pk.forward) tt = 1 - tt;
          const p = project.apply(null, lerp3(A, B, tt));
          const alpha = k === 0 ? 1 : 0.5 - k * 0.1;
          ctx.fillStyle = 'rgba(' + color + ',' + alpha.toFixed(2) + ')';
          ctx.beginPath(); ctx.arc(p.x, p.y, (k === 0 ? 3.6 : 2.6 - k * 0.3) * p.s, 0, TAU); ctx.fill();
          if (k === 0) {
            ctx.fillStyle = 'rgba(' + color + ', 0.18)';
            ctx.beginPath(); ctx.arc(p.x, p.y, 8 * p.s, 0, TAU); ctx.fill();
          }
        }
      });

      // 6. Núvol de computació
      const cc = project(0, CLOUD_Y + 0.1, 0);
      const glow = ctx.createRadialGradient(cc.x, cc.y, 0, cc.x, cc.y, scale * 1.9);
      glow.addColorStop(0, 'rgba(' + P.cloudCore + ', 0.32)');
      glow.addColorStop(1, 'rgba(' + P.cloudCore + ', 0)');
      ctx.fillStyle = glow;
      ctx.beginPath(); ctx.arc(cc.x, cc.y, scale * 1.9, 0, TAU); ctx.fill();

      const projected = cloudPts.map(function (c) {
        const p = project(c.p[0], c.p[1], c.p[2]);
        p.tw = c.tw; return p;
      }).sort(function (a, b) { return a.d - b.d; });
      projected.forEach(function (p) {
        const front = Math.max(0, Math.min(1, (p.d + 1.4) / 2.8));
        const twinkle = 0.75 + 0.25 * Math.sin(time * 0.06 + p.tw);
        ctx.fillStyle = 'rgba(' + P.cloud + ',' + ((0.25 + 0.7 * front) * twinkle).toFixed(3) + ')';
        ctx.beginPath(); ctx.arc(p.x, p.y, (1.3 + 1.6 * front) * p.s, 0, TAU); ctx.fill();
      });

      // 7. Nucli de càlcul: tres processadors que bateguen dins del núvol
      [[-0.45, 0], [0, 0.2], [0.45, 0]].forEach(function (o, i) {
        const pulse = 0.85 + 0.15 * Math.sin(time * 0.08 + i * 2);
        const size = 0.26 * pulse;
        const coreRGB = palette().router;
        boxFaces(o[0], CLOUD_Y - 0.1 + o[1], 0, size, size, size, coreRGB).forEach(function (f) {
          drawPoly(f.pts, f.fill, 'rgba(' + P.cloudCore + ', 0.9)');
        });
      });
    }

    function step() {
      if (!running) return;
      time += 1;
      if (!dragging) yaw += autoSpin;
      for (let i = packets.length - 1; i >= 0; i--) {
        packets[i].t += packets[i].speed;
        if (packets[i].t > 1.15) { packets.splice(i, 1); spawnPacket(); }
      }
      draw();
      rafId = requestAnimationFrame(step);
    }

    function resize() {
      const rect = holder.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width; height = rect.height;
      if (!width || !height) return;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      scale = Math.min(width, height) / 6.3;
      draw();
    }

    function start() {
      resize();
      if (reduceMotion.matches) { draw(); return; }
      if (running) return;
      running = true;
      rafId = requestAnimationFrame(step);
    }
    function stop() {
      running = false;
      if (rafId) cancelAnimationFrame(rafId);
      rafId = null;
    }

    // Arrossegar per a girar
    let dragging = false, lastX = 0, lastY = 0;
    holder.addEventListener('pointerdown', function (e) {
      dragging = true; lastX = e.clientX; lastY = e.clientY;
      holder.setPointerCapture(e.pointerId);
    });
    holder.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      yaw += (e.clientX - lastX) * 0.008;
      pitch = Math.max(0.12, Math.min(0.95, pitch + (e.clientY - lastY) * 0.004));
      lastX = e.clientX; lastY = e.clientY;
      if (!running) draw();
    });
    function endDrag() { dragging = false; }
    holder.addEventListener('pointerup', endDrag);
    holder.addEventListener('pointercancel', endDrag);

    if ('ResizeObserver' in window) {
      new ResizeObserver(function () { if (slide.classList.contains('is-active')) resize(); }).observe(holder);
    }

    return {
      sync: function () { if (slide.classList.contains('is-active')) start(); else stop(); },
      redraw: function () { if (!running) draw(); }
    };
  })();

  /* ---------- Inici ---------- */
  function slideFromHash() {
    const hash = window.location.hash.replace('#', '');
    if (!/^\d+$/.test(hash)) return null; // p. ex. #deck (enllaç de salt)
    return parseInt(hash, 10) - 1;
  }

  window.addEventListener('hashchange', function () {
    const target = slideFromHash();
    if (target !== null && target !== current) goTo(target, { focusHeading: true });
  });

  renderIcons();

  // Idioma: ?lang=es a l'URL > preferència desada > valencià
  const urlLang = new URLSearchParams(window.location.search).get('lang');
  const savedLang = storageGet('deck-lang');
  applyLanguage(LANGS.indexOf(urlLang) !== -1 ? urlLang : (savedLang || DEFAULT_LANG), { persist: !!urlLang });

  // Tema: preferència desada > mode nit (pensat per a projector)
  applyTheme(storageGet('deck-theme') === 'light' ? 'light' : 'dark', { persist: false });

  const start = slideFromHash();
  goTo(start === null ? 0 : start, { announce: false });
})();
