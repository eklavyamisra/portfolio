/* =========================================================
   Turning Wave — static site builder
   Run:  node _src/build.mjs
   Reads _src/pages/**.html (+ industry data) and writes the
   finished pages, sitemap.xml into the site root.
   ========================================================= */
import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, dirname, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SITE, SERVICES, INDUSTRIES, WORK } from './data.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PAGES = join(ROOT, '_src', 'pages');
const TODAY = new Date().toISOString().slice(0, 10);

const hash = (file) => createHash('md5').update(readFileSync(join(ROOT, file))).digest('hex').slice(0, 8);
const CSS_V = hash('css/style.css');
const JS_V = hash('js/main.js');

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const strip = (s) => String(s).replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
const ARROW = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M9 7h8v8"/></svg>';

/* ---------- shared fragments ---------- */
const MARK = `<svg class="mark" viewBox="93 96 190 104" aria-hidden="true"><defs><linearGradient id="mg" x1="0" y1="99" x2="0" y2="198" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#00c8ff"/><stop offset=".5" stop-color="#058afd"/><stop offset="1" stop-color="#0743fd"/></linearGradient><linearGradient id="mf" x1="186" y1="160" x2="207" y2="152" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#0a56b8"/><stop offset="1" stop-color="#031c45"/></linearGradient></defs><path fill="url(#mf)" d="M193 126 L212 140 L212 181 C211 191 205 197 197 197 L180 190 Z"/><path fill="url(#mg)" d="M117 99 H141 V158 C141 172 152 186 165 197 H149 C131 197 117 182 117 162 Z"/><path fill="url(#mg)" d="M95 120 H151 C160 120 167 125 172 133 L198 175 C202 181 206 184 210 186 C206 194 200 197 192 197 C185 197 180 193 176 187 L144 138 C143 136 142 135 140 135 H95 Z"/><path fill="url(#mg)" d="M195 128 C195 124 200 121 207 121 C212 121 216 123 219 126 L247 177 L265 141 H281 L258 187 C254 194 248 198 241 198 C235 198 230 195 226 189 Z"/></svg>`;

const NAV = [
  ['Services', '/services/'],
  ['Work', '/work/'],
  ['Industries', '/industries/'],
  ['About', '/about/'],
];

function header(path) {
  const links = NAV.map(([t, h]) =>
    `<a href="${h}" class="link-roll${path.startsWith(h) ? ' is-active' : ''}"${path.startsWith(h) ? ' aria-current="page"' : ''}><span data-text="${t}">${t}</span></a>`).join('');
  const menu = [...NAV, ['Contact', '/contact/']].map(([t, h], i) =>
    `<a href="${h}"><span class="mono">0${i + 1}</span>${t}</a>`).join('');
  return `
<a class="skip" href="#main">Skip to content</a>
<div class="curtain" aria-hidden="true"><div class="curtain__mark">${MARK}</div></div>
<div class="cursor is-hidden" aria-hidden="true"><span class="cursor__label"></span></div>
<div class="grain" aria-hidden="true"></div>
<header class="nav">
  <a href="/" class="nav__logo" aria-label="Turning Wave home"><img src="/assets/logo/logo-nav.svg" alt="Turning Wave" width="173" height="40" /></a>
  <nav class="nav__links" aria-label="Primary">${links}</nav>
  <a href="/contact/" class="nav__cta" data-magnetic><span class="nav__cta-dot"></span>Start a project</a>
  <button class="nav__burger" aria-label="Open menu" aria-expanded="false" aria-controls="menu"><span></span><span></span></button>
</header>
<div class="menu" id="menu" aria-hidden="true">
  <nav class="menu__links" aria-label="Mobile">${menu}</nav>
  <div class="menu__foot mono">
    <a href="mailto:${SITE.email}">${SITE.email}</a>
    <a href="tel:${SITE.phoneRaw}">${SITE.phone}</a>
    <a href="https://wa.me/${SITE.whatsapp}" target="_blank" rel="noopener">WhatsApp ↗</a>
  </div>
</div>`;
}

