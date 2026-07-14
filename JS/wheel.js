/**
 * wheel.js — Spin wheel mechanics.
 *
 * Manages a customizable spin wheel where users can add/remove entries
 * (up to 10 total). Includes canvas rendering, GSAP animation, persistent
 * storage, and result detection. Default entries are "Yes" and "No".
 */
(function () {
  "use strict";

  const canvas = document.getElementById("wheelCanvas");
  const spinBtn = document.getElementById("spinWheelBtn");
  const resultEl = document.getElementById("wheelResult");
  const entryInput = document.getElementById("wheelEntryInput");
  const addEntryBtn = document.getElementById("addEntryBtn");
  const entriesList = document.getElementById("entriesList");
  const resetWheelBtn = document.getElementById("resetWheelBtn");

  if (!canvas || !spinBtn || !resultEl) return;

  const ctx = canvas.getContext("2d");
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  // Configuration
  const MAX_ENTRIES = 10;
  const DEFAULT_ENTRIES = ["Yes", "No"];
  const STORAGE_KEY = "flipmaster:wheel-entries";
  const COLORS = [
    "#e8b454", // gold
    "#b8c4d0", // silver
    "#f0c878", // gold-soft
    "#d4dde5", // silver-soft
    "#6fcf97", // success
    "#eb5757", // danger
    "#a78bfa", // purple
    "#60a5fa", // blue
    "#34d399", // teal
    "#fbbf24", // amber
  ];

  let entries = [];
  let isSpinning = false;
  let currentRotation = 0;

  /**
   * Load entries from localStorage or use defaults
   */
  function loadEntries() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      entries = stored ? JSON.parse(stored) : [...DEFAULT_ENTRIES];
    } catch (err) {
      console.error("FlipMaster Wheel: could not load entries", err);
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
      console.error("FlipMaster Wheel: could not save entries", err);
    }
  }

  /**
   * Draw the spin wheel on canvas
   */
  function drawWheel() {
    const radius = canvas.width / 2;
    const sliceAngle = (2 * Math.PI) / entries.length;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(radius, radius);
    ctx.rotate((currentRotation * Math.PI) / 180);

    // Draw segments
    entries.forEach((entry, index) => {
      ctx.save();
      ctx.beginPath();
      ctx.arc(0, 0, radius - 8, 0, sliceAngle);
      ctx.lineTo(0, 0);
      ctx.fillStyle = COLORS[index % COLORS.length];
      ctx.fill();

      // Border
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();

      // Draw text
      ctx.save();
      ctx.fillStyle = "#14100a";
      ctx.font = `bold ${Math.max(11, 16 - entries.length)}px "Sora"`;
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
  }

  /**
   * Render the entries list UI
   */
  function renderEntriesList() {
    if (!entriesList) return;

    if (entries.length === 0) {
      entriesList.innerHTML =
        '<p class="entries-info">No entries yet. Add one to get started!</p>';
      return;
    }

    entriesList.innerHTML = entries
      .map(
        (entry, index) => `
      <div class="entry-item ${DEFAULT_ENTRIES.includes(entry) ? "default" : ""}">
        <div class="entry-item-text">
          ${entry}
          ${DEFAULT_ENTRIES.includes(entry) ? '<span class="entry-badge">Default</span>' : ""}
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
    `
      )
      .join("");

    // Wire remove buttons
    entriesList.querySelectorAll(".entry-remove-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const index = parseInt(btn.dataset.index, 10);
        removeEntry(index);
      });
    });

    // Update canvas
    drawWheel();
  }

  /**
   * Add a new entry
   */
  function addEntry(text) {
    text = text.trim();

    if (!text) {
      if (window.FlipMasterUI) {
        window.FlipMasterUI.showToast("Please enter text", "error");
      }
      return;
    }

    if (entries.length >= MAX_ENTRIES) {
      if (window.FlipMasterUI) {
        window.FlipMasterUI.showToast(
          `Maximum ${MAX_ENTRIES} entries allowed`,
          "error"
        );
      }
      return;
    }

    if (entries.includes(text)) {
      if (window.FlipMasterUI) {
        window.FlipMasterUI.showToast("This entry already exists", "error");
      }
      return;
    }

    entries.push(text);
    saveEntries();
    renderEntriesList();
    entryInput.value = "";
    entryInput.focus();

    if (window.FlipMasterUI) {
      window.FlipMasterUI.showToast(`"${text}" added!`, "success");
    }
  }

  /**
   * Remove an entry by index
   */
  function removeEntry(index) {
    if (entries.length <= 2) {
      if (window.FlipMasterUI) {
        window.FlipMasterUI.showToast(
          "Keep at least 2 entries",
          "error"
        );
      }
      return;
    }

    const removed = entries[index];
    entries.splice(index, 1);
    saveEntries();
    renderEntriesList();

    if (window.FlipMasterUI) {
      window.FlipMasterUI.showToast(`"${removed}" removed`, "success");
    }
  }

  /**
   * Reset to default entries
   */
  function resetEntries() {
    if (
      !confirm(
        "Reset wheel to default Yes/No entries? This will remove all custom entries."
      )
    ) {
      return;
    }

    entries = [...DEFAULT_ENTRIES];
    currentRotation = 0;
    saveEntries();
    renderEntriesList();
    resultEl.textContent = "";

    if (window.FlipMasterUI) {
      window.FlipMasterUI.showToast("Wheel reset to defaults", "success");
    }
  }

  /**
   * Get the currently selected entry (top of wheel)
   */
  function getSelectedEntry() {
    const normalizedRotation = ((currentRotation % 360) + 360) % 360;
    const sliceAngle = 360 / entries.length;
    // The top entry is at rotation 0, but we measure from the positive x-axis
    // So the "pointer" at the top corresponds to the entry at index ~(normalizedRotation / sliceAngle)
    const adjustedRotation = (normalizedRotation + sliceAngle / 2) % 360;
    const index = Math.floor(adjustedRotation / sliceAngle) % entries.length;
    return entries[index];
  }

  /**
   * Spin the wheel
   */
  function spinWheel() {
    if (isSpinning || entries.length < 2) return;

    isSpinning = true;
    spinBtn.disabled = true;
    resultEl.textContent = "";

    if (prefersReducedMotion) {
      // No animation, just pick a result
      const minSpins = 1;
      const spinAmount = (minSpins + Math.random() * 0.5) * 360;
      currentRotation += spinAmount;
      resultEl.textContent = `🎡 ${getSelectedEntry()}`;
      isSpinning = false;
      spinBtn.disabled = false;
      drawWheel();
      return;
    }

    // Spin: 5-8 full rotations + random final position
    const minSpins = 5;
    const maxSpins = 8;
    const randomSpins = minSpins + Math.random() * (maxSpins - minSpins);
    const finalRandomDegrees = Math.random() * 360;
    const totalRotation = randomSpins * 360 + finalRandomDegrees;

    if (window.FlipMasterSound) {
      window.FlipMasterSound.playThrow();
    }

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
          resultEl.textContent = `🎡 ${winner}`;
          if (window.FlipMasterSound) {
            window.FlipMasterSound.playLand();
          }
          isSpinning = false;
          spinBtn.disabled = false;
        },
      }
    );
  }

  /**
   * Event listeners
   */
  if (spinBtn) {
    spinBtn.addEventListener("click", spinWheel);
  }

  if (addEntryBtn) {
    addEntryBtn.addEventListener("click", () => {
      addEntry(entryInput.value);
    });
  }

  if (entryInput) {
    entryInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        addEntry(entryInput.value);
      }
    });
  }

  if (resetWheelBtn) {
    resetWheelBtn.addEventListener("click", resetEntries);
  }

  // Click wheel to spin (like coin)
  if (canvas) {
    canvas.addEventListener("click", spinWheel);
  }

  /**
   * Initialize
   */
  document.addEventListener("DOMContentLoaded", () => {
    loadEntries();
    renderEntriesList();
  });

  window.FlipMasterWheel = { spin: spinWheel, addEntry, removeEntry, getEntries: () => entries.slice() };
})();