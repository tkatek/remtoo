"use strict";

document.documentElement.classList.add("js-enabled");

function enhancePlatformFeatureLinks() {
  document.querySelectorAll("#platform .platform-feature-card").forEach((card) => {
    const heading = card.querySelector("h3");
    const link = card.querySelector(".platform-feature-copy a");
    if (!heading || !link) return;

    link.setAttribute("aria-label", "Learn more about " + heading.textContent.trim());
  });
}

const menuButton = document.querySelector(".menu-toggle");
const primaryNavigation = document.querySelector(".primary-navigation");

if (menuButton && primaryNavigation) {
  const closeMenu = ({ returnFocus = false } = {}) => {
    menuButton.setAttribute("aria-expanded", "false");
    menuButton.querySelector(".sr-only").textContent = "Open navigation menu";
    primaryNavigation.classList.remove("open");
    if (returnFocus) menuButton.focus();
  };

  menuButton.addEventListener("click", () => {
    const open = menuButton.getAttribute("aria-expanded") === "true";
    menuButton.setAttribute("aria-expanded", String(!open));
    menuButton.querySelector(".sr-only").textContent = open ? "Open navigation menu" : "Close navigation menu";
    primaryNavigation.classList.toggle("open", !open);
  });

  primaryNavigation.addEventListener("click", (event) => {
    if (event.target.closest("a")) closeMenu();
  });

  document.addEventListener("click", (event) => {
    if (!primaryNavigation.contains(event.target) && !menuButton.contains(event.target)) closeMenu();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && menuButton.getAttribute("aria-expanded") === "true") closeMenu({ returnFocus: true });
  });

  window.matchMedia("(min-width: 1041px)").addEventListener("change", (event) => {
    if (event.matches) closeMenu();
  });
}

