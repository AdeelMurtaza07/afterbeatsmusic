# afterbeatsmusic — Project Context

A 4-page static site rebranded from `7clouds.org` (the reference design) as **afterbeatsmusic**. Pure HTML/CSS/JS — no build step, no framework, no package.json. Open any `.html` file in a browser and it just works.

---

## Tech stack

| Concern | Library | Source |
|---|---|---|
| Animation | GSAP 3.12.5 + ScrollTrigger | jsdelivr CDN |
| Smooth scroll | Lenis 1.1.14 | jsdelivr CDN |
| Page transitions | Barba.js 2.9.7 | jsdelivr CDN |
| Typography | Switzer (400–900) | Fontshare CDN |
| 3D Hall of Fame | CSS 3D transforms (no Three.js) | hand-rolled |

All libraries load via `<script src=...>` tags at the bottom of each page. The site is fully static — drop it on any host or open the files directly.

---

## File map

```
d:/PO/afterbeatsmusic/
├── index.html            home — hero + sections
├── hall-of-fame.html     Top 20 — 3D interior-sphere viewer
├── articles.html         curated articles + sort
├── contact.html          centered hero + 3 contact tiles
├── css/
│   └── style.css         single stylesheet, ~2050 lines
├── js/
│   └── main.js           single JS file with init* functions
├── images/               20 album thumbnails (.jpg)
└── PROJECT_CONTEXT.md    this file
```

---

## Pages

### 1. `index.html` — Home

Sections, top-to-bottom:

1. **Hero (`.kaitonote-spotlight`)** — 100vh, centered headline ("Late nights. Deep feels. Your sound.") with 8 album-cover tiles flying in from Z and floating around the headline. **Not pinned** to scroll — see the spotlight fix note below.
2. **Brand intro** — `.brand-intro` ("A decade of hand-picked sound.")
3. **Stats strip** — 4 stats (47B+ Fans, 7,000+ Releases, 24/7 Talent Search, 45M YT Subs)
4. **Trusted-by scroller** — infinite horizontal marquee of label names
5. **Channels** (`#channels`) — National (16 tiles) + Genre (20 tiles) grids
6. **Artist Gallery** (`#artists`) — 20 gradient tiles (`.ag-1`…`.ag-20`)
7. **Growth Timeline** — "From a bedroom in 2013 → 45 million in 2026" (gradient text on line 2)
8. **Submit Demo** (`#submit`) — full form with validation
9. **Team** (`#team`) — 9 avatars + "+33"
10. **Final CTA** — "Ready to find your new favorite sound?" + 2 buttons

### 2. `hall-of-fame.html` — Top 20 (3D interior sphere)

- Stats bar (`.hof-stats-bar`): "afterbeatsmusic · Top 20 Hall of Fame · 129.5M combined views"
- `.hof-sphere-viewer` (full viewport minus nav/stats)
  - `.hof-camera` — rotated by drag
  - 20 `.hof3d-card` elements, each with a real album thumbnail as `background-image`
  - `.hof-stars` (background pinpoints), `.hof-vignette-soft`, `.hof-hint` ("Click & drag to look around")

The 20 cards use the JPGs in `images/`. Card data (title, artist, view count) is parsed straight from the filenames.

### 3. `articles.html`

- Hero with "Curated Articles & Spotlight" + sort buttons (Recommended / Latest / Oldest)
- 12 article cards in a grid, 3 with "Featured" badges
- `data-date` attributes drive the sort
- Pagination (1, 2, 3, Next →)

### 4. `contact.html`

- 100vh hero — `"Let's become friends! :)"` — flex-centered both axes, animated CSS background (radial gradient layers panning) behind
- 3 contact tiles overlapping the hero bottom (Press, Demo, Instagram)
- Team section below

---

## Architecture notes

### CSS design system (top of `style.css`)

CSS custom properties define the palette and easing:
- Colors: `--black`, `--black-rich`, `--white-soft`, `--white-faded`, `--white-dim`
- Glass: `--glass-light`, `--glass-med`
- Borders: `--border-subtle`, `--border-med`, `--border-strong`
- Easing: `--ease-out`
- Layout: `--nav-h`, `--radius-sm/md/lg/full`

Dark theme throughout (`#000`, `#0a0a0a`, `#1a1a1a`). Switzer at `letter-spacing: -0.04em` for headlines.

### JS structure (`main.js`)

A flat list of `init*` functions, all called from `initPageScripts()` which runs on `DOMContentLoaded` and again after each Barba page transition. Each `init*` is a no-op if its target elements aren't on the current page.

Key functions:
- `initSpotlight()` — home hero entrance + float loop
- `initHofSphere()` — Hall of Fame 3D sphere + drag controls
- `initScrollReveal()` — IntersectionObserver-driven `[data-animate-fade-in]`
- `initSlideInFromBottom()` — for contact tiles
- `initParagraphReveal()` — for the contact hero heading
- `initAvatarAnimations()` — team avatar entrance + float
- `initDemoForm()` — submit-demo form validation
- `initArticlesSort()` — articles page sort buttons
- `initBarba()` — page transitions (crossfade overlay)

---

## Notable fixes & decisions

### Homepage was rendering "80% blank black"

**Cause:** the original spotlight section was a pinned ScrollTrigger holding the hero for ~6600px (~7 screen heights) of scroll, with images at `opacity: 0` between key timeline beats. The pinned scroll meant most of the page's visible scroll budget was a black hero with nothing in it.

