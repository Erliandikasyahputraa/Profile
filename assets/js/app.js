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

  /* ── Upgraded Career Journey Showcase (Git Graph Tree & Telemetry HUD) ── */
  function buildExpPreviewMap() {
    const gitTree = document.getElementById('gitGraphTree');
    const gitHud = document.getElementById('gitGraphHud');
    if (!gitTree || !gitHud) return;

    gitTree.innerHTML = '';
    gitHud.innerHTML = '';

    const isIndo = window.currentLang === 'id';

    const milestones = isIndo ? [
      {
        category: 'Akademik & Pengajaran',
        period: 'Maret 2026',
        role: 'Instruktur Praktikum & Pemateri Data Mining',
        org: 'Fakultas Sains dan Teknologi, UIN Suska Riau',
        location: 'Pekanbaru, Riau',
        shortDesc: 'Membimbing mahasiswa dalam pra-pemrosesan dataset, analisis data eksploratif (EDA), dan penerapan algoritma machine learning.',
        responsibilities: 'Mengampu sesi praktikum laboratorium data mining dan workshop teknis. Membimbing 60+ mahasiswa dalam tahapan pra-pemrosesan dataset, eksplorasi fitur (EDA), pemodelan prediktif, serta penelusuran kesalahan kode (debugging) algoritma klasifikasi dan klasterisasi.',
        highlights: 'Pra-pemrosesan Dataset · EDA · Algoritma Klasifikasi & Klasterisasi',
        tech: ['Python', 'Pandas & NumPy', 'Scikit-Learn', 'EDA', 'Google Colab'],
        expIndex: 0,
      },
      {
        category: 'Kepemimpinan Rekayasa',
        period: 'Nov 2024 – Des 2025',
        role: 'Ketua Divisi Rekayasa Perangkat Lunak',
        org: 'Puzzle Research Data Technology (Predatech)',
        location: 'Pekanbaru, Riau',
        shortDesc: 'Memimpin tim pengembang perangkat lunak, standardisasi alur kerja Git/GitHub, dan penyusunan SOP teknis.',
        responsibilities: 'Memimpin sesi analisis sistem dan pemecahan masalah teknis lintas tim pengembang. Menstandarisasi alur version control, protokol branching, dan peninjauan kode (code review) menggunakan Git dan GitHub, serta menyusun dokumentasi teknis dan Standar Operasional Prosedur (SOP) divisi.',
        highlights: 'Standarisasi Alur Git · Review Kode · Penyusunan SOP Teknis',
        tech: ['Git & GitHub', 'Code Review Workflows', 'Systems Analysis', 'Technical SOPs', 'Team Leadership'],
        expIndex: 1,
      },
      {
        category: 'Kepemimpinan Operasional',
        period: 'Sep 2024 – Nov 2024',
        role: 'Project Director Acara',
        org: 'Milad Sistem Informasi ke-22, UIN Suska Riau',
        location: 'Pekanbaru, Riau',
        shortDesc: 'Memimpin tata kelola operasional acara perhelatan 500+ peserta dengan koordinasi 6 divisi kerja.',
        responsibilities: 'Memimpin perencanaan strategis dan eksekusi operasional acara perhelatan institusional dengan 500+ peserta. Mengoordinasikan 6 divisi operasional lintas fungsi di bawah tenggat waktu ketat, serta mengelola mitigasi kendala teknis audio-visual dan logistik di lapangan.',
        highlights: '500+ Peserta · 6 Divisi Kerja · Manajemen Kontinjensi Lapangan',
        tech: ['Project Management', 'Operational Leadership', 'Logistics & Budgeting', 'Contingency Planning'],
        expIndex: 4,
      },
      {
        category: 'Infrastruktur Jaringan',
        period: 'Jun 2024 – Agu 2024',
        role: 'Teknisi Implementasi Infrastruktur Jaringan',
        org: 'Tim Infrastruktur Jaringan, UIN Sultan Syarif Kasim Riau',
        location: 'Pekanbaru, Riau',
        shortDesc: 'Penggelaran dan konfigurasi 256 wireless access point Ruijie di 14 gedung kampus bertingkat.',
        responsibilities: 'Memasang dan mengonfigurasi 256 Ruijie wireless access point di 14 gedung fakultas bertingkat bersama tim infrastruktur 13 orang. Melakukan penarikan kabel UTP terstruktur, perutean pipa conduit, terminasi konektor RJ45 dan patch panel, serta pengujian konektivitas LAN/WLAN secara sistematis.',
        highlights: '256 Access Point Ruijie · 14 Gedung Kampus · Pengkabelan UTP & Patch Panel',
        tech: ['Ruijie Wireless APs', 'UTP Structured Cabling', 'Patch Panels & RJ45', 'Cable Continuity Testing', 'WLAN Setup'],
        expIndex: 5,
      },
      {
        category: 'Pengembangan Mobile',
        period: 'Feb 2024 – Jul 2024',
        role: 'Lulusan Mobile Development & Leader Tim Capstone',
        org: 'Google Bangkit Academy (Google, GoTo, Traveloka)',
        location: 'Program Nasional (Remote)',
        shortDesc: 'Pengembangan aplikasi Android native Penny Path dengan Kotlin Jetpack Compose dan arsitektur MVVM.',
        responsibilities: 'Menuntaskan kurikulum intensif rekayasa Android native: Kotlin, Android SDK, Jetpack Compose, arsitektur MVVM, Coroutines, Room Database, dan Retrofit. Memimpin tim mobile development pada proyek capstone Penny Path, mengintegrasikan REST API cloud dan model rekomendasi machine learning.',
        highlights: 'Android Native Kotlin · Jetpack Compose · Arsitektur MVVM · Integrasi ML',
        tech: ['Kotlin', 'Android SDK', 'Jetpack Compose', 'MVVM', 'Retrofit', 'Coroutines & Flow'],
        expIndex: 6,
      },
      {
        category: 'Dukungan Sistem & Laboratorium',
        period: 'Sep 2023 – Jun 2024',
        role: 'Asisten Laboratorium & IT Support',
        org: 'Fakultas Sains dan Teknologi, UIN Suska Riau',
        location: 'Pekanbaru, Riau',
        shortDesc: 'Pemeliharaan 83 workstation komputer di 3 laboratorium, penataan switch LAN, dan instalasi OS massal.',
        responsibilities: 'Menjaga kesiapan operasional 83 workstation komputer di 3 laboratorium komputasi melalui diagnostik preventif, pemeliharaan perangkat keras, dan isolasi kerusakan komponen. Mengonfigurasi lingkungan sistem operasi Windows, perangkat lunak akademik, koneksi switch LAN, dan pengkabelan patch cord tanpa insiden downtime saat ujian praktikum.',
        highlights: '83 Workstation Komputer · 3 Laboratorium Komputasi · Pemeliharaan Hardware & LAN',
        tech: ['Hardware Diagnostics', 'Windows OS Deployment', 'IPv4 & Subnetting', 'LAN Switch Patching', 'Cisco Packet Tracer'],
        expIndex: 7,
      },
    ] : [
      {
        category: 'Academic & Instruction',
        period: 'March 2026',
        role: 'Data Mining Practicum Instructor & Workshop Speaker',
        org: 'Faculty of Science and Technology, UIN Suska Riau',
        location: 'Pekanbaru, Riau',
        shortDesc: 'Instructed lab sessions on dataset preprocessing, exploratory data analysis (EDA), and machine learning algorithms.',
        responsibilities: 'Instructed data mining practicum sessions and technical workshops for undergraduate engineering students. Guided 60+ students through dataset preprocessing, exploratory data analysis (EDA), predictive modeling concepts, and practical implementations of classification and clustering algorithms.',
        highlights: 'Dataset Preprocessing · EDA · Classification & Clustering Algorithms',
        tech: ['Python', 'Pandas & NumPy', 'Scikit-Learn', 'EDA', 'Google Colab'],
        expIndex: 0,
      },
      {
        category: 'Engineering Leadership',
        period: 'Nov 2024 – Dec 2025',
        role: 'Head of Software Engineering Division',
        org: 'Puzzle Research Data Technology (Predatech)',
        location: 'Pekanbaru, Riau',
        shortDesc: 'Led software development teams, standardized Git/GitHub workflows, and authored technical SOPs.',
        responsibilities: 'Led technical problem-solving sessions and structured systems analysis across multidisciplinary teams. Standardized collaborative version control and code review workflows using Git and GitHub, establishing branch protocols and authoring engineering Standard Operating Procedures (SOPs).',
        highlights: 'Git Branching Protocols · Code Review Standards · Engineering SOPs',
        tech: ['Git & GitHub', 'Code Review Workflows', 'Systems Analysis', 'Technical SOPs', 'Team Leadership'],
        expIndex: 1,
      },
      {
        category: 'Operational Leadership',
        period: 'Sep 2024 – Nov 2024',
        role: 'Event Project Director',
        org: 'The 22nd Information Systems Anniversary, UIN Suska Riau',
        location: 'Pekanbaru, Riau',
        shortDesc: 'Directed operational execution for an institutional event with 500+ participants across 6 divisions.',
        responsibilities: 'Directed operational planning and execution for an institutional event with 500+ participants, governing 6 cross-functional operational divisions under strict deadlines. Managed live contingency resolution, addressing audio-visual technical disruptions and vendor logistics under high pressure.',
        highlights: '500+ Participants · 6 Operating Divisions · Live Crisis Resolution',
        tech: ['Project Management', 'Operational Leadership', 'Logistics & Budgeting', 'Contingency Planning'],
        expIndex: 4,
      },
      {
        category: 'Network Infrastructure',
        period: 'Jun 2024 – Aug 2024',
        role: 'Network Infrastructure Deployment Technician',
        org: 'Network Infrastructure Team, UIN Sultan Syarif Kasim Riau',
        location: 'Pekanbaru, Riau',
        shortDesc: 'Deployed and configured 256 Ruijie wireless access points across 14 multi-story campus buildings.',
        responsibilities: 'Deployed and configured 256 Ruijie wireless access points across 14 multi-story campus buildings collaborating within a 13-person infrastructure team. Executed structured UTP cable pulling, conduit routing, patch panel terminations, and systematic LAN/WLAN connectivity testing prior to handover.',
        highlights: '256 Ruijie Wireless APs · 14 Campus Buildings · Structured UTP & Patch Panels',
        tech: ['Ruijie Wireless APs', 'UTP Structured Cabling', 'Patch Panels & RJ45', 'Cable Continuity Testing', 'WLAN Setup'],
        expIndex: 5,
      },
      {
        category: 'Mobile Development',
        period: 'Feb 2024 – Jul 2024',
        role: 'Mobile Development Cohort Graduate & Capstone Lead',
        org: 'Google Bangkit Academy (Google, GoTo, Traveloka)',
        location: 'National Cohort (Remote)',
        shortDesc: 'Engineered native Android app Penny Path using Kotlin, Jetpack Compose, and Clean MVVM architecture.',
        responsibilities: 'Completed rigorous Android native engineering curriculum: Kotlin, Android SDK, Jetpack Compose, MVVM Clean Architecture, Coroutines, Room Database, and Retrofit. Led the mobile development track for capstone product Penny Path, integrating cloud REST APIs and machine learning recommendation models.',
        highlights: 'Native Android Kotlin · Jetpack Compose · MVVM Clean Architecture · ML Integration',
        tech: ['Kotlin', 'Android SDK', 'Jetpack Compose', 'MVVM', 'Retrofit', 'Coroutines & Flow'],
        expIndex: 6,
      },
      {
        category: 'IT Systems & Lab Support',
        period: 'Sep 2023 – Jun 2024',
        role: 'IT Support & Laboratory Assistant',
        org: 'Faculty of Science and Technology, UIN Suska Riau',
        location: 'Pekanbaru, Riau',
        shortDesc: 'Maintained 83 computer workstations across 3 labs, LAN switch configurations, and OS deployments.',
        responsibilities: 'Maintained operational readiness for 83 computer workstations across 3 computing laboratories through preventive diagnostics, corrective maintenance, and hardware fault isolation. Standardized computing environments through clean Windows OS installations, academic toolchains, LAN switch patching, and IPv4 configurations with zero downtime during examinations.',
        highlights: '83 Computer Workstations · 3 Laboratories · Zero Exam Downtime',
        tech: ['Hardware Diagnostics', 'Windows OS Deployment', 'IPv4 & Subnetting', 'LAN Switch Patching', 'Cisco Packet Tracer'],
        expIndex: 7,
      },
    ];

    const hudLabels = {
      responsibilitiesLabel: isIndo ? 'Tanggung Jawab Utama:' : 'Key Responsibilities:',
      highlightsLabel: isIndo ? 'Fokus & Capaian:' : 'Key Focus & Deliverables:',
      actionBtn: isIndo ? 'Lihat Detail Pengalaman' : 'View Full Experience Details',
    };

    function renderHud(c) {
      gitHud.innerHTML = `
        <div class="git-hud-card">
          <div class="git-hud-header">
            <span class="git-hud-cat">${c.category}</span>
            <span class="git-hud-period">${c.period}</span>
          </div>

          <h3 class="git-hud-role">${c.role}</h3>
          <div class="git-hud-org">${c.org} · <span class="git-hud-loc">${c.location}</span></div>

          <div class="git-hud-summary-box">
            <span class="git-hud-summary-label">${hudLabels.responsibilitiesLabel}</span>
            <p class="git-hud-summary-text">${c.responsibilities}</p>
          </div>

          <div class="git-hud-highlights-box">
            <span class="git-hud-highlights-label">${hudLabels.highlightsLabel}</span>
            <span class="git-hud-highlights-val">${c.highlights}</span>
          </div>

          <div class="git-hud-tech-row">
            ${c.tech.map(t => `<span class="git-hud-tech-pill">${t}</span>`).join('')}
          </div>

          <div class="git-hud-footer">
            <a href="pages/experience.html" class="git-hud-action-btn" data-exp="${c.expIndex}">
              <span>${hudLabels.actionBtn}</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </a>
          </div>
        </div>
      `;

      gitHud.querySelector('.git-hud-action-btn')?.addEventListener('click', (e) => {
        e.preventDefault();
        openExperienceModal(c.expIndex);
      });
    }

    milestones.forEach((c, idx) => {
      const item = el('div', {
        class: `git-commit-node ${idx === 0 ? 'active' : ''}`,
        tabindex: '0',
        role: 'button',
        'aria-label': `${c.category}: ${c.role}`,
      });

      item.innerHTML = `
        <div class="git-commit-rail">
          <span class="git-commit-dot"></span>
        </div>
        <div class="git-commit-content">
          <div class="git-commit-header">
            <span class="git-node-badge">${c.category}</span>
            <span class="git-commit-period">${c.period}</span>
          </div>
          <h4 class="git-node-role">${c.role}</h4>
          <p class="git-node-org">${c.org}</p>
          <p class="git-node-desc">${c.shortDesc}</p>
        </div>
      `;

      const setNodeActive = () => {
        gitTree.querySelectorAll('.git-commit-node').forEach(n => n.classList.remove('active'));
        item.classList.add('active');
        renderHud(c);
      };

      item.addEventListener('mouseenter', setNodeActive);
      item.addEventListener('click', setNodeActive);
      item.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setNodeActive();
        }
      });

      gitTree.appendChild(item);
    });

    // Initial render
    renderHud(milestones[0]);
  }


  /* ── Full Snaking Map (Deprecated / Replaced by clean reversed cards) ── */
  function buildFullSnakingMap() {
    // Stub to maintain backwards compatibility
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
          <h2 class="exp-modal__role">${getLoc(item, 'role')}</h2>
          <div class="exp-modal__org">${getLoc(item, 'org')} · <span class="exp-modal__loc">${item.location}</span></div>
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

  let activeExpViewMode = 'editorial';
  let activeSplitIdx = 0;

  if (IS.exp) {
    initExperiencePage();
  }

  function initExperiencePage() {
    initExpViewSwitcher();
    renderActiveExpMode();
    buildCertifications();
  }

  function buildExperienceCards() {
    renderActiveExpMode();
  }
  window.buildExperienceCards = buildExperienceCards;

  function initExpViewSwitcher() {
    let savedMode = 'editorial';
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        savedMode = window.localStorage.getItem('exp-view-mode') || 'editorial';
      }
    } catch (e) {}
    activeExpViewMode = ['editorial', 'accordion', 'split'].includes(savedMode) ? savedMode : 'editorial';

    const updateSwitcherUI = () => {
      document.querySelectorAll('.exp-view-pill').forEach(btn => {
        const isMatch = btn.getAttribute('data-mode') === activeExpViewMode;
        btn.classList.toggle('active', isMatch);
        btn.setAttribute('aria-selected', isMatch ? 'true' : 'false');
      });
    };

    document.querySelectorAll('.exp-view-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        const mode = btn.getAttribute('data-mode');
        if (mode && mode !== activeExpViewMode) {
          activeExpViewMode = mode;
          try { localStorage.setItem('exp-view-mode', mode); } catch (e) {}
          updateSwitcherUI();
          renderActiveExpMode();
        }
      });
    });

    updateSwitcherUI();
  }

  function renderActiveExpMode() {
    const listWrap = document.getElementById('expCardsList');
    const splitWrap = document.getElementById('expSplitView');
    if (!listWrap || !splitWrap || !D.experience) return;

    if (activeExpViewMode === 'split') {
      listWrap.style.display = 'none';
      splitWrap.style.display = 'block';
      renderModeSplit();
    } else {
      splitWrap.style.display = 'none';
      listWrap.style.display = 'flex';
      if (activeExpViewMode === 'accordion') {
        renderModeAccordion();
      } else {
        renderModeEditorial();
      }
    }
  }

  /* ── Mode 1: Full Editorial Dossier (Complete, Open, Printable Resume) ── */
  function renderModeEditorial() {
    const listWrap = document.getElementById('expCardsList');
    if (!listWrap || !D.experience) return;
    listWrap.innerHTML = '';

    const isIndo = window.currentLang === 'id';
    const labels = {
      scopeTitle: isIndo ? 'Lingkup Rekayasa & Tanggung Jawab' : 'Engineering Scope & Execution',
      bulletsTitle: isIndo ? 'Capaian & Sorotan Utama' : 'Key Deliverables & Highlights',
      challengeLabel: isIndo ? 'Tantangan Teknis:' : 'Technical Challenge:',
      impactLabel: isIndo ? 'Dampak Terukur:' : 'Measured Outcome:',
    };

    D.experience.forEach((item, originalIdx) => {
      const catText = getLoc(item, 'typeLabel') || 'EXPERIENCE';
      const roleText = getLoc(item, 'role');
      const orgText = getLoc(item, 'org');
      const headlineText = getLoc(item, 'headline');
      const workText = getLoc(item, 'work') || getLoc(item, 'beginning');
      const probText = getLoc(item, 'problem');
      const impactText = getLoc(item, 'impact');

      const card = el('article', {
        class: 'exp-editorial-card',
        id: `exp-editorial-${originalIdx}`,
        'aria-label': `${roleText} · ${orgText} (${item.period})`,
      });

      card.innerHTML = `
        <header class="exp-editorial-card__header">
          <div class="exp-card__badge-row">
            <span class="exp-card__type-badge">${catText.toUpperCase()}</span>
            <span class="exp-card__period">${item.period}</span>
          </div>
          <h2 class="exp-editorial-card__role">${roleText}</h2>
          <div class="exp-editorial-card__org">${orgText} · <span class="exp-editorial-card__loc">${item.location}</span></div>
          ${item.gpa ? `<div class="exp-editorial-card__gpa">GPA: ${item.gpa}</div>` : ''}
          ${headlineText ? `<p class="exp-editorial-card__headline">${headlineText}</p>` : ''}
        </header>

        <div class="exp-editorial-card__body">
          ${workText ? `
            <div class="exp-editorial-sec">
              <h3 class="exp-editorial-sec__title">${labels.scopeTitle}</h3>
              <p class="exp-editorial-sec__text">${workText}</p>
            </div>
          ` : ''}

          ${item.bullets && item.bullets.length ? `
            <div class="exp-editorial-sec">
              <h3 class="exp-editorial-sec__title">${labels.bulletsTitle}</h3>
              <ul class="exp-bullet-list">
                ${item.bullets.map(b => `<li>${b}</li>`).join('')}
              </ul>
            </div>
          ` : ''}

          ${(probText || impactText) ? `
            <div class="exp-callout-box">
              ${probText ? `
                <div class="exp-callout-row">
                  <span class="exp-callout-label">${labels.challengeLabel}</span>
                  <p class="exp-callout-desc">${probText}</p>
                </div>
              ` : ''}
              ${impactText ? `
                <div class="exp-callout-row">
                  <span class="exp-callout-label">${labels.impactLabel}</span>
                  <p class="exp-callout-desc">${impactText}</p>
                </div>
              ` : ''}
            </div>
          ` : ''}

          ${item.technologies && item.technologies.length ? `
            <div class="exp-tech-chips">
              ${item.technologies.map(t => `<span class="exp-tech-chip">${t}</span>`).join('')}
            </div>
          ` : ''}
        </div>
      `;

      listWrap.appendChild(card);
    });
  }

  /* ── Mode 2: In-Place Accordion (Progressive Disclosure) ── */
  function renderModeAccordion() {
    const listWrap = document.getElementById('expCardsList');
    if (!listWrap || !D.experience) return;
    listWrap.innerHTML = '';

    const isIndo = window.currentLang === 'id';
    const labels = {
      openBtn: isIndo ? 'Rincian Lengkap' : 'Detailed Breakdown',
      closeBtn: isIndo ? 'Sembunyikan' : 'Show Less',
      scopeTitle: isIndo ? 'Lingkup Rekayasa & Tanggung Jawab' : 'Engineering Scope & Execution',
      challengeLabel: isIndo ? 'Tantangan Teknis:' : 'Technical Challenge:',
      impactLabel: isIndo ? 'Dampak Terukur:' : 'Measured Outcome:',
    };

    D.experience.forEach((item, originalIdx) => {
      const catText = getLoc(item, 'typeLabel') || 'EXPERIENCE';
      const roleText = getLoc(item, 'role');
      const orgText = getLoc(item, 'org');
      const headlineText = getLoc(item, 'headline');
      const workText = getLoc(item, 'work') || getLoc(item, 'beginning');
      const probText = getLoc(item, 'problem');
      const impactText = getLoc(item, 'impact');

      const card = el('article', {
        class: 'exp-accordion-card',
        id: `exp-acc-${originalIdx}`,
      });

      card.innerHTML = `
        <header class="exp-editorial-card__header" style="margin-bottom:0.75rem; padding-bottom:0.75rem;">
          <div class="exp-card__badge-row">
            <span class="exp-card__type-badge">${catText.toUpperCase()}</span>
            <span class="exp-card__period">${item.period}</span>
          </div>
          <h2 class="exp-editorial-card__role">${roleText}</h2>
          <div class="exp-editorial-card__org">${orgText} · <span class="exp-editorial-card__loc">${item.location}</span></div>
          ${item.gpa ? `<div class="exp-editorial-card__gpa">GPA: ${item.gpa}</div>` : ''}
        </header>

        <div class="exp-accordion-preview">
          ${headlineText ? `<p class="exp-editorial-card__headline" style="margin-top:0.35rem; margin-bottom:0.75rem;">${headlineText}</p>` : ''}
          
          ${item.bullets && item.bullets.length ? `
            <ul class="exp-bullet-list">
              ${item.bullets.slice(0, 2).map(b => `<li>${b}</li>`).join('')}
            </ul>
          ` : ''}

          ${item.technologies && item.technologies.length ? `
            <div class="exp-tech-chips" style="margin-top:0.75rem;">
              ${item.technologies.slice(0, 5).map(t => `<span class="exp-tech-chip">${t}</span>`).join('')}
            </div>
          ` : ''}

          <button class="exp-accordion-toggle" type="button" aria-expanded="false">
            <span class="exp-acc-toggle-text">${labels.openBtn}</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="6 9 12 15 18 9"/></svg>
          </button>
        </div>

        <div class="exp-accordion-drawer">
          ${workText ? `
            <div class="exp-editorial-sec" style="margin-top:0;">
              <h3 class="exp-editorial-sec__title">${labels.scopeTitle}</h3>
              <p class="exp-editorial-sec__text">${workText}</p>
            </div>
          ` : ''}

          ${item.bullets && item.bullets.length > 2 ? `
            <div class="exp-editorial-sec">
              <ul class="exp-bullet-list">
                ${item.bullets.slice(2).map(b => `<li>${b}</li>`).join('')}
              </ul>
            </div>
          ` : ''}

          ${(probText || impactText) ? `
            <div class="exp-callout-box">
              ${probText ? `
                <div class="exp-callout-row">
                  <span class="exp-callout-label">${labels.challengeLabel}</span>
                  <p class="exp-callout-desc">${probText}</p>
                </div>
              ` : ''}
              ${impactText ? `
                <div class="exp-callout-row">
                  <span class="exp-callout-label">${labels.impactLabel}</span>
                  <p class="exp-callout-desc">${impactText}</p>
                </div>
              ` : ''}
            </div>
          ` : ''}

          ${item.technologies && item.technologies.length > 5 ? `
            <div class="exp-tech-chips">
              ${item.technologies.slice(5).map(t => `<span class="exp-tech-chip">${t}</span>`).join('')}
            </div>
          ` : ''}
        </div>
      `;

      const toggleBtn = card.querySelector('.exp-accordion-toggle');
      const toggleText = card.querySelector('.exp-acc-toggle-text');
      toggleBtn?.addEventListener('click', () => {
        const isOpen = card.classList.toggle('open');
        toggleBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        if (toggleText) toggleText.textContent = isOpen ? labels.closeBtn : labels.openBtn;
      });

      listWrap.appendChild(card);
    });
  }

  /* ── Mode 3: Split Master-Detail Layout (IDE / System Architecture) ── */
  function renderModeSplit() {
    const splitWrap = document.getElementById('expSplitView');
    if (!splitWrap || !D.experience) return;
    splitWrap.innerHTML = '';

    const isIndo = window.currentLang === 'id';
    const total = D.experience.length;
    if (activeSplitIdx >= total) activeSplitIdx = 0;

    const layout = el('div', { class: 'exp-split-layout' });
    const nav = el('div', { class: 'exp-split-nav', role: 'tablist' });
    const inspector = el('div', { class: 'exp-split-inspector', role: 'tabpanel' });

    function renderInspector(idx) {
      activeSplitIdx = idx;
      const item = D.experience[idx];
      const catText = getLoc(item, 'typeLabel') || 'EXPERIENCE';
      const roleText = getLoc(item, 'role');
      const orgText = getLoc(item, 'org');
      const headlineText = getLoc(item, 'headline');
      const workText = getLoc(item, 'work') || getLoc(item, 'beginning');
      const probText = getLoc(item, 'problem');
      const impactText = getLoc(item, 'impact');

      inspector.innerHTML = `
        <header class="exp-editorial-card__header">
          <div class="exp-card__badge-row">
            <span class="exp-card__type-badge">${catText.toUpperCase()}</span>
            <span class="exp-card__period">${item.period}</span>
          </div>
          <h2 class="exp-editorial-card__role">${roleText}</h2>
          <div class="exp-editorial-card__org">${orgText} · <span class="exp-editorial-card__loc">${item.location}</span></div>
          ${item.gpa ? `<div class="exp-editorial-card__gpa">GPA: ${item.gpa}</div>` : ''}
          ${headlineText ? `<p class="exp-editorial-card__headline">${headlineText}</p>` : ''}
        </header>

        <div class="exp-editorial-card__body">
          ${workText ? `
            <div class="exp-editorial-sec">
              <h3 class="exp-editorial-sec__title">${isIndo ? 'Lingkup Rekayasa & Tanggung Jawab' : 'Engineering Scope & Execution'}</h3>
              <p class="exp-editorial-sec__text">${workText}</p>
            </div>
          ` : ''}

          ${item.bullets && item.bullets.length ? `
            <div class="exp-editorial-sec">
              <h3 class="exp-editorial-sec__title">${isIndo ? 'Capaian & Sorotan Utama' : 'Key Deliverables & Highlights'}</h3>
              <ul class="exp-bullet-list">
                ${item.bullets.map(b => `<li>${b}</li>`).join('')}
              </ul>
            </div>
          ` : ''}

          ${(probText || impactText) ? `
            <div class="exp-callout-box">
              ${probText ? `
                <div class="exp-callout-row">
                  <span class="exp-callout-label">${isIndo ? 'Tantangan Teknis:' : 'Technical Challenge:'}</span>
                  <p class="exp-callout-desc">${probText}</p>
                </div>
              ` : ''}
              ${impactText ? `
                <div class="exp-callout-row">
                  <span class="exp-callout-label">${isIndo ? 'Dampak Terukur:' : 'Measured Outcome:'}</span>
                  <p class="exp-callout-desc">${impactText}</p>
                </div>
              ` : ''}
            </div>
          ` : ''}

          ${item.technologies && item.technologies.length ? `
            <div class="exp-tech-chips">
              ${item.technologies.map(t => `<span class="exp-tech-chip">${t}</span>`).join('')}
            </div>
          ` : ''}
        </div>

        <div class="exp-split-inspector__nav">
          <button class="exp-split-inspector__nav-btn" id="splitPrevBtn" ${idx === 0 ? 'disabled' : ''}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="15 18 9 12 15 6"/></svg>
            <span>${isIndo ? 'Sebelumnya' : 'Previous'}</span>
          </button>
          <span style="font-family:var(--font-mono);font-size:0.6875rem;color:var(--muted);">${idx + 1} / ${total}</span>
          <button class="exp-split-inspector__nav-btn" id="splitNextBtn" ${idx === total - 1 ? 'disabled' : ''}>
            <span>${isIndo ? 'Selanjutnya' : 'Next'}</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>
      `;

      inspector.querySelector('#splitPrevBtn')?.addEventListener('click', () => {
        if (activeSplitIdx > 0) updateSplit(activeSplitIdx - 1);
      });
      inspector.querySelector('#splitNextBtn')?.addEventListener('click', () => {
        if (activeSplitIdx < total - 1) updateSplit(activeSplitIdx + 1);
      });
    }

    function updateSplit(idx) {
      nav.querySelectorAll('.exp-split-nav-item').forEach((n, i) => {
        n.classList.toggle('active', i === idx);
        n.setAttribute('aria-selected', i === idx ? 'true' : 'false');
      });
      renderInspector(idx);
    }

    D.experience.forEach((item, idx) => {
      const catText = getLoc(item, 'typeLabel') || 'EXPERIENCE';
      const roleText = getLoc(item, 'role');
      const orgText = getLoc(item, 'org');

      const navItem = el('div', {
        class: `exp-split-nav-item ${idx === activeSplitIdx ? 'active' : ''}`,
        role: 'tab',
        tabindex: '0',
        'aria-selected': idx === activeSplitIdx ? 'true' : 'false',
      });

      navItem.innerHTML = `
        <div class="exp-split-nav-item__badge-row">
          <span class="exp-split-nav-item__cat">${catText}</span>
          <span class="exp-split-nav-item__period">${item.period}</span>
        </div>
        <div class="exp-split-nav-item__role">${roleText}</div>
        <div class="exp-split-nav-item__org">${orgText}</div>
      `;

      navItem.addEventListener('click', () => updateSplit(idx));
      navItem.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          updateSplit(idx);
        }
      });

      nav.appendChild(navItem);
    });

    layout.appendChild(nav);
    layout.appendChild(inspector);
    splitWrap.appendChild(layout);

    renderInspector(activeSplitIdx);
  }

  // Reactive listener for language switch across the entire app
  document.addEventListener('langchange', () => {
    if (IS.home) buildExpPreviewMap();
    if (IS.exp) renderActiveExpMode();
  });

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
      renderActiveExpMode();
      buildCertifications();
      if (activeExpModalIdx !== null && document.getElementById('expModal')?.classList.contains('active')) {
        openExperienceModal(activeExpModalIdx);
      }
    }
  });
});
