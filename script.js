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
  positionFeaturedLabel();
  // Reposition meta if a gallery video is open (viewport dimensions may have changed)
  if (currentGalleryIndex >= 0 && lightboxMeta && lightboxMeta.style.display !== 'none') {
    const tile = tileRegistry[currentGalleryIndex];
    const { client, videoTitle } = parseVideoTitle(tile?.dataset.title || '');
    showLightboxMeta(client, videoTitle, currentVideoW, currentVideoH);
  }
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

const playBtn             = document.getElementById('playBtn');
const lightbox            = document.getElementById('lightbox');
const lightboxClose       = document.getElementById('lightboxClose');
const lightboxInner       = document.getElementById('lightboxInner');
const lightboxVimeo       = document.getElementById('lightboxVimeo');
const lightboxPrev        = document.getElementById('lightboxPrev');
const lightboxNext        = document.getElementById('lightboxNext');
const lightboxRibbon      = document.getElementById('lightboxRibbon');
const lightboxRibbonTrack = document.getElementById('lightboxRibbonTrack');
const lightboxMeta        = document.getElementById('lightboxMeta');
const ribbonPrev          = document.getElementById('ribbonPrev');
const ribbonNext          = document.getElementById('ribbonNext');
const bgVideo             = document.querySelector('.video-bg');

const RIBBON_BREAKPOINT = 1024; // px — ribbon only shows above this width

const SHOW_REEL_ID = '1174593058';
const LOOP_IDS     = new Set(['912665081']);
const RIBBON_H     = 157; // px — matches .lightbox__ribbon height in CSS

let currentGalleryIndex = -1;
let galleryIdsOrdered   = []; // reordered IDs matching DOM tile order
let tileRegistry        = []; // tile elements indexed by galleryIdsOrdered position
let lightboxEndCleanup  = null; // cleanup fn for the current finish-event listener
let currentVideoW       = 0;  // px width of the currently-open video frame
let currentVideoH       = 0;  // px height of the currently-open video frame

// ─── Vimeo player preloading ──────────────────────────────────────────────────
// On tile hover, a hidden iframe loads the Vimeo player in the background.
// On click, the iframe is moved into the lightbox and postMessage'd to play —
// no src reload, so the player starts instantly.
const PRELOAD_MAX = 3; // max hidden iframes to keep alive at once
const vimeoPreloads = new Map(); // videoId → { iframe, container, ready, onMessage }

