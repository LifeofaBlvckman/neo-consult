/* Find Course: course list, filters, search and the details dialog.
   To add or change a course, edit the COURSES list below. "fee" is shown as written;
   "gbp" is a rough pound figure used only by the tuition slider. */
(function () {
  'use strict';

  var COURSES = [
    { title: 'Advanced Computer Science MSc', uni: 'University of Leeds', level: 'Postgraduate', country: 'United Kingdom', city: 'Leeds', mode: 'On campus',
      intakes: 'September', entry: 'Second Class Upper (2:1) degree in computing or a related subject', fee: '£33,000 a year', gbp: 33000, length: '1 year',
      about: 'Advanced study in machine learning, cloud computing and software engineering at a Russell Group university.' },
    { title: 'Data Science MSc', uni: 'Leeds Beckett University', level: 'Postgraduate', country: 'United Kingdom', city: 'Leeds', mode: 'On campus',
      intakes: 'January, September', entry: 'Second Class Lower (2:2) degree in any numerate subject', fee: '£17,500 a year', gbp: 17500, length: '1 year',
      about: 'Learn Python, statistics and machine learning on real data sets, with a professional project to finish.' },
    { title: 'Public Health MSc', uni: 'Leeds Beckett University', level: 'Postgraduate', country: 'United Kingdom', city: 'Leeds', mode: 'On campus',
      intakes: 'January, September', entry: 'Second Class Lower (2:2) degree, health or social science preferred', fee: '£17,500 a year', gbp: 17500, length: '1 year',
      about: 'Epidemiology, health policy and health promotion for graduates who want to work in public health.' },
    { title: 'Business and Management (Top-Up) BA Hons', uni: 'Leeds Beckett University', level: 'Top-up', country: 'United Kingdom', city: 'Leeds', mode: 'On campus',
      intakes: 'January, September', entry: 'HND or equivalent in business', fee: '£17,000 a year', gbp: 17000, length: '1 year',
      about: 'Turn your HND into a full UK honours degree in one year.' },
    { title: 'International Business Management MSc', uni: 'Sheffield Hallam University', level: 'Postgraduate', country: 'United Kingdom', city: 'Sheffield', mode: 'On campus',
      intakes: 'January, September', entry: 'Second Class Lower (2:2) degree in any subject', fee: '£17,800 a year', gbp: 17800, length: '1 year',
      about: 'Strategy, marketing and finance for global business, open to graduates from any background.' },
    { title: 'Project Management MSc', uni: 'Sheffield Hallam University', level: 'Postgraduate', country: 'United Kingdom', city: 'Sheffield', mode: 'On campus',
      intakes: 'January, September', entry: 'Second Class Lower (2:2) degree or relevant work experience', fee: '£17,800 a year', gbp: 17800, length: '1 year',
      about: 'Plan, lead and deliver projects, with tools and methods used across industry.' },
    { title: 'Nursing (Adult) BSc Hons', uni: 'Sheffield Hallam University', level: 'Undergraduate', country: 'United Kingdom', city: 'Sheffield', mode: 'On campus',
      intakes: 'September', entry: 'WAEC/NECO with 5 credits plus A-levels or a foundation year', fee: '£17,000 a year', gbp: 17000, length: '3 years',
      about: 'Train as a registered adult nurse with clinical placements in NHS hospitals.' },
    { title: 'Accounting and Financial Management MSc', uni: 'University of Sheffield', level: 'Postgraduate', country: 'United Kingdom', city: 'Sheffield', mode: 'On campus',
      intakes: 'September', entry: 'Second Class Upper (2:1) degree', fee: '£31,000 a year', gbp: 31000, length: '1 year',
      about: 'Financial reporting, corporate finance and management accounting at a Russell Group university.' },
    { title: 'International Foundation Year', uni: 'University of Leeds', level: 'Foundation', country: 'United Kingdom', city: 'Leeds', mode: 'On campus',
      intakes: 'September', entry: 'WAEC/NECO with good credits, including English and Maths', fee: '£23,000 a year', gbp: 23000, length: '1 year',
      about: 'A one-year route from secondary school into a UK undergraduate degree.' },
    { title: 'Computer Programming Diploma', uni: 'Humber Polytechnic', level: 'Diploma', country: 'Canada', city: 'Toronto', mode: 'On campus',
      intakes: 'January, May, September', entry: 'WAEC/NECO with credits in English and Maths', fee: 'CA$19,000 a year', gbp: 10500, length: '2 years',
      about: 'Hands-on programming, databases and web development, with a route to a post-graduation work permit.' },
    { title: 'Master of Engineering (MEng)', uni: 'University of Windsor', level: 'Postgraduate', country: 'Canada', city: 'Windsor', mode: 'On campus',
      intakes: 'January, May, September', entry: 'Second Class Upper (2:1) engineering degree', fee: 'CA$40,000 in total', gbp: 22000, length: '1 to 2 years',
      about: 'Course-based engineering master\'s in civil, electrical, mechanical and other fields.' },
    { title: 'Business Administration MBA', uni: 'University of Windsor', level: 'Postgraduate', country: 'Canada', city: 'Windsor', mode: 'On campus',
      intakes: 'September', entry: 'Second Class Lower (2:2) degree; work experience helps', fee: 'CA$45,000 in total', gbp: 25000, length: '1 to 2 years',
      about: 'A practical MBA with co-op options for graduates aiming at management roles.' }
  ];

  var list = document.getElementById('fc-list');
  if (!list) return;
  var form = document.getElementById('fc-filters'), search = document.getElementById('fc-search');
  var count = document.getElementById('fc-count'), empty = document.getElementById('fc-empty');
  var minR = document.getElementById('fc-min'), maxR = document.getElementById('fc-max');
  var minO = document.getElementById('fc-min-out'), maxO = document.getElementById('fc-max-out'), track = document.getElementById('fc-track');
  var dlg = document.getElementById('fc-dialog');

  function esc(t) { return String(t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function uniq(key) { return COURSES.map(function (c) { return c[key]; }).filter(function (v, i, a) { return a.indexOf(v) === i; }).sort(); }
  var FLAG = { 'United Kingdom': '🇬🇧', 'Canada': '🇨🇦' };

  // filter groups
  [['level', 'Study level'], ['country', 'Study destination'], ['mode', 'Study mode'], ['city', 'City'], ['uni', 'Institution']].forEach(function (g) {
    var box = form.querySelector('[data-group="' + g[0] + '"]');
    if (!box) return;
    box.innerHTML = uniq(g[0]).map(function (v) {
      return '<label class="fc-check"><input type="checkbox" name="' + g[0] + '" value="' + esc(v) + '"><span class="fc-box" aria-hidden="true"></span>' +
        (g[0] === 'country' && FLAG[v] ? '<span aria-hidden="true">' + FLAG[v] + '</span> ' : '') + esc(v) + '</label>';
    }).join('');
  });

  // tuition slider bounds
  var lo = Math.floor(Math.min.apply(null, COURSES.map(function (c) { return c.gbp; })) / 500) * 500;
  var hi = Math.ceil(Math.max.apply(null, COURSES.map(function (c) { return c.gbp; })) / 500) * 500;
  [minR, maxR].forEach(function (r) { r.min = lo; r.max = hi; r.step = 500; });
  minR.value = lo; maxR.value = hi;
  function money(n) { return '£' + Number(n).toLocaleString('en-GB'); }

  var ICON = {
    level: '<path d="M2 9 12 4l10 5-10 5Z"/><path d="M6 11v5c3 2.5 9 2.5 12 0v-5"/>',
    place: '<path d="M12 22s7-6.1 7-12a7 7 0 1 0-14 0c0 5.9 7 12 7 12Z"/><circle cx="12" cy="10" r="2.5"/>',
    cal: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    check: '<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>',
    fee: '<path d="M16 6.5A4.5 4.5 0 0 0 8.5 9v3H6m2.5 0V15c0 2-1 3-2.5 4h11"/><path d="M6 12h7"/>'
  };
  function ic(n) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICON[n] + '</svg>'; }

  function card(c, i) {
    return '<article class="fc-card" style="--i:' + (i % 6) + '">' +
      '<h3>' + esc(c.title) + '</h3><p class="fc-uni">' + esc(c.uni) + '</p>' +
      '<ul class="fc-meta">' +
      '<li>' + ic('level') + esc(c.level) + '</li>' +
      '<li>' + ic('place') + esc(c.city + ', ' + c.country) + '</li>' +
      '<li>' + ic('cal') + esc(c.intakes) + '</li>' +
      '<li>' + ic('check') + esc(c.entry) + '</li>' +
      '<li class="fc-fee">' + ic('fee') + esc(c.fee) + '</li></ul>' +
      '<button type="button" class="fc-btn" data-course="' + COURSES.indexOf(c) + '">View details</button></article>';
  }

  function render() {
    var q = (search.value || '').trim().toLowerCase(), picked = {};
    Array.prototype.forEach.call(form.querySelectorAll('input[type=checkbox]:checked'), function (b) { (picked[b.name] = picked[b.name] || []).push(b.value); });
    var a = Math.min(+minR.value, +maxR.value), b = Math.max(+minR.value, +maxR.value);
    var rows = COURSES.filter(function (c) {
      for (var k in picked) if (picked[k].indexOf(c[k]) < 0) return false;
      if (c.gbp < a || c.gbp > b) return false;
      return !q || [c.title, c.uni, c.city, c.country, c.level].join(' ').toLowerCase().indexOf(q) >= 0;
    });
    list.innerHTML = rows.map(card).join('');
    empty.hidden = rows.length > 0;
    count.textContent = rows.length + (rows.length === 1 ? ' course' : ' courses');
    minO.textContent = money(a); maxO.textContent = money(b);
    track.style.setProperty('--a', ((a - lo) / (hi - lo) * 100) + '%');
    track.style.setProperty('--b', ((b - lo) / (hi - lo) * 100) + '%');
  }

  form.addEventListener('change', render);
  form.addEventListener('input', render);
  search.addEventListener('input', render);
  document.getElementById('fc-search-form').addEventListener('submit', function (e) { e.preventDefault(); render(); });
  document.getElementById('fc-reset').addEventListener('click', function () {
    form.reset(); search.value = ''; minR.value = lo; maxR.value = hi; render();
  });
  var tog = document.getElementById('fc-filter-toggle');
  if (tog) tog.addEventListener('click', function () {
    var open = form.classList.toggle('open'); tog.setAttribute('aria-expanded', open);
  });

  // details dialog
  list.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-course]');
    if (!btn) return;
    var c = COURSES[+btn.getAttribute('data-course')];
    dlg.querySelector('.fcd-body').innerHTML =
      '<p class="fc-uni">' + esc(c.uni) + '</p><h2 id="fcd-title">' + esc(c.title) + '</h2><p class="fcd-about">' + esc(c.about) + '</p>' +
      '<dl class="fcd-grid">' +
      '<div><dt>Study level</dt><dd>' + esc(c.level) + '</dd></div><div><dt>Length</dt><dd>' + esc(c.length) + '</dd></div>' +
      '<div><dt>Location</dt><dd>' + esc(c.city + ', ' + c.country) + '</dd></div><div><dt>Intakes</dt><dd>' + esc(c.intakes) + '</dd></div>' +
      '<div><dt>Entry requirements</dt><dd>' + esc(c.entry) + '</dd></div><div><dt>Tuition (approx.)</dt><dd>' + esc(c.fee) + '</dd></div></dl>' +
      '<p class="fcd-note">Fees and entry requirements change every year. Your counsellor will confirm the latest figures with the university before you apply.</p>' +
      '<div class="fcd-actions"><a class="btn btn-navy btn-uc" href="contact.html?course=' + encodeURIComponent(c.title + ' – ' + c.uni) + '">Apply for this course</a>' +
      '<button type="button" class="fcd-chat" data-open-chat>Ask our AI about it</button></div>';
    if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', '');
  });
  dlg.addEventListener('click', function (e) {
    if (e.target === dlg || e.target.closest('.fcd-close') || e.target.closest('[data-open-chat]')) dlg.close ? dlg.close() : dlg.removeAttribute('open');
  });

  // offices: switch the map between Abuja and Leeds
  var map = document.getElementById('fc-map');
  Array.prototype.forEach.call(document.querySelectorAll('.fc-office'), function (b, _, all) {
    b.addEventListener('click', function () {
      Array.prototype.forEach.call(document.querySelectorAll('.fc-office'), function (o) { o.classList.toggle('active', o === b); o.setAttribute('aria-pressed', o === b); });
      map.src = 'https://maps.google.com/maps?q=' + encodeURIComponent(b.getAttribute('data-map')) + '&z=14&output=embed';
      map.title = 'Map of ' + b.querySelector('b').textContent.replace('Neo Consult – ', 'our ') + ' office';
    });
  });

  render();
})();
