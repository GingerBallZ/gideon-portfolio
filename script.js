// code v3.0
const BREAKPOINT_MOBILE = 845;

const logoPrimary = document.getElementById('logo-primary');
const logoHero    = document.getElementById('logo-hero');
const hamburger   = document.getElementById('hamburger');
const mobileMenu  = document.getElementById('mobileMenu');
const header      = document.querySelector('.site-header');
const heroSubline = document.querySelector('.video-hero__subline');
const heroSection = document.querySelector('.video-hero');
const logoWrap    = document.querySelector('.video-hero__logo-wrap');

let menuIsOpen = false;

// ─── Logo source helpers ─────────────────────────────────────────────────────

function getHeroLogoSrc() {
  return window.innerWidth <= BREAKPOINT_MOBILE
    ? 'images/logos/gbz_full_cp_revstack_h90x.svg'
    : 'images/logos/gbz_full_cp_revhorz_h90x.svg';
}

function getHeaderLogoSrc() {
  // All sections are dark — always use the reversed (white) stacked variant
  return 'images/logos/gbz_full_cp_revstack_h90x.svg';
}

function updateLogoSrcs() {
  const heroSrc   = getHeroLogoSrc();
  const headerSrc = getHeaderLogoSrc();
  if (logoHero    && !logoHero.src.includes(heroSrc))    logoHero.src    = heroSrc;
  if (logoPrimary && !logoPrimary.src.includes(headerSrc)) logoPrimary.src = headerSrc;
}

// ─── Scroll-based hero ↔ header logo transition ──────────────────────────────

// Document-top of each element = its viewport position at scrollY=0.
// heroLogoDocTop is the shared trigger: each element starts fading when its
// own top edge reaches this viewport position during scroll.
let heroLogoDocTop = null;
let sublineDocTop  = null;
let playBtnDocTop  = null;

// Measure via .video-hero__logo-wrap rather than #logo-hero directly, so that
// any translateY already applied to logoHero doesn't corrupt the reading.
function initElementTops() {
  if (logoWrap)    heroLogoDocTop = logoWrap.getBoundingClientRect().top    + window.scrollY;
  if (heroSubline) sublineDocTop  = heroSubline.getBoundingClientRect().top + window.scrollY;
  if (playBtn)     playBtnDocTop  = playBtn.getBoundingClientRect().top     + window.scrollY;
}

// Returns 0→1 fade-out progress for one element.
// Fade starts when element's viewport-top reaches heroLogoDocTop (hero logo rest position).
// Fade ends — opacity 0 — when element's viewport-top reaches the nav bottom.
// The range (heroLogoDocTop − navBottom) is the same for every element; only
// the start scroll position shifts depending on where each element sits in the page.
function elementFadeProgress(docTop, rangeScale = 1) {
  const navH        = header.offsetHeight;
  const range       = (heroLogoDocTop - navH) * rangeScale;
  if (range <= 0) return 1;
  const scrollStart = docTop - heroLogoDocTop;
  return Math.max(0, Math.min(1, (window.scrollY - scrollStart) / range));
}

function updateLogoTransition() {
  if (menuIsOpen || heroLogoDocTop === null) return;

  // Stacked logo (mobile) is taller relative to the viewport, so complete the
  // crossfade 25% sooner. Desktop horizontal logo uses the full range.
  const heroScale    = window.innerWidth <= BREAKPOINT_MOBILE ? 0.75 : 1;
  const heroProgress = elementFadeProgress(heroLogoDocTop, heroScale);

  // Nav logo: exact mirror of hero logo — fades in as hero logo fades out
  logoPrimary.style.opacity       = heroProgress;
  logoPrimary.style.pointerEvents = heroProgress > 0.05 ? 'auto' : 'none';

  // Hero logo: fades out and nudges upward
  if (logoHero) {
    logoHero.style.opacity   = 1 - heroProgress;
    logoHero.style.transform = `translateY(${heroProgress * -35}px)`;
  }

  // Subline: independent fade, starts when its top reaches hero logo rest position
  if (heroSubline && sublineDocTop !== null) {
    heroSubline.style.opacity = 1 - elementFadeProgress(sublineDocTop);
  }

  // Play button: independent fade, starts latest of the three
  if (playBtn && playBtnDocTop !== null) {
    const alpha = 1 - elementFadeProgress(playBtnDocTop);
    playBtn.style.opacity       = alpha;
    playBtn.style.pointerEvents = alpha < 0.1 ? 'none' : '';
  }
}

