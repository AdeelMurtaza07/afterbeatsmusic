/* ============================================================
   afterbeatsmusic — Main JavaScript
   Stack: GSAP 3 + ScrollTrigger | Lenis | Barba.js
   ============================================================ */

'use strict';

/* ── Helpers ──────────────────────────────────────────────── */
const qs  = (sel, ctx = document) => ctx.querySelector(sel);
const qsa = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

/* ── GSAP plugin registration ─────────────────────────────── */
if (typeof gsap !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

/* ═══════════════════════════════════════════════════════════
   1.  LENIS SMOOTH SCROLL
   ═══════════════════════════════════════════════════════════ */
let lenis;

function initLenis() {
  if (typeof Lenis === 'undefined') return;

  lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smooth: true,
    smoothTouch: false,
  });

  if (typeof gsap !== 'undefined') {
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  } else {
    // Fallback RAF loop without GSAP
    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
  }
}

/* ═══════════════════════════════════════════════════════════
   2.  PAGE LOADER
   ═══════════════════════════════════════════════════════════ */
function initLoader() {
  const loader = qs('#pageLoader');
  if (!loader) return;

  const hide = () => {
    loader.style.transition = 'opacity 0.5s ease';
    loader.style.opacity    = '0';
    setTimeout(() => {
      loader.style.display       = 'none';
      loader.style.pointerEvents = 'none';
    }, 520);
  };

  if (document.readyState === 'complete') {
    setTimeout(hide, 200);
  } else {
    window.addEventListener('load', () => setTimeout(hide, 200));
  }

  // Absolute fallback after 3s
  setTimeout(hide, 3000);
}

/* ═══════════════════════════════════════════════════════════
   3.  NAVIGATION
   ═══════════════════════════════════════════════════════════ */
function initNav() {
  const nav    = qs('#masterNav');
  const toggle = qs('#navToggle');
  const mobile = qs('#mobileMenu');
  if (!nav) return;

  // Sticky scroll class
  const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 20);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Mobile hamburger toggle
  if (toggle && mobile) {
    toggle.addEventListener('click', () => {
      const open = mobile.classList.toggle('open');
      toggle.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', String(open));
      mobile.setAttribute('aria-hidden', String(!open));
      document.body.style.overflow = open ? 'hidden' : '';
    });

    // Close on any link click inside mobile menu
    qsa('a', mobile).forEach(link =>
      link.addEventListener('click', () => {
        mobile.classList.remove('open');
        toggle.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
        mobile.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
      })
    );
  }

  // Dynamic copyright year
  qsa('.copyright-year').forEach(el => {
    el.textContent = new Date().getFullYear();
  });
}

/* ═══════════════════════════════════════════════════════════
   4.  KAITONOTE SPOTLIGHT  — hero with floating 3D album covers
       Arranges 8 covers in a ring around the centered headline,
       plays a fly-in entrance on load, then gently floats forever.
       No scroll pinning — the hero is a normal 100vh block.
   ═══════════════════════════════════════════════════════════ */
function initSpotlight() {
  if (typeof gsap === 'undefined') return;

  const section = qs('.kaitonote-spotlight');
  if (!section) return;

  const imgs  = qsa('.spotlight-img', section);
  const intro = qs('#spotlightIntro');
  const outro = qs('#spotlightOutro');
  if (!imgs.length || !intro) return;

  // Final resting positions around the headline
  const positions = [
    { x: -440, y: -210, z:  -80, r: -10 },
    { x:  440, y: -220, z: -130, r:   9 },
    { x: -520, y:   40, z: -110, r:  -6 },
    { x:  520, y:   60, z:  -60, r:   7 },
    { x: -340, y:  260, z: -140, r:  -8 },
    { x:  340, y:  270, z:  -90, r:   6 },
    { x: -160, y: -300, z: -170, r:  -4 },
    { x:  180, y: -280, z: -150, r:   5 },
  ];

  gsap.set(imgs, {
    transformPerspective: 1100,
    xPercent: -50,
    yPercent: -50,
    x: 0, y: 0, z: -2000,
    opacity: 0,
    scale: 0.65,
    rotation: 0,
  });

  if (outro) gsap.set(outro, { opacity: 0, y: 40, display: 'none' });

  imgs.forEach((img, i) => {
    const p = positions[i % positions.length];

    // Fly-in entrance
    gsap.to(img, {
      x: p.x, y: p.y, z: p.z, rotation: p.r,
      opacity: 0.88, scale: 1,
      duration: 1.6,
      delay: 0.35 + i * 0.09,
      ease: 'power3.out',
      onComplete: () => {
        // Gentle floating loop on Y around the resting position
        gsap.to(img, {
          y: p.y + 14,
          duration: 2.8 + Math.random() * 1.6,
          ease: 'sine.inOut',
          repeat: -1,
          yoyo: true,
        });
        // Subtle rotation breath
        gsap.to(img, {
          rotation: p.r + (p.r >= 0 ? 1.5 : -1.5),
          duration: 3.4 + Math.random() * 1.4,
          ease: 'sine.inOut',
          repeat: -1,
          yoyo: true,
        });
      },
    });
  });
}