function footer() {
  const col = (title, items) => `<div class="footer__col"><p class="mono">${title}</p><ul>${items.map(([t, h, ext]) =>
    `<li><a href="${h}"${ext ? ' target="_blank" rel="noopener"' : ''} class="link-roll"><span data-text="${t}">${t}</span></a></li>`).join('')}</ul></div>`;
  return `
<footer class="footer">
  <div class="footer__top">
    <div class="footer__brand">
      <img src="/assets/logo/logo-nav.svg" alt="Turning Wave" width="216" height="50" loading="lazy" />
      <p>Website development, SEO and AI automation company in India, building for businesses and startups worldwide.</p>
      <a href="mailto:${SITE.email}" class="footer__mail">${SITE.email}</a>
    </div>
    ${col('Services', SERVICES.map((s) => [s.short, `/services/${s.slug}/`]))}
    ${col('Industries', INDUSTRIES.map((i) => [i.nav, `/industries/${i.slug}/`]))}
    ${col('Company', [['Services', '/services/'], ['Work', '/work/'], ['About', '/about/'], ['Contact', '/contact/'], ['WhatsApp ↗', `https://wa.me/${SITE.whatsapp}`, 1]])}
  </div>
  <div class="footer__big" aria-hidden="true">turning <span class="grad">wave</span></div>
  <div class="footer__row mono">
    <span>© ${new Date().getFullYear()} Turning Wave · Founded by ${SITE.founder}</span>
    <span>Based in India · Working worldwide</span>
    <a href="#top" class="link-roll" data-top><span data-text="Back to top ↑">Back to top ↑</span></a>
  </div>
</footer>`;
}

/* ---------- reusable blocks (tokens in page bodies) ---------- */
const BLOCKS = {
  CTA: () => `
<section class="cta" aria-labelledby="cta-title">
  <canvas class="waves waves--cta" aria-hidden="true"></canvas>
  <p class="label mono"><span>( Next )</span> Your project</p>
  <h2 class="cta__title" id="cta-title"><span data-split-chars>Let's make</span> <em class="serif grad-text">waves</em></h2>
  <p class="cta__sub">Tell us what you need. We reply within 24 hours with a plan, a timeline and a fixed quote.</p>
  <div class="cta__actions">
    <a href="/contact/" class="btn-circle btn-circle--lg" data-magnetic data-cursor="Let's go"><span>Get a free<br />quote</span>${ARROW}</a>
    <div class="cta__direct">
      <a href="https://wa.me/${SITE.whatsapp}" target="_blank" rel="noopener" class="link-roll"><span data-text="WhatsApp ↗">WhatsApp ↗</span></a>
      <a href="tel:${SITE.phoneRaw}" class="link-roll"><span data-text="${SITE.phone}">${SITE.phone}</span></a>
      <a href="mailto:${SITE.email}" class="link-roll"><span data-text="${SITE.email}">${SITE.email}</span></a>
    </div>
  </div>
</section>`,

  SERVICES_LIST: () => `
<ul class="srv-list">${SERVICES.map((s, i) => `
  <li class="srv" data-reveal>
    <a href="/services/${s.slug}/" class="srv__link" data-cursor="Explore">
      <span class="srv__num mono">0${i + 1}</span>
      <h3 class="srv__title">${s.name}</h3>
      <p class="srv__desc">${s.summary}</p>
      <span class="srv__arrow">${ARROW}</span>
    </a>
  </li>`).join('')}
</ul>`,

  WORK: () => `
<div class="reel">
  <div class="reel__track">${WORK.map((w, i) => `
    <article class="card" data-cursor="View">
      <a href="${w.url}" target="_blank" rel="noopener" class="card__link">
        <div class="card__art ${w.art}">${w.artHtml}</div>
        <div class="card__info">
          <span class="mono">0${i + 1} / ${w.kind}</span>
          <h3>${w.name}</h3>
          <p>${w.desc}</p>
          <ul class="tags">${w.tags.map((t) => `<li>${t}</li>`).join('')}</ul>
        </div>
      </a>
    </article>`).join('')}
    <div class="reel__end">
      <p>Want one<br /><em class="serif grad-text">like these?</em></p>
      <a href="/contact/" class="btn-circle" data-magnetic data-cursor="Quote"><span>Start a<br />project</span>${ARROW}</a>
    </div>
  </div>
</div>`,

  INDUSTRIES_GRID: () => `
<ul class="ind-grid">${INDUSTRIES.map((ind, i) => `
  <li data-reveal><a href="/industries/${ind.slug}/" class="ind-card" data-cursor="Open">
    <span class="mono">0${i + 1}</span>
    <h3>${ind.nav}</h3>
    <p>${ind.card}</p>
    <span class="ind-card__go">${ARROW}</span>
  </a></li>`).join('')}
</ul>`,

  PROCESS: () => `
<ol class="process">${[
    ['Discover', 'A free call to understand your goals, customers and budget. You get a written plan and a fixed quote.', 'Day 1'],
    ['Design', 'Wireframes and a visual direction built around your brand. You approve it before any code.', 'Week 1'],
    ['Build', 'Development with weekly preview links, so you watch your site come to life.', 'Week 2–4'],
    ['Launch & grow', 'Go live with SEO, analytics and speed checks, then support as you grow.', 'Ship'],
  ].map(([t, d, w], i) => `
  <li class="process__step" data-reveal>
    <span class="process__num">0${i + 1}</span>
    <div><h3>${t}</h3><p>${d}</p></div>
    <span class="process__time mono">${w}</span>
  </li>`).join('')}
</ol>`,

  QUOTES: () => `
<div class="quotes">
  <figure class="quote" data-reveal>
    <blockquote>"Eklavya built our website and automated the copy-paste work our team used to do by hand every day. He understood the problem quickly and delivered exactly what we needed."</blockquote>
    <figcaption class="mono">Satish Sankhla · Business owner</figcaption>
  </figure>
  <figure class="quote" data-reveal>
    <blockquote>"Our salon finally has a website that matches the quality of our work. It looks great on phones, and clients can easily see our services and get in touch."</blockquote>
    <figcaption class="mono">Danesh · Salon owner</figcaption>
  </figure>
</div>`,

  MARQUEE: () => {
    const group = (hidden) => `<div class="marquee__group"${hidden ? ' aria-hidden="true"' : ''}>${SERVICES.map((s, i) =>
      `<span${i % 2 ? ' class="serif"' : ''}>${s.short}</span><b>${MARK}</b>`).join('')}</div>`;
    return `<section class="marquee" aria-label="What we do"><div class="marquee__track">${group(false)}${group(true)}</div></section>`;
  },
};

function faqBlock(faq, title = 'Questions, <em class="serif grad-text">answered</em>') {
  return `
<section class="faq" aria-labelledby="faq-title">
  <div class="faq__head">
    <p class="label mono"><span>( FAQ )</span> Good to know</p>
    <h2 class="h2" id="faq-title" data-split-lines>${title}</h2>
  </div>
  <div class="faq__list">${faq.map(([q, a]) => `
    <details class="faq__item" data-reveal>
      <summary><h3>${q}</h3><span class="faq__icon" aria-hidden="true"></span></summary>
      <div class="faq__a"><p>${a}</p></div>
    </details>`).join('')}
  </div>
</section>`;
}

function pageHead(m) {
  const crumbs = m.breadcrumbs || [];
  const trail = crumbs.length ? `<nav class="crumbs mono" aria-label="Breadcrumb"><a href="/">Home</a>${crumbs.map(([t, h], i) =>
    i === crumbs.length - 1 ? `<span aria-current="page">${t}</span>` : `<a href="${h}">${t}</a>`).join('')}</nav>` : '';
  return `
<section class="phead">
  <canvas class="waves" aria-hidden="true"></canvas>
  ${trail}
  <h1 class="phead__title"><span class="phead__eyebrow mono" data-fade>${m.hero.eyebrow}</span><span class="phead__display" data-split-lines>${m.hero.title}</span></h1>
  <div class="phead__foot">
    <p class="phead__lede" data-fade>${m.hero.lede}</p>
    ${m.hero.cta === false ? '' : `<a href="${m.hero.ctaHref || '/contact/'}" class="btn-pill" data-fade data-magnetic><span>${m.hero.cta || 'Get a free quote'}</span>${ARROW}</a>`}
  </div>
</section>`;
}

/* ---------- structured data ---------- */
function schema(m) {
  const url = SITE.url + m.path;
  const org = {
    '@type': 'ProfessionalService',
    '@id': SITE.url + '/#organization',
    name: 'Turning Wave',
    url: SITE.url + '/',
    logo: SITE.url + '/assets/seo/icon-512.png',
    image: SITE.url + '/assets/seo/og-image.png',
    description: 'Website development, SEO and AI automation company in India building fast websites, web apps and AI tools for businesses and startups.',
    email: SITE.email,
    telephone: '+91-9057582885',
    address: { '@type': 'PostalAddress', addressCountry: 'IN' },
    areaServed: [{ '@type': 'Country', name: 'India' }, 'Worldwide'],
    founder: { '@id': SITE.url + '/about/#founder' },
    sameAs: [SITE.github, `https://wa.me/${SITE.whatsapp}`],
    contactPoint: { '@type': 'ContactPoint', contactType: 'sales', telephone: '+91-9057582885', email: SITE.email, availableLanguage: ['English', 'Hindi'] },
    knowsAbout: ['Website design', 'Website development', 'Web app development', 'SaaS development', 'Search engine optimization', 'Local SEO', 'AI chatbot development', 'Business automation', 'UI/UX design', 'Logo design', 'React', 'Next.js', 'Node.js'],
    hasOfferCatalog: {
      '@type': 'OfferCatalog', name: 'Services',
      itemListElement: SERVICES.map((s) => ({ '@type': 'Offer', itemOffered: { '@type': 'Service', name: s.name, url: `${SITE.url}/services/${s.slug}/` } })),
    },
  };
  const graph = [
    org,
    { '@type': 'WebSite', '@id': SITE.url + '/#website', url: SITE.url + '/', name: 'Turning Wave', inLanguage: 'en-IN', publisher: { '@id': SITE.url + '/#organization' } },
    {
      '@type': m.pageType || 'WebPage', '@id': url + '#webpage', url, name: m.title, description: m.description,
      isPartOf: { '@id': SITE.url + '/#website' }, about: { '@id': SITE.url + '/#organization' },
      primaryImageOfPage: SITE.url + '/assets/seo/og-image.png', inLanguage: 'en-IN', dateModified: TODAY,
      ...(m.breadcrumbs ? { breadcrumb: { '@id': url + '#breadcrumb' } } : {}),
    },
  ];
  if (m.breadcrumbs) {
    graph.push({
      '@type': 'BreadcrumbList', '@id': url + '#breadcrumb',
      itemListElement: [['Home', '/'], ...m.breadcrumbs].map(([n, h], i) => ({ '@type': 'ListItem', position: i + 1, name: strip(n), item: SITE.url + h })),
    });
  }
  if (m.service) {
    graph.push({
      '@type': 'Service', '@id': url + '#service', name: m.service.name, serviceType: m.service.type || m.service.name,
      description: m.description, url, provider: { '@id': SITE.url + '/#organization' },
      areaServed: [{ '@type': 'Country', name: 'India' }, 'Worldwide'],
    });
  }
  if (m.person) {
    graph.push({
      '@type': 'Person', '@id': SITE.url + '/about/#founder', name: SITE.founder, jobTitle: 'Founder',
      worksFor: { '@id': SITE.url + '/#organization' }, url, sameAs: [SITE.github],
      knowsAbout: ['React', 'Next.js', 'Node.js', 'MongoDB', 'GSAP', 'SEO', 'AI automation'],
    });
  }
  if (m.faq) {
    graph.push({
      '@type': 'FAQPage', '@id': url + '#faq',
      mainEntity: m.faq.map(([q, a]) => ({ '@type': 'Question', name: strip(q), acceptedAnswer: { '@type': 'Answer', text: strip(a) } })),
    });
  }
  return JSON.stringify({ '@context': 'https://schema.org', '@graph': graph });
}

