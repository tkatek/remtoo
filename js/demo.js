(() => {
  "use strict";

  const menuButton = document.querySelector(".demo-menu-toggle");
  const navigation = document.querySelector(".demo-navigation");

  const setMenuOpen = open => {
    if (!menuButton || !navigation) return;
    menuButton.setAttribute("aria-expanded", String(open));
    navigation.classList.toggle("open", open);
    const label = menuButton.querySelector(".sr-only");
    if (label) label.textContent = open ? "Close navigation menu" : "Open navigation menu";
  };

  const closeMenu = () => setMenuOpen(false);

  if (menuButton && navigation) {
    menuButton.addEventListener("click", () => {
      const isOpen = menuButton.getAttribute("aria-expanded") === "true";
      setMenuOpen(!isOpen);
    });

    navigation.addEventListener("click", event => {
      if (event.target.closest("a")) closeMenu();
    });

    document.addEventListener("click", event => {
      if (!navigation.contains(event.target) && !menuButton.contains(event.target)) closeMenu();
    });

    document.addEventListener("keydown", event => {
      if (event.key === "Escape" && menuButton.getAttribute("aria-expanded") === "true") {
        closeMenu();
        menuButton.focus();
      }
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 860) closeMenu();
    });
  }

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  const monthLabel = document.querySelector("[data-calendar-month]");
  const calendarGrid = document.querySelector("[data-calendar-grid]");
  const selectedDateLabel = document.querySelector("[data-selected-date]");
  const dateInput = document.querySelector('input[name="demoDate"]');
  const timeInput = document.querySelector('input[name="demoTime"]');
  const previousMonth = document.querySelector("[data-calendar-previous]");
  const nextMonth = document.querySelector("[data-calendar-next]");
  const moreTimesButton = document.querySelector("[data-more-times]");
  const timeButtons = [...document.querySelectorAll("[data-time]")];
  const extraTimes = [...document.querySelectorAll(".extra-time")];

  const startOfLocalDay = value => new Date(value.getFullYear(), value.getMonth(), value.getDate());
  const today = startOfLocalDay(new Date());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  let calendarMonth = tomorrow.getMonth();
  let calendarYear = tomorrow.getFullYear();
  let selectedDate = new Date(tomorrow);
  let focusedDate = new Date(tomorrow);

  const monthFormatter = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" });
  const dateFormatter = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric"
  });

  const toIsoDate = date => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const updateSelectedDate = date => {
    selectedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    if (selectedDateLabel) selectedDateLabel.textContent = dateFormatter.format(selectedDate);
    if (dateInput) dateInput.value = toIsoDate(selectedDate);
  };

  const animateCalendarChoice = button => {
    if (reducedMotion.matches || !window.gsap) return;
    window.gsap.fromTo(button, { scale: 0.82 }, { scale: 1, duration: 0.34, ease: "back.out(2)" });
  };

  const calendarKeyOffsets = Object.freeze({
    ArrowLeft: -1,
    ArrowRight: 1,
    ArrowUp: -7,
    ArrowDown: 7
  });

  const renderCalendar = () => {
    if (!calendarGrid || !monthLabel) return;
    const firstDay = new Date(calendarYear, calendarMonth, 1);
    const gridStart = new Date(calendarYear, calendarMonth, 1 - firstDay.getDay());
    const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
    const totalCells = Math.ceil((firstDay.getDay() + daysInMonth) / 7) * 7;
    const isEarliestMonth = calendarYear === today.getFullYear() && calendarMonth === today.getMonth();
    monthLabel.textContent = monthFormatter.format(firstDay);
    if (previousMonth) {
      previousMonth.disabled = isEarliestMonth;
      previousMonth.setAttribute("aria-disabled", String(isEarliestMonth));
    }
    calendarGrid.replaceChildren();

    for (let index = 0; index < totalCells; index += 1) {
      const date = new Date(gridStart);
      date.setDate(gridStart.getDate() + index);
      const button = document.createElement("button");
      const isOutside = date.getMonth() !== calendarMonth;
      const isSelected = toIsoDate(date) === toIsoDate(selectedDate);
      const isFocusTarget = toIsoDate(date) === toIsoDate(focusedDate);
      const isPast = startOfLocalDay(date) < today;
      button.type = "button";
      button.textContent = String(date.getDate());
      button.dataset.date = toIsoDate(date);
      button.setAttribute("aria-label", dateFormatter.format(date));
      button.setAttribute("aria-pressed", String(isSelected));
      button.tabIndex = isFocusTarget && !isPast ? 0 : -1;
      button.disabled = isPast;
      if (isOutside) button.classList.add("outside");
      if (isPast) button.classList.add("past");
      if (isSelected) button.classList.add("selected");
      if (toIsoDate(date) === toIsoDate(today)) button.setAttribute("aria-current", "date");

      button.addEventListener("click", () => {
        const chosenDate = startOfLocalDay(date);
        if (chosenDate < today) return;
        calendarMonth = chosenDate.getMonth();
        calendarYear = chosenDate.getFullYear();
        focusedDate = new Date(chosenDate);
        updateSelectedDate(chosenDate);
        renderCalendar();
        const currentChoice = calendarGrid.querySelector(".selected");
        if (currentChoice) {
          currentChoice.focus();
          animateCalendarChoice(currentChoice);
        }
      });

      button.addEventListener("keydown", event => {
        const offset = calendarKeyOffsets[event.key];
        if (!offset) return;
        event.preventDefault();
        const targetDate = startOfLocalDay(date);
        targetDate.setDate(targetDate.getDate() + offset);
        if (targetDate < today) return;
        focusedDate = new Date(targetDate);
        calendarMonth = targetDate.getMonth();
        calendarYear = targetDate.getFullYear();
        renderCalendar();
        calendarGrid.querySelector(`[data-date="${toIsoDate(targetDate)}"]`)?.focus();
      });
      calendarGrid.append(button);
    }

    if (!calendarGrid.querySelector('button[tabindex="0"]')) {
      const fallback = [...calendarGrid.querySelectorAll("button:not(:disabled)")].find(button =>
        !button.classList.contains("outside")
      ) || calendarGrid.querySelector("button:not(:disabled)");
      if (fallback) {
        fallback.tabIndex = 0;
        const [year, month, day] = fallback.dataset.date.split("-").map(Number);
        focusedDate = new Date(year, month - 1, day);
      }
    }
  };

  previousMonth?.addEventListener("click", () => {
    if (calendarYear === today.getFullYear() && calendarMonth === today.getMonth()) return;
    calendarMonth -= 1;
    if (calendarMonth < 0) {
      calendarMonth = 11;
      calendarYear -= 1;
    }
    renderCalendar();
  });

  nextMonth?.addEventListener("click", () => {
    calendarMonth += 1;
    if (calendarMonth > 11) {
      calendarMonth = 0;
      calendarYear += 1;
    }
    renderCalendar();
  });

  const syncExtraTimeVisibility = () => {
    const expanded = moreTimesButton?.getAttribute("aria-expanded") === "true";
    extraTimes.forEach(button => {
      button.hidden = !expanded && !button.classList.contains("selected");
    });
  };

  const selectTime = (button, focus = false) => {
    timeButtons.forEach(item => {
      const selected = item === button;
      item.classList.toggle("selected", selected);
      item.setAttribute("aria-checked", String(selected));
      item.tabIndex = selected ? 0 : -1;
    });
    if (timeInput) timeInput.value = button.dataset.time;
    syncExtraTimeVisibility();
    if (focus) button.focus();
    if (!reducedMotion.matches && window.gsap) {
      window.gsap.fromTo(button, { scale: 0.97 }, { scale: 1, duration: 0.28, ease: "back.out(1.8)" });
    }
  };

  timeButtons.forEach(button => {
    button.addEventListener("click", () => selectTime(button));
    button.addEventListener("keydown", event => {
      if (!["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp"].includes(event.key)) return;
      event.preventDefault();
      const visibleTimes = timeButtons.filter(item => !item.hidden);
      const currentIndex = visibleTimes.indexOf(button);
      const direction = event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : -1;
      const nextIndex = (currentIndex + direction + visibleTimes.length) % visibleTimes.length;
      selectTime(visibleTimes[nextIndex], true);
    });
  });

  const initialTime = timeButtons.find(button => button.classList.contains("selected")) || timeButtons[0];
  if (initialTime) selectTime(initialTime);

  moreTimesButton?.addEventListener("click", () => {
    const expanded = moreTimesButton.getAttribute("aria-expanded") === "true";
    moreTimesButton.setAttribute("aria-expanded", String(!expanded));
    moreTimesButton.childNodes[0].textContent = expanded ? "Show more times " : "Show fewer times ";
    syncExtraTimeVisibility();
  });

  updateSelectedDate(selectedDate);
  renderCalendar();

  const form = document.querySelector("#booking-form");
  const status = document.querySelector("[data-form-status]");
  const submitButtons = [...document.querySelectorAll(
    '[data-demo-submit], button[type="submit"][form="booking-form"], #booking-form button[type="submit"]'
  )];
  const submitButtonLabels = new Map(submitButtons.map(button => [button, button.innerHTML]));
  const formFields = form ? [...form.querySelectorAll('input:not([type="hidden"]), select, textarea')] : [];
  const fieldErrors = new Map();
  let statusTimer;
  let submitResetTimer;

  const showStatus = message => {
    if (!status) return;
    status.textContent = message;
    status.classList.add("visible");
    window.clearTimeout(statusTimer);
    statusTimer = window.setTimeout(() => status.classList.remove("visible"), 6500);
  };

  const clearFieldError = field => {
    field.classList.remove("invalid");
    field.setAttribute("aria-invalid", "false");
    const error = fieldErrors.get(field);
    if (error) {
      error.hidden = true;
      error.textContent = "";
      field.removeAttribute("aria-describedby");
    }
  };

  const fieldNames = {
    fullName: "Your name",
    schoolName: "School or organization name",
    email: "Email address",
    website: "School website",
    country: "Country",
    studentCount: "Approximate number of students"
  };

  const getFieldValidationMessage = field => {
    const fieldName = fieldNames[field.name] || "This field";
    if (field.validity.valueMissing) return `${fieldName} is required.`;
    if (field.type === "email" && field.validity.typeMismatch) {
      return "Enter a complete email address, such as name@school.org.";
    }
    if (field.type === "url" && field.validity.typeMismatch) {
      return "Enter a valid website address, such as https://school.org.";
    }
    if (field.validity.tooShort) return `${fieldName} is too short.`;
    if (field.validity.tooLong) return `${fieldName} is too long.`;
    return `Check ${fieldName.toLowerCase()} and try again.`;
  };

  formFields.forEach((field, index) => {
    const label = field.closest("label");
    if (label) {
      const error = document.createElement("span");
      error.className = "demo-field-error";
      error.id = `demo-field-error-${index + 1}`;
      error.hidden = true;
      label.append(error);
      fieldErrors.set(field, error);
    }
    field.setAttribute("aria-invalid", "false");
    field.addEventListener("input", () => clearFieldError(field));
    field.addEventListener("change", () => clearFieldError(field));
  });

  form?.addEventListener("submit", event => {
    event.preventDefault();
    const websiteField = form.querySelector('input[name="website"]');
    if (websiteField?.value && !/^https?:\/\//i.test(websiteField.value)) {
      websiteField.value = `https://${websiteField.value.trim()}`;
    }

    const invalidFields = formFields.filter(field => !field.checkValidity());
    formFields.forEach(field => {
      if (!invalidFields.includes(field)) {
        clearFieldError(field);
        return;
      }
      field.classList.add("invalid");
      field.setAttribute("aria-invalid", "true");
      const error = fieldErrors.get(field);
      if (error) {
        error.textContent = getFieldValidationMessage(field);
        error.hidden = false;
        field.setAttribute("aria-describedby", error.id);
      }
    });

    if (invalidFields.length) {
      invalidFields[0].focus();
      showStatus("Please complete the highlighted school details before booking.");
      return;
    }

    const dateText = selectedDateLabel?.textContent || "your selected date";
    const timeText = timeInput?.value || "your selected time";
    try {
      sessionStorage.setItem("remtoo-demo-request", JSON.stringify(Object.fromEntries(new FormData(form).entries())));
    } catch {
      // The confirmation remains available even when browser storage is disabled.
    }
    showStatus(`Your demo preferences are saved for ${dateText} at ${timeText}.`);
    submitButtons.forEach(button => {
      button.textContent = "Preferences Saved ✓";
    });
    window.clearTimeout(submitResetTimer);
    submitResetTimer = window.setTimeout(() => {
      submitButtons.forEach(button => {
        button.innerHTML = submitButtonLabels.get(button) || "Book My Demo";
      });
    }, 6500);
  });

  const runMotion = () => {
    const gsap = window.gsap;
    if (!gsap || reducedMotion.matches) return;

    const intro = [...document.querySelectorAll("[data-demo-intro]")];
    const device = document.querySelector("[data-demo-device]");
    const heroPhone = document.querySelector(".demo-hero-phone");

    gsap.set(intro, { opacity: 0, y: 18 });
    if (device) gsap.set(device, { opacity: 0, x: 36, scale: 0.975 });
    if (heroPhone) gsap.set(heroPhone, { x: 24, rotation: 2.5 });

    const heroTimeline = gsap.timeline({ defaults: { ease: "power3.out" } });
    heroTimeline
      .to(intro, { opacity: 1, y: 0, duration: 0.62, stagger: 0.075, clearProps: "transform,opacity" })
      .to(device, { opacity: 1, x: 0, scale: 1, duration: 0.82, clearProps: "transform,opacity" }, 0.16)
      .to(heroPhone, { x: 0, rotation: 0, duration: 0.72, clearProps: "transform" }, 0.38);

    const revealTargets = [...document.querySelectorAll("[data-demo-reveal]")];
    const compactMotion = window.matchMedia("(max-width: 620px)").matches;
    const travel = compactMotion ? 10 : 16;
    const fadeTargets = revealTargets.filter(target => target.classList.contains("demo-testimonials"));

    gsap.set(revealTargets, { y: compactMotion ? 12 : 20 });
    gsap.set(fadeTargets, { opacity: 0 });

    const revealTarget = target => {
      const timeline = gsap.timeline({ defaults: { ease: "power3.out" } });
      const heading = target.querySelector(".demo-panel-heading, .demo-schedule-intro");

      timeline.to(target, {
        opacity: 1,
        y: 0,
        duration: 0.62,
        force3D: true,
        clearProps: "transform,opacity"
      }, 0);

      if (target.classList.contains("demo-details-panel")) {
        const fields = target.querySelectorAll(".demo-fields-grid > label");
        const preview = target.querySelector(".demo-preview-card");
        const previewItems = preview?.querySelectorAll("li") || [];

        timeline
          .fromTo(heading, { opacity: 0, x: -travel }, {
            opacity: 1,
            x: 0,
            duration: 0.52,
            clearProps: "transform,opacity"
          }, 0.06)
          .fromTo(fields, { y: 8 }, {
            y: 0,
            duration: 0.42,
            stagger: 0.045,
            clearProps: "transform,opacity"
          }, 0.16)
          .fromTo(preview, { opacity: 0, x: travel }, {
            opacity: 1,
            x: 0,
            duration: 0.58,
            clearProps: "transform,opacity"
          }, 0.12)
          .fromTo(previewItems, { opacity: 0, y: 9 }, {
            opacity: 1,
            y: 0,
            duration: 0.36,
            stagger: 0.055,
            clearProps: "transform,opacity"
          }, 0.3);
        return;
      }

      if (target.classList.contains("demo-schedule-panel")) {
        const calendar = target.querySelector(".demo-calendar");
        const timePicker = target.querySelector(".demo-time-picker");
        const times = target.querySelectorAll(".demo-time-list button:not([hidden])");
        const durationCard = target.querySelector(".demo-duration-card");

        timeline
          .fromTo(heading, { opacity: 0, x: -travel }, {
            opacity: 1,
            x: 0,
            duration: 0.5,
            clearProps: "transform,opacity"
          }, 0.06)
          .fromTo(calendar, { y: 10, scale: 0.99 }, {
            y: 0,
            scale: 1,
            duration: 0.56,
            clearProps: "transform,opacity"
          }, 0.15)
          .fromTo(timePicker, { x: travel }, {
            x: 0,
            duration: 0.5,
            clearProps: "transform,opacity"
          }, 0.2)
          .fromTo(times, { y: 6 }, {
            y: 0,
            duration: 0.3,
            stagger: 0.035,
            clearProps: "transform,opacity"
          }, 0.34)
          .fromTo(durationCard, { opacity: 0, x: travel }, {
            opacity: 1,
            x: 0,
            duration: 0.6,
            clearProps: "transform,opacity"
          }, 0.16);
        return;
      }

      if (target.classList.contains("demo-testimonials")) {
        const title = target.querySelector("h2");
        const introduction = target.querySelector(".demo-testimonials-intro");
        const cards = target.querySelectorAll(".demo-testimonial-grid article");

        timeline
          .fromTo([title, introduction], { opacity: 0, y: 12 }, {
            opacity: 1,
            y: 0,
            duration: 0.46,
            stagger: 0.08,
            clearProps: "transform,opacity"
          }, 0.05)
          .fromTo(cards, { opacity: 0, y: 16, scale: 0.99 }, {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.52,
            stagger: 0.09,
            clearProps: "transform,opacity"
          }, 0.18);
        return;
      }

      if (target.classList.contains("demo-final-cta")) {
        const rocket = target.querySelector(".demo-rocket");
        const copy = target.querySelector(":scope > div:not(.demo-cta-action)");
        const action = target.querySelector(".demo-cta-action");

        timeline
          .fromTo(rocket, { opacity: 0, scale: 0.72, rotation: -10 }, {
            opacity: 1,
            scale: 1,
            rotation: 0,
            duration: 0.62,
            ease: "back.out(1.45)",
            clearProps: "transform,opacity"
          }, 0.04)
          .fromTo(copy, { opacity: 0, y: 11 }, {
            opacity: 1,
            y: 0,
            duration: 0.46,
            clearProps: "transform,opacity"
          }, 0.12)
          .fromTo(action, { x: travel }, {
            x: 0,
            duration: 0.5,
            clearProps: "transform,opacity"
          }, 0.2);
      }
    };

    if (!("IntersectionObserver" in window)) {
      revealTargets.forEach(revealTarget);
      return;
    }

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        observer.unobserve(entry.target);
        revealTarget(entry.target);
      });
    }, { threshold: 0.08, rootMargin: "0px 0px 10% 0px" });

    revealTargets.forEach(target => observer.observe(target));

    const finishMotion = event => {
      if (!event.matches) return;
      const nestedTargets = revealTargets.flatMap(target => [...target.querySelectorAll(
        ".demo-panel-heading, .demo-schedule-intro, .demo-fields-grid > label, .demo-preview-card, .demo-preview-card li, .demo-calendar, .demo-time-picker, .demo-time-list button, .demo-duration-card, .demo-testimonials > h2, .demo-testimonials-intro, .demo-testimonial-grid article, .demo-rocket, .demo-final-cta > div"
      )]);
      const motionTargets = [...intro, device, heroPhone, ...revealTargets, ...nestedTargets].filter(Boolean);
      observer.disconnect();
      heroTimeline.kill();
      gsap.killTweensOf(motionTargets);
      gsap.set(motionTargets, { clearProps: "transform,opacity,visibility" });
      reducedMotion.removeEventListener?.("change", finishMotion);
    };

    reducedMotion.addEventListener?.("change", finishMotion);
  };

  runMotion();
})();