/* ═══════════════════════════════════════════════════════════
   5.  SCROLL REVEAL  — IntersectionObserver (primary, no GSAP dep)
       + GSAP enhancement when available
       FIX: elements are NEVER hidden by CSS. JS hides them with
            inline style ONLY right before observing, so if JS
            fails the elements are still visible.
   ═══════════════════════════════════════════════════════════ */
function initScrollReveal() {
  const els = qsa('[data-animate-fade-in]');
  if (!els.length) return;

  // Mark & hide elements via inline style (not CSS class)
  // so HTML/CSS alone never causes invisible content
  els.forEach(el => {
    el.style.opacity   = '0';
    el.style.transform = 'translateY(24px)';
    el.style.transition = 'opacity 0.7s cubic-bezier(0.625,0.05,0,1), transform 0.7s cubic-bezier(0.625,0.05,0,1)';
  });

  const delay = (el) => parseFloat(el.dataset.delay || 0) * 0.12;

  // Helper to animate an element in
  const reveal = (el) => {
    const d = delay(el);
    if (typeof gsap !== 'undefined') {
      // GSAP path — clear transition so GSAP owns it
      el.style.transition = 'none';
      gsap.to(el, {
        opacity: 1,
        y: 0,
        duration: 0.85,
        delay: d,
        ease: 'power3.out',
        clearProps: 'transform',
      });
    } else {
      // CSS transition fallback
      setTimeout(() => {
        el.style.opacity   = '1';
        el.style.transform = 'translateY(0)';
      }, d * 1000);
    }
  };

  // IntersectionObserver is the most reliable trigger mechanism
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        reveal(entry.target);
        io.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.08,
    rootMargin: '0px 0px -40px 0px',
  });

  els.forEach(el => io.observe(el));
}

/* ═══════════════════════════════════════════════════════════
   6.  SLIDE IN FROM BOTTOM  (contact tiles)
   ═══════════════════════════════════════════════════════════ */
function initSlideInFromBottom() {
  const els = qsa('[data-animate-slide-in-from-bottom]');
  if (!els.length) return;

  els.forEach(el => {
    el.style.opacity   = '0';
    el.style.transform = 'translateY(50px)';
    el.style.transition = 'opacity 0.8s cubic-bezier(0.625,0.05,0,1), transform 0.8s cubic-bezier(0.625,0.05,0,1)';
  });

  const d = (el) => parseFloat(el.dataset.delay || 0) * 0.13;

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el  = entry.target;
        const del = d(el);
        if (typeof gsap !== 'undefined') {
          el.style.transition = 'none';
          gsap.to(el, { opacity: 1, y: 0, duration: 0.9, delay: del, ease: 'power3.out' });
        } else {
          setTimeout(() => {
            el.style.opacity   = '1';
            el.style.transform = 'translateY(0)';
          }, del * 1000);
        }
        io.unobserve(el);
      }
    });
  }, { threshold: 0.1 });

  els.forEach(el => io.observe(el));
}

/* ═══════════════════════════════════════════════════════════
   7.  PARAGRAPH REVEAL  (contact hero "Let's become friends!")
       FIX: simpler — just fade/slide the whole heading, not word-split
   ═══════════════════════════════════════════════════════════ */