**Fix:** removed the pin entirely. The hero is now a normal 100vh block. On load, 8 album covers fly in from `z: -2000`, settle into a ring around the headline, and drift gently forever. All sections below scroll naturally.

See `initSpotlight()` in [main.js](js/main.js).

### Spotlight images weren't centered (transform conflict)

The CSS used `transform: translate(-50%, -50%) translateZ(-2000px)` for centering. GSAP overwrites the entire transform matrix when it sets `z`/`scale`, wiping the `-50%/-50%` centering. Result: images positioned from their top-left corner at the center point.

**Fix:** removed the CSS transform. GSAP now sets `xPercent: -50, yPercent: -50` (which it tracks separately and preserves across other transform updates) plus `transformPerspective: 1100` on each image (so we don't need `preserve-3d` on the parent and don't conflict with `overflow: hidden`).

### Hall of Fame rebuilt as interior sphere

Originally a flat grid of 25 cards. Replaced with a CSS-3D interior-sphere viewer:

- Each card transform: `rotateY(var(--ry)) rotateX(var(--rx)) translateZ(-680px)`
- Math: that places the card at position `-680 × normal` while its face normal still points back toward origin. From the camera at origin, you see the front of the card with text reading correctly.
- 4 rings × 5 columns = 20 slots:
  - `phi = -45 + ring × 30` → -45°, -15°, +15°, +45°
  - `theta = (col − 2) × 72 + ring × 18` → -144°…+144°, 18° offset per ring so rings don't perfectly stack
- `.hof-camera` parent gets `rotateX(pitch) rotateY(yaw)` updated by mouse/touch drag
- Pitch clamps at ±55°, yaw is unbounded
- Idle auto-rotation kicks in 1.5s after the last drag (~4°/sec)

See `initHofSphere()` in [main.js](js/main.js#L527) and the `.hof-sphere-*` / `.hof3d-*` rules at the bottom of [style.css](css/style.css).

### Hall of Fame card data

Each card's content (title, artist, view count) and `background-image` come from the filenames in `images/`. To swap thumbnails or rerank: edit the inline `style="background-image:url(...)"` and the `.hof3d-rank` / `.hof3d-title` / `.hof3d-artist` text on each card in [hall-of-fame.html](hall-of-fame.html#L105). The `data-ring` / `data-col` attributes determine sphere position.

Filenames with apostrophes (e.g. `Won't`, `Can't`) are written as `&#39;` in the URL string so the surrounding single-quoted `url('...')` doesn't terminate early. The Rihanna "Breakin' Dishes" file uses an **en-dash (–)** in its name, not a hyphen — preserved verbatim.

### Contact hero was misaligned

Original hero used `align-items: flex-end; padding-bottom: 80px` — the heading sat at the bottom-left. Changed to `align-items: center; justify-content: center; text-align: center` and made the hero a full 100vh with `min-height: 640px`. Heading is now centered both axes.

The "video" background is a CSS-only animated gradient stack (`.contact-video-sim`) — three layered radial gradients with a slow pan animation. There's no real video file. The element was already named `contact-video-bg` because the markup also supports a `<video>` element if you ever want to drop one in (`.contact-video-bg video` rule already styles it for cover/40% opacity).

---

## Customization quick-reference

| To change... | Edit |
|---|---|
| Colors / spacing / typography | CSS custom properties at top of [style.css](css/style.css) |
| Hero headline copy | `.spotlight-intro h1` in [index.html](index.html) |
| Hero album positions | `positions[]` array in `initSpotlight()` in [main.js](js/main.js) |
| Hall of Fame cards | the 20 `.hof3d-card` divs in [hall-of-fame.html](hall-of-fame.html) |
| Hall of Fame sphere radius | `translateZ(-680px)` in `.hof3d-card` rule in [style.css](css/style.css) |
| Hall of Fame ring/col distribution | `phi`/`theta` formulas in `initHofSphere()` in [main.js](js/main.js) |
| Drag sensitivity | `0.28` multipliers in `onMove` inside `initHofSphere()` |
| Idle auto-rotate speed | `4 * dt` in the `tick` function inside `initHofSphere()` |
| Contact background | `.contact-video-sim` rule in [style.css](css/style.css), or drop a `<video>` into `.contact-video-bg` |
| Articles list | `.article-card` divs in [articles.html](articles.html) |

---

## Known limitations

- **No real video on contact page** — the "video" background is a CSS gradient. Drop a `<video autoplay muted loop playsinline>` inside `.contact-video-bg` to use a real one.
- **Hall of Fame uses `touch-action: none`** so the drag interaction works on touch devices. Page scroll is blocked while touching the sphere viewer specifically — that's intentional.
- **Card backface visibility is not hidden.** Cards on the far side of the sphere are visible through the camera region but very small and behind the text — visually fine. If you want to fully hide them, add `backface-visibility: hidden` to `.hof3d-card`, but be aware: in the inside-sphere geometry the face *does* always point at the camera, so they'd still show.
- **No build step / no minification.** Files are served as-is. Total JS is ~700 lines, CSS ~2050 lines.

---

## Boot sequence

1. Page loader (`#pageLoader`) shows the wordmark for ~200ms after `window.load`, then fades.
2. `initLenis()` sets up smooth scroll, hooks into GSAP ticker.
3. `initPageScripts()` runs every `init*` function. Each is defensive — bails if its target isn't on this page.
4. `initBarba()` registers crossfade transitions between pages and re-runs `initPageScripts()` on entry.

If GSAP, Lenis, or Barba fail to load, the site degrades gracefully — IntersectionObserver-driven reveals and form validation still work, just without the smooth-scroll/crossfade polish.
