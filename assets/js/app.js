/**
 * app.js — Unified controller for all portfolio pages.
 *
 * Architecture:
 *   - Universal Reusable Modal System (openModal('project' | 'experience', id))
 *   - 30% / 40% / 30% 3-Column Modal Grid Layout for Project Case Studies & Experience Stories
 *   - 30% / 40% / 30% Stacked Project Blocks on projects.html
 *   - Interactive Sinusoidal Wave Journey Map on experience.html
 *   - Fully decoupled cursor canvas layer (z-index 99999)
 */

document.addEventListener('DOMContentLoaded', () => {
  const D = window.PORTFOLIO_DATA;
  if (!D) { console.warn('[app.js] PORTFOLIO_DATA not loaded'); return; }

  /* ── 0. Global Technical Metadata ─────────── */
  const TECH_INFO = {
    'laravel': { category: 'Backend Framework', desc: 'Arsitektur MVC, RESTful API endpoints, migrasi database & Eloquent ORM.' },
    'livewire': { category: 'Full-Stack UI', desc: 'Komponen UI reaktif real-time tanpa konfigurasi JavaScript API terpisah.' },
    'alpine.js': { category: 'Micro Frontend', desc: 'Manipulasi DOM deklaratif dan manajemen state interaktif modal / dropdown secara ringan.' },
    'tailwind css': { category: 'CSS System', desc: 'Desain antarmuka modular dengan utility-first tokens dan performa render cepat.' },
    'bootstrap': { category: 'UI Framework', desc: 'Komponen tata letak responsif standar industri dan sistem grid multi-device.' },
    'react': { category: 'Frontend Library', desc: 'Arsitektur komponen berbasis virtual DOM dengan manajemen state reaktif.' },
    'typescript': { category: 'Type Safety', desc: 'Static typing ketat untuk mencegah bug runtime dan mempermudah pemeliharaan skrip.' },
    'vite': { category: 'Build Tool', desc: 'Bundler generasi baru dengan Instant Hot Module Reload (HMR) dan optimalisasi bundle.' },
    'flutter': { category: 'Cross-Platform UI', desc: 'Framework native mobile terpadu berbasis Dart dengan grafis 60fps yang responsif.' },
    'dart': { category: 'Language', desc: 'Bahasa berorientasi objek yang dioptimalkan untuk performa client-side.' },
    'kotlin': { category: 'Android Native', desc: 'Bahasa resmi Android modern dengan null-safety, coroutines, dan sintaks ekspresif.' },
    'jetpack compose': { category: 'Declarative UI', desc: 'Toolkit UI modern Android berbasis deklaratif untuk menyederhanakan kode layout.' },
    'firebase': { category: 'BaaS & Cloud', desc: 'Cloud Firestore real-time database, cloud authentication, dan hosting terkelola.' },
    'mysql': { category: 'Relational DB', desc: 'Basis data relasional ACID-compliant untuk integritas data transaksi dan query cepat.' },
    'postgresql': { category: 'Relational DB', desc: 'Database enterprise dengan dukungan fitur JSONB dan reliabilitas tinggi.' },
    'supabase': { category: 'BaaS & Postgres', desc: 'PostgreSQL terkelola dengan Row Level Security (RLS) dan autentikasi terpadu.' },
    'indexeddb': { category: 'Client Database', desc: 'Penyimpanan terstruktur offline-first client-side berkapasitas besar.' },
    'dexie.js': { category: 'IndexedDB Wrapper', desc: 'Abstraksi query reaktif dan manajemen skema untuk IndexedDB lokal.' },
    'shadcn ui': { category: 'Component System', desc: 'Komponen headless aksesibel berbasis Radix UI dan Tailwind CSS.' },
    'cloud & ml': { category: 'Intelligence', desc: 'Integrasi Machine Learning model inference dan Google Cloud Platform services.' },
  };

  function getTechMeta(name) {
    if (!name) return { category: 'Technology', desc: 'Software engineering tool / dependency.' };
    const key = name.toLowerCase().trim();
    if (TECH_INFO[key]) return TECH_INFO[key];
    for (const [k, val] of Object.entries(TECH_INFO)) {
      if (key.includes(k)) return val;
    }
    return { category: 'Core Stack', desc: `Komponen dan dependensi teknis untuk implementasi ${name}.` };
  }

  /* ── Robust Page Detection ────────────────── */
  const has = (id) => !!document.getElementById(id);
  const IS = {
    home:     has('hero') || has('expPreviewMap'),
    projects: has('projectRows'),
    detail:   has('pdetailRoot') || has('projectDetail'),
    exp:      has('expFullMap'),
  };

  /* ── CV link ─────────────────────────────── */
  document.querySelectorAll('#cvBtn').forEach(el => {
    if (D.social && D.social.cv) {
      el.href = D.social.cv;
      el.classList.remove('disabled');
      el.removeAttribute('aria-disabled');
    }
  });

  /* ── Mobile nav ──────────────────────────── */
  const mobileNav  = document.getElementById('mobileNav');
  const menuBtn    = document.getElementById('mobileMenuBtn');
  const navClose   = document.getElementById('mobileNavClose');
  function openNav()  { mobileNav?.classList.add('open'); menuBtn?.setAttribute('aria-expanded','true'); document.body.style.overflow='hidden'; }
  function closeNav() { mobileNav?.classList.remove('open'); menuBtn?.setAttribute('aria-expanded','false'); document.body.style.overflow=''; }
  menuBtn?.addEventListener('click', openNav);
  navClose?.addEventListener('click', closeNav);
  document.querySelectorAll('[data-mnav]').forEach(a => a.addEventListener('click', closeNav));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeNav(); });
  document.getElementById('themeToggleMobile')?.addEventListener('click', () => document.getElementById('themeToggle')?.click());

  /* ════════════════════════════════════════════
     REUSABLE 30/40/30 MODAL SYSTEM
  ════════════════════════════════════════════ */
  let modalBackdrop = null;
  let isModalOpen = false;

  function ensureModal() {
    if (modalBackdrop) return modalBackdrop;
    let elModal = document.getElementById('caseStudyModal');
    if (!elModal) {
      elModal = el('div', {
        class: 'modal-backdrop',
        id: 'caseStudyModal',
        'aria-hidden': 'true',
        role: 'dialog',
        'aria-modal': 'true',
      });
      document.body.appendChild(elModal);
    }

    elModal.addEventListener('click', (e) => {
      if (e.target === elModal) closeModal();
    });

    modalBackdrop = elModal;
    return elModal;
  }

  function openModal(type, targetId) {
    const modal = ensureModal();

    if (type === 'project') {
      const project = (D.projects || []).find(p => p.slug === targetId) || D.projects[0];
      if (!project) return;
      const hasImg = project.images && project.images.length > 0;
      const isFeatured = project.featured === true || project.tier === 'featured';

      modal.innerHTML = `
        <div class="modal-container" role="document">
          <!-- Top Bar -->
          <div class="modal-topbar">
            <span class="modal-topbar__num">PROJECT ${project.index}</span>
            <button class="modal-close-btn" id="modalCloseBtn" type="button" aria-label="Close project modal">
              <span>CLOSE</span>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          <!-- 3-Column Modal Grid (30% / 40% / 30%) -->
          <div class="modal-body-grid">
            <!-- 30% Left: Metadata -->
            <div class="modal-col-meta">
              <div class="modal-meta-item">
                <span class="modal-meta-lbl">PROJECT NO.</span>
                <span class="modal-meta-val mono">${project.index}</span>
              </div>
              <div class="modal-meta-item">
                <span class="modal-meta-lbl">YEAR</span>
                <span class="modal-meta-val">${project.year}</span>
              </div>
              ${isFeatured ? `
                <div class="modal-meta-item">
                  <span class="modal-meta-lbl">HIGHLIGHT</span>
                  <span class="modal-meta-badge">FEATURED CASE STUDY</span>
                </div>
              ` : ''}
              ${project.role ? `
                <div class="modal-meta-item">
                  <span class="modal-meta-lbl">ROLE &amp; FOCUS</span>
                  <span class="modal-meta-val">${project.role}</span>
                </div>
              ` : ''}
              ${project.status ? `
                <div class="modal-meta-item">
                  <span class="modal-meta-lbl">STATUS</span>
                  <span class="modal-meta-val">${project.status.toUpperCase()}</span>
                </div>
              ` : ''}
            </div>

            <!-- 40% Center: Project Narrative -->
            <div class="modal-col-story">
              <div class="modal-story-header">
                <h2 class="modal-story-title">${project.displayName || project.name}</h2>
                <p class="modal-story-sub">${project.shortDescription}</p>
              </div>

              ${project.shortDescription ? `
                <div class="modal-story-sec">
                  <h3 class="modal-sec-lbl">OVERVIEW</h3>
                  <p class="modal-sec-text">${project.shortDescription}</p>
                </div>
              ` : ''}

              ${project.problem ? `
                <div class="modal-story-sec">
                  <h3 class="modal-sec-lbl">THE PROBLEM</h3>
                  <p class="modal-sec-text">${project.problem}</p>
                </div>
              ` : ''}

              ${project.solution ? `
                <div class="modal-story-sec">
                  <h3 class="modal-sec-lbl">THE SOLUTION &amp; ARCHITECTURE</h3>
                  <p class="modal-sec-text">${project.solution}</p>
                </div>
              ` : ''}

              ${project.features && project.features.length ? `
                <div class="modal-story-sec">
                  <h3 class="modal-sec-lbl">KEY FEATURES</h3>
                  <ul class="modal-sec-bullets">
                    ${project.features.map(f => `<li>${f}</li>`).join('')}
                  </ul>
                </div>
              ` : ''}

              ${project.challenges ? `
                <div class="modal-story-sec">
                  <h3 class="modal-sec-lbl">ENGINEERING CHALLENGES</h3>
                  <p class="modal-sec-text">${project.challenges}</p>
                </div>
              ` : ''}

              ${project.outcome ? `
                <div class="modal-story-sec">
                  <h3 class="modal-sec-lbl">OUTCOME &amp; IMPACT</h3>
                  <p class="modal-sec-text">${project.outcome}</p>
                </div>
              ` : ''}
            </div>

            <!-- 30% Right: Visual & Clean Tech Stack -->
            <div class="modal-col-visual">
              <div class="modal-visual-wrap">
                ${hasImg ? `
                  <img src="${project.images[0].src}" alt="${project.images[0].alt || project.name}" loading="lazy">
                ` : `
                  <div class="modal-visual-fallback">
                    <span style="font-family:var(--font-display);font-size:1.125rem;font-weight:700;color:var(--fg);display:block;">${project.displayName || project.name}</span>
                    <span style="font-family:var(--font-mono);font-size:.5625rem;color:var(--muted);letter-spacing:.08em;text-transform:uppercase;margin-top:.35rem;">System Architecture Spec</span>
                  </div>
                `}
              </div>

              ${project.techStack && project.techStack.length ? `
                <div class="modal-tech-box">
                  <h3 class="modal-tech-lbl">TECH STACK</h3>
                  <ul class="modal-tech-clean-list">
                    ${project.techStack.map(t => `<li class="modal-tech-clean-item">${t}</li>`).join('')}
                  </ul>
                </div>
              ` : ''}

              ${(project.liveDemo || project.github) ? `
                <div class="modal-links-box">
                  ${project.liveDemo ? `
                    <a href="${project.liveDemo}" target="_blank" rel="noopener noreferrer" class="modal-action-btn primary" aria-label="Live demo for ${project.name}">
                      <span>Live Demo</span>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M7 17L17 7M17 7H7M17 7v10"/></svg>
                    </a>
                  ` : ''}
                  ${project.github ? `
                    <a href="${project.github}" target="_blank" rel="noopener noreferrer" class="modal-action-btn secondary" aria-label="GitHub repo for ${project.name}">
                      <span>GitHub</span>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M7 17L17 7M17 7H7M17 7v10"/></svg>
                    </a>
                  ` : ''}
                </div>
              ` : ''}
            </div>
          </div>
        </div>
      `;
    } else if (type === 'experience') {
      const idx = typeof targetId === 'number' ? targetId : (D.experience || []).findIndex(e => e.id === targetId);
      const item = (D.experience || [])[idx >= 0 ? idx : 0];
      if (!item) return;

      modal.innerHTML = `
        <div class="modal-container" role="document">
          <!-- Top Bar -->
          <div class="modal-topbar">
            <span class="modal-topbar__num">MILESTONE 0${idx + 1} / 0${D.experience.length}</span>
            <button class="modal-close-btn" id="modalCloseBtn" type="button" aria-label="Close experience modal">
              <span>CLOSE</span>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          <!-- 3-Column Modal Grid (30% / 40% / 30%) -->
          <div class="modal-body-grid">
            <!-- 30% Left: Experience Metadata -->
            <div class="modal-col-meta">
              <div class="modal-meta-item">
                <span class="modal-meta-lbl">PERIOD</span>
                <span class="modal-meta-val">${item.period}</span>
              </div>
              <div class="modal-meta-item">
                <span class="modal-meta-lbl">ORGANIZATION</span>
                <span class="modal-meta-val">${item.org}</span>
              </div>
              <div class="modal-meta-item">
                <span class="modal-meta-lbl">ROLE</span>
                <span class="modal-meta-val">${item.role}</span>
              </div>
              <div class="modal-meta-item">
                <span class="modal-meta-lbl">LOCATION</span>
                <span class="modal-meta-val">${item.location || 'Pekanbaru, Riau'}</span>
              </div>
              ${item.gpa ? `
                <div class="modal-meta-item">
                  <span class="modal-meta-lbl">ACADEMIC RECORD</span>
                  <span class="modal-meta-badge">GPA ${item.gpa}</span>
                </div>
              ` : ''}
            </div>

            <!-- 40% Center: Reflective Engineering Storytelling -->
            <div class="modal-col-story">
              <div class="modal-story-header">
                <h2 class="modal-story-title">${item.headline || item.role}</h2>
                <p class="modal-story-sub">${item.role} &nbsp;·&nbsp; <strong>${item.org}</strong></p>
              </div>

              ${item.beginning ? `
                <div class="modal-story-sec">
                  <h3 class="modal-sec-lbl">THE BEGINNING</h3>
                  <p class="modal-sec-text">${item.beginning}</p>
                </div>
              ` : ''}

              ${item.work ? `
                <div class="modal-story-sec">
                  <h3 class="modal-sec-lbl">THE WORK</h3>
                  <p class="modal-sec-text">${item.work}</p>
                </div>
              ` : ''}

              ${item.problem ? `
                <div class="modal-story-sec">
                  <h3 class="modal-sec-lbl">THE PROBLEM</h3>
                  <p class="modal-sec-text">${item.problem}</p>
                </div>
              ` : ''}

              ${item.turningPoint ? `
                <div class="modal-story-sec">
                  <h3 class="modal-sec-lbl">THE TURNING POINT</h3>
                  <p class="modal-sec-text">${item.turningPoint}</p>
                </div>
              ` : ''}

              ${item.whatITookWithMe ? `
                <div class="modal-story-sec">
                  <h3 class="modal-sec-lbl">WHAT I TOOK WITH ME</h3>
                  <p class="modal-sec-text">${item.whatITookWithMe}</p>
                </div>
              ` : ''}
            </div>

            <!-- 30% Right: Technologies & Tools Clean List -->
            <div class="modal-col-visual">
              <div class="modal-tech-box">
                <h3 class="modal-tech-lbl">TECHNOLOGY &amp; ENVIRONMENT</h3>
                <ul class="modal-tech-clean-list">
                  ${(item.technologies || item.tags || []).map(t => `<li class="modal-tech-clean-item">${t}</li>`).join('')}
                </ul>
              </div>

              <div class="modal-story-sec" style="margin-top:auto; padding-top:1.5rem; border-top:1px solid var(--border);">
                <span class="modal-meta-lbl">MILESTONE BADGE</span>
                <p style="font-family:var(--font-mono); font-size:.75rem; color:var(--fg); font-weight:600; margin-top:.35rem;">${item.typeLabel}</p>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    modal.querySelector('#modalCloseBtn')?.addEventListener('click', closeModal);

    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    isModalOpen = true;
  }

  function closeModal() {
    if (!modalBackdrop || !isModalOpen) return;
    modalBackdrop.classList.remove('open');
    modalBackdrop.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    isModalOpen = false;
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isModalOpen) {
      closeModal();
    }
  });

  /* ════════════════════════════════════════════
     HOME PAGE
  ════════════════════════════════════════════ */
  if (IS.home) {
    buildExpPreviewMap();
    buildHomeTrailer();

    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(buildExpPreviewMap, 180);
    }, { passive: true });
  }

  /* ── Interactive Sneak Peek Floating Card ─────────── */
  let activeSneakPeekCard = null;

  function getOrCreateSneakPeekCard(container) {
    let card = container.querySelector('.map-sneak-peek');
    if (!card) {
      card = el('div', { class: 'map-sneak-peek' });
      container.appendChild(card);
    }
    return card;
  }

  function showMapSneakPeek(nodeGroup, container, item) {
    if (!item) return;
    const card = getOrCreateSneakPeekCard(container);
    activeSneakPeekCard = card;

    const badge = item.badge || item.typeLabel || 'MILESTONE';
    const year = item.year || item.period || '';
    const title = item.title || item.role || '';
    const subtitle = item.subtitle || (item.org ? item.org.split(',')[0] : '');
    const desc = item.context || item.beginning || item.reflection || item.headline || (item.bullets ? item.bullets[0] : '');

    card.innerHTML = `
      <div class="msp-header">
        <span class="msp-badge">${badge}</span>
        <span class="msp-year">${year}</span>
      </div>
      <div class="msp-title">${title}</div>
      ${subtitle ? `<div class="msp-sub">${subtitle}</div>` : ''}
      <div class="msp-desc">${desc}</div>
      <div class="msp-footer">
        <span>Click to open case study</span>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
      </div>
    `;

    // Position relative to container
    const cRect = container.getBoundingClientRect();
    const nRect = nodeGroup.getBoundingClientRect();

    const nodeCenterX = (nRect.left + nRect.width / 2) - cRect.left;
    const nodeCenterY = (nRect.top + nRect.height / 2) - cRect.top;

    const cardW = Math.min(310, cRect.width - 24);
    let left = nodeCenterX - cardW / 2;
    left = Math.max(12, Math.min(cRect.width - cardW - 12, left));

    let top = nodeCenterY - 170; // Position above node
    if (top < 10) {
      top = nodeCenterY + 30; // Flip below if near ceiling
    }

    card.style.left = `${Math.round(left)}px`;
    card.style.top  = `${Math.round(top)}px`;
    card.classList.add('active');
  }

  function hideMapSneakPeek() {
    if (activeSneakPeekCard) {
      activeSneakPeekCard.classList.remove('active');
    }
  }

  /* ── Experience preview SVG map: Treasure Map / Unfinished Journey (Home) ──── */
  function buildExpPreviewMap() {
    const wrap = document.getElementById('expPreviewMap');
    if (!wrap) return;

    const stage = document.getElementById('expMapStage') || wrap;

    const milestones = D.journeyMilestones || [
      { year: '2022', badge: '01 · ORIGIN', title: 'Learning the Foundations', reflection: 'Started my journey by learning how systems work from the ground up.', expIndex: 0 },
      { year: '2023 — 2024', badge: '02 · HARDWARE & OPS', title: 'Keeping Real Systems Running', reflection: 'Maintained 83 workstations across 3 labs. Troubleshooting hardware, software, LAN, and everything in between.', expIndex: 1 },
      { year: '2024', badge: '03 · SCALE & CODE', title: 'From Software to Infrastructure', reflection: 'Deployed 256 access points across 14 buildings with a 13-person team. Learned where code meets physical systems.', expIndex: 2 },
      { year: '2024 — 2025', badge: '04 · TEAM & SYSTEMS', title: 'Engineering With Others', reflection: 'Leading a team, solving problems together, documenting, reviewing, and building better systems.', expIndex: 3 },
    ];

    const isMobile = window.innerWidth < 768;

    if (!isMobile) {
      // ══════════════════════════════════════════════
      // DESKTOP: CLEAN HORIZONTAL TREASURE MAP
      // ══════════════════════════════════════════════
      const VW = 1120;
      const VH = 340;

      const svg = mkSVG('svg');
      svg.setAttribute('viewBox', `0 0 ${VW} ${VH}`);
      svg.setAttribute('width', '100%');
      svg.setAttribute('height', VH);
      svg.setAttribute('aria-label', 'Treasure map of engineering journey');
      svg.classList.add('exp-map-svg');

      // ── Defs: Blur filters and gradual mist mask ──
      const defs = mkSVG('defs');

      // Blur filters for organic soft clouds
      defs.innerHTML = `
        <filter id="cloudBlur" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="11" />
        </filter>
        <filter id="mistBlur" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="17" />
        </filter>
        <mask id="trailMistMask">
          <linearGradient id="trailMistGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stop-color="#fff" stop-opacity="1" />
            <stop offset="68%"  stop-color="#fff" stop-opacity="1" />
            <stop offset="78%"  stop-color="#fff" stop-opacity="0.8" />
            <stop offset="88%"  stop-color="#fff" stop-opacity="0.35" />
            <stop offset="98%"  stop-color="#fff" stop-opacity="0.08" />
            <stop offset="100%" stop-color="#fff" stop-opacity="0" />
          </linearGradient>
          <rect x="0" y="0" width="100%" height="100%" fill="url(#trailMistGrad)" />
        </mask>
      `;
      svg.appendChild(defs);

      // ── Abstract Cartographic Survey Markers (no figurative icons) ──
      // Each milestone gets a unique minimal geometric glyph:
      // M1 → elevation contour rings  M2 → compass crosshair
      // M3 → signal triangulation     M4 → grid intersection mark
      const surveyG = mkSVG('g');
      surveyG.setAttribute('class', 'map-sketches');
      surveyG.innerHTML = `
        <!-- M1: Elevation contour rings (topographic circle ripples) at Origin ~x:235,y:155 -->
        <g class="map-survey" transform="translate(105, 185)" opacity="0.55">
          <ellipse cx="0" cy="0" rx="36" ry="16" fill="none" stroke="var(--fg)" stroke-width="0.85" />
          <ellipse cx="0" cy="0" rx="26" ry="10" fill="none" stroke="var(--fg)" stroke-width="0.8" />
          <ellipse cx="0" cy="0" rx="15" ry="6" fill="none" stroke="var(--fg)" stroke-width="0.75" />
          <line x1="0" y1="-18" x2="0" y2="-28" stroke="var(--fg)" stroke-width="0.8" stroke-dasharray="2 2" />
          <circle cx="0" cy="0" r="2" fill="var(--fg)" />
        </g>

        <!-- M2: Compass rose / crosshair (precision instrument) at HW&Ops ~x:360,y:225 -->
        <g class="map-survey" transform="translate(310, 262)" opacity="0.5">
          <circle cx="0" cy="0" r="18" fill="none" stroke="var(--fg)" stroke-width="0.85" stroke-dasharray="4 3" />
          <line x1="-22" y1="0" x2="22" y2="0" stroke="var(--fg)" stroke-width="0.9" />
          <line x1="0" y1="-22" x2="0" y2="22" stroke="var(--fg)" stroke-width="0.9" />
          <line x1="-14" y1="-14" x2="14" y2="14" stroke="var(--fg)" stroke-width="0.55" opacity="0.5" />
          <line x1="14" y1="-14" x2="-14" y2="14" stroke="var(--fg)" stroke-width="0.55" opacity="0.5" />
          <circle cx="0" cy="-22" r="2" fill="var(--fg)" />
          <circle cx="0" cy="0" r="3.5" fill="none" stroke="var(--fg)" stroke-width="1" />
          <circle cx="0" cy="0" r="1.5" fill="var(--fg)" />
        </g>

        <!-- M3: Signal triangulation / trilateration (3 nodes + dashed arcs) at Scale ~x:505,y:145 -->
        <g class="map-survey" transform="translate(460, 56)" opacity="0.5">
          <circle cx="-18" cy="18" r="3" fill="none" stroke="var(--fg)" stroke-width="0.85" />
          <circle cx="18"  cy="18" r="3" fill="none" stroke="var(--fg)" stroke-width="0.85" />
          <circle cx="0"   cy="-6" r="3" fill="none" stroke="var(--fg)" stroke-width="0.85" />
          <line x1="-18" y1="18" x2="18" y2="18" stroke="var(--fg)" stroke-width="0.75" stroke-dasharray="3 2" />
          <line x1="-18" y1="18" x2="0"  y2="-6" stroke="var(--fg)" stroke-width="0.75" stroke-dasharray="3 2" />
          <line x1="18"  y1="18" x2="0"  y2="-6" stroke="var(--fg)" stroke-width="0.75" stroke-dasharray="3 2" />
          <path d="M -18 18 A 24 24 0 0 1 18 18" fill="none" stroke="var(--fg)" stroke-width="0.6" opacity="0.45" />
          <path d="M 0 -6 A 18 18 0 0 1 18 18" fill="none" stroke="var(--fg)" stroke-width="0.6" opacity="0.45" />
        </g>

        <!-- M4: Grid intersection / survey benchmark at Team ~x:660,y:235 -->
        <g class="map-survey" transform="translate(600, 270)" opacity="0.5">
          <rect x="-20" y="-20" width="40" height="40" fill="none" stroke="var(--fg)" stroke-width="0.75" stroke-dasharray="4 3" />
          <line x1="-26" y1="0" x2="26" y2="0" stroke="var(--fg)" stroke-width="0.85" />
          <line x1="0" y1="-26" x2="0" y2="26" stroke="var(--fg)" stroke-width="0.85" />
          <rect x="-4" y="-4" width="8" height="8" fill="none" stroke="var(--fg)" stroke-width="1.1" />
          <rect x="-1.5" y="-1.5" width="3" height="3" fill="var(--fg)" />
          <line x1="-20" y1="-20" x2="-14" y2="-14" stroke="var(--fg)" stroke-width="0.55" opacity="0.45" />
          <line x1="20" y1="-20" x2="14" y2="-14" stroke="var(--fg)" stroke-width="0.55" opacity="0.45" />
          <line x1="-20" y1="20" x2="-14" y2="14" stroke="var(--fg)" stroke-width="0.55" opacity="0.45" />
          <line x1="20" y1="20" x2="14" y2="14" stroke="var(--fg)" stroke-width="0.55" opacity="0.45" />
        </g>
      `;
      svg.appendChild(surveyG);


      // ── The Continuous Undulating Route Path ──
      // Starting from origin, arching through all 4 milestones, reaching the waypoint,
      // and continuing smoothly into the soft clouds!
      const pathD = `
        M 65 220
        C 115 220, 160 155, 235 155
        C 290 155, 315 225, 360 225
        C 410 225, 450 145, 505 145
        C 560 145, 610 235, 660 235
        C 705 235, 735 180, 775 180
        C 815 180, 845 205, 880 195
        C 920 185, 960 210, 1000 195
        C 1040 180, 1075 185, 1110 180
      `;

      const routePath = mkSVG('path');
      routePath.setAttribute('d', pathD);
      routePath.setAttribute('class', 'map-path');
      routePath.setAttribute('mask', 'url(#trailMistMask)');
      svg.appendChild(routePath);

      // ── Nodes & Interactive Milestones ──
      // Start Node
      const startG = mkSVG('g');
      startG.setAttribute('class', 'map-node-start-group');
      const startCircle = mkSVG('circle');
      startCircle.setAttribute('cx', '65');
      startCircle.setAttribute('cy', '220');
      startCircle.setAttribute('r', '5.5');
      startCircle.setAttribute('class', 'map-node-start');
      startG.appendChild(startCircle);
      svg.appendChild(startG);

      // Milestone Configurations matching user image
      const DESKTOP_NODES = [
        {
          x: 235, y: 155,
          textX: 110, textY: 95,
          isAbove: true,
          item: milestones[0],
        },
        {
          x: 360, y: 225,
          textX: 360, textY: 260,
          isAbove: false,
          item: milestones[1],
        },
        {
          x: 505, y: 145,
          textX: 505, textY: 50,
          isAbove: true,
          item: milestones[2],
        },
        {
          x: 660, y: 235,
          textX: 660, textY: 270,
          isAbove: false,
          item: milestones[3],
        },
      ];

      DESKTOP_NODES.forEach((nd) => {
        const g = mkSVG('g');
        g.setAttribute('class', 'map-node-group');
        g.setAttribute('tabindex', '0');
        g.setAttribute('role', 'button');
        g.setAttribute('aria-label', `${nd.item.title} — ${nd.item.year}. Click to read case study.`);

        // Outer halo
        const halo = mkSVG('circle');
        halo.setAttribute('cx', nd.x);
        halo.setAttribute('cy', nd.y);
        halo.setAttribute('r', '10');
        halo.setAttribute('class', 'map-node-ring');
        g.appendChild(halo);

        // Core dot
        const core = mkSVG('circle');
        core.setAttribute('cx', nd.x);
        core.setAttribute('cy', nd.y);
        core.setAttribute('r', '5');
        core.setAttribute('class', 'map-node-core');
        g.appendChild(core);

        // Typography labels
        const anchor = nd.isAbove && nd.textX !== nd.x ? 'middle' : 'middle';
        const tx = nd.textX;
        const ty = nd.textY;

        g.appendChild(mkSVGText(nd.item.badge, tx, ty, 'map-label-tag', anchor));
        g.appendChild(mkSVGText(nd.item.year, tx, ty + 16, 'map-label-year', anchor));
        g.appendChild(mkSVGText(nd.item.title, tx, ty + 34, 'map-label-title', anchor));
        g.appendChild(mkSVGText(`"${nd.item.reflection}"`, tx, ty + 50, 'map-label-reflection', anchor));

        // Sneak Peek Hover & Focus Events
        g.addEventListener('mouseenter', () => showMapSneakPeek(g, stage, nd.item));
        g.addEventListener('mouseleave', hideMapSneakPeek);
        g.addEventListener('focus', () => showMapSneakPeek(g, stage, nd.item));
        g.addEventListener('blur', hideMapSneakPeek);

        // Click opens modal
        g.addEventListener('click', () => {
          hideMapSneakPeek();
          openModal('experience', nd.item.expIndex);
        });
        g.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            hideMapSneakPeek();
            openModal('experience', nd.item.expIndex);
          }
        });

        svg.appendChild(g);
      });

      // ── Waypoint / Treasure Marker (Rock with Carved X & Pill Tooltip) ──
      const waypointAnchor = mkSVG('a');
      waypointAnchor.setAttribute('href', 'experience.html');
      waypointAnchor.setAttribute('class', 'map-waypoint-anchor');
      waypointAnchor.setAttribute('aria-label', 'Explore the full journey on Experience page');

      const wpX = 745, wpY = 145;
      waypointAnchor.innerHTML = `
        <g class="map-waypoint-group" transform="translate(${wpX}, ${wpY})">
          <!-- Radar pulse -->
          <circle cx="28" cy="22" r="14" class="waypoint-radar" />

          <!-- Little hand-drawn rock mound -->
          <path d="M 6 48 Q 18 34 28 33 Q 40 34 50 48 Z" stroke="var(--fg)" stroke-width="1.3" fill="var(--bg)" />
          <path d="M 20 40 L 24 44 M 34 38 L 36 45" stroke="var(--fg)" stroke-width="0.75" opacity="0.45" />
          <path d="M 0 48 L 56 48" stroke="var(--fg)" stroke-width="0.8" stroke-dasharray="3 2" opacity="0.4" />

          <!-- Carved X mark -->
          <path d="M 28 33 L 28 22" stroke="var(--fg)" stroke-width="1.1" stroke-dasharray="2 2" />
          <path d="M 22 16 L 34 28 M 34 16 L 22 28" stroke="var(--fg)" stroke-width="2.2" stroke-linecap="round" class="waypoint-x" />
          <path d="M 18 11 L 15 8 M 38 11 L 41 8 M 28 9 L 28 5" stroke="var(--fg)" stroke-width="0.85" opacity="0.5" />

          <!-- Floating Pill Tooltip -->
          <g class="waypoint-pill-tooltip" transform="translate(28, -6)">
            <rect x="-85" y="-14" width="170" height="27" rx="13.5" class="wp-pill-bg" />
            <text x="0" y="4" text-anchor="middle" class="wp-pill-text">Explore the full journey →</text>
          </g>
        </g>
      `;
      svg.appendChild(waypointAnchor);

      // ── Soft Organic Light-Gray Clouds / Mist (68% - 100%) ──
      // Pure organic blobs with radial blur and neutral light gray color.
      // Absolutely no hard rectangular borders!
      const cloudsG = mkSVG('g');
      cloudsG.setAttribute('class', 'map-soft-clouds');
      cloudsG.innerHTML = `
        <!-- Deep Ambient Mist (Very blurred) -->
        <g filter="url(#mistBlur)" opacity="0.55">
          <ellipse cx="940" cy="170" rx="110" ry="85" fill="var(--fog-color)" />
          <ellipse cx="1020" cy="110" rx="120" ry="80" fill="var(--fog-color)" />
          <ellipse cx="1010" cy="230" rx="110" ry="85" fill="var(--fog-color)" />
          <ellipse cx="1080" cy="170" rx="100" ry="80" fill="var(--fog-color)" />
        </g>

        <!-- Billowing Cloud Puffs (Gentle blur) -->
        <g filter="url(#cloudBlur)" opacity="0.65">
          <circle cx="890" cy="190" r="42" fill="var(--fog-color)" />
          <circle cx="940" cy="95" r="55" fill="var(--fog-color)" />
          <circle cx="955" cy="175" r="68" fill="var(--fog-color)" />
          <circle cx="940" cy="255" r="58" fill="var(--fog-color)" />
          <circle cx="1020" cy="80" r="65" fill="var(--fog-color)" />
          <circle cx="1030" cy="165" r="80" fill="var(--fog-color)" />
          <circle cx="1015" cy="255" r="70" fill="var(--fog-color)" />
          <circle cx="1090" cy="120" r="75" fill="var(--fog-color)" />
          <circle cx="1090" cy="220" r="75" fill="var(--fog-color)" />
        </g>

        <!-- Delicate Organic Cloud Contours -->
        <path d="M 870 195 C 880 170, 905 155, 930 160 C 945 145, 975 140, 995 150 C 1015 130, 1045 130, 1070 145" stroke="var(--fog-color)" stroke-width="1.2" fill="none" opacity="0.5" />
        <path d="M 900 115 C 920 95, 950 90, 975 100 C 995 80, 1030 80, 1055 95" stroke="var(--fog-color)" stroke-width="1" fill="none" opacity="0.45" />
        <path d="M 895 235 C 915 215, 945 215, 965 230 C 985 220, 1020 225, 1040 245" stroke="var(--fog-color)" stroke-width="1" fill="none" opacity="0.4" />

        <!-- Subtle Flying Birds in the Sky -->
        <path d="M 925 65 Q 930 60 935 65 Q 940 60 945 65" stroke="var(--fg)" stroke-width="0.9" fill="none" opacity="0.35" />
        <path d="M 948 78 Q 951 74 955 78 Q 959 74 963 78" stroke="var(--fg)" stroke-width="0.8" fill="none" opacity="0.25" />
      `;
      svg.appendChild(cloudsG);

      // ── Mystery Glyph '?' & 'TERRA INCOGNITA' ──
      // Floating in the heart of the soft clouds, also clickable to experience.html
      const mysteryAnchor = mkSVG('a');
      mysteryAnchor.setAttribute('href', 'experience.html');
      mysteryAnchor.setAttribute('class', 'map-mystery-anchor');
      mysteryAnchor.setAttribute('aria-label', 'Explore the unknown journey on Experience page');

      const mysteryG = mkSVG('g');
      mysteryG.setAttribute('transform', 'translate(1005, 155)');

      const qText = mkSVG('text');
      qText.setAttribute('x', '0');
      qText.setAttribute('y', '0');
      qText.setAttribute('text-anchor', 'middle');
      qText.setAttribute('class', 'map-mystery-glyph');
      qText.textContent = '?';
      mysteryG.appendChild(qText);

      const subText = mkSVG('text');
      subText.setAttribute('x', '0');
      subText.setAttribute('y', '20');
      subText.setAttribute('text-anchor', 'middle');
      subText.setAttribute('class', 'map-mystery-sub');
      subText.textContent = 'TERRA INCOGNITA';
      mysteryG.appendChild(subText);

      mysteryAnchor.appendChild(mysteryG);
      svg.appendChild(mysteryAnchor);

      wrap.innerHTML = '';
      wrap.appendChild(svg);
    } else {
      // ══════════════════════════════════════════════
      // MOBILE: ADAPTIVE VERTICAL TREASURE TRAIL
      // ══════════════════════════════════════════════
      const VW = Math.max(320, wrap.clientWidth || 320);
      const VH = 720;

      const svg = mkSVG('svg');
      svg.setAttribute('viewBox', `0 0 ${VW} ${VH}`);
      svg.setAttribute('width', '100%');
      svg.setAttribute('height', VH);
      svg.setAttribute('aria-label', 'Treasure map of engineering journey');
      svg.classList.add('exp-map-svg');

      const defs = mkSVG('defs');
      defs.innerHTML = `
        <filter id="cloudBlurM" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="9" />
        </filter>
        <mask id="trailMistMaskM">
          <linearGradient id="trailMistGradM" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%"   stop-color="#fff" stop-opacity="1" />
            <stop offset="70%"  stop-color="#fff" stop-opacity="1" />
            <stop offset="85%"  stop-color="#fff" stop-opacity="0.4" />
            <stop offset="98%"  stop-color="#fff" stop-opacity="0.08" />
            <stop offset="100%" stop-color="#fff" stop-opacity="0" />
          </linearGradient>
          <rect x="0" y="0" width="100%" height="100%" fill="url(#trailMistGradM)" />
        </mask>
      `;
      svg.appendChild(defs);

      const MOBILE_NODES = [
        { x: VW * 0.5,  y: 35,  type: 'start' },
        { x: VW * 0.35, y: 130, type: 'milestone', isLeft: true,  item: milestones[0] },
        { x: VW * 0.65, y: 260, type: 'milestone', isLeft: false, item: milestones[1] },
        { x: VW * 0.35, y: 390, type: 'milestone', isLeft: true,  item: milestones[2] },
        { x: VW * 0.65, y: 520, type: 'milestone', isLeft: false, item: milestones[3] },
        { x: VW * 0.5,  y: 625, type: 'waypoint' },
        { x: VW * 0.5,  y: 695, type: 'mystery' },
      ];

      let d = `M ${MOBILE_NODES[0].x} ${MOBILE_NODES[0].y}`;
      for (let i = 1; i < MOBILE_NODES.length; i++) {
        const a = MOBILE_NODES[i - 1], b = MOBILE_NODES[i];
        const cpy = a.y + (b.y - a.y) * 0.5;
        d += ` C ${a.x} ${cpy} ${b.x} ${cpy} ${b.x} ${b.y}`;
      }

      const path = mkSVG('path');
      path.setAttribute('d', d);
      path.setAttribute('class', 'map-path');
      path.setAttribute('mask', 'url(#trailMistMaskM)');
      svg.appendChild(path);

      MOBILE_NODES.forEach((nd) => {
        if (nd.type === 'start') {
          const dot = mkSVG('circle');
          dot.setAttribute('cx', nd.x);
          dot.setAttribute('cy', nd.y);
          dot.setAttribute('r', '4');
          dot.setAttribute('class', 'map-node-start');
          svg.appendChild(dot);
          svg.appendChild(mkSVGText('ORIGIN · 00°N', nd.x, nd.y - 12, 'map-label-tag', 'middle'));
        } else if (nd.type === 'milestone') {
          const g = mkSVG('g');
          g.setAttribute('class', 'map-node-group');
          g.setAttribute('tabindex', '0');
          g.setAttribute('role', 'button');
          g.setAttribute('aria-label', `${nd.item.title} — ${nd.item.year}. Click to read case study.`);

          const halo = mkSVG('circle');
          halo.setAttribute('cx', nd.x);
          halo.setAttribute('cy', nd.y);
          halo.setAttribute('r', '9');
          halo.setAttribute('class', 'map-node-ring');
          g.appendChild(halo);

          const core = mkSVG('circle');
          core.setAttribute('cx', nd.x);
          core.setAttribute('cy', nd.y);
          core.setAttribute('r', '5');
          core.setAttribute('class', 'map-node-core');
          g.appendChild(core);

          const textAnchor = nd.isLeft ? 'start' : 'end';
          const textX = nd.isLeft ? nd.x + 16 : nd.x - 16;

          g.appendChild(mkSVGText(nd.item.year, textX, nd.y - 10, 'map-label-year', textAnchor));
          g.appendChild(mkSVGText(nd.item.title, textX, nd.y + 6, 'map-label-title', textAnchor));
          g.appendChild(mkSVGText(`"${nd.item.reflection.slice(0, 36)}..."`, textX, nd.y + 20, 'map-label-reflection', textAnchor));

          g.addEventListener('mouseenter', () => showMapSneakPeek(g, stage, nd.item));
          g.addEventListener('mouseleave', hideMapSneakPeek);

          g.addEventListener('click', () => {
            hideMapSneakPeek();
            openModal('experience', nd.item.expIndex);
          });
          g.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              hideMapSneakPeek();
              openModal('experience', nd.item.expIndex);
            }
          });

          svg.appendChild(g);
        } else if (nd.type === 'waypoint') {
          const a = mkSVG('a');
          a.setAttribute('href', 'experience.html');
          a.setAttribute('class', 'map-waypoint-anchor');
          a.setAttribute('aria-label', 'Explore the full journey on Experience page');

          a.innerHTML = `
            <g transform="translate(${nd.x - 24}, ${nd.y - 18})">
              <path d="M 6 36 Q 16 26 24 25 Q 34 26 42 36 Z" stroke="var(--fg)" stroke-width="1.2" fill="var(--bg)" />
              <path d="M 24 25 L 24 16" stroke="var(--fg)" stroke-width="1" stroke-dasharray="2 2" />
              <path d="M 19 12 L 29 22 M 29 12 L 19 22" stroke="var(--fg)" stroke-width="1.8" stroke-linecap="round" />
            </g>
          `;
          svg.appendChild(a);
        } else if (nd.type === 'mystery') {
          const a = mkSVG('a');
          a.setAttribute('href', 'experience.html');
          a.setAttribute('class', 'map-mystery-anchor');
          a.setAttribute('aria-label', 'Explore the unknown journey on Experience page');

          a.innerHTML = `
            <g transform="translate(${nd.x}, ${nd.y})">
              <text x="0" y="0" text-anchor="middle" class="map-mystery-glyph" style="font-size: 1.75rem;">?</text>
              <text x="0" y="16" text-anchor="middle" class="map-mystery-sub">TERRA INCOGNITA</text>
            </g>
          `;
          svg.appendChild(a);
        }
      });

      wrap.innerHTML = '';
      wrap.appendChild(svg);
    }
  }

  /* ── Selected projects horizontal trailer ─ */
  function buildHomeTrailer() {
    const track = document.getElementById('projectsTrack');
    if (!track || !D.projects) return;

    track.innerHTML = '';
    D.projects.slice(0, 5).forEach((p) => {
      const card = el('article', {
        class: 'pcard',
        role: 'listitem',
        'data-slug': p.slug,
        tabindex: '0',
        'aria-label': `${p.displayName || p.name} — ${p.year}. Click to view case study.`,
      });

      const hasImg = p.images && p.images.length > 0;
      card.innerHTML = `
        <div class="pcard__top">
          <span class="pcard__idx">${p.index}</span>
          <svg class="pcard__arrow" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M7 17L17 7M17 7H7M17 7v10"/></svg>
        </div>
        <div class="pcard__body">
          <h3 class="pcard__name">${p.displayName || p.name}</h3>
          <p class="pcard__desc">${p.shortDescription}</p>
          ${p.techStack ? `<div class="pcard__tags">${p.techStack.slice(0,3).map(t=>`<span class="pcard__tag">${t}</span>`).join('')}</div>` : ''}
        </div>
        <div class="pcard__img">
          ${hasImg ? `<img src="${p.images[0].src}" alt="${p.images[0].alt || p.name}" loading="lazy">` : `<span class="pcard__img-ph">${p.name}</span>`}
        </div>
      `;

      card.addEventListener('click', () => openModal('project', p.slug));
      card.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openModal('project', p.slug);
        }
      });

      track.appendChild(card);
    });

    initHorizontalScroll();
  }

  /* ── Horizontal scroll interaction ─────── */
  function initHorizontalScroll() {
    const section = document.getElementById('projects');
    const track   = document.getElementById('projectsTrack');
    const fill    = document.getElementById('projFill');
    if (!section || !track) return;

    const END_BUFFER = 96;

    function getOverflow() {
      const parentW = track.parentElement ? track.parentElement.clientWidth : window.innerWidth;
      return Math.max(0, (track.scrollWidth + END_BUFFER) - parentW);
    }

    function setHeight() {
      const ov = getOverflow();
      section.style.height = (ov + window.innerHeight * 1.15) + 'px';
    }
    setHeight();
    window.addEventListener('resize', setHeight, { passive: true });

    function onScroll() {
      const secTop = section.getBoundingClientRect().top + window.scrollY;
      const scrolled = window.scrollY - secTop;
      const totalScroll = section.offsetHeight - window.innerHeight;
      const ov = getOverflow();

      if (scrolled <= 0) {
        track.style.transform = 'translateX(0)';
        if (fill) fill.style.width = '0%';
        return;
      }
      const p = Math.min(Math.max(scrolled / totalScroll, 0), 1);
      track.style.transform = `translateX(-${p * ov}px)`;
      if (fill) fill.style.width = (p * 100) + '%';
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ════════════════════════════════════════════
     PROJECTS LISTING PAGE (30% / 40% / 30%)
  ════════════════════════════════════════════ */
  if (IS.projects) {
    initProjectsPage();
  }

  function initProjectsPage() {
    const filterTabs = document.querySelectorAll('.filter-tab');
    const rowsContainer = document.getElementById('projectRows');
    if (!rowsContainer || !D.projects) return;

    let activeFilter = 'all';

    function renderRows(filter) {
      rowsContainer.innerHTML = '';
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

      list.forEach((p) => {
        const hasImg = p.images && p.images.length > 0;
        const isFeatured = p.featured === true || p.tier === 'featured';

        const blockEl = el('article', {
          class: `project-block${isFeatured ? ' featured' : ''}`,
          role: 'listitem',
          'data-slug': p.slug,
          tabindex: '0',
          'aria-label': `${p.displayName || p.name} — ${p.year}. Click to view full engineering case study.`,
        });

        /* ── 30% AREA 1: META ───────────────── */
        const metaCol = el('div', { class: 'pblock__meta' });
        metaCol.innerHTML = `
          <span class="pblock__num">${p.index}</span>
          <span class="pblock__year">${p.year}</span>
          ${isFeatured ? `<span class="pblock__featured-badge"><svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> FEATURED</span>` : ''}
          ${p.status ? `<p class="pblock__status">Status: ${p.status}</p>` : ''}
        `;

        /* ── 40% AREA 2: CONTENT ────────────── */
        const contentCol = el('div', { class: 'pblock__content' });
        contentCol.innerHTML = `
          <h2 class="pblock__title">${p.displayName || p.name}</h2>
          <p class="pblock__desc">${p.shortDescription}</p>
          ${p.techStack ? `<div class="pblock__stack">${p.techStack.map(t => `<span class="pblock__stack-tag">${t}</span>`).join('')}</div>` : ''}
          <div class="pblock__cta">
            <span>View case study</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </div>
        `;

        /* ── 30% AREA 3: VISUAL & LINKS ─────── */
        const visualCol = el('div', { class: 'pblock__visual' });
        const imgWrap = el('div', { class: 'pblock__img-wrap' });
        if (hasImg) {
          imgWrap.appendChild(el('img', { src: p.images[0].src, alt: p.images[0].alt || p.name, loading: 'lazy' }));
        } else {
          imgWrap.innerHTML = `
            <div class="pblock__img-fallback">
              <span class="pblock__img-fallback-title">${p.displayName || p.name}</span>
              <span class="pblock__img-fallback-sub">Architecture &amp; Spec</span>
            </div>
          `;
        }
        visualCol.appendChild(imgWrap);

        // Secondary External Links
        const linksWrap = el('div', { class: 'pblock__links' });
        if (p.github) {
          linksWrap.innerHTML += `
            <a href="${p.github}" target="_blank" rel="noopener noreferrer" class="pblock__link" aria-label="GitHub repository for ${p.name}">
              GitHub
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M7 17L17 7M17 7H7M17 7v10"/></svg>
            </a>
          `;
        }
        if (p.liveDemo) {
          linksWrap.innerHTML += `
            <a href="${p.liveDemo}" target="_blank" rel="noopener noreferrer" class="pblock__link" aria-label="Live demo for ${p.name}">
              Live Demo
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M7 17L17 7M17 7H7M17 7v10"/></svg>
            </a>
          `;
        }
        if (linksWrap.children.length > 0) {
          visualCol.appendChild(linksWrap);
        }

        blockEl.appendChild(metaCol);
        blockEl.appendChild(contentCol);
        blockEl.appendChild(visualCol);

        // Click opens the 30/40/30 Project Modal
        blockEl.addEventListener('click', (e) => {
          if (e.target.closest('a')) return;
          openModal('project', p.slug);
        });
        blockEl.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            if (e.target.closest('a')) return;
            e.preventDefault();
            openModal('project', p.slug);
          }
        });

        rowsContainer.appendChild(blockEl);
      });
    }

    filterTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        activeFilter = tab.dataset.filter;
        filterTabs.forEach(t => {
          t.classList.toggle('active', t === tab);
          t.setAttribute('aria-selected', t === tab ? 'true' : 'false');
        });
        renderRows(activeFilter);
      });
    });

    renderRows('all');
  }

  /* ════════════════════════════════════════════
     EXPERIENCE PAGE — WAVE MAP
  ════════════════════════════════════════════ */
  if (IS.exp) {
    buildExpFullMap();
    buildCerts();
  }

  /* ── Full experience map — Interactive Wave Map ── */
  function buildExpFullMap() {
    const wrap = document.getElementById('expFullMap');
    if (!wrap || !D.experience) return;

    const VW = 1000, VH = 260;
    const items = D.experience;

    const NODES = [
      { x: 50,  y: VH / 2, item: null },
      { x: 230, y: VH * 0.28, item: items[0], side: 'above', index: 0 },
      { x: 470, y: VH * 0.72, item: items[1], side: 'below', index: 1 },
      { x: 710, y: VH * 0.28, item: items[2], side: 'above', index: 2 },
      { x: 920, y: VH * 0.72, item: items[3] || items[items.length - 1], side: 'below', index: 3 },
    ];

    wrap.innerHTML = '';

    const hintBar = el('div', { class: 'exp-map-prompt', 'aria-live': 'polite' });
    hintBar.innerHTML = `
      <span class="exp-map-prompt__dot"></span>
      <span class="exp-map-prompt__text">Klik salah satu milestone pada peta untuk membaca kisah engineering journey</span>
    `;
    wrap.appendChild(hintBar);

    const svgWrap = el('div', { class: 'exp-map-svg-container', style: 'position: relative;' });
    const svg = mkSVG('svg');
    svg.setAttribute('viewBox', `0 0 ${VW} ${VH}`);
    svg.setAttribute('width', '100%');
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    svg.setAttribute('aria-hidden', 'true');
    svg.classList.add('exp-map-svg');
    svg.style.overflow = 'visible';

    let d = `M ${NODES[0].x} ${NODES[0].y}`;
    for (let i = 1; i < NODES.length; i++) {
      const a = NODES[i - 1], b = NODES[i];
      const cpx = a.x + (b.x - a.x) * 0.5;
      d += ` C ${cpx} ${a.y} ${cpx} ${b.y} ${b.x} ${b.y}`;
    }

    const path = mkSVG('path');
    path.setAttribute('d', d);
    path.setAttribute('class', 'map-path');
    svg.appendChild(path);

    // Node Elements
    NODES.forEach((nd, i) => {
      const g = mkSVG('g');
      g.setAttribute('class', 'map-node-group');

      const circle = mkSVG('circle');
      circle.setAttribute('cx', nd.x);
      circle.setAttribute('cy', nd.y);
      circle.setAttribute('r', i === 0 ? '5' : '8');
      circle.setAttribute('class', i === 0 ? 'map-node start' : 'map-node');
      circle.setAttribute('id', `node-dot-${i}`);
      g.appendChild(circle);

      if (nd.item) {
        g.setAttribute('data-index', nd.index);
        g.setAttribute('tabindex', '0');
        g.setAttribute('role', 'button');
        g.setAttribute('aria-label', `Pilih milestone ${nd.item.year}: ${nd.item.role} di ${nd.item.org}`);

        const isAbove = nd.side === 'above';
        const anchor  = nd.x > VW * 0.75 ? 'end' : (nd.x < VW * 0.35 ? 'start' : 'middle');
        const xPos    = nd.x;
        const yBase   = isAbove ? nd.y - 20 : nd.y + 26;

        g.appendChild(mkSVGText(nd.item.year, xPos, isAbove ? yBase - 28 : yBase, 'map-label-year', anchor));
        g.appendChild(mkSVGText(nd.item.org,  xPos, isAbove ? yBase - 14 : yBase + 14, 'map-label-org',  anchor));
        g.appendChild(mkSVGText(nd.item.role, xPos, isAbove ? yBase : yBase + 28, 'map-label-role', anchor));

        // Interactive Sneak Peek on Hover & Focus
        g.addEventListener('mouseenter', () => showMapSneakPeek(g, svgWrap, nd.item));
        g.addEventListener('mouseleave', hideMapSneakPeek);
        g.addEventListener('focus', () => showMapSneakPeek(g, svgWrap, nd.item));
        g.addEventListener('blur', hideMapSneakPeek);

        const selectNode = () => {
          hideMapSneakPeek();
          openModal('experience', nd.index);
        };

        g.addEventListener('click', selectNode);
        g.addEventListener('keydown', e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            selectNode();
          }
        });
      }

      svg.appendChild(g);
    });

    svgWrap.appendChild(svg);
    wrap.appendChild(svgWrap);

    // Quick pick bar beneath map
    const quickBar = el('div', { class: 'exp-story-empty__quick-picks', style: 'margin-top: 2rem; justify-content: center;' });
    quickBar.innerHTML = items.map((it, idx) => `
      <button class="exp-quick-pick" data-pick="${idx}" type="button" aria-label="Open story for ${it.org}">
        <span class="exp-quick-pick__year">${it.year}</span>
        <span class="exp-quick-pick__org">${it.org.split(',')[0]}</span>
      </button>
    `).join('');

    quickBar.querySelectorAll('.exp-quick-pick').forEach(btn => {
      btn.addEventListener('click', () => {
        const pickIdx = parseInt(btn.getAttribute('data-pick'), 10);
        openModal('experience', pickIdx);
      });
    });

    wrap.appendChild(quickBar);
  }

  /* ── Certifications grid ─────────────────── */
  function buildCerts() {
    const grid = document.getElementById('certsGrid');
    if (!grid || !D.certifications) return;

    grid.innerHTML = '';
    D.certifications.forEach(c => {
      const card = el('article', {
        class: 'cert-card',
        role: 'listitem',
        tabindex: '0',
        'aria-label': `${c.title} by ${c.issuer}`,
      });

      card.innerHTML = `
        <div class="cert-card__top">
          <span class="cert-card__issuer">${c.issuer}</span>
          <span class="cert-card__year">${c.year}</span>
        </div>
        <h3 class="cert-card__title">${c.title}</h3>
        ${c.credentialId ? `<p class="cert-card__id">Credential ID: <code>${c.credentialId}</code></p>` : ''}
        ${c.link ? `
          <a href="${c.link}" target="_blank" rel="noopener noreferrer" class="cert-card__link">
            Verify Credential
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M7 17L17 7M17 7H7M17 7v10"/></svg>
          </a>` : ''}
      `;

      grid.appendChild(card);
    });
  }

  /* ── DOM helper utilities ────────────────── */
  function el(tag, attrs = {}) {
    const element = document.createElement(tag);
    Object.entries(attrs).forEach(([k, v]) => element.setAttribute(k, v));
    return element;
  }

  function mkSVG(tag) {
    return document.createElementNS('http://www.w3.org/2000/svg', tag);
  }

  function mkSVGText(str, x, y, cls, anchor = 'middle') {
    const t = mkSVG('text');
    t.setAttribute('x', x);
    t.setAttribute('y', y);
    t.setAttribute('text-anchor', anchor);
    t.setAttribute('class', cls);
    t.textContent = str;
    return t;
  }
});