function updateHeaderBg() {
  const pastHero = window.scrollY > window.innerHeight - header.offsetHeight;
  header.classList.toggle('has-bg', pastHero);
}

// ─── Scroll / resize listeners ───────────────────────────────────────────────

function debounce(func, delay = 100) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
}

let rafPending = false;
function onScroll() {
  if (!rafPending) {
    rafPending = true;
    requestAnimationFrame(() => {
      updateLogoSrcs();
      updateLogoTransition();
      updateHeaderBg();
      rafPending = false;
    });
  }
}

const debouncedResize = debounce(() => {
  initElementTops();
  updateLogoSrcs();
  updateLogoTransition();
  updateHeaderBg();
});

window.addEventListener('scroll', onScroll, { passive: true });
window.addEventListener('resize', debouncedResize);

// ─── Mobile menu ─────────────────────────────────────────────────────────────

function toggleMobileMenu(open) {
  menuIsOpen = open;
  hamburger.classList.toggle('is-active', open);
  hamburger.setAttribute('aria-expanded', open.toString());

  if (open) {
    mobileMenu.classList.add('active');
    document.body.classList.add('menu-opening');
    document.body.style.overflow = 'hidden';

    setTimeout(() => {
      document.body.classList.remove('menu-opening');
      document.body.classList.add('menu-open');
    }, 10);

    setTimeout(() => {
      document.body.classList.add('menu-active');
    }, 200);

  } else {
    document.body.classList.remove('menu-active');

    setTimeout(() => {
      mobileMenu.classList.remove('active');
      document.body.classList.remove('menu-open');
      document.body.style.overflow = '';
      updateLogoSrcs();
      updateLogoTransition();
    }, 500);
  }
}

hamburger.addEventListener('click', () => {
  const isOpen = !mobileMenu.classList.contains('active');
  toggleMobileMenu(isOpen);
});

// ─── Lightbox ────────────────────────────────────────────────────────────────

const playBtn        = document.getElementById('playBtn');
const lightbox       = document.getElementById('lightbox');
const lightboxClose  = document.getElementById('lightboxClose');
const lightboxInner  = document.getElementById('lightboxInner');
const lightboxVimeo  = document.getElementById('lightboxVimeo');
const lightboxPrev   = document.getElementById('lightboxPrev');
const lightboxNext   = document.getElementById('lightboxNext');
const bgVideo        = document.querySelector('.video-bg');

const SHOW_REEL_ID = '1174593058';

let currentGalleryIndex = -1;

function pauseBgVideo() {
  if (bgVideo) bgVideo.pause();
}
function playBgVideo() {
  if (bgVideo) bgVideo.play();
}

function lockScroll() {
  document.body.style.overflow = 'hidden';
  document.documentElement.style.overflow = 'hidden';
}
function unlockScroll() {
  document.body.style.overflow = '';
  document.documentElement.style.overflow = '';
}

