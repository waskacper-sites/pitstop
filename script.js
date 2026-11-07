(function () {
  'use strict';

  const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isDesktopPointer = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  // --- Scroll reveal (+ stagger cleanup so hover/tap transitions stay snappy) ---
  function initReveal() {
    document.querySelectorAll('.stagger-group').forEach((group) => {
      const children = group.querySelectorAll(':scope > .fade-up');
      children.forEach((el, idx) => {
        const delayMs = idx * 80;
        el.dataset.stagger = String(delayMs);
        el.style.setProperty('--delay', delayMs + 'ms');
      });
    });

    const els = document.querySelectorAll('.fade-up');
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        el.classList.add('visible');
        io.unobserve(el);

        const extra = parseInt(el.dataset.stagger || '0', 10) || 0;
        setTimeout(() => {
          el.classList.remove('fade-up', 'visible');
          el.style.removeProperty('--delay');
        }, 900 + extra);
      });
    }, { threshold: 0.06, rootMargin: '0px 0px -20px 0px' });

    els.forEach((el) => io.observe(el));
  }

  // --- Mobile drawer ---
  let closeMobileDrawer = function () {};

  function initNav() {
    const drawer = document.getElementById('mobile-drawer');
    const openBtn = document.getElementById('drawer-open-btn');
    const closeBtn = document.getElementById('drawer-close-btn');
    if (!drawer || !openBtn || !closeBtn) return;

    function open() {
      drawer.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
    function close() {
      if (!drawer.classList.contains('open')) return;
      drawer.classList.remove('open');
      document.body.style.overflow = '';
    }
    closeMobileDrawer = close;

    openBtn.addEventListener('click', open);
    closeBtn.addEventListener('click', close);
    drawer.addEventListener('click', (e) => { if (e.target === drawer) close(); });
  }

  // --- Lightbox (+ touch swipe left/right on mobile) ---
  const works = [
    { img: 'cut-1.png', cat: 'Skin fade', title: 'Low fade', desc: 'Czyste przejście, naturalna góra.' },
    { img: 'cut-2.jpg', cat: 'Mullet', title: 'Modern mullet', desc: 'Dłuższy tył, krótkie boki.' },
    { img: 'cut-3.png', cat: 'Długie włosy', title: 'Naturalne loki', desc: 'Cięcie dopasowane do struktury włosów.' }
  ];
  let cur = 0;

  function initLightbox() {
    const modal = document.getElementById('lightbox-modal');
    const stage = document.getElementById('lightbox-stage');
    const img = document.getElementById('lightbox-img');
    const cat = document.getElementById('lightbox-category');
    const title = document.getElementById('lightbox-title');
    const desc = document.getElementById('lightbox-desc');
    const counter = document.getElementById('lightbox-counter');
    if (!modal || !img) return;

    function show(i, immediate) {
      cur = (i + works.length) % works.length;
      const w = works[cur];
      const apply = () => {
        img.src = w.img;
        img.alt = w.title;
        cat.textContent = w.cat;
        title.textContent = w.title;
        desc.textContent = w.desc;
        counter.textContent = (cur + 1) + ' / ' + works.length;
        img.style.opacity = '1';
      };

      if (immediate) {
        apply();
      } else {
        img.style.opacity = '0';
        setTimeout(apply, 130);
      }
    }

    function close() {
      modal.classList.remove('open');
      document.body.style.overflow = '';
    }

    document.querySelectorAll('.cut-card').forEach((c) => {
      c.addEventListener('click', () => {
        show(parseInt(c.dataset.index, 10) || 0, true);
        modal.classList.add('open');
        document.body.style.overflow = 'hidden';
      });
    });

    document.getElementById('lightbox-close').addEventListener('click', close);
    document.getElementById('lightbox-prev').addEventListener('click', () => show(cur - 1, false));
    document.getElementById('lightbox-next').addEventListener('click', () => show(cur + 1, false));
    modal.addEventListener('click', (e) => { if (e.target === modal) close(); });

    // Touch swipe left / right in Lightbox
    let touchStartX = 0;
    let touchStartY = 0;
    const swipeArea = stage || modal;
    swipeArea.addEventListener('touchstart', (e) => {
      if (!e.touches || !e.touches.length) return;
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    }, { passive: true });

    swipeArea.addEventListener('touchend', (e) => {
      if (!modal.classList.contains('open') || !e.changedTouches || !e.changedTouches.length) return;
      const dx = e.changedTouches[0].clientX - touchStartX;
      const dy = e.changedTouches[0].clientY - touchStartY;
      if (Math.abs(dx) > 42 && Math.abs(dx) > Math.abs(dy) * 1.2) {
        if (dx < 0) show(cur + 1, false);
        else show(cur - 1, false);
      }
    }, { passive: true });

    window.addEventListener('keydown', (e) => {
      if (!modal.classList.contains('open')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') show(cur - 1, false);
      if (e.key === 'ArrowRight') show(cur + 1, false);
    });
  }

  // --- Smooth animated FAQ accordion ---
  function initFaq() {
    const items = document.querySelectorAll('.faq-item');
    items.forEach((item) => {
      const btn = item.querySelector('.faq-trigger');
      if (!btn) return;
      btn.addEventListener('click', () => {
        const wasActive = item.classList.contains('active');
        items.forEach((other) => {
          other.classList.remove('active');
          const otherBtn = other.querySelector('.faq-trigger');
          if (otherBtn) otherBtn.setAttribute('aria-expanded', 'false');
        });
        if (!wasActive) {
          item.classList.add('active');
          btn.setAttribute('aria-expanded', 'true');
        }
      });
    });
  }

  // --- Custom modals (no native alert/confirm) ---
  window.showCustomAlert = function (msg, title) {
    const m = document.getElementById('custom-alert-modal');
    document.getElementById('custom-alert-title').textContent = title || 'Informacja';
    document.getElementById('custom-alert-msg').textContent = msg;
    m.classList.remove('hidden');
    document.getElementById('custom-alert-ok').onclick = () => m.classList.add('hidden');
  };

  window.showCustomConfirm = function (msg, title, cb) {
    const m = document.getElementById('custom-confirm-modal');
    document.getElementById('custom-confirm-title').textContent = title || 'Potwierdzenie';
    document.getElementById('custom-confirm-msg').textContent = msg;
    m.classList.remove('hidden');
    document.getElementById('custom-confirm-yes').onclick = () => { m.classList.add('hidden'); if (cb) cb(true); };
    document.getElementById('custom-confirm-no').onclick = () => { m.classList.add('hidden'); if (cb) cb(false); };
  };

  // --- Unified Motion Engine (never mutates <html> style so Tailwind CDN Observer never spikes memory) ---
  function initMotionEngine() {
    const nav = document.getElementById('navbar');
    const desktopNav = document.getElementById('desktop-nav');
    const magnet = document.getElementById('nav-magnet');
    const stripeEls = Array.from(document.querySelectorAll('.pole-stripe'));
    const navLinks = desktopNav ? Array.from(desktopNav.querySelectorAll('.nav-link')) : [];
    const drawerLinks = Array.from(document.querySelectorAll('.drawer-link'));

    const sectionIds = ['about', 'portfolio', 'cennik', 'testimonials', 'faq'];
    const sections = sectionIds
      .map((id) => {
        const el = document.getElementById(id);
        const link = navLinks.find((l) => l.dataset.section === id) || null;
        const dLink = drawerLinks.find((l) => l.dataset.section === id) || null;
        return el ? { id, el, link, dLink } : null;
      })
      .filter(Boolean);

    let currentY = window.scrollY;
    let targetY = window.scrollY;
    let wheelActive = false;
    let anchorAnim = null;
    let rafRunning = false;
    let lastTime = performance.now();

    function wakeUp() {
      if (!rafRunning) {
        rafRunning = true;
        lastTime = performance.now();
        requestAnimationFrame(tick);
      }
    }

    function getMaxScroll() {
      return Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    }

    function getSectionTargetY(targetEl) {
      if (!targetEl) return 0;
      const navOffset = nav ? nav.offsetHeight : 64;
      const raw = targetEl.getBoundingClientRect().top + window.scrollY - navOffset;
      return Math.max(0, Math.min(getMaxScroll(), raw));
    }

    function startAnchorScroll(targetEl) {
      wheelActive = false;
      const destY = getSectionTargetY(targetEl);
      if (prefersReduced) {
        anchorAnim = null;
        currentY = targetY = destY;
        window.scrollTo(0, destY);
        return;
      }
      anchorAnim = {
        targetEl: targetEl || null,
        startY: window.scrollY,
        startTime: performance.now(),
        duration: 650
      };
      wakeUp();
    }

    // Intercept mouse wheel for fluid inertial scrolling on desktop
    window.addEventListener('wheel', (e) => {
      if (prefersReduced || e.ctrlKey || document.body.style.overflow === 'hidden') return;
      anchorAnim = null;
      if (!wheelActive) {
        currentY = window.scrollY;
        targetY = window.scrollY;
        wheelActive = true;
      }
      let dy = e.deltaY;
      if (e.deltaMode === 1) dy *= 36;
      else if (e.deltaMode === 2) dy *= window.innerHeight * 0.85;

      targetY = Math.max(0, Math.min(getMaxScroll(), targetY + dy));
      e.preventDefault();
      wakeUp();
    }, { passive: false });

    // Cancel programmatic scroll only if user actually drags finger on screen (>12px)
    let touchOriginY = 0;
    window.addEventListener('touchstart', (e) => {
      if (e.touches && e.touches.length) {
        touchOriginY = e.touches[0].clientY;
      }
      wheelActive = false;
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
      if (!anchorAnim || !e.touches || !e.touches.length) return;
      if (Math.abs(e.touches[0].clientY - touchOriginY) > 12) {
        anchorAnim = null;
      }
    }, { passive: true });

    window.addEventListener('scroll', () => {
      wakeUp();
    }, { passive: true });

    window.addEventListener('keydown', (e) => {
      const scrollKeys = ['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '];
      if (scrollKeys.indexOf(e.key) !== -1) {
        anchorAnim = null;
        wheelActive = false;
        wakeUp();
      }
    }, { passive: true });

    window.addEventListener('resize', () => {
      const max = getMaxScroll();
      if (targetY > max) targetY = max;
      if (currentY > max) currentY = max;
      wakeUp();
    }, { passive: true });

    // Smooth anchor jumps for all # links (desktop nav, mobile drawer, hero buttons)
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener('click', (e) => {
        const href = anchor.getAttribute('href');
        if (!href) return;
        if (href === '#') {
          e.preventDefault();
          closeMobileDrawer();
          startAnchorScroll(null);
          return;
        }
        const targetEl = document.querySelector(href);
        if (targetEl) {
          e.preventDefault();
          closeMobileDrawer();
          startAnchorScroll(targetEl);
        }
      });
    });

    // Floating barber-pole stripe state (exact seamless pattern periods for -45deg)
    const PERIOD_LG = 40 * Math.SQRT2; // 56.5685425px
    const PERIOD_SM = 24 * Math.SQRT2; // 33.9411255px
    let stripeScrollY = window.scrollY;
    let ambientShift = 0;

    // Magnetic navbar indicator state
    let hoveredLink = null;
    let hoverPullX = 0;
    let magX = 0;
    let magW = 0;
    let magVx = 0;
    let magVw = 0;
    let magVisible = false;
    let lastActiveId = null;

    navLinks.forEach((link) => {
      link.addEventListener('mouseenter', () => {
        hoveredLink = link;
        hoverPullX = 0;
        wakeUp();
      });
      link.addEventListener('mousemove', (e) => {
        hoveredLink = link;
        const rect = link.getBoundingClientRect();
        const center = rect.left + rect.width * 0.5;
        hoverPullX = (e.clientX - center) * 0.22;
        wakeUp();
      });
    });

    if (desktopNav) {
      desktopNav.addEventListener('mouseleave', () => {
        hoveredLink = null;
        hoverPullX = 0;
        wakeUp();
      });
    }

    function getActiveSection(scrollY) {
      if (!sections.length) return null;
      const docBottom = scrollY + window.innerHeight >= document.documentElement.scrollHeight - 60;
      if (docBottom) return sections[sections.length - 1];

      const probe = scrollY + window.innerHeight * 0.38;
      let active = null;
      for (let i = 0; i < sections.length; i++) {
        const sTop = sections[i].el.getBoundingClientRect().top + scrollY;
        if (probe >= sTop) {
          active = sections[i];
        }
      }
      return active;
    }

    function tick(now) {
      const dt = Math.min(0.05, Math.max(0.001, (now - lastTime) / 1000));
      lastTime = now;

      // 1a. Time-based eased anchor navigation
      if (anchorAnim) {
        const destY = getSectionTargetY(anchorAnim.targetEl);
        const elapsed = now - anchorAnim.startTime;
        const p = Math.min(1, Math.max(0, elapsed / anchorAnim.duration));
        const ease = 1 - Math.pow(1 - p, 4);
        const nextY = anchorAnim.startY + (destY - anchorAnim.startY) * ease;
        window.scrollTo(0, nextY);
        currentY = targetY = nextY;
        if (p >= 1) {
          window.scrollTo(0, destY);
          currentY = targetY = destY;
          anchorAnim = null;
        }
      } else if (wheelActive && !prefersReduced) {
        // 1b. Inertial smooth wheel scroll
        const diff = targetY - currentY;
        if (Math.abs(diff) > 0.4) {
          currentY += diff * (1 - Math.exp(-8.5 * dt));
          window.scrollTo(0, currentY);
        } else {
          currentY = targetY;
          window.scrollTo(0, targetY);
          wheelActive = false;
        }
      } else {
        // 1c. Native touch / scrollbar / keyboard scroll
        currentY = targetY = window.scrollY;
      }

      const y = window.scrollY;

      // 2. Navbar transparent vs solid
      if (nav) {
        nav.classList.toggle('nav-top', y < 40);
        nav.classList.toggle('nav-solid', y >= 40);
      }

      // 3. Slow, silky, floating horizontal barber stripes (set on elements, NOT <html>)
      const stripeDiff = y - stripeScrollY;
      if (!prefersReduced) {
        stripeScrollY += stripeDiff * (1 - Math.exp(-2.2 * dt));
        if (isDesktopPointer) {
          ambientShift = (ambientShift + dt * 4.5) % (PERIOD_LG * PERIOD_SM);
        }

        const rawLg = ambientShift + stripeScrollY * 0.085;
        const rawSm = ambientShift * 0.75 + stripeScrollY * 0.06;

        const shiftLg = (((rawLg % PERIOD_LG) + PERIOD_LG) % PERIOD_LG).toFixed(2) + 'px';
        const shiftSm = (((rawSm % PERIOD_SM) + PERIOD_SM) % PERIOD_SM).toFixed(2) + 'px';

        for (let i = 0; i < stripeEls.length; i++) {
          stripeEls[i].style.setProperty('--stripe-shift', shiftLg);
        }
        if (magnet) {
          magnet.style.setProperty('--stripe-shift-sm', shiftSm);
        }
      }

      // 4. Active section tracking (desktop magnetic bar + mobile drawer indicator)
      const activeSec = getActiveSection(y);
      const activeId = activeSec ? activeSec.id : null;

      if (activeId !== lastActiveId) {
        lastActiveId = activeId;
        drawerLinks.forEach((dl) => {
          dl.classList.toggle('is-active', dl.dataset.section === activeId);
        });
      }

      let magnetMoving = false;
      if (magnet && desktopNav && desktopNav.offsetParent !== null) {
        const scrollLink = activeSec ? activeSec.link : null;
        const activeLink = hoveredLink || scrollLink;

        if (activeLink) {
          const goalX = activeLink.offsetLeft + (hoveredLink ? hoverPullX : 0);
          const goalW = activeLink.offsetWidth;

          if (!magVisible) {
            magX = goalX;
            magW = goalW;
            magVx = 0;
            magVw = 0;
            magVisible = true;
            magnet.style.opacity = '1';
          } else {
            const stiffness = 340;
            const damping = 23;
            magVx += ((goalX - magX) * stiffness - magVx * damping) * dt;
            magVw += ((goalW - magW) * stiffness - magVw * damping) * dt;
            magX += magVx * dt;
            magW += magVw * dt;
            if (Math.abs(goalX - magX) > 0.2 || Math.abs(magVx) > 0.5) {
              magnetMoving = true;
            }
          }

          const stretch = 1 + Math.min(0.18, Math.abs(magVx) * 0.00025);
          magnet.style.width = Math.max(8, magW).toFixed(2) + 'px';
          magnet.style.transform = 'translate3d(' + magX.toFixed(2) + 'px, 0, 0) scaleX(' + stretch.toFixed(3) + ')';
        } else if (magVisible) {
          magVisible = false;
          magnet.style.opacity = '0';
        }
      }

      // On mobile, sleep the rAF loop as soon as scroll inertia & animations finish
      const keepAlive = isDesktopPointer || Boolean(anchorAnim) || wheelActive || Math.abs(stripeDiff) > 0.3 || magnetMoving;
      if (keepAlive) {
        requestAnimationFrame(tick);
      } else {
        rafRunning = false;
      }
    }

    wakeUp();
  }

  document.addEventListener('DOMContentLoaded', () => {
    initReveal();
    initNav();
    initLightbox();
    initFaq();
    initMotionEngine();
  });
})();
