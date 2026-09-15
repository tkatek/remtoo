(() => {
  const menuButton = document.querySelector('.menu-toggle');
  const navigation = document.querySelector('.primary-navigation');

  if (menuButton && navigation) {
    const closeMenu = () => {
      menuButton.setAttribute('aria-expanded', 'false');
      navigation.classList.remove('open');
      const label = menuButton.querySelector('.sr-only');
      if (label) label.textContent = 'Open navigation menu';
    };

    menuButton.addEventListener('click', () => {
      const willOpen = menuButton.getAttribute('aria-expanded') !== 'true';
      menuButton.setAttribute('aria-expanded', String(willOpen));
      navigation.classList.toggle('open', willOpen);
      const label = menuButton.querySelector('.sr-only');
      if (label) label.textContent = willOpen ? 'Close navigation menu' : 'Open navigation menu';
    });

    navigation.addEventListener('click', (event) => {
      if (event.target.closest('a')) closeMenu();
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeMenu();
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth > 900) closeMenu();
    });
  }

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion || typeof window.gsap === 'undefined') return;

  const { gsap } = window;
  gsap.set('[data-hero-copy], [data-highlight], [data-device]', { visibility: 'visible' });

  const intro = gsap.timeline({ defaults: { ease: 'power3.out' } });
  intro
    .from('[data-animate="header"]', { y: -24, opacity: 0, duration: .65 })
    .from('[data-hero-copy]', { y: 24, opacity: 0, duration: .62, stagger: .1 }, '-=.28')
    .from('[data-highlight]', { y: 18, opacity: 0, scale: .94, duration: .5, stagger: .07 }, '-=.35')
    .from('[data-device="laptop"]', { x: 45, opacity: 0, scale: .94, duration: .85 }, '-=.65')
    .from('[data-device="phone"]', { x: 34, y: 12, opacity: 0, rotate: 3, duration: .7 }, '-=.48')
    .from('.hero-note', { opacity: 0, y: -8, duration: .45 }, '-=.25');

  const revealItems = [...document.querySelectorAll('[data-reveal]')];
  if (!('IntersectionObserver' in window)) {
    gsap.set(revealItems, { clearProps: 'all' });
    return;
  }

  gsap.set(revealItems, { opacity: 0, y: 28 });
  const observer = new IntersectionObserver((entries, currentObserver) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      gsap.to(entry.target, { opacity: 1, y: 0, duration: .68, ease: 'power3.out', clearProps: 'transform' });
      currentObserver.unobserve(entry.target);
    });
  }, { threshold: .12, rootMargin: '0px 0px -4% 0px' });
  revealItems.forEach((item) => observer.observe(item));
})();