function setLightboxVideo(videoId, aspectRatio) {
  const ar = aspectRatio || 16 / 9;

  // Calculate dimensions fitting within 90vw × 85vh
  const maxW = window.innerWidth  * 0.9;
  const maxH = window.innerHeight * 0.85;
  let w, h;
  if (maxW / ar <= maxH) { w = maxW; h = maxW / ar; }
  else                   { h = maxH; w = maxH * ar; }

  lightboxInner.style.width  = `${w}px`;
  lightboxInner.style.height = `${h}px`;

  lightboxVimeo.innerHTML = `<iframe
    src="https://player.vimeo.com/video/${videoId}?autoplay=1&color=ffffff&title=0&byline=0&portrait=0"
    frameborder="0"
    allow="autoplay; fullscreen; picture-in-picture"
  ></iframe>`;
  lightboxVimeo.classList.add('active');
}

function openVimeoLightbox(videoId, aspectRatio, galleryIndex) {
  currentGalleryIndex = galleryIndex !== undefined ? galleryIndex : -1;

  // Suspend scroll hint while show reel is open
  if (currentGalleryIndex < 0) {
    cancelScrollHintTimer();
    hideScrollHint();
  }

  setLightboxVideo(videoId, aspectRatio);

  if (currentGalleryIndex >= 0) lightbox.classList.add('is-gallery');

  lightbox.classList.add('is-open');
  pauseBgVideo();
  lockScroll();
}

function navigateLightbox(direction) {
  if (currentGalleryIndex < 0) return;
  // Wrap around: last → first, first → last
  currentGalleryIndex = (currentGalleryIndex + direction + GALLERY_IDS.length) % GALLERY_IDS.length;

  const id   = GALLERY_IDS[currentGalleryIndex];
  const tile = document.querySelectorAll('.gallery-tile')[currentGalleryIndex];
  const ar   = parseFloat(tile?.dataset.ar) || 16 / 9;

  setLightboxVideo(id, ar);
}

function closeLightbox() {
  const wasShowReel = currentGalleryIndex < 0;
  lightbox.classList.remove('is-open', 'is-gallery');
  currentGalleryIndex = -1;

  lightboxVimeo.innerHTML = '';
  lightboxVimeo.classList.remove('active');

  lightboxInner.style.width  = '';
  lightboxInner.style.height = '';

  playBgVideo();
  if (!menuIsOpen) unlockScroll();

  // After closing show reel, give user 2s before showing scroll hint
  if (wasShowReel) scheduleScrollHint(2000);
}

playBtn.addEventListener('click', () => openVimeoLightbox(SHOW_REEL_ID, 16 / 9));
lightboxClose.addEventListener('click', closeLightbox);
lightboxPrev.addEventListener('click', () => navigateLightbox(-1));
lightboxNext.addEventListener('click', () => navigateLightbox(1));

// Backdrop clicks do nothing — only the close button or Escape key closes the lightbox

// Close on Escape; navigate on arrow keys
document.addEventListener('keydown', e => {
  if (!lightbox.classList.contains('is-open')) return;
  if (e.key === 'Escape')     closeLightbox();
  if (e.key === 'ArrowLeft')  navigateLightbox(-1);
  if (e.key === 'ArrowRight') navigateLightbox(1);
});

// ─── Gallery ─────────────────────────────────────────────────────────────────

// Converts a left-to-right row-ordered array into CSS columns column-first order.
// E.g. [1,2,3,4,5,6] with 2 cols → [1,3,5,2,4,6] so col1=[1,3,5], col2=[2,4,6]
function reorderForColumns(ids, numCols) {
  if (numCols <= 1) return ids.slice();
  const result = [];
  for (let col = 0; col < numCols; col++) {
    let row = 0;
    while (true) {
      const idx = row * numCols + col;
      if (idx >= ids.length) break;
      result.push(ids[idx]);
      row++;
    }
  }
  return result;
}