/* ---------- layout ---------- */
function render(m, body) {
  const url = SITE.url + m.path;
  const robots = m.noindex ? 'noindex, follow' : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';
  body = body
    .replace(/\{\{PAGEHEAD\}\}/g, () => pageHead(m))
    .replace(/\{\{FAQ\}\}/g, () => faqBlock(m.faq, m.faqTitle))
    .replace(/\{\{(\w+)\}\}/g, (all, k) => (BLOCKS[k] ? BLOCKS[k]() : all));

  return `<!doctype html>
<html lang="en-IN">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(m.title)}</title>
<meta name="description" content="${esc(m.description)}" />
<meta name="robots" content="${robots}" />
${m.keywords ? `<meta name="keywords" content="${esc(m.keywords)}" />\n` : ''}<meta name="author" content="${SITE.founder}" />
<meta name="theme-color" content="#04070d" />
<meta name="format-detection" content="telephone=no" />
<link rel="canonical" href="${url}" />
<link rel="alternate" hreflang="en-IN" href="${url}" />
<link rel="alternate" hreflang="x-default" href="${url}" />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="Turning Wave" />
<meta property="og:locale" content="en_IN" />
<meta property="og:url" content="${url}" />
<meta property="og:title" content="${esc(m.ogTitle || m.title)}" />
<meta property="og:description" content="${esc(m.description)}" />
<meta property="og:image" content="${SITE.url}/assets/seo/og-image.png" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:image:alt" content="Turning Wave: websites, SEO and AI automation that win customers." />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${esc(m.ogTitle || m.title)}" />
<meta name="twitter:description" content="${esc(m.description)}" />
<meta name="twitter:image" content="${SITE.url}/assets/seo/og-image.png" />
<link rel="icon" href="/favicon.ico" sizes="any" />
<link rel="icon" type="image/svg+xml" href="/assets/logo/mark.svg" />
<link rel="apple-touch-icon" href="/assets/seo/apple-touch-icon.png" />
<link rel="manifest" href="/site.webmanifest" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link rel="preconnect" href="https://cdnjs.cloudflare.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Unbounded:wght@400;500;600;700&family=Manrope:wght@400;500;600;700&family=Instrument+Serif:ital@1&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
<link rel="stylesheet" href="/css/style.css?v=${CSS_V}" />
<script>document.documentElement.classList.add('js','is-arriving')</script>
<script type="application/ld+json">${schema(m)}</script>
</head>
<body class="page-${m.slug}" id="top">
${header(m.path)}
<main id="main">
${body.trim()}
</main>
${footer()}
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js" defer></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js" defer></script>
<script src="https://cdn.jsdelivr.net/npm/lenis@1.1.13/dist/lenis.min.js" defer></script>
<script src="/js/main.js?v=${JS_V}" defer></script>
</body>
</html>
`;
}

