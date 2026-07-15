/**
 * wheel.js — Spin wheel mechanics (REDESIGNED)
 * 
 * Improved design with better colors, visual feedback, and functionality
 */

(function () {
  "use strict";

  // DOM elements
  const canvas = document.getElementById("wheelCanvas");
  const spinBtn = document.getElementById("spinWheelBtn");
  const resultEl = document.getElementById("wheelResult");
  const entryInput = document.getElementById("wheelEntryInput");
  const addEntryBtn = document.getElementById("addEntryBtn");
  const entriesList = document.getElementById("entriesList");
  const resetWheelBtn = document.getElementById("resetWheelBtn");

  if (!canvas || !spinBtn || !resultEl) return;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // Configuration
  const MAX_ENTRIES = 10;
  const DEFAULT_ENTRIES = ["Yes", "No"];
  const STORAGE_KEY = "flipmaster:wheel-entries";
  
  // Vibrant colors - better contrast and visibility
  const COLORS = [
    "#FF6B6B",  // vibrant red
    "#4ECDC4",  // vibrant teal
    "#FFE66D",  // vibrant yellow
    "#95E1D3",  // mint green
    "#F38181",  // salmon pink
    "#AA96DA",  // purple
    "#FCBAD3",  // light pink
    "#A8D8EA",  // sky blue
    "#FFD700",  // gold
    "#FF1493"   // deep pink
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
      console.log("Wheel entries:", entries);
    } catch (err) {
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
      console.error("Error saving entries", err);
    }
  }

  /**
   * Draw the wheel on canvas
   */
  function drawWheel() {
    const width = canvas.width;
    const height = canvas.height;
    const radius = Math.min(width, height) / 2 - 10;
    const centerX = width / 2;
    const centerY = height / 2;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    if (entries.length === 0) {
      ctx.fillStyle = "#FFF";
      ctx.font = "20px Sora";
      ctx.textAlign = "center";
      ctx.fillText("No entries yet", centerX, centerY);
      return;
    }

    const sliceAngle = (2 * Math.PI) / entries.length;

    // Draw segments
    entries.forEach((entry, index) => {
      const startAngle = index * sliceAngle - Math.PI / 2 + (currentRotation * Math.PI) / 180;
      const endAngle = startAngle + sliceAngle;

      // Draw segment
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.lineTo(centerX, centerY);
      ctx.fillStyle = COLORS[index % COLORS.length];
      ctx.fill();

      // Draw border
      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = 3;
      ctx.stroke();

      // Draw text
      const textAngle = startAngle + sliceAngle / 2;
      const textRadius = radius * 0.65;
      const textX = centerX + textRadius * Math.cos(textAngle);
      const textY = centerY + textRadius * Math.sin(textAngle);

      ctx.save();
      ctx.translate(textX, textY);
      ctx.rotate(textAngle + Math.PI / 2);
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 14px Sora";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
      ctx.shadowBlur = 4;
      ctx.fillText(entry.substring(0, 16), 0, 0);
      ctx.restore();
    });

    // Draw center circle with gradient
    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 20);
    gradient.addColorStop(0, "#FFD700");
    gradient.addColorStop(1, "#E8B454");
    ctx.beginPath();
    ctx.arc(centerX, centerY, 20, 0, 2 * Math.PI);
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 3;
    ctx.stroke();

    // Draw pointer at top
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - radius - 15);
    ctx.lineTo(centerX - 15, centerY - radius + 5);
    ctx.lineTo(centerX + 15, centerY - radius + 5);
    ctx.closePath();
    ctx.fillStyle = "#FFD700";
    ctx.fill();
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw pointer border
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - radius - 15);
    ctx.lineTo(centerX - 15, centerY - radius + 5);
    ctx.lineTo(centerX + 15, centerY - radius + 5);
    ctx.closePath();
    ctx.strokeStyle = "#333";
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  /**
   * Render entries list
   */
  function renderEntriesList() {
    if (!entriesList) return;

    if (entries.length === 0) {
      entriesList.innerHTML = '<p class="entries-info">No entries. Add one to start!</p>';
      return;
    }

    entriesList.innerHTML = entries
      .map((entry, index) => {
        const isDefault = DEFAULT_ENTRIES.includes(entry);
        return `
          <div class="entry-item ${isDefault ? "default" : ""}">
            <div class="entry-item-text">
              <span style="display: inline-block; width: 12px; height: 12px; background: ${COLORS[index % COLORS.length]}; border-radius: 2px; margin-right: 8px;"></span>
              ${entry}
              ${isDefault ? '<span class="entry-badge">Default</span>' : ""}
            </div>
            <button
              class="entry-remove-btn"
              data-index="${index}"
              ${entries.length <= 2 ? "disabled" : ""}
            >
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        `;
      })
      .join("");

    entriesList.querySelectorAll(".entry-remove-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const index = parseInt(btn.dataset.index, 10);
        removeEntry(index);
      });
    });

    drawWheel();
  }

  /**
   * Add entry
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
      showToast("Entry already exists", "error");
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
   * Remove entry
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
   * Reset to defaults
   */
  function resetEntries() {
    if (!confirm("Reset to Yes/No?")) return;

    entries = [...DEFAULT_ENTRIES];
    currentRotation = 0;
    saveEntries();
    renderEntriesList();
    if (resultEl) resultEl.textContent = "";

    showToast("Reset to defaults", "success");
  }

  /**
   * Get selected entry
   */
  function getSelectedEntry() {
    const normalizedRotation = ((currentRotation % 360) + 360) % 360;
    const sliceAngle = 360 / entries.length;
    const adjustedRotation = (normalizedRotation + sliceAngle / 2) % 360;
    const index = Math.floor(adjustedRotation / sliceAngle) % entries.length;
    return entries[index];
  }

  /**
   * Show toast
   */
  function showToast(message, type = "default") {
    if (window.FlipMasterUI && window.FlipMasterUI.showToast) {
      window.FlipMasterUI.showToast(message, type);
    }
  }

  /**
   * Spin wheel
   */
  function spinWheel() {
    if (isSpinning || entries.length < 2) {
      if (entries.length < 2) showToast("Add at least 2 entries first", "error");
      return;
    }

    isSpinning = true;
    if (spinBtn) spinBtn.disabled = true;
    if (resultEl) {
      resultEl.textContent = "Spinning...";
      resultEl.style.color = "#FFD700";
    }

    if (prefersReducedMotion) {
      const spinAmount = (1 + Math.random() * 0.5) * 360;
      currentRotation += spinAmount;
      const winner = getSelectedEntry();
      if (resultEl) resultEl.textContent = `🎡 ${winner}`;
      isSpinning = false;
      if (spinBtn) spinBtn.disabled = false;
      drawWheel();
      return;
    }

    if (typeof gsap === "undefined") {
      showToast("Animation library not loaded", "error");
      isSpinning = false;
      if (spinBtn) spinBtn.disabled = false;
      return;
    }

    // Calculate spin
    const minSpins = 5;
    const maxSpins = 8;
    const randomSpins = minSpins + Math.random() * (maxSpins - minSpins);
    const finalRandomDegrees = Math.random() * 360;
    const totalRotation = randomSpins * 360 + finalRandomDegrees;

    if (window.FlipMasterSound && window.FlipMasterSound.playThrow) {
      window.FlipMasterSound.playThrow();
    }

    const animationObject = { rotation: currentRotation };

    gsap.to(animationObject, {
      rotation: currentRotation + totalRotation,
      duration: 3.5,
      ease: "power2.inOut",
      onUpdate: function() {
        currentRotation = animationObject.rotation;
        drawWheel();
      },
      onComplete: () => {
        const winner = getSelectedEntry();
        
        if (resultEl) {
          resultEl.innerHTML = `<span style="font-size: 2em; font-weight: bold; color: #FFD700;">🎡 ${winner}</span>`;
          resultEl.style.animation = "none";
          setTimeout(() => {
            resultEl.style.animation = "resultPulse 0.5s ease";
          }, 10);
        }

        if (window.FlipMasterSound && window.FlipMasterSound.playLand) {
          window.FlipMasterSound.playLand();
        }

        isSpinning = false;
        if (spinBtn) spinBtn.disabled = false;
      }
    });
  }

  /**
   * Event listeners
   */
  if (spinBtn) {
    spinBtn.addEventListener("click", spinWheel);
  }

  if (addEntryBtn) {
    addEntryBtn.addEventListener("click", () => {
      if (entryInput) addEntry(entryInput.value);
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

  if (canvas) {
    canvas.addEventListener("click", spinWheel);
  }

  /**
   * Initialize
   */
  function init() {
    loadEntries();
    renderEntriesList();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  window.FlipMasterWheel = {
    spin: spinWheel,
    addEntry: addEntry,
    removeEntry: removeEntry,
    getEntries: () => entries.slice(),
    resetEntries: resetEntries
  };
})();