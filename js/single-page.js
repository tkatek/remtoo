(() => {
  'use strict';

  const header = document.querySelector('.site-header');
  const navigation = document.querySelector('.primary-navigation');
  const menuButton = document.querySelector('.menu-toggle');
  const trackedSections = [...document.querySelectorAll('[data-nav-section]')];
  const trackedLinks = [...document.querySelectorAll('.primary-navigation a[data-section-link]')];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let ticking = false;

  const updateHeaderOffset = () => {
    const height = header ? Math.ceil(header.getBoundingClientRect().height) : 0;
    document.documentElement.style.setProperty('--sticky-header-height', `${height}px`);
    return height;
  };

  const setActive = (id) => {
    trackedLinks.forEach((link) => {
      const isActive = link.getAttribute('href') === `#${id}`;
      link.classList.toggle('active', isActive);
      if (isActive) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  };

  const updateScrollSpy = () => {
    ticking = false;
    if (!trackedSections.length) return;

    const activationLine = updateHeaderOffset() + Math.min(window.innerHeight * .25, 190);
    const atPageEnd = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2;
    let active = trackedSections[0];

    if (atPageEnd) {
      active = trackedSections[trackedSections.length - 1];
    } else {
      trackedSections.forEach((section) => {
        if (section.getBoundingClientRect().top <= activationLine) active = section;
      });
    }
    setActive(active.id);
  };

  const requestSpyUpdate = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(updateScrollSpy);
  };

  const closeMobileMenu = () => {
    if (!menuButton || !navigation) return;
    menuButton.setAttribute('aria-expanded', 'false');
    navigation.classList.remove('open');
    const label = menuButton.querySelector('.sr-only');
    if (label) label.textContent = 'Open navigation menu';
  };

  const scrollToTarget = (target, behavior) => {
    const headerHeight = updateHeaderOffset();
    const top = Math.max(0, target.getBoundingClientRect().top + window.scrollY - headerHeight - 13);
    window.scrollTo({ top, behavior });
  };

  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[href^="#"]');
    if (!link) return;
    const hash = link.getAttribute('href');
    if (!hash || hash === '#') return;
    const target = document.querySelector(hash);
    if (!target) return;

    event.preventDefault();
    if (window.location.hash !== hash) history.pushState(null, '', hash);
    else history.replaceState(null, '', hash);
    closeMobileMenu();
    scrollToTarget(target, reducedMotion.matches ? 'auto' : 'smooth');
    if (target.matches('[data-nav-section]')) setActive(target.id);
  });

  const restoreHashPosition = () => {
    const target = window.location.hash && document.querySelector(window.location.hash);
    if (target) scrollToTarget(target, 'auto');
    requestSpyUpdate();
  };

  window.addEventListener('scroll', requestSpyUpdate, { passive: true });
  window.addEventListener('resize', requestSpyUpdate, { passive: true });
  window.addEventListener('popstate', restoreHashPosition);
  window.addEventListener('hashchange', restoreHashPosition);
  window.addEventListener('load', restoreHashPosition, { once: true });
  updateScrollSpy();
})();

