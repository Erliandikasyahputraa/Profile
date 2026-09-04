/**
 * theme.js — Ultra-Smooth Organic Ink Splash Theme Transition (60-120 FPS)
 *
 * Architecture:
 *   • Hardware-accelerated SVG organic ink wave + trailing satellite droplets.
 *   • Multi-lobed dynamic Bezier spline for natural fluid/liquid spreading.
 *   • Zero heavy raster filters (feDisplacement/feTurbulence) to prevent GPU/CPU bottleneck.
 *   • Crisp, snappy, buttery smooth transition across all devices.
 */
(function () {
  const KEY = 'portfolio-theme';
  const DURATION = 360; // ms — crisp, snappy liquid bloom

  /* ── Apply theme ─────────────────────────── */
  function applyTheme(t) {
    document.documentElement.setAttribute('data-theme', t);
  }

  /* ── Read initial theme before paint (Default: light) ── */
  const stored = localStorage.getItem(KEY);
  const initial = (stored === 'dark' || stored === 'light') ? stored : 'light';
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
    return 1 - Math.pow(1 - t, 3.2);
  }

  function runTransition(btn) {
    const next = current === 'light' ? 'dark' : 'light';

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      current = next; applyTheme(current); localStorage.setItem(KEY, current); return;
    }
    if (animating) {
      current = next; applyTheme(current); localStorage.setItem(KEY, current); return;
    }
    animating = true;

    /* Origin = button center */
    const rect = btn.getBoundingClientRect();
    const ox = rect.left + rect.width / 2;
    const oy = rect.top + rect.height / 2;

    /* Max required radius to cover entire screen from origin */
    const maxDist = Math.hypot(
      Math.max(ox, window.innerWidth - ox),
      Math.max(oy, window.innerHeight - oy)
    );
    const R = Math.ceil(maxDist) * 1.25 + 60;

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

    // 14-lobe organic fluid blob parameters (varying radii and tendril reach)
    const NUM_LOBES = 14;
    const lobeOffsets = [];
    for (let i = 0; i < NUM_LOBES; i++) {
      // Create natural organic asymmetry (some lobes reach 1.18x, some 0.82x)
      const angle = (i / NUM_LOBES) * Math.PI * 2;
      const reach = 0.85 + Math.sin(i * 1.9 + 0.4) * 0.16 + Math.cos(i * 3.1) * 0.12;
      const speed = 0.95 + Math.sin(i * 2.3) * 0.22;
      lobeOffsets.push({ angle, reach, speed });
    }

    // Main organic ink splatter path
    const mainPath = document.createElementNS(NS, 'path');
    mainPath.setAttribute('fill', inkFill);
    svg.appendChild(mainPath);

    // 6 Satellite organic droplets that surge forward like splashing ink
    const DROPLETS = [
      { angle: -0.45, distMul: 0.85, rMul: 0.38, sp: 1.35 },
      { angle:  0.85, distMul: 0.90, rMul: 0.42, sp: 1.45 },
      { angle:  2.30, distMul: 0.78, rMul: 0.32, sp: 1.30 },
      { angle: -2.10, distMul: 0.88, rMul: 0.36, sp: 1.40 },
      { angle: -1.25, distMul: 0.92, rMul: 0.28, sp: 1.50 },
      { angle:  1.65, distMul: 0.82, rMul: 0.34, sp: 1.35 },
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
      if (rawT >= 0.55 && !switched) {
        switched = true;
        current = next;
        applyTheme(current);
        localStorage.setItem(KEY, current);
      }

      if (rawT < 1.0) {
        requestAnimationFrame(frame);
      } else {
        // Silky fade out of the ink layer
        svg.style.transition = 'opacity 140ms ease-out';
        svg.style.opacity = '0';
        setTimeout(() => {
          svg.remove();
          animating = false;
        }, 160);
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