function initParagraphReveal() {
  qsa('[data-animate-paragraph-reveal]').forEach(el => {
    el.style.opacity   = '0';
    el.style.transform = 'translateY(36px)';

    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      if (typeof gsap !== 'undefined') {
        el.style.transition = 'none';
        gsap.to(el, { opacity: 1, y: 0, duration: 1.1, ease: 'power3.out', delay: 0.1 });
      } else {
        el.style.transition = 'opacity 1s ease, transform 1s ease';
        el.style.opacity    = '1';
        el.style.transform  = 'translateY(0)';
      }
      io.disconnect();
    }, { threshold: 0.15 });

    io.observe(el);
  });
}

/* ═══════════════════════════════════════════════════════════
   8.  EMPLOYEE AVATAR ANIMATIONS
   ═══════════════════════════════════════════════════════════ */
function initAvatarAnimations() {
  if (typeof gsap === 'undefined') return;

  qsa('[data-animate-employee-avatar]').forEach((av, i) => {
    // Stagger entrance
    gsap.from(av, {
      opacity: 0,
      scale: 0.5,
      y: 20,
      duration: 0.55,
      delay: i * 0.07,
      ease: 'back.out(1.5)',
      immediateRender: false,   // ← KEY FIX: don't hide element before trigger
      scrollTrigger: {
        trigger: av,
        start: 'top 92%',
        once: true,
      },
    });

    // Gentle floating loop
    gsap.to(av, {
      y: -(4 + Math.random() * 5),
      duration: 1.4 + Math.random() * 1.2,
      ease: 'sine.inOut',
      repeat: -1,
      yoyo: true,
      delay: Math.random() * 2,
    });
  });
}

/* ═══════════════════════════════════════════════════════════
   9.  TRUSTED-BY SCROLLER  — pause on hover
   ═══════════════════════════════════════════════════════════ */
function initTrustedScroller() {
  const track = qs('.trusted-track');
  if (!track) return;
  track.addEventListener('mouseenter', () => track.style.animationPlayState = 'paused');
  track.addEventListener('mouseleave', () => track.style.animationPlayState = 'running');
}

/* ═══════════════════════════════════════════════════════════
   10. AUDIO CONTROL BUTTON  (toggles hero video mute)
   ═══════════════════════════════════════════════════════════ */
function initAudioControl() {
  const btn   = qs('#audioBtn');
  const video = qs('#heroVideo');
  if (!btn) return;

  let enabled = false;

  const iconOn  = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>`;
  const iconOff = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>`;

  btn.addEventListener('click', () => {
    enabled = !enabled;
    if (video) {
      video.muted = !enabled;
      if (enabled) {
        // Some browsers pause when toggling muted; ensure playback resumes
        const p = video.play();
        if (p && typeof p.catch === 'function') p.catch(() => {});
      }
    }
    btn.innerHTML = enabled
      ? `${iconOff}<span class="audio-btn-label">Disable Sound</span>`
      : `${iconOn}<span class="audio-btn-label">Enable Sound</span>`;
    btn.setAttribute('aria-label', enabled ? 'Disable sound' : 'Enable sound');
  });

  // Slide-in entrance
  const ctrl = qs('#audioControl');
  if (ctrl && typeof gsap !== 'undefined') {
    gsap.from(ctrl, { opacity: 0, y: 20, duration: 0.7, delay: 1.5, ease: 'power2.out' });
  }
}

/* ═══════════════════════════════════════════════════════════
   10b. HERO VIDEO — load handling, on-enter reveal, scroll parallax
   ═══════════════════════════════════════════════════════════ */
function initHeroVideo() {
  const hero  = qs('.hero-video');
  if (!hero) return;

  const bg      = qs('.hero-video-bg', hero);
  const video   = qs('#heroVideo', hero);
  const content = qs('.hero-content', hero);
  const reveals = qsa('[data-hero-reveal]', hero);

  // Force autoplay on iOS / strict browsers
  if (video) {
    video.muted = true;
    video.setAttribute('muted', '');
    const tryPlay = () => {
      const p = video.play();
      if (p && typeof p.catch === 'function') p.catch(() => {});
    };
    tryPlay();
    video.addEventListener('canplay', tryPlay, { once: true });
  }

  // Staggered reveal of hero content
  if (typeof gsap !== 'undefined' && reveals.length) {
    reveals.forEach(el => {
      const delay = parseFloat(el.dataset.delay || 0) * 0.12;
      gsap.to(el, {
        opacity: 1,
        y: 0,
        duration: 1.0,
        delay: 0.3 + delay,
        ease: 'power3.out',
      });
    });
  } else {
    // Fallback — reveal immediately via CSS transition
    reveals.forEach(el => {
      el.style.transition = 'opacity 0.9s ease, transform 0.9s ease';
      requestAnimationFrame(() => {
        el.style.opacity   = '1';
        el.style.transform = 'translateY(0)';
      });
    });
  }

  // Scroll parallax — subtle upward drift + fade for content
  if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    if (bg) {
      gsap.to(bg, {
        yPercent: 15,
        ease: 'none',
        scrollTrigger: {
          trigger: hero,
          start: 'top top',
          end: 'bottom top',
          scrub: true,
        },
      });
    }
    if (content) {
      gsap.to(content, {
        y: -40,
        opacity: 0,
        ease: 'none',
        scrollTrigger: {
          trigger: hero,
          start: 'top top',
          end: '70% top',
          scrub: true,
        },
      });
    }
  }
}