/* ---------- collect pages ---------- */
function walk(dir) {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : p.endsWith('.html') ? [p] : [];
  });
}

const pages = walk(PAGES).map((file) => {
  const src = readFileSync(file, 'utf8');
  const match = src.match(/^<!--([\s\S]*?)-->\s*/);
  if (!match) throw new Error(`Missing meta block in ${file}`);
  const meta = JSON.parse(match[1]);
  const rel = relative(PAGES, file).split(sep).join('/');
  meta.path ||= '/' + rel.replace(/index\.html$/, '').replace(/\.html$/, '/');
  meta.out ||= rel.endsWith('index.html') ? rel : rel.replace(/\.html$/, '/index.html');
  meta.slug ||= rel.replace(/\/?index\.html$/, '').replace(/\//g, '-') || 'home';
  return { meta, body: src.slice(match[0].length) };
});

/* industry landing pages come from data, one per industry */
for (const ind of INDUSTRIES) {
  pages.push({
    meta: {
      title: ind.title,
      description: ind.description,
      keywords: ind.keywords,
      path: `/industries/${ind.slug}/`,
      out: `industries/${ind.slug}/index.html`,
      slug: 'industry',
      priority: 0.7,
      breadcrumbs: [['Industries', '/industries/'], [ind.nav, `/industries/${ind.slug}/`]],
      service: { name: ind.h1, type: 'Website design and development' },
      hero: { eyebrow: ind.h1, title: ind.display, lede: ind.lede },
      faq: ind.faq,
    },
    body: industryBody(ind),
  });
}

function industryBody(ind) {
  return `
{{PAGEHEAD}}
<section class="split">
  <div class="split__side">
    <p class="label mono"><span>( 01 )</span> The problem</p>
    <h2 class="h2" data-split-lines>${ind.problemTitle}</h2>
  </div>
  <div class="split__main prose" data-reveal>${ind.problem.map((p) => `<p>${p}</p>`).join('')}</div>
</section>
<section class="features">
  <p class="label mono"><span>( 02 )</span> What your website includes</p>
  <h2 class="h2" data-split-lines>Built for how<br /><em class="serif grad-text">${ind.audience}</em> choose</h2>
  <ul class="feat-grid">${ind.features.map(([t, d], i) => `
    <li class="feat" data-reveal><span class="feat__n mono">0${i + 1}</span><h3>${t}</h3><p>${d}</p></li>`).join('')}
  </ul>
</section>
<section class="band band--paper">
  <div class="band__inner">
    <p class="label mono"><span>( 03 )</span> How it works</p>
    <h2 class="h2" data-split-lines>Live in days,<br /><em class="serif grad-text">not months</em></h2>
    <p class="band__text" data-reveal>Tell us about your ${ind.word} on a free call. Within 24 hours you get a written plan, a timeline and a fixed quote. You approve the design before any code, see weekly preview links while we build, and own everything once it goes live.</p>
    <div class="band__actions" data-reveal>
      <a href="/contact/?topic=${encodeURIComponent(strip(ind.h1))}" class="btn-pill"><span>Get a quote for my ${ind.word}</span>${ARROW}</a>
      <a href="/work/" class="btn-pill btn-pill--ghost"><span>See our work</span>${ARROW}</a>
    </div>
  </div>
</section>
<section class="related">
  <p class="label mono"><span>( 04 )</span> Also useful</p>
  <ul class="related__list">
    <li><a href="/services/seo-services/" class="related__link">Local SEO for ${ind.audience}<span>${ARROW}</span></a></li>
    <li><a href="/services/ai-chatbot-automation/" class="related__link">WhatsApp &amp; AI chatbot for bookings<span>${ARROW}</span></a></li>
    <li><a href="/services/branding-ui-ux-design/" class="related__link">Logo &amp; brand identity<span>${ARROW}</span></a></li>
  </ul>
</section>
{{FAQ}}
{{CTA}}`;
}

/* ---------- write ---------- */
for (const { meta, body } of pages) {
  const out = join(ROOT, meta.out);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, render(meta, body));
}

const indexable = pages.filter((p) => !p.meta.noindex).sort((a, b) => a.meta.path.localeCompare(b.meta.path));
writeFileSync(join(ROOT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${indexable.map(({ meta }) => `  <url>
    <loc>${SITE.url}${meta.path}</loc>
    <lastmod>${TODAY}</lastmod>
    <priority>${(meta.priority ?? 0.8).toFixed(1)}</priority>${meta.path === '/' ? `
    <image:image><image:loc>${SITE.url}/assets/seo/og-image.png</image:loc></image:image>` : ''}
  </url>`).join('\n')}
</urlset>
`);

console.log(`Built ${pages.length} pages (${indexable.length} in sitemap). css v=${CSS_V} js v=${JS_V}`);