function preloadVimeoPlayer(videoId) {
  if (vimeoPreloads.has(videoId)) return;

  // Evict oldest entry if at capacity
  if (vimeoPreloads.size >= PRELOAD_MAX) {
    const [oldestId, oldest] = vimeoPreloads.entries().next().value;
    window.removeEventListener('message', oldest.onMessage);
    oldest.container.remove();
    vimeoPreloads.delete(oldestId);
  }

  const loopParam = LOOP_IDS.has(videoId) ? '&loop=1' : '';
  const iframe = document.createElement('iframe');
  iframe.src = `https://player.vimeo.com/video/${videoId}?autoplay=0&color=ffffff&title=0&byline=0&portrait=0${loopParam}`;
  iframe.setAttribute('frameborder', '0');
  iframe.setAttribute('allow', 'autoplay; fullscreen; picture-in-picture');

  const container = document.createElement('div');
  container.setAttribute('aria-hidden', 'true');
  container.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;overflow:hidden;pointer-events:none;';
  container.appendChild(iframe);
  document.body.appendChild(container);

  const entry = { iframe, container, ready: false, onMessage: null };

  function onMessage(e) {
    if (e.source !== iframe.contentWindow) return;
    try {
      const data = JSON.parse(e.data);
      if (data.event === 'ready') {
        entry.ready = true;
        window.removeEventListener('message', onMessage);
      }
    } catch {}
  }

  entry.onMessage = onMessage;
  window.addEventListener('message', onMessage);
  vimeoPreloads.set(videoId, entry);
}

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

  // On wide screens the ribbon takes RIBBON_H from available height; offset the centering
  const ribbonActive = currentGalleryIndex >= 0 && window.innerWidth >= RIBBON_BREAKPOINT;
  const maxW = window.innerWidth  * 0.9;
  const maxH = window.innerHeight * 0.85 - (ribbonActive ? RIBBON_H : 0);
  let w, h;
  if (maxW / ar <= maxH) { w = maxW; h = maxW / ar; }
  else                   { h = maxH; w = maxH * ar; }

  lightboxInner.style.width  = `${w}px`;
  lightboxInner.style.height = `${h}px`;
  currentVideoW = w;
  currentVideoH = h;

  lightboxVimeo.innerHTML = '';

  // If a preload exists, discard it — its purpose was to warm the browser's cache.
  // Always open with autoplay=1 for reliable cross-browser playback.
  const preload = vimeoPreloads.get(videoId);
  if (preload) {
    window.removeEventListener('message', preload.onMessage);
    preload.container.remove();
    vimeoPreloads.delete(videoId);
  }

  const loop = LOOP_IDS.has(videoId) ? '&loop=1' : '';
  const theIframe = document.createElement('iframe');
  theIframe.src = `https://player.vimeo.com/video/${videoId}?autoplay=1&color=ffffff&title=0&byline=0&portrait=0${loop}`;
  theIframe.setAttribute('frameborder', '0');
  theIframe.setAttribute('allow', 'autoplay; fullscreen; picture-in-picture');
  lightboxVimeo.appendChild(theIframe);

  lightboxVimeo.classList.add('active');
  setupEndBehavior(videoId, theIframe, false);

  // Show meta below the frame for gallery videos; hide for show reel
  if (currentGalleryIndex >= 0) {
    const tile = tileRegistry[currentGalleryIndex];
    const { client, videoTitle } = parseVideoTitle(tile?.dataset.title || '');
    showLightboxMeta(client, videoTitle, w, h);
  } else {
    clearLightboxMeta();
  }
}

// ─── Below-frame meta (client + title) ────────────────────────────────────────
// Positioned by JS below the video frame; appears on end/paused screens only.

function showLightboxMeta(client, videoTitle, w, h) {
  if (!lightboxMeta || (!client && !videoTitle)) return;
  const ribbonActive = currentGalleryIndex >= 0 && window.innerWidth >= RIBBON_BREAKPOINT;
  const ribbonOffset = ribbonActive ? RIBBON_H + 10 : 0; // ribbon height + gap between ribbon and content
  const contentH  = window.innerHeight - ribbonOffset;
  const videoBottom = (contentH - h) / 2 + h; // px from top of viewport to bottom edge of video
  lightboxMeta.style.top   = `${videoBottom + 8}px`;
  lightboxMeta.style.left  = `${(window.innerWidth - w) / 2}px`;
  lightboxMeta.style.width = `${w}px`;
  lightboxMeta.innerHTML   = '';
  if (client) {
    const el = document.createElement('span');
    el.className   = 'lightbox__meta-client';
    el.textContent = client + ' —';
    lightboxMeta.appendChild(el);
  }
  if (videoTitle) {
    const el = document.createElement('span');
    el.className   = 'lightbox__meta-title';
    el.textContent = videoTitle;
    lightboxMeta.appendChild(el);
  }
  lightboxMeta.style.display = 'flex';
}

function clearLightboxMeta() {
  if (!lightboxMeta) return;
  lightboxMeta.style.display = 'none';
  lightboxMeta.innerHTML     = '';
}