/* ═══════════════════════════════════════════════════════════
   11. DEMO SUBMISSION FORM
   ═══════════════════════════════════════════════════════════ */
function initDemoForm() {
  const form    = qs('#demoForm');
  const submitBtn = qs('#formSubmit');
  const success   = qs('#formSuccess');
  if (!form) return;

  // Clear error state on user input
  qsa('.form-input, .form-select, .form-textarea', form).forEach(input => {
    input.addEventListener('input', () => {
      input.classList.remove('invalid');
      input.closest('.form-field')?.classList.remove('has-error');
    });
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    let valid = true;

    qsa('[required]', form).forEach(field => {
      const group = field.closest('.form-field');
      let ok = false;

      if (field.type === 'email')
        ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value.trim());
      else if (field.type === 'url')
        try { new URL(field.value.trim()); ok = true; } catch { ok = false; }
      else if (field.tagName === 'SELECT')
        ok = field.value !== '';
      else if (field.type === 'checkbox')
        ok = field.checked;
      else
        ok = field.value.trim().length > 1;

      if (!ok) {
        field.classList.add('invalid');
        group?.classList.add('has-error');
        valid = false;
      } else {
        field.classList.remove('invalid');
        group?.classList.remove('has-error');
      }
    });

    if (!valid) {
      if (typeof gsap !== 'undefined') {
        gsap.fromTo(form, { x: -8 }, { x: 0, duration: 0.45, ease: 'elastic.out(1,0.3)' });
      }
      return;
    }

    submitBtn.disabled    = true;
    submitBtn.textContent = 'Sending…';

    // Simulate async — replace with real fetch() in production
    setTimeout(() => {
      form.reset();
      submitBtn.disabled    = false;
      submitBtn.textContent = 'Submit Demo';

      if (success) {
        success.classList.add('show');
        if (typeof gsap !== 'undefined') {
          gsap.from(success, { opacity: 0, y: 14, duration: 0.4, ease: 'power2.out' });
        }
        setTimeout(() => success.classList.remove('show'), 6000);
      }
    }, 1400);
  });
}

/* ═══════════════════════════════════════════════════════════
   12. ARTICLES SORT BUTTONS
   ═══════════════════════════════════════════════════════════ */
