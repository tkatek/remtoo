(function () {
  "use strict";

  const ready = (callback) => {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback, { once: true });
    } else {
      callback();
    }
  };

  ready(() => {
    const menuButton = document.querySelector(".remtoo-menu-button");
    const backdrop = document.querySelector(".remtoo-drawer-backdrop");
    const drawer = document.querySelector(".remtoo-mobile-drawer");
    const closeButton = drawer?.querySelector(".remtoo-drawer-close");
    const drawerNavigation = drawer?.querySelector(".remtoo-drawer-nav");
    const desktopBreakpoint = window.matchMedia("(min-width: 900px)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const focusableSelector = [
      "a[href]",
      "button:not([disabled])",
      "input:not([disabled]):not([type='hidden'])",
      "select:not([disabled])",
      "textarea:not([disabled])",
      "[tabindex]:not([tabindex='-1'])"
    ].join(",");

    let drawerIsOpen = false;
    let lastFocusedElement = null;
    let closeTimer = 0;
    let lockedScrollPosition = 0;
    let storedBodyStyles = null;

    const getFocusableElements = () => {
      if (!drawer) return [];
      return [...drawer.querySelectorAll(focusableSelector)].filter((element) => {
        return !element.hidden && element.getAttribute("aria-hidden") !== "true" && element.getClientRects().length > 0;
      });
    };

    const updateMenuLabel = (open) => {
      if (!menuButton) return;
      menuButton.setAttribute("aria-expanded", String(open));
      const accessibleLabel = open ? "Close navigation menu" : "Open navigation menu";
      menuButton.setAttribute("aria-label", accessibleLabel);
      const hiddenLabel = menuButton.querySelector(".remtoo-sr-only, .sr-only");
      if (hiddenLabel) hiddenLabel.textContent = accessibleLabel;
    };

    const lockBodyScroll = () => {
      if (storedBodyStyles) return;
      lockedScrollPosition = window.scrollY;
      storedBodyStyles = {
        position: document.body.style.position,
        top: document.body.style.top,
        right: document.body.style.right,
        left: document.body.style.left,
        width: document.body.style.width,
        overflow: document.body.style.overflow
      };
      document.documentElement.classList.add("remtoo-drawer-open");
      document.body.style.position = "fixed";
      document.body.style.top = `-${lockedScrollPosition}px`;
      document.body.style.right = "0";
      document.body.style.left = "0";
      document.body.style.width = "100%";
      document.body.style.overflow = "hidden";
    };

    const unlockBodyScroll = () => {
      if (!storedBodyStyles) return;
      const styles = storedBodyStyles;
      storedBodyStyles = null;
      document.documentElement.classList.remove("remtoo-drawer-open");
      document.body.style.position = styles.position;
      document.body.style.top = styles.top;
      document.body.style.right = styles.right;
      document.body.style.left = styles.left;
      document.body.style.width = styles.width;
      document.body.style.overflow = styles.overflow;
      const previousScrollBehavior = document.documentElement.style.scrollBehavior;
      document.documentElement.style.scrollBehavior = "auto";
      window.scrollTo(0, lockedScrollPosition);
      document.documentElement.style.scrollBehavior = previousScrollBehavior;
    };

    const finishClosing = () => {
      if (drawerIsOpen || !drawer || !backdrop) return;
      drawer.hidden = true;
      backdrop.hidden = true;
      drawer.inert = true;
    };

    const closeDrawer = ({ restoreFocus = true, immediate = false } = {}) => {
      if (!drawer || !backdrop || !menuButton) return;
      window.clearTimeout(closeTimer);
      drawerIsOpen = false;
      drawer.classList.remove("is-open");
      backdrop.classList.remove("is-open");
      drawer.setAttribute("aria-hidden", "true");
      updateMenuLabel(false);
      unlockBodyScroll();

      if (immediate || reducedMotion.matches) {
        finishClosing();
      } else {
        closeTimer = window.setTimeout(finishClosing, 360);
      }

      if (restoreFocus && lastFocusedElement instanceof HTMLElement && lastFocusedElement.isConnected) {
        lastFocusedElement.focus({ preventScroll: true });
      }
    };

    const openDrawer = () => {
      if (!drawer || !backdrop || !menuButton || desktopBreakpoint.matches || drawerIsOpen) return;
      window.clearTimeout(closeTimer);
      lastFocusedElement = document.activeElement instanceof HTMLElement ? document.activeElement : menuButton;
      drawerIsOpen = true;
      drawer.hidden = false;
      backdrop.hidden = false;
      drawer.inert = false;
      drawer.setAttribute("aria-hidden", "false");
      updateMenuLabel(true);
      lockBodyScroll();

      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          if (!drawerIsOpen) return;
          drawer.classList.add("is-open");
          backdrop.classList.add("is-open");
          const focusTarget = closeButton || getFocusableElements()[0] || drawer;
          if (focusTarget instanceof HTMLElement) focusTarget.focus({ preventScroll: true });
        });
      });
    };

    if (menuButton && backdrop && drawer) {
      if (!drawer.id) drawer.id = "remtoo-mobile-navigation";
      menuButton.setAttribute("aria-controls", drawer.id);
      updateMenuLabel(false);
      drawer.hidden = true;
      backdrop.hidden = true;
      drawer.inert = true;
      drawer.setAttribute("aria-hidden", "true");
      if (!drawer.hasAttribute("role")) drawer.setAttribute("role", "dialog");
      drawer.setAttribute("aria-modal", "true");
      if (!drawer.hasAttribute("aria-label") && !drawer.hasAttribute("aria-labelledby")) {
        drawer.setAttribute("aria-label", "Site navigation");
      }
      if (!drawer.hasAttribute("tabindex")) drawer.tabIndex = -1;
      if (closeButton && !closeButton.getAttribute("aria-label")) {
        closeButton.setAttribute("aria-label", "Close navigation menu");
      }

      menuButton.addEventListener("click", () => {
        if (drawerIsOpen) closeDrawer();
        else openDrawer();
      });
      closeButton?.addEventListener("click", () => closeDrawer());
      backdrop.addEventListener("click", () => closeDrawer());

      drawerNavigation?.addEventListener("click", (event) => {
        if (event.target.closest("a[href]")) closeDrawer({ restoreFocus: false });
      });

      document.addEventListener("pointerdown", (event) => {
        if (!drawerIsOpen || drawer.contains(event.target) || menuButton.contains(event.target)) return;
        closeDrawer();
      });

      document.addEventListener("keydown", (event) => {
        if (!drawerIsOpen) return;
        if (event.key === "Escape") {
          event.preventDefault();
          closeDrawer();
          return;
        }
        if (event.key !== "Tab") return;

        const focusableElements = getFocusableElements();
        if (!focusableElements.length) {
          event.preventDefault();
          drawer.focus({ preventScroll: true });
          return;
        }

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        const activeElement = document.activeElement;

        if (!drawer.contains(activeElement)) {
          event.preventDefault();
          (event.shiftKey ? lastElement : firstElement).focus();
        } else if (event.shiftKey && activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        } else if (!event.shiftKey && activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      });

      const handleBreakpointChange = (event) => {
        if (event.matches) closeDrawer({ restoreFocus: false, immediate: true });
      };
      if (typeof desktopBreakpoint.addEventListener === "function") {
        desktopBreakpoint.addEventListener("change", handleBreakpointChange);
      } else {
        desktopBreakpoint.addListener(handleBreakpointChange);
      }
    }

    const revealElements = [...document.querySelectorAll("[data-site-reveal]")];
    if (!revealElements.length) return;

    let revealObserver = null;

    const showAllRevealElements = () => {
      revealObserver?.disconnect();
      revealObserver = null;
      revealElements.forEach((element) => {
        if (window.gsap) window.gsap.killTweensOf(element);
        element.style.removeProperty("opacity");
        element.style.removeProperty("transform");
      });
    };

    const initializeReveals = () => {
      if (reducedMotion.matches || !window.gsap) {
        showAllRevealElements();
        return;
      }

      const { gsap } = window;
      gsap.set(revealElements, { opacity: 0, y: 24 });

      const reveal = (element) => {
        const delay = Math.max(0, Number.parseFloat(element.dataset.siteRevealDelay) || 0);
        gsap.to(element, {
          opacity: 1,
          y: 0,
          duration: .68,
          delay,
          ease: "power3.out",
          overwrite: "auto",
          onComplete: () => {
            element.style.removeProperty("opacity");
            element.style.removeProperty("transform");
          }
        });
      };

      if (!("IntersectionObserver" in window)) {
        revealElements.forEach(reveal);
        return;
      }

      revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          reveal(entry.target);
          observer.unobserve(entry.target);
        });
      }, { threshold: .14, rootMargin: "0px 0px -6% 0px" });

      revealElements.forEach((element) => revealObserver.observe(element));
    };

    initializeReveals();

    const handleMotionPreference = (event) => {
      if (event.matches) showAllRevealElements();
    };
    if (typeof reducedMotion.addEventListener === "function") {
      reducedMotion.addEventListener("change", handleMotionPreference);
    } else {
      reducedMotion.addListener(handleMotionPreference);
    }
  });
})();
