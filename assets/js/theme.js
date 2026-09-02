/**
 * theme.js — VENOM / INK SPREAD Theme Transition (v4)
 *
 * Uses SVG goo filter (feTurbulence → feDisplacementMap → feGaussianBlur → feColorMatrix)
 * to create an organic "venom symbiote / ink blob" spreading effect.
 *
 * A main blob + 6 tendrils grow from the toggle button origin.
 * The feTurbulence distorts each circle's edges into organic drips/tendrils,
 * while feGaussianBlur + feColorMatrix makes overlapping blobs merge into
 * one continuous liquid mass — the classic "goo" effect.
 *
 * References: Lucas Bebber's SVG Goo technique.
 */
(function () {
  const KEY      = 'portfolio-theme';
  const DURATION = 850; // ms — slightly slower for dramatic effect

  /* ── Apply theme ─────────────────────────── */
  function applyTheme(t) {
    document.documentElement.setAttribute('data-theme', t);
  }

  /* ── Read initial theme before paint ──────── */
  const stored  = localStorage.getItem(KEY);
  const initial = stored === 'dark' || stored === 'light'
    ? stored
    : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  applyTheme(initial);

  /* ── Runtime ─────────────────────────────── */
  const NS = 'http://www.w3.org/2000/svg';
  let current   = initial;
  let animating = false;

  function runTransition(btn) {
    const next = current === 'light' ? 'dark' : 'light';

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      current = next; applyTheme(current); localStorage.setItem(KEY, current); return;
    }
    if (animating) {
      current = next; applyTheme(current); localStorage.setItem(KEY, current); return;
    }
    animating = true;

    /* Origin = button centre */
    const rect = btn.getBoundingClientRect();
    const ox   = rect.left + rect.width  / 2;
    const oy   = rect.top  + rect.height / 2;

    /* Diagonal from origin = max radius needed */
    const R = Math.ceil(Math.hypot(
      Math.max(ox, window.innerWidth  - ox),
      Math.max(oy, window.innerHeight - oy)
    )) + 50;

    const inkFill = next === 'dark' ? '#000000' : '#ffffff';

    /* ── Create SVG overlay ──────────────────── */
    const svg = document.createElementNS(NS, 'svg');
    svg.style.cssText = [
      'position:fixed', 'inset:0',
      `width:${window.innerWidth}px`,
      `height:${window.innerHeight}px`,
      'pointer-events:none', 'z-index:9999',
    ].join(';');
    svg.setAttribute('xmlns', NS);

    /* Goo filter — turbulence displaces edges → blur → threshold alpha */
    const defs   = document.createElementNS(NS, 'defs');
    const filter = document.createElementNS(NS, 'filter');
    filter.id    = 'venomGoo';
    filter.setAttribute('x', '-20%'); filter.setAttribute('y', '-20%');
    filter.setAttribute('width', '140%'); filter.setAttribute('height', '140%');
    filter.setAttribute('color-interpolation-filters', 'sRGB');

    /* Step 1: fractal noise as displacement source */
    const turb = document.createElementNS(NS, 'feTurbulence');
    turb.setAttribute('type', 'fractalNoise');
    turb.setAttribute('baseFrequency', '0.019 0.021');
    turb.setAttribute('numOctaves', '2');
    turb.setAttribute('seed', '42');
    turb.setAttribute('result', 'noise');

    /* Step 2: displace circles with the noise → organic dripping edges */
    const disp = document.createElementNS(NS, 'feDisplacementMap');
    disp.setAttribute('in', 'SourceGraphic');
    disp.setAttribute('in2', 'noise');
    disp.setAttribute('scale', '32');
    disp.setAttribute('xChannelSelector', 'R');
    disp.setAttribute('yChannelSelector', 'G');
    disp.setAttribute('result', 'displaced');

    /* Step 3: blur heavily to create goo merging zones between blobs */
    const blur = document.createElementNS(NS, 'feGaussianBlur');
    blur.setAttribute('in', 'displaced');
    blur.setAttribute('stdDeviation', '16');
    blur.setAttribute('result', 'blur');

    /* Step 4: threshold alpha back to solid — creates merged organic mass */
    const matrix = document.createElementNS(NS, 'feColorMatrix');
    matrix.setAttribute('in', 'blur');
    matrix.setAttribute('mode', 'matrix');
    /* RGB: pass through | Alpha: multiply 26 then offset -9 → sharp merged edges */
    matrix.setAttribute('values', '1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 26 -9');

    [turb, disp, blur, matrix].forEach(f => filter.appendChild(f));
    defs.appendChild(filter);
    svg.appendChild(defs);

    /* Group with goo filter applied */
    const g = document.createElementNS(NS, 'g');
    g.setAttribute('filter', 'url(#venomGoo)');
    svg.appendChild(g);
    document.body.appendChild(svg);

    /* ── Tendril definitions ─────────────────
       Each tendril: circle whose centre drifts from origin
       and radius grows to fill coverage area.
       dx,dy = final drift offset from origin (pixels)
       mR    = final radius (fraction of R)
       sp    = speed multiplier (>1 = faster, creates "leading" tendrils)   */
    const TENDRILS = [
      { dx:   0,  dy:   0, mR: 1.00, sp: 1.00 }, // main blob (covers all)
      { dx: 130,  dy: -90, mR: 0.60, sp: 1.50 }, // right-up tendril
      { dx:-110,  dy:  80, mR: 0.50, sp: 1.30 }, // left-down
      { dx: 110,  dy: 100, mR: 0.48, sp: 1.55 }, // right-down
      { dx:-100,  dy: -70, mR: 0.44, sp: 1.25 }, // left-up
      { dx:  50,  dy:-140, mR: 0.42, sp: 1.70 }, // straight up
      { dx: -60,  dy: 130, mR: 0.38, sp: 1.40 }, // down-left
    ];

    const circles = TENDRILS.map(t => {
      const c = document.createElementNS(NS, 'circle');
      c.setAttribute('cx', ox);
      c.setAttribute('cy', oy);
      c.setAttribute('r',  '0');
      c.setAttribute('fill', inkFill);
      g.appendChild(c);
      return { el: c, ...t };
    });

    /* ── Easing ────────────────────────────── */
    function easeOut(t) {
      // Exponential ease-out: fast start, slows at edges
      return 1 - Math.pow(1 - t, 2.5);
    }

    /* ── rAF animation loop ─────────────────── */
    const startTime = performance.now();
    let switched = false;

    function frame(now) {
      const raw = (now - startTime) / DURATION;
      const t   = Math.min(raw, 1);

      circles.forEach(c => {
        /* Each tendril has its own local time based on speed */
        const lt = Math.min(t * c.sp, 1);
        const et = easeOut(lt);
        c.el.setAttribute('cx', ox + c.dx * et);
        c.el.setAttribute('cy', oy + c.dy * et);
        c.el.setAttribute('r',  c.mR * R * et);
      });

      /* Switch theme when main blob is ~45% through viewport */
      if (t >= 0.45 && !switched) {
        switched = true;
        current  = next;
        applyTheme(current);
        localStorage.setItem(KEY, current);
      }

      if (t < 1) {
        requestAnimationFrame(frame);
      } else {
        /* Fade overlay out */
        svg.style.transition = 'opacity 140ms linear';
        svg.style.opacity    = '0';
        setTimeout(() => { svg.remove(); animating = false; }, 150);
      }
    }

    requestAnimationFrame(frame);
  }

  /* ── Bind toggles ────────────────────────── */
  function bindToggles() {
    document.querySelectorAll('#themeToggle, #themeToggleMobile').forEach(btn => {
      btn.addEventListener('click', () => runTransition(btn));
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindToggles);
  } else {
    bindToggles();
  }
})();