function initArticlesSort() {
  const sortBtns = qsa('.sort-btn');
  const grid     = qs('#articlesGrid');
  if (!sortBtns.length || !grid) return;

  sortBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      sortBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const type  = btn.dataset.sort;
      const cards = qsa('.article-card', grid);

      cards.sort((a, b) => {
        if (type === 'latest')  return new Date(b.dataset.date) - new Date(a.dataset.date);
        if (type === 'oldest')  return new Date(a.dataset.date) - new Date(b.dataset.date);
        return 0;
      });

      if (typeof gsap !== 'undefined') {
        gsap.to(cards, {
          opacity: 0, y: 16, duration: 0.22, stagger: 0.02,
          onComplete: () => {
            cards.forEach(c => grid.appendChild(c));
            gsap.to(cards, { opacity: 1, y: 0, duration: 0.4, stagger: 0.04, ease: 'power2.out' });
          },
        });
      } else {
        cards.forEach(c => grid.appendChild(c));
      }
    });
  });

  // Pagination click highlight
  qsa('.page-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.textContent.includes('→')) return;
      qsa('.page-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });
}

/* ═══════════════════════════════════════════════════════════
   13. HOF SPHERE  — 3D interior sphere viewer with drag rotation
       Cards are positioned on the inner surface of a sphere via
       `rotateY(θ) rotateX(φ) translateZ(-R)`. That transform places
       each card at -R * normal while its face normal still points
       toward origin, so the text reads correctly from the camera.
       The camera is the parent `.hof-camera` element; drag updates
       its rotateX/rotateY, giving a look-around effect.
   ═══════════════════════════════════════════════════════════ */
function initHofSphere() {
  const viewer = qs('#hofSphere');
  const camera = qs('#hofCamera');
  if (!viewer || !camera) return;

  const cards = qsa('.hof3d-card', camera);

  // Distribute cards across the sphere: 5 rings × 6 columns = 30 slots.
  // Each ring gets a 12° theta offset so rings don't stack perfectly.
  // 60° theta step gives a full 360° wrap (6 × 60 = 360).
  cards.forEach((card) => {
    const ring = parseInt(card.dataset.ring, 10) || 0;
    const col  = parseInt(card.dataset.col,  10) || 0;
    const phi   = -50 + ring * 25;              // -50, -25, 0, 25, 50
    const theta = (col - 2.5) * 60 + ring * 12; // full wrap, offset per ring
    card.style.setProperty('--ry', theta + 'deg');
    card.style.setProperty('--rx', phi + 'deg');

    if (typeof gsap !== 'undefined') {
      gsap.from(card, {
        opacity: 0,
        scale: 0.6,
        duration: 0.8,
        delay: 0.1 + (ring * 6 + col) * 0.028,
        ease: 'power2.out',
      });
    }
  });

  // ── Camera drag state ────────────────────────────────────
  let yaw = 0, pitch = 0;
  let dragging = false, lx = 0, ly = 0;
  let idle = 0;
  let downX = 0, downY = 0, dragDist = 0;

  const apply = () => {
    camera.style.transform = `rotateX(${pitch}deg) rotateY(${yaw}deg)`;
  };
  apply();

  const getXY = (e) => {
    if (e.touches && e.touches[0]) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    return { x: e.clientX, y: e.clientY };
  };

  const onDown = (e) => {
    dragging = true;
    idle = 0;
    viewer.classList.add('dragging');
    const p = getXY(e);
    lx = p.x; ly = p.y;
    downX = p.x; downY = p.y;
    dragDist = 0;
  };
  const onMove = (e) => {
    if (!dragging) return;
    const p = getXY(e);
    yaw   += (p.x - lx) * 0.28;
    pitch -= (p.y - ly) * 0.28;
    if (pitch >  55) pitch =  55;
    if (pitch < -55) pitch = -55;
    lx = p.x; ly = p.y;
    const d = Math.hypot(p.x - downX, p.y - downY);
    if (d > dragDist) dragDist = d;
    apply();
  };
  const onUp = () => {
    dragging = false;
    viewer.classList.remove('dragging');
  };

  viewer.addEventListener('mousedown',  onDown);
  viewer.addEventListener('touchstart', onDown, { passive: true });
  window.addEventListener('mousemove',  onMove);
  window.addEventListener('touchmove',  onMove, { passive: true });
  window.addEventListener('mouseup',    onUp);
  window.addEventListener('touchend',   onUp);
  window.addEventListener('touchcancel',onUp);

  // Idle auto-rotation — resumes 1.5s after the last drag
  let last = performance.now();
  const tick = (now) => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (!dragging) {
      idle += dt;
      if (idle > 1.5) {
        yaw += 4 * dt; // ~4°/sec
        apply();
      }
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);

  // ── Card click → open video modal (skip if user was dragging) ──
  const modal     = qs('#hofVideoModal');
  const iframe    = qs('#hofVideoIframe');
  const closeBtn  = qs('#hofVideoClose');
  const backdrop  = qs('#hofVideoBackdrop');
  const fallback  = qs('#hofVideoFallback');

  const openModal = (ytId) => {
    if (!modal || !iframe || !ytId) return;
    // Use canonical youtube.com/embed — nocookie variant is more restrictive
    // for label-controlled music videos. Plain /embed has the widest support.
    iframe.src = `https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0&playsinline=1`;
    if (fallback) fallback.href = `https://www.youtube.com/watch?v=${ytId}`;
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  };
  const closeModal = () => {
    if (!modal || !iframe) return;
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    iframe.src = '';
    document.body.style.overflow = '';
  };

  cards.forEach((card) => {
    card.addEventListener('click', () => {
      if (dragDist > 6) return; // user was dragging, not clicking
      openModal(card.dataset.youtube);
    });
  });

  closeBtn?.addEventListener('click', closeModal);
  backdrop?.addEventListener('click', closeModal);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal?.classList.contains('open')) closeModal();
  });
}

