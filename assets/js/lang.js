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

      section_journey_label: 'Career Journey',
      journey_explore_cta: 'View complete journey',

      section_projects_label: 'Selected Projects',
      projects_view_all: 'View all projects',
      projects_view_all_tag: 'WORKS',
      projects_view_all_card_title: 'EXPLORE ALL WORKS',
      projects_view_all_card_desc: 'Explore the full collection of software systems, web applications, and digital products.',

      projects_page_heading: 'SELECTED WORKS & SYSTEMS',
      projects_page_intro: "A curated collection of production systems, software applications, and engineering projects.",
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
      exp_page_sub: 'Timeline & Milestones (2022 — 2026)',
      exp_filter_all: 'ALL',
      exp_filter_academic: 'ACADEMIC',
      exp_filter_work: 'WORK',
      exp_filter_leadership: 'LEADERSHIP',
      exp_closing_quote: '"Building systems that solve real operational problems with craft and precision."',
      exp_closing_sig: "— Erliandika Syahputra",
      exp_back: 'Back to home',
      exp_view_cta: 'VIEW EXPERIENCE',

      modal_exp_beginning: 'CONTEXT & ORIGIN',
      modal_exp_work: 'RESPONSIBILITIES & EXECUTION',
      modal_exp_problem: 'CORE CHALLENGE',
      modal_exp_turning: 'KEY TAKEAWAYS',
      modal_exp_takeaway: 'WHAT I TOOK WITH ME',
      modal_exp_impact: 'MEASURABLE OUTCOME',
      modal_exp_tech: 'TOOLS & TECHNOLOGIES',
      modal_exp_tags: 'COMPETENCY TAGS',
      modal_exp_bullets: 'KEY HIGHLIGHTS',
      modal_meta_period: 'PERIOD',
      modal_meta_org: 'INSTITUTION / ORGANIZATION',
      modal_meta_type: 'CATEGORY',

      certs_heading: 'Certifications & Professional Credentials',
      map_prompt_text: 'Click any milestone on the map to open the full experience dossier',
      cert_verify: 'Verified Credential',

      pdetail_back: 'Back to projects',
      pdetail_loading: 'Loading project…',
      pdetail_not_found: 'Project not found.',

      page_404_status: 'Status 404 · Page Not Found',
      page_404_title: 'Lost in the Grid',
      page_404_desc: 'The page you are looking for has been moved, deleted, or does not exist.',
      page_404_home: 'Back to Home',

      empty_category: 'NO PROJECTS IN THIS CATEGORY',
    },

    id: {
      nav_home: 'Beranda',
      nav_projects: 'Proyek',
      nav_experience: 'Pengalaman',

      hero_role: 'Software Engineer',

      section_journey_label: 'Perjalanan Karier',
      journey_explore_cta: 'Lihat linimasa lengkap',

      section_projects_label: 'Proyek Pilihan',
      projects_view_all: 'Lihat semua proyek',
      projects_view_all_tag: 'KARYA',
      projects_view_all_card_title: 'JELAJAHI SEMUA KARYA',
      projects_view_all_card_desc: 'Koleksi lengkap seluruh sistem perangkat lunak, aplikasi web, dan rekayasa produk digital.',

      projects_page_heading: 'KARYA & SISTEM PROYEK',
      projects_page_intro: 'Kumpulan sistem produksi, produk aplikasi, dan eksplorasi rekayasa perangkat lunak.',
      projects_meta_suffix: 'PROYEK',
      filter_all: 'SEMUA',
      filter_featured: 'UNGGULAN',
      filter_web: 'WEB',
      filter_mobile: 'MOBILE',
      filter_systems: 'SISTEM',
      projects_view_github: 'Lihat repositori GitHub',
      project_row_cta: 'LIHAT DETAIL',
      tech_col_label: 'TEKNOLOGI UTAMA',
      architecture_label: 'ARSITEKTUR',
      value_label: 'DAMPAK NYATA',

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
      exp_page_sub: 'Linimasa & Jejak Langkah (2022 — 2026)',
      exp_filter_all: 'SEMUA',
      exp_filter_academic: 'AKADEMIK',
      exp_filter_work: 'KERJA',
      exp_filter_leadership: 'KEPEMIMPINAN',
      exp_closing_quote: '"Membangun perangkat lunak yang memecahkan masalah operasional secara nyata dan teruji."',
      exp_closing_sig: '— Erliandika Syahputra',
      exp_back: 'Kembali ke beranda',
      exp_view_cta: 'LIHAT PENGALAMAN',

      modal_exp_beginning: 'LATAR BELAKANG & AWAL MULA',
      modal_exp_work: 'LINGKUP KERJA & EKSEKUSI',
      modal_exp_problem: 'TANTANGAN UTAMA',
      modal_exp_turning: 'PELAJARAN PENTING',
      modal_exp_takeaway: 'NILAI YANG DIPEROLEH',
      modal_exp_impact: 'HASIL & DAMPAK TERUKUR',
      modal_exp_tech: 'ALAT & TEKNOLOGI',
      modal_exp_tags: 'TAG KOMPETENSI',
      modal_exp_bullets: 'SOROTAN UTAMA',
      modal_meta_period: 'PERIODE',
      modal_meta_org: 'INSTITUSI / ORGANISASI',
      modal_meta_type: 'KATEGORI',

      certs_heading: 'Sertifikasi & Kredensial Profesi',
      map_prompt_text: 'Klik salah satu titik perjalanan pada peta untuk membuka modul detail pengalaman',
      cert_verify: 'Kredensial Terverifikasi',

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
