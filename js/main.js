/* =============================================
   AFTER BEATS MUSIC — Main JavaScript
   ============================================= */

document.addEventListener('DOMContentLoaded', () => {

  // ── Loader ──────────────────────────────────
  const loader = document.getElementById('loader');
  document.body.classList.add('loading');

  window.addEventListener('load', () => {
    setTimeout(() => {
      loader.classList.add('hidden');
      document.body.classList.remove('loading');
    }, 800);
  });

  // Fallback if load event already fired
  if (document.readyState === 'complete') {
    setTimeout(() => {
      loader.classList.add('hidden');
      document.body.classList.remove('loading');
    }, 400);
  }


  // ── Sticky Header ────────────────────────────
  const header = document.getElementById('header');

  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 20);
  }, { passive: true });


  // ── Mobile Nav Toggle ────────────────────────
  const navToggle = document.getElementById('navToggle');
  const nav = document.getElementById('nav');

  navToggle.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', open);
    navToggle.classList.toggle('active', open);
    // Animate hamburger → X
    const spans = navToggle.querySelectorAll('span');
    if (open) {
      spans[0].style.transform = 'translateY(7px) rotate(45deg)';
      spans[1].style.opacity = '0';
      spans[2].style.transform = 'translateY(-7px) rotate(-45deg)';
    } else {
      spans.forEach(s => { s.style.transform = ''; s.style.opacity = ''; });
    }
  });

  // Close mobile nav on link click
  nav.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      nav.classList.remove('open');
      navToggle.setAttribute('aria-expanded', false);
      const spans = navToggle.querySelectorAll('span');
      spans.forEach(s => { s.style.transform = ''; s.style.opacity = ''; });
    });
  });

  // Mobile dropdown toggle
  document.querySelectorAll('.has-dropdown .nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
      if (window.innerWidth <= 768) {
        e.preventDefault();
        link.closest('.has-dropdown').classList.toggle('open');
      }
    });
  });


  // ── Smooth Scroll for anchor links ──────────
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        const offset = 80;
        const top = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });


  // ── Reveal on scroll ─────────────────────────
  const revealElements = document.querySelectorAll(
    '.stat-card, .hof-card, .gallery-item, .about-card, .partner-item, .section-label, .section-title'
  );

  revealElements.forEach(el => el.classList.add('reveal'));

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        setTimeout(() => {
          entry.target.classList.add('visible');
        }, (i % 6) * 80);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  revealElements.forEach(el => observer.observe(el));


  // ── Stats Counter Animation ───────────────────
  function animateCounter(el) {
    const target = parseFloat(el.dataset.target);
    const suffix = el.dataset.suffix || '';
    const duration = 2000;
    const start = performance.now();

    const tick = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = target * eased;

      let display;
      if (target >= 1000) {
        display = Math.floor(current).toLocaleString();
      } else if (Number.isInteger(target)) {
        display = Math.floor(current);
      } else {
        display = current.toFixed(1);
      }

      el.textContent = display + suffix;

      if (progress < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  }

  const statObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && entry.target.dataset.target) {
        animateCounter(entry.target);
        statObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  document.querySelectorAll('.stat-value[data-target]').forEach(el => {
    statObserver.observe(el);
  });


  // ── Form Validation & Submission ─────────────
  const form = document.getElementById('submitForm');
  const formSuccess = document.getElementById('formSuccess');

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      let valid = true;

      // Text / URL / email inputs
      form.querySelectorAll('input[required], select[required]').forEach(input => {
        const group = input.closest('.form-group');
        let ok = false;

        if (input.type === 'email') {
          ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim());
        } else if (input.type === 'url') {
          try { new URL(input.value.trim()); ok = true; } catch { ok = false; }
        } else if (input.tagName === 'SELECT') {
          ok = input.value !== '';
        } else {
          ok = input.value.trim().length > 0;
        }

        if (!ok) {
          group.classList.add('has-error');
          input.classList.add('error');
          valid = false;
        } else {
          group.classList.remove('has-error');
          input.classList.remove('error');
        }
      });

      // Checkboxes
      form.querySelectorAll('input[type="checkbox"][required]').forEach(cb => {
        if (!cb.checked) valid = false;
      });

      if (valid) {
        const btn = form.querySelector('button[type="submit"]');
        btn.disabled = true;
        btn.innerHTML = `
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style="animation:spin 0.8s linear infinite">
            <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2" stroke-dasharray="20 40"/>
          </svg>
          Sending...
        `;

        // Simulate async submit (replace with real fetch in production)
        setTimeout(() => {
          form.reset();
          form.querySelectorAll('.has-error, .error').forEach(el => {
            el.classList.remove('has-error', 'error');
          });
          formSuccess.classList.add('show');
          btn.disabled = false;
          btn.innerHTML = `
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            Submitted!
          `;

          setTimeout(() => {
            formSuccess.classList.remove('show');
            btn.innerHTML = `
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M22 2L11 13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M22 2L15 22l-4-9-9-4 20-7z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
              Submit Your Demo
            `;
          }, 5000);
        }, 1400);
      }
    });

    // Clear error on input
    form.querySelectorAll('input, select, textarea').forEach(el => {
      el.addEventListener('input', () => {
        el.classList.remove('error');
        el.closest('.form-group')?.classList.remove('has-error');
      });
    });
  }


  // ── Waveform hover animation re-sync ─────────
  const waveBars = document.querySelectorAll('.wave-bar');
  waveBars.forEach((bar, i) => {
    bar.style.setProperty('--i', i);
  });


  // ── Parallax subtle on hero ───────────────────
  const heroGradient = document.querySelector('.hero-gradient');
  if (heroGradient) {
    window.addEventListener('scroll', () => {
      const y = window.scrollY;
      heroGradient.style.transform = `translateY(${y * 0.3}px)`;
    }, { passive: true });
  }


  // ── Add spin keyframe for loader button ──────
  const style = document.createElement('style');
  style.textContent = '@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }';
  document.head.appendChild(style);

});
