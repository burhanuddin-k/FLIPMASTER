/**
 * app.js — Page orchestration for FlipMaster.
 *
 * Owns scroll-reveal tagging only. Coin mechanics live in coin.js, sound in
 * sound.js, statistics in stats.js, and history in history.js — each is a
 * complete, self-initializing module wired together through DOM events
 * (flipmaster:flip-complete, flipmaster:mute-changed).
 */
(function () {
  "use strict";

  function applyRevealTargets() {
    const map = [
      [".stat-card", "up"],
      [".feature-card", "up"],
      [".faq-item", "up"],
      [".about-copy", "up"],
      [".about-visual", "scale"],
      [".history-panel", "up"],
    ];

    map.forEach(([selector, kind]) => {
      document.querySelectorAll(selector).forEach((el, index) => {
        el.setAttribute("data-reveal", kind === "scale" ? "scale" : "");
        el.setAttribute("data-reveal-delay", String((index % 6) + 1));
      });
    });

    // These nodes were just tagged, so re-run scroll-reveal observation
    // for them specifically (ui.js already handled anything present at
    // its own DOMContentLoaded, which ran before these attributes existed).
    const targets = document.querySelectorAll("[data-reveal]:not(.in-view)");
    if ("IntersectionObserver" in window) {
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
    } else {
      targets.forEach((t) => t.classList.add("in-view"));
    }
  }

  document.addEventListener("DOMContentLoaded", applyRevealTargets);
})();