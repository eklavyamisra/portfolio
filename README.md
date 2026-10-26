# Turning Wave website

Static multi-page site for turningwave.in. The HTML pages in the root are generated. Edit the sources in `_src/`, not the generated files.

```
node _src/build.mjs
```

- `_src/pages/**.html` holds the page bodies. Each one starts with a JSON comment containing the title, description, keywords, breadcrumbs, hero text and FAQ.
- `_src/data.mjs` holds the services, industry landing pages and work items.
- `_src/build.mjs` holds the shared layout (head/SEO meta, JSON-LD schema, nav and footer). It also writes `sitemap.xml`.
- `css/style.css` and `js/main.js` are hand-written. The build adds a content hash to their URLs so caches stay fresh.

Commit the generated files along with the sources.