// Shows end state when a gallery video finishes:
// thumbnail at 70% opacity + client/title overlay + PLAY VIDEO button
function showLightboxEndScreen() {
  if (!lightboxVimeo || currentGalleryIndex < 0) return;

  const tile      = tileRegistry[currentGalleryIndex];
  const fullTitle = tile?.dataset.title || '';
  const { client, videoTitle } = parseVideoTitle(fullTitle);
  const thumbSrc  = tile?.querySelector('img')?.src || '';
  const w = parseFloat(lightboxInner.style.width)  || 0;
  const h = parseFloat(lightboxInner.style.height) || 0;

  const screen = document.createElement('div');
  screen.className = 'lightbox__end-screen';

  if (thumbSrc) {
    const img = document.createElement('img');
    img.className = 'lightbox__end-thumb';
    img.src = thumbSrc;
    img.alt = fullTitle;
    screen.appendChild(img);
  }

  const overlay = document.createElement('div');
  overlay.className = 'lightbox__end-overlay';

  const replayBtn = document.createElement('button');
  replayBtn.className = 'lightbox__end-replay';
  replayBtn.setAttribute('aria-label', 'Play video again');
  replayBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/>
  </svg>`;
  replayBtn.addEventListener('click', () => {
    const id = galleryIdsOrdered[currentGalleryIndex];
    const ar = parseFloat(tile?.dataset.ar) || 16 / 9;
    setLightboxVideo(id, ar);
    updateRibbon();
  });

  overlay.appendChild(replayBtn);
  screen.appendChild(overlay);

  lightboxVimeo.innerHTML = '';
  lightboxVimeo.appendChild(screen);
  // Meta is already visible from when the video started playing — no reposition needed
}

// Shows a paused/preview screen when navigating to a new video within the lightbox.
// Same structure as the end screen but with a standard play button instead of replay.
function showLightboxPausedScreen(galleryIndex) {
  if (lightboxEndCleanup) { lightboxEndCleanup(); lightboxEndCleanup = null; }

  const tile      = tileRegistry[galleryIndex];
  const id        = galleryIdsOrdered[galleryIndex];
  const ar        = parseFloat(tile?.dataset.ar) || 16 / 9;
  const fullTitle = tile?.dataset.title || '';
  const { client, videoTitle } = parseVideoTitle(fullTitle);
  const thumbSrc  = tile?.querySelector('img')?.src || '';

  // Size the lightbox inner to match this video's aspect ratio
  const ribbonActive = window.innerWidth >= RIBBON_BREAKPOINT;
  const maxW = window.innerWidth  * 0.9;
  const maxH = window.innerHeight * 0.85 - (ribbonActive ? RIBBON_H : 0);
  let w, h;
  if (maxW / ar <= maxH) { w = maxW; h = maxW / ar; }
  else                   { h = maxH; w = maxH * ar; }
  lightboxInner.style.width  = `${w}px`;
  lightboxInner.style.height = `${h}px`;
  currentVideoW = w;
  currentVideoH = h;

  // Entire screen is the click target in paused state — clicking anywhere plays the video
  const screen = document.createElement('div');
  screen.className = 'lightbox__end-screen lightbox__end-screen--paused';
  screen.setAttribute('role', 'button');
  screen.setAttribute('aria-label', fullTitle ? `Play: ${fullTitle}` : 'Play video');
  screen.addEventListener('click', () => {
    setLightboxVideo(id, ar);
    updateRibbon();
  });

  if (thumbSrc) {
    const img = document.createElement('img');
    img.className = 'lightbox__end-thumb';
    img.src = thumbSrc;
    img.alt = fullTitle;
    screen.appendChild(img);
  }

  const overlay = document.createElement('div');
  overlay.className = 'lightbox__end-overlay';

  // Play icon — decorative; click is handled by the parent screen
  const playIcon = document.createElement('div');
  playIcon.className = 'lightbox__end-play';
  playIcon.setAttribute('aria-hidden', 'true');
  playIcon.innerHTML = `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <circle cx="32" cy="32" r="30" stroke="white" stroke-width="2.5"/>
    <path d="M26 21l18 11-18 11V21z" fill="white"/>
  </svg>`;

  overlay.appendChild(playIcon);
  screen.appendChild(overlay);

  lightboxVimeo.innerHTML = '';
  lightboxVimeo.appendChild(screen);
  lightboxVimeo.classList.add('active');

  // Show client + title below the video frame
  showLightboxMeta(client, videoTitle, w, h);
}

// Subscribes to Vimeo's 'finish' postMessage event for the active lightbox iframe.
// isAlreadyReady: true when the preloaded player already sent its 'ready' event.
function setupEndBehavior(videoId, iframe, isAlreadyReady) {
  if (lightboxEndCleanup) { lightboxEndCleanup(); lightboxEndCleanup = null; }
  if (LOOP_IDS.has(videoId) || currentGalleryIndex < 0) return;

  function onMessage(e) {
    if (e.source !== iframe.contentWindow) return;
    try {
      const data = JSON.parse(e.data);
      if (data.event === 'ready') {
        iframe.contentWindow.postMessage(
          JSON.stringify({ method: 'addEventListener', value: 'finish' }),
          'https://player.vimeo.com'
        );
      }
      if (data.event === 'finish') {
        showLightboxEndScreen();
        window.removeEventListener('message', onMessage);
      }
    } catch {}
  }

  window.addEventListener('message', onMessage);
  lightboxEndCleanup = () => window.removeEventListener('message', onMessage);

  // Player already past 'ready' — subscribe to finish immediately
  if (isAlreadyReady) {
    iframe.contentWindow.postMessage(
      JSON.stringify({ method: 'addEventListener', value: 'finish' }),
      'https://player.vimeo.com'
    );
  }
}

// ─── Video title helpers ───────────────────────────────────────────────────────
// Vimeo title convention: "Client Name, Video Title"
function parseVideoTitle(fullTitle) {
  if (!fullTitle) return { client: '', videoTitle: '' };
  const idx = fullTitle.indexOf(',');
  if (idx === -1) return { client: '', videoTitle: fullTitle.trim() };
  return {
    client: fullTitle.slice(0, idx).trim(),
    videoTitle: fullTitle.slice(idx + 1).trim(),
  };
}

function formatDuration(secs) {
  const s = Math.round(secs);
  const m = Math.floor(s / 60);
  const sec = String(s % 60).padStart(2, '0');
  // Drop leading "00:" for sub-minute videos
  return m === 0 ? sec : `${m}:${sec}`;
}

// ─── Lightbox ribbon ──────────────────────────────────────────────────────────

// Rebuild the ribbon filmstrip from current tileRegistry state.
// Rebuilt on every gallery open so AR/title/duration data is always fresh.
function buildRibbon() {
  if (!lightboxRibbonTrack) return;
  lightboxRibbonTrack.innerHTML = '';

  // Play button SVG for ribbon hover — slightly heavier circle stroke than gallery tiles
  const PLAY_SVG = `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <circle cx="32" cy="32" r="30" stroke="white" stroke-width="3"/>
    <path d="M26 21l18 11-18 11V21z" fill="white"/>
  </svg>`;

  galleryIdsOrdered.forEach((id, i) => {
    const tile      = tileRegistry[i];
    const fullTitle = tile?.dataset.title || '';
    const { client, videoTitle } = parseVideoTitle(fullTitle);
    const thumbSrc  = tile?.querySelector('img')?.src || '';
    const ar        = parseFloat(tile?.dataset.ar) || 16 / 9;
    const duration  = tile?.dataset.duration ? formatDuration(+tile.dataset.duration) : '';
    const tileW     = Math.round(RIBBON_H * ar); // proportional width at fixed 157px height

    const btn = document.createElement('button');
    btn.className = 'ribbon-tile';
    btn.style.width = `${tileW}px`;
    btn.setAttribute('aria-label', fullTitle ? `Play: ${fullTitle}` : `Play video ${i + 1}`);

    // Thumbnail image
    const img = document.createElement('img');
    img.src = thumbSrc;
    img.alt = fullTitle;
    btn.appendChild(img);

    // Hover overlay: play button centered only (no text overlays)
    const hover = document.createElement('div');
    hover.className = 'ribbon-tile__hover';

    const playWrap = document.createElement('div');
    playWrap.className = 'ribbon-tile__hover-play';
    playWrap.innerHTML = PLAY_SVG;
    hover.appendChild(playWrap);

    btn.appendChild(hover);

    // Active (now-playing) overlay — only text shown on this tile by default
    const playing = document.createElement('div');
    playing.className = 'ribbon-tile__playing';
    const label = document.createElement('span');
    label.textContent = 'NOW PLAYING';
    playing.appendChild(label);
    btn.appendChild(playing);

    // Click shows paused screen for the selected video (user must press Play to start)
    btn.addEventListener('click', () => {
      if (i === currentGalleryIndex) return;
      currentGalleryIndex = i;
      showLightboxPausedScreen(i);
      updateRibbon();
    });

    lightboxRibbonTrack.appendChild(btn);
  });

  // Set initial scroll button visibility after tiles are in the DOM
  requestAnimationFrame(updateRibbonNavButtons);
}

// Rebuild on every gallery open (ensures fresh AR/title data)
function ensureRibbon() {
  buildRibbon();
}

// Mark active tile; auto-scroll only if the active tile is not fully visible.
// Update prev/next arrow disabled state based on ribbon boundaries.
function updateRibbon() {
  if (!lightboxRibbonTrack) return;
  const tiles = lightboxRibbonTrack.querySelectorAll('.ribbon-tile');
  tiles.forEach((tile, i) => tile.classList.toggle('is-active', i === currentGalleryIndex));

  const active = lightboxRibbonTrack.querySelector('.ribbon-tile.is-active');
  if (active) {
    const trackLeft  = lightboxRibbonTrack.scrollLeft;
    const trackRight = trackLeft + lightboxRibbonTrack.clientWidth;
    const tileLeft   = active.offsetLeft;
    const tileRight  = tileLeft + active.offsetWidth;
    const fullyVisible = tileLeft >= trackLeft && tileRight <= trackRight;
    if (!fullyVisible) {
      const target = tileLeft - (lightboxRibbonTrack.clientWidth / 2) + (active.offsetWidth / 2);
      lightboxRibbonTrack.scrollTo({ left: target, behavior: 'smooth' });
    }
  }

  // Hide prev/next arrows at the left/right boundaries when ribbon is visible
  if (window.innerWidth >= RIBBON_BREAKPOINT) {
    lightboxPrev.classList.toggle('is-hidden', currentGalleryIndex <= 0);
    lightboxNext.classList.toggle('is-hidden', currentGalleryIndex >= galleryIdsOrdered.length - 1);
  } else {
    lightboxPrev.classList.remove('is-hidden');
    lightboxNext.classList.remove('is-hidden');
  }
}

function openVimeoLightbox(videoId, aspectRatio, galleryIndex) {
  currentGalleryIndex = galleryIndex !== undefined ? galleryIndex : -1;

  // Suspend scroll hint while show reel is open
  if (currentGalleryIndex < 0) {
    cancelScrollHintTimer();
    hideScrollHint();
  }

  if (currentGalleryIndex >= 0) {
    lightbox.classList.add('is-gallery');
    ensureRibbon();
  }

  setLightboxVideo(videoId, aspectRatio);

  lightbox.classList.add('is-open');
  pauseBgVideo();
  lockScroll();

  if (currentGalleryIndex >= 0) updateRibbon();
}

function navigateLightbox(direction) {
  if (currentGalleryIndex < 0) return;

  // On wide screens the ribbon is visible — no wrap at ends.
  // On narrow screens (no ribbon) wrap infinitely.
  const ribbonVisible = window.innerWidth >= RIBBON_BREAKPOINT;
  let next = currentGalleryIndex + direction;
  if (ribbonVisible) {
    next = Math.max(0, Math.min(galleryIdsOrdered.length - 1, next));
  } else {
    next = (next + galleryIdsOrdered.length) % galleryIdsOrdered.length;
  }
  if (next === currentGalleryIndex) return;
  currentGalleryIndex = next;

  showLightboxPausedScreen(currentGalleryIndex);
  updateRibbon();
}

function closeLightbox() {
  const wasShowReel = currentGalleryIndex < 0;
  lightbox.classList.remove('is-open', 'is-gallery');
  currentGalleryIndex = -1;
  if (lightboxEndCleanup) { lightboxEndCleanup(); lightboxEndCleanup = null; }

  lightboxVimeo.innerHTML = '';
  lightboxVimeo.classList.remove('active');
  clearLightboxMeta();

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

// Ribbon nav arrows scroll the filmstrip without affecting the active video
function scrollRibbon(direction) {
  if (!lightboxRibbonTrack) return;
  const amount = lightboxRibbonTrack.clientWidth * 0.75;
  lightboxRibbonTrack.scrollBy({ left: direction * amount, behavior: 'smooth' });
}
ribbonPrev.addEventListener('click', () => scrollRibbon(-1));
ribbonNext.addEventListener('click', () => scrollRibbon(1));

// Hide ribbon scroll buttons when the track is already at that edge
function updateRibbonNavButtons() {
  if (!lightboxRibbonTrack) return;
  const { scrollLeft, clientWidth, scrollWidth } = lightboxRibbonTrack;
  ribbonPrev.classList.toggle('is-hidden', scrollLeft <= 0);
  ribbonNext.classList.toggle('is-hidden', scrollLeft + clientWidth >= scrollWidth - 1);
}
lightboxRibbonTrack.addEventListener('scroll', updateRibbonNavButtons, { passive: true });

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
// function reorderForColumns(ids, numCols) {
//   if (numCols <= 1) return ids.slice();
//   const result = [];
//   for (let col = 0; col < numCols; col++) {
//     let row = 0;
//     while (true) {
//       const idx = row * numCols + col;
//       if (idx >= ids.length) break;
//       result.push(ids[idx]);
//       row++;
//     }
//   }
//   return result;
// }

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

  tile.addEventListener('mouseenter', () => preloadVimeoPlayer(id));
  tile.addEventListener('click', () => openVimeoLightbox(id, parseFloat(tile.dataset.ar), index));
  tile.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openVimeoLightbox(id, parseFloat(tile.dataset.ar), index); }
  });

  return tile;
}

const GALLERY_IDS = [
 '896584902',   // Powerade — Mathilde Gros "World Champ" [1:1]
 '912665081',   // Dick's Sporting Goods Baseball — Scoreboard Loop [9:16]
 '912784508',   // Checkers & Rally's — Baconpalooza [16:9]
 '1125613054',  // SAS Viya — Staying Late [16:9]
 '1150541356',  // TruGreen — Extra Free Time [9:16]
 '729270668',   // Sam's Club — Member's Mark [16:9]
 '478599962',   // AHA — Multiflavor [16:9]
 '1150541384',  // TruGreen — Water Hazard [9:16]
 '1151716586',  // AstraZeneca - AirSupra — Break Free [16:9]
 '912667614',   // Dick's Sporting Goods Softball — Ice Cold [9:16]
 '1149511962',  // Mazda — Superfans Episode 1: Jackie [16:9]
 '912697641',   // Dick's Sporting Goods Softball — Gloves Showcase [1:1]
 '1125613493',  // SAS Viya — Sacrifice [16:9]
 '918122530',   // Southern Company — Smart Energy [21:9]
 '896585894',   // Powerade — Tyler Wright "Comeback Queen" [1:1]
 '728884762',   // Sam's Club — Summer Shades [9:16]
 '912659432',   // Dick's Sporting Goods Baseball — Stealing 2nd [9:16]
 '597273338',   // Camp Sunshine — Intro [9:16]
 '330243510',   // Checkers & Rally's — Chill Stop [16:9]
 '896584419',   // Powerade — Harrie Lavreysen "Golden Wink" [1:1]
 '984475356',   // Wahl — What Are We Making? [16:9]
 '896584532',   // Powerade — Emma Twigg "Retireless" [1:1]
 '986568224',   // bp Earnify — Points Family [16:9]
 '896584706',   // Powerade — Alberto Abarza "Spirit of Sport" [9:16]
 '912054660',   // Cholula — La Familia [16:9]
 '918098215',   // Sam's Club — Back to the Club [16:9]
];

// Featured videos — appear in featured section; lead the navigation order.
// Nav order: 908389951 (index 0, left boundary) → 1125612501 → 1052404044 → then GALLERY_IDS → 918098215 (right boundary)
const FEATURED_IDS = ['908389951', '1125612501', '1052404044'];

// Fetches oEmbed metadata and populates a tile's image, title, and aspect ratio
function fetchTileMeta(tile, id) {
  fetch(`https://vimeo.com/api/oembed.json?url=https://vimeo.com/${id}&width=640`)
    .then(r => r.json())
    .then(data => {
      const img     = tile.querySelector('img');
      const titleEl = tile.querySelector('.gallery-tile__title');
      if (img && data.thumbnail_url) img.src = data.thumbnail_url;
      if (data.title) {
        tile.dataset.title = data.title;
        tile.setAttribute('aria-label', `Play: ${data.title}`);
        if (img) img.alt = data.title;
        if (titleEl) titleEl.textContent = data.title.split(',')[0].trim();
      }
      if (data.width && data.height) tile.dataset.ar = data.width / data.height;
      if (data.duration) tile.dataset.duration = data.duration;
    })
    .catch(() => {});
}

