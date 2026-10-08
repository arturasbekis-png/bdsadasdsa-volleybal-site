/* AUKSMA – lengvas JavaScript be priklausomybių */
(function () {
  'use strict';

  var doc = document;
  var body = doc.body;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var desktopMq = window.matchMedia('(min-width: 1200px)');

  /* ---------- Antraštės šešėlis slenkant ---------- */
  var header = doc.querySelector('.site-header');
  function onScroll() {
    if (header) header.classList.toggle('is-scrolled', window.scrollY > 8);
  }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- Antraštės pritaikymas: jei meniu netelpa, rodome mygtuką „Meniu“ ---------- */
  var bar = header ? header.querySelector('.site-header__bar') : null;
  var fitQueued = false;
  function fitHeader() {
    fitQueued = false;
    if (!header || !bar) return;
    header.classList.remove('is-compact');
    if (!desktopMq.matches) return;
    var overflowing = bar.scrollWidth > bar.clientWidth + 1;
    header.classList.toggle('is-compact', overflowing);
    var m = doc.getElementById('mobile-menu');
    if (!overflowing && m && !m.hidden) {
      m.hidden = true;
      body.classList.remove('menu-open');
      var t = doc.querySelector('.menu-toggle');
      if (t) {
        t.setAttribute('aria-expanded', 'false');
        var l = t.querySelector('.menu-toggle__label');
        if (l) l.textContent = 'Meniu';
      }
    }
  }
  function queueFit() {
    if (fitQueued) return;
    fitQueued = true;
    window.requestAnimationFrame(fitHeader);
  }
  window.addEventListener('resize', queueFit);
  window.addEventListener('load', queueFit);
  if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(queueFit);
  fitHeader();

  /* ---------- Mobilus meniu ---------- */
  var toggle = doc.querySelector('.menu-toggle');
  var menu = doc.getElementById('mobile-menu');
  var lastFocus = null;

  function focusables() {
    var nodes = menu.querySelectorAll('a[href], button:not([disabled])');
    return Array.prototype.slice.call(nodes).concat(toggle);
  }

  function openMenu() {
    lastFocus = doc.activeElement;
    menu.hidden = false;
    toggle.setAttribute('aria-expanded', 'true');
    toggle.querySelector('.menu-toggle__label').textContent = 'Uždaryti';
    body.classList.add('menu-open');
    var first = menu.querySelector('a[href]');
    if (first) first.focus();
    updateSticky();
  }

  function closeMenu(returnFocus) {
    menu.hidden = true;
    toggle.setAttribute('aria-expanded', 'false');
    toggle.querySelector('.menu-toggle__label').textContent = 'Meniu';
    body.classList.remove('menu-open');
    if (returnFocus !== false) (lastFocus && lastFocus.focus ? lastFocus : toggle).focus();
    updateSticky();
  }

  if (toggle && menu) {
    toggle.addEventListener('click', function () {
      if (menu.hidden) openMenu(); else closeMenu();
    });

    menu.addEventListener('click', function (e) {
      var link = e.target.closest('a[href]');
      if (link) closeMenu(false);
    });

    doc.addEventListener('keydown', function (e) {
      if (menu.hidden) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        closeMenu();
        return;
      }
      if (e.key === 'Tab') {
        var items = focusables();
        var first = items[0];
        var last = items[items.length - 1];
        var idx = items.indexOf(doc.activeElement);
        if (idx === -1) {
          e.preventDefault();
          (e.shiftKey ? last : first).focus();
        } else if (e.shiftKey && doc.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && doc.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    });

    /* Jei dėmesys kaip nors patenka už meniu ribų – grąžiname atgal */
    doc.addEventListener('focusin', function (e) {
      if (menu.hidden) return;
      if (menu.contains(e.target) || e.target === toggle) return;
      var first = menu.querySelector('a[href]');
      if (first) first.focus();
    });

    desktopMq.addEventListener('change', function (e) {
      if (e.matches && !menu.hidden) closeMenu(false);
    });
  }

  /* ---------- Lipnus mobilus CTA ---------- */
  var sticky = doc.getElementById('sticky-cta');
  var heroCta = doc.getElementById('hero-cta');
  var finalSection = doc.getElementById('prisijunk');
  var footer = doc.querySelector('.footer');
  var state = { heroVisible: true, finalVisible: false, footerVisible: false };

  function updateSticky() {
    if (!sticky) return;
    var show = !state.heroVisible && !state.finalVisible && !state.footerVisible && (!menu || menu.hidden);
    sticky.hidden = !show;
  }

  if ('IntersectionObserver' in window && sticky) {
    var stickyObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.target === heroCta) state.heroVisible = entry.isIntersecting;
        if (entry.target === finalSection) state.finalVisible = entry.isIntersecting;
        if (entry.target === footer) state.footerVisible = entry.isIntersecting;
      });
      updateSticky();
    }, { threshold: 0.01 });
    [heroCta, finalSection, footer].forEach(function (el) { if (el) stickyObserver.observe(el); });
  }

  /* ---------- Aktyvaus skyriaus žymėjimas navigacijoje ---------- */
  var spyLinks = {};
  doc.querySelectorAll('.nav__list a[data-spy]').forEach(function (a) { spyLinks[a.getAttribute('data-spy')] = a; });

  if ('IntersectionObserver' in window) {
    var visible = {};
    var spyObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) { visible[entry.target.id] = entry.isIntersecting ? entry.intersectionRatio : 0; });
      var bestId = null;
      var best = 0;
      Object.keys(visible).forEach(function (id) {
        if (visible[id] > best) { best = visible[id]; bestId = id; }
      });
      Object.keys(spyLinks).forEach(function (id) {
        if (id === bestId) spyLinks[id].setAttribute('aria-current', 'true');
        else spyLinks[id].removeAttribute('aria-current');
      });
    }, { rootMargin: '-30% 0px -50% 0px', threshold: [0, 0.01, 0.25, 0.5, 1] });

    Object.keys(spyLinks).forEach(function (id) {
      var target = doc.getElementById(id);
      if (target) spyObserver.observe(target);
    });
  }

  /* ---------- Atsiradimas slenkant ---------- */
  var revealEls = doc.querySelectorAll('.reveal');
  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  } else {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    revealEls.forEach(function (el, i) {
      el.style.transitionDelay = (i % 5) * 60 + 'ms';
      revealObserver.observe(el);
    });
  }

  /* ---------- Galerijos lightbox ---------- */
  var lightbox = doc.getElementById('lightbox');
  var lbImg = doc.getElementById('lightbox-img');
  var lbCap = doc.getElementById('lightbox-cap');
  var buttons = Array.prototype.slice.call(doc.querySelectorAll('.gallery__btn'));
  var current = -1;
  var opener = null;

  function show(index) {
    current = (index + buttons.length) % buttons.length;
    var btn = buttons[current];
    var thumb = btn.querySelector('img');
    lbImg.src = btn.getAttribute('data-full');
    lbImg.alt = thumb ? thumb.alt : '';
    lbCap.textContent = btn.getAttribute('data-caption') || '';
  }

  if (lightbox && buttons.length && typeof lightbox.showModal === 'function') {
    buttons.forEach(function (btn, i) {
      btn.addEventListener('click', function () {
        opener = btn;
        show(i);
        lightbox.showModal();
        var close = lightbox.querySelector('[data-lb="close"]');
        if (close) close.focus();
      });
    });

    lightbox.addEventListener('click', function (e) {
      var action = e.target.getAttribute && e.target.getAttribute('data-lb');
      if (action === 'close' || e.target === lightbox) lightbox.close();
      else if (action === 'prev') show(current - 1);
      else if (action === 'next') show(current + 1);
    });

    lightbox.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { e.preventDefault(); show(current - 1); }
      if (e.key === 'ArrowRight') { e.preventDefault(); show(current + 1); }
    });

    lightbox.addEventListener('close', function () {
      lbImg.removeAttribute('src');
      if (opener) opener.focus();
    });
  } else {
    /* Be <dialog> palaikymo – atidarome nuotrauką naujame lange */
    buttons.forEach(function (btn) {
      btn.addEventListener('click', function () { window.open(btn.getAttribute('data-full'), '_blank', 'noopener'); });
    });
  }
})();
