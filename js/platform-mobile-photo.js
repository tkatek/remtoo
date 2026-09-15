(() => {
  "use strict";

  const section = document.querySelector("#platform .mobile-app-section");
  const layout = section?.querySelector(".app-layout");
  const copy = section?.querySelector(".app-copy");
  const phoneStage = section?.querySelector(".app-phones");

  if (!section || !layout || !copy || !phoneStage) return;

  section.classList.remove("mobile-reference-showcase");
  section.classList.add("mobile-photo-showcase");
  layout.classList.remove("container");

  const eyebrow = copy.querySelector(".eyebrow");
  const title = copy.querySelector("h2");
  const description = copy.querySelector(":scope > p:not(.eyebrow)");

  if (eyebrow) {
    eyebrow.innerHTML = `
      <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="7" y="2.8" width="10" height="18.4" rx="2"></rect><path d="M10 6h4m-3 12h2"></path></svg>
      <span>Mobile App</span>
    `;
  }

  if (title) {
    title.innerHTML = '<span>Learn Everywhere</span><span>with Our <strong>Mobile App</strong></span>';
  }

  if (description) {
    description.textContent = "Take Remtoo Academy wherever you go. Access lessons, practice, and track your progress on iOS and Android.";
  }

  let benefits = copy.querySelector(".app-benefits");
  if (!benefits && description) {
    benefits = document.createElement("ul");
    benefits.className = "app-benefits";
    description.insertAdjacentElement("afterend", benefits);
  }

  if (benefits) {
    benefits.innerHTML = `
      <li>Learn anytime, anywhere</li>
      <li>Watch videos and practice</li>
      <li>Track progress and achievements</li>
      <li>One simple mobile experience</li>
    `;
  }

  const storeBadges = [...copy.querySelectorAll(".store-badges a")];
  ["iOS", "Android"].forEach((platform, index) => {
    const badge = storeBadges[index];
    if (!badge) return;

    badge.href = "demo.html#book-demo";
    badge.setAttribute("aria-label", "See the " + platform + " app in a demo");
    const eyebrow = badge.querySelector("small");
    const label = badge.querySelector("strong");
    if (eyebrow) eyebrow.textContent = "SEE IT IN A DEMO";
    if (label) label.textContent = platform + " App";
  });

  const storeIcons = copy.querySelectorAll(".store-badges a > span");
  if (storeIcons[0]) {
    storeIcons[0].innerHTML = '<svg viewBox="0 0 28 34" aria-hidden="true"><path d="M22.7 18c0-4.3 3.6-6.4 3.8-6.5-2-3-5.2-3.4-6.3-3.4-2.7-.3-5.2 1.6-6.5 1.6-1.4 0-3.5-1.6-5.7-1.6-2.9 0-5.6 1.7-7.1 4.2-3 5.2-.8 12.9 2.2 17.1 1.5 2 3.2 4.3 5.5 4.2 2.2-.1 3-1.4 5.7-1.4 2.6 0 3.4 1.4 5.7 1.4 2.4 0 3.9-2.1 5.3-4.2 1.7-2.4 2.3-4.8 2.4-5-0.1 0-5-1.9-5-6.4ZM18.5 5.3c1.2-1.5 2.1-3.6 1.8-5.7-1.8.1-4 .1-5.4 1.8-1.2 1.4-2.2 3.5-1.9 5.5 2 .2 4.1-.1 5.5-1.6Z"></path></svg>';
  }
  if (storeIcons[1]) {
    storeIcons[1].innerHTML = '<svg viewBox="0 0 32 36" aria-hidden="true"><path fill="#35c76f" d="M2 2.3 18.8 18 2 33.7c-.8-.7-1.2-1.8-1.2-3V5.3c0-1.2.4-2.3 1.2-3Z"></path><path fill="#3aa7ff" d="m21.1 15.9-5.4-5.1L5.1.7C6-.1 7.3-.2 8.4.4l17.8 10.2-5.1 5.3Z"></path><path fill="#ffd447" d="m26.2 25.4-17.8 10.2c-1.1.6-2.4.5-3.3-.3l10.6-10.1 5.4-5.1 5.1 5.3Z"></path><path fill="#ff5b55" d="M31.2 15.7c1.4.8 1.4 3 0 3.8l-5 2.9-5.1-5.3 5.1-5.3 5 2.9Z"></path></svg>';
  }

  phoneStage.className = "app-phone-gallery";
  phoneStage.removeAttribute("data-reveal");
  phoneStage.setAttribute("role", "group");
  phoneStage.setAttribute("aria-label", "Three Remtoo Academy mobile screens: lessons, practice, and progress");
  phoneStage.innerHTML = `
    <span class="phone-gallery-halo" aria-hidden="true"></span>
    <span class="phone-gallery-trail" aria-hidden="true"></span>
    <img class="phone-photo phone-photo-lessons" data-mobile-phone src="assets/images/remtoo-phone-lessons.webp" alt="Remtoo Academy My Lessons screen on a phone" width="1086" height="1448" loading="lazy" decoding="async">
    <img class="phone-photo phone-photo-practice" data-mobile-phone src="assets/images/remtoo-phone-practice.webp" alt="Remtoo Academy practice exercise on a phone" width="1122" height="1402" loading="lazy" decoding="async">
    <img class="phone-photo phone-photo-progress" data-mobile-phone src="assets/images/remtoo-phone-progress.webp" alt="Remtoo Academy progress dashboard on a phone" width="1024" height="1536" loading="lazy" decoding="async">
  `;

  const phonePhotos = [...phoneStage.querySelectorAll("[data-mobile-phone]")];
  const halo = phoneStage.querySelector(".phone-gallery-halo");
  const trail = phoneStage.querySelector(".phone-gallery-trail");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  if (reducedMotion.matches || typeof window.gsap === "undefined") {
    phoneStage.classList.add("phones-ready");
    return;
  }

  const { gsap } = window;
  let hasAnimated = false;

  gsap.set(phonePhotos, {
    y: (index) => 155 + index * 18,
    x: (index) => (index - 1) * 34,
    rotation: (index) => [-13, 3, 14][index],
    scale: .88,
    autoAlpha: 0,
    transformOrigin: "50% 85%"
  });
  gsap.set(halo, { scale: .72, autoAlpha: 0 });
  gsap.set(trail, { scaleX: 0, autoAlpha: 0, transformOrigin: "0 50%" });

  const revealPhones = async () => {
    if (hasAnimated) return;
    hasAnimated = true;

    await Promise.all(phonePhotos.map(image => image.decode().catch(() => undefined)));
    phoneStage.classList.add("phones-ready");

    gsap.timeline({
      defaults: { ease: "power4.out" },
      onComplete: () => gsap.set(phonePhotos, { clearProps: "transform,opacity,visibility" })
    })
      .to(halo, { scale: 1, autoAlpha: 1, duration: .72 }, 0)
      .to(trail, { scaleX: 1, autoAlpha: .7, duration: .55 }, .12)
      .to(phonePhotos, {
        y: 0,
        x: 0,
        rotation: 0,
        scale: 1,
        autoAlpha: 1,
        duration: .88,
        stagger: .17,
        ease: "back.out(1.12)"
      }, .08)
      .to(trail, { autoAlpha: 0, duration: .55 }, .72);
  };

  if (!("IntersectionObserver" in window)) {
    revealPhones();
    return;
  }

  const observer = new IntersectionObserver((entries, currentObserver) => {
    if (!entries.some(entry => entry.isIntersecting)) return;
    currentObserver.disconnect();
    revealPhones();
  }, { threshold: .2, rootMargin: "0px 0px -7% 0px" });

  observer.observe(phoneStage);
})();
