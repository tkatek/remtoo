(() => {
  'use strict';

  document.documentElement.classList.add('js-enabled');

  const menuButton = document.querySelector('.home-menu-toggle');
  const navigation = document.querySelector('.home-navigation');

  if (menuButton && navigation) {
    const closeMenu = (returnFocus = false) => {
      menuButton.setAttribute('aria-expanded', 'false');
      navigation.classList.remove('open');
      const label = menuButton.querySelector('.sr-only');
      if (label) label.textContent = 'Open navigation menu';
      if (returnFocus) menuButton.focus();
    };

    menuButton.addEventListener('click', () => {
      const opening = menuButton.getAttribute('aria-expanded') !== 'true';
      menuButton.setAttribute('aria-expanded', String(opening));
      navigation.classList.toggle('open', opening);
      const label = menuButton.querySelector('.sr-only');
      if (label) label.textContent = opening ? 'Close navigation menu' : 'Open navigation menu';
    });

    navigation.addEventListener('click', event => {
      if (event.target.closest('a')) closeMenu();
    });

    document.addEventListener('click', event => {
      if (!navigation.contains(event.target) && !menuButton.contains(event.target)) closeMenu();
    });

    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') closeMenu(true);
    });

    window.matchMedia('(min-width: 901px)').addEventListener('change', event => {
      if (event.matches) closeMenu();
    });
  }

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reducedMotion || typeof window.gsap === 'undefined') return;

  const { gsap } = window;
  const intro = gsap.timeline({ defaults: { ease: 'power3.out' } });
  intro
    .from('[data-home-header]', { y: -20, autoAlpha: 0, duration: .55 })
    .from('[data-home-intro]', { y: 28, autoAlpha: 0, duration: .66, stagger: .09 }, '-=.22')
    .from('[data-home-device]', { x: 42, y: 12, scale: .96, autoAlpha: 0, duration: .88 }, '-=.52')
    .from('[data-home-phone]', { x: 24, y: 24, rotation: 4, scale: .9, autoAlpha: 0, duration: .62 }, '-=.38');
})();
