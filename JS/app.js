/**
 * app.js — Page orchestration for FlipMaster.
 *
 * PHASE 1 SCOPE: layout, navigation, scroll-reveal wiring, and interim
 * feedback on controls whose real logic (coin physics, stats engine,
 * history persistence) lands in Phase 2. Nothing here is a stub left
 * behind — it's the complete, correct behavior for this phase.
 */
(function () {
  "use strict";

  /* ------------------------------------------------------------------
     Tag elements for scroll-reveal without cluttering the markup
     ------------------------------------------------------------------ */
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
        const delay = (index % 6) + 1;
        el.setAttribute("data-reveal-delay", String(delay));
      });
    });

    // Re-run the observer now that new [data-reveal] nodes exist.
    if (window.FlipMasterUI && window.FlipMasterUI.refreshReveal) {
      window.FlipMasterUI.refreshReveal();
    } else {
      // Fallback: dispatch a DOM event ui.js could listen for in a future pass.
      const targets = document.querySelectorAll("[data-reveal]");
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
  }

  /* ------------------------------------------------------------------
     Interim control feedback (superseded by coin.js / stats.js / history.js
     in Phase 2, which will replace these handlers with real logic)
     ------------------------------------------------------------------ */
  function wireInterimControls() {
    const flipBtn = document.getElementById("flipBtn");
    const coin = document.getElementById("coin");
    const resultEl = document.getElementById("flipResult");

    if (flipBtn && resultEl) {
      flipBtn.addEventListener("click", () => {
        resultEl.textContent = "Coin physics arrive in Phase 2 — layout is ready.";
      });
    }

    if (coin) {
      coin.classList.add("coin-idle");
    }

    const clearBtn = document.getElementById("clearHistoryBtn");
    if (clearBtn) {
      clearBtn.addEventListener("click", () => {
        window.FlipMasterUI.showToast("History syncing arrives in Phase 3.", "default");
      });
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    applyRevealTargets();
    wireInterimControls();
  });
})();
import { flipCoin } from './coin.js';

const flipBtn = document.getElementById('flip-btn');
let isFlipping = false;

flipBtn.addEventListener('click', async () => {
    if (isFlipping) return;
    
    isFlipping = true;
    flipBtn.disabled = true;

    // Simulate API call for result
    const result = Math.random() > 0.5 ? 'heads' : 'tails';
    
    console.log(`Result: ${result}`);

    // Trigger Animation
    const animation = flipCoin(result);

    // Re-enable button after animation
    animation.then(() => {
        isFlipping = false;
        flipBtn.disabled = false;
    });
});