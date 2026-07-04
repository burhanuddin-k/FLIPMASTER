/**
 * stats.js — FlipMaster's data layer + statistics engine.
 *
 * This is the single source of truth for flip records. It owns
 * localStorage persistence and exposes a small public API
 * (window.FlipMasterStats) that history.js reads from. coin.js never
 * touches storage directly — it only dispatches "flipmaster:flip-complete",
 * which this module listens for.
 */
(function () {
  "use strict";

  const STORAGE_KEY = "flipmaster:flips";
  const MAX_STORED = 1000; // cap storage growth; history UI only shows last 20 anyway

  function loadFlips() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      console.error("FlipMaster: could not read stored flip history", err);
      return [];
    }
  }

  function saveFlips(flips) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(flips.slice(-MAX_STORED)));
    } catch (err) {
      console.error("FlipMaster: could not persist flip history", err);
    }
  }

  let flips = loadFlips();

  /* ------------------------------------------------------------------
     Date-range helpers for today / week / month counts
     ------------------------------------------------------------------ */
  function startOf(unit, date = new Date()) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    if (unit === "week") {
      d.setDate(d.getDate() - d.getDay()); // back up to Sunday
    } else if (unit === "month") {
      d.setDate(1);
    }
    return d.getTime();
  }

  /* ------------------------------------------------------------------
     Derived statistics
     ------------------------------------------------------------------ */
  function computeStats() {
    const total = flips.length;
    const heads = flips.filter((f) => f.result === "heads").length;
    const tails = total - heads;
    const headsPct = total ? Math.round((heads / total) * 100) : 0;
    const tailsPct = total ? 100 - headsPct : 0;

    // Current streak: consecutive identical results ending at the most recent flip.
    let currentStreak = 0;
    if (total) {
      const lastResult = flips[total - 1].result;
      for (let i = total - 1; i >= 0; i--) {
        if (flips[i].result === lastResult) currentStreak++;
        else break;
      }
    }

    // Longest streak: longest run of identical results anywhere in history.
    let longestStreak = 0;
    let run = 0;
    let prevResult = null;
    flips.forEach((f) => {
      run = f.result === prevResult ? run + 1 : 1;
      prevResult = f.result;
      if (run > longestStreak) longestStreak = run;
    });

    const dayStart = startOf("day");
    const weekStart = startOf("week");
    const monthStart = startOf("month");

    const today = flips.filter((f) => f.timestamp >= dayStart).length;
    const week = flips.filter((f) => f.timestamp >= weekStart).length;
    const month = flips.filter((f) => f.timestamp >= monthStart).length;

    return {
      total,
      heads,
      tails,
      headsPct,
      tailsPct,
      currentStreak,
      longestStreak,
      today,
      week,
      month,
    };
  }

  /* ------------------------------------------------------------------
     Rendering — animated counters via FlipMasterUI.animateCounter
     ------------------------------------------------------------------ */
  function renderStats() {
    const ui = window.FlipMasterUI;
    if (!ui) return;
    const stats = computeStats();

    const bindings = [
      ["total", stats.total],
      ["heads", stats.heads],
      ["tails", stats.tails],
      ["headsPct", stats.headsPct],
      ["currentStreak", stats.currentStreak],
      ["longestStreak", stats.longestStreak],
      ["today", stats.today],
      ["week", stats.week],
      ["heroTotal", stats.total],
      ["heroHeadsPct", stats.headsPct],
      ["heroTailsPct", stats.tailsPct],
    ];

    bindings.forEach(([key, value]) => {
      const el = document.querySelector(`[data-stat="${key}"]`);
      if (el) ui.animateCounter(el, value);
    });
  }

  /* ------------------------------------------------------------------
     Mutations
     ------------------------------------------------------------------ */
  function addFlip(result, timestamp) {
    flips.push({ result, timestamp });
    saveFlips(flips);
    renderStats();
  }

  function clear() {
    flips = [];
    saveFlips(flips);
    renderStats();
  }

  function getFlips() {
    return flips.slice();
  }

  /* ------------------------------------------------------------------
     Wire-up
     ------------------------------------------------------------------ */
  window.addEventListener("flipmaster:flip-complete", (e) => {
    addFlip(e.detail.result, e.detail.timestamp);
  });

  document.addEventListener("DOMContentLoaded", renderStats);

  window.FlipMasterStats = { getFlips, addFlip, clear, computeStats };
})();