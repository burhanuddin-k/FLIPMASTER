/**
 * wheel.js — Spin wheel mechanics.
 * 
 * Complete, production-ready spin wheel implementation.
 * Paste this entire file directly into JS/wheel.js
 */

(function () {
  "use strict";

  // Get DOM elements
  const canvas = document.getElementById("wheelCanvas");
  const spinBtn = document.getElementById("spinWheelBtn");
  const resultEl = document.getElementById("wheelResult");
  const entryInput = document.getElementById("wheelEntryInput");
  const addEntryBtn = document.getElementById("addEntryBtn");
  const entriesList = document.getElementById("entriesList");
  const resetWheelBtn = document.getElementById("resetWheelBtn");

  // Check if required elements exist
  if (!canvas || !spinBtn || !resultEl) {
    console.error("Wheel: Required elements not found in HTML");
    return;
  }

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    console.error("Wheel: Could not get canvas 2D context");
    return;
  }

  // Configuration
  const MAX_ENTRIES = 10;
  const DEFAULT_ENTRIES = ["Yes", "No"];
  const STORAGE_KEY = "flipmaster:wheel-entries";
  const COLORS = [
    "#e8b454",
    "#b8c4d0",
    "#f0c878",
    "#d4dde5",
    "#6fcf97",
    "#eb5757",
    "#a78bfa",
    "#60a5fa",
    "#34d399",
    "#fbbf24"
  ];

  // State
  let entries = [];
  let isSpinning = false;
  let currentRotation = 0;
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /**
   * Load entries from localStorage
   */
  function loadEntries() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      entries = stored ? JSON.parse(stored) : [...DEFAULT_ENTRIES];
    } catch (err) {
      console.error("Wheel: Error loading entries", err);
      entries = [...DEFAULT_ENTRIES];
    }
  }

  /**
   * Save entries to localStorage
   */
  function saveEntries() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    } catch (err) {
      console.error("Wheel: Error saving entries", err);
    }
  }

  /**
   * Draw the wheel on canvas
   */
  function drawWheel() {
    try {
      const radius = canvas.width / 2;
      const sliceAngle = (2 * Math.PI) / entries.length;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.translate(radius, radius);
      ctx.rotate((currentRotation * Math.PI) / 180);

      // Draw wheel segments
      entries.forEach((entry, index) => {
        // Draw segment
        ctx.save();
        ctx.beginPath();
        ctx.arc(0, 0, radius - 8, 0, sliceAngle);
        ctx.lineTo(0, 0);
        ctx.fillStyle = COLORS[index % COLORS.length];
        ctx.fill();

        // Segment border
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();

        // Draw text on segment
        ctx.save();
        ctx.fillStyle = "#14100a";
        ctx.font = "bold 14px 'Sora', sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        const textRadius = radius * 0.65;
        const angle = index * sliceAngle + sliceAngle / 2;
        const x = textRadius * Math.cos(angle);
        const y = textRadius * Math.sin(angle);

        ctx.translate(x, y);
        ctx.rotate(angle + Math.PI / 2);
        ctx.fillText(entry.substring(0, 15), 0, 0);
        ctx.restore();
      });

      // Draw center circle
      ctx.beginPath();
      ctx.arc(0, 0, 16, 0, 2 * Math.PI);
      ctx.fillStyle = "#e8b454";
      ctx.fill();
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw pointer at top
      ctx.save();
      ctx.fillStyle = "#e8b454";
      ctx.beginPath();
      ctx.moveTo(0, -radius + 20);
      ctx.lineTo(-12, -radius + 35);
      ctx.lineTo(12, -radius + 35);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      ctx.restore();
    } catch (err) {
      console.error("Wheel: Error drawing wheel", err);
    }
  }

  /**
   * Render the entries list in the UI
   */
  function renderEntriesList() {
    if (!entriesList) return;

    if (entries.length === 0) {
      entriesList.innerHTML = '<p class="entries-info">No entries yet. Add one to get started!</p>';
      return;
    }

    entriesList.innerHTML = entries
      .map((entry, index) => {
        const isDefault = DEFAULT_ENTRIES.includes(entry);
        return `
          <div class="entry-item ${isDefault ? "default" : ""}">
            <div class="entry-item-text">
              ${entry}
              ${isDefault ? '<span class="entry-badge">Default</span>' : ""}
            </div>
            <button
              class="entry-remove-btn"
              data-index="${index}"
              aria-label="Remove ${entry}"
              ${entries.length <= 2 ? "disabled" : ""}
              title="${entries.length <= 2 ? "Keep at least 2 entries" : "Remove entry"}"
            >
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        `;
      })
      .join("");

    // Add click handlers to remove buttons
    entriesList.querySelectorAll(".entry-remove-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const index = parseInt(btn.dataset.index, 10);
        removeEntry(index);
      });
    });

    // Redraw wheel with new entries
    drawWheel();
  }

  /**
   * Add a new entry
   */
  function addEntry(text) {
    text = text.trim();

    if (!text) {
      showToast("Please enter text", "error");
      return;
    }

    if (entries.length >= MAX_ENTRIES) {
      showToast(`Maximum ${MAX_ENTRIES} entries allowed`, "error");
      return;
    }

    if (entries.includes(text)) {
      showToast("This entry already exists", "error");
      return;
    }

    entries.push(text);
    saveEntries();
    renderEntriesList();
    if (entryInput) entryInput.value = "";
    if (entryInput) entryInput.focus();

    showToast(`"${text}" added!`, "success");
  }

  /**
   * Remove an entry by index
   */
  function removeEntry(index) {
    if (entries.length <= 2) {
      showToast("Keep at least 2 entries", "error");
      return;
    }

    const removed = entries[index];
    entries.splice(index, 1);
    saveEntries();
    renderEntriesList();
    showToast(`"${removed}" removed`, "success");
  }

  /**
   * Reset to default entries
   */
  function resetEntries() {
    if (!confirm("Reset wheel to default Yes/No entries? This will remove all custom entries.")) {
      return;
    }

    entries = [...DEFAULT_ENTRIES];
    currentRotation = 0;
    saveEntries();
    renderEntriesList();
    if (resultEl) resultEl.textContent = "";
    showToast("Wheel reset to defaults", "success");
  }

  /**
   * Get the currently selected entry at the top of the wheel
   */
  function getSelectedEntry() {
    const normalizedRotation = ((currentRotation % 360) + 360) % 360;
    const sliceAngle = 360 / entries.length;
    const adjustedRotation = (normalizedRotation + sliceAngle / 2) % 360;
    const index = Math.floor(adjustedRotation / sliceAngle) % entries.length;
    return entries[index];
  }

  /**
   * Show toast notification (uses FlipMasterUI if available)
   */
  function showToast(message, type = "default") {
    if (window.FlipMasterUI && window.FlipMasterUI.showToast) {
      window.FlipMasterUI.showToast(message, type);
    } else {
      // Fallback: simple alert
      console.log(`Toast [${type}]: ${message}`);
    }
  }

  /**
   * Spin the wheel
   */
  function spinWheel() {
    if (isSpinning || entries.length < 2) return;

    isSpinning = true;
    if (spinBtn) spinBtn.disabled = true;
    if (resultEl) resultEl.textContent = "";

    // Handle reduced motion preference
    if (prefersReducedMotion) {
      const spinAmount = (1 + Math.random() * 0.5) * 360;
      currentRotation += spinAmount;
      if (resultEl) resultEl.textContent = `🎡 ${getSelectedEntry()}`;
      isSpinning = false;
      if (spinBtn) spinBtn.disabled = false;
      drawWheel();
      return;
    }

    // Check if GSAP is available
    if (typeof gsap === "undefined") {
      console.error("Wheel: GSAP library not loaded");
      showToast("Animation library not loaded. Please refresh the page.", "error");
      isSpinning = false;
      if (spinBtn) spinBtn.disabled = false;
      return;
    }

    // Calculate spin rotation (5-8 full spins + random final position)
    const minSpins = 5;
    const maxSpins = 8;
    const randomSpins = minSpins + Math.random() * (maxSpins - minSpins);
    const finalRandomDegrees = Math.random() * 360;
    const totalRotation = randomSpins * 360 + finalRandomDegrees;

    // Play throw sound
    if (window.FlipMasterSound && window.FlipMasterSound.playThrow) {
      window.FlipMasterSound.playThrow();
    }

    // Animate the spin using GSAP
    gsap.to(
      { rotation: currentRotation },
      {
        rotation: currentRotation + totalRotation,
        duration: 3.5,
        ease: "power2.inOut",
        onUpdate(tween) {
          currentRotation = tween.targets()[0].rotation;
          drawWheel();
        },
        onComplete: () => {
          const winner = getSelectedEntry();
          if (resultEl) resultEl.textContent = `🎡 ${winner}`;

          // Play land sound
          if (window.FlipMasterSound && window.FlipMasterSound.playLand) {
            window.FlipMasterSound.playLand();
          }

          isSpinning = false;
          if (spinBtn)