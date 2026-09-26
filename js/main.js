/* =========================================================
   Eklavya Mishra — Portfolio interactions
   ========================================================= */
(() => {
  const root = document.documentElement;
  const qs = (s, el = document) => el.querySelector(s);
  const qsa = (s, el = document) => [...el.querySelectorAll(s)];
  const EMAIL = 'eklavyamisra2@gmail.com';

  /* ---------- things that work without GSAP ---------- */
  initClock();
  initMenu();
  initBrief();
  initCopy();

  // If the animation libraries failed to load, show everything statically.
  if (!window.gsap || !window.ScrollTrigger) {
    root.classList.remove('js');
    return;
  }

  gsap.registerPlugin(ScrollTrigger);
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ---------- smooth scroll ---------- */
  let lenis = null;
  if (window.Lenis && !reduced) {
    lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  window.__lenis = lenis;

  // Anchor links
  qsa('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      const target = id === '#top' ? 0 : qs(id);
      if (target === null) return;
      e.preventDefault();
      document.body.classList.remove('menu-open');
      if (lenis) { lenis.start(); lenis.scrollTo(target, { duration: 1.6 }); }
      else window.scrollTo({ top: target === 0 ? 0 : target.offsetTop, behavior: reduced ? 'auto' : 'smooth' });
    });
  });

  /* ---------- text splitting ---------- */
  qsa('[data-split-chars]').forEach((el) => {
    const text = el.textContent;
    el.setAttribute('aria-label', text);
    el.innerHTML = '<span class="split-mask" aria-hidden="true">' +
      [...text].map((c) => `<span class="split-char">${c === ' ' ? '&nbsp;' : c}</span>`).join('') +
      '</span>';
  });

  qsa('[data-split-lines]').forEach((el) => {
    el.innerHTML = el.innerHTML
      .split(/<br\s*\/?>/i)
      .map((l) => `<span class="split-line"><span class="split-inner">${l.trim()}</span></span>`)
      .join('');
  });

  qsa('[data-scrub-words]').forEach((el) => {
    el.innerHTML = el.textContent.trim().split(/\s+/)
      .map((w) => `<span class="split-word">${w}</span>`).join(' ');
  });

  /* ---------- reduced motion: show & stop ---------- */
  if (reduced) {
    qs('.loader')?.remove();
    gsap.set('[data-fade], [data-reveal]', { opacity: 1, y: 0 });
    return;
  }

  /* ---------- loader → hero intro ---------- */
  const heroChars = qsa('.hero .split-char');
  gsap.set(heroChars, { yPercent: 115 });
  gsap.set('.hero .btn-circle', { scale: 0 });
  window.scrollTo(0, 0);
  lenis?.stop();

  const num = qs('.loader__num');
  const counter = { v: 0 };
  const intro = gsap.timeline({ delay: 0.2 });
  intro
    .to(counter, {
      v: 100, duration: 2, ease: 'power3.inOut',
      onUpdate: () => { num.textContent = Math.round(counter.v); },
    })
    .to('.loader__bar i', { scaleX: 1, duration: 2, ease: 'power3.inOut' }, 0)
    .to('.loader__count', { yPercent: -30, opacity: 0, duration: 0.6, ease: 'power3.in' })
    .fromTo('.loader', { clipPath: 'inset(0% 0% 0% 0%)' }, {
      clipPath: 'inset(0% 0% 100% 0%)', duration: 1.1, ease: 'expo.inOut',
    }, '-=0.2')
    .to(heroChars, { yPercent: 0, duration: 1.4, ease: 'expo.out', stagger: 0.035 }, '-=0.55')
    .to('.hero [data-fade]', { opacity: 1, duration: 1, stagger: 0.08 }, '-=1.1')
    .to('.hero .btn-circle', { scale: 1, duration: 1.2, ease: 'elastic.out(1, 0.6)' }, '-=1')
    .add(() => {
      qs('.loader')?.remove();
      lenis?.start();
      ScrollTrigger.refresh();
    });

  /* ---------- hero parallax ---------- */
  gsap.to('.hero__title', {
    yPercent: 18, ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
  });
  gsap.to('.hero__bottom', {
    opacity: 0, y: -40, ease: 'none',
    scrollTrigger: { trigger: '.hero', start: '30% top', end: 'bottom top', scrub: true },
  });

  /* ---------- cursor + blob follow ---------- */
  if (finePointer) {
    const cursor = qs('.cursor');
    const label = qs('.cursor__label');
    const cx = gsap.quickTo(cursor, 'x', { duration: 0.35, ease: 'power3' });
    const cy = gsap.quickTo(cursor, 'y', { duration: 0.35, ease: 'power3' });
    const blob = qs('.hero__blob');
    const bx = gsap.quickTo(blob, 'x', { duration: 2.2, ease: 'power3' });
    const by = gsap.quickTo(blob, 'y', { duration: 2.2, ease: 'power3' });

    window.addEventListener('mousemove', (e) => {
      cursor.classList.remove('is-hidden');
      cx(e.clientX); cy(e.clientY);
      bx(e.clientX - blob.offsetWidth / 2);
      by(e.clientY - blob.offsetHeight / 2 + window.scrollY * 0.3);
    });
    document.addEventListener('mouseleave', () => cursor.classList.add('is-hidden'));
    document.addEventListener('mouseenter', () => cursor.classList.remove('is-hidden'));

    document.addEventListener('mouseover', (e) => {
      const labelled = e.target.closest('[data-cursor]');
      const hoverable = e.target.closest('a, button, input, .chip');
      cursor.classList.toggle('is-label', !!labelled);
      cursor.classList.toggle('is-hover', !labelled && !!hoverable);
      if (labelled) label.textContent = labelled.dataset.cursor;
    });

    // Magnetic elements
    qsa('[data-magnetic]').forEach((el) => {
      const mx = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'power3' });
      const my = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'power3' });
      el.addEventListener('mousemove', (e) => {
        const r = el.getBoundingClientRect();
        mx((e.clientX - (r.left + r.width / 2)) * 0.35);
        my((e.clientY - (r.top + r.height / 2)) * 0.35);
      });
      el.addEventListener('mouseleave', () => {
        gsap.to(el, { x: 0, y: 0, duration: 1, ease: 'elastic.out(1, 0.35)' });
      });
    });
  }

  /* ---------- nav hide/show ---------- */
  const nav = qs('.nav');
  ScrollTrigger.create({
    start: 0, end: 'max',
    onUpdate: (self) => {
      const y = self.scroll();
      nav.classList.toggle('is-hidden', self.direction === 1 && y > 200 && !document.body.classList.contains('menu-open'));
    },
  });

  /* ---------- velocity marquee ---------- */
  const track = qs('.marquee__track');
  if (track) {
    let x = 0, dir = -1, boost = 0;
    gsap.ticker.add((time, dt) => {
      const half = track.scrollWidth / 2;
      x += dir * (1 + boost) * dt * 0.08;
      if (x <= -half) x += half;
      if (x > 0) x -= half;
      track.style.transform = `translate3d(${x}px,0,0)`;
      boost *= 0.94;
    });
    ScrollTrigger.create({
      start: 0, end: 'max',
      onUpdate: (self) => {
        dir = self.direction === 1 ? -1 : 1;
        boost = Math.min(Math.abs(self.getVelocity()) / 250, 10);
      },
    });
  }

  /* ---------- scroll-lit paragraph ---------- */
  qsa('[data-scrub-words]').forEach((el) => {
    gsap.fromTo(qsa('.split-word', el), { opacity: 0.12 }, {
      opacity: 1, stagger: 0.1, ease: 'none',
      scrollTrigger: { trigger: el, start: 'top 80%', end: 'bottom 45%', scrub: true },
    });
  });

  /* ---------- line reveals ---------- */
  qsa('[data-split-lines]').forEach((el) => {
    gsap.from(qsa('.split-inner', el), {
      yPercent: 110, duration: 1.3, ease: 'expo.out', stagger: 0.1,
      scrollTrigger: { trigger: el, start: 'top 85%' },
    });
  });

  /* ---------- contact title chars ---------- */
  const contactChars = qsa('.contact .split-char');
  if (contactChars.length) {
    gsap.from(contactChars, {
      yPercent: 115, duration: 1.3, ease: 'expo.out', stagger: 0.025,
      scrollTrigger: { trigger: '.contact__title', start: 'top 80%' },
    });
    gsap.from('.contact__line .serif', {
      opacity: 0, y: 40, duration: 1.2, ease: 'expo.out',
      scrollTrigger: { trigger: '.contact__title', start: 'top 80%' },
    });
  }

  /* ---------- generic reveals ---------- */
  ScrollTrigger.batch('[data-reveal]', {
    start: 'top 90%',
    once: true,
    onEnter: (batch) => gsap.to(batch, { opacity: 1, y: 0, duration: 1.1, ease: 'expo.out', stagger: 0.08 }),
  });

  /* ---------- services panel lift ---------- */
  gsap.from('.services', {
    y: 120, ease: 'none',
    scrollTrigger: { trigger: '.services', start: 'top bottom', end: 'top 40%', scrub: true },
  });

  /* ---------- horizontal work (desktop) ---------- */
  const mm = gsap.matchMedia();
  mm.add('(min-width: 900px)', () => {
    const workTrack = qs('.work__track');
    const distance = () => workTrack.scrollWidth - window.innerWidth;

    gsap.to(workTrack, {
      x: () => -distance(),
      ease: 'none',
      scrollTrigger: {
        trigger: '.work',
        pin: '.work__pin',
        start: 'top top',
        end: () => '+=' + distance(),
        scrub: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => gsap.set('.work__progress i', { scaleX: self.progress }),
      },
    });
  });

  /* ---------- footer ---------- */
  gsap.from('.footer__big', {
    yPercent: 60, ease: 'none',
    scrollTrigger: { trigger: '.footer', start: 'top bottom', end: 'bottom bottom', scrub: true },
  });

  window.addEventListener('load', () => ScrollTrigger.refresh());
  document.fonts?.ready.then(() => ScrollTrigger.refresh());

  /* =========================================================
     helpers
     ========================================================= */
  function initClock() {
    const els = qsa('.js-time');
    if (!els.length) return;
    const fmt = new Intl.DateTimeFormat('en-GB', {
      hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata',
    });
    const tick = () => { const t = fmt.format(new Date()); els.forEach((el) => (el.textContent = t)); };
    tick();
    setInterval(tick, 15000);
  }

  function initMenu() {
    const btn = qs('.nav__burger');
    const menu = qs('.menu');
    if (!btn) return;
    btn.addEventListener('click', () => {
      const open = document.body.classList.toggle('menu-open');
      btn.setAttribute('aria-expanded', open);
      btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      menu.setAttribute('aria-hidden', !open);
      if (window.__lenis) open ? window.__lenis.stop() : window.__lenis.start();
    });
    qsa('a', menu).forEach((a) => a.addEventListener('click', () => {
      document.body.classList.remove('menu-open');
      btn.setAttribute('aria-expanded', 'false');
      menu.setAttribute('aria-hidden', 'true');
    }));
  }

  function initBrief() {
    const form = qs('.brief');
    if (!form) return;
    qsa('.chips', form).forEach((group) => {
      const single = group.hasAttribute('data-single');
      qsa('.chip', group).forEach((chip) => {
        chip.addEventListener('click', () => {
          if (single) qsa('.chip', group).forEach((c) => c !== chip && c.classList.remove('is-on'));
          chip.classList.toggle('is-on');
        });
      });
    });
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const picked = (g) => qsa(`[data-group="${g}"] .is-on`, form).map((c) => c.textContent);
      const types = picked('type');
      const time = picked('time')[0] || 'Not sure yet';
      const name = qs('[name="name"]', form).value.trim();
      const msg = qs('[name="msg"]', form).value.trim();
      const subject = `Project inquiry: ${types.join(', ') || 'New project'}`;
      const body = [
        'Hi Eklavya,', '',
        name ? `Name: ${name}` : null,
        `Looking for: ${types.join(', ') || '-'}`,
        `Timeline: ${time}`, '',
        msg || '(Project details)',
      ].filter((l) => l !== null).join('\n');
      window.location.href = `mailto:${EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    });
  }

  function initCopy() {
    qsa('[data-copy]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(btn.dataset.copy);
          btn.classList.add('is-copied');
          setTimeout(() => btn.classList.remove('is-copied'), 1800);
        } catch {
          window.location.href = `mailto:${btn.dataset.copy}`;
        }
      });
    });
  }
})();
