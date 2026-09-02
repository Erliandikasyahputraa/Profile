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

  /* ── Read initial theme before paint (Default: light) ── */
  const stored  = localStorage.getItem(KEY);
  // Default is strictly 'light' unless user has explicitly saved a preference
  const initial = (stored === 'dark' || stored === 'light') ? stored : 'light';
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

    /* Diagonal from origin = max radius needed + safety padding */
    const R = Math.ceil(Math.hypot(
      Math.max(ox, window.innerWidth  - ox),
      Math.max(oy, window.innerHeight - oy)
    )) * 1.18 + 80;

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
    turb.setAttribute('baseFrequency', '0.016 0.018');
    turb.setAttribute('numOctaves', '2');
    turb.setAttribute('seed', '42');
    turb.setAttribute('result', 'noise');

    /* Step 2: displace circles with the noise → organic dripping edges */
    const disp = document.createElementNS(NS, 'feDisplacementMap');
    disp.setAttribute('in', 'SourceGraphic');
    disp.setAttribute('in2', 'noise');
    disp.setAttribute('scale', '30');
    disp.setAttribute('xChannelSelector', 'R');
    disp.setAttribute('yChannelSelector', 'G');
    disp.setAttribute('result', 'displaced');

    /* Step 3: blur heavily to create goo merging zones between blobs */
    const blur = document.createElementNS(NS, 'feGaussianBlur');
    blur.setAttribute('in', 'displaced');
    blur.setAttribute('stdDeviation', '18');
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
      { dx:   0,  dy:   0, mR: 1.04, sp: 1.00 }, // main expanding liquid mass
      { dx: 140,  dy:-100, mR: 0.65, sp: 1.35 }, // organic leading tendril top-right
      { dx:-120,  dy:  90, mR: 0.58, sp: 1.25 }, // bottom-left
      { dx: 120,  dy: 110, mR: 0.52, sp: 1.40 }, // bottom-right
      { dx:-110,  dy: -80, mR: 0.48, sp: 1.20 }, // top-left
      { dx:  60,  dy:-150, mR: 0.45, sp: 1.50 }, // upper reach
      { dx: -70,  dy: 140, mR: 0.42, sp: 1.30 }, // lower reach
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

    /* ── Silky smooth cubic ease-out ─────────────────── */
    function easeOut(t) {
      return 1 - Math.pow(1 - t, 2.8);
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

      /* Switch theme when screen is fully covered by liquid ink mass */
      if (t >= 0.64 && !switched) {
        switched = true;
        current  = next;
        applyTheme(current);
        localStorage.setItem(KEY, current);
      }

      if (t < 1) {
        requestAnimationFrame(frame);
      } else {
        /* Smooth, velvety fade overlay out */
        svg.style.transition = 'opacity 260ms cubic-bezier(0.16, 1, 0.3, 1)';
        svg.style.opacity    = '0';
        setTimeout(() => {
          svg.remove();
          animating = false;
        }, 280);
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
