/**
 * lang.js — Bilingual (EN / ID) Language System for Erliandika Syahputra Portfolio
 *
 * Architecture:
 *   • Priority: URL query param (?lang=id|en) -> localStorage ('portfolio-lang') -> default ('en')
 *   • Dictionary: window.LANG_STRINGS (Professional Software Engineer terminology)
 *   • DOM Bindings: [data-i18n], [data-i18n-aria-label], [data-i18n-title], [data-i18n-placeholder]
 *   • Dynamic Data Getter: window.getLangText(object, field)
 *   • Event: 'langchange' dispatched on document
 */

(function () {
  const KEY = 'portfolio-lang';

  /* ── String Dictionary ─────────────────────── */
  window.LANG_STRINGS = {
    en: {
      // Navigation
      nav_home: 'Home',
      nav_projects: 'Projects',
      nav_experience: 'Experience',

      // Hero
      hero_role: 'Software Engineer',
      aria_download_cv: 'Download CV',
      aria_theme_toggle: 'Toggle colour theme',
      aria_menu_open: 'Open navigation menu',
      aria_menu_close: 'Close menu',
      aria_modal_close: 'Close modal',
      aria_lang_switch: 'Switch language',
      aria_cert_expand: 'Enlarge certificate',

      // Section Labels
      section_journey_label: 'Career Journey',
      journey_explore_cta: 'Explore the full journey',
      section_projects_label: 'Selected Projects',

      // Projects Trailer & Archive
      projects_view_all: 'View all projects',
      projects_view_all_tag: 'WORKS',
      projects_page_heading: 'SELECTED WORKS & SYSTEMS',
      projects_page_intro: 'Curated production systems, web applications, and software engineering projects.',
      projects_meta_suffix: 'PROJECTS',
      filter_all: 'ALL',
      filter_featured: 'FEATURED',
      filter_web: 'WEB',
      filter_mobile: 'MOBILE',
      filter_systems: 'SYSTEMS',
      projects_view_github: 'View more on GitHub',
      project_row_cta: 'VIEW PROJECT',
      project_trailer_cta: 'VIEW CASE STUDY',
      tech_col_label: 'TECH STACK',
      architecture_label: 'ARCHITECTURE & DECISIONS',
      value_label: 'MEASURABLE OUTCOME',

      // Project Modal & Detail
      modal_label_overview: 'OVERVIEW',
      modal_label_why: 'WHY I BUILT IT',
      modal_label_problem: 'THE PROBLEM',
      modal_label_solution: 'THE SOLUTION',
      modal_label_role: 'MY ROLE',
      modal_label_gallery: 'GALLERY',
      modal_label_tech: 'ARCHITECTURE & DECISIONS',
      modal_label_tech_stack: 'TECH STACK & TOOLS',
      modal_label_why_tech: 'WHY THIS TECH STACK',
      modal_key_features: 'KEY FEATURES',
      modal_close: 'CLOSE',
      modal_btn_live_demo: 'Live Demo',
      modal_btn_github: 'GitHub Repository',
      modal_meta_year: 'YEAR',
      modal_meta_status: 'STATUS',
      modal_meta_highlight: 'HIGHLIGHT',
      modal_nav_prev: 'Previous Project',
      modal_nav_next: 'Next Project',
      modal_nav_start: 'Start',
      modal_nav_end: 'End',
      pdetail_links_label: 'PROJECT LINKS',

      // Experience & Dossier
      exp_page_heading: 'Experience & Education',
      exp_page_sub: 'Timeline & Milestones (2022 — 2026)',
      exp_filter_all: 'ALL',
      exp_filter_academic: 'ACADEMIC',
      exp_filter_work: 'WORK',
      exp_filter_leadership: 'LEADERSHIP',
      exp_closing_quote: '"Building systems that solve real operational problems with craft and precision."',
      exp_closing_sig: '— Erliandika Syahputra',
      exp_back: 'Back to home',
      exp_view_cta: 'VIEW FULL DETAILS',

      modal_exp_beginning: '01 · CONTEXT & ORIGIN',
      modal_exp_work: '02 · ENGINEERING SCOPE & EXECUTION',
      modal_exp_challenge_outcome: '03 · CHALLENGE & KEY OUTCOME',
      modal_exp_problem_label: 'Challenge:',
      modal_exp_impact_label: 'Outcome:',
      modal_exp_tech: 'TOOLS & TECHNOLOGIES',
      modal_exp_bullets: 'KEY HIGHLIGHTS',
      modal_exp_prev_btn: 'Previous Milestone',
      modal_exp_next_btn: 'Next Milestone',

      // Map Labels
      map_basecamp: 'BASECAMP',
      map_dest_badge: '✦ THE NEXT CHAPTER',
      map_dest_title: 'Our Collaboration?',
      map_dest_cta: "Let's build together →",

      // Certifications
      certs_heading: 'Certifications & Professional Credentials',
      cert_verify: 'VERIFIED CREDENTIAL',
      cert_btn_expand: 'EXPAND',
      cert_btn_pdf: 'PDF',

      // Detail Page
      pdetail_back: 'Back to projects',
      pdetail_loading: 'Loading project…',
      pdetail_not_found: 'Project not found.',

      // 404
      page_404_status: 'Status 404 · Page Not Found',
      page_404_title: 'Lost in Cyberspace',
      page_404_desc: "The page you are looking for doesn't exist, has been moved, or is temporarily unavailable.",
      page_404_home: 'Back to Home',

      empty_category: 'NO PROJECTS IN THIS CATEGORY',
    },

    id: {
      // Navigation
      nav_home: 'Beranda',
      nav_projects: 'Proyek',
      nav_experience: 'Pengalaman',

      // Hero
      hero_role: 'Software Engineer',
      aria_download_cv: 'Unduh CV',
      aria_theme_toggle: 'Ganti tema warna',
      aria_menu_open: 'Buka menu navigasi',
      aria_menu_close: 'Tutup menu',
      aria_modal_close: 'Tutup modal proyek',
      aria_lang_switch: 'Ganti bahasa',
      aria_cert_expand: 'Perbesar sertifikat',

      // Section Labels
      section_journey_label: 'Perjalanan Karier',
      journey_explore_cta: 'Jelajahi linimasa lengkap',
      section_projects_label: 'Proyek Pilihan',

      // Projects Trailer & Archive
      projects_view_all: 'Lihat semua proyek',
      projects_view_all_tag: 'KARYA',
      projects_page_heading: 'KARYA & SISTEM PROYEK',
      projects_page_intro: 'Kumpulan sistem produksi, aplikasi web, dan rekayasa perangkat lunak.',
      projects_meta_suffix: 'PROYEK',
      filter_all: 'SEMUA',
      filter_featured: 'UNGGULAN',
      filter_web: 'WEB',
      filter_mobile: 'MOBILE',
      filter_systems: 'SISTEM',
      projects_view_github: 'Lihat repositori GitHub',
      project_row_cta: 'LIHAT PROYEK',
      project_trailer_cta: 'LIHAT DETAIL KARYA',
      tech_col_label: 'TECH STACK',
      architecture_label: 'ARSITEKTUR & KEPUTUSAN TEKNIS',
      value_label: 'DAMPAK TERUKUR',

      // Project Modal & Detail
      modal_label_overview: 'GAMBARAN UMUM',
      modal_label_why: 'LATAR BELAKANG & TUJUAN',
      modal_label_problem: 'TANTANGAN UTAMA',
      modal_label_solution: 'SOLUSI & PENDEKATAN',
      modal_label_role: 'PERAN SAYA',
      modal_label_gallery: 'DOKUMENTASI & GALERI',
      modal_label_tech: 'ARSITEKTUR & KEPUTUSAN TEKNIS',
      modal_label_tech_stack: 'TECH STACK & TOOLS',
      modal_label_why_tech: 'ALASAN PEMILIHAN TECH STACK',
      modal_key_features: 'FITUR UTAMA',
      modal_close: 'TUTUP',
      modal_btn_live_demo: 'Live Demo',
      modal_btn_github: 'Repositori GitHub',
      modal_meta_year: 'TAHUN',
      modal_meta_status: 'STATUS',
      modal_meta_highlight: 'SOROTAN',
      modal_nav_prev: 'Proyek Sebelumnya',
      modal_nav_next: 'Proyek Selanjutnya',
      modal_nav_start: 'Awal',
      modal_nav_end: 'Akhir',
      pdetail_links_label: 'TAUTAN PROYEK',

      // Experience & Dossier
      exp_page_heading: 'Pengalaman & Pendidikan',
      exp_page_sub: 'Linimasa & Jejak Langkah (2022 — 2026)',
      exp_filter_all: 'SEMUA',
      exp_filter_academic: 'AKADEMIK',
      exp_filter_work: 'KERJA',
      exp_filter_leadership: 'KEPEMIMPINAN',
      exp_closing_quote: '"Membangun perangkat lunak yang memecahkan masalah operasional secara nyata dan teruji."',
      exp_closing_sig: '— Erliandika Syahputra',
      exp_back: 'Kembali ke beranda',
      exp_view_cta: 'LIHAT DETAIL LENGKAP',

      modal_exp_beginning: '01 · LATAR BELAKANG & AWAL MULA',
      modal_exp_work: '02 · LINGKUP TEKNIS & EKSEKUSI',
      modal_exp_challenge_outcome: '03 · TANTANGAN & HASIL TERUKUR',
      modal_exp_problem_label: 'Tantangan:',
      modal_exp_impact_label: 'Dampak:',
      modal_exp_tech: 'ALAT & TEKNOLOGI',
      modal_exp_bullets: 'SOROTAN UTAMA',
      modal_exp_prev_btn: 'Milestone Sebelumnya',
      modal_exp_next_btn: 'Milestone Selanjutnya',

      // Map Labels
      map_basecamp: 'BASECAMP',
      map_dest_badge: '✦ LANGKAH BERIKUTNYA',
      map_dest_title: 'Kolaborasi Kita?',
      map_dest_cta: 'Mari Membangun Bersama →',

      // Certifications
      certs_heading: 'Sertifikasi & Kredensial Profesi',
      cert_verify: 'KREDENSIAL TERVERIFIKASI',
      cert_btn_expand: 'PERBESAR',
      cert_btn_pdf: 'PDF',

      // Detail Page
      pdetail_back: 'Kembali ke daftar proyek',
      pdetail_loading: 'Memuat proyek…',
      pdetail_not_found: 'Proyek tidak ditemukan.',

      // 404
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

  /* ── Centralized Localized Data Getter ────── */
  window.getLangText = function (obj, field) {
    if (!obj) return '';
    const lang = window.currentLang || 'en';
    if (lang === 'id' && obj[field + '_id']) {
      return obj[field + '_id'];
    }
    return obj[field] || '';
  };

  /* ── Update pill UI ──────────────────────── */
  function updatePills(lang) {
    document.querySelectorAll('.navbar__lang-pill').forEach(pill => {
      pill.setAttribute('data-active', lang);
      const labelStr = lang === 'en' ? 'Switch to Indonesian' : 'Ganti ke Bahasa Inggris';
      pill.setAttribute('aria-label', labelStr);
      pill.setAttribute('title', labelStr);
    });
  }

  /* ── Apply lang to DOM elements ──────────── */
  function applyLang(lang) {
    const safeLang = (lang === 'id' || lang === 'en') ? lang : 'en';
    window.currentLang = safeLang;
    try {
      localStorage.setItem(KEY, safeLang);
    } catch (e) {}

    document.documentElement.setAttribute('lang', safeLang);

    // 1. Text Content
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      const str = window.t(key);
      if (str) el.textContent = str;
    });

    // 2. Accessibility & Meta Attributes
    document.querySelectorAll('[data-i18n-aria-label]').forEach(el => {
      const key = el.getAttribute('data-i18n-aria-label');
      const str = window.t(key);
      if (str) el.setAttribute('aria-label', str);
    });

    document.querySelectorAll('[data-i18n-title]').forEach(el => {
      const key = el.getAttribute('data-i18n-title');
      const str = window.t(key);
      if (str) el.setAttribute('title', str);
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      const str = window.t(key);
      if (str) el.setAttribute('placeholder', str);
    });

    updatePills(safeLang);

    // Fire custom event for dynamic components in app.js
    document.dispatchEvent(new CustomEvent('langchange', { detail: { lang: safeLang } }));
  }

  /* ── Determine initial language ──────────── */
  let initial = 'en';
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const paramLang = urlParams.get('lang');
    if (paramLang === 'id' || paramLang === 'en') {
      initial = paramLang;
    } else {
      const stored = localStorage.getItem(KEY);
      if (stored === 'id' || stored === 'en') {
        initial = stored;
      }
    }
  } catch (e) {}

  window.currentLang = initial;

  /* ── Initialize on DOM ready ─────────────── */
  function init() {
    applyLang(initial);

    // Bind pill toggles
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

  /* ── Expose globally ─────────────────────── */
  window.applyLang = applyLang;
})();
