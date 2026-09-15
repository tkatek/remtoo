(() => {
  "use strict";

  const menuButton = document.querySelector(".pricing-menu-toggle");
  const navigation = document.querySelector(".pricing-navigation");
  const menuLabel = menuButton && menuButton.querySelector(".sr-only");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const referenceComparison = document.querySelector(".pricing-reference-main");
  const legacyComparison = document.querySelector(".pricing-legacy-main > .pricing-comparison");
  if (referenceComparison && legacyComparison) legacyComparison.replaceWith(referenceComparison);

  const compareTabs = [...document.querySelectorAll("[data-compare-tab]")];
  const comparePanels = [...document.querySelectorAll("[data-compare-panel]")];
  const compareOverviewItems = [...document.querySelectorAll("[data-compare-overview]")];

  const selectComparePlan = (plan, { focus = false, animate = true } = {}) => {
    const nextTab = compareTabs.find(tab => tab.dataset.compareTab === plan);
    const nextPanel = comparePanels.find(panel => panel.dataset.comparePanel === plan);
    if (!nextTab || !nextPanel) return;

    compareTabs.forEach(tab => {
      const selected = tab === nextTab;
      tab.setAttribute("aria-selected", String(selected));
      tab.tabIndex = selected ? 0 : -1;
    });

    comparePanels.forEach(panel => {
      const selected = panel === nextPanel;
      panel.hidden = !selected;
      panel.classList.toggle("is-active", selected);
      panel.classList.remove("is-entering");
    });

    compareOverviewItems.forEach(item => {
      const selected = item.dataset.compareOverview === plan;
      item.classList.toggle("is-active", selected);
      const button = item.querySelector("button");
      if (button) button.setAttribute("aria-pressed", String(selected));
    });

    if (animate && !reduceMotion) {
      window.requestAnimationFrame(() => nextPanel.classList.add("is-entering"));
      nextPanel.addEventListener("animationend", () => nextPanel.classList.remove("is-entering"), { once: true });
    }

    if (focus) nextTab.focus();
  };

  compareTabs.forEach((tab, index) => {
    tab.addEventListener("click", () => selectComparePlan(tab.dataset.compareTab));
    tab.addEventListener("keydown", event => {
      let nextIndex = index;
      if (event.key === "ArrowRight") nextIndex = (index + 1) % compareTabs.length;
      else if (event.key === "ArrowLeft") nextIndex = (index - 1 + compareTabs.length) % compareTabs.length;
      else if (event.key === "ArrowDown") nextIndex = (index + 2) % compareTabs.length;
      else if (event.key === "ArrowUp") nextIndex = (index - 2 + compareTabs.length) % compareTabs.length;
      else if (event.key === "Home") nextIndex = 0;
      else if (event.key === "End") nextIndex = compareTabs.length - 1;
      else return;

      event.preventDefault();
      selectComparePlan(compareTabs[nextIndex].dataset.compareTab, { focus: true });
    });
  });

  compareOverviewItems.forEach(item => {
    item.querySelector("button")?.addEventListener("click", () => selectComparePlan(item.dataset.compareOverview));
  });

  if (compareTabs.length) {
    const initiallySelected = compareTabs.find(tab => tab.getAttribute("aria-selected") === "true") || compareTabs[0];
    selectComparePlan(initiallySelected.dataset.compareTab, { animate: false });
  }

  const setMenuOpen = open => {
    if (!menuButton || !navigation) return;
    menuButton.setAttribute("aria-expanded", String(open));
    navigation.classList.toggle("open", open);
    if (menuLabel) menuLabel.textContent = open ? "Close navigation menu" : "Open navigation menu";
  };

  if (menuButton && navigation) {
    menuButton.addEventListener("click", () => setMenuOpen(menuButton.getAttribute("aria-expanded") !== "true"));
    navigation.addEventListener("click", event => {
      if (event.target.closest("a")) setMenuOpen(false);
    });
    document.addEventListener("click", event => {
      if (!navigation.contains(event.target) && !menuButton.contains(event.target)) setMenuOpen(false);
    });
    document.addEventListener("keydown", event => {
      if (event.key === "Escape" && menuButton.getAttribute("aria-expanded") === "true") {
        setMenuOpen(false);
        menuButton.focus();
      }
    });
  }

  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener("click", event => {
      const target = document.querySelector(link.getAttribute("href"));
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    });
  });

  document.querySelectorAll(".pricing-plan-card").forEach(card => {
    const planName = card.querySelector("h3")?.textContent.trim();
    const planLink = card.querySelector(".pricing-plan-button");
    if (!planName || !planLink || planLink.hasAttribute("aria-label")) return;

    const visibleLabel = planLink.textContent.trim();
    const relationship = visibleLabel === "Contact Sales" ? "about" : "with";
    planLink.setAttribute("aria-label", `${visibleLabel} ${relationship} the ${planName} plan`);
  });

  const comparisonTable = document.querySelector(".pricing-comparison table");
  if (comparisonTable && !comparisonTable.hasAttribute("aria-label")) {
    comparisonTable.setAttribute("aria-label", "Feature availability by Remtoo pricing plan");
  }

  document.querySelectorAll(
    ".pricing-comparison th[scope='row'] svg, .pricing-brand-promise li svg, .pricing-faq summary svg"
  ).forEach(icon => {
    icon.setAttribute("aria-hidden", "true");
    icon.setAttribute("focusable", "false");
  });

  document.querySelectorAll(".pricing-comparison tbody td").forEach(cell => {
    cell.setAttribute("aria-label", cell.classList.contains("unavailable") ? "Not included" : "Included");
  });

  const billingInputs = [...document.querySelectorAll("input[data-billing]")];
  const priceNodes = [...document.querySelectorAll("[data-monthly][data-annual]")];
  const priceSuffixNodes = [...document.querySelectorAll("[data-monthly-suffix][data-annual-suffix]")];
  const billingDetailNodes = [...document.querySelectorAll("[data-monthly-copy][data-annual-copy]")];
  const billingContext = document.querySelector("[data-billing-context]");
  const billingStatus = document.querySelector("[data-billing-status]");
  const plansSection = document.querySelector(".pricing-plans-section");
  let currentBilling = "";

  const billingContextCopy = {
    monthly: "Flexible monthly billing. Switch to annual to save up to 20%.",
    annual: "Annual prices show the full discounted yearly total, billed once per year."
  };

  const billingStatusCopy = {
    monthly: "Monthly billing selected. Prices are billed monthly.",
    annual: "Annual billing selected. Prices show the full yearly total and are billed annually."
  };

  const billingFromUrl = () => {
    try {
      return new URL(window.location.href).searchParams.get("billing") === "annual" ? "annual" : "monthly";
    } catch {
      return "monthly";
    }
  };

  const updateBillingUrl = period => {
    try {
      const url = new URL(window.location.href);
      if (period === "annual") url.searchParams.set("billing", "annual");
      else url.searchParams.delete("billing");
      window.history.replaceState(null, "", url);
    } catch {
      // The pricing switch still works if URL state is unavailable.
    }
  };

  const setBilling = (period, options = {}) => {
    if (period !== "monthly" && period !== "annual") return;

    const { announce = true, updateUrl = true, animate = true } = options;
    const changed = currentBilling !== period;
    currentBilling = period;

    billingInputs.forEach(input => {
      input.checked = input.dataset.billing === period;
    });

    if (plansSection) plansSection.dataset.billingPeriod = period;

    priceNodes.forEach(node => {
      const nextPrice = node.dataset[period];
      if (window.gsap) window.gsap.killTweensOf(node);
      node.textContent = nextPrice;

      if (changed && animate && !reduceMotion && window.gsap) {
        window.gsap.fromTo(
          node,
          { opacity: .35, y: 4 },
          { opacity: 1, y: 0, duration: .2, ease: "power2.out", overwrite: true, clearProps: "opacity,transform" }
        );
      }
    });

    priceSuffixNodes.forEach(node => {
      const suffixKey = period === "annual" ? "annualSuffix" : "monthlySuffix";
      node.textContent = node.dataset[suffixKey];
    });

    billingDetailNodes.forEach(node => {
      const copyKey = period === "annual" ? "annualCopy" : "monthlyCopy";
      node.textContent = node.dataset[copyKey];
    });

    if (billingContext) billingContext.textContent = billingContextCopy[period];
    if (announce && changed && billingStatus) billingStatus.textContent = billingStatusCopy[period];
    if (updateUrl) updateBillingUrl(period);
  };

  billingInputs.forEach(input => {
    input.addEventListener("change", () => {
      if (input.checked) setBilling(input.dataset.billing);
    });
  });

  window.addEventListener("popstate", () => {
    setBilling(billingFromUrl(), { announce: false, updateUrl: false });
  });

  setBilling(billingFromUrl(), { announce: false, updateUrl: false, animate: false });

  document.querySelectorAll(".pricing-faq details").forEach(detail => {
    const summary = detail.querySelector("summary");
    summary.setAttribute("aria-expanded", "false");
    summary.addEventListener("click", event => {
      event.preventDefault();
      const opening = !detail.open;

      if (reduceMotion || !window.gsap) {
        detail.open = opening;
        summary.setAttribute("aria-expanded", String(opening));
        return;
      }

      window.gsap.killTweensOf(detail);
      const startHeight = detail.offsetHeight;

      if (opening) {
        detail.open = true;
        summary.setAttribute("aria-expanded", "true");
        const endHeight = detail.scrollHeight;
        window.gsap.fromTo(detail,
          { height: startHeight, overflow: "hidden" },
          { height: endHeight, duration: .28, ease: "power2.out", onComplete: () => window.gsap.set(detail, { clearProps: "height,overflow" }) }
        );
      } else {
        summary.setAttribute("aria-expanded", "false");
        window.gsap.to(detail, {
          height: summary.offsetHeight,
          overflow: "hidden",
          duration: .22,
          ease: "power2.inOut",
          onComplete: () => {
            detail.open = false;
            window.gsap.set(detail, { clearProps: "height,overflow" });
          }
        });
      }
    });
  });

  const showWithoutMotion = () => {
    document.querySelectorAll("[data-pricing-intro], [data-pricing-device], [data-pricing-reveal], [data-pricing-plans], .pricing-plan-card").forEach(element => {
      element.style.opacity = "1";
      element.style.transform = "none";
    });
  };

  const runMotion = () => {
    if (reduceMotion || !window.gsap) {
      showWithoutMotion();
      return;
    }

    const intro = [...document.querySelectorAll("[data-pricing-intro]")];
    const device = document.querySelector("[data-pricing-device]");
    const phone = document.querySelector(".pricing-phone");
    const revealGroups = [...document.querySelectorAll("[data-pricing-reveal]")];
    const plans = document.querySelector("[data-pricing-plans]");

    window.gsap.set(intro, { opacity: 0, y: 16 });
    window.gsap.set(device, { opacity: 0, x: 30, scale: .975 });
    window.gsap.set(phone, { y: 35, rotation: 2.5 });
    window.gsap.set(revealGroups, { opacity: 0, y: 22 });
    window.gsap.set(plans, { opacity: 0, y: 18 });

    window.gsap.timeline({ defaults: { ease: "power3.out" } })
      .to(intro, { opacity: 1, y: 0, duration: .55, stagger: .065 }, .08)
      .to(device, { opacity: 1, x: 0, scale: 1, duration: .82 }, .18)
      .to(phone, { y: 0, rotation: 0, duration: .7 }, .38);

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const target = entry.target;
        observer.unobserve(target);

        if (target === plans) {
          const cards = [...target.querySelectorAll(".pricing-plan-card")];
          window.gsap.to(target, { opacity: 1, y: 0, duration: .35, ease: "power2.out" });
          window.gsap.fromTo(cards,
            { y: 24, scale: .985 },
            { y: 0, scale: 1, duration: .48, stagger: .08, ease: "power3.out", clearProps: "transform" }
          );
        } else {
          window.gsap.to(target, { opacity: 1, y: 0, duration: .55, ease: "power3.out", clearProps: "transform" });
        }
      });
    }, { threshold: .13, rootMargin: "0px 0px -5%" });

    if (plans) observer.observe(plans);
    revealGroups.forEach(group => observer.observe(group));
  };

  runMotion();
})();
