/**
 * theme.js — Optimized Organic Ink Splash Theme Transition (60-120 FPS)
 *
 * Architecture:
 *   • Hardware-accelerated SVG organic ink wave + satellite droplets expanding from the toggle button.
 *   • Dynamic Catmull-Rom Bezier spline for natural fluid/liquid spreading.
 *   • Pure vector math (zero heavy CPU filter bottlenecks) for buttery smooth performance.
 *   • 680ms tactile duration for noticeable organic feel.
 *   • Respects prefers-reduced-motion for instant switching when requested.
 */
(function () {
  const KEY = 'portfolio-theme';
  const DURATION = 680; // ms — tactile, noticeable organic liquid bloom

  /* ── Apply theme ─────────────────────────── */
  function applyTheme(t) {
    document.documentElement.setAttribute('data-theme', t);
  }

  /* ── Read initial theme before paint (Default: dark) ── */
  const stored = localStorage.getItem(KEY);
  const initial = (stored === 'dark' || stored === 'light') ? stored : 'dark';
  applyTheme(initial);

  /* ── Runtime ─────────────────────────────── */
  const NS = 'http://www.w3.org/2000/svg';
  let current = initial;
  let animating = false;

  // Catmull-Rom to smooth closed Cardinal spline for organic fluid droplet
  function getOrganicSplinePath(points) {
    const n = points.length;
    let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)} `;
    for (let i = 0; i < n; i++) {
      const p0 = points[(i - 1 + n) % n];
      const p1 = points[i];
      const p2 = points[(i + 1) % n];
      const p3 = points[(i + 2) % n];

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      d += `C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)} `;
    }
    return d + 'Z';
  }

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3.0);
  }

  function runTransition(btn) {
    const next = current === 'light' ? 'dark' : 'light';

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      current = next;
      applyTheme(current);
      try { localStorage.setItem(KEY, current); } catch (e) {}
      return;
    }
    if (animating) {
      current = next;
      applyTheme(current);
      try { localStorage.setItem(KEY, current); } catch (e) {}
      return;
    }
    animating = true;

    // 1. Mobile Haptic Feedback (crisp 12ms tactile pulse)
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try { navigator.vibrate(12); } catch (e) {}
    }

    // 2. Micro-Interaction: Button icon rotation & tactile pop
    document.querySelectorAll('#themeToggle, #themeToggleMobile').forEach(b => {
      b.classList.add('is-popping');
      setTimeout(() => b.classList.remove('is-popping'), 400);
    });

    // 3. Dynamic GPU Layer Promotion (smooth 60-120 FPS compositing)
    document.documentElement.classList.add('theme-transitioning');

    /* Origin = button center */
    const rect = btn && btn.getBoundingClientRect ? btn.getBoundingClientRect() : { left: window.innerWidth - 60, top: 30, width: 40, height: 40 };
    const ox = rect.left + rect.width / 2;
    const oy = rect.top + rect.height / 2;

    /* Max required radius to cover entire screen from origin */
    const maxDist = Math.hypot(
      Math.max(ox, window.innerWidth - ox),
      Math.max(oy, window.innerHeight - oy)
    );
    const R = Math.ceil(maxDist) * 1.22 + 50;

    const inkFill = next === 'dark' ? '#000000' : '#ffffff';

    /* Create SVG overlay */
    const svg = document.createElementNS(NS, 'svg');
    svg.style.cssText = [
      'position:fixed',
      'inset:0',
      `width:${window.innerWidth}px`,
      `height:${window.innerHeight}px`,
      'pointer-events:none',
      'z-index:99990',
      'will-change:opacity,transform',
      'transform:translateZ(0)',
    ].join(';');
    svg.setAttribute('xmlns', NS);

    // 12-lobe organic fluid blob parameters
    const NUM_LOBES = 12;
    const lobeOffsets = [];
    for (let i = 0; i < NUM_LOBES; i++) {
      const angle = (i / NUM_LOBES) * Math.PI * 2;
      const reach = 0.88 + Math.sin(i * 1.8 + 0.3) * 0.15 + Math.cos(i * 3.0) * 0.10;
      const speed = 0.95 + Math.sin(i * 2.2) * 0.18;
      lobeOffsets.push({ angle, reach, speed });
    }

    // Main organic ink splatter path
    const mainPath = document.createElementNS(NS, 'path');
    mainPath.setAttribute('fill', inkFill);
    svg.appendChild(mainPath);

    // 5 Satellite organic droplets
    const DROPLETS = [
      { angle: -0.45, distMul: 0.85, rMul: 0.35, sp: 1.35 },
      { angle:  0.85, distMul: 0.90, rMul: 0.38, sp: 1.40 },
      { angle:  2.30, distMul: 0.78, rMul: 0.30, sp: 1.30 },
      { angle: -2.10, distMul: 0.88, rMul: 0.34, sp: 1.38 },
      { angle:  1.65, distMul: 0.82, rMul: 0.32, sp: 1.35 },
    ];

    const dropletEls = DROPLETS.map(d => {
      const c = document.createElementNS(NS, 'circle');
      c.setAttribute('fill', inkFill);
      c.setAttribute('cx', ox);
      c.setAttribute('cy', oy);
      c.setAttribute('r', '0');
      svg.appendChild(c);
      return { el: c, ...d };
    });

    document.body.appendChild(svg);

    const startTime = performance.now();
    let switched = false;

    function frame(now) {
      const elapsed = now - startTime;
      const rawT = Math.min(1.0, elapsed / DURATION);
      const easeT = easeOutCubic(rawT);

      // Compute current organic spline points
      const points = lobeOffsets.map(l => {
        const localT = Math.min(1.0, rawT * l.speed);
        const localEase = easeOutCubic(localT);
        const r = R * l.reach * localEase;
        return {
          x: ox + Math.cos(l.angle) * r,
          y: oy + Math.sin(l.angle) * r,
        };
      });

      mainPath.setAttribute('d', getOrganicSplinePath(points));

      // Animate satellite droplets
      dropletEls.forEach(d => {
        const localT = Math.min(1.0, rawT * d.sp);
        const localEase = easeOutCubic(localT);
        const dist = R * d.distMul * localEase;
        const curR = R * d.rMul * localEase;
        d.el.setAttribute('cx', ox + Math.cos(d.angle) * dist);
        d.el.setAttribute('cy', oy + Math.sin(d.angle) * dist);
        d.el.setAttribute('r', curR);
      });

      // Switch theme when screen is fully blanketed by ink
      if (rawT >= 0.52 && !switched) {
        switched = true;
        current = next;
        applyTheme(current);
        try { localStorage.setItem(KEY, current); } catch (e) {}
      }

      if (rawT < 1.0) {
        requestAnimationFrame(frame);
      } else {
        // Silky fade out of the ink layer
        svg.style.transition = 'opacity 220ms ease-out';
        svg.style.opacity = '0';
        setTimeout(() => {
          svg.remove();
          animating = false;
          document.documentElement.classList.remove('theme-transitioning');
        }, 240);
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