function enhancePlatformMobileShowcase() {
  const section = document.querySelector("#platform .mobile-app-section");
  const phoneStage = section?.querySelector(".app-phones");
  const copy = section?.querySelector(".app-copy");

  if (!section || !phoneStage || !copy || section.classList.contains("mobile-photo-showcase")) return;

  const title = copy.querySelector("h2");
  if (title) title.innerHTML = "Learn Everywhere<br>with Our <span>Mobile App</span>";

  const description = copy.querySelector(":scope > p:not(.eyebrow)");
  if (description && !copy.querySelector(".app-benefits")) {
    description.insertAdjacentHTML("afterend", `
      <ul class="app-benefits">
        <li>Learn anytime, anywhere</li>
        <li>Watch videos, practice and play games</li>
        <li>Track your progress and achievements</li>
        <li>A clean and easy-to-use mobile experience</li>
      </ul>
    `);
  }

  phoneStage.innerHTML = `
    <article class="app-phone phone-one" aria-label="My Lessons app screen">
      <div class="app-notch" aria-hidden="true"></div>
      <div class="phone-ui">
        <div class="app-statusbar"><b>9:41</b><span class="status-icons">▮▮▮ ◉ ▰</span></div>
        <header><strong class="screen-action" aria-hidden="true">‹</strong><b>My Lessons</b><span class="notify-dot" aria-hidden="true">♢</span></header>
        <nav class="lesson-filter" aria-label="Lesson filters"><b>In Progress</b><span>Completed</span></nav>
        <div class="app-list">
          <p><i class="thumb landscape-one"></i><span><b>At the Airport</b><small>Lesson 12 · A1</small></span><em class="lesson-progress" style="--progress:80%;--ring:#22c878"><span>80%</span></em></p>
          <p><i class="thumb landscape-two"></i><span><b>At the Doctor</b><small>Lesson 14 · A1</small></span><em class="lesson-progress" style="--progress:60%;--ring:#f3b819;color:#d99a00"><span>60%</span></em></p>
          <p><i class="thumb landscape-three"></i><span><b>At the Grocery Store</b><small>Lesson 08 · A0</small></span><em class="lesson-progress" style="--progress:20%;--ring:#ff7474;color:#e64a4a"><span>20%</span></em></p>
          <p><i class="thumb landscape-four"></i><span><b>Introductions</b><small>Lesson 01 · A0</small></span><em class="lesson-progress" style="--progress:100%;--ring:#22c878"><span>100%</span></em></p>
        </div>
        <div class="app-bottom-nav" aria-hidden="true"><span class="active"><i>⌂</i>Home</span><span><i>▱</i>Lessons</span><span><i>♙</i>Practice</span><span><i>▥</i>Progress</span><span><i>•••</i>More</span></div>
      </div>
    </article>

    <article class="app-phone phone-two" aria-label="Practice app screen">
      <div class="app-notch" aria-hidden="true"></div>
      <div class="phone-ui">
        <div class="app-statusbar"><b>9:41</b><span class="status-icons">▮▮▮ ◉ ▰</span></div>
        <header><span class="screen-action" aria-hidden="true">‹</span><b>Practice</b><strong>2/10</strong></header>
        <div class="exercise-progress" aria-hidden="true"><i></i></div>
        <p class="practice-prompt"><strong>Excuse me, where is the<br>boarding gate?</strong></p>
        <div class="practice-photo"><span>✈ Gates 1–10 ↑</span></div>
        <div class="practice-options">
          <span class="chosen"><b>A</b>It is over there.</span>
          <span><b>B</b>I am fine, thanks.</span>
          <span><b>C</b>It is very expensive.</span>
          <span><b>D</b>Yes, I like it.</span>
        </div>
        <button class="screen-button" type="button" tabindex="-1">Check Answer</button>
      </div>
    </article>

    <article class="app-phone phone-three" aria-label="Matching game app screen">
      <div class="app-notch" aria-hidden="true"></div>
      <div class="phone-ui">
        <div class="app-statusbar"><b>9:41</b><span class="status-icons">▮▮▮ ◉ ▰</span></div>
        <header><span class="screen-action" aria-hidden="true">‹</span><b>Game</b><strong style="color:#f04444">♥ 3</strong></header>
        <p class="game-instruction"><strong>Match the words with the pictures</strong></p>
        <div class="matching-board">
          <div class="matching-row"><span class="matching-word">suitcase</span><i class="match-dot"></i><i class="match-dot"></i><span class="matching-picture">🧳</span></div>
          <div class="matching-row"><span class="matching-word">ticket</span><i class="match-dot"></i><i class="match-dot"></i><span class="matching-picture">🎫</span></div>
          <div class="matching-row"><span class="matching-word">passport</span><i class="match-dot"></i><i class="match-dot"></i><span class="matching-picture">📘</span></div>
          <div class="matching-row"><span class="matching-word">airplane</span><i class="match-dot"></i><i class="match-dot"></i><span class="matching-picture">✈️</span></div>
        </div>
        <button class="screen-button" type="button" tabindex="-1">Check</button>
      </div>
    </article>

    <article class="app-phone phone-four" aria-label="Progress app screen">
      <div class="app-notch" aria-hidden="true"></div>
      <div class="phone-ui">
        <div class="app-statusbar"><b>9:41</b><span class="status-icons">▮▮▮ ◉ ▰</span></div>
        <header><span></span><b>Progress</b><span>•••</span></header>
        <nav class="progress-tabs" aria-label="Progress views"><b>Overview</b><span>Skills</span><span>Certificates</span></nav>
        <div class="app-donut"><strong>85%</strong><small>Overall Progress</small></div>
        <div class="app-mini-chart" aria-hidden="true">
          <svg viewBox="0 0 180 55" preserveAspectRatio="none"><polygon points="0,48 30,36 58,43 83,23 110,34 141,15 180,9 180,55 0,55"></polygon><polyline points="0,48 30,36 58,43 83,23 110,34 141,15 180,9"></polyline></svg>
          <div class="chart-months"><span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span></div>
        </div>
        <div class="skill-bars">
          <p><span>Listening</span><b>90%</b><i style="--value:90%;--bar:#20bd70"></i></p>
          <p><span>Vocabulary</span><b>80%</b><i style="--value:80%;--bar:#0870ef"></i></p>
          <p><span>Grammar</span><b>70%</b><i style="--value:70%;--bar:#7d4cf4"></i></p>
        </div>
        <div class="app-bottom-nav" aria-hidden="true"><span><i>⌂</i>Home</span><span><i>▱</i>Lessons</span><span><i>♙</i>Practice</span><span class="active"><i>▥</i>Progress</span><span><i>•••</i>More</span></div>
      </div>
    </article>
  `;
}

