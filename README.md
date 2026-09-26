# Eklavya Mishra — Portfolio

Static site. No build step. GSAP + ScrollTrigger + Lenis load from CDN.

```
index.html
css/style.css
js/main.js
```

## Run locally

```bash
npx serve .
```

## Deploy

- **Vercel:** `npx vercel` in this folder (or drag the folder into vercel.com/new)
- **Netlify:** drag the folder onto app.netlify.com/drop
- **GitHub Pages:** push to a repo → Settings → Pages → deploy from `main`

## Before you share it

- [ ] Replace each project card's `href` (currently your GitHub profile) with the live demo or repo link.
- [ ] Optional: swap the CSS "art" in `.card__art` for real screenshots (`<img>` with `object-fit: cover`).
- [ ] Confirm the "24h reply time" stat in the About section is true for you, or change it.
- [ ] Add your LinkedIn / Upwork / Fiverr links in the Contact section.
- [ ] Remove the WhatsApp link if you don't want your number public.
- [ ] Add an `og-image.png` (1200×630) and `<meta property="og:image">` for nicer link previews.

## Editing

- Colors: `:root` tokens at the top of `css/style.css` (`--accent` is the orange).
- The "Send brief" form opens the visitor's email app with a pre-filled message (no backend needed).
- Respects `prefers-reduced-motion`, and falls back to a static page if the CDN scripts fail.
