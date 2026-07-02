/**
 * ui.js — Reusable UI behaviors for FlipMaster.
 * Handles chrome that isn't specific to the coin/flip domain logic:
 * preloader, navbar state, theme + mute toggles, mobile menu,
 * back-to-top, toast notifications, scroll-reveal, and counter animation.
 *
 * Exposes window.FlipMasterUI for use by app.js and coin.js (Phase 2).
 */
(function () {
  "use strict";

  /* ------------------------------------------------------------------
     Preloader
     ------------------------------------------------------------------ */
  function initPreloader() {
    const preloader = document.getElementById("preloader");
    if (!preloader) return;
    window.addEventListener("load", () => {
      setTimeout(() => preloader.classList.add("loaded"), 350);
    });
  }

  /* ------------------------------------------------------------------
     Navbar scroll state
     ------------------------------------------------------------------ */
  function initNavbarScroll() {
    const navbar = document.getElementById("navbar");
    if (!navbar) return;

    const onScroll = () => {
      navbar.classList.toggle("scrolled", window.scrollY > 24);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ------------------------------------------------------------------
     Mobile menu
     ------------------------------------------------------------------ */
  function initMobileMenu() {
    const toggle = document.getElementById("menuToggle");
    const links = document.getElementById("navLinks");
    if (!toggle || !links) return;

    const close = () => {
      toggle.classList.remove("active");
      links.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
      document.body.classList.remove("no-scroll");
    };

    toggle.addEventListener("click", () => {
      const isOpen = links.classList.toggle("open");
      toggle.classList.toggle("active", isOpen);
      toggle.setAttribute("aria-expanded", String(isOpen));
      document.body.classList.toggle("no-scroll", isOpen);
    });

    links.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", close);
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 768) close();
    });
  }

  /* ------------------------------------------------------------------
     Theme toggle (persisted in-memory for the session; see note below)
     ------------------------------------------------------------------
     NOTE: FlipMaster avoids localStorage per project constraints when
     running inside embedded/sandboxed contexts. In a normal deployment
     (server/app.js + static hosting) this is safe to back with
     localStorage — swap the two marked lines below if desired.
     ------------------------------------------------------------------ */
  const state = {
    theme: "dark",
    muted: false,
  };

  function initThemeToggle() {
    const btn = document.getElementById("themeToggle");
    if (!btn) return;

    const apply = () => {
      document.documentElement.setAttribute(
        "data-theme",
        state.theme === "light" ? "light" : "dark"
      );
      const icon = btn.querySelector("i");
      if (icon) {
        icon.className =
          state.theme === "light" ? "fa-solid fa-sun" : "fa-solid fa-moon";
      }
    };

    apply();

    btn.addEventListener("click", () => {
      state.theme = state.theme === "light" ? "dark" : "light";
      apply();
    });
  }

  function initMuteToggle() {
    const btn = document.getElementById("muteToggle");
    if (!btn) return;

    const apply = () => {
      const icon = btn.querySelector("i");
      if (icon) {
        icon.className = state.muted
          ? "fa-solid fa-volume-xmark"
          : "fa-solid fa-volume-high";
      }
      btn.setAttribute("aria-label", state.muted ? "Unmute sound" : "Mute sound");
    };

    apply();

    btn.addEventListener("click", () => {
      state.muted = !state.muted;
      apply();
      window.dispatchEvent(
        new CustomEvent("flipmaster:mute-changed", { detail: { muted: state.muted } })
      );
    });
  }

  /* ------------------------------------------------------------------
     Back to top
     ------------------------------------------------------------------ */
  function initBackToTop() {
    const btn = document.getElementById("backToTop");
    if (!btn) return;

    window.addEventListener(
      "scroll",
      () => {
        btn.classList.toggle("visible", window.scrollY > 480);
      },
      { passive: true }
    );

    btn.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  /* ------------------------------------------------------------------
     Toast notifications
     ------------------------------------------------------------------ */
  function showToast(message, type = "default", duration = 3200) {
    const container = document.getElementById("toastContainer");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = `toast${type !== "default" ? ` toast-${type}` : ""}`;

    const icons = {
      success: "fa-solid fa-circle-check",
      error: "fa-solid fa-circle-exclamation",
      default: "fa-solid fa-circle-info",
    };

    toast.innerHTML = `<i class="${icons[type] || icons.default}"></i><span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.transition = "opacity 0.3s ease, transform 0.3s ease";
      toast.style.opacity = "0";
      toast.style.transform = "translateY(8px)";
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }

  /* ------------------------------------------------------------------
     Scroll reveal (IntersectionObserver)
     ------------------------------------------------------------------ */
  function initScrollReveal() {
    const targets = document.querySelectorAll("[data-reveal]");
    if (!targets.length || !("IntersectionObserver" in window)) {
      targets.forEach((t) => t.classList.add("in-view"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );

    targets.forEach((t) => observer.observe(t));
  }

  /* ------------------------------------------------------------------
     Animated counters (used for stats + hero trust numbers)
     ------------------------------------------------------------------ */
  function animateCounter(el, target, opts = {}) {
    if (!el) return;
    const duration = opts.duration || 1200;
    const suffix = el.dataset.suffix || opts.suffix || "";
    const start = Number(el.dataset.count || 0);
    const startTime = performance.now();

    function tick(now) {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out-cubic
      const value = Math.round(start + (target - start) * eased);
      el.textContent = `${value}${suffix}`;
      el.dataset.count = String(value);
      if (progress < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }

  /* ------------------------------------------------------------------
     Smooth-scroll offset correction for fixed navbar on anchor links
     ------------------------------------------------------------------ */
  function initAnchorOffsetScroll() {
    const navbar = document.getElementById("navbar");
    document.querySelectorAll('a[href^="#"]').forEach((link) => {
      link.addEventListener("click", (e) => {
        const id = link.getAttribute("href");
        if (!id || id === "#") return;
        const target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        const offset = (navbar ? navbar.offsetHeight : 0) + 12;
        const top = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: "smooth" });
      });
    });
  }

  /* ------------------------------------------------------------------
     Boot
     ------------------------------------------------------------------ */
  function init() {
    initPreloader();
    initNavbarScroll();
    initMobileMenu();
    initThemeToggle();
    initMuteToggle();
    initBackToTop();
    initScrollReveal();
    initAnchorOffsetScroll();
  }

  document.addEventListener("DOMContentLoaded", init);

  window.FlipMasterUI = {
    showToast,
    animateCounter,
    getState: () => ({ ...state }),
  };
})();