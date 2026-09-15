(() => {
  "use strict";

  const icon = (name, className = "") => {
    const paths = {
      brand: '<path d="M12 2.8 20.2 7.5v9L12 21.2l-8.2-4.7v-9L12 2.8Z"></path><path d="m7.2 9.3 4.8-2.7 4.8 2.7-4.8 2.8-4.8-2.8Z"></path><path d="M8.7 11.1v3.2c2 1.4 4.6 1.4 6.6 0v-3.2"></path>',
      video: '<rect x="3.5" y="5" width="17" height="14" rx="2"></rect><path d="m10 9 5 3-5 3V9Z"></path>',
      book: '<path d="M4 5.5c3.4-.8 5.8-.1 8 1.5v12c-2.2-1.6-4.6-2.3-8-1.5v-12Z"></path><path d="M20 5.5c-3.4-.8-5.8-.1-8 1.5v12c2.2-1.6 4.6-2.3 8-1.5v-12Z"></path>',
      pencil: '<path d="m4 16.5-.7 4.2 4.2-.7L19 8.5 15.5 5 4 16.5Z"></path><path d="m13.8 6.7 3.5 3.5"></path>',
      game: '<path d="M7.4 8h9.2a4.8 4.8 0 0 1 4.6 6.1l-1.1 3.8a2.2 2.2 0 0 1-3.7 1l-2.2-2H9.8l-2.2 2a2.2 2.2 0 0 1-3.7-1l-1.1-3.8A4.8 4.8 0 0 1 7.4 8Z"></path><path d="M7.2 11v4m-2-2h4m6.8-.9h.01m2.1 2h.01"></path>',
      clipboard: '<rect x="5" y="4.5" width="14" height="16" rx="2"></rect><path d="M9 4.5V3h6v1.5M8.5 10l1.5 1.5 3-3m-4.5 7H15"></path>',
      gift: '<defs><linearGradient id="sample-gift-top" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#dff1ff"></stop><stop offset="1" stop-color="#8fc4ff"></stop></linearGradient><linearGradient id="sample-gift-left" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#b7dcff"></stop><stop offset="1" stop-color="#6aa9f4"></stop></linearGradient><linearGradient id="sample-gift-right" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#89bfff"></stop><stop offset="1" stop-color="#4f91ee"></stop></linearGradient></defs><path class="gift-spark" d="m2.8 7.7-1.6-1.4M21.2 7.7l1.6-1.4M2.6 12.6H.7m20.7 0h1.9M18.8 4.5l.8-1.8M5.2 4.5l-.8-1.8"></path><path class="gift-top" d="m4.5 9.8 7.5-2.7 7.5 2.7-7.5 3-7.5-3Z"></path><path class="gift-left" d="m4.5 9.8 7.5 3v9l-7-2.6-.5-9.4Z"></path><path class="gift-right" d="m12 12.8 7.5-3-.5 9.4-7 2.6v-9Z"></path><path class="gift-ribbon gift-ribbon-top" d="m9.9 7.9 2.1-.8 2.2.8-2.2 3-2.1-3Z"></path><path class="gift-ribbon gift-ribbon-left" d="m9.9 12 2.1.8v9l-2.1-.8v-9Z"></path><path class="gift-ribbon gift-ribbon-right" d="m12 12.8 2.2-.9v9.1l-2.2.8v-9Z"></path><path class="gift-bow" d="M12 7.1C9.8 7.2 7.1 6.4 7.4 4.6c.3-1.6 2.6-1.1 3.5.2L12 7.1Zm0 0c2.2.1 4.9-.7 4.6-2.5-.3-1.6-2.6-1.1-3.5.2L12 7.1Z"></path>',
      cart: '<path d="M3 4h2l2 11h10.5l2.2-7H6.3M9 20a1.3 1.3 0 1 0 0-2.6A1.3 1.3 0 0 0 9 20Zm8 0a1.3 1.3 0 1 0 0-2.6A1.3 1.3 0 0 0 17 20Z"></path>',
      palette: '<path d="M12 3a9 9 0 0 0 0 18h1.5a2 2 0 0 0 1.3-3.5l-.5-.4a1.6 1.6 0 0 1 1-2.8H17A4 4 0 0 0 21 10c0-4.2-4-7-9-7Z"></path><circle cx="7.5" cy="10" r="1"></circle><circle cx="10" cy="6.8" r="1"></circle><circle cx="14.2" cy="6.6" r="1"></circle><circle cx="17" cy="9.4" r="1"></circle>',
      rocket: '<path d="M14 4c2.8-1.4 5.5-1.2 7-1-.1 1.6.1 4.2-1.3 7l-5.8 5.8-5.7-5.7L14 4Z"></path><circle cx="16.5" cy="7.4" r="1.7"></circle><path d="m8.7 10.7-4.2.7-2.2 2.2 5.1 1.1m5.9.1-1 4.3-2.4 2.2-1-5M4 19c1.7-.6 3.1.8 2.5 2.5-1.6.4-2.8 0-4 .5.6-1.5 0-2.8 1.5-3Z"></path>',
      calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="2.5"></rect><path d="M7.5 3v4m9-4v4m-13 3h17M8 14h.01m4 0h.01m4 0h.01M8 17.5h.01m4 0h.01"></path>',
      globe: '<circle cx="12" cy="12" r="9"></circle><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"></path>',
      lock: '<rect x="5" y="10" width="14" height="11" rx="2"></rect><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 4v3"></path>',
      shield: '<path d="m12 3 7 3v5.2c0 4.4-2.7 7.7-7 9.8-4.3-2.1-7-5.4-7-9.8V6l7-3Z"></path><path d="m8.8 12 2.1 2.1 4.4-4.5"></path>',
      headset: '<path d="M4 14v-2a8 8 0 0 1 16 0v2"></path><path d="M4 13h3v6H5a2 2 0 0 1-2-2v-2a2 2 0 0 1 1-2Zm16 0h-3v6h2a2 2 0 0 0 2-2v-2a2 2 0 0 0-1-2Zm-3 6c-.7 1.2-2.1 2-4 2"></path>',
      refresh: '<path d="M20 7V3l-2 2a8 8 0 0 0-13.2 3M4 17v4l2-2a8 8 0 0 0 13.2-3"></path><path d="M20 3h-4M4 21h4"></path>',
      check: '<circle cx="12" cy="12" r="9"></circle><path d="m8 12 2.7 2.7L16.5 9"></path>',
      arrow: '<path d="M4 12h16m-6-6 6 6-6 6"></path>',
      home: '<path d="m4 11 8-7 8 7v9h-6v-6h-4v6H4v-9Z"></path>',
      leaf: '<path class="transform-leaf-fill" fill="currentColor" stroke="none" d="M3 4.8c3.8.3 6.6 1.8 8.1 4.3v10.4c-1.9-2.1-4.6-3.3-8.1-3.5V4.8Zm18-1.3c-3.9.5-6.7 2.2-8.1 5v11c1.8-2.3 4.6-3.7 8.1-4.1V3.5Z"></path><path class="transform-leaf-vein" d="M12 9v10.5"></path>',
      lessons: '<path d="M5 4h14v16H5zM8 8h8m-8 4h8m-8 4h5"></path>',
      users: '<circle cx="9" cy="8" r="3"></circle><circle cx="17" cy="9" r="2.5"></circle><path d="M3 20v-3a6 6 0 0 1 12 0v3m1-6a5 5 0 0 1 5 5v1"></path>',
      chart: '<path d="M4 20V9m5 11V4m5 16v-7m5 7V7"></path>',
      search: '<circle cx="10.5" cy="10.5" r="6.5"></circle><path d="m15.5 15.5 4.5 4.5"></path>',
      bell: '<path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9ZM9.5 21h5"></path>',
      chevron: '<path d="m8 10 4 4 4-4"></path>',
      settings: '<circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3A1.7 1.7 0 0 0 10 3V2.8h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z"></path>'
    };
    return `<svg class="${className}" viewBox="0 0 24 24" aria-hidden="true">${paths[name] || ""}</svg>`;
  };

  const brandSymbol = icon("brand", "home-brand-symbol");
  document.querySelectorAll(".home-brand > svg").forEach(svg => svg.outerHTML = brandSymbol);

  document.querySelectorAll(".academy-logo > span, .home-phone-brand > span").forEach(mark => {
    mark.innerHTML = icon("brand", "academy-brand-symbol");
  });

  const academySidebarIcons = ["home", "lessons", "book", "pencil", "game", "clipboard", "users", "chart", "users"];
  document.querySelectorAll(".academy-sidebar > span").forEach((item, index) => {
    const label = item.textContent.trim().replace(/^[^A-Za-z]+/, "");
    item.innerHTML = `${icon(academySidebarIcons[index], "academy-sidebar-icon")}<span>${label}</span>`;
  });

  const navigation = document.querySelector(".home-navigation");
  if (navigation && !navigation.querySelector(".home-login-link")) {
    navigation.insertAdjacentHTML("beforeend", '<a class="home-login-link" href="demo.html">Log In</a>');
  }

  const heroStage = document.querySelector(".home-device-stage");
  if (heroStage && !heroStage.querySelector(".home-hero-note")) {
    heroStage.insertAdjacentHTML("beforeend", '<p class="home-hero-note" aria-hidden="true">Your Brand<br>Your Future<span>↙</span></p>');
  }

  const heroLessonImages = [
    { src: "assets/images/home-airport-lesson.png", width: 1672, height: 941 },
    { src: "assets/images/home-introductions-lesson.png", width: 1448, height: 1086 },
    { src: "assets/images/grocery-lesson.webp", width: 1200, height: 675 },
    { src: "assets/images/home-making-plans-lesson.png", width: 1448, height: 1086 }
  ];
  document.querySelectorAll(".home-hero .academy-lessons img").forEach((image, index) => {
    const asset = heroLessonImages[index] || heroLessonImages[0];
    image.src = asset.src;
    image.width = asset.width;
    image.height = asset.height;
  });

  const needsHeading = document.querySelector("#needs-title")?.closest(".home-section-heading");
  if (needsHeading && !needsHeading.querySelector("p")) {
    needsHeading.insertAdjacentHTML("beforeend", '<p>A complete, modern English learning platform — so you can focus on teaching, not technology.</p>');
  }

  const comparisonPromise = document.querySelector(".comparison-promise");
  if (comparisonPromise) {
    comparisonPromise.innerHTML = `
      <span class="comparison-quote" aria-hidden="true">“</span>
      <div class="comparison-message">
        <h3>Focus on teaching. We’ll provide the infrastructure.</h3>
        <span class="comparison-underline" aria-hidden="true"></span>
        <p>A better learning experience<br>for a brighter tomorrow.</p>
      </div>
      <img src="assets/images/home-educator-arms-crossed-cutout.png" alt="Smiling educator with arms crossed" width="1145" height="1374" loading="lazy">
      <p class="comparison-hand-note" aria-hidden="true">Built<br>for Educators<span><i></i><i></i><i></i></span></p>
    `;
  }

  const lessonSources = [
    { src: "assets/images/home-introductions-lesson.png", width: 1448, height: 1086 },
    { src: "assets/images/grocery-lesson.webp", width: 1200, height: 675 },
    { src: "assets/images/home-doctor-lesson.png", width: 1448, height: 1086 },
    { src: "assets/images/home-making-plans-lesson.png", width: 1448, height: 1086 }
  ];
  document.querySelectorAll(".home-lesson-card:not(.sample-card)").forEach((card, index) => {
    const image = card.querySelector("img");
    if (image) {
      const asset = lessonSources[index] || lessonSources[0];
      image.src = asset.src;
      image.width = asset.width;
      image.height = asset.height;
    }
  });

  const lessonIconNames = { Video: "video", Vocabulary: "book", Practice: "pencil", Game: "game", Test: "clipboard" };
  document.querySelectorAll(".lesson-card-body li").forEach(item => {
    const label = item.textContent.trim();
    item.innerHTML = `${icon(lessonIconNames[label], "lesson-feature-icon")}<span>${label}</span>`;
  });

  const sampleGift = document.querySelector(".sample-gift");
  if (sampleGift) sampleGift.innerHTML = icon("gift", "sample-gift-icon");

  const levelPath = document.querySelector(".level-path");
  const levelNames = ["Complete Beginner", "Beginner", "Elementary", "Intermediate", "Upper Intermediate"];
  if (levelPath) {
    [...levelPath.querySelectorAll("b")].forEach((level, index) => {
      const code = level.textContent.trim();
      level.innerHTML = `<strong>${code}</strong><small>${levelNames[index]}</small>`;
    });
  }

  const curriculumHeading = document.querySelector("#path-title")?.closest(".home-section-heading");
  if (curriculumHeading && !curriculumHeading.querySelector("p")) {
    curriculumHeading.insertAdjacentHTML("beforeend", '<p>A structured A0–B2 curriculum with real-world topics and practical skills.</p>');
  }

  const buildDashboard = ({ name, subtitle, color, logo = "brand" }) => `
    <div class="transform-dashboard" style="--dashboard-brand:${color}" aria-hidden="true">
      <div class="transform-dashboard-topbar">
        <div class="transform-dashboard-brand">
          <span>${icon(logo, `transform-dashboard-logo transform-dashboard-logo-${logo}`)}</span>
          <p><b>${name}</b><small>${subtitle}</small></p>
        </div>
        <div class="transform-dashboard-search">
          ${icon("search", "transform-dashboard-search-icon")}
          <span>Search lessons, topics, or students...</span>
        </div>
        <div class="transform-dashboard-user">
          <span class="transform-dashboard-notification">${icon("bell")}<i></i></span>
          <img src="assets/images/home-dashboard-avatar-reference.png" alt="" width="1254" height="1254" loading="lazy">
          <p><b>Emma Carter</b><small>Student</small></p>
          ${icon("chevron", "transform-dashboard-chevron")}
        </div>
      </div>
      <div class="transform-dashboard-body">
        <aside class="transform-dashboard-sidebar">
          <div class="transform-dashboard-nav">
            <p class="active">${icon("home")}<span>Dashboard</span></p>
            <p>${icon("lessons")}<span>Lessons</span></p>
            <p>${icon("book")}<span>Vocabulary</span></p>
            <p>${icon("pencil")}<span>Practice</span></p>
            <p>${icon("users")}<span>Students</span></p>
            <p>${icon("chart")}<span>Reports</span></p>
          </div>
          <p class="transform-dashboard-settings">${icon("settings")}<span>Settings</span></p>
        </aside>
        <div class="transform-dashboard-main">
          <div class="transform-dashboard-welcome">
            <div><strong>Welcome back, Emma!</strong><p>Keep going! You’re making great progress.</p></div>
            <time datetime="2025-04-28">Mon, Apr 28, 2025</time>
          </div>
          <div class="transform-dashboard-content">
            <div class="transform-course-card">
              <div class="transform-course-copy">
                <small>Continue Learning</small>
                <b>At the Airport</b>
                <em>A2 · Unit 3 · Travel</em>
                <span class="transform-dashboard-cta">Continue lesson ${icon("arrow")}</span>
              </div>
              <img src="assets/images/home-airport-lesson.png" alt="" width="1672" height="941" loading="lazy">
            </div>
            <div class="transform-progress-card">
              <div class="transform-progress-ring"><b>75%</b></div>
              <small>Course Progress</small>
            </div>
          </div>
        </div>
      </div>
    </div>`;

  const transformPanel = document.querySelector(".transform-panel");
  if (transformPanel) {
    const proofLabels = ["Your logo", "Your colors", "Your domain", "Your students"];
    const proofItems = proofLabels.map((label, index) => `
      <li>
        <span class="brand-proof-mark" style="--brand-check-delay:${index * 110}ms" aria-hidden="true">
          <svg viewBox="0 0 48 48">
            <circle class="brand-proof-ring" cx="24" cy="24" r="17" pathLength="1"></circle>
            <path class="brand-proof-check-depth" d="m14.5 24.5 7.2 7.1L38 14.5" pathLength="1"></path>
            <path class="brand-proof-check" d="m14.5 24.5 7.2 7.1L38 14.5" pathLength="1"></path>
          </svg>
        </span>
        <span>${label}</span>
      </li>`).join("");

    transformPanel.innerHTML = `
      <div class="transform-copy">
        <div class="transform-heading">
          <p class="transform-kicker">White-label platform</p>
          <h2 id="brand-transform-title">Same powerful learning system.<br>Completely your brand.</h2>
          <span class="transform-headline-underline" aria-hidden="true">
            <svg viewBox="0 0 330 28" preserveAspectRatio="none"><path d="M5 15C91 2 227 2 325 14M36 24c90-18 191-18 251-13"></path></svg>
          </span>
        </div>
        <ul class="transform-proof-list">${proofItems}</ul>
      </div>
      <div class="transform-example is-original">
        <h3><span>Original platform</span></h3>
        ${buildDashboard({ name: "Boston English Center", subtitle: "LANGUAGE ACADEMY", color: "#0b73f6" })}
      </div>
      <span class="transform-bridge" aria-hidden="true">
        <svg viewBox="0 0 250 170" preserveAspectRatio="none"><path d="M5 148C66 137 76 44 159 48c38 2 55 26 86 4"></path></svg>
      </span>
      <span class="transform-arrow" aria-hidden="true">${icon("arrow")}</span>
      <div class="transform-example is-branded">
        <h3><span>Your branded platform</span></h3>
        ${buildDashboard({ name: "YOUR SCHOOL", subtitle: "Language for a brighter tomorrow", color: "#20ad63", logo: "leaf" })}
      </div>
      <span class="transform-dot-grid" aria-hidden="true"></span>
      <span class="transform-rays" aria-hidden="true"><i></i><i></i><i></i></span>
      <p class="transform-impact-note" aria-hidden="true">Your brand.<br>Bigger impact!<span></span></p>
    `;

    const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
    let proofObserver = null;
    const activateProofMarks = () => {
      transformPanel.classList.add("is-brand-proof-active");
      proofObserver?.disconnect();
      proofObserver = null;
    };

    if (motionPreference.matches || !("IntersectionObserver" in window)) {
      activateProofMarks();
    } else {
      proofObserver = new IntersectionObserver((entries) => {
        if (entries.some((entry) => entry.isIntersecting)) activateProofMarks();
      }, { threshold: .28, rootMargin: "0px 0px -8% 0px" });
      proofObserver.observe(transformPanel);
    }

    const handleProofMotionPreference = (event) => {
      if (event.matches) activateProofMarks();
    };
    if (typeof motionPreference.addEventListener === "function") {
      motionPreference.addEventListener("change", handleProofMotionPreference);
    } else {
      motionPreference.addListener(handleProofMotionPreference);
    }
  }

  const stepIcons = ["cart", "palette", "rocket"];
  document.querySelectorAll(".three-steps article").forEach((step, index) => {
    const stepIcon = step.querySelector(".step-icon");
    const title = step.querySelector("b");
    if (stepIcon) stepIcon.innerHTML = icon(stepIcons[index], "step-symbol");
    if (title && !title.textContent.trim().startsWith(`${index + 1}.`)) title.textContent = `${index + 1}. ${title.textContent.trim()}`;
  });

  const calendar = document.querySelector(".logo-calendar");
  if (calendar) calendar.innerHTML = icon("calendar", "calendar-symbol");

  const assuranceIcons = ["globe", "lock", "shield", "headset", "refresh"];
  document.querySelectorAll(".assurance-icon").forEach((item, index) => {
    item.innerHTML = icon(assuranceIcons[index], "assurance-symbol");
  });

  const footerDescription = document.querySelector(".footer-brand-column > p");
  if (footerDescription) footerDescription.innerHTML = "Technology for modern<br>language education.";

  const footerSocialMarkup = `
      <span aria-label="LinkedIn"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 9v9M7 6.5v.1M11 18v-5a4 4 0 0 1 8 0v5M11 10v8"></path></svg></span>
      <span aria-label="YouTube"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="6" width="18" height="12" rx="3"></rect><path d="m10 9 5 3-5 3V9Z"></path></svg></span>
      <span aria-label="X"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 5 14 14M19 5 5 19"></path></svg></span>
    `;
  const footerSocials = document.querySelector(".footer-socials");
  if (footerSocials) {
    footerSocials.setAttribute("aria-hidden", "true");
    footerSocials.innerHTML = footerSocialMarkup;
  }

  const footer = document.querySelector(".home-footer");
  if (footer && !footer.querySelector(".footer-bottom")) {
    footer.insertAdjacentHTML("beforeend", `<div class="footer-bottom"><div class="home-shell"><p>© 2024 Remtoo. All rights reserved.</p><div class="footer-bottom-actions"><div class="footer-socials" aria-hidden="true">${footerSocialMarkup}</div><span class="footer-language">English <span aria-hidden="true">⌄</span></span></div></div></div>`);
  }
})();