(() => {
  'use strict';

  const stage = document.querySelector('#platform .hero-devices');
  const laptop = stage?.querySelector('.platform-laptop');
  const tablet = stage?.querySelector('.platform-tablet');
  const phone = stage?.querySelector('.platform-phone');

  if (!stage || !laptop || !tablet || !phone || stage.dataset.deviceSequence === 'ready') return;

  stage.dataset.deviceSequence = 'ready';
  stage.classList.add('device-showcase');
  stage.setAttribute('aria-label', 'Remtoo academy app shown across laptop, tablet, and phone');
  laptop.classList.add('showcase-device', 'showcase-laptop');
  tablet.classList.add('showcase-device', 'showcase-tablet');
  phone.classList.add('showcase-device', 'showcase-phone');
  laptop.dataset.showcaseDevice = 'laptop';
  tablet.dataset.showcaseDevice = 'tablet';
  phone.dataset.showcaseDevice = 'phone';
  laptop.setAttribute('aria-hidden', 'true');
  tablet.setAttribute('aria-hidden', 'true');
  phone.setAttribute('aria-hidden', 'true');

  stage.insertAdjacentHTML('beforeend', `
    <span class="device-swipe-streak" aria-hidden="true"></span>
    <div class="device-sequence-ui" aria-hidden="true">
      <span class="device-sequence-caption">Every device. One academy.</span>
      <span class="device-sequence-dots"><i></i><i></i><i></i><i class="active"></i></span>
    </div>
  `);

  const caption = stage.querySelector('.device-sequence-caption');
  const dots = [...stage.querySelectorAll('.device-sequence-dots i')];
  const streak = stage.querySelector('.device-swipe-streak');
  const devices = [laptop, tablet, phone];
  const stepLabels = ['Desktop academy', 'Tablet learning', 'Mobile lessons', 'Every device. One academy.'];

  const setStep = (index) => {
    if (caption) caption.textContent = stepLabels[index];
    dots.forEach((dot, dotIndex) => dot.classList.toggle('active', dotIndex === index));
    stage.dataset.sequenceStep = String(index);
  };

  setStep(3);

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (reducedMotion.matches || typeof window.gsap === 'undefined') {
    stage.classList.add('sequence-complete');
    return;
  }

  const { gsap } = window;
  let started = false;
  let timeline = null;
  let pausedByViewport = false;
  let pausedByDocument = false;

  const getPose = () => {
    if (window.matchMedia('(max-width: 620px)').matches) {
      return { laptopX: 14, laptopScale: 1.08, tabletX: -78, tabletScale: 1.55, phoneX: -100, phoneScale: 1.25, enter: 104, exit: -118, rotation: 1.4 };
    }
    if (window.matchMedia('(max-width: 1180px)').matches) {
      return { laptopX: 16, laptopScale: 1.08, tabletX: -80, tabletScale: 1.3, phoneX: -137, phoneScale: 1.3, enter: 112, exit: -124, rotation: 2 };
    }
    return { laptopX: 18, laptopScale: 1.08, tabletX: -82, tabletScale: 1.3, phoneX: -137, phoneScale: 1.28, enter: 118, exit: -130, rotation: 2.4 };
  };

  const setInitialState = () => {
    const pose = getPose();
    stage.classList.add('sequence-animated');
    stage.classList.remove('sequence-complete');
    setStep(0);
    gsap.set(laptop, { xPercent: pose.enter, yPercent: -5, scale: .94, rotation: pose.rotation, autoAlpha: 0, zIndex: 8 });
    gsap.set(tablet, { xPercent: pose.enter, yPercent: 0, scale: pose.tabletScale * .9, rotation: pose.rotation, autoAlpha: 0, zIndex: 7 });
    gsap.set(phone, { xPercent: 92, yPercent: 0, scale: pose.phoneScale * .9, rotation: pose.rotation, autoAlpha: 0, zIndex: 9 });
    gsap.set(streak, { x: 0, autoAlpha: 0 });
  };

  const addSwipe = (motion, at) => {
    motion
      .fromTo(streak, { x: () => -stage.clientWidth * .16, autoAlpha: 0 }, { x: () => stage.clientWidth * .18, autoAlpha: .72, duration: .18, ease: 'power2.out' }, at)
      .to(streak, { x: () => stage.clientWidth * 1.35, autoAlpha: 0, duration: .56, ease: 'power2.in' }, at + .18);
  };

  const buildTimeline = () => {
    const pose = getPose();
    const motion = gsap.timeline({
      paused: true,
      defaults: { ease: 'power3.inOut' },
      onStart: () => stage.classList.add('sequence-playing'),
      onComplete: () => {
        stage.classList.remove('sequence-playing', 'sequence-animated');
        stage.classList.add('sequence-complete');
        setStep(3);
        gsap.set(devices, { clearProps: 'transform,opacity,visibility,zIndex,willChange' });
        gsap.set(streak, { clearProps: 'transform,opacity,visibility' });
      }
    });

    motion
      .call(() => setStep(0), null, 0)
      .to(laptop, { xPercent: pose.laptopX, yPercent: -5, scale: pose.laptopScale, rotation: 0, autoAlpha: 1, duration: .8, ease: 'power4.out' }, 0)
      .to(laptop, { xPercent: pose.exit, yPercent: -7, scale: .95, rotation: -pose.rotation, autoAlpha: 0, duration: .74 }, 1.55)
      .call(() => setStep(1), null, 1.72)
      .fromTo(tablet, { xPercent: pose.enter, yPercent: 0, scale: pose.tabletScale * .9, rotation: pose.rotation, autoAlpha: 0 }, { xPercent: pose.tabletX, yPercent: 0, scale: pose.tabletScale, rotation: 0, autoAlpha: 1, duration: .8, ease: 'power4.out' }, 1.68)
      .to(tablet, { xPercent: pose.exit - 62, yPercent: 0, scale: pose.tabletScale * .94, rotation: -pose.rotation, autoAlpha: 0, duration: .74 }, 3.18)
      .call(() => setStep(2), null, 3.35)
      .fromTo(phone, { xPercent: 92, yPercent: 0, scale: pose.phoneScale * .9, rotation: pose.rotation, autoAlpha: 0 }, { xPercent: pose.phoneX, yPercent: -1, scale: pose.phoneScale, rotation: 0, autoAlpha: 1, duration: .8, ease: 'power4.out' }, 3.31)
      .set(laptop, { xPercent: pose.enter, yPercent: 0, scale: .84, rotation: pose.rotation, autoAlpha: 0, zIndex: 2 }, 4.72)
      .set(tablet, { xPercent: pose.exit - 52, yPercent: 0, scale: .84, rotation: -pose.rotation, autoAlpha: 0, zIndex: 3 }, 4.72)
      .call(() => setStep(3), null, 4.72)
      .to(phone, { xPercent: 0, yPercent: 0, scale: 1, rotation: 2.1, autoAlpha: 1, zIndex: 5, duration: 1.16, ease: 'power4.out' }, 4.72)
      .to(laptop, { xPercent: 0, yPercent: 0, scale: 1, rotation: .35, autoAlpha: 1, zIndex: 2, duration: 1.16, ease: 'power4.out' }, 4.72)
      .to(tablet, { xPercent: 0, yPercent: 0, scale: 1, rotation: -1.5, autoAlpha: 1, zIndex: 3, duration: 1.12, ease: 'power4.out' }, 4.82);

    addSwipe(motion, 1.5);
    addSwipe(motion, 3.13);
    addSwipe(motion, 4.66);
    return motion;
  };

  setInitialState();

  const observer = new IntersectionObserver((entries) => {
    const entry = entries[0];
    if (!entry) return;

    if (!started && entry.isIntersecting && entry.intersectionRatio >= .18) {
      started = true;
      timeline = buildTimeline();
      timeline.play();
      return;
    }

    if (!started || !timeline || timeline.progress() >= 1) return;

    if (!entry.isIntersecting && !timeline.paused()) {
      pausedByViewport = true;
      timeline.pause();
    } else if (entry.isIntersecting && pausedByViewport && !document.hidden) {
      pausedByViewport = false;
      timeline.resume();
    }
  }, { threshold: [0, .18] });

  observer.observe(stage);

  window.addEventListener('resize', () => {
    if (!started) setInitialState();
  }, { passive: true });

  document.addEventListener('visibilitychange', () => {
    if (!timeline || timeline.progress() >= 1) return;
    if (document.hidden && !timeline.paused()) {
      pausedByDocument = true;
      timeline.pause();
    } else if (!document.hidden && pausedByDocument && !pausedByViewport) {
      pausedByDocument = false;
      timeline.resume();
    }
  });
})();