function buildGalleryTile({ id, title, thumbnailUrl, ar }, index) {
  const tile = document.createElement('div');
  tile.className = 'gallery-tile';
  tile.setAttribute('role', 'button');
  tile.setAttribute('tabindex', '0');
  tile.setAttribute('aria-label', title ? `Play: ${title}` : `Play video ${index + 1}`);
  tile.dataset.ar = ar || 16 / 9;

  const img = document.createElement('img');
  img.alt     = title || '';
  img.loading = 'lazy';
  if (thumbnailUrl) img.src = thumbnailUrl;
  tile.appendChild(img);

  const playWrap = document.createElement('div');
  playWrap.className = 'gallery-tile__play';
  playWrap.innerHTML = `
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="32" cy="32" r="30" stroke="white" stroke-width="2.5"/>
      <path d="M26 21l18 11-18 11V21z" fill="white"/>
    </svg>`;
  tile.appendChild(playWrap);

  const titleEl = document.createElement('div');
  titleEl.className = 'gallery-tile__title';
  if (title) titleEl.textContent = title;
  tile.appendChild(titleEl);

  tile.addEventListener('click', () => openVimeoLightbox(id, parseFloat(tile.dataset.ar), index));
  tile.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openVimeoLightbox(id, parseFloat(tile.dataset.ar), index); }
  });

  return tile;
}

const GALLERY_IDS = [
  '1150541356',  // TruGreen — Extra Free Time [9:16]
  '1125612501',  // SAS Viya — Freaking Out [16:9]
  '1052404044',  // TruGreen — Tea Time [16:9]
  '908389951',   // Mazda — One Word [16:9]
  '896584902',   // Powerade — Mathilde Gros "World Champ" [1:1]
  '912667614',   // Dick's Sporting Goods Softball — Product Assortment 01 [9:16]
  '1151716586',  // AstraZeneca - AirSupra — Break Free [16:9]
  '912662194',   // Dick's Sporting Goods Baseball — Bats Assortment [1:1]
  '372097235',   // Synovus — Game Time Starts Here [16:9]
  '729270668',   // Sam's Club — Member's Mark [16:9]
  '896584706',   // Powerade — Alberto Abarza "Spirit of Sport" [9:16]
  '1149511962',  // Mazda — Superfans Episode 1: Jackie [16:9]
  '912665081',   // Dick's Sporting Goods Baseball — Scoreboard Loop [9:16]
  '478598191',   // MedExpress — Urgent Caring [16:9]
  '372097175',   // Synovus — Drop The Puck Build The City [16:9]
  '918098215',   // Sam's Club — Back to the Club [16:9]
  '896585894',   // Powerade — Tyler Wright "Comeback Queen" [1:1]
  '1150541384',  // TruGreen — Water Hazard [9:16]
  '912697641',   // Dick's Sporting Goods Softball — Gloves Showcase [1:1]
  '912784508',   // Checkers & Rally's — Baconpalooza [16:9]
  '984475356',   // Wahl — What Are We Making? [16:9]
  '728884860',   // Sam's Club — Summer S'mores [9:16]
  '896584419',   // Powerade — Harrie Lavreysen "Golden Wink" [1:1]
  '1150541365',  // TruGreen — Patton's Bunker [9:16]
  '330243510',   // Checkers & Rally's — Chill Stop [16:9]
  '1125613054',  // SAS Viya — Staying Late [16:9]
  '728884461',   // Sam's Club — Summer Floating [9:16]
  '912663990',   // Dick's Sporting Goods Baseball — Glitch Setup [9:16]
  '896584532',   // Powerade — Emma Twigg "Retireless" [1:1]
  '478599962',   // AHA — Multiflavor [16:9]
  '1125613493',  // SAS Viya — Sacrifice [16:9]
  '912665244',   // Dick's Sporting Goods Softball — Swing Away [9:16]
  '912054660',   // Cholula — La Familia [16:9]
  '986568224',   // bp Earnify — Points Family [16:9]
  '912786798',   // bp Fuels — Keep It Going [16:9]
  '896585706',   // Powerade — Tyler Wright BTS [9:16]
  '912793086',   // Dick's Sporting Goods — Sports Matter Day Chicago [16:9]
  '918122530',   // Southern Company — Smart Energy [21:9]
  '912657016',   // Georgia Power — Here for Georgia [16:9]
  '409861382',   // French's — The Color of American Flavor [16:9]
  '728884672',   // Sam's Club — Summer Cookout [9:16]
  '912793376',   // Dick's Sporting Goods — Sports Matter Day Atlanta [16:9]
  '240327879',   // GameTap — Computer Lab [4:3]
  '240327853',   // GameTap — Tapped In [4:3]
  '240327769',   // GameTap — Pixelated and Debated [16:9]
];

