# CLAUDE.md — Video Portfolio Website
# Gideon Cohen | Creative Producer | Atlanta, GA

## Project Purpose
A personal video portfolio site for a content producer. Static, no backend.
No e-commerce, no user accounts, no CRM, no commenting, no social login.
Goal: present video work beautifully and let visitors browse/watch easily.

---

## Current Status
The home page is functional. All known bugs from initial development have been resolved:
- Logo scroll transition (hero ↔ nav handoff) — working
- Background video — working (local `.mp4` at `video/video-bg.mp4`)
- Show reel lightbox — working (Vimeo iframe via `openVimeoLightbox()`, ID `1174593058`)
- Gallery tile titles on hover — working
- Lightbox prev/next navigation — working

**Next up:** populate the gallery with 45 videos in a specific order, then migrate to GitHub + staging server.

---

## Stack
- **HTML**: Vanilla HTML5, semantic elements throughout
- **CSS**: Custom CSS in `style.css` — CSS variables, no Tailwind
- **Interactivity**: Vanilla JavaScript in `script.js` — no frameworks, no build step
- **Video**: Vimeo embeds — oEmbed API for thumbnails/titles, iframe player for playback
- **Fonts**:
  - Adobe Typekit kit `myb6dzy`: `<link rel="stylesheet" href="https://use.typekit.net/myb6dzy.css">`
  - UI / nav / labels / hero: `--font-family: 'Prompt', sans-serif` (Google Fonts)
  - Body copy: `--font-body: 'aptos-display', sans-serif` (Typekit)
- **No build step** — no npm, no bundler, no TypeScript, no React, no Alpine.js

---

## File Structure
```
/
├── index.html          # Main page — hero + gallery
├── style.css           # All CSS
├── script.js           # All JS
├── video/
│   └── video-bg.mp4    # Background hero video (local file)
└── images/
    ├── logos/          # SVG logo variants (see Logo System below)
    ├── icons/          # play-overlay-white.svg, linkedin.png, vimeo.png, envelope.png
    └── favicon/        # favicon.ico
```

Do not reorganize this file structure unless explicitly asked.

---

## CSS Variables (in `style.css` `:root`)
```css
--nav-height: 100px;
--font-family: 'Prompt', sans-serif;      /* UI, nav, hero */
--font-body: 'aptos-display', sans-serif; /* body copy */
--color-bg: #000;
--color-text: #fff;
--transition-fast: 0.3s ease;
--color-blue: #0f2557;                    /* mobile menu background */
--color-hover: #aab3cb;                   /* nav hover + lightbox close button */
```

When adding new variables, append to `:root`. Do not rename existing variables.

---

## Page Structure (`index.html`)
Do not change this layout order:
1. `<header class="site-header">` — fixed nav with logo + hamburger
2. `.mobile-menu#mobileMenu` — fullscreen slide-down mobile nav
3. `<video class="video-bg">` — fixed background video (local mp4, autoplay/muted/loop)
4. `<main>`:
   - `.video-hero#hero` — fullscreen hero: logo, subline, play button
   - `.gallery#work` → `.gallery-grid#galleryGrid` — JS-rendered video tiles
5. `<footer>` — social icons
6. `.lightbox#lightbox` — Vimeo iframe lightbox with prev/next arrows
7. `.scroll-hint#scrollHint` — animated scroll arrow (shown once per session)

---

## Navigation — DO NOT CHANGE
- `.site-header` fixed, full-width, `z-index: 9999`
- Adds `.has-bg` class (semi-transparent black) when scrolled past hero
- `.nav-container`: max-width 1440px, `padding: 1.25rem 3rem`
- Logo left (`#logo-primary`): starts `opacity: 0`, JS fades it in on scroll
- Nav right: `.nav-links` (Work / About / Contact) + `.hamburger`
- Mobile breakpoint: `800px`
- **Do not touch nav HTML or CSS unless explicitly asked**

## Mobile Menu — DO NOT CHANGE
- Slides down from `top: -100vh` → `top: 0` on `.active`
- Background: `var(--color-blue)` (`#0f2557`)
- Body class sequence: `menu-opening` → `menu-open` → `menu-active`
- **Do not touch mobile menu HTML or CSS unless explicitly asked**

---

## Logo System
Three SVG variants in `images/logos/`:
```
gbz_full_cp_revhorz_h90x.svg   — white horizontal — desktop hero
gbz_full_cp_revstack_h90x.svg  — white stacked    — mobile hero + nav (all scroll states)
gbz_full_cp_stack_h90x.svg     — dark stacked     — available but not currently used
```
`getHeroLogoSrc()` and `getHeaderLogoSrc()` in `script.js` control which variant loads.
Do not hardcode logo `src` values — always use the getter functions.
`getHeaderLogoSrc()` currently always returns the white stacked variant (all sections are dark).

---

## Hero Scroll System (`script.js`)
This system is working correctly — do not refactor without a clear reason.

Key functions:
- `initElementTops()` — caches doc-top positions of `.video-hero__logo-wrap`, `.video-hero__subline`, `#playBtn`. Called at `DOMContentLoaded` and `load` (twice, because SVG layout may shift).
- `elementFadeProgress(docTop, rangeScale)` — returns 0→1 fade progress. Fade starts when element's top reaches the hero logo rest position; ends when it reaches the nav bottom.
- `updateLogoTransition()` — applies opacity/transform to all hero elements + nav logo. Nav logo is the exact mirror of hero logo.
- `updateHeaderBg()` — toggles `.has-bg` on header when scrolled past hero.
- `onScroll()` — RAF-throttled, calls all three update functions.
- `debouncedResize()` — 100ms debounced, re-caches element positions then updates.