/* ═══════════════════════════════════════════════════════════
   14. CONTACT PAGE  — video-bg parallax
   ═══════════════════════════════════════════════════════════ */
function initContactParallax() {
  if (typeof gsap === 'undefined') return;

  const hero = qs('.contact-hero');
  const sim  = qs('.contact-video-sim');
  if (!hero || !sim) return;

  gsap.to(sim, {
    yPercent: 18,
    ease: 'none',
    scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true },
  });
}

/* ═══════════════════════════════════════════════════════════
   15. ANCHOR SMOOTH SCROLL
   ═══════════════════════════════════════════════════════════ */
function initAnchorScroll() {
  qsa('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const id     = link.getAttribute('href').slice(1);
      const target = document.getElementById(id);
      if (!target) return;
      e.preventDefault();

      if (lenis) {
        lenis.scrollTo(target, { offset: -80, duration: 1.4 });
      } else {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }

      // Close mobile menu if open
      const mobile = qs('#mobileMenu');
      const toggle = qs('#navToggle');
      if (mobile?.classList.contains('open')) {
        mobile.classList.remove('open');
        toggle?.classList.remove('open');
        toggle?.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      }
    });
  });
}

/* ═══════════════════════════════════════════════════════════
   16. NAV ENTRANCE ANIMATION
   ═══════════════════════════════════════════════════════════ */
function initNavEntrance() {
  if (typeof gsap === 'undefined') return;
  const nav = qs('#masterNav');
  if (!nav) return;
  gsap.from(nav, { opacity: 0, y: -14, duration: 0.7, delay: 0.15, ease: 'power3.out' });
}

/* ═══════════════════════════════════════════════════════════
   17. BARBA.JS  — page transitions
   ═══════════════════════════════════════════════════════════ */
function initBarba() {
  if (typeof barba === 'undefined' || typeof gsap === 'undefined') return;

  const overlay = qs('#barbaOverlay');

  barba.init({
    transitions: [{
      name: 'crossfade',
      async leave() {
        if (overlay) await gsap.to(overlay, { opacity: 1, duration: 0.3, ease: 'power2.in' });
      },
      async enter() {
        window.scrollTo(0, 0);
        if (lenis) lenis.scrollTo(0, { immediate: true });
        initPageScripts();
        if (overlay) await gsap.to(overlay, { opacity: 0, duration: 0.4, ease: 'power2.out', delay: 0.05 });
      },
    }],
    views: [{
      namespace: 'home',
      afterEnter() { initHeroVideo(); },
    }],
  });
}

/* ═══════════════════════════════════════════════════════════
   18. PER-PAGE INIT
       Called once on DOMContentLoaded and again after each
       Barba page transition.
   ═══════════════════════════════════════════════════════════ */
function initPageScripts() {
  // Kill stale ScrollTriggers from previous page
  if (typeof ScrollTrigger !== 'undefined') {
    ScrollTrigger.getAll().forEach(st => st.kill());
  }

  initNav();
  initScrollReveal();
  initSlideInFromBottom();
  initParagraphReveal();
  initAvatarAnimations();
  initTrustedScroller();
  initAudioControl();
  initDemoForm();
  initArticlesSort();
  initHofSphere();
  initAnchorScroll();
  initNavEntrance();
  initContactParallax();

  // Home-page hero (video + parallax) only runs when the hero exists
  const ns = qs('[data-barba-namespace]')?.dataset?.barbaNamespace;
  if (ns === 'home' || qs('.hero-video')) {
    initHeroVideo();
  }
  // Legacy spotlight — safe no-op if the markup has been replaced
  if (qs('.kaitonote-spotlight')) {
    initSpotlight();
  }

  // Recalculate ScrollTrigger positions after full layout
  if (typeof ScrollTrigger !== 'undefined') {
    ScrollTrigger.refresh();
  }
}

/* ═══════════════════════════════════════════════════════════
   BOOT
   ═══════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  initLoader();
  initLenis();
  initPageScripts();
  // Barba init after page scripts so initial page works without transitions too
  initBarba();
});
