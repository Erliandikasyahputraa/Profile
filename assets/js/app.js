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
    'laravel': { category: 'Backend Framework', desc: 'MVC architecture, RESTful API endpoints, database migrations & Eloquent ORM.' },
    'livewire': { category: 'Full-Stack UI', desc: 'Real-time reactive UI components without writing separate JavaScript API configuration.' },
    'alpine.js': { category: 'Micro Frontend', desc: 'Lightweight declarative DOM manipulation and interactive state management for modals and dropdowns.' },
    'tailwind css': { category: 'CSS System', desc: 'Modular UI design with utility-first tokens and fast render performance.' },
    'bootstrap': { category: 'UI Framework', desc: 'Industry-standard responsive layout components and multi-device grid system.' },
    'react': { category: 'Frontend Library', desc: 'Component-based virtual DOM architecture with reactive state management.' },
    'typescript': { category: 'Type Safety', desc: 'Strict static typing to prevent runtime bugs and simplify long-term script maintenance.' },
    'vite': { category: 'Build Tool', desc: 'Next-gen bundler with Instant Hot Module Reload (HMR) and optimized bundle output.' },
    'flutter': { category: 'Cross-Platform UI', desc: 'Unified native mobile framework in Dart delivering responsive 60fps graphics.' },
    'dart': { category: 'Language', desc: 'Object-oriented language optimized for client-side performance.' },
    'kotlin': { category: 'Android Native', desc: 'Modern official Android language with null-safety, coroutines, and expressive syntax.' },
    'jetpack compose': { category: 'Declarative UI', desc: 'Modern declarative Android UI toolkit that simplifies layout code.' },
    'firebase': { category: 'BaaS & Cloud', desc: 'Cloud Firestore real-time database, cloud authentication, and managed hosting.' },
    'mysql': { category: 'Relational DB', desc: 'ACID-compliant relational database for transactional data integrity and fast queries.' },
    'postgresql': { category: 'Relational DB', desc: 'Enterprise database with JSONB support and high reliability.' },
    'supabase': { category: 'BaaS & Postgres', desc: 'Managed PostgreSQL with Row Level Security (RLS) and integrated authentication.' },
    'indexeddb': { category: 'Client Database', desc: 'Large-capacity offline-first structured storage on the client side.' },
    'dexie.js': { category: 'IndexedDB Wrapper', desc: 'Reactive query abstraction and schema management for local IndexedDB.' },
    'shadcn ui': { category: 'Component System', desc: 'Accessible headless components built on Radix UI and Tailwind CSS.' },
    'cloud & ml': { category: 'Intelligence', desc: 'Machine Learning model inference integration and Google Cloud Platform services.' },
  };

  function getTechMeta(name) {
    if (!name) return { category: 'Technology', desc: 'Software engineering tool / dependency.' };
    const key = name.toLowerCase().trim();
    if (TECH_INFO[key]) return TECH_INFO[key];
    for (const [k, val] of Object.entries(TECH_INFO)) {
      if (key.includes(k)) return val;
    }
    return { category: 'Core Stack', desc: `Technical component and dependency for ${name} implementation.` };
  }

  /* ── Robust Page Detection ────────────────── */
  const has = (id) => !!document.getElementById(id);
  const IS = {
    home:     has('hero') || has('expPreviewMap'),
    projects: has('projectRows'),
    detail:   has('pdetailRoot') || has('projectDetail'),
    exp:      has('expFullMap') || has('certsGrid'),
  };

  /* ── Bilingual Data Field Helper ──────────── */
  function pField(obj, field) {
    if (!obj) return '';
    if (window.currentLang === 'id') {
      return obj[field + '_id'] || obj[field] || '';
    }
    return obj[field] || '';
  }

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
  let currentActiveModal = null;

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
    currentActiveModal = { type, targetId };

    if (type === 'project') {
      const project = (D.projects || []).find(p => p.slug === targetId) || D.projects[0];
      if (!project) return;
      const realImg = project.images && project.images.length > 0;
      const tempImg = project.temporaryPreviewImages && project.temporaryPreviewImages.length > 0;
      const hasImg = realImg || tempImg;
      const activeImages = realImg ? project.images : (tempImg ? project.temporaryPreviewImages.map(src => ({ src, alt: 'Temporary preview' })) : []);
      const isFeatured = project.featured === true || project.tier === 'featured';

      const shortDesc = pField(project, 'shortDescription');
      const whyText = pField(project, 'why');
      const probText = pField(project, 'problem');
      const solText = pField(project, 'solution');
      const roleText = pField(project, 'role');
      const techDetailsText = pField(project, 'techDetails');

      modal.innerHTML = `
        <div class="modal-container" role="document">
          <!-- Top Bar -->
          <div class="modal-topbar">
            <span class="modal-topbar__num">PROJECT ${project.index}</span>
            <span class="modal-topbar__center">${(project.displayName || project.name).toUpperCase()}</span>
            <button class="modal-close-btn" id="modalCloseBtn" type="button" aria-label="Close project modal">
              <span>${window.t('modal_close')}</span>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          <!-- 3-Column Modal Grid (30% / 40% / 30%) -->
          <div class="modal-body-grid">
            <!-- 30% Left: STORY -->
            <div class="modal-col-meta" style="justify-content: flex-start;">
              ${shortDesc ? `
                <div class="modal-story-sec">
                  <h3 class="modal-sec-lbl">${window.t('modal_label_overview')}</h3>
                  <p class="modal-sec-text">${shortDesc}</p>
                </div>
              ` : ''}

              ${whyText ? `
                <div class="modal-story-sec">
                  <h3 class="modal-sec-lbl">${window.t('modal_label_why')}</h3>
                  <p class="modal-sec-text">${whyText}</p>
                </div>
              ` : ''}

              ${probText ? `
                <div class="modal-story-sec">
                  <h3 class="modal-sec-lbl">${window.t('modal_label_problem')}</h3>
                  <p class="modal-sec-text">${probText}</p>
                </div>
              ` : ''}

              ${solText ? `
                <div class="modal-story-sec">
                  <h3 class="modal-sec-lbl">${window.t('modal_label_solution')}</h3>
                  <p class="modal-sec-text">${solText}</p>
                </div>
              ` : ''}

              ${project.challenges ? `
                <div class="modal-story-sec">
                  <h3 class="modal-sec-lbl">CHALLENGES</h3>
                  <p class="modal-sec-text">${project.challenges}</p>
                </div>
              ` : ''}

              ${project.outcome ? `
                <div class="modal-story-sec">
                  <h3 class="modal-sec-lbl">OUTCOME</h3>
                  <p class="modal-sec-text">${project.outcome}</p>
                </div>
              ` : ''}

              <div style="margin-top: 2rem; display: flex; flex-direction: column; gap: 1rem; border-top: 1px solid var(--border); padding-top: 1.5rem;">
                <div class="modal-meta-item">
                  <span class="modal-meta-lbl">${window.t('modal_meta_year')}</span>
                  <span class="modal-meta-val">${project.year || 'TBA'}</span>
                </div>
                ${roleText ? `
                  <div class="modal-meta-item">
                    <span class="modal-meta-lbl">${window.t('modal_meta_role')}</span>
                    <span class="modal-meta-val">${roleText}</span>
                  </div>
                ` : ''}
                ${project.status ? `
                  <div class="modal-meta-item">
                    <span class="modal-meta-lbl">${window.t('modal_meta_status')}</span>
                    <span class="modal-meta-val">${project.status.toUpperCase()}</span>
                  </div>
                ` : ''}
                ${isFeatured ? `
                  <div class="modal-meta-item">
                    <span class="modal-meta-lbl">${window.t('modal_meta_highlight')}</span>
                    <span class="modal-meta-badge">${window.t('badge_featured')}</span>
                  </div>
                ` : ''}
              </div>
            </div>

            <!-- 40% Center: SHOWCASE -->
            <div class="modal-col-story">
              <div class="modal-visual-wrap">
                ${hasImg ? `
                  <div style="position:relative; width:100%; height:100%;">
                    <img id="modalMainImg" src="${activeImages[0].src}" alt="${activeImages[0].alt || project.name}" loading="lazy">
                    ${!realImg && tempImg ? `<div class="temp-preview-badge">${window.t('badge_temporary_preview')}</div>` : ''}
                  </div>
                ` : `
                  <div class="modal-visual-fallback">
                    <span style="font-family:var(--font-display);font-size:1.125rem;font-weight:700;color:var(--fg);display:block;">${window.t('badge_project_preview')}</span>
                    <span style="font-family:var(--font-mono);font-size:.5625rem;color:var(--muted);letter-spacing:.08em;text-transform:uppercase;margin-top:.35rem;">${window.t('badge_awaiting_assets')}</span>
                  </div>
                `}
              </div>

              ${(hasImg && activeImages.length > 1) ? `
                <div class="modal-thumbnails" style="margin-top: 1rem; margin-bottom: 2rem;">
                  ${activeImages.map((img, i) => `
                    <button class="modal-thumb-btn ${i === 0 ? 'active' : ''}" data-src="${img.src}" aria-label="View screenshot ${i + 1}">
                      <img src="${img.src}" alt="Thumbnail ${i + 1}" loading="lazy">
                    </button>
                  `).join('')}
                </div>
              ` : '<div style="margin-bottom: 2rem;"></div>'}

              ${project.features && project.features.length ? `
                <div class="modal-story-sec">
                  <h3 class="modal-sec-lbl">${window.t('modal_key_features')}</h3>
                  <ul class="modal-sec-bullets">
                    ${project.features.map(f => `<li>${f}</li>`).join('')}
                  </ul>
                </div>
              ` : ''}
            </div>

            <!-- 30% Right: TECH & LINKS -->
            <div class="modal-col-visual" style="background: rgba(0,0,0,0.01);">
              ${project.techStack && project.techStack.length ? `
                <div class="modal-tech-box">
                  <h3 class="modal-tech-lbl">${window.t('modal_label_tech_stack')}</h3>
                  <ul class="modal-tech-clean-list">
                    ${project.techStack.map(t => `<li class="modal-tech-clean-item">${t}</li>`).join('')}
                  </ul>
                </div>
              ` : ''}

              ${techDetailsText ? `
                <div class="modal-story-sec" style="margin-top: 2.5rem;">
                  <h3 class="modal-sec-lbl">${window.t('modal_label_tech')}</h3>
                  <p class="modal-sec-text">${techDetailsText}</p>
                </div>
              ` : ''}

              ${(project.liveDemo || project.github) ? `
                <div class="modal-links-box" style="margin-top: 3rem; display: flex; flex-direction: column; gap: 1rem;">
                  ${project.liveDemo ? `
                    <a href="${project.liveDemo}" target="_blank" rel="noopener noreferrer" class="modal-action-btn primary" aria-label="Live demo for ${project.name}">
                      <span>${window.t('modal_btn_live_demo')}</span>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M7 17L17 7M17 7H7M17 7v10"/></svg>
                    </a>
                  ` : ''}
                  ${project.github ? `
                    <a href="${project.github}" target="_blank" rel="noopener noreferrer" class="modal-action-btn secondary" aria-label="GitHub repo for ${project.name}">
                      <span>${window.t('modal_btn_github')}</span>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M7 17L17 7M17 7H7M17 7v10"/></svg>
                    </a>
                  ` : ''}
                </div>
              ` : ''}
            </div>
          </div>
        </div>
      `;

      // Attach thumbnail click events
      if (hasImg && activeImages.length > 1) {
        setTimeout(() => {
          const mainImg = document.getElementById('modalMainImg');
          const thumbs = modal.querySelectorAll('.modal-thumb-btn');
          thumbs.forEach(t => {
            t.addEventListener('click', () => {
              thumbs.forEach(btn => btn.classList.remove('active'));
              t.classList.add('active');
              if (mainImg) mainImg.src = t.getAttribute('data-src');
            });
          });
        }, 50);
      }
    } else if (type === 'experience') {
      const idx = typeof targetId === 'number' ? targetId : (D.experience || []).findIndex(e => e.id === targetId);
      const item = (D.experience || [])[idx >= 0 ? idx : 0];
      if (!item) return;

      const hasImg = item.temporaryPreviewImages && item.temporaryPreviewImages.length > 0;
      const activeImages = hasImg ? item.temporaryPreviewImages.map(src => ({ src, alt: 'Preview' })) : [];

      const begText = pField(item, 'beginning');
      const headText = pField(item, 'headline');
      const probText = pField(item, 'problem');
      const workText = pField(item, 'work') || pField(item, 'turningPoint');
      const impText = pField(item, 'impact') || pField(item, 'whatITookWithMe');

      modal.innerHTML = `
        <div class="modal-container" role="document">
          <!-- Top Bar -->
          <div class="modal-topbar">
            <span class="modal-topbar__num">EXPERIENCE</span>
            <span class="modal-topbar__center">${(item.role + ' / ' + item.org).toUpperCase()}</span>
            <button class="modal-close-btn" id="modalCloseBtn" type="button" aria-label="Close experience modal">
              <span>${window.t('modal_close')}</span>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          <!-- 3-Column Modal Grid (30% / 40% / 30%) -->
          <div class="modal-body-grid">
            <!-- 30% Left: STORY -->
            <div class="modal-col-meta" style="justify-content: flex-start;">
              ${begText ? `
                <div class="modal-story-sec">
                  <h3 class="modal-sec-lbl">${window.t('modal_exp_beginning')}</h3>
                  <p class="modal-sec-text">${begText}</p>
                </div>
              ` : ''}

              ${headText ? `
                <div class="modal-story-sec">
                  <h3 class="modal-sec-lbl">${window.t('modal_label_why')}</h3>
                  <p class="modal-sec-text">${headText}</p>
                </div>
              ` : ''}

              ${probText ? `
                <div class="modal-story-sec">
                  <h3 class="modal-sec-lbl">${window.t('modal_exp_problem')}</h3>
                  <p class="modal-sec-text">${probText}</p>
                </div>
              ` : ''}

              ${workText ? `
                <div class="modal-story-sec">
                  <h3 class="modal-sec-lbl">${window.t('modal_exp_work')}</h3>
                  <p class="modal-sec-text">${workText}</p>
                </div>
              ` : ''}

              <div style="margin-top: 2rem; display: flex; flex-direction: column; gap: 1rem; border-top: 1px solid var(--border); padding-top: 1.5rem;">
                <div class="modal-meta-item">
                  <span class="modal-meta-lbl">${window.t('modal_meta_period')}</span>
                  <span class="modal-meta-val">${item.period}</span>
                </div>
                <div class="modal-meta-item">
                  <span class="modal-meta-lbl">${window.t('modal_meta_role')}</span>
                  <span class="modal-meta-val">${item.role}</span>
                </div>
                <div class="modal-meta-item">
                  <span class="modal-meta-lbl">${window.currentLang === 'id' ? 'LOKASI' : 'LOCATION'}</span>
                  <span class="modal-meta-val">${item.location || 'Pekanbaru, Riau'}</span>
                </div>
                ${item.gpa ? `
                  <div class="modal-meta-item">
                    <span class="modal-meta-lbl">${window.currentLang === 'id' ? 'REKAM AKADEMIK' : 'ACADEMIC RECORD'}</span>
                    <span class="modal-meta-val">${item.gpa}</span>
                  </div>
                ` : ''}
              </div>
            </div>

            <!-- 40% Center: SHOWCASE -->
            <div class="modal-col-story">
              <div class="modal-visual-wrap">
                ${hasImg ? `
                  <div style="position:relative; width:100%; height:100%;">
                    <img id="modalMainImg" src="${activeImages[0].src}" alt="Main visual preview" loading="lazy">
                    <div class="temp-preview-badge">${window.t('badge_temporary_preview')}</div>
                  </div>
                ` : `
                  <div class="modal-visual-fallback">
                    <span style="font-family:var(--font-display);font-size:1.125rem;font-weight:700;color:var(--fg);display:block;">${window.t('badge_project_preview')}</span>
                    <span style="font-family:var(--font-mono);font-size:.5625rem;color:var(--muted);letter-spacing:.08em;text-transform:uppercase;margin-top:.35rem;">${window.t('badge_awaiting_assets')}</span>
                  </div>
                `}
              </div>

              ${(hasImg && activeImages.length > 1) ? `
                <div class="modal-thumbnails" style="margin-top: 1rem; margin-bottom: 2rem;">
                  ${activeImages.map((img, i) => `
                    <button class="modal-thumb-btn ${i === 0 ? 'active' : ''}" data-src="${img.src}" aria-label="View screenshot ${i + 1}">
                      <img src="${img.src}" alt="Thumbnail ${i + 1}" loading="lazy">
                    </button>
                  `).join('')}
                </div>
              ` : '<div style="margin-bottom: 2rem;"></div>'}

              ${item.bullets && item.bullets.length ? `
                <div class="modal-story-sec">
                  <h3 class="modal-sec-lbl">${window.currentLang === 'id' ? 'TANGGUNG JAWAB UTAMA' : 'KEY RESPONSIBILITIES'}</h3>
                  <ul class="modal-sec-bullets">
                    ${item.bullets.map(b => `<li>${b}</li>`).join('')}
                  </ul>
                </div>
              ` : ''}

              ${impText ? `
                <div class="modal-story-sec" style="margin-top: 1.5rem;">
                  <h3 class="modal-sec-lbl">${window.t('modal_exp_impact')}</h3>
                  <p class="modal-sec-text">${impText}</p>
                </div>
              ` : ''}
            </div>

            <!-- 30% Right: TECH & LINKS -->
            <div class="modal-col-visual" style="background: rgba(0,0,0,0.01);">
              ${(item.technologies || item.tags) && (item.technologies || item.tags).length ? `
                <div class="modal-tech-box">
                  <h3 class="modal-tech-lbl">${window.currentLang === 'id' ? 'ALAT & LINGKUNGAN KERJA' : 'TECH & ENVIRONMENT'}</h3>
                  <ul class="modal-tech-clean-list">
                    ${(item.technologies || item.tags).map(t => `<li class="modal-tech-clean-item">${t}</li>`).join('')}
                  </ul>
                </div>
              ` : ''}

              ${item.workflow ? `
                <div class="modal-story-sec" style="margin-top: 2.5rem;">
                  <h3 class="modal-sec-lbl">${window.t('modal_label_tech')}</h3>
                  <p class="modal-sec-text">${item.workflow}</p>
                </div>
              ` : ''}
            </div>
          </div>
        </div>
      `;
    }

    modal.querySelector('#modalCloseBtn')?.addEventListener('click', closeModal);

    const mainImg = modal.querySelector('#modalMainImg');
    const thumbBtns = modal.querySelectorAll('.modal-thumb-btn');
    if (mainImg && thumbBtns.length > 0) {
      thumbBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          thumbBtns.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          mainImg.style.opacity = '0';
          setTimeout(() => {
            mainImg.src = btn.dataset.src;
            mainImg.style.opacity = '1';
          }, 150);
        });
      });
    }

    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    isModalOpen = true;
  }

  function closeModal() {
    if (!modalBackdrop) return;
    modalBackdrop.classList.remove('open');
    modalBackdrop.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    isModalOpen = false;
    currentActiveModal = null;
  }

  /* ── langchange re-render ───────────────── */
  document.addEventListener('langchange', () => {
    if (IS.projects && window.renderProjectRows) {
      window.renderProjectRows(window.activeProjectFilter || 'all');
    }
    if (IS.exp) {
      buildExpFullMap();
      buildCerts();
    }
    if (IS.home) {
      buildExpPreviewMap();
      buildHomeTrailer();
    }
    if (IS.detail && typeof initDetailPage === 'function') {
      initDetailPage();
    }
    if (isModalOpen && currentActiveModal) {
      openModal(currentActiveModal.type, currentActiveModal.targetId);
    }
  });

  /* also sync mobile lang toggle */
  document.getElementById('langToggleMobile')?.addEventListener('click', () => {
    const next = window.currentLang === 'en' ? 'id' : 'en';
    if (window.applyLang) window.applyLang(next);
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

    const badge = pField(item, 'badge') || pField(item, 'typeLabel') || 'MILESTONE';
    const year = item.year || item.period || '';
    const title = pField(item, 'title') || item.role || '';
    const subtitle = item.subtitle || (item.org ? item.org.split(',')[0] : '');
    const desc = pField(item, 'reflection') || pField(item, 'context') || pField(item, 'beginning') || pField(item, 'headline') || (item.bullets ? item.bullets[0] : '');

    card.innerHTML = `
      <div class="msp-header">
        <span class="msp-year">${year}</span>
      </div>
      <div class="msp-title">${title}</div>
      <div class="msp-desc">"${desc}"</div>
    `;
    card.dataset.index = item.expIndex !== undefined ? item.expIndex : '';

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
      { year: '2022', badge: '01 · ORIGIN', title: 'FOUNDATIONS', reflection: 'Started my journey by learning how systems work from the ground up.', expIndex: 0 },
      { year: '2023–24', badge: '02 · HARDWARE & OPS', title: 'REAL SYSTEMS', reflection: 'Maintained 83 workstations across three labs.', expIndex: 1 },
      { year: '2024', badge: '03 · SCALE & CODE', title: 'INFRASTRUCTURE', reflection: 'Helped deploy 256 access points across 14 buildings.', expIndex: 2 },
      { year: '2024–25', badge: '04 · TEAM & SYSTEMS', title: 'ENGINEERING', reflection: 'Leading a team, solving problems together, documenting, reviewing, and building better systems.', expIndex: 3 },
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
            <stop offset="63%"  stop-color="#fff" stop-opacity="1" />
            <stop offset="72%"  stop-color="#fff" stop-opacity="0.75" />
            <stop offset="82%"  stop-color="#fff" stop-opacity="0.3" />
            <stop offset="94%"  stop-color="#fff" stop-opacity="0.06" />
            <stop offset="100%" stop-color="#fff" stop-opacity="0" />
          </linearGradient>
          <rect x="0" y="0" width="100%" height="100%" fill="url(#trailMistGrad)" />
        </mask>
      `;
      svg.appendChild(defs);

      // ── Route Path: origin → 4 milestones → X marker → into fog ──
      // X marker is at x=800, fog starts at x=820 so marker sits right at fog edge.
      const pathD = `
        M 65 220
        C 115 220, 160 155, 235 155
        C 290 155, 315 225, 360 225
        C 410 225, 450 145, 505 145
        C 560 145, 610 235, 660 235
        C 705 235, 740 195, 780 195
        C 820 195, 860 210, 900 200
        C 940 190, 980 205, 1020 195
        C 1060 185, 1090 190, 1120 185
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

      // Milestone Configurations
      const DESKTOP_NODES = [
        {
          x: 235, y: 155,
          textX: 110, textY: 95,
          item: milestones[0],
        },
        {
          x: 360, y: 225,
          textX: 360, textY: 263,
          item: milestones[1],
        },
        {
          x: 505, y: 145,
          textX: 505, textY: 50,
          item: milestones[2],
        },
        {
          x: 660, y: 235,
          textX: 660, textY: 270,
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
        const tx = nd.textX;
        const ty = nd.textY;

        const badgeStr = pField(nd.item, 'badge');
        const titleStr = pField(nd.item, 'title');

        g.appendChild(mkSVGText(badgeStr, tx, ty, 'map-label-tag', 'middle'));
        g.appendChild(mkSVGText(nd.item.year, tx, ty + 16, 'map-label-year', 'middle'));
        g.appendChild(mkSVGText(titleStr, tx, ty + 30, 'map-label-title', 'middle'));

        // Sneak Peek Hover & Focus Events
        g.addEventListener('mouseenter', () => showMapSneakPeek(g, stage, nd.item));
        g.addEventListener('mouseleave', hideMapSneakPeek);
        g.addEventListener('focus', () => showMapSneakPeek(g, stage, nd.item));
        g.addEventListener('blur', hideMapSneakPeek);

        // Click logic
        g.addEventListener('click', (e) => {
          if (isMobile) {
            if (activeSneakPeekCard && activeSneakPeekCard.dataset.index === String(nd.item.expIndex)) {
              hideMapSneakPeek();
              openModal('experience', nd.item.expIndex);
            } else {
              showMapSneakPeek(g, stage, nd.item);
            }
          } else {
            hideMapSneakPeek();
            openModal('experience', nd.item.expIndex);
          }
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

      // ── Clickable Fog & Waypoint Zone ──
      // The ENTIRE fog area and the X marker are one large <a> linking to experience.html.
      const destinationAnchor = mkSVG('a');
      destinationAnchor.setAttribute('href', 'experience.html');
      // Adding both classes so hovering anywhere in the zone triggers both waypoint and mystery hover effects
      destinationAnchor.setAttribute('class', 'map-mystery-anchor map-waypoint-anchor');
      destinationAnchor.setAttribute('aria-label', 'Explore the full journey on Experience page');
      destinationAnchor.style.cursor = 'pointer';

      // Invisible hit-rect spanning the fog zone and X marker
      const fogHitRect = mkSVG('rect');
      fogHitRect.setAttribute('x', '770');
      fogHitRect.setAttribute('y', '0');
      fogHitRect.setAttribute('width', '390');
      fogHitRect.setAttribute('height', '340');
      fogHitRect.setAttribute('fill', 'transparent');
      destinationAnchor.appendChild(fogHitRect);

      // ── Waypoint / X Marker ──
      // Center of X at x=965, y=198 (on the path line, middle of the clouds). wpX = 965 - 16 = 949, wpY = 198 - 16 = 182
      const wpX = 949, wpY = 182;
      const waypointG = mkSVG('g');
      waypointG.innerHTML = `
        <g class="map-waypoint-group" transform="translate(${wpX}, ${wpY})">
          <!-- Radar pulse -->
          <circle cx="16" cy="16" r="14" class="waypoint-radar" />
          <!-- Minimal X — swallowed by fog -->
          <path d="M 7 7 L 25 25 M 25 7 L 7 25" stroke="var(--fg)" stroke-width="2.4" stroke-linecap="round" class="waypoint-x" />
          <rect x="1" y="1" width="30" height="30" fill="none" stroke="var(--fg)" stroke-width="1" opacity="0.30" />
        </g>
      `;
      destinationAnchor.appendChild(waypointG);

      // ── Soft Organic Light-Gray Clouds / Mist ──
      const cloudsG = mkSVG('g');
      cloudsG.setAttribute('class', 'map-soft-clouds');
      cloudsG.innerHTML = `
        <!-- Layer 1: Wide ambient base mist -->
        <g filter="url(#mistBlur)" opacity="0.52">
          <ellipse cx="900"  cy="170" rx="80"  ry="60"  fill="var(--fog-color-3)" />
          <ellipse cx="960"  cy="130" rx="100" ry="75"  fill="var(--fog-color-2)" />
          <ellipse cx="955"  cy="220" rx="95"  ry="72"  fill="var(--fog-color-2)" />
          <ellipse cx="1030" cy="100" rx="115" ry="82"  fill="var(--fog-color)"  />
          <ellipse cx="1035" cy="245" rx="110" ry="78"  fill="var(--fog-color)"  />
          <ellipse cx="1090" cy="170" rx="105" ry="85"  fill="var(--fog-color)"  />
        </g>

        <!-- Layer 2: Defined cloud puffs -->
        <g filter="url(#cloudBlur)" opacity="0.7">
          <circle cx="845" cy="180" r="30"  fill="var(--fog-color-3)" />
          <circle cx="862" cy="150" r="36"  fill="var(--fog-color-3)" />
          <circle cx="870" cy="210" r="32"  fill="var(--fog-color-3)" />

          <circle cx="910" cy="100" r="52"  fill="var(--fog-color-2)" />
          <circle cx="920" cy="170" r="65"  fill="var(--fog-color)"  />
          <circle cx="910" cy="245" r="55"  fill="var(--fog-color-2)" />

          <circle cx="980" cy="80"  r="60"  fill="var(--fog-color)"  />
          <circle cx="990" cy="160" r="78"  fill="var(--fog-color)"  />
          <circle cx="975" cy="255" r="68"  fill="var(--fog-color)"  />

          <circle cx="1055" cy="110" r="70"  fill="var(--fog-color)"  />
          <circle cx="1060" cy="200" r="72"  fill="var(--fog-color)"  />
          <circle cx="1105" cy="155" r="80"  fill="var(--fog-color)"  />
        </g>

        <!-- Layer 3: Organic cloud edge hairlines -->
        <path d="M 835 185 C 858 160, 895 148, 925 155 C 948 138, 980 132, 1010 140"
              stroke="var(--fog-color-2)" stroke-width="1.4" fill="none" opacity="0.6" />
        <path d="M 848 212 C 870 230, 908 235, 935 225 C 960 240, 998 242, 1025 232"
              stroke="var(--fog-color-2)" stroke-width="1.2" fill="none" opacity="0.5" />
        <path d="M 890 108 C 912  88, 952  84, 978  96 C 1000  74, 1040  78, 1068  92"
              stroke="var(--fog-color)"   stroke-width="1"   fill="none" opacity="0.45" />
        <path d="M 920 265 C 945 250, 978 252, 1005 265 C 1028 255, 1060 260, 1085 270"
              stroke="var(--fog-color)"   stroke-width="1"   fill="none" opacity="0.4" />
      `;
      destinationAnchor.appendChild(cloudsG);

      // ── Mystery Glyph '?' & 'TERRA INCOGNITA' ──
      // Positioned directly above the X marker
      const mysteryG = mkSVG('g');
      mysteryG.setAttribute('transform', 'translate(965, 143)');

      const qText = mkSVG('text');
      qText.setAttribute('x', '0');
      qText.setAttribute('y', '0');
      qText.setAttribute('text-anchor', 'middle');
      qText.setAttribute('class', 'map-mystery-glyph');
      qText.textContent = '?';
      mysteryG.appendChild(qText);

      const subText = mkSVG('text');
      subText.setAttribute('x', '0');
      subText.setAttribute('y', '22');
      subText.setAttribute('text-anchor', 'middle');
      subText.setAttribute('class', 'map-mystery-sub');
      subText.textContent = 'TERRA INCOGNITA';
      mysteryG.appendChild(subText);

      destinationAnchor.appendChild(mysteryG);

      // ── Floating Pill Tooltip (Rendered on top of clouds) ──
      const tooltipG = mkSVG('g');
      tooltipG.innerHTML = `
        <g class="waypoint-pill-tooltip" transform="translate(${wpX + 16}, ${wpY})">
          <rect x="-78" y="-22" width="156" height="26" rx="13" class="wp-pill-bg" />
          <text x="0" y="-5" text-anchor="middle" class="wp-pill-text">Explore the full journey →</text>
        </g>
      `;
      destinationAnchor.appendChild(tooltipG);

      svg.appendChild(destinationAnchor);

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

          g.appendChild(mkSVGText(nd.item.badge, textX, nd.y - 10, 'map-label-tag', textAnchor));
          g.appendChild(mkSVGText(nd.item.year, textX, nd.y + 6, 'map-label-year', textAnchor));
          g.appendChild(mkSVGText(nd.item.title, textX, nd.y + 20, 'map-label-title', textAnchor));

          g.addEventListener('mouseenter', () => { if(!isMobile) showMapSneakPeek(g, stage, nd.item); });
          g.addEventListener('mouseleave', () => { if(!isMobile) hideMapSneakPeek(); });

          g.addEventListener('click', (e) => {
            if (isMobile) {
              if (activeSneakPeekCard && activeSneakPeekCard.dataset.index === String(nd.item.expIndex)) {
                hideMapSneakPeek();
                openModal('experience', nd.item.expIndex);
              } else {
                hideMapSneakPeek();
                showMapSneakPeek(g, stage, nd.item);
              }
            } else {
              hideMapSneakPeek();
              openModal('experience', nd.item.expIndex);
            }
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

      const realImg = p.images && p.images.length > 0;
      const tempImg = p.temporaryPreviewImages && p.temporaryPreviewImages.length > 0;
      const hasImg = realImg || tempImg;
      const activeImages = realImg ? p.images : (tempImg ? p.temporaryPreviewImages.map(src => ({ src, alt: 'Temporary preview' })) : []);
      
      // Mini cards fan for hover effect (identical to projects archive page)
      let cardsFanHtml = '';
      if (hasImg) {
        const cardImages = activeImages.length >= 3 ? activeImages.slice(0, 3) : [activeImages[0], activeImages[0], activeImages[0]];
        cardsFanHtml = `
          <div class="prow__cards-fan">
            ${cardImages.map((cImg, i) => `
              <div class="prow__mini-card card-${i + 1}">
                <img src="${cImg.src}" alt="Mini preview" loading="lazy">
              </div>
            `).join('')}
          </div>
        `;
      }

      card.innerHTML = `
        <div class="pcard__img">
          ${hasImg ? `
            <div class="prow__img-wrap" style="position:relative; width:100%; height:100%; overflow:visible; display:flex; align-items:center; justify-content:center;">
              <img class="pcard__main-img" src="${activeImages[0].src}" alt="${activeImages[0].alt || p.name}" loading="lazy">
              <div class="prow__img-overlay"></div>
              ${cardsFanHtml}
              ${!realImg && tempImg ? `<div class="temp-preview-badge">${window.t('badge_temporary_preview')}</div>` : ''}
            </div>
          ` : `
            <div class="pcard__img-ph">
              <span class="pcard__ph-title">${window.t('badge_project_preview')}</span>
            </div>
          `}
        </div>
        <div class="pcard__top">
          <span class="pcard__idx">${p.index}</span>
          <svg class="pcard__arrow" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M7 17L17 7M17 7H7M17 7v10"/></svg>
        </div>
        <div class="pcard__body">
          <h3 class="pcard__name">${p.displayName || p.name}</h3>
          <p class="pcard__desc">${pField(p, 'shortDescription')}</p>
          ${p.techStack ? `<div class="pcard__tags">${p.techStack.slice(0,4).map(t=>`<span class="pcard__tag">${t}</span>`).join('')}</div>` : ''}
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

  /* ── Horizontal drag & wheel scroll interaction ── */
  function initHorizontalScroll() {
    const track = document.getElementById('projectsTrack');
    const outer = track ? track.parentElement : null;
    const fill  = document.getElementById('progressFill');
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

    // Wheel scrolling: smoothly translate vertical wheel into horizontal carousel scroll
    outer.addEventListener('wheel', (e) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        const maxScroll = outer.scrollWidth - outer.clientWidth;
        const atStart = outer.scrollLeft <= 1;
        const atEnd = outer.scrollLeft >= maxScroll - 4;

        if ((e.deltaY > 0 && !atEnd) || (e.deltaY < 0 && !atStart)) {
          e.preventDefault();
          outer.scrollLeft += e.deltaY;
          updateProgress();
        }
      }
    }, { passive: false });

    // Drag to scroll
    let isDown = false;
    let startX = 0;
    let scrollLeft = 0;

    outer.addEventListener('mousedown', (e) => {
      isDown = true;
      outer.style.cursor = 'grabbing';
      startX = e.pageX - outer.offsetLeft;
      scrollLeft = outer.scrollLeft;
    });

    window.addEventListener('mouseup', () => {
      if (!isDown) return;
      isDown = false;
      outer.style.cursor = 'grab';
    });

    outer.addEventListener('mouseleave', () => {
      if (!isDown) return;
      isDown = false;
      outer.style.cursor = 'grab';
    });

    outer.addEventListener('mousemove', (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - outer.offsetLeft;
      const walk = (x - startX) * 1.2;
      outer.scrollLeft = scrollLeft - walk;
      updateProgress();
    });
  }

  /* ════════════════════════════════════════════
     PROJECTS LISTING PAGE (30% / 40% / 30%)
  ════════════════════════════════════════════ */
  if (IS.projects) {
    initProjectsPage();
  }

  function initProjectsPage() {
    const filterTabs = document.querySelectorAll('.filter-tab, .archive-filter-btn');
    const rowsContainer = document.getElementById('projectRows');
    const countEl = document.getElementById('projectCount');
    if (countEl && D.projects) {
      countEl.textContent = String(D.projects.length).padStart(2, '0');
    }
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

      if (countEl) {
        countEl.textContent = String(list.length).padStart(2, '0');
      }

      list.forEach((p) => {
        const realImg = p.images && p.images.length > 0;
        const tempImg = p.temporaryPreviewImages && p.temporaryPreviewImages.length > 0;
        const hasImg = realImg || tempImg;
        const activeImages = realImg ? p.images : (tempImg ? p.temporaryPreviewImages.map(src => ({ src, alt: 'Temporary preview' })) : []);
        const isFeatured = p.featured === true || p.tier === 'featured';

        const rowEl = el('article', {
          class: `project-row${isFeatured ? ' featured' : ''}`,
          role: 'listitem',
          'data-slug': p.slug,
          tabindex: '0',
          'aria-label': `${p.displayName || p.name} — ${p.year}. Click to view full engineering case study.`,
        });

        // Main content wrapper (3 Symmetrical Columns: Left Story 1fr, Center Image 1.2fr, Right Tech 1fr)
        const mainWrap = el('div', { class: 'prow__main' });

        // 1. Left Column (Story / Overview / Value)
        const leftCol = el('div', { class: 'prow__content-col prow__left' });
        const catStr = (pField(p, 'category') || 'PROJECT').toUpperCase();
        const roleStr = (pField(p, 'role') || 'ROLE').toUpperCase();
        let metaString = `${catStr} · ${roleStr} · ${p.year || '2025'}`;
        
        let valueHtml = '';
        const whyOrProb = pField(p, 'why') || pField(p, 'problem');
        if (whyOrProb) {
          valueHtml = `
            <div style="margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px dashed var(--border);">
              <span style="font-family: var(--font-mono); font-size: .5625rem; font-weight: 700; color: var(--muted); letter-spacing: .1em; text-transform: uppercase; display: block; margin-bottom: .5rem;">${window.t('value_label')}</span>
              <p style="font-size: .875rem; line-height: 1.6; color: var(--fg);">${whyOrProb}</p>
            </div>
          `;
        }

        leftCol.innerHTML = `
          <div style="display: flex; align-items: center; gap: 0.6rem; margin-bottom: 0.4rem;">
            <span class="prow__index">${p.index}</span>
            <span style="font-family: var(--font-mono); font-size: .5625rem; font-weight: 700; color: var(--muted); letter-spacing: .08em; text-transform: uppercase;">${catStr}</span>
          </div>
          <h2 class="prow__title">${p.displayName || p.name}</h2>
          <p class="prow__desc" style="margin-top: .75rem;">${pField(p, 'shortDescription')}</p>
          ${valueHtml}
          <div class="prow__meta" style="margin-top: 1.5rem;">${metaString}</div>
        `;

        // 2. Center Column (Image)
        const centerCol = el('div', { class: 'prow__img-col prow__center' });
        if (hasImg) {
          const imgWrap = el('div', { style: 'position:relative; width:100%; height:100%; display:flex; align-items:center; justify-content:center;' });
          
          // Main image
          imgWrap.appendChild(el('img', { src: activeImages[0].src, alt: activeImages[0].alt || p.name, loading: 'lazy' }));
          
          // Overlay to darken main image on hover
          const overlay = el('div', { class: 'prow__img-overlay' });
          imgWrap.appendChild(overlay);

          // Mini cards fan
          if (activeImages.length > 0) {
            const fanWrap = el('div', { class: 'prow__cards-fan' });
            const cardImages = activeImages.length >= 3 ? activeImages.slice(0, 3) : [activeImages[0], activeImages[0], activeImages[0]];
            cardImages.forEach((cImg, i) => {
              const card = el('div', { class: `prow__mini-card card-${i+1}` });
              card.appendChild(el('img', { src: cImg.src, alt: 'Mini preview', loading: 'lazy' }));
              fanWrap.appendChild(card);
            });
            imgWrap.appendChild(fanWrap);
          }

          if (!realImg && tempImg) {
            const badge = el('div', { class: 'temp-preview-badge' });
            badge.textContent = window.t('badge_temporary_preview');
            imgWrap.appendChild(badge);
          }
          centerCol.appendChild(imgWrap);
        } else {
          centerCol.innerHTML = `
            <div class="prow__img-ph">
              <span class="prow__ph-title">${window.t('badge_project_preview')}</span>
            </div>
          `;
        }

        // 3. Right Column (Tech & CTA)
        const rightCol = el('div', { class: 'prow__right', style: 'display: flex; flex-direction: column; gap: 1.5rem; padding-top: 0.5rem;' });
        
        // Tech stack chips (Show ALL compactly)
        let techHtml = '';
        if (p.techStack && p.techStack.length) {
          techHtml = `
            <div>
              <span style="font-family: var(--font-mono); font-size: .5625rem; font-weight: 700; color: var(--muted); letter-spacing: .1em; text-transform: uppercase; margin-bottom: .75rem; display: block;">${window.t('tech_col_label')}</span>
              <div style="display: flex; flex-wrap: wrap; gap: 6px;">
                ${p.techStack.map(t => `<span style="font-family: var(--font-mono); font-size: .65rem; padding: 3px 8px; border: 1px solid var(--border); border-radius: 4px; color: var(--fg); white-space: nowrap; background: rgba(0,0,0,0.02);">${t}</span>`).join('')}
              </div>
            </div>
          `;
        }

        let techDetailsHtml = '';
        const techDetailsText = pField(p, 'techDetails');
        if (techDetailsText) {
          techDetailsHtml = `
            <div style="margin-top: -0.5rem;">
              <span style="font-family: var(--font-mono); font-size: .5625rem; font-weight: 700; color: var(--muted); letter-spacing: .1em; text-transform: uppercase; display: block; margin-bottom: .5rem;">${window.t('architecture_label')}</span>
              <p style="font-size: .8125rem; line-height: 1.6; color: var(--muted);">${techDetailsText}</p>
            </div>
          `;
        }
        
        rightCol.innerHTML = `
          ${techHtml}
          ${techDetailsHtml}
          <div class="prow__cta" style="margin-top: auto;">
            ${window.t('project_row_cta')}
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </div>
        `;

        mainWrap.appendChild(leftCol);
        mainWrap.appendChild(centerCol);
        mainWrap.appendChild(rightCol);

        rowEl.appendChild(mainWrap);

        // Click opens modal
        rowEl.addEventListener('click', (e) => {
          if (e.target.closest('a')) return;
          openModal('project', p.slug);
        });
        rowEl.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            if (e.target.closest('a')) return;
            e.preventDefault();
            openModal('project', p.slug);
          }
        });

        rowsContainer.appendChild(rowEl);
      });

      if (list.length === 0) {
        rowsContainer.innerHTML = `
          <div class="prow__empty">
            <span class="prow__empty-text">${window.t('empty_category')}</span>
          </div>
        `;
      }
    }

    window.renderProjectRows = renderRows;
    window.activeProjectFilter = activeFilter;

    filterTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        activeFilter = tab.dataset.filter;
        window.activeProjectFilter = activeFilter;
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
     PROJECT DETAIL PAGE (project.html)
  ════════════════════════════════════════════ */
  if (IS.detail) {
    initDetailPage();
  }

  function initDetailPage() {
    const root = document.getElementById('pdetailRoot');
    if (!root) return;
    const urlParams = new URLSearchParams(window.location.search);
    const slug = urlParams.get('slug') || urlParams.get('id') || 'penny-path';
    const project = (D.projects || []).find(p => p.slug === slug) || D.projects[0];
    if (!project) {
      root.innerHTML = `<p>${window.t('pdetail_not_found')}</p>`;
      return;
    }
    document.title = `${project.displayName || project.name} — Erliandika Syahputra`;

    const realImg = project.images && project.images.length > 0;
    const tempImg = project.temporaryPreviewImages && project.temporaryPreviewImages.length > 0;
    const activeImages = realImg ? project.images : (tempImg ? project.temporaryPreviewImages.map(src => ({ src, alt: 'Preview' })) : []);

    const whyOrProb = pField(project, 'why') || pField(project, 'problem');
    const catStr = (pField(project, 'category') || 'PROJECT').toUpperCase();
    const shortDesc = pField(project, 'shortDescription');
    const techDetails = pField(project, 'techDetails');

    root.innerHTML = `
      <div style="margin-bottom: 2rem;">
        <a href="projects.html" class="pdetail__back" style="display: inline-flex; align-items: center; gap: 0.5rem; font-family: var(--font-mono); font-size: 0.75rem; color: var(--muted); text-transform: uppercase;">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="15 18 9 12 15 6"/></svg>
          <span>${window.t('pdetail_back')}</span>
        </a>
      </div>
      <div class="project-row" style="cursor: default; border: none; padding: 0;">
        <div class="prow__main">
          <div class="prow__left">
            <div style="display: flex; align-items: center; gap: 0.6rem; margin-bottom: 0.4rem;">
              <span class="prow__index">${project.index}</span>
              <span style="font-family: var(--font-mono); font-size: .5625rem; font-weight: 700; color: var(--muted); letter-spacing: .08em; text-transform: uppercase;">${catStr}</span>
            </div>
            <h1 class="prow__title" style="font-size: 2.25rem;">${project.displayName || project.name}</h1>
            <p class="prow__desc" style="margin-top: .75rem; font-size: 1rem;">${shortDesc}</p>
            ${whyOrProb ? `
              <div style="margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px dashed var(--border);">
                <span style="font-family: var(--font-mono); font-size: .5625rem; font-weight: 700; color: var(--muted); letter-spacing: .1em; text-transform: uppercase; display: block; margin-bottom: .5rem;">${window.t('value_label')}</span>
                <p style="font-size: .875rem; line-height: 1.6; color: var(--fg);">${whyOrProb}</p>
              </div>
            ` : ''}
            <div class="prow__meta" style="margin-top: 1.5rem;">${catStr} · ${project.year || '2025'}</div>
          </div>
          <div class="prow__center">
            ${activeImages.length ? `
              <div style="border-radius: 8px; overflow: hidden; border: 1px solid var(--border); box-shadow: var(--shadow-md);">
                <img src="${activeImages[0].src}" alt="${project.name}" style="width: 100%; height: auto; display: block;">
              </div>
            ` : ''}
          </div>
          <div class="prow__right">
            ${project.techStack && project.techStack.length ? `
              <div>
                <span style="font-family: var(--font-mono); font-size: .5625rem; font-weight: 700; color: var(--muted); letter-spacing: .1em; text-transform: uppercase; margin-bottom: .75rem; display: block;">${window.t('tech_col_label')}</span>
                <div style="display: flex; flex-wrap: wrap; gap: 6px;">
                  ${project.techStack.map(t => `<span style="font-family: var(--font-mono); font-size: .65rem; padding: 3px 8px; border: 1px solid var(--border); border-radius: 4px; color: var(--fg); white-space: nowrap; background: rgba(0,0,0,0.02);">${t}</span>`).join('')}
                </div>
              </div>
            ` : ''}
            ${techDetails ? `
              <div>
                <span style="font-family: var(--font-mono); font-size: .5625rem; font-weight: 700; color: var(--muted); letter-spacing: .1em; text-transform: uppercase; display: block; margin-bottom: .5rem;">${window.t('architecture_label')}</span>
                <p style="font-size: .8125rem; line-height: 1.6; color: var(--muted);">${techDetails}</p>
              </div>
            ` : ''}
            ${(project.liveDemo || project.github) ? `
              <div style="display: flex; flex-direction: column; gap: 0.75rem; margin-top: 1.5rem;">
                ${project.liveDemo ? `<a href="${project.liveDemo}" target="_blank" rel="noopener noreferrer" class="modal-action-btn primary"><span>${window.t('modal_btn_live_demo')}</span></a>` : ''}
                ${project.github ? `<a href="${project.github}" target="_blank" rel="noopener noreferrer" class="modal-action-btn secondary"><span>${window.t('modal_btn_github')}</span></a>` : ''}
              </div>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }

  /* ════════════════════════════════════════════
     EXPERIENCE PAGE — MAP & CERTS
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
      <span class="exp-map-prompt__text">${window.t('map_prompt_text')}</span>
    `;
    wrap.appendChild(hintBar);

    const svgWrap = el('div', { class: 'exp-map-svg-container' });
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
        g.setAttribute('aria-label', `Milestone ${nd.item.year}: ${nd.item.role} at ${nd.item.org}`);

        const isAbove = nd.side === 'above';
        const anchor  = nd.x > VW * 0.75 ? 'end' : (nd.x < VW * 0.35 ? 'start' : 'middle');
        const xPos    = nd.x;
        const yBase   = isAbove ? nd.y - 20 : nd.y + 26;

        g.appendChild(mkSVGText(nd.item.year, xPos, isAbove ? yBase - 28 : yBase, 'map-label-year', anchor));
        g.appendChild(mkSVGText(nd.item.org,  xPos, isAbove ? yBase - 14 : yBase + 14, 'map-label-org',  anchor));
        g.appendChild(mkSVGText(nd.item.role, xPos, isAbove ? yBase : yBase + 28, 'map-label-role', anchor));

        const selectNode = () => {
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
        'aria-label': `${c.name || c.title} by ${c.issuer}`,
      });

      card.innerHTML = `
        <div class="cert-card__top">
          <span class="cert-card__issuer">${c.issuer}</span>
          <span class="cert-card__year">${c.year}</span>
        </div>
        <h3 class="cert-card__name">${c.name || c.title}</h3>
        ${c.category ? `<div style="font-family:var(--font-mono); font-size:0.625rem; color:var(--muted); text-transform:uppercase; letter-spacing:0.06em; margin-top:0.25rem;">${pField(c, 'category')}</div>` : ''}
        ${c.credential ? `<p class="cert-card__id" style="font-family:var(--font-mono); font-size:0.65rem; color:var(--muted); margin-top:0.5rem;">Credential ID: <code>${c.credential}</code></p>` : ''}
        ${c.link ? `
          <a href="${c.link}" target="_blank" rel="noopener noreferrer" class="cert-card__link" style="display:inline-flex; align-items:center; gap:0.35rem; font-family:var(--font-mono); font-size:0.65rem; color:var(--fg); margin-top:0.75rem; text-decoration:underline;">
            ${window.t('cert_verify')}
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M7 17L17 7H7M17 7v10"/></svg>
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