function loadGallery() {
  const grid = document.getElementById('galleryGrid');
  if (!grid) return;

  // Navigation order: featured tiles first (indices 0–2), then gallery tiles (indices 3+)
  galleryIdsOrdered = [...FEATURED_IDS, ...GALLERY_IDS];

  function renderAllTiles() {
    GALLERY_IDS.forEach((id, i) => {
      const navIndex = FEATURED_IDS.length + i; // gallery tiles start at index 3
      const tile = buildGalleryTile({ id, title: '', thumbnailUrl: '', ar: 16 / 9 }, navIndex);
      grid.appendChild(tile);
      tileRegistry[navIndex] = tile;
      fetchTileMeta(tile, id);
    });
  }

  // Trigger when #work section enters the viewport (e.g. user scrolls or clicks nav link).
  // rootMargin fires slightly before the section reaches the viewport so tiles are ready.
  const workSection = document.getElementById('work');
  if (!workSection) { renderAllTiles(); return; }

  const observer = new IntersectionObserver((entries) => {
    if (!entries[0].isIntersecting) return;
    observer.disconnect();
    renderAllTiles();
  }, { rootMargin: '200px' });

  observer.observe(workSection);
}

// ─── Featured section ─────────────────────────────────────────────────────────
// Builds the three featured tiles and registers them at the end of tileRegistry.
// Must be called after loadGallery() so galleryIdsOrdered is already set.
function loadFeatured() {
  const leftCol  = document.getElementById('featuredLeft');
  const rightCol = document.getElementById('featuredRight');
  if (!leftCol || !rightCol) return;

  // Featured tiles are at indices 0–2 in galleryIdsOrdered (they lead nav order).
  // Index 2 (1052404044) goes to leftCol = big right tile on desktop; 0 & 1 go to rightCol = stacked left.
  FEATURED_IDS.forEach((id, i) => {
    const navIndex = i;
    const tile = buildGalleryTile({ id, title: '', thumbnailUrl: '', ar: 16 / 9 }, navIndex);
    (i === 2 ? leftCol : rightCol).appendChild(tile);
    tileRegistry[navIndex] = tile;
    fetchTileMeta(tile, id);
  });

  // Position label after layout settles
  requestAnimationFrame(positionFeaturedLabel);
}

