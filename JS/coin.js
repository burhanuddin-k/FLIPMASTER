/**
 * coin.js — Coin flip mechanics.
 *
 * All coin motion (idle bob included) is driven through GSAP so there's a
 * single source of truth for the element's transform. A CSS animation
 * running alongside GSAP on the same element would overwrite whichever
 * rotationY value is holding the correct face up, so idle bobbing is a
 * GSAP tween too, started/stopped around each flip rather than a CSS class.
 *
 * FIXED: Removed rotationX from the flip animation to eliminate 3D distortion
 * during the coin flip. The coin now rotates cleanly on the Y-axis only.
 */
(function () {
  "use strict";

  const coin = document.getElementById("coin");
  const shadow = document.getElementById("coinShadow");
  const flipBtn = document.getElementById("flipBtn");
  const resultEl = document.getElementById("flipResult");

  if (!coin || !flipBtn || !resultEl) return;

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  let isFlipping = false;
  let currentRotation = 0; // cumulative rotationY in degrees, always increasing
  let idleTween = null;

  function pickResult() {
    return Math.random() < 0.5 ? "heads" : "tails";
  }

  function startIdle() {
    if (typeof gsap === "undefined" || prefersReducedMotion) return;
    idleTween = gsap.to(coin, {
      y: -8,
      duration: 1.7,
      ease: "sine.inOut",
      yoyo: true,
      repeat: -1,
    });
  }

  function stopIdle() {
    if (idleTween) {
      idleTween.kill();
      idleTween = null;
    }
    gsap.set(coin, { y: 0 });
  }

  function setGlow(result) {
    coin.classList.remove("coin-glow-gold", "coin-glow-silver");
    void coin.offsetWidth; // force reflow so the animation restarts on repeat results
    coin.classList.add(result === "heads" ? "coin-glow-gold" : "coin-glow-silver");
  }

  function updateResultUI(result) {
    const label = result === "heads" ? "Heads" : "Tails";
    resultEl.textContent = `Landed on ${label}`;
    coin.setAttribute("aria-label", `Coin, currently showing ${label.toLowerCase()}`);
  }

  function finishFlip(result, targetRotation) {
    currentRotation = targetRotation;
    isFlipping = false;
    flipBtn.disabled = false;
    updateResultUI(result);
    setGlow(result);
    if (window.FlipMasterSound) window.FlipMasterSound.playLand();

    window.dispatchEvent(
      new CustomEvent("flipmaster:flip-complete", {
        detail: { result, timestamp: Date.now() },
      })
    );

    setTimeout(startIdle, 350);
  }

  function flipReduced() {
    // No GSAP timeline — just resolve the result instantly but still
    // go through the same state machine, sounds, and events.
    isFlipping = true;
    flipBtn.disabled = true;
    const result = pickResult();
    const desiredMod = result === "tails" ? 180 : 0;
    gsap.set(coin, { rotationY: desiredMod });
    if (window.FlipMasterSound) window.FlipMasterSound.playThrow();
    setTimeout(() => finishFlip(result, desiredMod), 150);
  }

  function flip() {
    if (isFlipping || typeof gsap === "undefined") return;

    if (prefersReducedMotion) {
      flipReduced();
      return;
    }

    isFlipping = true;
    flipBtn.disabled = true;
    resultEl.textContent = "";
    stopIdle();

    const result = pickResult();
    const desiredMod = result === "tails" ? 180 : 0;
    const spins = 4 + Math.floor(Math.random() * 3); // 4–6 full rotations
    const currentMod = ((currentRotation % 360) + 360) % 360;
    const diff = ((desiredMod - currentMod) + 360) % 360;
    const targetRotation = currentRotation + spins * 360 + diff;

    if (window.FlipMasterSound) window.FlipMasterSound.playThrow();

    const tl = gsap.timeline({
      onComplete: () => finishFlip(result, targetRotation),
    });

    // Rise into the air, spinning, while the shadow shrinks and fades.
    // FIXED: Removed rotationX to eliminate distortion. Coin now rotates cleanly on Y-axis only.
    tl.to(coin, { y: -130, duration: 0.42, ease: "power2.out" }, 0);
    tl.to(
      coin,
      { rotationY: targetRotation, duration: 0.84, ease: "none" },
      0
    );
    tl.to(shadow, { scale: 0.35, opacity: 0.15, duration: 0.42, ease: "power2.out" }, 0);

    // Fall back down, shadow grows and darkens again.
    tl.to(coin, { y: 0, duration: 0.42, ease: "power2.in" }, 0.42);
    tl.to(shadow, { scale: 1, opacity: 0.5, duration: 0.42, ease: "power2.in" }, 0.42);

    // Landing squash.
    tl.to(coin, { scaleY: 0.86, scaleX: 1.08, duration: 0.09, ease: "power1.out" }, 0.84);
    tl.to(
      coin,
      { scaleY: 1, scaleX: 1, duration: 0.28, ease: "elastic.out(1, 0.4)" },
      0.93
    );

    // Landing vibration — a few quick horizontal wiggles that settle out.
    tl.to(
      coin,
      { x: 4, duration: 0.05, yoyo: true, repeat: 5, ease: "power1.inOut" },
      0.84
    );
    tl.to(coin, { x: 0, duration: 0.05 }, ">");
  }

  flipBtn.addEventListener("click", flip);

  window.addEventListener("keydown", (e) => {
    if (e.code !== "Space") return;
    const active = document.activeElement;
    const tag = active ? active.tagName : "";
    if (tag === "INPUT" || tag === "TEXTAREA" || (active && active.isContentEditable)) return;
    e.preventDefault();
    flip();
  });

  document.addEventListener("DOMContentLoaded", startIdle);

  window.FlipMasterCoin = { flip };
})();