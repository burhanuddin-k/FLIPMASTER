/**
 * history.js — Recent flip history panel.
 *
 * Reads from window.FlipMasterStats (the data layer) and renders the
 * scrollable list. Listens for "flipmaster:flip-complete" to prepend new
 * entries live, and owns the "Clear history" button since it lives inside
 * this panel's markup.
 */
(function () {
  "use strict";

  const listEl = document.getElementById("historyList");
  const clearBtn = document.getElementById("clearHistoryBtn");
  const MAX_VISIBLE = 20;

  function formatTime(timestamp) {
    const diffMs = Date.now() - timestamp;

    if (diffMs < 60 * 1000) return "Just now";
    if (diffMs < 60 * 60 * 1000) {
      const mins = Math.floor(diffMs / (60 * 1000));
      return `${mins}m ago`;
    }

    const date = new Date(timestamp);
    const isToday = new Date().toDateString() === date.toDateString();
    const time = date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

    if (isToday) return time;
    const day = date.toLocaleDateString([], { month: "short", day: "numeric" });
    return `${day}, ${time}`;
  }

  function buildItem(record, isNew) {
    const li = document.createElement("li");
    li.className = `history-item${isNew ? " new" : ""}`;
    const label = record.result === "heads" ? "Heads" : "Tails";
    const badgeLetter = record.result === "heads" ? "H" : "T";

    const left = document.createElement("div");
    left.className = "history-left";

    const badge = document.createElement("span");
    badge.className = `history-badge ${record.result}`;
    badge.textContent = badgeLetter;

    const resultText = document.createElement("span");
    resultText.className = "history-result";
    resultText.textContent = label;

    left.appendChild(badge);
    left.appendChild(resultText);

    const time = document.createElement("span");
    time.className = "history-time";
    time.textContent = formatTime(record.timestamp);

    li.appendChild(left);
    li.appendChild(time);
    return li;
  }

  function renderEmptyState() {
    if (!listEl) return;
    listEl.innerHTML = "";
    const empty = document.createElement("li");
    empty.className = "history-empty";
    empty.textContent = "No flips yet — your history will show up here.";
    listEl.appendChild(empty);
  }

  function renderAll() {
    if (!listEl || !window.FlipMasterStats) return;
    const flips = window.FlipMasterStats.getFlips().slice(-MAX_VISIBLE).reverse();

    if (!flips.length) {
      renderEmptyState();
      return;
    }

    listEl.innerHTML = "";
    flips.forEach((record) => listEl.appendChild(buildItem(record, false)));
  }

  function prepend(record) {
    if (!listEl) return;
    const empty = listEl.querySelector(".history-empty");
    if (empty) empty.remove();

    listEl.insertBefore(buildItem(record, true), listEl.firstChild);

    while (listEl.children.length > MAX_VISIBLE) {
      listEl.removeChild(listEl.lastChild);
    }
  }

  window.addEventListener("flipmaster:flip-complete", (e) => {
    prepend(e.detail);
  });

  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      if (!window.FlipMasterStats) return;
      window.FlipMasterStats.clear();
      renderEmptyState();
      if (window.FlipMasterUI) {
        window.FlipMasterUI.showToast("History cleared.", "success");
      }
    });
  }

  // Refresh relative timestamps ("Just now" -> "2m ago") periodically.
  setInterval(renderAll, 30000);

  document.addEventListener("DOMContentLoaded", renderAll);
})();