Mobile logo completes its crossfade 25% sooner (`heroScale = 0.75`) because the stacked variant is taller relative to the viewport.

---

## Lightbox
Single mode — always a Vimeo iframe. The old `<video>` element approach has been removed.

Key functions:
- `openVimeoLightbox(videoId, aspectRatio, galleryIndex)` — opens lightbox. If `galleryIndex` is provided, adds `.is-gallery` class to enable prev/next arrows.
- `setLightboxVideo(videoId, aspectRatio)` — calculates dimensions (fits within 90vw × 85vh), injects iframe.
- `navigateLightbox(direction)` — advances through `GALLERY_IDS` array, wraps around.
- `closeLightbox()` — tears down iframe, restores scroll, resumes bg video.

Show reel: `openVimeoLightbox('1174593058', 16/9)` — no gallery index, so no arrows.
Backdrop clicks do NOT close the lightbox — only the close button or ESC key.
Keyboard: ESC closes, ArrowLeft/ArrowRight navigates.

Close button (`.lightbox__close`): two `<span>` X, positioned `top: -2.25rem; right: 0`.
**This is the design reference for any other dismiss/close buttons on the site.**

Scroll hint: pauses while show reel is open; resumes 2s after closing.

---

## Gallery
Videos defined as `GALLERY_IDS` array of Vimeo ID strings in `script.js`.
Currently 8 videos — **expanding to 45 videos is the next task.**

`loadGallery()`:
- Builds all tiles immediately (blank thumbnails) so grid renders without waiting for network
- Fetches oEmbed metadata in parallel (thumbnail, title, aspect ratio) and populates tiles
- Tiles are built by `buildGalleryTile({ id, title, thumbnailUrl, ar }, index)`

Grid layout: CSS `columns: 4` (masonry-style, not fixed grid). Tiles are not forced to square — they render at their natural aspect ratio. Mobile: 2 columns at `800px`, 1 column at `480px`.

Tile hover: image scales + dims, play icon fades in, title fades up from bottom gradient.

### Video data — current shape
```js
const GALLERY_IDS = [
  '1151716586',
  '1052403680',
  // ... array of Vimeo ID strings
];
```
Aspect ratios are resolved at runtime via oEmbed — no need to hardcode them.

### Future: richer metadata
If categories, tags, client names, or filtering are needed later, migrate to `data/videos.js`:
```js
window.VIDEOS = [
  {
    id: "slug",
    title: "string",
    description: "string",
    vimeoId: "string",
    category: "string",
    tags: ["string"],
    year: "string",
    client: "string"   // optional
  }
]
```

---

## Vimeo Integration
Embed URL: `https://player.vimeo.com/video/{id}?autoplay=1&color=ffffff&title=0&byline=0&portrait=0`
oEmbed: `https://vimeo.com/api/oembed.json?url=https://vimeo.com/{id}&width=640`
Returns: `thumbnail_url`, `title`, `width`, `height`

---

## Scroll Hint
`.scroll-hint#scrollHint` — bouncing chevron arrow, fixed bottom-center.
- Shows once per browser session (via `sessionStorage` flag `scrollHintShown`)
- Appears after 5s idle on first load, or 2s after closing the show reel
- Hides immediately on any scroll; never shows again in the same session
- Do not remove or alter this behavior unless asked

---

## Behavior Rules
- `loading="lazy"` on all `<img>` tags
- All interactive elements need `aria-label` attributes
- Focus rings: `.gallery-tile:focus` removes outline; `.gallery-tile:focus-visible` shows `--color-hover` outline
- No lorem ipsum — use realistic video/film titles
- Pagination is the default for any future multi-page gallery — not infinite scroll (unless asked)

---

## What NOT to Do
- Do NOT add npm, a bundler, or a build step
- Do NOT introduce React, Vue, Alpine.js, or any JS framework
- Do NOT use TypeScript
- Do NOT add Tailwind
- Do NOT add auth, user accounts, a database, or a CMS unless explicitly asked
- Do NOT use inline styles — CSS classes and variables only
- Do NOT force gallery cards to uniform size — the masonry layout should breathe
- Do NOT use Inter, Roboto, or generic system-ui fonts
- Do NOT use purple gradients or generic "SaaS" aesthetics
- Do NOT rebuild existing files from scratch — edit what exists
- Do NOT rename or restructure existing CSS variables
- Do NOT change the nav, mobile menu, hero, scroll system, or lightbox without being explicitly asked

---

## When Building a New Feature
1. State which file(s) you will create or modify
2. Note any new external resources before adding them
3. Build it, then add a short comment explaining its purpose
4. If intent is unclear, ask ONE clarifying question before writing code

---

## Code Style
- Semantic HTML: `<section>`, `<article>`, `<nav>`, `<figure>`, `<time>` where appropriate
- CSS: new rules at bottom of `style.css` under a `/* === Section Name === */` header
- JS: new functions near related code; follow the `─────` section divider style
- No magic numbers — use CSS variables or named JS constants (`BREAKPOINT_MOBILE`, `SHOW_REEL_ID`)
- 2-space indent, single quotes in JS — match existing formatting exactly