function enhancePlatformTestimonials() {
  const section = document.querySelector("#platform .testimonials-section");
  const shell = section?.querySelector(".container");
  const heading = section?.querySelector(".section-heading");
  const track = section?.querySelector(".testimonial-grid");

  if (!section || !shell || !heading || !track || track.dataset.carouselReady === "true") return;

  const testimonials = [
    {
      quote: "Remtoo has transformed the way we teach English. Our students are more engaged and make faster progress.",
      name: "Maria S.",
      role: "Director, Global Languages",
      image: "assets/images/platform-teacher.webp"
    },
    {
      quote: "The platform is easy to use and the support team is excellent. It is exactly what we needed for our school.",
      name: "Ahmed K.",
      role: "Academic Manager",
      image: "assets/images/platform-student.webp"
    },
    {
      quote: "Our students love the interactive lessons and games. It saves us time and delivers great results.",
      name: "Sophie L.",
      role: "Founder, Bright Future School",
      image: "assets/images/brand-classroom.webp"
    },
    {
      quote: "We launched our branded academy quickly, and families immediately understood the new learning experience.",
      name: "Lina R.",
      role: "Principal, Horizon Languages",
      image: "assets/images/platform-teacher.webp"
    },
    {
      quote: "Teachers save hours every week while still giving each learner a clear, structured path forward.",
      name: "David M.",
      role: "Operations Director, Northbridge",
      image: "assets/images/platform-student.webp"
    },
    {
      quote: "The progress reports make parent conversations clearer and help our team support students sooner.",
      name: "Nour A.",
      role: "Program Lead, City Language Institute",
      image: "assets/images/grocery-lesson.webp"
    },
    {
      quote: "Having lessons, practice, assessment, and reporting in one place has made our whole program more consistent.",
      name: "Carlos P.",
      role: "School Owner, Global English Hub",
      image: "assets/images/brand-classroom.webp"
    }
  ];

  shell.classList.add("testimonial-carousel-shell");
  section.setAttribute("role", "region");
  section.setAttribute("aria-roledescription", "carousel");
  section.setAttribute("aria-labelledby", "testimonials-title");
  track.dataset.carouselReady = "true";
  track.setAttribute("data-testimonial-carousel", "");
  track.setAttribute("role", "group");
  track.setAttribute("aria-roledescription", "carousel");
  track.setAttribute("aria-label", "School testimonials. Drag or use the left and right arrow keys to browse.");
  track.setAttribute("tabindex", "0");
  track.style.touchAction = "pan-y pinch-zoom";

  if (!heading.querySelector(".testimonial-subtitle")) {
    heading.insertAdjacentHTML("beforeend", '<p class="testimonial-subtitle">Real experiences from school leaders and teachers using Remtoo.</p>');
  }

  shell.querySelector(".testimonial-carousel-controls")?.remove();

  const slideMarkup = (item, index, copy) => {
    const cloneAttributes = copy === "canonical"
      ? ' role="listitem" aria-posinset="' + (index + 1) + '" aria-setsize="' + testimonials.length + '"'
      : ' data-carousel-clone="" aria-hidden="true" inert';

    return '<article class="testimonial-card' + (copy === "canonical" ? "" : " testimonial-card-clone") + '" data-testimonial-index="' + index + '" data-carousel-copy="' + copy + '"' + cloneAttributes + '>' +
      '<blockquote>“' + item.quote + '”</blockquote>' +
      '<footer><img src="' + item.image + '" alt="" width="96" height="96" loading="lazy" decoding="async" draggable="false"><p><strong>' + item.name + '</strong><small>' + item.role + '</small></p></footer>' +
    '</article>';
  };

  const rail = document.createElement("div");
  rail.className = "testimonial-rail";
  rail.setAttribute("role", "list");
  rail.setAttribute("aria-label", "School testimonials");
  rail.innerHTML = ["previous", "canonical", "next"].map(copy =>
    testimonials.map((item, index) => slideMarkup(item, index, copy)).join("")
  ).join("");

  const announcer = document.createElement("span");
  announcer.className = "testimonial-announcer sr-only";
  announcer.setAttribute("aria-live", "polite");
  announcer.setAttribute("aria-atomic", "true");
  track.replaceChildren(rail, announcer);

  const cards = [...rail.querySelectorAll(".testimonial-card")];
  const canonicalCards = [...rail.querySelectorAll('[data-carousel-copy="canonical"]')];
  const nextCards = [...rail.querySelectorAll('[data-carousel-copy="next"]')];
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let logicalPosition = 0;
  let activeIndex = -1;
  let slidePitch = 1;
  let cycleWidth = 1;
  let canonicalFirstCenter = 0;
  let animationFrame = 0;
  let measureFrame = 0;
  let announceTimer = 0;
  let dragState = null;

  const wrapIndex = index => ((index % testimonials.length) + testimonials.length) % testimonials.length;
  const wrapPosition = value => ((value % testimonials.length) + testimonials.length) % testimonials.length;
  const clamp = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, value));

  const updateActiveCard = (force = false) => {
    const nextIndex = wrapIndex(Math.round(logicalPosition));
    if (!force && nextIndex === activeIndex) return;

    activeIndex = nextIndex;
    track.dataset.activeIndex = String(activeIndex);

    cards.forEach(card => {
      const cardIndex = Number(card.dataset.testimonialIndex);
      const forwardDistance = wrapIndex(cardIndex - activeIndex);
      const cyclicDistance = Math.min(forwardDistance, testimonials.length - forwardDistance);
      const isActive = cardIndex === activeIndex;
      const isCanonical = card.dataset.carouselCopy === "canonical";

      card.classList.toggle("is-active", isActive);
      card.classList.toggle("is-near", !isActive && cyclicDistance === 1);

      if (!isCanonical) return;

      if (isActive) {
        card.setAttribute("aria-current", "true");
        card.removeAttribute("aria-hidden");
      } else {
        card.removeAttribute("aria-current");
        card.setAttribute("aria-hidden", "true");
      }
    });
  };

  const render = (nextPosition = logicalPosition, forceState = false) => {
    logicalPosition = nextPosition;

    if (cycleWidth > 0 && slidePitch > 0) {
      const phase = wrapPosition(logicalPosition);
      const requestedCenter = canonicalFirstCenter + phase * slidePitch;
      const translate = track.clientWidth / 2 - requestedCenter;
      rail.style.transform = "translate3d(" + translate + "px, 0, 0)";
    }

    updateActiveCard(forceState);
  };

  const announceActiveCard = () => {
    window.clearTimeout(announceTimer);
    announcer.textContent = "";
    announceTimer = window.setTimeout(() => {
      const item = testimonials[activeIndex];
      announcer.textContent = "Testimonial " + (activeIndex + 1) + " of " + testimonials.length + ": " + item.name + ", " + item.role;
    }, 30);
  };

  const finishSettle = (target, announce) => {
    logicalPosition = wrapPosition(target);
    render(logicalPosition, true);
    if (announce) announceActiveCard();
  };

  const settleTo = (target, { announce = true } = {}) => {
    window.cancelAnimationFrame(animationFrame);
    animationFrame = 0;

    const start = logicalPosition;
    const distance = target - start;

    if (reducedMotion.matches || Math.abs(distance) < 0.001) {
      finishSettle(target, announce);
      return;
    }

    const startedAt = performance.now();
    const duration = clamp(220 + Math.abs(distance) * 90, 220, 460);

    const animate = now => {
      const progress = clamp((now - startedAt) / duration, 0, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      render(start + distance * eased);

      if (progress < 1) {
        animationFrame = window.requestAnimationFrame(animate);
      } else {
        animationFrame = 0;
        finishSettle(target, announce);
      }
    };

    animationFrame = window.requestAnimationFrame(animate);
  };

  const measure = () => {
    measureFrame = 0;
    const firstCanonical = canonicalCards[0];
    const firstNext = nextCards[0];
    if (!firstCanonical || !firstNext || !track.clientWidth) return;

    const previousPitch = slidePitch;
    const measuredCycle = firstNext.offsetLeft - firstCanonical.offsetLeft;
    if (measuredCycle <= 0) return;

    cycleWidth = measuredCycle;
    slidePitch = measuredCycle / testimonials.length;
    canonicalFirstCenter = firstCanonical.offsetLeft + firstCanonical.offsetWidth / 2;

    if (dragState?.intent === "horizontal" && previousPitch > 0) {
      const now = performance.now();
      dragState.startX = dragState.lastX;
      dragState.startPosition = logicalPosition;
      dragState.lastPosition = logicalPosition;
      dragState.startedAt = now;
      dragState.lastTime = now;
      dragState.velocity = 0;
      dragState.hasVelocitySample = false;
      dragState.samples = [{ position: logicalPosition, time: now }];
    }

    render(logicalPosition, true);
  };

  const scheduleMeasure = () => {
    window.cancelAnimationFrame(measureFrame);
    measureFrame = window.requestAnimationFrame(measure);
  };

  const capturePointer = pointerId => {
    try {
      if (!track.hasPointerCapture(pointerId)) track.setPointerCapture(pointerId);
    } catch {
      /* Pointer capture can fail if the pointer ended between events. */
    }
  };

  const releasePointer = pointerId => {
    try {
      if (track.hasPointerCapture(pointerId)) track.releasePointerCapture(pointerId);
    } catch {
      /* The browser may already have released capture. */
    }
  };

  const onPointerDown = event => {
    if (!event.isPrimary || (event.pointerType === "mouse" && event.button !== 0)) return;

    window.cancelAnimationFrame(animationFrame);
    animationFrame = 0;

    const now = event.timeStamp || performance.now();
    dragState = {
      pointerId: event.pointerId,
      intent: "pending",
      startX: event.clientX,
      startY: event.clientY,
      startPosition: logicalPosition,
      startedAt: now,
      lastX: event.clientX,
      lastPosition: logicalPosition,
      lastTime: now,
      velocity: 0,
      hasVelocitySample: false,
      samples: [{ position: logicalPosition, time: now }]
    };

    if (event.pointerType === "mouse") {
      event.preventDefault();
      capturePointer(event.pointerId);
      track.focus({ preventScroll: true });
    }
  };

  const onPointerMove = event => {
    if (!dragState || event.pointerId !== dragState.pointerId) return;

    const deltaX = event.clientX - dragState.startX;
    const deltaY = event.clientY - dragState.startY;
    const absoluteX = Math.abs(deltaX);
    const absoluteY = Math.abs(deltaY);

    if (dragState.intent === "pending") {
      if (Math.max(absoluteX, absoluteY) < 7) return;

      if (absoluteY > absoluteX * 1.1) {
        dragState.intent = "vertical";
        return;
      }

      if (absoluteX <= absoluteY * 1.1) return;

      dragState.intent = "horizontal";
      track.classList.add("is-dragging");
      capturePointer(event.pointerId);
    }

    if (dragState.intent !== "horizontal") return;

    event.preventDefault();
    const now = event.timeStamp || performance.now();
    const nextPosition = dragState.startPosition - deltaX / slidePitch;
    const elapsed = Math.max(1, now - dragState.lastTime);

    if (elapsed < 100) {
      const instantaneousVelocity = (nextPosition - dragState.lastPosition) / elapsed;
      dragState.velocity = dragState.hasVelocitySample
        ? dragState.velocity * 0.68 + instantaneousVelocity * 0.32
        : instantaneousVelocity;
      dragState.hasVelocitySample = true;
    } else {
      dragState.velocity = 0;
      dragState.hasVelocitySample = false;
    }

    dragState.lastX = event.clientX;
    dragState.lastPosition = nextPosition;
    dragState.lastTime = now;
    dragState.samples.push({ position: nextPosition, time: now });
    const sampleCutoff = now - 110;
    while (dragState.samples.length > 2 && dragState.samples[1].time < sampleCutoff) {
      dragState.samples.shift();
    }
    render(nextPosition);
  };

  const finishDrag = (event, cancelled = false) => {
    if (!dragState || (event?.pointerId !== undefined && event.pointerId !== dragState.pointerId)) return;

    const completedDrag = dragState;
    dragState = null;
    track.classList.remove("is-dragging");
    releasePointer(completedDrag.pointerId);

    if (completedDrag.intent !== "horizontal") return;

    const now = event?.timeStamp || performance.now();
    const idleTime = Math.max(0, now - completedDrag.lastTime);
    const firstSample = completedDrag.samples[0];
    const lastSample = completedDrag.samples[completedDrag.samples.length - 1];
    const sampleDuration = Math.max(1, lastSample.time - firstSample.time);
    const sampledVelocity = (lastSample.position - firstSample.position) / sampleDuration;
    const gestureDuration = Math.max(1, now - completedDrag.startedAt);
    const gestureVelocity = gestureDuration <= 120
      ? (logicalPosition - completedDrag.startPosition) / gestureDuration
      : 0;
    const strongestVelocity = [completedDrag.velocity, sampledVelocity, gestureVelocity].reduce(
      (strongest, candidate) => Math.abs(candidate) > Math.abs(strongest) ? candidate : strongest,
      0
    );
    const releaseVelocity = idleTime > 110
      ? 0
      : strongestVelocity * Math.max(0, 1 - idleTime / 140);
    const travel = logicalPosition - completedDrag.startPosition;
    const isShortFlick = !cancelled &&
      gestureDuration <= 120 &&
      idleTime <= 110 &&
      Math.abs(travel) >= 0.08 &&
      Math.abs(travel) < 0.5;
    const velocityThreshold = 0.0012;
    const distanceThreshold = 0.18;
    const direction = Math.sign(Math.abs(releaseVelocity) >= velocityThreshold ? releaseVelocity : travel);
    const projectedTravel = clamp(releaseVelocity * 180, -1.35, 1.35);
    const nearest = Math.round(logicalPosition);
    let target = Math.round(logicalPosition + projectedTravel);

    target = clamp(target, nearest - 2, nearest + 2);

    if (isShortFlick) {
      target = Math.round(completedDrag.startPosition) + Math.sign(travel);
    } else if (
      direction &&
      (Math.abs(releaseVelocity) >= velocityThreshold || Math.abs(travel) >= distanceThreshold) &&
      target === Math.round(completedDrag.startPosition)
    ) {
      target += direction;
    }

    settleTo(target, { announce: !cancelled });
  };

  track.addEventListener("pointerdown", onPointerDown);
  track.addEventListener("pointermove", onPointerMove, { passive: false });
  track.addEventListener("pointerup", event => finishDrag(event));
  track.addEventListener("pointercancel", event => finishDrag(event, true));
  track.addEventListener("lostpointercapture", event => finishDrag(event, true));
  track.addEventListener("dragstart", event => event.preventDefault());

  track.addEventListener("keydown", event => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const direction = event.key === "ArrowRight" ? 1 : -1;
    settleTo(Math.round(logicalPosition) + direction);
  });

  window.addEventListener("blur", () => finishDrag(null, true));
  window.addEventListener("orientationchange", scheduleMeasure, { passive: true });

  if ("ResizeObserver" in window) {
    const resizeObserver = new ResizeObserver(scheduleMeasure);
    resizeObserver.observe(track);
    resizeObserver.observe(canonicalCards[0]);
  } else {
    window.addEventListener("resize", scheduleMeasure, { passive: true });
  }

  if (document.fonts?.ready) document.fonts.ready.then(scheduleMeasure);
  if (typeof reducedMotion.addEventListener === "function") {
    reducedMotion.addEventListener("change", () => {
      if (!reducedMotion.matches || !animationFrame) return;
      window.cancelAnimationFrame(animationFrame);
      animationFrame = 0;
      finishSettle(Math.round(logicalPosition), false);
    });
  }

  updateActiveCard(true);
  measure();
  window.requestAnimationFrame(() => window.requestAnimationFrame(measure));
}

