// Neo Consult — shared site behaviour
(function () {
  'use strict';
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;


  // ---- Load sequence: header pieces, social rail, inner-page titles (one after another) ----
  (function () {
    var i;
    var navLinks = document.querySelectorAll('.main-nav a, .hdr-apply, .menu-btn');
    for (i = 0; i < navLinks.length; i++) navLinks[i].style.setProperty('--i', i);
    var rail = document.querySelectorAll('.social-rail a, .social-rail .label');
    for (i = 0; i < rail.length; i++) rail[i].style.setProperty('--i', i);
    // children of [data-stagger] reveal in sequence
    document.querySelectorAll('[data-stagger]').forEach(function (g) {
      Array.prototype.forEach.call(g.children, function (c, k) { c.style.setProperty('--si', k); });
    });
    document.querySelectorAll('[data-stagger-deep]').forEach(function (g) {
      g.querySelectorAll(':scope > div:not(.split-media) > *').forEach(function (c, k) { c.style.setProperty('--si', k); c.classList.add('st-child'); });
    });
    requestAnimationFrame(function () { requestAnimationFrame(function () {
      document.body.classList.add('is-loaded');
      document.querySelectorAll('.pg-hero-copy[data-stagger]').forEach(function (g) { g.classList.add('in'); });
    }); });
  })();

  // Orchestrated hero load-in
  var hero = document.querySelector('.hero, .video-hero');
  if (hero) {
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { hero.classList.add('loaded'); });
    });
  }

  // Sticky header state
  var header = document.querySelector('.site-header');
  if (header) {
    var setHeaderState = function () { header.classList.toggle('is-scrolled', window.scrollY > 12); };
    setHeaderState();
    window.addEventListener('scroll', setHeaderState, { passive: true });
  }

  // Per-item stagger inside groups
  document.querySelectorAll('.grid, .timeline, .feature-row').forEach(function (group) {
    group.querySelectorAll(':scope > [data-reveal]').forEach(function (item, i) {
      if (!/\bd[1-4]\b/.test(item.className)) {
        item.style.setProperty('--reveal-delay', Math.min(i * 90, 360) + 'ms');
      }
    });
  });

  // Count-up
  function animateCount(el) {
    var target = parseInt(el.getAttribute('data-count'), 10);
    if (!target || reduceMotion) { el.textContent = target || el.textContent; return; }
    var start = performance.now(), duration = 1300;
    (function tick(now) {
      var p = Math.min((now - start) / duration, 1);
      el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(tick);
    })(start);
  }

  // ---- Overlay menu ----
  var openBtn = document.getElementById('menu-open');
  var closeBtn = document.getElementById('menu-close');
  var overlay = document.getElementById('overlay-nav');
  function openMenu() { document.body.classList.add('menu-open'); if (openBtn) openBtn.setAttribute('aria-expanded', 'true'); }
  function closeMenu() { document.body.classList.remove('menu-open'); if (openBtn) openBtn.setAttribute('aria-expanded', 'false'); }
  if (openBtn) openBtn.addEventListener('click', openMenu);
  if (closeBtn) closeBtn.addEventListener('click', closeMenu);
  if (overlay) overlay.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', closeMenu); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });

  // ---- Reveal on scroll (adds .in) ----
  var revealEls = document.querySelectorAll('[data-reveal]');
  if (revealEls.length) {
    if (reduceMotion || !('IntersectionObserver' in window)) {
      revealEls.forEach(function (el) { el.classList.add('in'); el.querySelectorAll('[data-count]').forEach(animateCount); });
    } else {
      var obs = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('in');
            entry.target.querySelectorAll('[data-count]').forEach(animateCount);
            obs.unobserve(entry.target);
          }
        });
      }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
      revealEls.forEach(function (el) { obs.observe(el); });
    }
  }

  // Count-up for standalone [data-count]
  var counters = document.querySelectorAll('[data-count]');
  if (counters.length && 'IntersectionObserver' in window && !reduceMotion) {
    var cObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { animateCount(e.target); cObs.unobserve(e.target); } });
    }, { threshold: 0.4 });
    counters.forEach(function (el) { cObs.observe(el); });
  } else {
    counters.forEach(animateCount);
  }

  // ---- Flight animation: prefer the Lottie, fall back to the animated SVG ----
  var flight = document.getElementById('flight');
  var player = document.getElementById('flight-lottie');
  if (flight && player) {
    if (reduceMotion) {
      player.remove(); // static SVG only
    } else {
      var revealLottie = function () { flight.classList.add('lottie-live'); };
      player.addEventListener('ready', revealLottie);
      player.addEventListener('load', revealLottie);
      // If the web component never upgrades (script blocked), keep the SVG.
      setTimeout(function () {
        if (!(window.customElements && customElements.get('lottie-player'))) {
          player.remove();
        }
      }, 2500);
    }
  }

  // Back to top
  var backToTop = document.querySelector('.back-to-top');
  if (backToTop) {
    window.addEventListener('scroll', function () {
      backToTop.classList.toggle('show', window.scrollY > 520);
    }, { passive: true });
    backToTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  }

  // Contact form -> Web3Forms (shows a confirmation; falls back to demo until access key is added)
  var form = document.querySelector('#contact-form');
  // arriving from Find Course: start the message with the chosen course
  (function () {
    var m = /[?&]course=([^&]+)/.exec(location.search), msg = document.getElementById('message');
    if (!m || !msg || msg.value) return;
    var course = decodeURIComponent(m[1].replace(/\+/g, ' ')).slice(0, 160);
    msg.value = 'I would like to apply for ' + course + '. ';
    var sel = document.getElementById('interest'); if (sel) sel.value = 'admissions';
  })();
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var success = document.querySelector('.form-success');
      var btn = form.querySelector('[type="submit"]');
      var keyEl = form.querySelector('input[name="access_key"]');
      var key = keyEl ? keyEl.value.trim() : '';
      var show = function (msg) {
        if (success) {
          var t = success.querySelector('span'); if (t) t.textContent = msg;
          success.classList.add('show'); success.setAttribute('role', 'status');
          success.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
        }
        if (btn) { btn.disabled = false; btn.textContent = 'Send Message'; }
      };
      // Without a working form service, never pretend the message was sent: open the visitor's email app instead
      var viaEmail = function () {
        var f = new FormData(form), lines = [];
        [['name', 'Name'], ['email', 'Email'], ['phone', 'Phone'], ['office', 'Preferred office'], ['interest', 'Interested in']].forEach(function (p) {
          var v = (f.get(p[0]) || '').toString().trim(); if (v) lines.push(p[1] + ': ' + v);
        });
        lines.push('', (f.get('message') || '').toString());
        location.href = 'mailto:info@theneoconsult.com?subject=' + encodeURIComponent('Enquiry from the Neo Consult website') + '&body=' + encodeURIComponent(lines.join('\n'));
        show('Your email app has opened with your message. Press send there and a counsellor will reply within one business day.');
      };
      if (!key || key.indexOf('YOUR_') === 0) { viaEmail(); return; }
      if (btn) { btn.disabled = true; btn.textContent = 'Sending\u2026'; }
      fetch('https://api.web3forms.com/submit', { method: 'POST', body: new FormData(form) })
        .then(function (r) { return r.json(); })
        .then(function (d) {
          if (!d || !d.success) throw new Error('not sent');
          form.reset(); show('Thanks! Your message has been sent. A counsellor will be in touch within one business day.');
        })
        .catch(viaEmail);
    });
  }


  // Testimonial carousel (auto-advance)
  var tcar = document.querySelector('.tcar');
  if (tcar) {
    var slides = tcar.querySelectorAll('.tslide');
    var dots = tcar.querySelectorAll('.tdot');
    var idx = 0, timer = null, paused = reduceMotion;
    var pauseBtn = tcar.querySelector('.tc-pause');
    slides.forEach(function (s, i) { s.setAttribute('aria-roledescription', 'slide'); s.setAttribute('aria-label', (i + 1) + ' of ' + slides.length); });
    function goTo(n) {
      slides[idx].classList.remove('active'); if (dots[idx]) dots[idx].classList.remove('active');
      idx = (n + slides.length) % slides.length;
      slides[idx].classList.add('active'); if (dots[idx]) dots[idx].classList.add('active');
    }
    function start() { if (paused || slides.length < 2) return; stop(); timer = setInterval(function () { goTo(idx + 1); }, 5500); tcar.classList.remove('is-paused'); }
    function stop() { if (timer) { clearInterval(timer); timer = null; } tcar.classList.add('is-paused'); }
    function setPaused(p) {
      paused = p;
      if (pauseBtn) { pauseBtn.setAttribute('aria-pressed', p ? 'true' : 'false'); pauseBtn.setAttribute('aria-label', p ? 'Play stories' : 'Pause stories'); }
      p ? stop() : start();
    }
    dots.forEach(function (d) { d.addEventListener('click', function () { goTo(parseInt(d.getAttribute('data-i'), 10)); start(); }); });
    var prev = tcar.querySelector('.tc-prev'), next = tcar.querySelector('.tc-next');
    if (prev) prev.addEventListener('click', function () { goTo(idx - 1); start(); });
    if (next) next.addEventListener('click', function () { goTo(idx + 1); start(); });
    if (pauseBtn) pauseBtn.addEventListener('click', function () { setPaused(!paused); });
    tcar.addEventListener('mouseenter', stop);
    tcar.addEventListener('mouseleave', start);
    tcar.addEventListener('focusin', stop);
    tcar.addEventListener('focusout', function (e) { if (!tcar.contains(e.relatedTarget)) start(); });
    // swipe on phones
    var x0 = null;
    tcar.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    tcar.addEventListener('touchend', function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0; x0 = null;
      if (Math.abs(dx) > 40) { goTo(idx + (dx < 0 ? 1 : -1)); start(); }
    }, { passive: true });
    setPaused(paused);
  }


  // ---- AI chatbot (self-contained assistant) ----
  (function () {
    var box = document.getElementById('chatbot');
    if (!box) return;
    // pages inside blog/ load main.js as ../assets/js/main.js — use the same prefix for links and images the chat creates
    var me = document.querySelector('script[src$="assets/js/main.js"]');
    var BASE = me ? me.getAttribute('src').replace(/assets\/js\/main\.js$/, '') : '';
    function rebase(el) {
      if (!BASE) return el;
      el.querySelectorAll('a[href], img[src]').forEach(function (n) {
        var attr = n.tagName === 'A' ? 'href' : 'src', v = n.getAttribute(attr);
        if (v && !/^(https?:|mailto:|tel:|#|\/|data:|\.\.\/)/.test(v)) n.setAttribute(attr, BASE + v);
      });
      return el;
    }
    var fab = document.getElementById('chat-fab');
    var closeBtn = document.getElementById('chat-close');
    var body = document.getElementById('chat-body');
    var quick = document.getElementById('chat-quick');
    var form = document.getElementById('chat-form');
    var text = document.getElementById('chat-text');
    var greeted = false;

    var KB = [
      { k: ['hello','hi ','hey','good morning','good afternoon','good evening'], a: "Hello! How can I help with your study-abroad plans today?" },
      { k: ['visa','immigration','permit'], a: "We give step-by-step visa support \u2014 documents, finances and interview prep. <a href='services.html#visa'>See visa &amp; immigration</a>." },
      { k: ['cost','fee','price','tuition','how much','budget','afford'], a: "Costs depend on the country and course. Book a free consultation and a counsellor will give you a tailored estimate. <a href='contact.html'>Book now</a>." },
      { k: ['canada'], a: "Canada is a great pick \u2014 affordable tuition compared to the US and a post-graduation work permit after you finish. Want a counsellor to shortlist schools for you? <a href='contact.html'>Book a free consultation</a>." },
      { k: [' uk ','the uk','uk?','united kingdom','britain','england','leeds','london'], a: "The UK is our most popular destination \u2014 1-year master's degrees, world-ranked universities and a post-study work route. We also have an office in Leeds for support once you land. <a href='contact.html'>Talk to a counsellor</a>." },
      { k: ['ireland','dublin'], a: "Ireland offers English-taught degrees recognised across the EU, a strong tech & pharma job market, and a stay-back visa for graduates." },
      { k: ['malta','spain','new zealand','australia','usa','united states','america'], a: "Yes, we place students there too. Tell us your course and budget and we'll shortlist the best-fit universities. <a href='contact.html'>Book a free consultation</a>." },
      { k: ['course','program','programme','degree','master','undergraduate','study what','field','nursing','business','computer','engineering','law','medicine','mba','data','accounting','public health'], a: "We help with undergraduate, master's and foundation programmes. Tell us your field and we'll shortlist options that fit. <a href='services.html'>Our services</a>." },
      { k: ['country','countries','destination','where','abroad','location to study'], a: "We place students in the UK, Ireland, Canada, Australia, the US, New Zealand, Spain and Malta. Which one are you leaning towards?" },
      { k: ['scholarship','funding','grant','sponsor'], a: "We help you find and apply for scholarships and funding that match your profile. <a href='services.html#scholarships'>Scholarship guidance</a>." },
      { k: ['ielts','toefl','sat','test','exam','english'], a: "We offer IELTS, TOEFL and SAT prep with mock tests and one-on-one feedback. <a href='services.html#test-prep'>Test preparation</a>." },
      { k: ['accommodation','housing','hostel','where to live','apartment'], a: "We help you find safe, affordable accommodation so you settle in smoothly once you arrive." },
      { k: ['contact','office','address','phone','call','email','reach','located'], a: "Reach us at info@theneoconsult.com. Offices: 2 Eden Close, Redeemer Estate, Abuja; and Park House, 24 Park Square W, Leeds. <a href='contact.html'>Contact us</a>." },
      { k: ['apply','book','consultation','get started','appointment','sign up','register'], a: "Great \u2014 let's get started. Book a free, no-obligation consultation here: <a href='contact.html'>Book a consultation</a>." },
      { k: ['thank','thanks','cheers'], a: "You're welcome! Anything else I can help with?" },
      { k: ['who are you','what are you','your name'], a: "I'm the Neo Consult assistant \u2014 here to answer quick questions about studying abroad. For detailed advice, a human counsellor is one click away. <a href='contact.html'>Book a chat</a>." }
    ];
    var FALLBACK = "I'm not certain about that one, but a counsellor can help. Book a free consultation or email info@theneoconsult.com. <a href='contact.html'>Book now</a>.";
    var AGENTS = {
      ada: { name: 'Ada', role: 'Admissions Guide', cls: 'av-ada',
        desc: 'Finds courses and countries that fit you, explains entry requirements and costs, and gets your application moving.',
        greet: "Hi, I'm Ada, Neo Consult's admissions guide. Tell me what you'd like to study, or pick a topic below.",
        quick: [['Study destinations','Which countries can I study in?'],['Courses','What courses can I study?'],['Costs','How much does it cost?'],['Book a consultation','I want to book a consultation']] },
      tobi: { name: 'Tobi', role: 'Visa & Travel Guide', cls: 'av-tobi',
        desc: 'Walks you through student visas, documents and IELTS prep, then helps you find accommodation and settle in.',
        greet: "Hi, I'm Tobi. I can help with visas, documents, IELTS and getting settled abroad. What do you need?",
        quick: [['Visa documents','Tell me about visa support'],['IELTS prep','Do you offer IELTS preparation?'],['Accommodation','Can you help with accommodation?'],['Talk to a counsellor','I want to book a consultation']] }
    };
    var agent = null;
    var headName = box.querySelector('.chat-head b');
    var headSub = box.querySelector('.chat-head small');
    var headAva = box.querySelector('.chat-ava');
    var avaDefault = headAva ? headAva.innerHTML : '';
    var backBtn = document.createElement('button');
    backBtn.type = 'button'; backBtn.className = 'chat-back'; backBtn.setAttribute('aria-label', 'Choose another assistant'); backBtn.innerHTML = '&lsaquo;';
    if (headAva) headAva.parentNode.insertBefore(backBtn, headAva);

    function scroll() { body.scrollTop = body.scrollHeight; }
    function addMsg(html, who) {
      var d = document.createElement('div');
      d.className = 'msg ' + who;
      if (who === 'user') d.textContent = html; else { d.innerHTML = html; rebase(d); }
      body.appendChild(d); scroll();
    }
    function answer(q) {
      var t = ' ' + q.toLowerCase() + ' ';
      for (var i = 0; i < KB.length; i++) {
        for (var j = 0; j < KB[i].k.length; j++) {
          if (t.indexOf(KB[i].k[j]) !== -1) return KB[i].a;
        }
      }
      return FALLBACK;
    }
    // ---- Claude-powered replies (via /api/chat), with keyword answers as a fallback ----
    var history = [];
    var aiOff = location.protocol === 'file:';
    function esc(s) { return s.replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
    function formatReply(t) {
      var lines = esc(t).split(/\n/), out = [], inList = false;
      lines.forEach(function (ln) {
        var li = ln.match(/^\s*[-*•]\s+(.*)$/);
        if (li) { if (!inList) { out.push('<ul>'); inList = true; } out.push('<li>' + li[1] + '</li>'); return; }
        if (inList) { out.push('</ul>'); inList = false; }
        if (ln.trim()) out.push('<p>' + ln + '</p>');
      });
      if (inList) out.push('</ul>');
      return out.join('')
        .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
        .replace(/\[([^\]]+)\]\(((?:https:\/\/|(?:index|about|services|contact|find-course|blog(?:\/[\w-]+)?)\.html)[^)\s]*)\)/g, function (m, label, url) {
          var ext = url.indexOf('https://') === 0;
          return '<a href="' + url + '"' + (ext ? ' target="_blank" rel="noopener"' : '') + '>' + label + '</a>';
        });
    }
    function botReply(q) {
      if (!agent) setAgent('ada', true);
      history.push({ role: 'user', content: q });
      var typ = document.createElement('div');
      typ.className = 'typing'; typ.innerHTML = '<span></span><span></span><span></span>';
      body.appendChild(typ); scroll();
      var done = function (html, raw) {
        typ.remove(); addMsg(html, 'bot');
        history.push({ role: 'assistant', content: raw });
        if (history.length > 20) history = history.slice(-20);
      };
      var fallback = function () { var a = answer(q); setTimeout(function () { done(a, a.replace(/<[^>]+>/g, '')); }, reduceMotion ? 100 : 500); };
      if (aiOff || !window.TextDecoder) return fallback();
      var ctrl = window.AbortController ? new AbortController() : null;
      var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, 45000);
      // Claude's reply streams in as newline-delimited JSON: {"type":"delta","text":...} ... {"type":"done"}
      var text = '', bubble = null;
      var paint = function () {
        if (!bubble) { typ.remove(); bubble = document.createElement('div'); bubble.className = 'msg bot streaming'; body.appendChild(bubble); }
        bubble.innerHTML = formatReply(text); rebase(bubble); scroll();
      };
      var finish = function () {
        clearTimeout(timer);
        if (bubble) bubble.classList.remove('streaming');
        history.push({ role: 'assistant', content: text });
        if (history.length > 20) history = history.slice(-20);
      };
      fetch('/api/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent: agent, messages: history }), signal: ctrl ? ctrl.signal : undefined
      }).then(function (r) {
        if (r.status === 503 || r.status === 404 || r.status === 405) aiOff = true;   // not configured / not deployed: stop trying
        if (!r.ok || !r.body) throw new Error('status ' + r.status);
        var reader = r.body.getReader(), dec = new TextDecoder(), buf = '';
        return (function pump() {
          return reader.read().then(function (res) {
            if (res.done) return;
            buf += dec.decode(res.value, { stream: true });
            var lines = buf.split('\n'); buf = lines.pop();
            lines.forEach(function (ln) {
              if (!ln.trim()) return;
              var ev; try { ev = JSON.parse(ln); } catch (e) { return; }
              if (ev.type === 'delta') { text += ev.text; paint(); }
              else if (ev.type === 'error') throw new Error(ev.error);
            });
            return pump();
          });
        })();
      }).then(function () {
        if (!text) throw new Error('empty');
        finish();
      }).catch(function () {
        if (text) {   // the stream broke part-way: keep what arrived and point to a person
          text += '\n\nThe connection dropped. For anything else, [book a free consultation](contact.html).';
          paint(); finish(); return;
        }
        clearTimeout(timer); fallback();
      });
    }
    function renderQuick() {
      quick.innerHTML = '';
      if (!agent) return;
      AGENTS[agent].quick.forEach(function (qr) {
        var b = document.createElement('button');
        b.type = 'button'; b.textContent = qr[0];
        b.addEventListener('click', function () { addMsg(qr[1], 'user'); botReply(qr[1]); });
        quick.appendChild(b);
      });
    }
    function agentCard(id) {
      var a = AGENTS[id];
      return "<button type='button' class='agent-pick' data-agent='" + id + "'><span class='agent-av " + a.cls + "'>" + a.name.charAt(0) +
        "</span><span class='agent-txt'><b>" + a.name + " <em>AI</em> <small>" + a.role + "</small></b><span>" + a.desc +
        "</span></span><span class='agent-go'>&rsaquo;</span></button>";
    }
    function showPicker() {
      agent = null; box.classList.remove('has-agent');
      if (headName) headName.textContent = 'Neo Consult';
      if (headSub) headSub.textContent = 'We usually reply instantly';
      if (headAva) headAva.innerHTML = avaDefault;
      body.innerHTML = "<div class='picker'><p class='picker-title'>Which assistant would you like to speak with?</p>" + agentCard('ada') + agentCard('tobi') + "</div>";
      quick.innerHTML = '';
      body.querySelectorAll('.agent-pick').forEach(function (b) {
        b.addEventListener('click', function () { setAgent(b.getAttribute('data-agent')); });
      });
    }
    function setAgent(id, silent) {
      agent = id; var a = AGENTS[id]; history = [];
      box.classList.add('has-agent');
      if (headName) headName.textContent = a.name + ' · ' + a.role;
      if (headSub) headSub.textContent = 'Online now';
      if (headAva) headAva.innerHTML = "<span class='agent-av sm " + a.cls + "'>" + a.name.charAt(0) + "</span>";
      body.innerHTML = '';
      if (!silent) addMsg(a.greet, 'bot');
      renderQuick();
      setTimeout(function () { text && text.focus(); }, 200);
    }
    backBtn.addEventListener('click', showPicker);
    function openChat(id) {
      document.body.classList.remove('menu-open');
      var mb = document.getElementById('menu-open'); if (mb) mb.setAttribute('aria-expanded', 'false');
      box.classList.add('open'); document.body.classList.add('chat-open');
      var t = box.querySelector('.chat-teaser'); if (t) t.classList.remove('show');
      if (id && AGENTS[id]) { if (agent !== id) setAgent(id); }
      else if (!greeted) showPicker();
      greeted = true;
    }
    function closeChat() { box.classList.remove('open'); document.body.classList.remove('chat-open'); }
    function ask(q) {
      openChat(agent || 'ada');
      setTimeout(function () { addMsg(q, 'user'); botReply(q); }, 250);
    }
    window.ncAsk = ask;
    window.ncOpenAgent = function (id) { openChat(id); };
    document.querySelectorAll('[data-agent]').forEach(function (b) {
      if (b.closest('.chatbot')) return;
      b.addEventListener('click', function () { openChat(b.getAttribute('data-agent')); });
    });

    // "Ready to apply?" teaser pill beside the chat button
    var teaser = document.createElement('button');
    teaser.type = 'button'; teaser.className = 'chat-teaser';
    teaser.innerHTML = "<img src='assets/img/nc-mark.png' alt=''><span><b>Ready to apply?</b><small>It's quick and easy</small></span><span class='x' aria-label='Dismiss'>&times;</span>";
    rebase(teaser);
    box.appendChild(teaser);
    var teaserOff = false;
    try { teaserOff = sessionStorage.getItem('ncTeaserOff') === '1'; } catch (e) {}
    if (!teaserOff) {
      var showTeaser = function () { if (!box.classList.contains('open')) teaser.classList.add('show'); };
      if (document.body.classList.contains('page-home')) {
        // on the homepage, wait until the visitor has scrolled past the video so the pill doesn't cover the hero buttons
        var onScroll = function () { if (window.scrollY > window.innerHeight * 0.6) { window.removeEventListener('scroll', onScroll); showTeaser(); } };
        window.addEventListener('scroll', onScroll, { passive: true });
      } else setTimeout(showTeaser, 2200);
    }
    teaser.addEventListener('click', function (e) {
      teaser.classList.remove('show');
      try { sessionStorage.setItem('ncTeaserOff', '1'); } catch (err) {}
      if (e.target.classList.contains('x')) return;
      openChat();
    });

    document.addEventListener('click', function (e) { if (e.target.closest && e.target.closest('[data-open-chat]')) openChat(); });
    document.querySelectorAll('[data-ask]').forEach(function (b) {
      b.addEventListener('click', function () { ask(b.getAttribute('data-ask')); });
    });
    var sForm = document.getElementById('sn-search');
    if (sForm) sForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var inp = document.getElementById('sn-search-q');
      var q = inp.value.trim(); if (!q) { inp.focus(); return; }
      inp.value = ''; ask(q);
    });
    fab.addEventListener('click', function () { box.classList.contains('open') ? closeChat() : openChat(); });
    closeBtn.addEventListener('click', closeChat);
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var q = text.value.trim(); if (!q) return;
      addMsg(q, 'user'); text.value = ''; botReply(q);
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeChat(); });
  })();


  // ---- Ocean wave dividers: ribbons that swell and flatten like water ----
  (function () {
    var els = document.querySelectorAll('[data-ocean]');
    if (!els.length) return;
    var NS = 'http://www.w3.org/2000/svg', W = 1440, N = 64;
    var ROYAL = '#3a3fc8', GOLD = '#f6c344', PERI = '#8b98ff', NAVY = '#1d1d5e';
    function rib(c, o, base, amp, k, sp, ph, th) { return { t: 'rib', c: c, o: o, base: base, amp: amp, k: k, sp: sp, ph: ph, th: th }; }
    function fill(dir, base, amp, k, sp, ph) { return { t: dir, base: base, amp: amp, k: k, sp: sp, ph: ph }; }
    var V = {
      ribbons: { h: 130, L: [rib(PERI, .7, .26, 20, 1.1, .55, 0, 44), rib(GOLD, 1, .4, 22, .8, -.45, 2.1, 40), rib(ROYAL, .9, .42, 18, 1.4, .7, 4.2, 32)] },
      'edge-top': { h: 90, L: [fill('down', .55, 16, .9, .45, .6), rib(ROYAL, .85, .5, 14, .9, .45, .6, 7), rib(GOLD, .9, .42, 12, 1.3, -.5, 2.4, 6)] },
      'edge-bot': { h: 90, L: [fill('up', .45, 16, .9, -.45, 1.4), rib(GOLD, .9, .55, 12, 1.2, .5, 3.1, 6), rib(PERI, .8, .5, 14, .8, -.4, 1.4, 8)] },
      sea: { h: 60, L: [rib(PERI, .55, .5, 12, .9, .5, 0, 5), rib(ROYAL, .85, .5, 10, 1.2, .62, 1.3, 3.2), rib(GOLD, 1, .48, 9, 1.6, -.55, 3.1, 2.6)] },
      line: { h: 70, L: [rib('#eceef7', 1, .5, 12, .9, .4, 0, 24), rib(ROYAL, .8, .5, 10, 1.1, .5, 1.2, 5), rib(GOLD, .9, .45, 9, 1.6, -.6, 3.3, 4)] }
    };
    function curve(L, H, t, x, extra) {
      var a = L.amp * (0.7 + 0.3 * Math.sin(t * 0.6 + L.ph));
      var u = x / W * Math.PI * 2;
      return H * L.base + a * Math.sin(u * L.k + t * L.sp + L.ph) + a * 0.45 * Math.sin(u * L.k * 1.9 - t * L.sp * 0.8 + L.ph * 1.7) + (extra || 0);
    }
    function build(el) {
      var v = V[el.getAttribute('data-ocean')] || V.ribbons;
      var svg = document.createElementNS(NS, 'svg');
      svg.setAttribute('viewBox', '0 0 ' + W + ' ' + v.h);
      svg.setAttribute('preserveAspectRatio', 'none');
      svg.setAttribute('aria-hidden', 'true');
      var fillColor = el.getAttribute('data-fill');
      if (!fillColor) {
        var host = el.closest('section, footer');
        fillColor = host ? getComputedStyle(host).backgroundColor : '#fff';
        if (!fillColor || fillColor === 'rgba(0, 0, 0, 0)' || fillColor === 'transparent') fillColor = '#f4f5fa';
      }
      var paths = v.L.map(function (L) {
        var p = document.createElementNS(NS, 'path');
        p.setAttribute('fill', L.t === 'rib' ? L.c : fillColor);
        if (L.o) p.setAttribute('fill-opacity', L.o);
        svg.appendChild(p); return p;
      });
      el.appendChild(svg);
      return { el: el, v: v, paths: paths, on: false };
    }
    function draw(o, t) {
      var H = o.v.h;
      o.v.L.forEach(function (L, i) {
        var d = '', x, k;
        if (L.t === 'rib') {
          var top = [], bot = [];
          for (k = 0; k <= N; k++) {
            x = k / N * W;
            var y = curve(L, H, t, x);
            var th = L.th * (0.55 + 0.45 * Math.sin(x / W * Math.PI * 2 * 0.9 + t * L.sp * 0.6 + L.ph));
            top.push(x.toFixed(1) + ' ' + y.toFixed(1)); bot.push(x.toFixed(1) + ' ' + (y + th).toFixed(1));
          }
          d = 'M' + top.join(' L') + ' L' + bot.reverse().join(' L') + ' Z';
        } else {
          var pts = [];
          for (k = 0; k <= N; k++) { x = k / N * W; pts.push(x.toFixed(1) + ' ' + curve(L, H, t, x).toFixed(1)); }
          d = L.t === 'down' ? 'M0 ' + H + ' L' + pts.join(' L') + ' L' + W + ' ' + H + ' Z'
                             : 'M0 0 L' + pts.join(' L') + ' L' + W + ' 0 Z';
        }
        o.paths[i].setAttribute('d', d);
      });
    }
    var items = Array.prototype.map.call(els, build);
    items.forEach(function (o) { draw(o, 0); });
    if (reduceMotion) return;
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) { items.forEach(function (o) { if (o.el === e.target) o.on = e.isIntersecting; }); });
      }, { rootMargin: '100px' });
      items.forEach(function (o) { io.observe(o.el); });
    } else items.forEach(function (o) { o.on = true; });
    var t0 = performance.now();
    (function loop(now) {
      var t = (now - t0) / 1000;
      for (var i = 0; i < items.length; i++) if (items[i].on) draw(items[i], t);
      requestAnimationFrame(loop);
    })(t0);
  })();


  // ---- Reading progress (header bar + back-to-top ring) and card spotlight ----
  (function () {
    var hdr = document.querySelector('.site-header');
    var btt = document.querySelector('.back-to-top');
    if (hdr && !hdr.querySelector('.scroll-prog')) { var bar = document.createElement('span'); bar.className = 'scroll-prog'; bar.setAttribute('aria-hidden', 'true'); (hdr.querySelector('.header-inner') || hdr).appendChild(bar); }
    var ticking = false;
    function upd() {
      var h = document.documentElement.scrollHeight - innerHeight;
      var sp = h > 0 ? Math.min(1, Math.max(0, scrollY / h)) : 0;
      if (hdr) hdr.style.setProperty('--sp', sp.toFixed(4));
      if (btt) btt.style.setProperty('--sp', sp.toFixed(4));
      ticking = false;
    }
    addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(upd); } }, { passive: true });
    addEventListener('resize', upd); upd();
    if (matchMedia('(hover: hover)').matches) {
      document.querySelectorAll('.solution-card, .dest-card, .agent-pick, .value-card, .cf, .mv-block, .office-card').forEach(function (el) {
        el.classList.add('spot');
        el.addEventListener('pointermove', function (e) {
          var r = el.getBoundingClientRect();
          el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
          el.style.setProperty('--my', (e.clientY - r.top) + 'px');
        });
      });
    }
  })();

  // ---- Phones: the three homepage cards become one card that loops to the next ----
  (function () {
    var row = document.querySelector('.cf-row');
    var ctl = document.querySelector('.cf-controls');
    if (!row || !ctl) return;
    var cards = Array.prototype.slice.call(row.querySelectorAll(':scope > .cf'));
    var dots = Array.prototype.slice.call(ctl.querySelectorAll('.tdot'));
    var pauseBtn = ctl.querySelector('.cf-pause');
    var mq = matchMedia('(max-width: 760px)');
    var idx = 0, timer = null, paused = reduceMotion, hover = false;
    function paint() {
      cards.forEach(function (c, i) {
        var on = mq.matches;
        if (on) c.classList.add('in');   // off-screen slides never hit the scroll observer
        c.classList.toggle('is-active', on && i === idx);
        c.classList.toggle('is-prev', on && i === (idx - 1 + cards.length) % cards.length);
        if (on) c.setAttribute('aria-hidden', i === idx ? 'false' : 'true'); else c.removeAttribute('aria-hidden');
      });
      dots.forEach(function (d, i) { d.classList.toggle('active', i === idx); });
    }
    function go(n) { idx = (n + cards.length) % cards.length; paint(); }
    function stop() { if (timer) { clearInterval(timer); timer = null; } }
    function start() { stop(); if (!paused && !hover && mq.matches) timer = setInterval(function () { go(idx + 1); }, 5500); }
    function setPaused(p) {
      paused = p;
      if (pauseBtn) { pauseBtn.setAttribute('aria-pressed', p ? 'true' : 'false'); pauseBtn.setAttribute('aria-label', p ? 'Play slides' : 'Pause slides'); }
      start();
    }
    dots.forEach(function (d, i) { d.addEventListener('click', function () { go(i); start(); }); });
    ctl.querySelector('.cf-prev').addEventListener('click', function () { go(idx - 1); start(); });
    ctl.querySelector('.cf-next').addEventListener('click', function () { go(idx + 1); start(); });
    if (pauseBtn) pauseBtn.addEventListener('click', function () { setPaused(!paused); });
    row.addEventListener('focusin', function () { hover = true; stop(); });
    row.addEventListener('focusout', function (e) { if (!row.contains(e.relatedTarget)) { hover = false; start(); } });
    var x0 = null;
    row.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    row.addEventListener('touchend', function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0; x0 = null;
      if (Math.abs(dx) > 40) { go(idx + (dx < 0 ? 1 : -1)); start(); }
    }, { passive: true });
    if (mq.addEventListener) mq.addEventListener('change', function () { paint(); start(); });
    paint(); setPaused(paused);
  })();

  // ---- Headings rise in word by word as they scroll into view ----
  (function () {
    if (reduceMotion || !('IntersectionObserver' in window)) return;
    var heads = Array.prototype.slice.call(document.querySelectorAll('main h2, .ft-cta h2')).filter(function (h) { return !h.children.length && h.textContent.trim(); });
    heads.forEach(function (h) {
      var text = h.textContent.trim();
      h.setAttribute('aria-label', text);
      h.innerHTML = text.split(/\s+/).map(function (w, i) {
        return '<span class="w" aria-hidden="true" style="--wi:' + i + '">' + w.replace(/[&<>]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]; }) + '</span>';
      }).join(' ');
      h.classList.add('sw');
    });
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('words-in'); io.unobserve(e.target); } });
    }, { threshold: 0.3 });
    heads.forEach(function (h) { io.observe(h); });
  })();

  // ---- Logo: the "n" draws itself, then the "c" (on load, when the footer appears, and on hover) ----
  (function () {
    if (reduceMotion) return;
    function draw(svg) { clearTimeout(svg._t); svg.classList.remove('nc-draw'); void svg.getBoundingClientRect(); svg.classList.add('nc-draw'); svg._t = setTimeout(function () { svg.classList.remove('nc-draw'); }, 2050); }
    document.querySelectorAll('.site-header .nc-logo').forEach(function (svg) { setTimeout(function () { draw(svg); }, 150); });
    var ov = document.querySelector('.overlay-nav .nc-logo'), mb = document.getElementById('menu-open');
    if (ov && mb) mb.addEventListener('click', function () { setTimeout(function () { draw(ov); }, 250); });
    document.querySelectorAll('.brand, .ft-brand').forEach(function (b) {
      var svg = b.querySelector('.nc-logo');
      if (svg) b.addEventListener('mouseenter', function () { draw(svg); });
    });
    var ft = document.querySelector('.ft-brand .nc-logo');
    if (ft && 'IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { draw(ft); io.disconnect(); } }, { threshold: 0.6 });
      io.observe(ft);
    }
  })();

  // ---- Titles: hero headline rises word by word; page titles cascade letter by letter ----
  (function () {
    if (reduceMotion) return;
    function esc(t) { return t.replace(/[&<>]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]; }); }
    // words (keeps child elements such as the gold "made simple." highlight together as one unit)
    function splitWords(el) {
      var i = 0, html = '';
      Array.prototype.forEach.call(el.childNodes, function (n) {
        if (n.nodeType === 3) {
          n.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            html += /^\s+$/.test(part) ? ' ' : '<span class="w" aria-hidden="true" style="--wi:' + (i++) + '">' + esc(part) + '</span>';
          });
        } else if (n.nodeType === 1) {
          n.classList.add('w'); n.style.setProperty('--wi', i++); n.setAttribute('aria-hidden', 'true');
          html += n.outerHTML;
        }
      });
      el.setAttribute('aria-label', el.textContent.replace(/\s+/g, ' ').trim());
      el.innerHTML = html; el.classList.add('sw');
    }
    function splitLetters(el) {
      var text = el.textContent.trim(), k = 0;
      el.setAttribute('aria-label', text);
      el.innerHTML = text.split(/\s+/).map(function (word) {
        return '<span class="wd" aria-hidden="true">' + Array.prototype.map.call(word, function (ch) {
          return '<span class="ch" style="--ci:' + (k++) + '">' + esc(ch) + '</span>';
        }).join('') + '</span>';
      }).join(' ');
      el.classList.add('sl');
    }
    var heroH = document.querySelector('.hv-cine h1');
    if (heroH) { splitWords(heroH); setTimeout(function () { heroH.classList.add('words-in'); }, 380); }
    document.querySelectorAll('.pg-hero-copy h1, .article-head h1').forEach(function (h) {
      if (h.children.length) return;
      splitLetters(h); setTimeout(function () { h.classList.add('letters-in'); }, 250);
    });
  })();

  // Footer year
  document.querySelectorAll('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();