async function loadGallery() {
  const grid = document.getElementById('galleryGrid');
  if (!grid) return;

  const numCols = window.innerWidth <= 480 ? 1 : window.innerWidth <= 800 ? 2 : 4;
  const ids = reorderForColumns(GALLERY_IDS, numCols);

  // Build all tiles immediately so the grid renders without waiting for oEmbed
  const tiles = ids.map((id, i) => {
    const tile = buildGalleryTile({ id, title: '', thumbnailUrl: '', ar: 16 / 9 }, i);
    grid.appendChild(tile);
    return { tile, id };
  });

  // Fetch oEmbed metadata in parallel to populate thumbnails, titles, and aspect ratios
  tiles.forEach(({ tile, id }) => {
    fetch(`https://vimeo.com/api/oembed.json?url=https://vimeo.com/${id}&width=640`)
      .then(r => r.json())
      .then(data => {
        const img     = tile.querySelector('img');
        const titleEl = tile.querySelector('.gallery-tile__title');
        if (img && data.thumbnail_url) img.src = data.thumbnail_url;
        if (data.title) {
          tile.setAttribute('aria-label', `Play: ${data.title}`);
          if (img) img.alt = data.title;
          if (titleEl) titleEl.textContent = data.title;
        }
        if (data.width && data.height) tile.dataset.ar = data.width / data.height;
      })
      .catch(() => {});
  });
}

// ─── Scroll hint ─────────────────────────────────────────────────────────────
// Shows a bouncing arrow after 10s idle, or 2s after closing the show reel.
// Fires at most once per browser session (sessionStorage flag).

const scrollHint      = document.getElementById('scrollHint');
const SCROLL_HINT_KEY = 'scrollHintShown';

let scrollHintTimer = null;
let scrollHintShown = !!sessionStorage.getItem(SCROLL_HINT_KEY);

function showScrollHint() {
  if (scrollHintShown) return;
  scrollHintShown = true;
  sessionStorage.setItem(SCROLL_HINT_KEY, '1');
  scrollHint.classList.add('is-visible');
}

function hideScrollHint() {
  scrollHint.classList.remove('is-visible');
}

function cancelScrollHintTimer() {
  clearTimeout(scrollHintTimer);
  scrollHintTimer = null;
}

function scheduleScrollHint(delay) {
  cancelScrollHintTimer();
  if (scrollHintShown) return;
  scrollHintTimer = setTimeout(showScrollHint, delay);
}

// Dismiss + mark shown on first scroll; hide animation if already visible
window.addEventListener('scroll', () => {
  if (window.scrollY > 10 && !scrollHintShown) {
    cancelScrollHintTimer();
    scrollHintShown = true;
    sessionStorage.setItem(SCROLL_HINT_KEY, '1');
  }
  hideScrollHint();
}, { passive: true });

scheduleScrollHint(5_000);

// ─── Init ────────────────────────────────────────────────────────────────────

window.addEventListener('DOMContentLoaded', () => {
  initElementTops();
  updateLogoSrcs();
  updateLogoTransition();
  updateHeaderBg();
  loadGallery();
});

// Re-cache after all resources load — SVG image dimensions may not be settled
// at DOMContentLoaded, which would shift the flexbox-centered hero layout.
window.addEventListener('load', () => {
  initElementTops();
  updateLogoTransition();
});