enhancePlatformFeatureLinks();
enhancePlatformMobileShowcase();
enhancePlatformTestimonials();

function runAnimations() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || typeof window.gsap === "undefined") return;

  const { gsap } = window;
  const timeline = gsap.timeline({ defaults: { ease: "power3.out" } });

  timeline
    .from('[data-animate="header"]', { y: -24, autoAlpha: 0, duration: 0.55 })
    .from("[data-hero-copy]", { y: 34, autoAlpha: 0, duration: 0.68, stagger: 0.1 }, "-=0.2")
    .from(".hero-shape, .corner-shape", { scale: 0.72, autoAlpha: 0, duration: 0.75, stagger: 0.08 }, "-=0.58")
    .from('[data-device="laptop"]', { x: 54, y: 18, rotation: 1.6, scale: 0.95, autoAlpha: 0, duration: 0.9 }, "-=0.62")
    .from('[data-device="phone"]', { x: -34, y: 30, rotation: -3, scale: 0.9, autoAlpha: 0, duration: 0.72 }, "-=0.45")
    .from(".hand-note", { y: 12, rotation: -13, autoAlpha: 0, duration: 0.5, stagger: 0.12 }, "-=0.25")
    .from("[data-feature]", { y: 18, autoAlpha: 0, duration: 0.48, stagger: 0.08 }, "-=0.25");

  const revealItems = document.querySelectorAll("[data-reveal]:not(.app-phones):not(.platform-feature-card)");
  gsap.set(revealItems, { y: 28, autoAlpha: 0 });

  const observer = new IntersectionObserver((entries, currentObserver) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      gsap.to(entry.target, { y: 0, autoAlpha: 1, duration: 0.65, ease: "power3.out" });
      currentObserver.unobserve(entry.target);
    });
  }, { threshold: 0.14 });

  revealItems.forEach((item) => observer.observe(item));

  const featureGrid = document.querySelector("#platform .features-section .feature-grid");
  const featureCards = featureGrid ? [...featureGrid.querySelectorAll(".platform-feature-card")] : [];

  if (featureGrid && featureCards.length) {
    let featureCardsHaveAnimated = false;

    gsap.set(featureCards, {
      y: 56,
      autoAlpha: 0,
      scale: 0.94,
      rotation: (index) => (index - (featureCards.length - 1) / 2) * 0.55,
      transformOrigin: "50% 82%"
    });

    const revealFeatureCards = () => {
      if (featureCardsHaveAnimated) return;
      featureCardsHaveAnimated = true;
      gsap.to(featureCards, {
        y: 0,
        autoAlpha: 1,
        scale: 1,
        rotation: 0,
        duration: 0.82,
        stagger: 0.11,
        ease: "power3.out",
        clearProps: "transform,opacity,visibility"
      });
    };

    if ("IntersectionObserver" in window) {
      const featureObserver = new IntersectionObserver((entries, currentObserver) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        revealFeatureCards();
        currentObserver.disconnect();
      }, { threshold: 0.18, rootMargin: "0px 0px -7% 0px" });
      featureObserver.observe(featureGrid);
    } else {
      revealFeatureCards();
    }
  }

  const phoneStage = document.querySelector("#platform .mobile-app-section .app-phones");
  const appPhones = phoneStage ? [...phoneStage.querySelectorAll(".app-phone")] : [];

  if (phoneStage && appPhones.length) {
    const finalRotation = (phone) => parseFloat(getComputedStyle(phone).getPropertyValue("--phone-rotation")) || 0;
    let phonesHaveAnimated = false;

    gsap.set(appPhones, {
      y: (index) => 145 + index * 14,
      autoAlpha: 0,
      scale: 0.94,
      rotation: (index, phone) => finalRotation(phone) + (index % 2 ? 2.5 : -2.5),
      transformOrigin: "50% 52%"
    });

    const revealPhones = () => {
      if (phonesHaveAnimated) return;
      phonesHaveAnimated = true;
      gsap.to(appPhones, {
        y: 0,
        autoAlpha: 1,
        scale: 1,
        rotation: (index, phone) => finalRotation(phone),
        duration: 0.92,
        stagger: 0.17,
        ease: "power4.out",
        clearProps: "transform,opacity,visibility"
      });
    };

    if ("IntersectionObserver" in window) {
      const phoneObserver = new IntersectionObserver((entries, currentObserver) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        revealPhones();
        currentObserver.disconnect();
      }, { threshold: 0.18, rootMargin: "0px 0px -5% 0px" });
      phoneObserver.observe(phoneStage);
    } else {
      revealPhones();
    }
  }
}

window.addEventListener("load", runAnimations, { once: true });