// Vertically centers the "WORK" label between the top edge of the right-column
// tile and the top edge of the first left-column tile (desktop only).
function positionFeaturedLabel() {
  const label = document.querySelector('.featured-label');
  if (!label) return;

  if (window.innerWidth <= 800) {
    label.style.top = '';
    return;
  }

  // featuredLeft (id) holds the single right-column tile; featuredRight holds the two left-column tiles
  const rightTile     = document.querySelector('#featuredLeft .gallery-tile');
  const leftFirstTile = document.querySelector('#featuredRight .gallery-tile');
  const rightCol      = document.getElementById('featuredLeft');
  if (!rightTile || !leftFirstTile || !rightCol) return;

  const colRect     = rightCol.getBoundingClientRect();
  const rightTileY  = rightTile.getBoundingClientRect().top  - colRect.top;
  const leftTileY   = leftFirstTile.getBoundingClientRect().top - colRect.top;
  const centerY     = (rightTileY + leftTileY) / 2;

  label.style.top = (centerY - label.offsetHeight / 2) + 'px';
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
  loadFeatured();
});

// Re-cache after all resources load — SVG image dimensions may not be settled
// at DOMContentLoaded, which would shift the flexbox-centered hero layout.
window.addEventListener('load', () => {
  initElementTops();
  updateLogoTransition();
  positionFeaturedLabel();
});
