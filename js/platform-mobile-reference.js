(() => {
  const section = document.querySelector("#platform .mobile-app-section");
  const layout = section?.querySelector(".app-layout");
  const copy = section?.querySelector(".app-copy");
  const phoneStage = section?.querySelector(".app-phones");

  if (!section || !layout || !copy || !phoneStage) return;

  section.classList.add("mobile-reference-showcase");

  const title = copy.querySelector("h2");
  const description = copy.querySelector(":scope > p:not(.eyebrow)");
  const eyebrow = copy.querySelector(".eyebrow");

  if (eyebrow) {
    eyebrow.innerHTML = `
      <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="7" y="2.8" width="10" height="18.4" rx="2"></rect><path d="M10 6h4m-3 12h2"></path></svg>
      <span>Mobile App</span>
    `;
  }

  if (title) title.innerHTML = '<span class="title-first-line">Learn Everywhere</span><span class="title-second-line">with Our <span class="title-accent">Mobile App</span></span>';
  if (description) {
    description.textContent = "Take REMTOO Academy with you wherever you go. Access lessons, practice, and track your progress on the fly. Available on iOS and Android.";
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
      <li>Watch videos, practice and play games</li>
      <li>Track your progress and achievements</li>
      <li>A clean and easy-to-use mobile experience</li>
    `;
  }

  phoneStage.setAttribute("aria-label", "Remtoo Academy lesson, practice, and progress screens on three phones");
  phoneStage.innerHTML = `
    <article class="app-phone phone-one lesson-device" aria-label="My Lessons screen">
      <div class="app-notch" aria-hidden="true"></div>
      <div class="phone-ui">
        <div class="app-statusbar"><b>9:41</b><span class="status-icons" aria-hidden="true"><i class="signal">▮▮▮</i><i class="wifi">⌁</i><i class="battery"></i></span></div>
        <div class="academy-brand-row">
          <span aria-hidden="true"></span>
          <span class="academy-brand"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 9 9-5 9 5-9 5-9-5Z"></path><path d="M7 12.3v4.1c2.9 2 7.1 2 10 0v-4.1M21 9v6"></path></svg><span><b>REMTOO</b><small>Academy</small></span></span>
          <span class="notify-bell" aria-hidden="true">♧</span>
        </div>
        <div class="screen-title-row"><span class="screen-action" aria-hidden="true">‹</span><b>My Lessons</b><span class="see-all">See all</span></div>
        <nav class="lesson-filter" aria-label="Lesson filters"><b>In Progress</b><span>Completed</span></nav>
        <div class="app-list">
          <p><i class="thumb landscape-one"></i><span><b>At the Airport</b><small>Lesson 12 · Travel</small></span><em class="lesson-progress" style="--progress:80%;--ring:#20c777"><span>80%</span></em></p>
          <p><i class="thumb landscape-two"></i><span><b>At the Doctor</b><small>Lesson 14 · Health</small></span><em class="lesson-progress amber" style="--progress:60%;--ring:#f1b71b"><span>60%</span></em></p>
          <p><i class="thumb landscape-three"></i><span><b>At the Grocery Store</b><small>Lesson 08 · Daily Life</small></span><em class="lesson-progress coral" style="--progress:20%;--ring:#ff7474"><span>20%</span></em></p>
          <p><i class="thumb landscape-four"></i><span><b>Introductions</b><small>Lesson 01 · Basics</small></span><em class="lesson-progress" style="--progress:100%;--ring:#20c777"><span>100%</span></em></p>
        </div>
        <div class="app-bottom-nav" aria-hidden="true"><span class="active"><i>⌂</i>Home</span><span><i>▱</i>Lessons</span><span><i>♙</i>Practice</span><span><i>▥</i>Progress</span><span><i>•••</i>More</span></div>
      </div>
    </article>

    <article class="app-phone phone-two practice-device" aria-label="Practice screen">
      <div class="app-notch" aria-hidden="true"></div>
      <div class="phone-ui">
        <div class="app-statusbar"><b>9:41</b><span class="status-icons" aria-hidden="true"><i class="signal">▮▮▮</i><i class="wifi">⌁</i><i class="battery"></i></span></div>
        <header><span class="screen-action" aria-hidden="true">‹</span><b>Practice</b><strong>2/10</strong></header>
        <div class="exercise-progress" aria-hidden="true"><i></i></div>
        <p class="practice-prompt"><strong>Excuse me, where is the<br>boarding gate?</strong></p>
        <div class="practice-photo" aria-hidden="true"><span>✈ Gates 1–100 ↑</span></div>
        <div class="practice-options">
          <span class="chosen"><b>A</b>It is over there.</span>
          <span><b>B</b>I am fine, thanks.</span>
          <span><b>C</b>It is very expensive.</span>
          <span><b>D</b>Yes, I like it.</span>
        </div>
        <div class="screen-button" aria-hidden="true">Check Answer</div>
      </div>
    </article>

    <article class="app-phone phone-three progress-device" aria-label="My Progress screen">
      <div class="app-notch" aria-hidden="true"></div>
      <div class="phone-ui">
        <div class="app-statusbar"><b>9:41</b><span class="status-icons" aria-hidden="true"><i class="signal">▮▮▮</i><i class="wifi">⌁</i><i class="battery"></i></span></div>
        <div class="academy-brand-row">
          <span class="screen-action" aria-hidden="true">‹</span>
          <span class="academy-brand"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 9 9-5 9 5-9 5-9-5Z"></path><path d="M7 12.3v4.1c2.9 2 7.1 2 10 0v-4.1M21 9v6"></path></svg><span><b>REMTOO</b><small>Academy</small></span></span>
          <span class="notify-bell" aria-hidden="true">♧</span>
        </div>
        <div class="progress-title-row"><b>My Progress</b><span>This Month⌄</span></div>
        <div class="app-donut"><strong>85%</strong><small>Overall Progress</small></div>
        <div class="app-mini-chart" aria-hidden="true">
          <svg viewBox="0 0 210 72" preserveAspectRatio="none"><polygon points="0,53 28,43 56,54 83,29 110,49 137,44 164,32 210,17 210,72 0,72"></polygon><polyline points="0,53 28,43 56,54 83,29 110,49 137,44 164,32 210,17"></polyline></svg>
          <div class="chart-months"><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span></div>
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

  if (!layout.querySelector(".mobile-app-note-left")) {
    layout.insertAdjacentHTML("beforeend", `
      <p class="mobile-app-note mobile-app-note-left" aria-hidden="true">Your goals.<br>Anytime. Anywhere.<span></span></p>
      <p class="mobile-app-note mobile-app-note-right" aria-hidden="true">Smarter<br>Brighter You<span></span></p>
      <span class="mobile-app-rays" aria-hidden="true"><i></i><i></i><i></i></span>
    `);
  }
})();
