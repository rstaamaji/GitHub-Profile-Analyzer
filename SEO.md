# SEO & Deployment Checklist — GitHub Profile Analyzer

This document explains the current SEO implementation, its limitations, and the exact steps required to complete metadata setup after deployment.

---

## Current Implementation

### `index.html` — Static HTML Metadata

| Tag | Status | Value |
|---|---|---|
| `<title>` | ✅ Done | `GitHub Profile Analyzer \| Developer Intelligence` |
| `meta description` | ✅ Done | 160-char accurate summary |
| `meta keywords` | ✅ Done | Relevant developer tool terms |
| `meta author` | ✅ Done | `GitHub Profile Analyzer` |
| `meta theme-color` | ✅ Done | `#0d1117` (dark background) |
| `meta color-scheme` | ✅ Done | `dark` |
| `og:type` | ✅ Done | `website` |
| `og:site_name` | ✅ Done | `GitHub Profile Analyzer` |
| `og:title` | ✅ Done | Matches `<title>` |
| `og:description` | ✅ Done | Matches `meta description` |
| `og:locale` | ✅ Done | `en_US` |
| `twitter:card` | ✅ Done | `summary` (text-only, no image) |
| `twitter:title` | ✅ Done | Matches `<title>` |
| `twitter:description` | ✅ Done | Matches description |
| `rel=preconnect` | ✅ Done | `api.github.com`, `avatars.githubusercontent.com` |
| `rel=dns-prefetch` | ✅ Done | Same origins as preconnect |
| `rel=manifest` | ✅ Done | `/site.webmanifest` |
| `msapplication-config` | ✅ Done | `/browserconfig.xml` |
| `og:url` | ⏳ Pending | Needs deployment URL |
| `og:image` | ⏳ Pending | Needs hosted PNG |
| `twitter:card summary_large_image` | ⏳ Pending | Needs `og:image` first |
| `rel=canonical` | ⏳ Pending | Needs deployment URL |

### Public Assets

| File | Status | Purpose |
|---|---|---|
| `public/favicon.svg` | ✅ Exists | SVG favicon (all modern browsers) |
| `public/og-image.svg` | ✅ Exists | Source artwork for OG preview image |
| `public/site.webmanifest` | ✅ Exists | PWA / Add to Home Screen metadata |
| `public/browserconfig.xml` | ✅ Exists | Windows/Edge tile color |
| `public/robots.txt` | ✅ Exists | Crawler permissions |
| `public/og-preview.png` | ❌ Missing | Required for `og:image` (export from SVG) |

---

## SPA SEO Limitations

This application is a **client-side SPA (React + Vite)**. This means:

1. **Static metadata only** — All `<meta>` tags in `index.html` are the same for every URL. When a user shares a link to a specific developer profile, social crawlers will show the generic app description, not that developer's name or stats.

2. **Social crawlers cannot execute JavaScript** — Facebook, Twitter/X, LinkedIn, WhatsApp, and Slack all read only the raw HTML returned from the server. They will never see content rendered by React.

3. **Googlebot can crawl SPAs** — Google uses "delayed crawling" for JS-rendered content. It will eventually index the app, but individual profile pages won't have unique titles or descriptions in search results.

### What would fix this (trade-offs)

| Solution | Benefit | Cost |
|---|---|---|
| Server-Side Rendering (SSR) with Vite SSR or a meta framework | Per-page metadata, correct social previews | Major architectural change; requires a Node.js server |
| React Helmet Async | Updates `<title>` and `<meta>` client-side | Works for Googlebot; still invisible to social crawlers |
| Pre-rendering / Static Site Generation | Fast crawling for known routes | Only practical for static routes, not dynamic `/user/:name` |
| None (current) | Zero infrastructure cost | Generic preview on social sharing |

For a developer tool with no login requirement and a public GitHub repo, the current approach is appropriate.

---

## Post-Deployment Checklist

Complete these steps once the app is deployed to a domain:

### Step 1 — Generate OG Preview Image

The OG image must be a **JPEG or PNG** at **1200×630px**. SVG is not supported by social crawlers.

```bash
# Option A: Use a browser to screenshot og-image.svg
# Open public/og-image.svg in Chrome → DevTools → capture at 1200x630

# Option B: Use Inkscape CLI
inkscape public/og-image.svg --export-png=public/og-preview.png --export-width=1200 --export-height=630

# Option C: Use ImageMagick
magick -size 1200x630 public/og-image.svg public/og-preview.png
```

### Step 2 — Update `index.html`

Uncomment and fill in the following blocks in `index.html`:

```html
<!-- Canonical URL -->
<link rel="canonical" href="https://YOUR_DOMAIN/" />

<!-- Open Graph image and URL -->
<meta property="og:url" content="https://YOUR_DOMAIN/" />
<meta property="og:image" content="https://YOUR_DOMAIN/og-preview.png" />
<meta property="og:image:secure_url" content="https://YOUR_DOMAIN/og-preview.png" />
<meta property="og:image:type" content="image/png" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:image:alt" content="GitHub Profile Analyzer — developer intelligence dashboard" />

<!-- Twitter large image card -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:image" content="https://YOUR_DOMAIN/og-preview.png" />
<meta name="twitter:image:alt" content="GitHub Profile Analyzer — developer intelligence dashboard" />
```

### Step 3 — Update `public/robots.txt`

Add the sitemap URL at the bottom:

```
Sitemap: https://YOUR_DOMAIN/sitemap.xml
```

### Step 4 — Validation Tools

After updating, validate metadata with:

| Tool | URL | What it checks |
|---|---|---|
| Facebook Sharing Debugger | https://developers.facebook.com/tools/debug/ | OG tags, image preview |
| Twitter Card Validator | https://cards-dev.twitter.com/validator | Twitter card render |
| LinkedIn Post Inspector | https://www.linkedin.com/post-inspector/ | LinkedIn preview |
| Google Rich Results Test | https://search.google.com/test/rich-results | Structured data |
| PageSpeed Insights | https://pagespeed.web.dev/ | Performance + SEO score |

### Step 5 — Google Search Console

1. Go to https://search.google.com/search-console
2. Add your domain as a property
3. Verify ownership (DNS TXT record or HTML file in `/public`)
4. Submit the homepage URL for indexing

---

## Apple-Touch-Icon (Optional)

For "Add to Home Screen" on iOS Safari, a **PNG** apple-touch-icon is preferred (180×180px). Currently not available — generate it from `favicon.svg` if needed:

```html
<!-- Add to index.html <head> after manifest link -->
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
```

Then add `apple-touch-icon.png` (180×180 PNG) to `/public`.
