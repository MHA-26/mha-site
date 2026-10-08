(function () {
  'use strict';

  const root = document.documentElement;
  root.classList.add('js');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function toast(message) {
    let el = document.querySelector('.toast');
    if (!el) {
      el = document.createElement('div');
      el.className = 'toast';
      el.setAttribute('role', 'status');
      document.body.appendChild(el);
    }
    el.textContent = message;
    el.classList.add('is-visible');
    clearTimeout(el._t);
    el._t = setTimeout(() => el.classList.remove('is-visible'), 2200);
  }

  // ---------- Header ----------
  const header = document.querySelector('.site-header');
  const mobileHelp = document.querySelector('.mobile-help');
  const hero = document.querySelector('.hero');
  function onScroll() {
    const y = window.scrollY;
    header && header.classList.toggle('is-scrolled', y > 8);
    if (mobileHelp) mobileHelp.classList.toggle('is-visible', y > (hero ? hero.offsetHeight * 0.6 : 240));
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Mobile nav
  const nav = document.getElementById('mainNav');
  const menuBtn = document.getElementById('menuToggle');
  function setNav(open) {
    nav.classList.toggle('is-open', open);
    document.body.classList.toggle('nav-open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  }
  if (nav && menuBtn) {
    menuBtn.addEventListener('click', () => setNav(!nav.classList.contains('is-open')));
    nav.addEventListener('click', (e) => { if (e.target.closest('a')) setNav(false); });
    document.addEventListener('click', (e) => {
      if (document.body.classList.contains('nav-open') && !nav.contains(e.target) && !menuBtn.contains(e.target)) setNav(false);
    });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && nav.classList.contains('is-open')) { setNav(false); menuBtn.focus(); } });
  }

  // Dropdown
  document.querySelectorAll('.has-sub').forEach((item) => {
    const btn = item.querySelector('.nav-sub-toggle');
    function set(open) { item.classList.toggle('is-open', open); btn.setAttribute('aria-expanded', String(open)); }
    btn.addEventListener('click', (e) => { e.stopPropagation(); set(!item.classList.contains('is-open')); });
    document.addEventListener('click', (e) => { if (!item.contains(e.target)) set(false); });
    item.addEventListener('keydown', (e) => { if (e.key === 'Escape' && item.classList.contains('is-open')) { e.stopPropagation(); set(false); btn.focus(); } });
    item.querySelectorAll('.sub-menu a').forEach((a) => a.addEventListener('click', () => set(false)));
  });

  // ---------- Mood check-in ----------
  const moods = {
    good: {
      title: 'Glad to hear it.',
      text: 'Feeling good is worth protecting. Keep up the things that help: sleep, movement, time with people you trust. And check in on a friend today.',
      actions: [['#myths', 'Learn to spot the signs in others', 'btn-soft']]
    },
    okay: {
      title: 'Okay is a fine place to be.',
      text: 'A short pause can help you notice what you need. Try one minute of slow breathing.',
      actions: [['#breathe', 'Try a breathing exercise', 'btn-primary']]
    },
    stressed: {
      title: 'Stress is heavy. Let’s lighten it a little.',
      text: 'Slow breathing calms your body’s stress response. If stress has been building for weeks, talking to someone can really help.',
      actions: [['#breathe', 'Breathe with us', 'btn-primary'], ['tel:0800678678', 'Call 0800 678 678', 'btn-soft']]
    },
    low: {
      title: 'Thank you for being honest about how you feel.',
      text: 'Feeling low for a while is common, and support works. You don’t have to wait until things get worse to reach out. Our helpline is there for you, any time.',
      actions: [['tel:0800678678', 'Talk to someone now', 'btn-primary'], ['#facilities', 'Find a facility near you', 'btn-soft']]
    },
    crisis: {
      urgent: true,
      title: 'Your safety matters. Please reach out now.',
      text: 'If you are in immediate danger, call 112 or go to the nearest hospital emergency unit. You can also call our helpline right now and talk to someone who will listen.',
      actions: [['tel:112', 'Call 112', 'btn-danger'], ['tel:0800678678', 'Call 0800 678 678', 'btn-primary']]
    }
  };
  const moodButtons = document.querySelectorAll('.mood');
  const moodResult = document.getElementById('moodResult');
  function escapeHtml(s) { return s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
  moodButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      moodButtons.forEach((b) => b.setAttribute('aria-checked', String(b === btn)));
      const m = moods[btn.dataset.mood];
      const actions = m.actions.map(([href, label, cls]) => `<a class="btn ${cls}" href="${href}">${escapeHtml(label)}</a>`).join('');
      moodResult.innerHTML = `<div class="mood-answer${m.urgent ? ' is-urgent' : ''}"><h3>${escapeHtml(m.title)}</h3><p>${escapeHtml(m.text)}</p><div class="actions">${actions}</div></div>`;
    });
  });
  // Arrow-key navigation for the radiogroup
  const moodGroup = document.querySelector('.mood-options');
  moodGroup && moodGroup.addEventListener('keydown', (e) => {
    if (!['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp'].includes(e.key)) return;
    e.preventDefault();
    const list = Array.from(moodButtons);
    const i = list.indexOf(document.activeElement);
    const next = list[(i + (e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : -1) + list.length) % list.length];
    next.focus();
    next.click();
  });

  // ---------- Breathing exercise ----------
  const orb = document.getElementById('breatheOrb');
  const phaseEl = document.getElementById('breathePhase');
  const countEl = document.getElementById('breatheCount');
  const roundsEl = document.getElementById('breatheRounds');
  const statusEl = document.getElementById('breatheStatus');
  const toggle = document.getElementById('breatheToggle');
  const phases = [['Breathe in', true], ['Hold', true], ['Breathe out', false], ['Hold', false]];
  let timer = null, phase = 0, count = 4, rounds = 0;

  function renderPhase() {
    const [label, expanded] = phases[phase];
    phaseEl.textContent = label;
    countEl.textContent = count;
    orb.classList.toggle('is-in', expanded);
    if (count === 4) statusEl.textContent = label;
  }
  function tick() {
    count -= 1;
    if (count === 0) {
      phase = (phase + 1) % phases.length;
      count = 4;
      if (phase === 0) {
        rounds += 1;
        roundsEl.textContent = rounds + (rounds === 1 ? ' breath' : ' breaths');
      }
    }
    renderPhase();
  }
  function stopBreathing() {
    clearInterval(timer); timer = null;
    phase = 0; count = 4;
    orb.classList.remove('is-in');
    phaseEl.textContent = 'Ready'; countEl.textContent = '4';
    toggle.setAttribute('aria-pressed', 'false');
    toggle.innerHTML = '<i class="fa-solid fa-play" aria-hidden="true"></i> <span>Start</span>';
  }
  toggle && toggle.addEventListener('click', () => {
    if (timer) { stopBreathing(); statusEl.textContent = 'Stopped'; return; }
    rounds = 0; roundsEl.textContent = '0 breaths';
    phase = 0; count = 4; renderPhase();
    timer = setInterval(tick, 1000);
    toggle.setAttribute('aria-pressed', 'true');
    toggle.innerHTML = '<i class="fa-solid fa-pause" aria-hidden="true"></i> <span>Stop</span>';
  });

  // ---------- Myth / fact cards ----------
  document.querySelectorAll('.flip').forEach((card) => {
    card.addEventListener('click', () => card.setAttribute('aria-pressed', String(card.getAttribute('aria-pressed') !== 'true')));
  });

  // ---------- Count-up stats ----------
  const fmt = new Intl.NumberFormat('en-GH');
  function countUp(el) {
    const target = Number(el.dataset.count);
    if (reduceMotion) { el.textContent = fmt.format(target); return; }
    const duration = 1600;
    const start = performance.now();
    (function frame(now) {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 4);
      el.textContent = fmt.format(Math.round(target * eased));
      if (p < 1) requestAnimationFrame(frame);
    })(start);
  }

  // ---------- Reveal on scroll ----------
  const revealEls = document.querySelectorAll('.reveal');
  const counters = document.querySelectorAll('[data-count]');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach((el, i) => {
      el.style.transitionDelay = (i % 4) * 70 + 'ms';
      io.observe(el);
    });

    const co = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        countUp(entry.target);
        co.unobserve(entry.target);
      });
    }, { threshold: 0.6 });
    counters.forEach((el) => co.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('is-in'));
    counters.forEach((el) => { el.textContent = fmt.format(Number(el.dataset.count)); });
  }

  // ---------- Partner marquee (duplicate for seamless loop) ----------
  const track = document.querySelector('.marquee-track');
  if (track) {
    Array.from(track.children).forEach((li) => {
      const clone = li.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      clone.querySelector('img').alt = '';
      track.appendChild(clone);
    });
  }

  // ---------- Copy buttons ----------
  document.querySelectorAll('[data-copy]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(btn.dataset.copy);
        toast('Copied ' + btn.dataset.copy);
      } catch (e) {
        toast('Dial ' + btn.dataset.copy);
      }
    });
  });

  // ---------- Donation dialog ----------
  const dialog = document.getElementById('donateDialog');
  const openDonate = document.getElementById('openDonate');
  if (dialog && openDonate && typeof dialog.showModal === 'function') {
    openDonate.addEventListener('click', () => dialog.showModal());
    dialog.addEventListener('click', (e) => {
      if (e.target === dialog || e.target.closest('[data-close]')) dialog.close();
    });
  }

  // ---------- Resource library filters ----------
  const docGrid = document.getElementById('docGrid');
  if (docGrid) {
    const docs = Array.from(docGrid.querySelectorAll('.doc'));
    const filters = document.querySelectorAll('.filter');
    const search = document.getElementById('docSearch');
    const empty = document.getElementById('docEmpty');
    let active = 'all';
    function applyFilters() {
      const q = search.value.trim().toLowerCase();
      let shown = 0;
      docs.forEach((doc) => {
        const match = (active === 'all' || doc.dataset.category === active) && doc.textContent.toLowerCase().includes(q);
        doc.hidden = !match;
        if (match) shown += 1;
      });
      empty.hidden = shown > 0;
    }
    filters.forEach((btn) => {
      btn.addEventListener('click', () => {
        active = btn.dataset.filter;
        filters.forEach((b) => {
          b.classList.toggle('is-active', b === btn);
          b.setAttribute('aria-pressed', String(b === btn));
        });
        applyFilters();
      });
    });
    search.addEventListener('input', applyFilters);
  }

  // ---------- Helpline impact report ----------
  const impactData = document.getElementById('impactData');
  if (impactData) {
    let data = {};
    try { data = JSON.parse(impactData.textContent); } catch (e) { /* keep empty */ }

    const kpiGrid = document.getElementById('kpiGrid');
    kpiGrid.innerHTML = (data.kpis || []).map((k) => {
      const has = typeof k.value === 'number';
      return `<div class="kpi"><i class="fa-solid ${escapeHtml(k.icon || 'fa-chart-simple')}" aria-hidden="true"></i>` +
        `<span class="kpi-value${has ? '' : ' is-pending'}"${has ? ` data-count="${k.value}"` : ''}>${has ? '0' : '—'}</span>` +
        `<span class="kpi-label">${escapeHtml(k.label)}</span></div>`;
    }).join('');

    // Horizontal percentage bars
    function hbars(id, items) {
      const el = document.getElementById(id);
      if (!el || !items || !items.length) return;
      const max = Math.max(...items.map((i) => i.pct));
      el.innerHTML = items.map((i) => `<div class="hbar"><span class="hbar-label">${escapeHtml(i.label)}</span>` +
        `<span class="hbar-track"><span class="hbar-fill" data-w="${Math.round((i.pct / max) * 100)}"></span></span>` +
        `<span class="hbar-val">${i.pct}%</span></div>`).join('');
    }
    hbars('reasonBars', data.reasons);
    hbars('ageBars', data.age);

    const split = document.getElementById('sexSplit');
    if (split && data.sex) {
      split.innerHTML = `<div class="split-bar">${data.sex.map((s, n) => `<span class="split-seg split-${n}" style="flex:${s.pct}"></span>`).join('')}</div>` +
        `<div class="split-legend">${data.sex.map((s, n) => `<span><i class="split-dot split-${n}"></i>${escapeHtml(s.label)} <strong>${s.pct}%</strong></span>`).join('')}</div>`;
    }

    const chart = document.getElementById('trendChart');
    const years = (data.byYear || []).filter((d) => typeof d.contacts === 'number');
    if (!years.length) {
      chart.classList.add('is-empty');
      chart.textContent = 'Yearly figures will appear here once the call-centre data is added.';
    } else {
      const max = Math.max(...years.map((d) => d.contacts));
      chart.setAttribute('aria-label', 'Helpline contacts by year: ' + years.map((d) => d.year + ', ' + fmt.format(d.contacts)).join('; '));
      chart.innerHTML = years.map((d) => `<div class="bar"><span class="bar-val">${fmt.format(d.contacts)}</span>` +
        `<span class="bar-fill" data-h="${Math.max(2, Math.round((d.contacts / max) * 78))}"></span>` +
        `<span class="bar-year">${escapeHtml(String(d.year))}</span></div>`).join('');
    }

    // Animate counters and bars when the section scrolls into view
    const section = document.getElementById('impact');
    let played = false;
    function play() {
      if (played) return;
      played = true;
      kpiGrid.querySelectorAll('[data-count]').forEach((el) => countUp(el));
      section.querySelectorAll('.bar-fill').forEach((b) => { b.style.height = b.dataset.h + '%'; });
      section.querySelectorAll('.hbar-fill').forEach((b) => { b.style.width = b.dataset.w + '%'; });
    }
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        if (entries.some((e) => e.isIntersecting)) { play(); io.disconnect(); }
      }, { threshold: 0.15 });
      io.observe(section);
    } else {
      play();
    }
  }

  // ---------- Research: review-level checker ----------
  const checker = document.getElementById('irbChecker');
  if (checker) {
    const out = document.getElementById('checkerResult');
    const sets = Array.from(checker.querySelectorAll('fieldset'));
    const RESULTS = {
      none: ['out-none', 'fa-circle-info', 'MHA-IRB review is probably not needed',
        'Your study does not seem to involve MHA institutions, service users, staff or their data. Apply to the ethics committee responsible for your study site. If you are unsure, contact the Secretariat.'],
      full: ['out-full', 'fa-users', 'Likely: full-board review',
        'Your study involves vulnerable participants, an intervention or sensitive topics, so it will usually be reviewed at a monthly board meeting.'],
      expedited: ['out-exp', 'fa-bolt', 'Likely: expedited review',
        'Your study appears to be minimal risk. Experienced members may review it without a full meeting, with a target of 3 weeks.'],
      exempt: ['out-exempt', 'fa-file-circle-check', 'Possibly exempt',
        'Your study may qualify for exemption, but you must still apply. The board makes the final decision, usually within 10 working days.']
    };
    function value(name) {
      const el = checker.querySelector(`input[name="${name}"]:checked`);
      return el ? el.value : null;
    }
    function update() {
      const q1 = value('q1');
      sets.slice(1).forEach((f) => f.classList.toggle('is-skipped', q1 === 'no'));
      let key = null;
      if (q1 === 'no') key = 'none';
      else if (q1 === 'yes') {
        const q2 = value('q2'); const q3 = value('q3'); const q4 = value('q4');
        if (q2 === 'yes' || q3 === 'yes') key = 'full';
        else if (q2 === 'no' && q3 === 'no' && q4) key = q4 === 'yes' ? 'exempt' : 'expedited';
      }
      if (!key) {
        out.innerHTML = '<p class="checker-hint">Answer the questions to see a result.</p>';
        return;
      }
      const [cls, icon, title, text] = RESULTS[key];
      out.innerHTML = `<div class="checker-out ${cls}"><h3><i class="fa-solid ${icon}" aria-hidden="true"></i> ${title}</h3><p>${text}</p></div>`;
    }
    checker.addEventListener('change', update);
    checker.addEventListener('submit', (e) => e.preventDefault());
  }

  // ---------- Research: submission checklist (saved on this device only) ----------
  const checklist = document.getElementById('submitChecklist');
  if (checklist) {
    const boxes = Array.from(checklist.querySelectorAll('input[type="checkbox"]'));
    const bar = document.getElementById('checklistBar');
    const text = document.getElementById('checklistText');
    const KEY = 'mha-irb-checklist';
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) || '[]');
      boxes.forEach((b, i) => { b.checked = !!saved[i]; });
    } catch (e) { /* storage unavailable */ }
    function render() {
      const done = boxes.filter((b) => b.checked).length;
      bar.style.width = (done / boxes.length) * 100 + '%';
      text.textContent = `${done} of ${boxes.length} ready`;
      try { localStorage.setItem(KEY, JSON.stringify(boxes.map((b) => b.checked))); } catch (e) { /* ignore */ }
    }
    checklist.addEventListener('change', render);
    render();
  }

  // ---------- Dated event cards: hide once the event has passed ----------
  document.querySelectorAll('[data-end]').forEach((card) => {
    if (new Date() >= new Date(card.dataset.end + 'T00:00:00')) card.closest('.wmhd-wrap').hidden = true;
  });

  // ---------- Google Analytics: key actions (no mood or checker answers are sent) ----------
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href]');
    if (!a || typeof window.gtag !== 'function') return;
    const href = a.getAttribute('href') || '';
    let name = null;
    if (href.startsWith('tel:')) name = 'call_click';
    else if (href.startsWith('mailto:')) name = 'email_click';
    else if (/wa\.me|whatsapp/i.test(href)) name = 'whatsapp_click';
    else if (/zoom\.us/i.test(href)) name = 'join_lecture_click';
    else if (/\.pdf($|\?)/i.test(href)) name = 'file_download_click';
    else if (/linkedin|facebook|instagram|youtube|x\.com|twitter|tiktok/i.test(href)) name = 'social_click';
    if (!name) return;
    window.gtag('event', name, {
      link_url: href.startsWith('tel:') ? href.slice(4) : href.split('?')[0],
      link_text: (a.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 100),
      // Never attribute clicks to the private mood check-in
      page_section: a.closest('#checkin') ? '' : ((a.closest('[id]') || {}).id || '')
    });
  });

  // ---------- Volunteer page: activity filters ----------
  const actList = document.getElementById('activityList');
  if (actList) {
    const acts = Array.from(actList.querySelectorAll('.act'));
    const actFilters = document.querySelectorAll('[data-act-filter]');
    const actEmpty = document.getElementById('actEmpty');
    actFilters.forEach((btn) => {
      btn.addEventListener('click', () => {
        const type = btn.dataset.actFilter;
        actFilters.forEach((b) => {
          b.classList.toggle('is-active', b === btn);
          b.setAttribute('aria-pressed', String(b === btn));
        });
        let shown = 0;
        acts.forEach((a) => {
          const show = type === 'all' || a.dataset.actType === type;
          a.hidden = !show;
          if (show) shown += 1;
        });
        actEmpty.hidden = shown > 0;
      });
    });
  }

  // ---------- Volunteer page: registration (Google Form) ----------
  const vForm = document.getElementById('volunteerForm');
  if (vForm) {
    const formUrl = (vForm.dataset.formUrl || '').trim();
    const entry = (vForm.dataset.activityEntry || '').trim();
    const formLink = (activity, embedded) => {
      const u = new URL(formUrl);
      if (embedded) u.searchParams.set('embedded', 'true');
      if (activity && entry) u.searchParams.set(entry, activity);
      return u.toString();
    };
    if (formUrl) {
      vForm.innerHTML = '<p class="vl-form-chosen" id="formChosen" hidden></p>' +
        `<iframe id="formFrame" src="${formLink('', true)}" title="Volunteer registration form" loading="lazy">Loading…</iframe>` +
        `<a class="vl-form-open" id="formOpen" href="${formLink('', false)}" target="_blank" rel="noopener">Open the form in a new tab <i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i></a>`;
    }
    document.querySelectorAll('[data-volunteer-for]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const activity = btn.dataset.volunteerFor;
        const option = btn.dataset.formOption || '';
        if (formUrl) {
          document.getElementById('formFrame').src = formLink(option, true);
          document.getElementById('formOpen').href = formLink(option, false);
          const chosen = document.getElementById('formChosen');
          chosen.textContent = option
            ? 'Volunteering for: ' + activity + ' (selected in the form below)'
            : 'Volunteering for: ' + activity + '. Please tick the closest activity in the form below.';
          chosen.hidden = false;
        } else {
          const mailBtn = document.getElementById('formSoonMail');
          mailBtn.href = 'mailto:info@mha.gov.gh?subject=' + encodeURIComponent('Volunteer pool: ' + activity);
          mailBtn.textContent = 'Email us to volunteer for ' + activity;
        }
        // Activity name only; no personal details are sent to analytics
        if (typeof window.gtag === 'function') window.gtag('event', 'volunteer_interest', { activity: activity });
        document.getElementById('register').scrollIntoView({ behavior: 'smooth' });
      });
    });
  }

  // ---------- Web chat (Chatwoot) ----------
  // Fill these in from Chatwoot: Settings → Inboxes → (website inbox) → Configuration.
  // baseUrl = your Chatwoot address (e.g. https://chat.mha.gov.gh or https://app.chatwoot.com)
  const CHAT = { baseUrl: '', websiteToken: '' };
  const chatReady = !!(CHAT.baseUrl && CHAT.websiteToken);
  const ACTIVE_KEY = 'mha-chat-active';

  function sessionGet(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } }
  function sessionSet(k, v) { try { if (v === null) sessionStorage.removeItem(k); else sessionStorage.setItem(k, v); } catch (e) { /* ignore */ } }
  function clearChatTraces() {
    // Remove Chatwoot's conversation cookie and any stored widget data from this browser
    document.cookie.split(';').forEach((c) => {
      const name = c.split('=')[0].trim();
      if (/^cw_/.test(name)) document.cookie = name + '=; Max-Age=0; path=/';
    });
    try { Object.keys(localStorage).filter((k) => /^cw_|chatwoot/i.test(k)).forEach((k) => localStorage.removeItem(k)); } catch (e) { /* ignore */ }
    sessionSet(ACTIVE_KEY, null);
  }
  // A chat from an earlier visit leaves nothing behind unless it is still in progress in this tab
  if (!sessionGet(ACTIVE_KEY)) clearChatTraces();

  const chatUi = document.createElement('div');
  chatUi.innerHTML = `
    <button type="button" class="chat-launcher" data-open-chat aria-haspopup="dialog" aria-controls="chatPanel">
      <i class="fa-solid fa-comment-dots" aria-hidden="true"></i> <span>Chat with us</span>
    </button>
    <div class="chat-panel" id="chatPanel" role="dialog" aria-labelledby="chatTitle" hidden>
      <div class="chat-head">
        <span class="chat-avatar" aria-hidden="true"><i class="fa-solid fa-headset"></i></span>
        <div><p class="chat-title" id="chatTitle">Chat with the helpline</p><p class="chat-sub">Private and confidential</p></div>
        <button type="button" class="chat-x" data-close-chat aria-label="Close">×</button>
      </div>
      <div class="chat-body">
        <ul class="chat-points">
          <li><i class="fa-solid fa-user-secret" aria-hidden="true"></i> You don’t have to give your name.</li>
          <li><i class="fa-solid fa-mobile-screen" aria-hidden="true"></i> Nothing is saved to your phone’s calls or WhatsApp. When you end the chat, it is cleared from this browser.</li>
          <li><i class="fa-solid fa-user-nurse" aria-hidden="true"></i> Only the Mental Health Authority’s helpline team reads your messages.</li>
          <li><i class="fa-solid fa-eye-slash" aria-hidden="true"></i> For extra privacy, use a private or incognito browser window.</li>
        </ul>
        <p class="chat-danger"><i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i> In immediate danger? Call <a href="tel:0800678678">0800 678 678</a> now or go to the nearest hospital.</p>
        ${chatReady
          ? '<button type="button" class="btn btn-primary chat-start" data-start-chat>Start chat <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></button>'
          : '<p class="chat-soon"><span class="status-pill"><span class="status-dot" aria-hidden="true"></span> Web chat launching soon</span></p>' +
            '<div class="chat-alt"><a class="btn btn-primary" href="tel:0800678678"><i class="fa-solid fa-phone" aria-hidden="true"></i> Call helpline</a>' +
            '<a class="btn btn-soft" href="https://wa.me/233549045216" target="_blank" rel="noopener noreferrer"><i class="fa-brands fa-whatsapp" aria-hidden="true"></i> WhatsApp</a></div>'}
      </div>
    </div>
    <div class="chat-controls" id="chatControls" hidden>
      <button type="button" class="chat-ctrl" data-end-chat><i class="fa-solid fa-broom" aria-hidden="true"></i> End chat &amp; clear</button>
      <button type="button" class="chat-ctrl chat-ctrl-exit" data-exit-chat><i class="fa-solid fa-arrow-right-from-bracket" aria-hidden="true"></i> Leave quickly</button>
    </div>`;
  document.body.appendChild(chatUi);

  const chatPanel = document.getElementById('chatPanel');
  const chatControls = document.getElementById('chatControls');
  let chatLoading = null;

  function loadChatwoot() {
    if (chatLoading) return chatLoading;
    chatLoading = new Promise((resolve, reject) => {
      window.chatwootSettings = { hideMessageBubble: true, position: 'right', locale: 'en', type: 'standard', darkMode: 'light' };
      window.addEventListener('chatwoot:ready', () => resolve(), { once: true });
      const s = document.createElement('script');
      s.src = CHAT.baseUrl.replace(/\/$/, '') + '/packs/js/sdk.js';
      s.async = true;
      s.onload = () => window.chatwootSDK.run({ websiteToken: CHAT.websiteToken, baseUrl: CHAT.baseUrl });
      s.onerror = reject;
      document.head.appendChild(s);
    });
    return chatLoading;
  }
  function openPanel() { chatPanel.hidden = false; chatPanel.querySelector('[data-close-chat]').focus(); }
  function closePanel() { chatPanel.hidden = true; }
  function startChat() {
    closePanel();
    sessionSet(ACTIVE_KEY, '1');
    chatControls.hidden = false;
    if (typeof window.gtag === 'function') window.gtag('event', 'webchat_start');
    loadChatwoot().then(() => window.$chatwoot && window.$chatwoot.toggle('open')).catch(() => {
      chatControls.hidden = true;
      sessionSet(ACTIVE_KEY, null);
      openPanel();
      chatPanel.querySelector('.chat-body').insertAdjacentHTML('afterbegin', '<p class="chat-error">The chat could not connect. Please call 0800 678 678 or use WhatsApp.</p>');
    });
  }
  function endChat(thenLeave) {
    if (window.$chatwoot) { try { window.$chatwoot.toggle('close'); window.$chatwoot.reset(); } catch (e) { /* ignore */ } }
    clearChatTraces();
    chatControls.hidden = true;
    if (thenLeave) window.location.replace('https://www.google.com');
  }

  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-open-chat]')) {
      e.preventDefault();
      if (sessionGet(ACTIVE_KEY) && window.$chatwoot) { window.$chatwoot.toggle('open'); return; }
      openPanel();
    } else if (e.target.closest('[data-close-chat]')) closePanel();
    else if (e.target.closest('[data-start-chat]')) startChat();
    else if (e.target.closest('[data-end-chat]')) endChat(false);
    else if (e.target.closest('[data-exit-chat]')) endChat(true);
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !chatPanel.hidden) closePanel(); });

  // Continue a chat that is still in progress in this tab (e.g. after moving to another page)
  if (chatReady && sessionGet(ACTIVE_KEY)) {
    chatControls.hidden = false;
    loadChatwoot();
  }

  // ---------- Footer year ----------
  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
})();
