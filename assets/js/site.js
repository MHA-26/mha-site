(function () {
  'use strict';

  const root = document.documentElement;
  root.classList.add('js');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function store(key, value) {
    try {
      if (value === undefined) return localStorage.getItem(key);
      localStorage.setItem(key, value);
    } catch (e) { return null; }
  }

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

  // ---------- Accessibility tools ----------
  const sizes = [14, 16, 18, 20];
  let sizeIndex = Number(store('mha-font')) || 1;
  function applySize() { root.style.setProperty('--base-size', sizes[sizeIndex] + 'px'); }
  applySize();
  document.querySelectorAll('[data-font]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const step = Number(btn.dataset.font);
      sizeIndex = step === 0 ? 1 : Math.min(sizes.length - 1, Math.max(0, sizeIndex + step));
      applySize();
      store('mha-font', String(sizeIndex));
    });
  });

  const contrastBtn = document.getElementById('contrastToggle');
  function applyContrast(on) {
    root.classList.toggle('hc', on);
    contrastBtn && contrastBtn.setAttribute('aria-pressed', String(on));
  }
  applyContrast(store('mha-hc') === '1');
  contrastBtn && contrastBtn.addEventListener('click', () => {
    const on = !root.classList.contains('hc');
    applyContrast(on);
    store('mha-hc', on ? '1' : '0');
  });

  // ---------- Quick exit (button or Esc twice) ----------
  function quickExit() {
    window.open('https://www.google.com', '_blank', 'noopener');
    window.location.replace('https://www.google.com');
  }
  const exitBtn = document.getElementById('quickExit');
  exitBtn && exitBtn.addEventListener('click', quickExit);
  let lastEsc = 0;
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' || document.querySelector('dialog[open]') || document.body.classList.contains('nav-open')) return;
    const now = Date.now();
    if (now - lastEsc < 600) quickExit();
    lastEsc = now;
  });

  // ---------- Header ----------
  const header = document.querySelector('.site-header');
  const mobileHelp = document.querySelector('.mobile-help');
  const hero = document.querySelector('.hero');
  function onScroll() {
    const y = window.scrollY;
    header && header.classList.toggle('is-scrolled', y > 8);
    if (mobileHelp && hero) mobileHelp.classList.toggle('is-visible', y > hero.offsetHeight * 0.6);
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

  // ---------- Footer year ----------
  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
})();
