/* =========================================================
   Turning Wave — site interactions
   ========================================================= */
(() => {
  const root = document.documentElement;
  const qs = (s, el = document) => el.querySelector(s);
  const qsa = (s, el = document) => [...el.querySelectorAll(s)];
  const EMAIL = 'hello@turningwave.in';
  const WHATSAPP = '919057582885';
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const curtain = qs('.curtain');
  if (curtain) curtain.style.animation = 'none';

  /* ---------- things that work without GSAP ---------- */
  initMenu();
  initNav();
  initBrief();
  initCopy();
  initWaves();

  // If the animation libraries failed to load, show everything statically.
  if (!window.gsap || !window.ScrollTrigger) {
    root.classList.remove('js', 'is-arriving');
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  /* ---------- smooth scroll ---------- */
  let lenis = null;
  if (window.Lenis && !reduced) {
    lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  window.__lenis = lenis;

  qsa('a[href^="#"], [data-top]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      const target = id === '#top' ? 0 : qs(id);
      if (target === null) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(target, { duration: 1.6 });
      else window.scrollTo({ top: target === 0 ? 0 : target.offsetTop, behavior: reduced ? 'auto' : 'smooth' });
    });
  });

  /* ---------- page transitions ---------- */
  initTransitions();

  /* ---------- text splitting ---------- */
  qsa('[data-split-chars]').forEach((el) => {
    const text = el.textContent;
    el.setAttribute('aria-label', text);
    el.innerHTML = '<span class="split-mask" aria-hidden="true">' +
      [...text].map((c) => `<span class="split-char">${c === ' ' ? '&nbsp;' : c}</span>`).join('') + '</span>';
  });
  qsa('[data-split-lines]').forEach((el) => {
    el.innerHTML = el.innerHTML.split(/<br\s*\/?>/i)
      .map((l) => `<span class="split-line"><span class="split-inner">${l.trim()}</span></span>`).join('');
  });
  qsa('[data-scrub-words]').forEach((el) => {
    el.innerHTML = el.innerHTML.trim().split(/\s+(?![^<]*>)/)
      .map((w) => `<span class="split-word">${w}</span>`).join(' ');
  });

  if (reduced) {
    gsap.set('[data-fade], [data-reveal]', { opacity: 1, y: 0 });
    revealCurtain();
    return;
  }

  /* ---------- intro: curtain → hero ---------- */
  let firstVisit = false;
  try { firstVisit = !sessionStorage.getItem('tw-seen'); } catch (e) {}
  try { sessionStorage.setItem('tw-seen', '1'); } catch (e) {}

  const heroLines = qsa('.hero .split-inner, .phead .split-inner');
  const heroFade = qsa('.hero [data-fade], .phead [data-fade]');
  gsap.set(heroLines, { yPercent: 110 });
  lenis?.stop();

  const intro = gsap.timeline({ delay: 0.05 });
  if (firstVisit && curtain) {
    intro.fromTo('.curtain__mark .mark path', { yPercent: 60, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.9, ease: 'expo.out', stagger: 0.08 })
      .to('.curtain__mark', { scale: 0.9, opacity: 0, duration: 0.5, ease: 'power3.in' }, '+=0.15');
  }
  intro
    .add(revealCurtain())
    .to(heroLines, { yPercent: 0, duration: 1.3, ease: 'expo.out', stagger: 0.08 }, '-=0.6')
    .to(heroFade, { opacity: 1, duration: 1, stagger: 0.08 }, '-=1.0');
  const heroBtn = qsa('.hero .btn-circle');
  if (heroBtn.length) intro.from(heroBtn, { scale: 0, duration: 1.2, ease: 'elastic.out(1, 0.6)' }, '-=1');
  intro.add(() => { lenis?.start(); ScrollTrigger.refresh(); });

  /* ---------- hero parallax ---------- */
  if (qs('.hero')) {
    gsap.to('.hero__title', { yPercent: 14, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    gsap.to('.hero__bottom', { opacity: 0, y: -40, ease: 'none', scrollTrigger: { trigger: '.hero', start: '35% top', end: 'bottom top', scrub: true } });
  }
  if (qs('.phead')) {
    gsap.to('.phead__title', { yPercent: 20, opacity: 0.2, ease: 'none', scrollTrigger: { trigger: '.phead', start: 'top top', end: 'bottom top', scrub: true } });
  }

  /* ---------- cursor + magnetic ---------- */
  if (finePointer) {
    const cursor = qs('.cursor');
    const label = qs('.cursor__label');
    const cx = gsap.quickTo(cursor, 'x', { duration: 0.35, ease: 'power3' });
    const cy = gsap.quickTo(cursor, 'y', { duration: 0.35, ease: 'power3' });
    window.addEventListener('mousemove', (e) => { cursor.classList.remove('is-hidden'); cx(e.clientX); cy(e.clientY); });
    document.addEventListener('mouseleave', () => cursor.classList.add('is-hidden'));
    document.addEventListener('mouseover', (e) => {
      const labelled = e.target.closest('[data-cursor]');
      const hoverable = e.target.closest('a, button, input, textarea, summary, .chip');
      cursor.classList.toggle('is-label', !!labelled);
      cursor.classList.toggle('is-hover', !labelled && !!hoverable);
      if (labelled) label.textContent = labelled.dataset.cursor;
    });
    qsa('[data-magnetic]').forEach((el) => {
      const mx = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'power3' });
      const my = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'power3' });
      el.addEventListener('mousemove', (e) => {
        const r = el.getBoundingClientRect();
        mx((e.clientX - (r.left + r.width / 2)) * 0.3);
        my((e.clientY - (r.top + r.height / 2)) * 0.3);
      });
      el.addEventListener('mouseleave', () => gsap.to(el, { x: 0, y: 0, duration: 1, ease: 'elastic.out(1, 0.35)' }));
    });
  }

  /* ---------- velocity marquee ---------- */
  const track = qs('.marquee__track');
  if (track) {
    let x = 0, dir = -1, boost = 0;
    gsap.ticker.add((time, dt) => {
      const half = track.scrollWidth / 2;
      x += dir * (1 + boost) * dt * 0.07;
      if (x <= -half) x += half;
      if (x > 0) x -= half;
      track.style.transform = `translate3d(${x}px,0,0)`;
      boost *= 0.94;
    });
    ScrollTrigger.create({
      start: 0, end: 'max',
      onUpdate: (self) => { dir = self.direction === 1 ? -1 : 1; boost = Math.min(Math.abs(self.getVelocity()) / 250, 10); },
    });
  }

  /* ---------- scroll-lit paragraph ---------- */
  qsa('[data-scrub-words]').forEach((el) => {
    gsap.fromTo(qsa('.split-word', el), { opacity: 0.14 }, {
      opacity: 1, stagger: 0.1, ease: 'none',
      scrollTrigger: { trigger: el, start: 'top 80%', end: 'bottom 50%', scrub: true },
    });
  });

  /* ---------- line reveals (outside page heads) ---------- */
  qsa('[data-split-lines]').forEach((el) => {
    if (el.closest('.hero, .phead')) return;
    gsap.from(qsa('.split-inner', el), {
      yPercent: 110, duration: 1.3, ease: 'expo.out', stagger: 0.1,
      scrollTrigger: { trigger: el, start: 'top 88%' },
    });
  });

  /* ---------- CTA title ---------- */
  qsa('.cta').forEach((cta) => {
    gsap.from(qsa('.split-char', cta), {
      yPercent: 115, duration: 1.3, ease: 'expo.out', stagger: 0.025,
      scrollTrigger: { trigger: cta, start: 'top 75%' },
    });
    gsap.from(qsa('.cta__title .serif', cta), {
      opacity: 0, y: 60, duration: 1.4, ease: 'expo.out', delay: 0.2,
      scrollTrigger: { trigger: cta, start: 'top 75%' },
    });
  });

  /* ---------- generic reveals ---------- */
  ScrollTrigger.batch('[data-reveal]', {
    start: 'top 92%', once: true,
    onEnter: (batch) => gsap.to(batch, { opacity: 1, y: 0, duration: 1.1, ease: 'expo.out', stagger: 0.08 }),
  });

  /* ---------- counters ---------- */
  qsa('[data-count]').forEach((el) => {
    const end = parseFloat(el.dataset.count);
    const obj = { v: 0 };
    gsap.to(obj, {
      v: end, duration: 1.8, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 90%', once: true },
      onUpdate: () => { el.textContent = String(Math.round(obj.v)).padStart(el.dataset.pad || 1, '0') + (el.dataset.suffix || ''); },
    });
  });

  /* ---------- paper band lift ---------- */
  qsa('.band--paper').forEach((band) => {
    gsap.fromTo(band, { scale: 0.94, borderRadius: '80px' }, {
      scale: 1, borderRadius: '48px', ease: 'none',
      scrollTrigger: { trigger: band, start: 'top bottom', end: 'top 35%', scrub: true },
    });
  });

  /* ---------- horizontal work reel (desktop, home) ---------- */
  const mm = gsap.matchMedia();
  mm.add('(min-width: 901px)', () => {
    const sect = qs('.work[data-pin]');
    if (!sect) return;
    const reelTrack = qs('.reel__track', sect);
    const distance = () => reelTrack.scrollWidth - window.innerWidth;
    gsap.to(reelTrack, {
      x: () => -distance(), ease: 'none',
      scrollTrigger: {
        trigger: sect, pin: true, start: 'top top', end: () => '+=' + distance(),
        scrub: 1, invalidateOnRefresh: true,
        onUpdate: (self) => gsap.set(qs('.work__progress i', sect), { scaleX: self.progress }),
      },
    });
    let lastWidth = reelTrack.scrollWidth;
    const ro = new ResizeObserver(() => {
      if (reelTrack.scrollWidth === lastWidth) return;
      lastWidth = reelTrack.scrollWidth;
      ScrollTrigger.refresh();
    });
    ro.observe(reelTrack);
    return () => ro.disconnect();
  });

  /* ---------- footer ---------- */
  gsap.from('.footer__big', {
    yPercent: 50, ease: 'none',
    scrollTrigger: { trigger: '.footer', start: 'top bottom', end: 'bottom bottom', scrub: true },
  });

  window.addEventListener('load', () => ScrollTrigger.refresh());
  document.fonts?.ready.then(() => ScrollTrigger.refresh());

  /* =========================================================
     helpers
     ========================================================= */
  function revealCurtain() {
    root.classList.remove('is-arriving');
    if (!curtain) return gsap.timeline();
    return gsap.timeline()
      .fromTo(curtain, { clipPath: 'inset(0% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 100% 0%)', duration: reduced ? 0 : 1, ease: 'expo.inOut' })
      .set('.curtain__mark', { clearProps: 'all' });
  }

  function initTransitions() {
    if (!curtain || reduced) return;
    document.addEventListener('click', (e) => {
      const a = e.target.closest('a[href]');
      if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
      if (a.target === '_blank' || a.hasAttribute('download')) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin) return;
      if (url.pathname === location.pathname && url.hash) return;
      e.preventDefault();
      document.body.classList.remove('menu-open');
      gsap.set('.curtain__mark', { opacity: 0 });
      gsap.fromTo(curtain, { clipPath: 'inset(100% 0% 0% 0%)' }, {
        clipPath: 'inset(0% 0% 0% 0%)', duration: 0.75, ease: 'expo.inOut',
        onComplete: () => { location.href = url.href; },
      });
    });
    // Back/forward cache: make sure the page isn't left covered.
    window.addEventListener('pageshow', (e) => {
      if (e.persisted) gsap.set(curtain, { clipPath: 'inset(0% 0% 100% 0%)' });
    });
  }

  function initNav() {
    const nav = qs('.nav');
    if (!nav) return;
    let lastY = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      nav.classList.toggle('is-scrolled', y > 40);
      nav.classList.toggle('is-hidden', y > lastY && y > 300 && !document.body.classList.contains('menu-open'));
      lastY = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  function initMenu() {
    const btn = qs('.nav__burger');
    const menu = qs('.menu');
    if (!btn) return;
    const set = (open) => {
      document.body.classList.toggle('menu-open', open);
      btn.setAttribute('aria-expanded', open);
      btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      menu.setAttribute('aria-hidden', !open);
      if (window.__lenis) open ? window.__lenis.stop() : window.__lenis.start();
    };
    btn.addEventListener('click', () => set(!document.body.classList.contains('menu-open')));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') set(false); });
  }

  function initBrief() {
    const form = qs('.brief');
    if (!form) return;
    qsa('.chip', form).forEach((chip) => chip.addEventListener('click', () => {
      chip.classList.toggle('is-on');
      chip.setAttribute('aria-pressed', chip.classList.contains('is-on'));
    }));
    // Prefill from links like /contact/?topic=Salon%20website
    const topic = new URLSearchParams(location.search).get('topic');
    if (topic) {
      const msg = qs('[name="msg"]', form);
      msg.value = `I'm interested in: ${topic}. `;
      const web = qs('.chip[data-chip="website"]', form);
      web?.classList.add('is-on');
    }
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const types = qsa('.chip.is-on', form).map((c) => c.textContent);
      const name = qs('[name="name"]', form).value.trim();
      const biz = qs('[name="business"]', form).value.trim();
      const msg = qs('[name="msg"]', form).value.trim();
      const subject = `Project enquiry: ${types.join(', ') || 'New project'}`;
      const body = [
        'Hi Turning Wave,', '',
        name ? `Name: ${name}` : null,
        biz ? `Business: ${biz}` : null,
        `Looking for: ${types.join(', ') || '-'}`, '',
        msg || '(Project details)',
      ].filter((l) => l !== null).join('\n');
      if (e.submitter && e.submitter.value === 'email') {
        window.location.href = `mailto:${EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      } else {
        window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(body)}`, '_blank', 'noopener');
      }
      // Land on the thank-you page so Google Ads can count the lead.
      setTimeout(() => { window.location.href = '/thank-you/'; }, 800);
    });
  }

  function initCopy() {
    qsa('[data-copy]').forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        e.preventDefault();
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

  /* Flowing wave lines in brand gradient, drawn on <canvas class="waves"> */
  function initWaves() {
    const canvases = qsa('canvas.waves');
    if (!canvases.length) return;
    const mouse = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 };
    window.addEventListener('pointermove', (e) => {
      mouse.tx = e.clientX / window.innerWidth;
      mouse.ty = e.clientY / window.innerHeight;
    }, { passive: true });

    canvases.forEach((canvas) => {
      const ctx = canvas.getContext('2d');
      const isHero = canvas.classList.contains('waves--hero');
      const lines = isHero ? 22 : 14;
      let w = 0, h = 0, visible = true, t = Math.random() * 100;

      const resize = () => {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        w = canvas.clientWidth; h = canvas.clientHeight;
        canvas.width = w * dpr; canvas.height = h * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      };
      resize();
      new ResizeObserver(resize).observe(canvas);
      new IntersectionObserver(([en]) => { visible = en.isIntersecting; }).observe(canvas);

      const draw = () => {
        ctx.clearRect(0, 0, w, h);
        const grad = ctx.createLinearGradient(0, 0, w, 0);
        grad.addColorStop(0, 'rgba(0,200,255,0)');
        grad.addColorStop(0.25, 'rgba(0,200,255,.55)');
        grad.addColorStop(0.6, 'rgba(5,138,253,.5)');
        grad.addColorStop(1, 'rgba(7,67,253,0)');
        ctx.strokeStyle = grad;
        const baseY = h * (isHero ? 0.62 : 0.7);
        const amp = h * (isHero ? 0.12 : 0.09) * (0.7 + mouse.y * 0.6);
        const step = Math.max(6, w / 140);
        for (let i = 0; i < lines; i++) {
          const p = i / (lines - 1);
          ctx.globalAlpha = 0.15 + Math.sin(p * Math.PI) * 0.65;
          ctx.lineWidth = i === Math.floor(lines / 2) ? 1.6 : 1;
          ctx.beginPath();
          for (let x = 0; x <= w + step; x += step) {
            const nx = x / w;
            const pull = Math.exp(-Math.pow((nx - mouse.x) * 3, 2)) * 0.6;
            const y = baseY
              + Math.sin(nx * 5.2 + t * 0.6 + p * 1.8) * amp * (1 + pull)
              + Math.sin(nx * 11 - t * 0.4 + p * 3.1) * amp * 0.25
              + (p - 0.5) * h * 0.22 * (1 - pull * 0.5);
            x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
          }
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
      };

      if (reduced) { draw(); return; }
      const loop = () => {
        if (visible && !document.hidden) {
          mouse.x += (mouse.tx - mouse.x) * 0.04;
          mouse.y += (mouse.ty - mouse.y) * 0.04;
          t += 0.012;
          draw();
        }
        requestAnimationFrame(loop);
      };
      loop();
    });
  }
})();
