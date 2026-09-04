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
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg.trim());
  }

  /* ── Bilingual Data Getter Helper ── */
  function getLoc(item, field) {
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
      // Rich, dark, distinct cyber volume
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
        // Darker resonance frequencies
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
      fog1.appendChild(mkSVG('stop', { offset: '0%', 'stop-color': 'var(--fog-color, #C8C8C8)', 'stop-opacity': '0.55' }));
      fog1.appendChild(mkSVG('stop', { offset: '100%', 'stop-color': 'var(--fog-color, #C8C8C8)', 'stop-opacity': '0' }));
      defs.appendChild(fog1);

      const fog2 = mkSVG('radialGradient', { id: 'fogRadial2', cx: '50%', cy: '50%', r: '50%' });
      fog2.appendChild(mkSVG('stop', { offset: '0%', 'stop-color': 'var(--fog-color-2, #D0D0D0)', 'stop-opacity': '0.45' }));
      fog2.appendChild(mkSVG('stop', { offset: '100%', 'stop-color': 'var(--fog-color-2, #D0D0D0)', 'stop-opacity': '0' }));
      defs.appendChild(fog2);

      const fog3 = mkSVG('radialGradient', { id: 'fogRadial3', cx: '50%', cy: '50%', r: '50%' });
      fog3.appendChild(mkSVG('stop', { offset: '0%', 'stop-color': 'var(--fog-color-3, #DADADA)', 'stop-opacity': '0.38' }));
      fog3.appendChild(mkSVG('stop', { offset: '100%', 'stop-color': 'var(--fog-color-3, #DADADA)', 'stop-opacity': '0' }));
      defs.appendChild(fog3);

      svg.appendChild(defs);

      // Curved organic winding path leading into the uncharted mist
      const pathD = `
        M 60 140
        C 130 140, 150 80, 205 80
        C 285 80, 345 200, 415 200
        C 495 200, 555 90, 625 90
        C 700 90, 740 170, 795 170
        C 850 170, 895 110, 945 110
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

        const g = mkSVG('g', {
          class: 'map-node-group',
          tabindex: '0',
          role: 'button',
          'aria-label': `${nd.item.title} (${nd.item.year})`,
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

        g.appendChild(mkSVGText(nd.item.badge, nd.textX, isAbove ? nd.textY - 14 : nd.textY, 'map-label-tag', anchor));
        g.appendChild(mkSVGText(nd.item.year, nd.textX, isAbove ? nd.textY : nd.textY + 14, 'map-label-year', anchor));
        g.appendChild(mkSVGText(nd.item.title, nd.textX, isAbove ? nd.textY + 16 : nd.textY + 30, 'map-label-title', anchor));

        // Exact Hover Sneak Peek Trigger
        g.addEventListener('mouseenter', () => {
          const isIndo = window.currentLang === 'id';
          const badgeText = (isIndo && nd.item.badge_id) ? nd.item.badge_id : nd.item.badge;
          const titleText = (isIndo && nd.item.title_id) ? nd.item.title_id : nd.item.title;
          const reflectionText = (isIndo && nd.item.reflection_id) ? nd.item.reflection_id : nd.item.reflection;
          const roleText = nd.item.role ? `<span class="msp-role">${nd.item.role}</span>` : '';
          const locText = nd.item.location ? `<span class="msp-loc"> · ${nd.item.location}</span>` : '';

          peekCard.innerHTML = `
            <div class="msp-header">
              <span class="msp-badge">${badgeText}</span>
              <span class="msp-year">${nd.item.year}</span>
            </div>
            <div class="msp-title">${titleText}</div>
            <div class="msp-meta">${roleText}${locText}</div>
            <p class="msp-desc">${reflectionText}</p>
            <div class="msp-hint">
              <span>${isIndo ? 'LIHAT DETAIL KISAH' : 'CLICK TO VIEW STORY'}</span>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </div>
          `;

          // Exact pixel calculation relative to wrap container
          const dotRect = dot.getBoundingClientRect();
          const wrapRect = wrap.getBoundingClientRect();

          const relX = (dotRect.left + dotRect.width / 2) - wrapRect.left + wrap.scrollLeft;
          const relY = (dotRect.top + dotRect.height / 2) - wrapRect.top;

          peekCard.style.left = `${relX}px`;
          // Open into the open space opposite the text label
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

      // ── Soft Organic Fog / Mist Layers at the Uncharted Edge ──
      const fogGroup = mkSVG('g', { class: 'map-soft-clouds', 'aria-hidden': 'true' });
      fogGroup.appendChild(mkSVG('ellipse', { cx: '945', cy: '110', rx: '95', ry: '70', fill: 'url(#fogRadial1)' }));
      fogGroup.appendChild(mkSVG('ellipse', { cx: '970', cy: '145', rx: '80', ry: '55', fill: 'url(#fogRadial2)' }));
      fogGroup.appendChild(mkSVG('ellipse', { cx: '915', cy: '90',  rx: '65', ry: '45', fill: 'url(#fogRadial3)' }));
      svg.appendChild(fogGroup);

      // ── Mystery Waypoint / Uncharted Trajectory Endpoint ──
      const mysteryG = mkSVG('g', {
        class: 'map-node-group map-mystery-anchor',
        tabindex: '0',
        role: 'button',
        'aria-label': 'Uncharted trajectory — Click to explore the complete journey',
      });

      const radar = mkSVG('circle', {
        cx: '945',
        cy: '110',
        r: '14',
        class: 'waypoint-radar',
      });
      mysteryG.appendChild(radar);

      const qGlyph = mkSVG('text', {
        x: '945',
        y: '118',
        class: 'map-mystery-glyph',
        'text-anchor': 'middle',
      });
      qGlyph.textContent = '?';
      mysteryG.appendChild(qGlyph);

      const subLabel = mkSVG('text', {
        x: '945',
        y: '142',
        class: 'map-mystery-sub',
        'text-anchor': 'middle',
      });
      subLabel.textContent = 'UNCHARTED';
      mysteryG.appendChild(subLabel);

      const pillG = mkSVG('g', { class: 'waypoint-pill-tooltip' });
      const pillBg = mkSVG('rect', {
        x: '880',
        y: '58',
        width: '130',
        height: '24',
        rx: '12',
        class: 'wp-pill-bg',
      });
      pillG.appendChild(pillBg);
      const pillText = mkSVG('text', {
        x: '945',
        y: '74',
        class: 'wp-pill-text',
        'text-anchor': 'middle',
      });
      pillText.textContent = 'EXPLORE FULL →';
      pillG.appendChild(pillText);
      mysteryG.appendChild(pillG);

      mysteryG.addEventListener('click', () => {
        window.location.href = PAGES_REL + 'experience.html';
      });

      svg.appendChild(mysteryG);

      wrap.appendChild(svg);
    } else {
      // Mobile preview list
      const listWrap = el('div', { class: 'exp-mobile-preview-list' });
      milestones.forEach((m, idx) => {
        const itemEl = el('a', {
          href: PAGES_REL + 'experience.html',
          class: 'exp-mobile-preview-item',
        });
        itemEl.innerHTML = `
          <div class="exp-mobile-preview-dot"></div>
          <div class="exp-mobile-preview-body">
            <div class="exp-mobile-preview-meta">
              <span class="map-label-tag">${m.badge}</span>
              <span class="map-label-year">${m.year}</span>
            </div>
            <div class="map-label-title">${m.title}</div>
            <div class="exp-mobile-preview-desc">${m.reflection}</div>
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
        'aria-label': `${p.name} — ${getLoc(p, 'category')}. View case study.`,
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
      const ctaText = window.t ? window.t('project_row_cta') : 'VIEW CASE STUDY';
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
      'aria-label': 'View all projects archive',
      title: window.t ? window.t('projects_view_all') : 'View all projects',
    });

    const isIndo = window.currentLang === 'id';
    const tagText = isIndo ? 'ARSIP' : 'ARCHIVE';
    const labelText = isIndo ? 'LIHAT SEMUA' : 'ALL PROJECTS';

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
     3. PROJECTS ARCHIVE PAGE (projects.html)
     ONE PROJECT = ONE ROW (No popups / modals)
  ════════════════════════════════════════════ */
  if (IS.projects) {
    initProjectsArchive();
  }

  function initProjectsArchive() {
    const container = document.getElementById('projectRows');
    const filterTabs = document.querySelectorAll('.archive-filter-btn');
    const countEl = document.getElementById('projectCount');
    if (!container || !D.projects) return;

    let activeFilter = 'all';

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
        const fanImg1 = resolveAsset(rawList[1] || rawList[0]);
        const fanImg2 = resolveAsset(rawList[2] || rawList[0]);
        const fanImg3 = resolveAsset(rawList[3] || rawList[1] || rawList[0]);

        const catText = getLoc(p, 'category') || 'PROJECT';
        const descText = getLoc(p, 'shortDescription');
        const roleText = getLoc(p, 'role');
        const ctaText = window.t ? window.t('project_row_cta') : 'Case Study';
        const fallbackSvg = getProjectSvgPlaceholder(p.name, catText);
        const liveDemoTarget = resolveAsset(p.liveDemo || '404.html');

        // 3 Coherent Columns in ONE row: Left (Identity), Center (Showcase), Right (Tech & Links)
        row.innerHTML = `
          <div class="parow__left">
            <div class="parow__cat">${catText.toUpperCase()}</div>
            <h2 class="parow__title">
              <a href="project.html?slug=${p.slug}">${p.name}</a>
            </h2>
            <p class="parow__desc">${descText}</p>
            <div class="parow__year">${p.year || '2025'} · ${roleText ? roleText.split('—')[0].trim() : 'Software Engineer'}</div>
          </div>

          <div class="parow__center">
            <a href="project.html?slug=${p.slug}" class="parow__img-link" tabindex="-1" aria-hidden="true">
              <div class="parow__img-wrap">
                <img src="${imgSrc}" alt="${p.name} screenshot" loading="lazy" class="parow__img" onerror="this.onerror=null;this.src='${fallbackSvg}'">
              </div>
            </a>
          </div>

          <div class="parow__right">
            <div class="parow__tech-sec">
              <span class="parow__tech-lbl">${window.t ? window.t('tech_col_label') : 'TECH STACK'}</span>
              <div class="parow__tech-list">
                ${(p.techStack || []).map(t => `<span class="parow__tech-pill">${t}</span>`).join('')}
              </div>
            </div>

            <div class="parow__links">
              <a href="project.html?slug=${p.slug}" class="parow__cta-btn">
                <span>${ctaText}</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </a>
              <a href="${liveDemoTarget}" class="parow__ext-link" aria-label="Live demo for ${p.name}">
                <span>Live Demo</span>
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

        // Direct navigation on row click (excluding external link clicks)
        row.addEventListener('click', (e) => {
          if (e.target.closest('a')) return;
          window.location.href = `project.html?slug=${p.slug}`;
        });

        container.appendChild(row);
      });

      if (list.length === 0) {
        container.innerHTML = `
          <div class="parow__empty">
            <p>${window.t ? window.t('empty_category') : 'No projects found in this category.'}</p>
          </div>
        `;
      }
    }

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
      root.innerHTML = '<p class="pdetail__not-found">Project not found.</p>';
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

    root.innerHTML = `
      <div class="pdetail__header">
        <a href="projects.html" class="pdetail__back-link">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          <span data-i18n="pdetail_back">${window.t ? window.t('pdetail_back') : 'BACK TO PROJECTS'}</span>
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
              <h2 class="pdetail__sec-label">${window.t ? window.t('modal_label_problem') : 'PROBLEM'}</h2>
              <p class="pdetail__sec-text">${probText}</p>
            </div>
          ` : ''}

          ${whyText ? `
            <div class="pdetail__story-block">
              <h2 class="pdetail__sec-label">${window.t ? window.t('modal_label_why') : 'WHY I BUILT IT'}</h2>
              <p class="pdetail__sec-text">${whyText}</p>
            </div>
          ` : ''}

          ${solText ? `
            <div class="pdetail__story-block">
              <h2 class="pdetail__sec-label">${window.t ? window.t('modal_label_solution') : 'SOLUTION'}</h2>
              <p class="pdetail__sec-text">${solText}</p>
            </div>
          ` : ''}

          ${roleText ? `
            <div class="pdetail__story-block">
              <h2 class="pdetail__sec-label">${window.t ? window.t('modal_label_role') : 'MY ROLE'}</h2>
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
              <h2 class="pdetail__sec-label">${window.t ? window.t('modal_label_tech') : 'ARCHITECTURE & DECISIONS'}</h2>
              <p class="pdetail__sec-text">${techDetailsText}</p>
            </div>
          ` : ''}
        </div>

        <!-- 30% RIGHT: TECH + LINKS -->
        <div class="pdetail__col-tech">
          <div class="pdetail__tech-box">
            <h2 class="pdetail__sec-label">${window.t ? window.t('modal_label_tech_stack') : 'TECH STACK'}</h2>
            <div class="pdetail__tech-badges">
              ${(project.techStack || []).map(t => `<span class="pdetail__tech-pill">${t}</span>`).join('')}
            </div>
          </div>

          <div class="pdetail__links-box">
            <h2 class="pdetail__sec-label">${window.t ? window.t('modal_label_overview') : 'PROJECT LINKS'}</h2>
            <div class="pdetail__actions">
              <a href="${liveDemoTarget}" class="pdetail__btn primary" aria-label="Visit Live Demo for ${project.name}">
                <span>Live Demo</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M7 17L17 7M17 7H7M17 7v10"/></svg>
              </a>
              ${project.github ? `
                <a href="${project.github}" target="_blank" rel="noopener noreferrer" class="pdetail__btn secondary" aria-label="Visit GitHub repository for ${project.name}">
                  <span>GitHub Repository</span>
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
  if (IS.exp) {
    initExperiencePage();
  }

  function initExperiencePage() {
    buildFullSnakingMap();
    buildExperienceCards();
    buildCertifications();
  }

  /* ── 3-Tier Snaking Road Map (Real Journey Trail) ── */
  function buildFullSnakingMap() {
    const wrap = document.getElementById('expFullMap');
    if (!wrap || !D.experience || !D.experience.length) return;

    wrap.innerHTML = '';

    const items = D.experience;
    const isMobile = window.innerWidth < 768;

    if (!isMobile) {
      const VW = 960;
      const VH = 520;

      const svg = mkSVG('svg', {
        viewBox: `0 0 ${VW} ${VH}`,
        width: '100%',
        height: 'auto',
        class: 'exp-snaking-svg',
        'aria-label': 'Interactive career journey map',
      });

      // Coordinates for 8 milestones arranged in a 3-tier snaking road:
      // Row 1: Left to Right (y = 85)
      // Row 2: Right to Left (y = 255)
      // Row 3: Left to Right (y = 425)
      const NODE_POSITIONS = [
        { x: 140, y: 85,  side: 'above', textY: 45 },  // 0: S1 Sistem Informasi (2022-2026)
        { x: 480, y: 85,  side: 'above', textY: 45 },  // 1: IT Support 83 Workstations (2022-2024)
        { x: 800, y: 85,  side: 'above', textY: 45 },  // 2: Network Deployment 256 APs (2024)
        { x: 800, y: 255, side: 'below', textY: 295 }, // 3: Bangkit Mobile Dev (2024-2025)
        { x: 480, y: 255, side: 'below', textY: 295 }, // 4: Head of Software Dev (2025-2026)
        { x: 140, y: 255, side: 'below', textY: 295 }, // 5: Coding Camp Full-Stack (2025)
        { x: 240, y: 425, side: 'above', textY: 385 }, // 6: Sertifikasi BNSP Web (2025-2028)
        { x: 620, y: 425, side: 'above', textY: 385 }, // 7: Event & Community Leadership (2023-2025)
      ];

      // Smooth snaking path with U-turns
      const pathD = `
        M 50 85
        L 800 85
        C 920 85, 920 255, 800 255
        L 140 255
        C 20 255, 20 425, 140 425
        L 850 425
      `;

      // Background road glow
      const roadGlow = mkSVG('path', {
        d: pathD,
        class: 'map-road-glow',
      });
      svg.appendChild(roadGlow);

      // Main dashed road
      const roadPath = mkSVG('path', {
        d: pathD,
        class: 'map-road-track',
      });
      svg.appendChild(roadPath);

      // Start origin pin
      svg.appendChild(mkSVG('circle', {
        cx: '50',
        cy: '85',
        r: '5',
        class: 'map-node-start',
      }));

      // Goal flag endpoint
      const goalG = mkSVG('g', { class: 'map-goal-flag' });
      goalG.appendChild(mkSVG('circle', { cx: '850', cy: '425', r: '6', class: 'map-goal-core' }));
      const goalText = mkSVGText('PRESENT ⚡', 850, 405, 'map-goal-label', 'middle');
      goalG.appendChild(goalText);
      svg.appendChild(goalG);

      // Render Waypoints
      items.forEach((item, i) => {
        const pos = NODE_POSITIONS[i];
        if (!pos) return;

        const g = mkSVG('g', {
          class: 'map-node-group map-snaking-node',
          tabindex: '0',
          role: 'button',
          'aria-label': `${item.role} at ${item.org} (${item.period})`,
        });

        // Pulsing halo ring
        const halo = mkSVG('circle', {
          cx: String(pos.x),
          cy: String(pos.y),
          r: '13',
          class: 'map-node-ring',
        });
        g.appendChild(halo);

        // Core dot
        const core = mkSVG('circle', {
          cx: String(pos.x),
          cy: String(pos.y),
          r: '6',
          class: 'map-node-core',
        });
        g.appendChild(core);

        // Step index tag
        const isAbove = pos.side === 'above';
        const isIndo = window.currentLang === 'id';
        const tagText = (isIndo && item.typeLabel_id) ? item.typeLabel_id : (item.typeLabel || 'MILESTONE');
        const roleShort = item.role.length > 28 ? item.role.substring(0, 26) + '…' : item.role;

        // Tag badge
        g.appendChild(mkSVGText(
          `${String(i + 1).padStart(2, '0')} · ${tagText.toUpperCase()}`,
          pos.x,
          isAbove ? pos.textY - 14 : pos.textY,
          'map-label-tag',
          'middle'
        ));

        // Year/Period
        g.appendChild(mkSVGText(
          item.period || item.year,
          pos.x,
          isAbove ? pos.textY : pos.textY + 14,
          'map-label-year',
          'middle'
        ));

        // Title
        g.appendChild(mkSVGText(
          roleShort,
          pos.x,
          isAbove ? pos.textY + 16 : pos.textY + 30,
          'map-label-title',
          'middle'
        ));

        // Click opens Experience Dossier Popup
        g.addEventListener('click', () => {
          openExperienceModal(i);
        });

        g.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openExperienceModal(i);
          }
        });

        svg.appendChild(g);
      });

      wrap.appendChild(svg);
    }
  }

  /* ── Dedicated Experience Dossier Modal Popup ── */
  let currentExpModalIdx = 0;

  function openExperienceModal(idx) {
    if (!D.experience || !D.experience[idx]) return;
    currentExpModalIdx = idx;

    let modal = document.getElementById('expModal');
    if (!modal) {
      modal = el('div', {
        id: 'expModal',
        class: 'exp-modal-backdrop',
        role: 'dialog',
        'aria-modal': 'true',
        'aria-label': 'Experience Dossier Details',
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
        if (e.key === 'ArrowLeft' && currentExpModalIdx > 0) openExperienceModal(currentExpModalIdx - 1);
        if (e.key === 'ArrowRight' && currentExpModalIdx < D.experience.length - 1) openExperienceModal(currentExpModalIdx + 1);
      });
    }

    const item = D.experience[idx];
    const isIndo = window.currentLang === 'id';
    const total = D.experience.length;
    const catText = (isIndo && item.typeLabel_id) ? item.typeLabel_id : (item.typeLabel || 'EXPERIENCE');
    const headlineText = (isIndo && item.headline_id) ? item.headline_id : item.headline;
    const bgText = (isIndo && item.beginning_id) ? item.beginning_id : item.beginning;
    const workText = (isIndo && item.work_id) ? item.work_id : item.work;
    const probText = (isIndo && item.problem_id) ? item.problem_id : item.problem;
    const impactText = (isIndo && item.impact_id) ? item.impact_id : item.impact;

    modal.innerHTML = `
      <div class="exp-modal__dialog" role="document">
        <button class="exp-modal__close-btn" id="expModalClose" aria-label="Close dossier">
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
                <h3 class="exp-dossier-card__title">${isIndo ? '01 · LATAR BELAKANG & AWAL MULA' : '01 · CONTEXT & ORIGIN'}</h3>
                <p class="exp-dossier-card__text">${bgText}</p>
              </div>
            ` : ''}

            ${workText ? `
              <div class="exp-dossier-card">
                <h3 class="exp-dossier-card__title">${isIndo ? '02 · LINGKUP TEKNIS & EKSEKUSI' : '02 · ENGINEERING SCOPE & EXECUTION'}</h3>
                <p class="exp-dossier-card__text">${workText}</p>
              </div>
            ` : ''}

            ${(probText || impactText) ? `
              <div class="exp-dossier-card">
                <h3 class="exp-dossier-card__title">${isIndo ? '03 · TANTANGAN & HASIL TERUKUR' : '03 · CHALLENGE & KEY OUTCOME'}</h3>
                ${probText ? `<p class="exp-dossier-card__text"><strong>${isIndo ? 'Tantangan:' : 'Challenge:'}</strong> ${probText}</p>` : ''}
                ${impactText ? `<p class="exp-dossier-card__text" style="margin-top:0.5rem"><strong>${isIndo ? 'Dampak:' : 'Outcome:'}</strong> ${impactText}</p>` : ''}
              </div>
            ` : ''}
          </div>

          ${item.bullets && item.bullets.length ? `
            <div class="exp-modal__section">
              <h3 class="exp-modal__sec-label">${isIndo ? 'SOROTAN UTAMA' : 'KEY HIGHLIGHTS'}</h3>
              <ul class="exp-modal__bullets">
                ${item.bullets.map(b => `<li>${b}</li>`).join('')}
              </ul>
            </div>
          ` : ''}

          ${item.technologies && item.technologies.length ? `
            <div class="exp-modal__section">
              <h3 class="exp-modal__sec-label">${isIndo ? 'ALAT & TEKNOLOGI' : 'TOOLS & TECHNOLOGIES'}</h3>
              <div class="exp-modal__tech-chips">
                ${item.technologies.map(t => `<span class="exp-modal__chip">${t}</span>`).join('')}
              </div>
            </div>
          ` : ''}
        </div>

        <div class="exp-modal__footer">
          <button class="exp-modal__nav-btn" ${idx === 0 ? 'disabled' : ''} onclick="openExperienceModal(${idx - 1})">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="15 18 9 12 15 6"/></svg>
            <span>${isIndo ? 'Milestone Sebelumnya' : 'Previous Milestone'}</span>
          </button>
          <button class="exp-modal__nav-btn" ${idx === total - 1 ? 'disabled' : ''} onclick="openExperienceModal(${idx + 1})">
            <span>${isIndo ? 'Milestone Selanjutnya' : 'Next Milestone'}</span>
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
    const modal = document.getElementById('expModal');
    if (modal) {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  /* ── Interactive Cards List ── */
  function buildExperienceCards() {
    const listWrap = el('div', { class: 'exp-cards-list', id: 'expCardsList' });
    const fullWrap = document.getElementById('expFullMap');
    if (!fullWrap || !D.experience) return;

    D.experience.forEach((item, idx) => {
      const isIndo = window.currentLang === 'id';
      const catText = (isIndo && item.typeLabel_id) ? item.typeLabel_id : (item.typeLabel || 'EXPERIENCE');
      const headlineText = (isIndo && item.headline_id) ? item.headline_id : item.headline;

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
          <span>${isIndo ? 'Buka Detail Dossier' : 'Open Full Dossier'}</span>
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

  /* ── Rich Inline Certifications Grid ── */
  function buildCertifications() {
    const grid = document.getElementById('certsGrid');
    if (!grid || !D.certifications) return;

    grid.innerHTML = '';
    const isIndo = window.currentLang === 'id';

    D.certifications.forEach(cert => {
      const card = el('div', {
        class: 'cert-card cert-card--inline',
        role: 'listitem',
      });

      const catText = (isIndo && cert.category_id) ? cert.category_id : (cert.category || 'CERTIFICATE');

      card.innerHTML = `
        <div class="cert-card__badge-row">
          <span class="cert-card__cat">${catText.toUpperCase()}</span>
          <span class="cert-card__verified-tag">✓ ${isIndo ? 'TERVERIFIKASI' : 'VERIFIED'}</span>
        </div>
        <h3 class="cert-card__title">${cert.name}</h3>
        <div class="cert-card__issuer">${cert.issuer}</div>
        <div class="cert-card__meta-bottom">
          <span class="cert-card__year">${cert.year}</span>
          ${cert.credential ? `
            <a href="${cert.credential}" target="_blank" rel="noopener noreferrer" class="cert-card__pdf-btn">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              <span>PDF PREVIEW</span>
            </a>
          ` : ''}
        </div>
      `;

      grid.appendChild(card);
    });
  }

  /* ── Listen for language change to update dynamic content ── */
  document.addEventListener('langchange', () => {
    if (IS.home) {
      buildExpPreviewMap();
      buildHomeTrailer();
    }
    if (IS.projects) {
      initProjectsArchive();
    }
    if (IS.detail) {
      initProjectDetailPage();
    }
    if (IS.exp) {
      initExperiencePage();
    }
  });
});
