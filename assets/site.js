/* LabFlow LIMS — shared site JS: i18n engine, reveal, tour tabs, ROI calculator. */
(function () {
  'use strict';
  document.documentElement.classList.add('js');

  /* ---------- i18n engine (page provides window.I18N = { ar: {...} }) ---------- */
  var EN = {};
  function snapshotEN() {
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      EN[el.getAttribute('data-i18n')] = el.textContent;
    });
    document.querySelectorAll('[data-i18n-html]').forEach(function (el) {
      EN[el.getAttribute('data-i18n-html')] = el.innerHTML;
    });
  }
  function applyLang(lang) {
    var map = lang === 'ar' && window.I18N ? window.I18N.ar : EN;
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var k = el.getAttribute('data-i18n');
      if (map[k] != null) el.textContent = map[k];
    });
    document.querySelectorAll('[data-i18n-html]').forEach(function (el) {
      var k = el.getAttribute('data-i18n-html');
      if (map[k] != null) el.innerHTML = map[k];
    });
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    var b = document.getElementById('langBtn');
    if (b) b.textContent = lang === 'ar' ? 'English' : 'العربية';
    try { localStorage.setItem('lf-lang', lang); } catch (e) {}
    document.dispatchEvent(new CustomEvent('lf:lang', { detail: lang }));
  }
  window.toggleLang = function () {
    if (!(window.I18N && window.I18N.ar)) return;
    applyLang(document.documentElement.lang === 'ar' ? 'en' : 'ar');
  };
  snapshotEN();
  var saved = null;
  try { saved = localStorage.getItem('lf-lang'); } catch (e) {}
  var q = new URLSearchParams(location.search).get('lang');
  var want = q || saved || ((navigator.language || '').toLowerCase().indexOf('ar') === 0 ? 'ar' : 'en');
  if (want === 'ar' && window.I18N && window.I18N.ar) applyLang('ar');

  /* ---------- reveal on scroll (with no-JS / timeout safety) ---------- */
  var revealed = false;
  function revealAll() {
    if (revealed) return;
    revealed = true;
    document.querySelectorAll('.rv').forEach(function (el) { el.classList.add('in'); });
  }
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -5% 0px' });
    document.querySelectorAll('.rv').forEach(function (el) { io.observe(el); });
    setTimeout(revealAll, 2500);
  } else {
    revealAll();
  }

  /* ---------- product tour tabs ---------- */
  var tabs = Array.prototype.slice.call(document.querySelectorAll('.tour-tab'));
  if (tabs.length) {
    var panels = Array.prototype.slice.call(document.querySelectorAll('.tour-panel'));
    function selectTab(i) {
      tabs.forEach(function (t, j) { t.setAttribute('aria-selected', j === i ? 'true' : 'false'); });
      panels.forEach(function (p, j) { p.classList.toggle('active', j === i); });
    }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { selectTab(i); });
      t.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
          var d = e.key === 'ArrowRight' ? 1 : -1;
          if (document.documentElement.dir === 'rtl') d = -d;
          var n = (i + d + tabs.length) % tabs.length;
          tabs[n].focus(); selectTab(n);
        }
      });
    });
    selectTab(0);
  }

  /* ---------- ROI calculator ---------- */
  var calc = document.getElementById('calc');
  if (calc) {
    var elUsers = document.getElementById('calcUsers');
    var elFee = document.getElementById('calcFee');
    var yrBtns = Array.prototype.slice.call(calc.querySelectorAll('.yr-btns button'));
    var years = 3;

    function fmt(n) {
      return '$' + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }
    function recalc() {
      var users = parseInt(elUsers.value, 10) || 1;
      var fee = Math.max(0, parseFloat(elFee.value) || 0);
      var cloud = fee * users * 12 * years;
      var ar = document.documentElement.lang === 'ar';
      document.getElementById('calcUsersVal').textContent = String(users);
      document.getElementById('calcCloud').textContent = fmt(cloud);
      document.getElementById('calcYearsOut').textContent = ar
        ? 'على مدى ' + years + ' سنوات، لمصلحة مزوّد سحابي'
        : 'over ' + years + ' years — paid to a cloud vendor';
      var vs = document.getElementById('calcVs');
      if (vs) {
        vs.innerHTML = ar
          ? 'لابفلو: <b>دفعة واحدة لكل جهاز</b> — وكل ما بعدها ملك لك.'
          : 'LabFlow: <b>one payment per workstation</b> — everything after that is yours.';
      }
    }
    elUsers.addEventListener('input', recalc);
    elFee.addEventListener('input', recalc);
    yrBtns.forEach(function (b) {
      b.addEventListener('click', function () {
        years = parseInt(b.getAttribute('data-years'), 10);
        yrBtns.forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
        recalc();
      });
    });
    document.addEventListener('lf:lang', recalc);
    recalc();
  }
})();
