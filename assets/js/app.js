/**
 * app.js — Master Controller for Erliandika Syahputra Portfolio
 *
 * Architecture:
 *   • Single source of truth: window.PORTFOLIO_DATA
 *   • Home Page: Centered Hero, Profile Glitch, Winding Experience Preview, 5-Project Horizontal Carousel
 *   • Projects Page: Editorial 1 Project Per Row Archive (No popups / modals)
 *   • Project Detail Page: Dedicated 30% / 40% / 30% Case Study with Showcase Hover Preview
 *   • Experience Page: Full Interactive Winding Journey Map, Detailed Milestone Cards, Certifications Grid
 *   • Pure Black & White / Minimalist / High Performance
 */

document.addEventListener('DOMContentLoaded', () => {
  const D = window.PORTFOLIO_DATA;
  if (!D) {
    console.warn('[app.js] PORTFOLIO_DATA not loaded');
    return;
  }

  /* ── Page Detection & Path Helpers ── */
  const has = (id) => !!document.getElementById(id);
  const IS = {
    home:     has('hero') || has('expPreviewMap'),
    projects: has('projectRows'),
    detail:   has('pdetailRoot'),
    exp:      has('expFullMap') || has('certsGrid'),
  };

  const pathLower = (window.location.pathname || '').toLowerCase();
  const IS_PAGES = pathLower.includes('/pages/') || pathLower.includes('\\pages\\') || document.querySelector('link[href*="../assets/"]') !== null;
  const ROOT_REL = IS_PAGES ? '../' : './';
  const PAGES_REL = IS_PAGES ? '' : 'pages/';

  function resolveAsset(p) {
    if (!p || typeof p !== 'string' || p.startsWith('http') || p.startsWith('//') || p.startsWith('data:')) return p;
    return IS_PAGES ? '../' + p.replace(/^\.\//, '') : p;
  }

  /* ── Minimalist Vector Image Fallback ── */
  function getProjectSvgPlaceholder(title, category) {
    const cleanTitle = (title || 'Project').replace(/[<>&"]/g, '');
    const cleanCat = (category || 'SOFTWARE').toUpperCase().replace(/[<>&"]/g, '');
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 375" width="100%" height="100%" style="background:#121212;display:block;"><rect width="100%" height="100%" fill="#121212"/><line x1="24" y1="24" x2="64" y2="24" stroke="rgba(255,255,255,0.2)" stroke-width="1.5"/><line x1="24" y1="24" x2="24" y2="64" stroke="rgba(255,255,255,0.2)" stroke-width="1.5"/><line x1="576" y1="351" x2="536" y2="351" stroke="rgba(255,255,255,0.2)" stroke-width="1.5"/><line x1="576" y1="351" x2="576" y2="311" stroke="rgba(255,255,255,0.2)" stroke-width="1.5"/><circle cx="300" cy="155" r="46" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="1.5" stroke-dasharray="4 4"/><circle cx="300" cy="155" r="22" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="1.5"/><text x="300" y="235" fill="#ffffff" font-family="'Space Grotesk', system-ui, sans-serif" font-size="20" font-weight="700" text-anchor="middle" letter-spacing="-0.5">${cleanTitle}</text><text x="300" y="260" fill="rgba(255,255,255,0.45)" font-family="'JetBrains Mono', monospace" font-size="11" font-weight="600" text-anchor="middle" letter-spacing="2">${cleanCat}</text></svg>`;
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }
  function getLoc(item, field) {
    if (typeof window.getLangText === 'function') {
      return window.getLangText(item, field);
    }
    if (!item) return '';
    const lang = window.currentLang || 'en';
    if (lang === 'id' && item[field + '_id']) {
      return item[field + '_id'];
    }
    return item[field] || '';
  }

  /* ── DOM Element Builder Helper ── */
  function el(tag, attrs = {}, children = []) {
    const element = document.createElement(tag);
    for (const [key, val] of Object.entries(attrs)) {
      if (key === 'class') element.className = val;
      else if (key === 'style') element.style.cssText = val;
      else if (key.startsWith('data-')) element.setAttribute(key, val);
      else if (key.startsWith('aria-')) element.setAttribute(key, val);
      else if (key in element) element[key] = val;
      else element.setAttribute(key, val);
    }
    if (typeof children === 'string') {
      element.innerHTML = children;
    } else if (Array.isArray(children)) {
      children.forEach(c => {
        if (typeof c === 'string') element.appendChild(document.createTextNode(c));
        else if (c instanceof Node) element.appendChild(c);
      });
    }
    return element;
  }

  /* ── SVG Element Builder Helper ── */
  const SVG_NS = 'http://www.w3.org/2000/svg';
  function mkSVG(tag, attrs = {}) {
    const elem = document.createElementNS(SVG_NS, tag);
    for (const [k, v] of Object.entries(attrs)) {
      elem.setAttribute(k, v);
    }
    return elem;
  }

  function mkSVGText(text, x, y, className = '', anchor = 'start') {
    const t = mkSVG('text', {
      x: String(x),
      y: String(y),
      class: className,
      'text-anchor': anchor,
    });
    t.textContent = text;
    return t;
  }

  /* ════════════════════════════════════════════
     1. GLOBAL NAVIGATION & HEADER
  ════════════════════════════════════════════ */
  const mobileNav  = document.getElementById('mobileNav');
  const menuBtn    = document.getElementById('mobileMenuBtn');
  const navClose   = document.getElementById('mobileNavClose');

  function openNav() {
    mobileNav?.classList.add('open');
    menuBtn?.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }

  function closeNav() {
    mobileNav?.classList.remove('open');
    menuBtn?.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  menuBtn?.addEventListener('click', openNav);
  navClose?.addEventListener('click', closeNav);
  document.querySelectorAll('[data-mnav]').forEach(a => a.addEventListener('click', closeNav));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeNav(); });

  // CV Button Handler
  document.querySelectorAll('#cvBtn').forEach(btn => {
    if (D.social && D.social.cv) {
      btn.href = D.social.cv;
      btn.classList.remove('disabled');
      btn.removeAttribute('aria-disabled');
    } else {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
      });
    }
  });

  // Active Navbar Link Indicator
  const currentPath = window.location.pathname.toLowerCase();
  document.querySelectorAll('.navbar__link').forEach(link => {
    const href = (link.getAttribute('href') || '').toLowerCase();
    if (
      (currentPath.endsWith('index.html') || currentPath === '/' || currentPath.endsWith('/') || (!currentPath.includes('projects') && !currentPath.includes('experience') && !currentPath.includes('project'))) && href.includes('index.html')
    ) {
      link.classList.add('active');
    } else if (currentPath.includes('projects') && href.includes('projects.html')) {
      link.classList.add('active');
    } else if (currentPath.includes('experience') && href.includes('experience.html')) {
      link.classList.add('active');
    }
  });

  /* ════════════════════════════════════════════
     2. HOME PAGE
  ════════════════════════════════════════════ */
  if (IS.home) {
    initProfileGlitch();
    buildExpPreviewMap();
    buildHomeTrailer();

    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(buildExpPreviewMap, 200);
    }, { passive: true });
  }

  /* ── Cyber Pixel Glitch Sound Synthesizer ── */
  let appAudioCtx = null;
  function getAppAudioCtx() {
    try {
      if (!appAudioCtx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) appAudioCtx = new AudioCtx();
      }
      if (appAudioCtx && appAudioCtx.state === 'suspended') {
        appAudioCtx.resume().catch(() => {});
      }
      return appAudioCtx;
    } catch (e) {
      return null;
    }
  }

  // Prime Web Audio on any user gesture
  ['click', 'pointerdown', 'mousedown', 'keydown', 'touchstart', 'mousemove', 'wheel'].forEach(evt => {
    window.addEventListener(evt, () => {
      const ctx = getAppAudioCtx();
      if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
    }, { passive: true });
  });

  /* ── Dark Cyber Pixel Glitch Sound Synthesizer ── */
  function playPixelGlitchSound(isExit = false) {
    try {
      const actx = getAppAudioCtx();
      if (!actx) return;
      if (actx.state === 'suspended') actx.resume().catch(() => {});
      const now = actx.currentTime;

      const master = actx.createGain();
      const masterVol = isExit ? 0.30 : 0.36;
      master.gain.setValueAtTime(masterVol, now);
      master.connect(actx.destination);

      // 1. Dark Sub-Bass Digital Rumble (Deep sawtooth cyber drone)
      const subOsc = actx.createOscillator();
      const subGain = actx.createGain();
      subOsc.type = 'sawtooth';
      if (isExit) {
        subOsc.frequency.setValueAtTime(80, now);
        subOsc.frequency.exponentialRampToValueAtTime(240, now + 0.16);
      } else {
        subOsc.frequency.setValueAtTime(260, now);
        subOsc.frequency.exponentialRampToValueAtTime(65, now + 0.22);
      }
      subGain.gain.setValueAtTime(0.26, now);
      subGain.gain.exponentialRampToValueAtTime(0.0001, now + (isExit ? 0.18 : 0.24));
      subOsc.connect(subGain);
      subGain.connect(master);
      subOsc.start(now);
      subOsc.stop(now + (isExit ? 0.19 : 0.25));

      // 2. Dark Hollow Digital Noise Bursts (Low-mid bandpass, gritty pixel static)
      const burstOffsets = isExit ? [0, 0.06] : [0, 0.07, 0.14];
      burstOffsets.forEach((offset, idx) => {
        const t = now + offset;
        const bufLen = Math.floor(actx.sampleRate * 0.05);
        const noiseBuf = actx.createBuffer(1, bufLen, actx.sampleRate);
        const data = noiseBuf.getChannelData(0);
        for (let i = 0; i < bufLen; i++) {
          data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufLen * 0.35));
        }
        const noiseSrc = actx.createBufferSource();
        noiseSrc.buffer = noiseBuf;

        const filter = actx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(idx === 0 ? 1100 : (idx === 1 ? 750 : 1350), t);
        filter.Q.setValueAtTime(5.5, t);

        const g = actx.createGain();
        g.gain.setValueAtTime(0.28 - idx * 0.05, t);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.048);

        noiseSrc.connect(filter);
        filter.connect(g);
        g.connect(master);
        noiseSrc.start(t);
        noiseSrc.stop(t + 0.052);
      });

      // 3. Dark Cyber Bitcrush Blip (Square pulse transient)
      const pulseOsc = actx.createOscillator();
      const pulseGain = actx.createGain();
      pulseOsc.type = 'square';
      pulseOsc.frequency.setValueAtTime(isExit ? 120 : 340, now + 0.02);
      pulseOsc.frequency.exponentialRampToValueAtTime(isExit ? 290 : 85, now + (isExit ? 0.14 : 0.20));
      pulseGain.gain.setValueAtTime(0.20, now + 0.02);
      pulseGain.gain.exponentialRampToValueAtTime(0.0001, now + (isExit ? 0.15 : 0.21));
      pulseOsc.connect(pulseGain);
      pulseGain.connect(master);
      pulseOsc.start(now + 0.02);
      pulseOsc.stop(now + (isExit ? 0.16 : 0.22));
    } catch (e) {}
  }

  /* ── Profile Image Pixel Glitch Transition ── */
  function initProfileGlitch() {
    const photoContainer = document.querySelector('.hero__photo');
    if (!photoContainer) return;

    let exitTimer = null;

    const triggerGlitchEnter = () => {
      clearTimeout(exitTimer);
      photoContainer.classList.remove('glitching-out');
      photoContainer.classList.add('glitching');
      playPixelGlitchSound(false);
    };

    const triggerGlitchExit = () => {
      if (!photoContainer.classList.contains('glitching')) return;
      photoContainer.classList.remove('glitching');
      photoContainer.classList.add('glitching-out');
      playPixelGlitchSound(true);
      exitTimer = setTimeout(() => {
        photoContainer.classList.remove('glitching-out');
      }, 550);
    };

    photoContainer.addEventListener('mouseenter', triggerGlitchEnter);
    photoContainer.addEventListener('pointerenter', triggerGlitchEnter);
    photoContainer.addEventListener('touchstart', triggerGlitchEnter, { passive: true });
    photoContainer.addEventListener('click', triggerGlitchEnter);

    photoContainer.addEventListener('mouseleave', triggerGlitchExit);
    photoContainer.addEventListener('pointerleave', triggerGlitchExit);
  }

  /* ── Experience Preview Map (Home Trailer) ── */
  function buildExpPreviewMap() {
    const wrap = document.getElementById('expPreviewMap');
    if (!wrap) return;

    const milestones = D.journeyMilestones || [];
    const isMobile = window.innerWidth < 768;

    wrap.innerHTML = '';

    if (!isMobile) {
      const VW = 1000;
      const VH = 280;

      const svg = mkSVG('svg', {
        viewBox: `0 0 ${VW} ${VH}`,
        width: '100%',
        height: String(VH),
        class: 'exp-map-svg',
        'aria-label': 'Journey preview route',
      });

      // SVG Defs for organic mist & fog gradients
      const defs = mkSVG('defs');
      
      const fog1 = mkSVG('radialGradient', { id: 'fogRadial1', cx: '50%', cy: '50%', r: '50%' });
      fog1.appendChild(mkSVG('stop', { offset: '0%', 'stop-color': 'var(--fg)', 'stop-opacity': '0.18' }));
      fog1.appendChild(mkSVG('stop', { offset: '60%', 'stop-color': 'var(--fg)', 'stop-opacity': '0.06' }));
      fog1.appendChild(mkSVG('stop', { offset: '100%', 'stop-color': 'var(--fg)', 'stop-opacity': '0' }));
      defs.appendChild(fog1);

      const fog2 = mkSVG('radialGradient', { id: 'fogRadial2', cx: '50%', cy: '50%', r: '50%' });
      fog2.appendChild(mkSVG('stop', { offset: '0%', 'stop-color': 'var(--fg)', 'stop-opacity': '0.24' }));
      fog2.appendChild(mkSVG('stop', { offset: '70%', 'stop-color': 'var(--fg)', 'stop-opacity': '0.08' }));
      fog2.appendChild(mkSVG('stop', { offset: '100%', 'stop-color': 'var(--fg)', 'stop-opacity': '0' }));
      defs.appendChild(fog2);

      const fogGlow = mkSVG('radialGradient', { id: 'fogMysteryGlow', cx: '50%', cy: '50%', r: '50%' });
      fogGlow.appendChild(mkSVG('stop', { offset: '0%', 'stop-color': 'var(--fg)', 'stop-opacity': '0.35' }));
      fogGlow.appendChild(mkSVG('stop', { offset: '100%', 'stop-color': 'var(--fg)', 'stop-opacity': '0' }));
      defs.appendChild(fogGlow);

      svg.appendChild(defs);

      // Curved organic winding path leading into the uncharted mist
      const pathD = `
        M 60 140
        C 130 140, 150 80, 205 80
        C 285 80, 345 200, 415 200
        C 495 200, 555 90, 625 90
        C 700 90, 740 170, 795 170
        C 850 170, 895 110, 940 110
      `;

      const path = mkSVG('path', {
        d: pathD,
        class: 'map-path',
      });
      svg.appendChild(path);

      // Start origin dot
      const startDot = mkSVG('circle', {
        cx: '60',
        cy: '140',
        r: '4.5',
        class: 'map-node-start',
      });
      svg.appendChild(startDot);

      const DESKTOP_NODES = [
        { x: 205, y: 80,  textX: 205, textY: 48,  side: 'above', item: milestones[0] },
        { x: 415, y: 200, textX: 415, textY: 232, side: 'below', item: milestones[1] },
        { x: 625, y: 90,  textX: 625, textY: 58,  side: 'above', item: milestones[2] },
        { x: 795, y: 170, textX: 795, textY: 202, side: 'below', item: milestones[3] },
      ];

      // Floating Sneak Peek Card Container (anchored inside wrap)
      const peekCard = el('div', { class: 'map-sneak-peek', 'aria-hidden': 'true' });
      wrap.appendChild(peekCard);

      DESKTOP_NODES.forEach(nd => {
        if (!nd.item) return;

        const badgeText = getLoc(nd.item, 'badge');
        const titleText = getLoc(nd.item, 'title');

        const g = mkSVG('g', {
          class: 'map-node-group',
          tabindex: '0',
          role: 'button',
          'aria-label': `${titleText} (${nd.item.year})`,
        });

        // Outer halo ring
        const ring = mkSVG('circle', {
          cx: String(nd.x),
          cy: String(nd.y),
          r: '9',
          class: 'map-node-ring',
        });
        g.appendChild(ring);

        // Core dot
        const dot = mkSVG('circle', {
          cx: String(nd.x),
          cy: String(nd.y),
          r: '4.5',
          class: 'map-node-core',
        });
        g.appendChild(dot);

        // Label typography
        const isAbove = nd.side === 'above';
        const anchor = nd.x > VW * 0.85 ? 'end' : (nd.x < VW * 0.2 ? 'start' : 'middle');

        g.appendChild(mkSVGText(badgeText, nd.textX, isAbove ? nd.textY - 14 : nd.textY, 'map-label-tag', anchor));
        g.appendChild(mkSVGText(nd.item.year, nd.textX, isAbove ? nd.textY : nd.textY + 14, 'map-label-year', anchor));
        g.appendChild(mkSVGText(titleText, nd.textX, isAbove ? nd.textY + 16 : nd.textY + 30, 'map-label-title', anchor));

        // Exact Hover Sneak Peek Trigger
        g.addEventListener('mouseenter', () => {
          const reflectionText = getLoc(nd.item, 'reflection');
          const roleText = nd.item.role ? `<span class="msp-role">${nd.item.role}</span>` : '';
          const locText = nd.item.location ? `<span class="msp-loc"> · ${nd.item.location}</span>` : '';
          const hintLabel = window.t('exp_view_cta');

          peekCard.innerHTML = `
            <div class="msp-header">
              <span class="msp-badge">${badgeText}</span>
              <span class="msp-year">${nd.item.year}</span>
            </div>
            <div class="msp-title">${titleText}</div>
            <div class="msp-meta">${roleText}${locText}</div>
            <p class="msp-desc">${reflectionText}</p>
            <div class="msp-hint">
              <span>${hintLabel}</span>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </div>
          `;

          const dotRect = dot.getBoundingClientRect();
          const wrapRect = wrap.getBoundingClientRect();

          const relX = (dotRect.left + dotRect.width / 2) - wrapRect.left + wrap.scrollLeft;
          const relY = (dotRect.top + dotRect.height / 2) - wrapRect.top;

          peekCard.style.left = `${relX}px`;
          if (nd.side === 'above') {
            peekCard.style.top = `${relY + 16}px`;
            peekCard.style.transform = 'translate(-50%, 0)';
          } else {
            peekCard.style.top = `${relY - 16}px`;
            peekCard.style.transform = 'translate(-50%, -100%)';
          }
          peekCard.classList.add('active');
        });

        g.addEventListener('mouseleave', () => {
          peekCard.classList.remove('active');
        });

        // Click navigates to experience page
        g.addEventListener('click', () => {
          window.location.href = PAGES_REL + 'experience.html';
        });

        svg.appendChild(g);
      });

      wrap.addEventListener('mouseleave', () => {
        peekCard.classList.remove('active');
      });

      // ── WIDE CLICKABLE MYSTERY FOG & WAYPOINT ZONE ──
      const fogClickGroup = mkSVG('g', {
        class: 'map-fog-clickable-zone',
        tabindex: '0',
        role: 'button',
        'aria-label': window.t('journey_explore_cta'),
      });

      // Broad invisible hitbox
      const hitBox = mkSVG('rect', {
        x: '820',
        y: '20',
        width: '180',
        height: '220',
        rx: '24',
        class: 'map-fog-hitbox',
      });
      fogClickGroup.appendChild(hitBox);

      // Layered Organic Mystery Clouds
      const cloudGlow = mkSVG('circle', {
        cx: '940',
        cy: '110',
        r: '85',
        fill: 'url(#fogMysteryGlow)',
        class: 'map-fog-aura',
      });
      fogClickGroup.appendChild(cloudGlow);

      const cloud1 = mkSVG('ellipse', { cx: '940', cy: '110', rx: '95', ry: '65', fill: 'url(#fogRadial1)', class: 'map-cloud-layer c1' });
      const cloud2 = mkSVG('ellipse', { cx: '965', cy: '135', rx: '80', ry: '50', fill: 'url(#fogRadial2)', class: 'map-cloud-layer c2' });
      const cloud3 = mkSVG('ellipse', { cx: '915', cy: '90',  rx: '60', ry: '40', fill: 'url(#fogRadial1)', class: 'map-cloud-layer c3' });
      fogClickGroup.appendChild(cloud1);
      fogClickGroup.appendChild(cloud2);
      fogClickGroup.appendChild(cloud3);

      // Pulsing Radar Rings
      const radarOuter = mkSVG('circle', { cx: '940', cy: '110', r: '22', class: 'waypoint-radar-outer' });
      const radar = mkSVG('circle', { cx: '940', cy: '110', r: '14', class: 'waypoint-radar' });
      fogClickGroup.appendChild(radarOuter);
      fogClickGroup.appendChild(radar);

      // Mystery Question Glyph
      const qGlyph = mkSVG('text', {
        x: '940',
        y: '116',
        class: 'map-mystery-glyph',
        'text-anchor': 'middle',
      });
      qGlyph.textContent = '?';
      fogClickGroup.appendChild(qGlyph);

      // Badge / Tooltip Label
      const pillG = mkSVG('g', { class: 'waypoint-pill-tooltip' });
      const pillBg = mkSVG('rect', {
        x: '850',
        y: '50',
        width: '180',
        height: '26',
        rx: '13',
        class: 'wp-pill-bg',
      });
      pillG.appendChild(pillBg);

      const pillText = mkSVG('text', {
        x: '940',
        y: '67',
        class: 'wp-pill-text',
        'text-anchor': 'middle',
      });
      pillText.textContent = window.currentLang === 'id' ? 'JELAJAHI LINIMASA LENGKAP →' : 'EXPLORE FULL MAP →';
      pillG.appendChild(pillText);
      fogClickGroup.appendChild(pillG);

      // Direct navigation on click
      fogClickGroup.addEventListener('click', () => {
        window.location.href = PAGES_REL + 'experience.html';
      });

      fogClickGroup.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          window.location.href = PAGES_REL + 'experience.html';
        }
      });

      svg.appendChild(fogClickGroup);

      wrap.appendChild(svg);
    } else {
      // Mobile preview list
      const listWrap = el('div', { class: 'exp-mobile-preview-list' });
      milestones.forEach((m, idx) => {
        const badgeText = getLoc(m, 'badge');
        const titleText = getLoc(m, 'title');
        const reflectionText = getLoc(m, 'reflection');

        const itemEl = el('a', {
          href: PAGES_REL + 'experience.html',
          class: 'exp-mobile-preview-item',
        });
        itemEl.innerHTML = `
          <div class="exp-mobile-preview-dot"></div>
          <div class="exp-mobile-preview-body">
            <div class="exp-mobile-preview-meta">
              <span class="map-label-tag">${badgeText}</span>
              <span class="map-label-year">${m.year}</span>
            </div>
            <div class="map-label-title">${titleText}</div>
            <div class="exp-mobile-preview-desc">${reflectionText}</div>
          </div>
        `;
        listWrap.appendChild(itemEl);
      });
      wrap.appendChild(listWrap);
    }
  }

  /* ── 5 Selected Projects Horizontal Carousel (Home) ── */
  function buildHomeTrailer() {
    const track = document.getElementById('projectsTrack');
    const fill  = document.getElementById('progressFill');
    if (!track || !D.projects) return;

    track.innerHTML = '';

    // Exactly 5 Selected Projects
    const targetSlugs = D.homeTrailerSlugs || ['penny-path', 'bara-kasir', 'bincard', 'jobhunt', 'emotica'];
    const trailerProjects = targetSlugs.map(slug => (D.projects || []).find(p => p.slug === slug)).filter(Boolean);

    trailerProjects.forEach((p, i) => {
      const card = el('a', {
        href: `${PAGES_REL}project.html?slug=${p.slug}`,
        class: 'project-card',
        role: 'listitem',
        'aria-label': `${p.name} — ${getLoc(p, 'category')}`,
      });

      const rawList = (p.temporaryPreviewImages && p.temporaryPreviewImages.length > 0)
        ? p.temporaryPreviewImages
        : ['assets/images/profile-primary.png'];
      const imgSrc = resolveAsset(rawList[0]);
      const fanImg1 = resolveAsset(rawList[1] || rawList[0]);
      const fanImg2 = resolveAsset(rawList[2] || rawList[0]);
      const fanImg3 = resolveAsset(rawList[3] || rawList[1] || rawList[0]);

      const catText = getLoc(p, 'category') || 'Software Project';
      const descText = getLoc(p, 'shortDescription');
      const ctaText = window.t('project_trailer_cta');
      const fallbackSvg = getProjectSvgPlaceholder(p.name, catText);

      card.innerHTML = `
        <div class="project-card__img-wrap">
          <img src="${imgSrc}" alt="${p.name} preview" loading="lazy" class="project-card__img" onerror="this.onerror=null;this.src='${fallbackSvg}'">
          <div class="card-fan-overlay" aria-hidden="true"></div>
          <div class="card-fan-wrap" aria-hidden="true">
            <div class="fan-card fan-card--1">
              <img src="${fanImg1}" alt="" loading="lazy" onerror="this.onerror=null;this.src='${fallbackSvg}'">
            </div>
            <div class="fan-card fan-card--2">
              <img src="${fanImg2}" alt="" loading="lazy" onerror="this.onerror=null;this.src='${fallbackSvg}'">
            </div>
            <div class="fan-card fan-card--3">
              <img src="${fanImg3}" alt="" loading="lazy" onerror="this.onerror=null;this.src='${fallbackSvg}'">
            </div>
          </div>
        </div>
        <div class="project-card__info">
          <div class="project-card__cat">${catText.toUpperCase()}</div>
          <h3 class="project-card__title">${p.name}</h3>
          <p class="project-card__desc">${descText}</p>
        </div>
        <div class="project-card__footer">
          <span class="project-card__view">${ctaText}</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
        </div>
      `;

      track.appendChild(card);
    });

    // ── End Hook: Minimalist Next Arrow Button (with subtle label) ──
    const nextArrowBtn = el('a', {
      href: `${PAGES_REL}projects.html`,
      class: 'projects-track__next-btn',
      role: 'button',
      'aria-label': window.t('projects_view_all'),
      title: window.t('projects_view_all'),
    });

    const tagText = window.t('projects_view_all_tag');
    const labelText = window.t('projects_view_all');

    nextArrowBtn.innerHTML = `
      <div class="projects-track__next-circle">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
      </div>
      <div class="projects-track__next-meta">
        <span class="projects-track__next-tag" data-i18n="projects_view_all_tag">${tagText}</span>
        <span class="projects-track__next-text" data-i18n="projects_view_all">${labelText}</span>
      </div>
    `;

    track.appendChild(nextArrowBtn);

    initCarouselInteractions();
  }

  /* ── Carousel Vertical-to-Horizontal Scroll Translation & Drag ── */
  function initCarouselInteractions() {
    const track = document.getElementById('projectsTrack');
    const outer = track ? track.parentElement : null;
    const fill  = document.getElementById('progressFill');
    const section = document.getElementById('projects-trailer');
    if (!outer || !track) return;

    function updateProgress() {
      if (!fill) return;
      const maxScroll = outer.scrollWidth - outer.clientWidth;
      if (maxScroll <= 0) {
        fill.style.width = '100%';
        return;
      }
      const pct = Math.min(Math.max((outer.scrollLeft / maxScroll) * 100, 0), 100);
      fill.style.width = pct + '%';
    }

    outer.addEventListener('scroll', updateProgress, { passive: true });
    updateProgress();

    // Vertical Wheel Scroll Translated to Horizontal Carousel Motion
    function handleWheel(e) {
      const maxScroll = outer.scrollWidth - outer.clientWidth;
      if (maxScroll <= 4) return;

      const delta = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
      if (!delta) return;

      const atStart = outer.scrollLeft <= 2;
      const atEnd = outer.scrollLeft >= maxScroll - 4;

      if ((delta > 0 && !atEnd) || (delta < 0 && !atStart)) {
        e.preventDefault();
        outer.scrollLeft += delta * 1.35;
        updateProgress();
      }
    }

    if (section) section.addEventListener('wheel', handleWheel, { passive: false });
    outer.addEventListener('wheel', handleWheel, { passive: false });

    // Drag to scroll
    let isDragging = false;
    let startX = 0;
    let initialScroll = 0;

    outer.addEventListener('mousedown', (e) => {
      isDragging = true;
      outer.style.cursor = 'grabbing';
      startX = e.pageX - outer.offsetLeft;
      initialScroll = outer.scrollLeft;
    });

    window.addEventListener('mouseup', () => {
      if (!isDragging) return;
      isDragging = false;
      outer.style.cursor = 'grab';
    });

    outer.addEventListener('mouseleave', () => {
      if (!isDragging) return;
      isDragging = false;
      outer.style.cursor = 'grab';
    });

    outer.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      e.preventDefault();
      const x = e.pageX - outer.offsetLeft;
      const walk = (x - startX) * 1.3;
      outer.scrollLeft = initialScroll - walk;
      updateProgress();
    });
  }

  /* ════════════════════════════════════════════
     3. PROJECTS PAGE (projects.html)
     EDITORIAL ROWS WITH INTERACTIVE POPUP MODAL
  ════════════════════════════════════════════ */
  let activeModalProject = null;
  let activeModalList = null;

  if (IS.projects) {
    initProjectsArchive();
  }

  function initProjectsArchive() {
    const container = document.getElementById('projectRows');
    const filterTabs = document.querySelectorAll('.archive-filter-btn');
    const countEl = document.getElementById('projectCount');
    const modalBackdrop = document.getElementById('projectModal');
    const modalContent = document.getElementById('projectModalContent');
    const modalCloseBtn = document.getElementById('projectModalClose');
    if (!container || !D.projects) return;

    let activeFilter = 'all';
    let currentFilteredList = D.projects;

    function openProjectModal(p, list) {
      if (!modalBackdrop || !modalContent || !p) return;
      activeModalProject = p;
      activeModalList = list || currentFilteredList || D.projects;

      const currentListRef = activeModalList;
      const currentIndex = currentListRef.findIndex(item => item.slug === p.slug);
      const prevProject = currentIndex > 0 ? currentListRef[currentIndex - 1] : null;
      const nextProject = currentIndex < currentListRef.length - 1 ? currentListRef[currentIndex + 1] : null;

      const hasImages = p.temporaryPreviewImages && p.temporaryPreviewImages.length > 0;
      const rawImages = hasImages ? p.temporaryPreviewImages : ['assets/images/profile-primary.png'];
      const images = rawImages.map(resolveAsset);

      const catText = getLoc(p, 'category') || 'SOFTWARE';
      const leadText = getLoc(p, 'shortDescription') || '';
      const probText = getLoc(p, 'problem') || '';
      const whyText = getLoc(p, 'why') || '';
      const solText = getLoc(p, 'solution') || '';
      const roleText = getLoc(p, 'role') || '';
      const techDetailsText = getLoc(p, 'techDetails') || '';
      const liveDemoTarget = resolveAsset(p.liveDemo || '404.html');
      const fallbackSvg = getProjectSvgPlaceholder(p.name, catText);

      const isIndo = window.currentLang === 'id';
      const rationaleList = (isIndo && p.techRationale_id) ? p.techRationale_id : (p.techRationale || []);

      modalContent.innerHTML = `
        <div class="pmodal__header">
          <div class="pmodal__meta-bar">
            <div class="pmodal__tags">
              <span class="pmodal__cat-badge">${catText.toUpperCase()}</span>
              <span class="pmodal__year">${p.year || '2025'}</span>
            </div>
          </div>
          <h2 class="pmodal__title">${p.name}</h2>
          <p class="pmodal__role">${roleText || 'Software Engineer'}</p>
          <div class="pmodal__actions">
            <a href="${liveDemoTarget}" target="_blank" rel="noopener noreferrer" class="pmodal__action-btn pmodal__action-btn--primary">
              <span>${window.t('modal_btn_live_demo')}</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M7 17L17 7M17 7H7M17 7v10"/></svg>
            </a>
            ${p.github ? `
              <a href="${p.github}" target="_blank" rel="noopener noreferrer" class="pmodal__action-btn pmodal__action-btn--secondary">
                <span>${window.t('modal_btn_github')}</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M7 17L17 7M17 7H7M17 7v10"/></svg>
              </a>
            ` : ''}
          </div>
        </div>

        <div class="pmodal__body">
          <div class="pmodal__left-col">
            <div class="pmodal__showcase-wrap" id="modalShowcaseWrap">
              <img id="modalShowcaseImg" src="${images[0]}" alt="${p.name} showcase" loading="eager" class="pmodal__showcase-img" onerror="this.onerror=null;this.src='${fallbackSvg}'">
            </div>

            ${images.length > 1 ? `
              <div class="pmodal__gallery-strip">
                ${images.map((src, i) => `
                  <button class="pmodal__thumb-btn ${i === 0 ? 'active' : ''}" data-src="${src}" aria-label="View preview ${i + 1}">
                    <img src="${src}" alt="Thumbnail ${i + 1}" loading="lazy" onerror="this.onerror=null;this.src='${fallbackSvg}'">
                  </button>
                `).join('')}
              </div>
            ` : ''}

            <div class="pmodal__section">
              <span class="pmodal__sec-label">${window.t('modal_label_tech_stack')}</span>
              <div class="pmodal__tech-chips">
                ${(p.techStack || []).map(t => `<span class="pmodal__tech-chip">${t}</span>`).join('')}
              </div>
            </div>

            ${techDetailsText ? `
              <div class="pmodal__section">
                <span class="pmodal__sec-label">${window.t('architecture_label')}</span>
                <p class="pmodal__sec-text">${techDetailsText}</p>
              </div>
            ` : ''}

            ${rationaleList.length ? `
              <div class="pmodal__section pmodal__rationale-box">
                <span class="pmodal__sec-label">${window.t('modal_label_why_tech')}</span>
                <div class="pmodal__rationale-grid">
                  ${rationaleList.map(item => `
                    <div class="pmodal__rationale-item">
                      <span class="pmodal__rationale-tech">${item.tech}</span>
                      <span class="pmodal__rationale-reason">${item.reason}</span>
                    </div>
                  `).join('')}
                </div>
              </div>
            ` : ''}
          </div>

          <div class="pmodal__right-col">
            <div class="pmodal__section">
              <span class="pmodal__sec-label">${window.t('modal_label_overview')}</span>
              <p class="pmodal__lead-text">${leadText}</p>
            </div>

            ${probText ? `
              <div class="pmodal__section">
                <span class="pmodal__sec-label">${window.t('modal_label_problem')}</span>
                <p class="pmodal__sec-text">${probText}</p>
              </div>
            ` : ''}

            ${solText ? `
              <div class="pmodal__section">
                <span class="pmodal__sec-label">${window.t('modal_label_solution')}</span>
                <p class="pmodal__sec-text">${solText}</p>
              </div>
            ` : ''}

            ${whyText ? `
              <div class="pmodal__section">
                <span class="pmodal__sec-label">${window.t('modal_label_why')}</span>
                <p class="pmodal__sec-text">${whyText}</p>
              </div>
            ` : ''}
          </div>
        </div>

        <div class="pmodal__footer">
          <button class="pmodal__nav-btn" id="modalPrevBtn" ${!prevProject ? 'disabled' : ''}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="15 18 9 12 15 6"/></svg>
            <span>${prevProject ? prevProject.name : window.t('modal_nav_start')}</span>
          </button>
          <button class="pmodal__nav-btn" id="modalNextBtn" ${!nextProject ? 'disabled' : ''}>
            <span>${nextProject ? nextProject.name : window.t('modal_nav_end')}</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>
      `;

      // Interactive thumbnail switcher
      const thumbs = modalContent.querySelectorAll('.pmodal__thumb-btn');
      const mainImg = modalContent.querySelector('#modalShowcaseImg');
      thumbs.forEach(btn => {
        btn.addEventListener('click', () => {
          thumbs.forEach(t => t.classList.remove('active'));
          btn.classList.add('active');
          if (mainImg) {
            mainImg.src = btn.getAttribute('data-src');
          }
        });
      });

      // Prev / Next button listeners
      const prevBtn = modalContent.querySelector('#modalPrevBtn');
      const nextBtn = modalContent.querySelector('#modalNextBtn');
      if (prevBtn && prevProject) {
        prevBtn.addEventListener('click', () => openProjectModal(prevProject, currentListRef));
      }
      if (nextBtn && nextProject) {
        nextBtn.addEventListener('click', () => openProjectModal(nextProject, currentListRef));
      }

      modalBackdrop.classList.add('active');
      modalBackdrop.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';

      // Update URL query parameter
      try {
        const url = new URL(window.location);
        url.searchParams.set('slug', p.slug);
        window.history.pushState({ slug: p.slug }, '', url.toString());
      } catch (err) {}
    }

    function closeProjectModal() {
      if (!modalBackdrop) return;
      activeModalProject = null;
      modalBackdrop.classList.remove('active');
      modalBackdrop.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';

      // Revert URL query parameter
      try {
        const url = new URL(window.location);
        url.searchParams.delete('slug');
        window.history.pushState({}, '', url.pathname + (url.hash || ''));
      } catch (err) {}
    }

    window.openProjectModal = openProjectModal;
    window.reOpenProjectModal = () => {
      if (activeModalProject) openProjectModal(activeModalProject, activeModalList);
    };

    if (modalCloseBtn) {
      modalCloseBtn.addEventListener('click', closeProjectModal);
    }
    if (modalBackdrop) {
      modalBackdrop.addEventListener('click', (e) => {
        if (e.target === modalBackdrop) {
          closeProjectModal();
        }
      });
    }
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modalBackdrop && modalBackdrop.classList.contains('active')) {
        closeProjectModal();
      }
    });

    window.addEventListener('popstate', (e) => {
      const slug = new URLSearchParams(window.location.search).get('slug');
      if (slug) {
        const found = D.projects.find(p => p.slug === slug);
        if (found) openProjectModal(found, D.projects);
      } else {
        if (modalBackdrop && modalBackdrop.classList.contains('active')) {
          closeProjectModal();
        }
      }
    });

    function renderProjectRows(filter) {
      container.innerHTML = '';

      const list = filter === 'all'
        ? D.projects
        : D.projects.filter(p => {
            const tags = (p.tags || []).map(t => t.toLowerCase());
            const cat = (p.category || '').toLowerCase();
            const tier = (p.tier || '').toLowerCase();

            if (filter === 'featured') {
              return p.featured === true || tier === 'featured' || tags.includes('featured');
            }
            if (filter === 'web') {
              return tags.includes('web') || cat.includes('web') || tier === 'web';
            }
            if (filter === 'mobile') {
              return tags.includes('mobile') || cat.includes('mobile') || cat.includes('android') || tier === 'mobile';
            }
            if (filter === 'systems') {
              return tags.includes('systems') || cat.includes('system') || cat.includes('platform') || cat.includes('inventory') || cat.includes('pos');
            }
            return tags.includes(filter) || cat.includes(filter);
          });

      currentFilteredList = list;

      if (countEl) {
        countEl.textContent = String(list.length).padStart(2, '0');
      }

      list.forEach((p, idx) => {
        const row = el('article', {
          class: 'parow project-row',
          role: 'listitem',
          'aria-label': `${p.name} — ${getLoc(p, 'category')}`,
        });

        const rawList = (p.temporaryPreviewImages && p.temporaryPreviewImages.length > 0)
          ? p.temporaryPreviewImages
          : ['assets/images/profile-primary.png'];
        const imgSrc = resolveAsset(rawList[0]);

        const catText = getLoc(p, 'category') || 'PROJECT';
        const descText = getLoc(p, 'shortDescription');
        const roleText = getLoc(p, 'role');
        const ctaText = window.t('project_row_cta');
        const fallbackSvg = getProjectSvgPlaceholder(p.name, catText);
        const liveDemoTarget = resolveAsset(p.liveDemo || '404.html');

        // 3 Coherent Columns in ONE row: Left (Identity), Center (Showcase), Right (Tech & Links)
        row.innerHTML = `
          <div class="parow__left">
            <div class="parow__cat">${catText.toUpperCase()}</div>
            <h2 class="parow__title">
              <a href="#view-${p.slug}" class="project-modal-trigger">${p.name}</a>
            </h2>
            <p class="parow__desc">${descText}</p>
            <div class="parow__year">${p.year || '2025'} · ${roleText ? roleText.split('—')[0].trim() : 'Software Engineer'}</div>
          </div>

          <div class="parow__center">
            <a href="#view-${p.slug}" class="parow__img-link project-modal-trigger" tabindex="-1" aria-hidden="true">
              <div class="parow__img-wrap">
                <img src="${imgSrc}" alt="${p.name} screenshot" loading="lazy" class="parow__img" onerror="this.onerror=null;this.src='${fallbackSvg}'">
              </div>
            </a>
          </div>

          <div class="parow__right">
            <div class="parow__tech-sec">
              <span class="parow__tech-lbl">${window.t('tech_col_label')}</span>
              <div class="parow__tech-list">
                ${(p.techStack || []).map(t => `<span class="parow__tech-pill">${t}</span>`).join('')}
              </div>
            </div>

            <div class="parow__links">
              <button type="button" class="parow__cta-btn project-modal-trigger">
                <span>${ctaText}</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </button>
              <a href="${liveDemoTarget}" target="_blank" rel="noopener noreferrer" class="parow__ext-link" aria-label="Live demo for ${p.name}">
                <span>${window.t('modal_btn_live_demo')}</span>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M7 17L17 7M17 7H7M17 7v10"/></svg>
              </a>
              ${p.github ? `
                <a href="${p.github}" target="_blank" rel="noopener noreferrer" class="parow__ext-link" aria-label="GitHub repository for ${p.name}">
                  <span>GitHub</span>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M7 17L17 7M17 7H7M17 7v10"/></svg>
                </a>
              ` : ''}
            </div>
          </div>
        `;

        // Direct modal popup on row click (excluding external link clicks)
        row.addEventListener('click', (e) => {
          if (e.target.closest('.parow__ext-link')) return;
          e.preventDefault();
          openProjectModal(p, list);
        });

        container.appendChild(row);
      });

      if (list.length === 0) {
        container.innerHTML = `
          <div class="parow__empty">
            <p>${window.t('empty_category')}</p>
          </div>
        `;
      }
    }

    window.reRenderProjectRows = () => renderProjectRows(activeFilter);

    if (filterTabs.length > 0) {
      filterTabs.forEach(tab => {
        tab.addEventListener('click', () => {
          activeFilter = tab.getAttribute('data-filter') || 'all';
          filterTabs.forEach(t => {
            t.classList.toggle('active', t === tab);
            t.setAttribute('aria-selected', t === tab ? 'true' : 'false');
          });
          renderProjectRows(activeFilter);
        });
      });
    }

    renderProjectRows('all');

    // Auto-open modal if URL contains ?slug=...
    const initialSlug = new URLSearchParams(window.location.search).get('slug');
    if (initialSlug) {
      const targetProject = D.projects.find(p => p.slug === initialSlug);
      if (targetProject) {
        setTimeout(() => {
          openProjectModal(targetProject, D.projects);
        }, 100);
      }
    }
  }

  /* ════════════════════════════════════════════
     4. PROJECT DETAIL PAGE (project.html)
     DEDICATED 30% / 40% / 30% LAYOUT
  ════════════════════════════════════════════ */
  if (IS.detail) {
    initProjectDetailPage();
  }

  function initProjectDetailPage() {
    const root = document.getElementById('pdetailRoot');
    if (!root || !D.projects) return;

    const urlParams = new URLSearchParams(window.location.search);
    const slug = urlParams.get('slug') || 'emotica';
    const project = D.projects.find(p => p.slug === slug) || D.projects[0];

    if (!project) {
      root.innerHTML = `<p class="pdetail__not-found">${window.t('pdetail_not_found')}</p>`;
      return;
    }

    document.title = `${project.name} — Erliandika Syahputra`;

    const hasImages = project.temporaryPreviewImages && project.temporaryPreviewImages.length > 0;
    const rawImages = hasImages ? project.temporaryPreviewImages : ['assets/images/profile-primary.png'];
    const images = rawImages.map(resolveAsset);

    const catText = getLoc(project, 'category') || 'SOFTWARE';
    const leadText = getLoc(project, 'shortDescription');
    const probText = getLoc(project, 'problem');
    const whyText = getLoc(project, 'why');
    const solText = getLoc(project, 'solution');
    const roleText = getLoc(project, 'role');
    const techDetailsText = getLoc(project, 'techDetails');
    const liveDemoTarget = resolveAsset(project.liveDemo || '404.html');

    const isIndo = window.currentLang === 'id';
    const rationaleList = (isIndo && project.techRationale_id) ? project.techRationale_id : (project.techRationale || []);

    root.innerHTML = `
      <div class="pdetail__header">
        <a href="projects.html" class="pdetail__back-link">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
          <span data-i18n="pdetail_back">${window.t('pdetail_back')}</span>
        </a>
      </div>

      <!-- 30% / 40% / 30% Dedicated Story Grid -->
      <div class="pdetail__grid">
        
        <!-- 30% LEFT: WHY / STORY -->
        <div class="pdetail__col-story">
          <div class="pdetail__meta-tag">${catText.toUpperCase()} · ${project.year || '2025'}</div>
          <h1 class="pdetail__title">${project.name}</h1>
          <p class="pdetail__lead">${leadText}</p>

          ${probText ? `
            <div class="pdetail__story-block">
              <h2 class="pdetail__sec-label">${window.t('modal_label_problem')}</h2>
              <p class="pdetail__sec-text">${probText}</p>
            </div>
          ` : ''}

          ${whyText ? `
            <div class="pdetail__story-block">
              <h2 class="pdetail__sec-label">${window.t('modal_label_why')}</h2>
              <p class="pdetail__sec-text">${whyText}</p>
            </div>
          ` : ''}

          ${solText ? `
            <div class="pdetail__story-block">
              <h2 class="pdetail__sec-label">${window.t('modal_label_solution')}</h2>
              <p class="pdetail__sec-text">${solText}</p>
            </div>
          ` : ''}

          ${roleText ? `
            <div class="pdetail__story-block">
              <h2 class="pdetail__sec-label">${window.t('modal_label_role')}</h2>
              <p class="pdetail__sec-text">${roleText}</p>
            </div>
          ` : ''}
        </div>

        <!-- 40% CENTER: SHOWCASE -->
        <div class="pdetail__col-showcase">
          <div class="pdetail__showcase-main" id="showcaseMainWrap">
            <img id="showcaseMainImg" src="${images[0]}" alt="${project.name} main showcase" loading="eager" class="pdetail__main-img" onerror="this.onerror=null;this.src='${getProjectSvgPlaceholder(project.name, catText)}'">
          </div>

          ${images.length > 1 ? `
            <div class="pdetail__gallery">
              ${images.map((src, i) => `
                <button class="pdetail__thumb-btn ${i === 0 ? 'active' : ''}" data-src="${src}" aria-label="View screenshot ${i + 1}">
                  <img src="${src}" alt="Thumbnail ${i + 1}" loading="lazy" onerror="this.onerror=null;this.src='${getProjectSvgPlaceholder(project.name, catText)}'">
                </button>
              `).join('')}
            </div>
          ` : ''}

          ${techDetailsText ? `
            <div class="pdetail__story-block" style="margin-top: 2rem;">
              <h2 class="pdetail__sec-label">${window.t('architecture_label')}</h2>
              <p class="pdetail__sec-text">${techDetailsText}</p>
            </div>
          ` : ''}
        </div>

        <!-- 30% RIGHT: TECH + LINKS -->
        <div class="pdetail__col-tech">
          <div class="pdetail__tech-box">
            <h2 class="pdetail__sec-label">${window.t('modal_label_tech_stack')}</h2>
            <div class="pdetail__tech-badges">
              ${(project.techStack || []).map(t => `<span class="pdetail__tech-pill">${t}</span>`).join('')}
            </div>
          </div>

          ${rationaleList.length ? `
            <div class="pdetail__tech-box pmodal__rationale-box">
              <h2 class="pdetail__sec-label">${window.t('modal_label_why_tech')}</h2>
              <div class="pmodal__rationale-grid">
                ${rationaleList.map(item => `
                  <div class="pmodal__rationale-item">
                    <span class="pmodal__rationale-tech">${item.tech}</span>
                    <span class="pmodal__rationale-reason">${item.reason}</span>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}

          <div class="pdetail__links-box">
            <h2 class="pdetail__sec-label">${window.t('pdetail_links_label')}</h2>
            <div class="pdetail__actions">
              <a href="${liveDemoTarget}" class="pdetail__btn primary" aria-label="Visit Live Demo for ${project.name}">
                <span>${window.t('modal_btn_live_demo')}</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M7 17L17 7M17 7H7M17 7v10"/></svg>
              </a>
              ${project.github ? `
                <a href="${project.github}" target="_blank" rel="noopener noreferrer" class="pdetail__btn secondary" aria-label="Visit GitHub repository for ${project.name}">
                  <span>${window.t('modal_btn_github')}</span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M7 17L17 7M17 7H7M17 7v10"/></svg>
                </a>
              ` : ''}
              ${project.figma ? `
                <a href="${project.figma}" target="_blank" rel="noopener noreferrer" class="pdetail__btn secondary">
                  <span>Figma Design</span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M7 17L17 7M17 7H7M17 7v10"/></svg>
                </a>
              ` : ''}
            </div>
          </div>
        </div>

      </div>
    `;

    // Thumbnail click interaction
    const mainImg = document.getElementById('showcaseMainImg');
    const thumbs  = root.querySelectorAll('.pdetail__thumb-btn');

    thumbs.forEach(btn => {
      btn.addEventListener('click', () => {
        thumbs.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const src = btn.getAttribute('data-src');
        if (mainImg) mainImg.src = src;
      });
    });
  }

  /* ════════════════════════════════════════════
     5. EXPERIENCE PAGE (experience.html)
     SNAKING JOURNEY MAP, POPUP DOSSIER & CERTS
  ════════════════════════════════════════════ */
  let activeExpModalIdx = null;

  if (IS.exp) {
    initExperiencePage();
  }

  function initExperiencePage() {
    buildFullSnakingMap();
    buildExperienceCards();
    buildCertifications();
  }

  /* ── 3-Zone Career Expedition Map (Organic Cartographic Journey) ── */
  function buildFullSnakingMap() {
    const wrap = document.getElementById('expFullMap');
    if (!wrap || !D.experience || !D.experience.length) return;

    wrap.innerHTML = '';

    const items = D.experience; // Exactly 8 items
    const isMobile = window.innerWidth < 768;
    const isIndo = window.currentLang === 'id';

    if (!isMobile) {
      const VW = 1320;
      const VH = 560;

      const svg = mkSVG('svg', {
        viewBox: `0 0 ${VW} ${VH}`,
        width: '100%',
        height: 'auto',
        class: 'exp-snaking-svg',
        'aria-label': isIndo ? 'Peta Ekspedisi Jejak Karier & Rekayasa' : 'Career Journey & Engineering Expedition Map',
      });

      // SVG Defs
      const defs = mkSVG('defs');
      
      const starGlow = mkSVG('radialGradient', { id: 'collabStarGlow', cx: '50%', cy: '50%', r: '50%' });
      starGlow.appendChild(mkSVG('stop', { offset: '0%', 'stop-color': 'var(--fg)', 'stop-opacity': '0.22' }));
      starGlow.appendChild(mkSVG('stop', { offset: '100%', 'stop-color': 'var(--fg)', 'stop-opacity': '0' }));
      defs.appendChild(starGlow);

      svg.appendChild(defs);

      // Subtle atmospheric topographic contour lines (single gentle horizon contour)
      const topoContours = [
        'M 30 260 C 220 220, 440 310, 680 250 C 900 190, 1120 270, 1290 230',
      ];
      topoContours.forEach(d => {
        svg.appendChild(mkSVG('path', { d, class: 'map-path-contour' }));
      });

      // ── Organic 8-Waypoint Cartographic Expedition Path ──
      // Silhouette: (60, 310) → (190, 240) → (330, 275) → (480, 150) → (640, 380) → (790, 270) → (920, 305) → (1050, 160) → (1170, 220) → (1265, 220)
      const pathD = `
        M 60 310
        C 105 310, 145 240, 190 240
        C 240 240, 280 275, 330 275
        C 380 275, 425 150, 480 150
        C 540 150, 580 380, 640 380
        C 700 380, 740 270, 790 270
        C 840 270, 875 305, 920 305
        C 970 305, 1005 160, 1050 160
        C 1095 160, 1130 220, 1170 220
        C 1205 220, 1235 220, 1265 220
      `;

      svg.appendChild(mkSVG('path', { d: pathD, class: 'map-road-glow' }));
      svg.appendChild(mkSVG('path', { d: pathD, class: 'map-road-track' }));

      // ── Origin Node: BASECAMP ──
      const startG = mkSVG('g', { class: 'map-start-basecamp', tabindex: '0', role: 'region', 'aria-label': 'Basecamp origin' });
      startG.appendChild(mkSVG('circle', { cx: '60', cy: '310', r: '12', class: 'map-start-halo' }));
      startG.appendChild(mkSVG('circle', { cx: '60', cy: '310', r: '7', class: 'map-start-ring' }));
      startG.appendChild(mkSVG('circle', { cx: '60', cy: '310', r: '3.5', class: 'map-node-start' }));
      
      startG.appendChild(mkSVGText('BASECAMP', 60, 336, 'map-start-label', 'middle'));
      startG.appendChild(mkSVGText(isIndo ? 'Awal mula rasa ingin tahu' : 'Where curiosity began', 60, 350, 'map-start-sub', 'middle'));
      svg.appendChild(startG);

      // ── Deterministic Waypoint Coordinates (Organic 3-Zone Terrain) ──
      const NODE_POSITIONS = [
        // 0: S1 Sistem Informasi (Pendidikan) — gentle ascent
        { x: 190, y: 240, side: 'above', labelY: 135, leaderY1: 226, leaderY2: 160, align: 'middle' },
        // 1: IT Support & Lab Assistant (Infrastruktur IT) — shelf step
        { x: 330, y: 275, side: 'below', labelY: 355, leaderY1: 287, leaderY2: 335, align: 'middle' },
        // 2: Project Director & Division Head (Kepemimpinan & Komunitas) — early summit
        { x: 480, y: 150, side: 'above', labelY: 55,  leaderY1: 136, leaderY2: 80,  align: 'middle' },
        // 3: Network Infrastructure Deployment (Infrastruktur Jaringan) — fieldwork valley
        { x: 640, y: 380, side: 'below', labelY: 455, leaderY1: 392, leaderY2: 435, align: 'middle' },
        // 4: Bangkit Mobile Development (Program Industri) — industry plateau
        { x: 790, y: 270, side: 'above', labelY: 175, leaderY1: 256, leaderY2: 200, align: 'middle' },
        // 5: Coding Camp DBS Full-Stack (Program Industri) — continuing plateau
        { x: 920, y: 305, side: 'below', labelY: 385, leaderY1: 317, leaderY2: 365, align: 'middle' },
        // 6: Head of Software Dev (Kepemimpinan Rekayasa) — leadership peak
        { x: 1050, y: 160, side: 'above', labelY: 65,  leaderY1: 146, leaderY2: 90,  align: 'middle' },
        // 7: Sertifikasi BNSP Web (Sertifikasi Profesi) — credential shelf
        { x: 1170, y: 220, side: 'below', labelY: 300, leaderY1: 232, leaderY2: 280, align: 'middle' },
      ];

      // ── Render 8 Milestone Waypoints with Elevation Leader Lines & Typography ──
      items.forEach((item, i) => {
        const pos = NODE_POSITIONS[i];
        if (!pos) return;

        const isAbove = pos.side === 'above';
        const tagText = getLoc(item, 'typeLabel') || 'MILESTONE';
        const roleText = item.role || '';
        const orgText = item.org ? item.org.split('—')[0].trim() : '';

        const g = mkSVG('g', {
          class: 'map-node-group map-snaking-node',
          tabindex: '0',
          role: 'button',
          'aria-label': `${String(i + 1).padStart(2, '0')} · ${item.role} at ${item.org} (${item.period})`,
        });

        // Altitude elevation leader line (connecting path node to label)
        const leaderLine = mkSVG('line', {
          x1: String(pos.x),
          y1: String(pos.leaderY1),
          x2: String(pos.x),
          y2: String(pos.leaderY2),
          class: 'map-elevation-line',
        });
        g.appendChild(leaderLine);

        // Halo Ring
        const halo = mkSVG('circle', {
          cx: String(pos.x),
          cy: String(pos.y),
          r: '11',
          class: 'map-node-ring',
        });
        g.appendChild(halo);

        // Core Dot
        const core = mkSVG('circle', {
          cx: String(pos.x),
          cy: String(pos.y),
          r: '4.5',
          class: 'map-node-core',
        });
        g.appendChild(core);

        // Typography Stack: Tag, Period, Role, Org
        const textY = pos.labelY;

        // 1. Tag (e.g. 01 · PENDIDIKAN)
        g.appendChild(mkSVGText(
          `${String(i + 1).padStart(2, '0')} · ${tagText.toUpperCase()}`,
          pos.x,
          isAbove ? textY - 18 : textY,
          'map-label-tag',
          pos.align
        ));

        // 2. Period (e.g. Sep 2022 — Jun 2026)
        g.appendChild(mkSVGText(
          item.period || item.year,
          pos.x,
          isAbove ? textY - 4 : textY + 13,
          'map-label-year',
          pos.align
        ));

        // 3. Role Title (Primary)
        const roleShort = roleText.length > 30 ? roleText.substring(0, 28) + '…' : roleText;
        g.appendChild(mkSVGText(
          roleShort,
          pos.x,
          isAbove ? textY + 12 : textY + 28,
          'map-label-title',
          pos.align
        ));

        // 4. Organization Subtitle (Quiet micro info)
        const orgShort = orgText.length > 34 ? orgText.substring(0, 32) + '…' : orgText;
        if (orgShort) {
          g.appendChild(mkSVGText(
            orgShort,
            pos.x,
            isAbove ? textY + 25 : textY + 41,
            'map-label-sub',
            pos.align
          ));
        }

        // Hover Sneak-Peek Card Trigger
        g.addEventListener('mouseenter', () => {
          const reflectionText = getLoc(item, 'beginning') || getLoc(item, 'headline') || '';
          const peekCard = wrap.querySelector('.map-sneak-peek');
          if (!peekCard) return;

          peekCard.innerHTML = `
            <div class="msp-header">
              <span class="msp-badge">${String(i + 1).padStart(2, '0')} · ${tagText}</span>
              <span class="msp-year">${item.period || item.year}</span>
            </div>
            <div class="msp-title">${roleText}</div>
            <div class="msp-meta">${item.org || ''}${item.location ? ` · ${item.location}` : ''}</div>
            <p class="msp-desc">${reflectionText}</p>
            <div class="msp-hint">
              <span>${window.t('exp_view_cta')}</span>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </div>
          `;

          const dotRect = core.getBoundingClientRect();
          const wrapRect = wrap.getBoundingClientRect();
          const relX = (dotRect.left + dotRect.width / 2) - wrapRect.left + wrap.scrollLeft;
          const relY = (dotRect.top + dotRect.height / 2) - wrapRect.top;

          peekCard.style.left = `${relX}px`;
          if (isAbove) {
            peekCard.style.top = `${relY + 18}px`;
            peekCard.style.transform = 'translate(-50%, 0)';
          } else {
            peekCard.style.top = `${relY - 18}px`;
            peekCard.style.transform = 'translate(-50%, -100%)';
          }
          peekCard.classList.add('active');
        });

        g.addEventListener('mouseleave', () => {
          const peekCard = wrap.querySelector('.map-sneak-peek');
          if (peekCard) peekCard.classList.remove('active');
        });

        // Click opens Experience Dossier Popup Modal
        g.addEventListener('click', () => {
          const peekCard = wrap.querySelector('.map-sneak-peek');
          if (peekCard) peekCard.classList.remove('active');
          openExperienceModal(i);
        });

        g.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            const peekCard = wrap.querySelector('.map-sneak-peek');
            if (peekCard) peekCard.classList.remove('active');
            openExperienceModal(i);
          }
        });

        svg.appendChild(g);
      });

      // ── Destination Endpoint: ✦ LANGKAH BERIKUTNYA / ✦ THE NEXT CHAPTER ──
      const destX = 1265;
      const destY = 220;

      const destG = mkSVG('g', {
        class: 'map-destination-hook',
        tabindex: '0',
        role: 'button',
        'aria-label': `${window.t('map_dest_badge')} — ${window.t('map_dest_title')}`,
      });

      // Destination Aura & Concentric Target Ring
      destG.appendChild(mkSVG('circle', { cx: String(destX), cy: String(destY), r: '24', fill: 'url(#collabStarGlow)', class: 'map-dest-aura' }));
      destG.appendChild(mkSVG('circle', { cx: String(destX), cy: String(destY), r: '12', class: 'map-dest-ring-outer' }));
      destG.appendChild(mkSVG('circle', { cx: String(destX), cy: String(destY), r: '7', class: 'map-dest-ring-inner' }));
      destG.appendChild(mkSVG('circle', { cx: String(destX), cy: String(destY), r: '3.5', class: 'map-dest-core' }));

      // Destination Typography (Placed above the horizon arrival node)
      destG.appendChild(mkSVGText(window.t('map_dest_badge'), destX, destY - 50, 'map-dest-badge', 'middle'));
      destG.appendChild(mkSVGText(window.t('map_dest_title'), destX, destY - 34, 'map-dest-title', 'middle'));
      destG.appendChild(mkSVGText(window.t('map_dest_cta'), destX, destY - 18, 'map-dest-cta', 'middle'));

      destG.addEventListener('click', () => {
        window.location.href = 'mailto:syahputraerliandika@gmail.com?subject=Collaboration%20Inquiry%20%E2%80%94%20Erliandika%20Syahputra';
      });

      destG.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          window.location.href = 'mailto:syahputraerliandika@gmail.com?subject=Collaboration%20Inquiry%20%E2%80%94%20Erliandika%20Syahputra';
        }
      });

      svg.appendChild(destG);

      // Floating Sneak Peek Card Container (anchored inside wrap)
      const peekCard = el('div', { class: 'map-sneak-peek', 'aria-hidden': 'true' });
      wrap.appendChild(peekCard);

      wrap.addEventListener('mouseleave', () => {
        peekCard.classList.remove('active');
      });

      wrap.appendChild(svg);

    } else {
      // ══════════════════════════════════════════════════════════
      // MOBILE VERTICAL EXPEDITION TRAIL (< 768px)
      // ══════════════════════════════════════════════════════════
      const MVW = 380;
      const MVH = 1180;

      const svg = mkSVG('svg', {
        viewBox: `0 0 ${MVW} ${MVH}`,
        width: '100%',
        height: 'auto',
        class: 'exp-mobile-trail-svg',
        'aria-label': isIndo ? 'Linimasa Vertikal Ekspedisi Karier' : 'Vertical Career Expedition Trail',
      });

      // Continuous vertical path curve with gentle wander
      const mobilePathD = `
        M 50 50
        C 50 85, 65 115, 65 155
        C 65 200, 50 225, 50 265
        C 50 310, 75 340, 75 385
        C 75 435, 45 465, 45 510
        C 45 560, 70 585, 70 630
        C 70 675, 55 705, 55 750
        C 55 795, 80 825, 80 870
        C 80 915, 60 945, 60 990
        C 60 1035, 60 1070, 60 1110
      `;

      svg.appendChild(mkSVG('path', { d: mobilePathD, class: 'map-road-glow' }));
      svg.appendChild(mkSVG('path', { d: mobilePathD, class: 'map-road-track' }));

      // Mobile Origin: BASECAMP
      const mStartG = mkSVG('g', { class: 'map-start-basecamp', tabindex: '0', role: 'region', 'aria-label': 'Basecamp origin' });
      mStartG.appendChild(mkSVG('circle', { cx: '50', cy: '50', r: '11', class: 'map-start-halo' }));
      mStartG.appendChild(mkSVG('circle', { cx: '50', cy: '50', r: '6', class: 'map-start-ring' }));
      mStartG.appendChild(mkSVG('circle', { cx: '50', cy: '50', r: '3', class: 'map-node-start' }));
      
      mStartG.appendChild(mkSVGText('BASECAMP', 75, 48, 'map-start-label', 'start'));
      mStartG.appendChild(mkSVGText(isIndo ? 'Awal mula rasa ingin tahu' : 'Where curiosity began', 75, 62, 'map-start-sub', 'start'));
      svg.appendChild(mStartG);

      // Mobile Waypoint Coordinates (8 Milestones with organic vertical offsets)
      const M_POSITIONS = [
        { x: 65, y: 155 },
        { x: 50, y: 265 },
        { x: 75, y: 385 },
        { x: 45, y: 510 },
        { x: 70, y: 630 },
        { x: 55, y: 750 },
        { x: 80, y: 870 },
        { x: 60, y: 990 },
      ];

      items.forEach((item, i) => {
        const pos = M_POSITIONS[i];
        if (!pos) return;

        const tagText = getLoc(item, 'typeLabel') || 'MILESTONE';
        const roleText = item.role || '';
        const roleShort = roleText.length > 26 ? roleText.substring(0, 24) + '…' : roleText;
        const orgText = item.org ? item.org.split('—')[0].trim() : '';
        const orgShort = orgText.length > 28 ? orgText.substring(0, 26) + '…' : orgText;

        const g = mkSVG('g', {
          class: 'map-node-group map-mobile-node',
          tabindex: '0',
          role: 'button',
          'aria-label': `${String(i + 1).padStart(2, '0')} · ${item.role} (${item.period})`,
        });

        // Leader line to label block
        g.appendChild(mkSVG('line', {
          x1: String(pos.x + 8),
          y1: String(pos.y),
          x2: '92',
          y2: String(pos.y),
          class: 'map-elevation-line',
        }));

        // Halo Ring & Node
        g.appendChild(mkSVG('circle', { cx: String(pos.x), cy: String(pos.y), r: '11', class: 'map-node-ring' }));
        g.appendChild(mkSVG('circle', { cx: String(pos.x), cy: String(pos.y), r: '4', class: 'map-node-core' }));

        // Typography Stack beside node
        const labelX = 104;
        g.appendChild(mkSVGText(`${String(i + 1).padStart(2, '0')} · ${tagText.toUpperCase()}`, labelX, pos.y - 14, 'map-label-tag', 'start'));
        g.appendChild(mkSVGText(item.period || item.year, labelX, pos.y, 'map-label-year', 'start'));
        g.appendChild(mkSVGText(roleShort, labelX, pos.y + 15, 'map-label-title', 'start'));
        if (orgShort) {
          g.appendChild(mkSVGText(orgShort, labelX, pos.y + 28, 'map-label-sub', 'start'));
        }

        // Tap opens modal
        g.addEventListener('click', () => openExperienceModal(i));
        g.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openExperienceModal(i);
          }
        });

        svg.appendChild(g);
      });

      // Mobile Destination: ✦ LANGKAH BERIKUTNYA
      const mDestY = 1110;
      const mDestG = mkSVG('g', {
        class: 'map-destination-hook',
        tabindex: '0',
        role: 'button',
        'aria-label': `${window.t('map_dest_badge')} — ${window.t('map_dest_title')}`,
      });

      mDestG.appendChild(mkSVG('circle', { cx: '60', cy: String(mDestY), r: '18', fill: 'url(#collabStarGlow)', class: 'map-dest-aura' }));
      mDestG.appendChild(mkSVG('circle', { cx: '60', cy: String(mDestY), r: '11', class: 'map-dest-ring-outer' }));
      mDestG.appendChild(mkSVG('circle', { cx: '60', cy: String(mDestY), r: '3.5', class: 'map-dest-core' }));

      mDestG.appendChild(mkSVGText(window.t('map_dest_badge'), 92, mDestY - 10, 'map-dest-badge', 'start'));
      mDestG.appendChild(mkSVGText(window.t('map_dest_title'), 92, mDestY + 6, 'map-dest-title', 'start'));
      mDestG.appendChild(mkSVGText(window.t('map_dest_cta'), 92, mDestY + 22, 'map-dest-cta', 'start'));

      mDestG.addEventListener('click', () => {
        window.location.href = 'mailto:syahputraerliandika@gmail.com?subject=Collaboration%20Inquiry%20%E2%80%94%20Erliandika%20Syahputra';
      });

      svg.appendChild(mDestG);

      wrap.appendChild(svg);
    }
  }

  /* ── Dedicated Experience Dossier Modal Popup ── */
  function openExperienceModal(idx) {
    if (!D.experience || !D.experience[idx]) return;
    activeExpModalIdx = idx;

    let modal = document.getElementById('expModal');
    if (!modal) {
      modal = el('div', {
        id: 'expModal',
        class: 'exp-modal-backdrop',
        role: 'dialog',
        'aria-modal': 'true',
        'aria-label': 'Experience Details',
      });
      document.body.appendChild(modal);

      modal.addEventListener('click', (e) => {
        if (e.target === modal || e.target.closest('#expModalClose')) {
          closeExperienceModal();
        }
      });

      document.addEventListener('keydown', (e) => {
        if (!modal.classList.contains('active')) return;
        if (e.key === 'Escape') closeExperienceModal();
        if (e.key === 'ArrowLeft' && activeExpModalIdx > 0) openExperienceModal(activeExpModalIdx - 1);
        if (e.key === 'ArrowRight' && activeExpModalIdx < D.experience.length - 1) openExperienceModal(activeExpModalIdx + 1);
      });
    }

    const item = D.experience[idx];
    const total = D.experience.length;
    const catText = getLoc(item, 'typeLabel') || 'EXPERIENCE';
    const headlineText = getLoc(item, 'headline');
    const bgText = getLoc(item, 'beginning');
    const workText = getLoc(item, 'work');
    const probText = getLoc(item, 'problem');
    const impactText = getLoc(item, 'impact');

    modal.innerHTML = `
      <div class="exp-modal__dialog" role="document">
        <button class="exp-modal__close-btn" id="expModalClose" aria-label="${window.t('aria_modal_close')}">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>

        <div class="exp-modal__header">
          <div class="exp-modal__meta-row">
            <span class="exp-modal__index">MILESTONE ${String(idx + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')}</span>
            <span class="exp-modal__cat">${catText.toUpperCase()}</span>
            <span class="exp-modal__period">${item.period}</span>
          </div>
          <h2 class="exp-modal__role">${item.role}</h2>
          <div class="exp-modal__org">${item.org} · <span class="exp-modal__loc">${item.location}</span></div>
          ${item.gpa ? `<div class="exp-modal__gpa">GPA: ${item.gpa}</div>` : ''}
        </div>

        <div class="exp-modal__body">
          ${headlineText ? `<div class="exp-modal__headline">${headlineText}</div>` : ''}

          <div class="exp-modal__dossier-grid">
            ${bgText ? `
              <div class="exp-dossier-card">
                <h3 class="exp-dossier-card__title">${window.t('modal_exp_beginning')}</h3>
                <p class="exp-dossier-card__text">${bgText}</p>
              </div>
            ` : ''}

            ${workText ? `
              <div class="exp-dossier-card">
                <h3 class="exp-dossier-card__title">${window.t('modal_exp_work')}</h3>
                <p class="exp-dossier-card__text">${workText}</p>
              </div>
            ` : ''}

            ${(probText || impactText) ? `
              <div class="exp-dossier-card">
                <h3 class="exp-dossier-card__title">${window.t('modal_exp_challenge_outcome')}</h3>
                ${probText ? `<p class="exp-dossier-card__text"><strong>${window.t('modal_exp_problem_label')}</strong> ${probText}</p>` : ''}
                ${impactText ? `<p class="exp-dossier-card__text" style="margin-top:0.5rem"><strong>${window.t('modal_exp_impact_label')}</strong> ${impactText}</p>` : ''}
              </div>
            ` : ''}
          </div>

          ${item.bullets && item.bullets.length ? `
            <div class="exp-modal__section">
              <h3 class="exp-modal__sec-label">${window.t('modal_exp_bullets')}</h3>
              <ul class="exp-modal__bullets">
                ${item.bullets.map(b => `<li>${b}</li>`).join('')}
              </ul>
            </div>
          ` : ''}

          ${item.technologies && item.technologies.length ? `
            <div class="exp-modal__section">
              <h3 class="exp-modal__sec-label">${window.t('modal_exp_tech')}</h3>
              <div class="exp-modal__tech-chips">
                ${item.technologies.map(t => `<span class="exp-modal__chip">${t}</span>`).join('')}
              </div>
            </div>
          ` : ''}
        </div>

        <div class="exp-modal__footer">
          <button class="exp-modal__nav-btn" ${idx === 0 ? 'disabled' : ''} onclick="openExperienceModal(${idx - 1})">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="15 18 9 12 15 6"/></svg>
            <span>${window.t('modal_exp_prev_btn')}</span>
          </button>
          <button class="exp-modal__nav-btn" ${idx === total - 1 ? 'disabled' : ''} onclick="openExperienceModal(${idx + 1})">
            <span>${window.t('modal_exp_next_btn')}</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>
      </div>
    `;

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  window.openExperienceModal = openExperienceModal;

  function closeExperienceModal() {
    activeExpModalIdx = null;
    const modal = document.getElementById('expModal');
    if (modal) {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  /* ── Interactive Cards List ── */
  function buildExperienceCards() {
    const existingList = document.getElementById('expCardsList');
    if (existingList) existingList.remove();

    const fullWrap = document.getElementById('expFullMap');
    if (!fullWrap || !D.experience) return;

    const listWrap = el('div', { class: 'exp-cards-list', id: 'expCardsList' });

    D.experience.forEach((item, idx) => {
      const catText = getLoc(item, 'typeLabel') || 'EXPERIENCE';
      const headlineText = getLoc(item, 'headline');

      const card = el('article', {
        class: 'exp-detail-card',
        id: `exp-card-${idx}`,
        role: 'button',
        tabindex: '0',
      });

      card.innerHTML = `
        <div class="exp-card__header">
          <div class="exp-card__badge-row">
            <span class="exp-card__type-badge">${catText.toUpperCase()}</span>
            <span class="exp-card__period">${item.period}</span>
          </div>
          <h2 class="exp-card__role">${item.role}</h2>
          <div class="exp-card__org">${item.org} · <span class="exp-card__loc">${item.location}</span></div>
          ${item.gpa ? `<div class="exp-card__gpa">GPA: ${item.gpa}</div>` : ''}
        </div>

        <div class="exp-card__body">
          ${headlineText ? `<p class="exp-card__headline">${headlineText}</p>` : ''}
          
          ${item.technologies && item.technologies.length ? `
            <div class="exp-card__tech-row">
              ${item.technologies.map(t => `<span class="exp-card__tech-pill">${t}</span>`).join('')}
            </div>
          ` : ''}
        </div>

        <div class="exp-card__footer-cta">
          <span>${window.t('exp_view_cta')}</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
        </div>
      `;

      card.addEventListener('click', () => {
        openExperienceModal(idx);
      });

      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openExperienceModal(idx);
        }
      });

      listWrap.appendChild(card);
    });

    fullWrap.parentNode.insertBefore(listWrap, fullWrap.nextSibling);
  }

  /* ── Rich Inline Certifications Grid (Direct Image Visuals) ── */
  function buildCertifications() {
    const grid = document.getElementById('certsGrid');
    if (!grid || !D.certifications) return;

    grid.innerHTML = '';

    D.certifications.forEach(cert => {
      const card = el('div', {
        class: 'cert-card cert-card--inline',
        role: 'listitem',
      });

      const catText = getLoc(cert, 'category') || 'CERTIFICATE';
      const imgSrc = cert.image ? resolveAsset(cert.image) : '';
      const pdfTarget = cert.credential ? resolveAsset(cert.credential) : '';

      card.innerHTML = `
        ${imgSrc ? `
          <div class="cert-card__visual-wrap" role="button" tabindex="0" aria-label="${window.t('aria_cert_expand')} ${cert.name}">
            <img src="${imgSrc}" alt="${cert.name}" loading="lazy" class="cert-card__img">
            <div class="cert-card__visual-overlay">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
              <span>${window.t('cert_btn_expand')}</span>
            </div>
          </div>
        ` : ''}

        <h3 class="cert-card__title">${cert.name}</h3>
        <div class="cert-card__issuer">${cert.issuer}</div>
        <div class="cert-card__meta-bottom">
          <span class="cert-card__year">${cert.year}</span>
          ${pdfTarget ? `
            <a href="${pdfTarget}" target="_blank" rel="noopener noreferrer" class="cert-card__pdf-btn" aria-label="Open PDF document for ${cert.name}">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              <span>${window.t('cert_btn_pdf')}</span>
            </a>
          ` : ''}
        </div>
      `;

      const visualWrap = card.querySelector('.cert-card__visual-wrap');
      if (visualWrap && imgSrc) {
        visualWrap.addEventListener('click', () => {
          openCertLightbox(imgSrc, cert.name, cert.issuer);
        });
        visualWrap.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openCertLightbox(imgSrc, cert.name, cert.issuer);
          }
        });
      }

      grid.appendChild(card);
    });
  }

  /* ── Certificate Lightbox Modal ── */
  function openCertLightbox(imgSrc, title, issuer) {
    let lb = document.getElementById('certLightbox');
    if (!lb) {
      lb = el('div', {
        id: 'certLightbox',
        class: 'cert-lightbox-backdrop',
        role: 'dialog',
        'aria-modal': 'true',
        'aria-label': 'Certificate Preview',
      });
      document.body.appendChild(lb);

      lb.addEventListener('click', (e) => {
        if (e.target === lb || e.target.closest('#certLightboxClose')) {
          lb.classList.remove('active');
          document.body.style.overflow = '';
        }
      });

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && lb.classList.contains('active')) {
          lb.classList.remove('active');
          document.body.style.overflow = '';
        }
      });
    }

    lb.innerHTML = `
      <div class="cert-lightbox__dialog">
        <button class="cert-lightbox__close" id="certLightboxClose" aria-label="${window.t('aria_modal_close')}">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
        <div class="cert-lightbox__img-wrap">
          <img src="${imgSrc}" alt="${title}" class="cert-lightbox__img">
        </div>
        <div class="cert-lightbox__caption">
          <div class="cert-lightbox__title">${title}</div>
          <div class="cert-lightbox__issuer">${issuer}</div>
        </div>
      </div>
    `;

    lb.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  /* ── Listen for language change to update dynamic content ── */
  document.addEventListener('langchange', () => {
    const isIndo = window.currentLang === 'id';

    if (IS.home) {
      document.title = 'Erliandika Syahputra — Software Engineer';
      buildExpPreviewMap();
      buildHomeTrailer();
    }
    if (IS.projects) {
      document.title = isIndo ? 'Proyek — Erliandika Syahputra' : 'Projects — Erliandika Syahputra';
      if (typeof window.reRenderProjectRows === 'function') {
        window.reRenderProjectRows();
      }
      if (activeModalProject && document.getElementById('projectModal')?.classList.contains('active')) {
        if (typeof window.reOpenProjectModal === 'function') {
          window.reOpenProjectModal();
        }
      }
    }
    if (IS.detail) {
      initProjectDetailPage();
    }
    if (IS.exp) {
      document.title = isIndo ? 'Pengalaman & Pendidikan — Erliandika Syahputra' : 'Experience & Education — Erliandika Syahputra';
      buildFullSnakingMap();
      buildExperienceCards();
      buildCertifications();
      if (activeExpModalIdx !== null && document.getElementById('expModal')?.classList.contains('active')) {
        openExperienceModal(activeExpModalIdx);
      }
    }
  });
});
