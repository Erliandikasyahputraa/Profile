/**
 * lang.js — Bilingual (EN / ID) language system.
 *
 * Default: English.
 * Persisted in localStorage key: 'portfolio-lang'.
 *
 * Architecture:
 *   - LANG_STRINGS: complete UI strings in both languages (authentic, human, non-robotic).
 *   - applyLang(lang): walks DOM, updates [data-i18n] elements
 *   - Lang pill toggle drives [data-active] for sliding CSS indicator
 */

(function () {
  const KEY = 'portfolio-lang';

  /* ── String Dictionary ─────────────────────── */
  window.LANG_STRINGS = {
    en: {
      nav_home: 'Home',
      nav_projects: 'Projects',
      nav_experience: 'Experience',

      hero_role: 'Software Engineer',

      section_journey_label: 'The Unfinished Journey',
      section_journey_status: 'Uncharted Trajectory',
      journey_explore_cta: 'Explore the full journey',

      section_projects_label: 'Selected Projects',
      projects_view_all: 'View all projects',

      projects_page_heading: 'THE PROJECT ARCHIVE',
      projects_page_intro: "A collection of systems, products, experiments, and things I've built.",
      projects_meta_suffix: 'PROJECTS',
      filter_all: 'ALL',
      filter_featured: 'FEATURED',
      filter_web: 'WEB',
      filter_mobile: 'MOBILE',
      filter_systems: 'SYSTEMS',
      projects_view_github: 'View more on GitHub',
      project_row_cta: 'VIEW PROJECT',
      tech_col_label: 'CORE TECH',
      architecture_label: 'ARCHITECTURE',
      value_label: 'THE VALUE',

      modal_label_overview: 'OVERVIEW',
      modal_label_why: 'WHY IT MATTERS',
      modal_label_problem: 'THE PROBLEM',
      modal_label_solution: 'THE SOLUTION',
      modal_label_role: 'MY ROLE',
      modal_label_gallery: 'GALLERY',
      modal_label_tech: 'TECHNOLOGY OVERVIEW',
      modal_label_tech_stack: 'TECH STACK & LIBRARIES',
      modal_key_features: 'KEY FEATURES',
      modal_close: 'CLOSE',
      modal_btn_live_demo: 'LIVE DEMO',
      modal_btn_github: 'GITHUB REPOSITORY',
      modal_meta_year: 'YEAR',
      modal_meta_status: 'STATUS',
      modal_meta_highlight: 'HIGHLIGHT',
      badge_featured: 'FEATURED',
      badge_temporary_preview: 'TEMPORARY PREVIEW',
      badge_project_preview: 'PROJECT PREVIEW',
      badge_awaiting_assets: 'Awaiting Assets',

      exp_page_heading: 'Experience & Education',
      exp_page_sub: 'My journey so far.',
      exp_filter_all: 'ALL',
      exp_filter_academic: 'ACADEMIC',
      exp_filter_work: 'WORK',
      exp_filter_leadership: 'LEADERSHIP',
      exp_closing_quote: '"Every system I touched, I tried to make a little better."',
      exp_closing_sig: "— That's the journey.",
      exp_back: 'Back to home',
      exp_view_cta: 'VIEW EXPERIENCE',

      modal_exp_beginning: 'HOW IT STARTED',
      modal_exp_work: 'WHAT I DID',
      modal_exp_problem: 'THE REAL CHALLENGE',
      modal_exp_turning: 'THE TURNING POINT',
      modal_exp_takeaway: 'WHAT I TOOK WITH ME',
      modal_exp_impact: 'IMPACT',
      modal_exp_tech: 'TOOLS & TECH',
      modal_exp_tags: 'KEYWORDS',
      modal_exp_bullets: 'HIGHLIGHTS',
      modal_meta_period: 'PERIOD',
      modal_meta_org: 'ORGANIZATION',
      modal_meta_type: 'CATEGORY',

      certs_heading: 'Certifications & Trainings',
      map_prompt_text: 'Click any milestone on the map to read the engineering journey story',
      cert_verify: 'Verify Credential',

      pdetail_back: 'Back to projects',
      pdetail_loading: 'Loading project…',
      pdetail_not_found: 'Project not found.',

      page_404_status: 'Status 404 · Page Not Found',
      page_404_title: 'Lost in Cyberspace',
      page_404_desc: "The page you are looking for doesn't exist, has been moved, or is temporarily unavailable.",
      page_404_home: 'Back to Home',

      empty_category: 'NO PROJECTS IN THIS CATEGORY',
    },

    id: {
      nav_home: 'Beranda',
      nav_projects: 'Proyek',
      nav_experience: 'Pengalaman',

      hero_role: 'Software Engineer',

      section_journey_label: 'Perjalanan yang Belum Usai',
      section_journey_status: 'Lintasan Belum Terpetakan',
      journey_explore_cta: 'Jelajahi kisah perjalanan selengkapnya',

      section_projects_label: 'Proyek Pilihan',
      projects_view_all: 'Lihat semua proyek',

      projects_page_heading: 'ARSIP PROYEK',
      projects_page_intro: 'Kumpulan sistem, produk, eksperimen, dan karya yang telah saya bangun.',
      projects_meta_suffix: 'PROYEK',
      filter_all: 'SEMUA',
      filter_featured: 'UNGGULAN',
      filter_web: 'WEB',
      filter_mobile: 'MOBILE',
      filter_systems: 'SISTEM',
      projects_view_github: 'Lihat lebih banyak di GitHub',
      project_row_cta: 'LIHAT PROYEK',
      tech_col_label: 'TEKNOLOGI UTAMA',
      architecture_label: 'ARSITEKTUR',
      value_label: 'NILAI & DAMPAK',

      modal_label_overview: 'GAMBARAN UMUM',
      modal_label_why: 'MENGAPA INI PENTING',
      modal_label_problem: 'TANTANGAN NYATA',
      modal_label_solution: 'SOLUSI & PENDEKATAN',
      modal_label_role: 'PERAN SAYA',
      modal_label_gallery: 'DOKUMENTASI & GALERI',
      modal_label_tech: 'TINJAUAN TEKNOLOGI',
      modal_label_tech_stack: 'TECH STACK & TOOLS',
      modal_key_features: 'FITUR UTAMA',
      modal_close: 'TUTUP',
      modal_btn_live_demo: 'DEMO LANGSUNG',
      modal_btn_github: 'REPOSITORI GITHUB',
      modal_meta_year: 'TAHUN',
      modal_meta_status: 'STATUS',
      modal_meta_highlight: 'SOROTAN',
      badge_featured: 'UNGGULAN',
      badge_temporary_preview: 'PREVIEW SEMENTARA',
      badge_project_preview: 'PREVIEW PROYEK',
      badge_awaiting_assets: 'Menunggu Tangkapan Layar',

      exp_page_heading: 'Pengalaman & Pendidikan',
      exp_page_sub: 'Jejak langkah sejauh ini.',
      exp_filter_all: 'SEMUA',
      exp_filter_academic: 'AKADEMIK',
      exp_filter_work: 'KERJA',
      exp_filter_leadership: 'KEPEMIMPINAN',
      exp_closing_quote: '"Setiap sistem yang saya sentuh, selalu saya usahakan menjadi sedikit lebih baik."',
      exp_closing_sig: '— Begitulah perjalanannya.',
      exp_back: 'Kembali ke beranda',
      exp_view_cta: 'LIHAT PENGALAMAN',

      modal_exp_beginning: 'AWAL MULA',
      modal_exp_work: 'APA YANG SAYA KERJAKAN',
      modal_exp_problem: 'TANTANGAN SESUNGGUHNYA',
      modal_exp_turning: 'TITIK BALIK',
      modal_exp_takeaway: 'PELAJARAN BERHARGA',
      modal_exp_impact: 'KONTRIBUSI & DAMPAK',
      modal_exp_tech: 'ALAT & TEKNOLOGI',
      modal_exp_tags: 'KATA KUNCI',
      modal_exp_bullets: 'SOROTAN UTAMA',
      modal_meta_period: 'PERIODE',
      modal_meta_org: 'INSTITUSI / ORGANISASI',
      modal_meta_type: 'KATEGORI',

      certs_heading: 'Sertifikasi & Pelatihan',
      map_prompt_text: 'Klik salah satu titik perjalanan pada peta untuk membaca kisah di baliknya',
      cert_verify: 'Verifikasi Kredensial',

      pdetail_back: 'Kembali ke daftar proyek',
      pdetail_loading: 'Memuat proyek…',
      pdetail_not_found: 'Proyek tidak ditemukan.',

      page_404_status: 'Status 404 · Halaman Tidak Ditemukan',
      page_404_title: 'Tersesat di Ruang Siber',
      page_404_desc: 'Halaman yang Anda tuju tidak ada, telah dipindahkan, atau sedang tidak dapat diakses.',
      page_404_home: 'Kembali ke Beranda',

      empty_category: 'TIDAK ADA PROYEK DI KATEGORI INI',
    },
  };

  /* ── Core i18n getter ────────────────────── */
  window.t = function (key) {
    const lang = window.currentLang || 'en';
    return (window.LANG_STRINGS[lang] && window.LANG_STRINGS[lang][key])
      || (window.LANG_STRINGS['en'] && window.LANG_STRINGS['en'][key])
      || key;
  };

  /* ── Update pill UI ──────────────────────── */
  function updatePills(lang) {
    document.querySelectorAll('.navbar__lang-pill').forEach(pill => {
      pill.setAttribute('data-active', lang);
      pill.setAttribute('aria-label', `Switch to ${lang === 'en' ? 'Indonesian' : 'English'}`);
    });
  }

  /* ── Apply lang to static [data-i18n] elements ─ */
  function applyLang(lang) {
    window.currentLang = lang;
    localStorage.setItem(KEY, lang);

    document.documentElement.setAttribute('lang', lang);

    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      const str = window.t(key);
      if (str) el.textContent = str;
    });

    updatePills(lang);

    // Fire a custom event so app.js can re-render dynamic content
    document.dispatchEvent(new CustomEvent('langchange', { detail: { lang } }));
  }

  /* ── Read initial lang (default EN) ─────── */
  const stored = localStorage.getItem(KEY);
  const initial = (stored === 'id' || stored === 'en') ? stored : 'en';
  window.currentLang = initial;

  /* ── Apply on DOMContentLoaded ───────────── */
  function init() {
    updatePills(initial);
    applyLang(initial);

    // Bind pill toggles — clicking an option selects it, clicking track toggles
    document.querySelectorAll('.navbar__lang-pill').forEach(pill => {
      pill.addEventListener('click', (e) => {
        const opt = e.target.closest('.navbar__lang-pill__opt');
        if (opt && opt.dataset.lang) {
          applyLang(opt.dataset.lang);
        } else {
          const next = window.currentLang === 'en' ? 'id' : 'en';
          applyLang(next);
        }
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  /* ── Expose applyLang globally ───────────── */
  window.applyLang = applyLang;
})();
