/**
 * sound.js — Sound effects for FlipMaster.
 *
 * Uses the Web Audio API to synthesize every sound (throw, land, click)
 * rather than shipping binary audio files. This keeps the app dependency-free
 * and avoids licensing/asset-sourcing entirely. Swap playTone() calls for
 * <audio> playback if real recorded SFX are dropped into assets/audio/.
 *
 * Respects the mute toggle in ui.js via the flipmaster:mute-changed event.
 */
(function () {
  "use strict";

  let ctx = null;
  let muted = false;

  function getContext() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;
    if (!ctx) ctx = new AudioContextClass();
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }

  /**
   * Play a short synthesized tone.
   * @param {Object} opts
   * @param {number} opts.freq - starting frequency in Hz
   * @param {number} [opts.sweepTo] - if set, frequency ramps to this value
   * @param {number} opts.duration - seconds
   * @param {OscillatorType} [opts.type] - waveform
   * @param {number} [opts.peak] - peak gain (0-1)
   * @param {number} [opts.delay] - seconds to wait before starting
   */
  function playTone({ freq, sweepTo = null, duration, type = "sine", peak = 0.2, delay = 0 }) {
    if (muted) return;
    const audioCtx = getContext();
    if (!audioCtx) return;

    const startAt = audioCtx.currentTime + delay;

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, startAt);
    if (sweepTo !== null) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(sweepTo, 1), startAt + duration);
    }

    gain.gain.setValueAtTime(0.0001, startAt);
    gain.gain.exponentialRampToValueAtTime(peak, startAt + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start(startAt);
    osc.stop(startAt + duration + 0.02);
  }

  function playThrow() {
    // Rising sweep — a coin leaving the thumb.
    playTone({ freq: 220, sweepTo: 760, duration: 0.22, type: "triangle", peak: 0.16 });
  }

  function playLand() {
    // Low thud, plus a bright secondary tick just after impact.
    playTone({ freq: 190, sweepTo: 60, duration: 0.2, type: "sine", peak: 0.32 });
    playTone({ freq: 520, sweepTo: 240, duration: 0.09, type: "square", peak: 0.07, delay: 0.05 });
  }

  function playClick() {
    playTone({ freq: 640, duration: 0.05, type: "square", peak: 0.05 });
  }

  window.addEventListener("flipmaster:mute-changed", (e) => {
    muted = !!(e.detail && e.detail.muted);
  });

  function wireGenericClicks() {
    document.querySelectorAll(".btn, .icon-btn").forEach((btn) => {
      // The flip button gets its own "throw" sound from coin.js; skip it
      // here so it doesn't also fire a generic click blip.
      if (btn.id === "flipBtn") return;
      btn.addEventListener("click", playClick);
    });
  }

  document.addEventListener("DOMContentLoaded", wireGenericClicks);

  window.FlipMasterSound = { playThrow, playLand, playClick };
})();