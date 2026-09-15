"use strict";

document.documentElement.classList.add("js-enabled");

const curriculumMenuButton = document.querySelector(".curr-menu-toggle");
const curriculumNavigation = document.querySelector(".curr-navigation");

if (curriculumMenuButton && curriculumNavigation) {
  const menuLabel = curriculumMenuButton.querySelector(".sr-only");

  const closeCurriculumMenu = ({ returnFocus = false } = {}) => {
    curriculumMenuButton.setAttribute("aria-expanded", "false");
    curriculumNavigation.classList.remove("open");
    if (menuLabel) menuLabel.textContent = "Open navigation menu";
    if (returnFocus) curriculumMenuButton.focus();
  };

  curriculumMenuButton.addEventListener("click", () => {
    const isOpen = curriculumMenuButton.getAttribute("aria-expanded") === "true";
    curriculumMenuButton.setAttribute("aria-expanded", String(!isOpen));
    curriculumNavigation.classList.toggle("open", !isOpen);
    if (menuLabel) menuLabel.textContent = isOpen ? "Open navigation menu" : "Close navigation menu";
  });

  curriculumNavigation.addEventListener("click", event => {
    if (event.target.closest("a")) closeCurriculumMenu();
  });

  document.addEventListener("click", event => {
    if (!curriculumNavigation.contains(event.target) && !curriculumMenuButton.contains(event.target)) closeCurriculumMenu();
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && curriculumMenuButton.getAttribute("aria-expanded") === "true") closeCurriculumMenu({ returnFocus: true });
  });

  window.matchMedia("(min-width: 1025px)").addEventListener("change", event => {
    if (event.matches) closeCurriculumMenu();
  });
}

function runCurriculumAnimations() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || typeof window.gsap === "undefined") return;

  const { gsap } = window;
  const heroTimeline = gsap.timeline({ defaults: { ease: "power3.out" } });

  heroTimeline
    .from("[data-curr-header]", { y: -22, autoAlpha: 0, duration: .5 })
    .from("[data-hero-item]", { y: 30, autoAlpha: 0, duration: .62, stagger: .09 }, "-=.18")
    .from(".curriculum-laptop", { x: 60, y: 20, rotation: 1.5, scale: .95, autoAlpha: 0, duration: .85 }, "-=.52")
    .from(".curriculum-phone", { x: 34, y: 30, rotation: 3, scale: .9, autoAlpha: 0, duration: .7 }, "-=.45")
    .from(".hero-note, .note-rays", { y: 10, autoAlpha: 0, duration: .48, stagger: .08 }, "-=.2");

  const revealOne = element => {
    gsap.to(element, { y: 0, autoAlpha: 1, duration: .66, ease: "power3.out", clearProps: "transform,opacity,visibility" });
  };

  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      revealOne(entry.target);
      observer.unobserve(entry.target);
    });
  }, { threshold: .13, rootMargin: "0px 0px -5% 0px" });

  document.querySelectorAll("[data-curr-reveal]").forEach(element => {
    gsap.set(element, { y: 28, autoAlpha: 0 });
    revealObserver.observe(element);
  });

  document.querySelectorAll("[data-stagger-group]").forEach(group => {
    const items = [...group.children];
    if (!items.length) return;
    gsap.set(items, { y: 40, autoAlpha: 0, scale: .975 });

    const groupObserver = new IntersectionObserver((entries, observer) => {
      if (!entries.some(entry => entry.isIntersecting)) return;
      gsap.to(items, {
        y: 0,
        autoAlpha: 1,
        scale: 1,
        duration: .68,
        stagger: .085,
        ease: "power3.out",
        clearProps: "transform,opacity,visibility"
      });
      observer.disconnect();
    }, { threshold: .12, rootMargin: "0px 0px -4% 0px" });

    groupObserver.observe(group);
  });
}

window.addEventListener("load", runCurriculumAnimations, { once: true });

const lessonStepTrack = document.querySelector("#lesson-flow .lesson-steps");

if (lessonStepTrack) {
  let lessonTrackFrame;
  const syncLessonTrackKeyboardAccess = () => {
    cancelAnimationFrame(lessonTrackFrame);
    lessonTrackFrame = requestAnimationFrame(() => {
      const canScroll = lessonStepTrack.scrollWidth > lessonStepTrack.clientWidth + 2;
      if (canScroll) lessonStepTrack.setAttribute("tabindex", "0");
      else lessonStepTrack.removeAttribute("tabindex");
    });
  };

  window.addEventListener("load", syncLessonTrackKeyboardAccess, { once: true });
  window.addEventListener("resize", syncLessonTrackKeyboardAccess, { passive: true });
  syncLessonTrackKeyboardAccess();
}
