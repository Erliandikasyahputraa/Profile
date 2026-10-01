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
  const isNestedSub = document.querySelector('link[href*="../../assets/"]') !== null || pathLower.includes('/pages/projects/') || (pathLower.includes('/projects/') && !pathLower.endsWith('projects.html') && !pathLower.endsWith('/projects'));
  const IS_PAGES = isNestedSub ? false : (pathLower.includes('/pages/') || pathLower.includes('\\pages\\') || document.querySelector('link[href*="../assets/"]') !== null);
  const ROOT_REL = isNestedSub ? '../../' : (IS_PAGES ? '../' : './');
  const PAGES_REL = isNestedSub ? '../' : (IS_PAGES ? '' : 'pages/');

  function resolveAsset(p) {
    if (!p || typeof p !== 'string' || p.startsWith('http') || p.startsWith('//') || p.startsWith('data:')) return p;
    return ROOT_REL + p.replace(/^\.\//, '');
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
  let currentHomeExpMode = null;

  if (IS.home) {
    initProfileGlitch();
    currentHomeExpMode = window.innerWidth < 900 ? 'mobile' : 'desktop';
    buildExpPreviewMap();
    buildHomeTrailer();

    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        const newMode = window.innerWidth < 900 ? 'mobile' : 'desktop';
        if (newMode !== currentHomeExpMode) {
          currentHomeExpMode = newMode;
          buildExpPreviewMap();
        }
      }, 200);
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

  // Prime Web Audio on initial discrete user gesture
  ['click', 'pointerdown', 'keydown', 'touchstart'].forEach(evt => {
    window.addEventListener(evt, () => {
      const ctx = getAppAudioCtx();
      if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
    }, { passive: true, once: true });
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

  /* ── Career Journey: Numbered Timeline Preview (Home) ── */
  function buildExpPreviewMap() {
    const wrap = document.getElementById('expPreviewMap');
    if (!wrap) return;
    const milestones = D.journeyMilestones || [];
    wrap.innerHTML = '';

    const track = el('div', { class: 'journey-track' });

    milestones.forEach((m, i) => {
      const num = String(i + 1).padStart(2, '0');
      const badgeText = getLoc(m, 'badge');
      const titleText = getLoc(m, 'title');
      const reflectionText = getLoc(m, 'reflection');

      const step = el('div', {
        class: 'journey-step',
        tabindex: '0',
        role: 'button',
        'aria-label': `${titleText} — ${m.year}`,
      });

      step.innerHTML = `
        <div class="journey-step__num">${num}</div>
        <div class="journey-step__connector" aria-hidden="true"></div>
        <div class="journey-step__body">
          <div class="journey-step__badge">${badgeText}</div>
          <div class="journey-step__title">${titleText}</div>
          <div class="journey-step__year">${m.year}</div>
          <div class="journey-step__role">${m.role || ''}</div>
        </div>
        <div class="journey-step__detail" aria-hidden="true">
          <p class="journey-step__reflection">${reflectionText}</p>
          <div class="journey-step__loc">${m.location || ''}</div>
          <div class="journey-step__cta">
            <span>${window.t('exp_view_cta')}</span>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
          </div>
        </div>
      `;

      step.addEventListener('click', () => {
        window.location.href = PAGES_REL + 'experience.html';
      });
      step.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          window.location.href = PAGES_REL + 'experience.html';
        }
      });

      track.appendChild(step);
    });

    // End node — explore CTA
    const ctaStep = el('a', {
      class: 'journey-step journey-step--cta',
      href: PAGES_REL + 'experience.html',
      'aria-label': window.t('journey_explore_cta'),
    });
    ctaStep.innerHTML = `
      <div class="journey-step__num journey-step__num--arrow">→</div>
      <div class="journey-step__connector" aria-hidden="true"></div>
      <div class="journey-step__body">
        <div class="journey-step__badge">${window.currentLang === 'id' ? 'LINIMASA LENGKAP' : 'FULL TIMELINE'}</div>
        <div class="journey-step__title">${window.t('journey_explore_cta')}</div>
      </div>
    `;
    track.appendChild(ctaStep);

    wrap.appendChild(track);
  }

  /* ── Career Journey: Full Numbered Timeline (Exp Page) ── */
  function buildFullSnakingMap() {
    const wrap = document.getElementById('expFullMap');
    if (!wrap || !D.experience || !D.experience.length) return;
    wrap.innerHTML = '';

    const items = D.experience;
    const isIndo = window.currentLang === 'id';

    const timeline = el('div', { class: 'exp-timeline', 'aria-label': isIndo ? 'Linimasa Karier' : 'Career Timeline' });

    items.forEach((item, i) => {
      const num = String(i + 1).padStart(2, '0');
      const catText = getLoc(item, 'typeLabel') || 'MILESTONE';
      const headlineText = getLoc(item, 'headline');

      const row = el('article', {
        class: 'exp-tl-row',
        id: `exp-tl-${i}`,
        role: 'button',
        tabindex: '0',
        'aria-label': `${num} — ${item.role} at ${item.org}, ${item.period}`,
      });

      row.innerHTML = `
        <div class="exp-tl__left">
          <span class="exp-tl__num">${num}</span>
          <div class="exp-tl__vline" aria-hidden="true"></div>
        </div>
        <div class="exp-tl__right">
          <div class="exp-tl__meta-row">
            <span class="exp-tl__cat">${catText.toUpperCase()}</span>
            <span class="exp-tl__period">${item.period || item.year}</span>
          </div>
          <h2 class="exp-tl__role">${item.role}</h2>
          <div class="exp-tl__org">${item.org}<span class="exp-tl__loc"> · ${item.location}</span></div>
          ${item.gpa ? `<div class="exp-tl__gpa">GPA ${item.gpa}</div>` : ''}
          ${headlineText ? `<p class="exp-tl__headline">${headlineText}</p>` : ''}
          ${item.technologies && item.technologies.length ? `
            <div class="exp-tl__chips">
              ${item.technologies.slice(0, 5).map(t => `<span class="exp-tl__chip">${t}</span>`).join('')}
              ${item.technologies.length > 5 ? `<span class="exp-tl__chip exp-tl__chip--more">+${item.technologies.length - 5}</span>` : ''}
            </div>
          ` : ''}
          <div class="exp-tl__open-cta">
            <span>${window.t('exp_view_cta')}</span>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
          </div>
        </div>
      `;

      row.addEventListener('click', () => openExperienceModal(i));
      row.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openExperienceModal(i);
        }
      });

      timeline.appendChild(row);
    });

    // Destination — Next Chapter CTA
    const destRow = el('a', {
      class: 'exp-tl-row exp-tl-row--dest',
      href: `mailto:syahputraerliandika@gmail.com?subject=Collaboration%20Inquiry%20%E2%80%94%20Erliandika%20Syahputra`,
      'aria-label': window.t('map_dest_cta'),
    });
    destRow.innerHTML = `
      <div class="exp-tl__left">
        <span class="exp-tl__num exp-tl__num--dest">✦</span>
      </div>
      <div class="exp-tl__right">
        <div class="exp-tl__meta-row">
          <span class="exp-tl__cat">${window.t('map_dest_badge')}</span>
        </div>
        <h2 class="exp-tl__role exp-tl__role--dest">${window.t('map_dest_title')}</h2>
        <div class="exp-tl__open-cta exp-tl__open-cta--dest">
          <span>${window.t('map_dest_cta')}</span>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
        </div>
      </div>
    `;
    timeline.appendChild(destRow);

    // Floating Sneak Peek Card (kept for compat, now not used by timeline but needed by openExperienceModal)
    wrap.appendChild(timeline);
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
        : ['assets/images/profile-primary.webp'];
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
      const rawImages = hasImages ? p.temporaryPreviewImages : ['assets/images/profile-primary.webp'];
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
              <img id="modalShowcaseImg" src="${images[0]}" alt="${p.name} showcase" loading="eager" decoding="async" class="pmodal__showcase-img" onerror="this.onerror=null;this.src='${fallbackSvg}'">
            </div>

            ${images.length > 1 ? `
              <div class="pmodal__gallery-strip">
                ${images.map((src, i) => `
                  <button class="pmodal__thumb-btn ${i === 0 ? 'active' : ''}" data-src="${src}" aria-label="View preview ${i + 1}">
                    <img src="${src}" alt="Thumbnail ${i + 1}" loading="lazy" decoding="async" onerror="this.onerror=null;this.src='${fallbackSvg}'">
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
          : ['assets/images/profile-primary.webp'];
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
              <a href="projects/${p.slug}.html" class="project-modal-trigger">${p.name}</a>
            </h2>
            <p class="parow__desc">${descText}</p>
            <div class="parow__year">${p.year || '2025'} · ${roleText ? roleText.split('—')[0].trim() : 'Software Engineer'}</div>
          </div>

          <div class="parow__center">
            <a href="projects/${p.slug}.html" class="parow__img-link project-modal-trigger" tabindex="-1" aria-hidden="true">
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
    let slug = urlParams.get('slug');
    if (!slug) {
      const fn = (window.location.pathname || '').split('/').pop() || '';
      if (fn.endsWith('.html') && fn !== 'project.html' && fn !== 'projects.html') {
        slug = fn.replace('.html', '');
      }
    }
    if (!slug) slug = 'tekateki';
    const project = D.projects.find(p => p.slug === slug) || D.projects[0];

    if (!project) {
      root.innerHTML = `<p class="pdetail__not-found">${window.t('pdetail_not_found')}</p>`;
      return;
    }

    document.title = `${project.name} — Erliandika Syahputra | Software Engineer`;

    const hasImages = project.temporaryPreviewImages && project.temporaryPreviewImages.length > 0;
    const rawImages = hasImages ? project.temporaryPreviewImages : ['assets/images/profile-primary.webp'];
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
    const backHref = isNestedSub ? '../projects.html' : 'projects.html';

    root.innerHTML = `
      <div class="pdetail__header">
        <a href="${backHref}" class="pdetail__back-link">
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
  let currentExpMode = null;

  if (IS.exp) {
    initExperiencePage();
  }

  function initExperiencePage() {
    currentExpMode = window.innerWidth < 900 ? 'mobile' : 'desktop';
    buildFullSnakingMap();
    buildExperienceCards();
    buildCertifications();

    let expResizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(expResizeTimer);
      expResizeTimer = setTimeout(() => {
        const newMode = window.innerWidth < 900 ? 'mobile' : 'desktop';
        if (newMode !== currentExpMode) {
          currentExpMode = newMode;
          buildFullSnakingMap();
        }
      }, 200);
    }, { passive: true });
  }

  /* ── 3-Zone Career Expedition Map (Organic Cartographic Journey) ── */
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
            <img src="${imgSrc}" alt="${cert.name}" loading="lazy" decoding="async" class="cert-card__img">
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
      currentHomeExpMode = window.innerWidth < 900 ? 'mobile' : 'desktop';
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
      currentExpMode = window.innerWidth < 900 ? 'mobile' : 'desktop';
      buildFullSnakingMap();
      buildExperienceCards();
      buildCertifications();
      if (activeExpModalIdx !== null && document.getElementById('expModal')?.classList.contains('active')) {
        openExperienceModal(activeExpModalIdx);
      }
    }
  });
});
