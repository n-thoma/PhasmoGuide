// Footsteps tab: tap along with in-game footstep sounds to estimate the
// ghost's movement speed, then shortlist ghosts whose known speed matches.
window.PhasmoFootsteps = (function () {
  // Distance (in meters) assumed to pass between each footstep sound cue.
  // This is a rough calibration constant, not a value taken from the game's
  // files — adjust it here if measured speeds consistently read high/low
  // compared to a ghost's known speed.
  const STRIDE_METERS = 0.7;

  // How many of the most recent taps to average over.
  const MAX_TAPS = 8;

  // If the gap since the last tap exceeds this, start a fresh sequence
  // instead of folding a long pause into the average.
  const RESET_GAP_MS = 3000;

  // How close (in m/s) an estimated speed must be to a ghost's speed range
  // to be listed as a possible match.
  const MATCH_TOLERANCE = 0.2;

  let taps = [];
  // Custom-difficulty "Ghost speed (%)" multiplier — every ghost's speed
  // scales linearly with this setting (confirmed on the wiki's Hunt page:
  // "assume a default Ghost speed (%) setting of 100 ... speeds will scale
  // accordingly if this setting is changed"). Selectable values per the
  // Difficulty page's settings table: 50/75/100/125/150.
  let speedMultiplier = 1;
  let tapBtn, resetBtn, intervalEl, stepsEl, speedEl, matchesListEl, speedSettingEl;

  function averageIntervalMs() {
    if (taps.length < 2) return null;
    const intervals = [];
    for (let i = 1; i < taps.length; i++) {
      intervals.push(taps[i] - taps[i - 1]);
    }
    return intervals.reduce((sum, v) => sum + v, 0) / intervals.length;
  }

  function ghostSpeedRange(ghost) {
    const { type, base, min, max, values } = ghost.speed;
    let range = null;
    if (type === "range" && min != null && max != null) {
      range = [min, max];
    } else if (type === "multiple" && values && values.length > 0) {
      const nums = values.map((v) => v.value);
      range = [Math.min(...nums), Math.max(...nums)];
    } else if (base != null) {
      range = [base, base];
    }
    if (!range) return null;
    return [range[0] * speedMultiplier, range[1] * speedMultiplier];
  }

  function renderMatches(speedMps) {
    matchesListEl.innerHTML = "";
    const ghosts = window.PhasmoGhosts ? window.PhasmoGhosts.getAllGhosts() : [];
    const matches = ghosts.filter((ghost) => {
      const range = ghostSpeedRange(ghost);
      if (!range) return false;
      const [min, max] = range;
      return speedMps >= min - MATCH_TOLERANCE && speedMps <= max + MATCH_TOLERANCE;
    });

    if (matches.length === 0) {
      matchesListEl.innerHTML = "<li>No matches yet — keep tapping steadily.</li>";
      return;
    }

    matches.forEach((ghost) => {
      const li = document.createElement("li");
      const [min, max] = ghostSpeedRange(ghost).map((v) => Number(v.toFixed(2)));
      li.innerHTML = `<span>${ghost.name}</span><span>${min === max ? min : `${min}–${max}`} m/s</span>`;
      matchesListEl.appendChild(li);
    });
  }

  function updateDisplay() {
    const avgMs = averageIntervalMs();
    if (avgMs == null) {
      intervalEl.textContent = "--";
      stepsEl.textContent = "--";
      speedEl.textContent = "--";
      matchesListEl.innerHTML = "<li>Tap along with footsteps to begin.</li>";
      return;
    }
    const stepsPerSec = 1000 / avgMs;
    const speedMps = STRIDE_METERS * stepsPerSec;

    intervalEl.textContent = `${avgMs.toFixed(0)} ms`;
    stepsEl.textContent = stepsPerSec.toFixed(2);
    speedEl.textContent = `${speedMps.toFixed(2)} m/s`;
    renderMatches(speedMps);
  }

  function tap() {
    if (window.PhasmoGhosts) window.PhasmoGhosts.playThud();
    const now = performance.now();
    if (taps.length > 0 && now - taps[taps.length - 1] > RESET_GAP_MS) {
      taps = [];
    }
    taps.push(now);
    if (taps.length > MAX_TAPS) taps.shift();
    updateDisplay();
  }

  function reset() {
    taps = [];
    updateDisplay();
  }

  function init() {
    tapBtn = document.getElementById("tap-btn");
    resetBtn = document.getElementById("tap-reset");
    intervalEl = document.getElementById("stat-interval");
    stepsEl = document.getElementById("stat-steps");
    speedEl = document.getElementById("stat-speed");
    matchesListEl = document.getElementById("footsteps-matches-list");
    speedSettingEl = document.getElementById("ghost-speed-setting");

    tapBtn.addEventListener("click", tap);
    resetBtn.addEventListener("click", reset);
    speedSettingEl.addEventListener("change", (e) => {
      speedMultiplier = Number(e.target.value);
      updateDisplay();
    });

    document.addEventListener("keydown", (e) => {
      const footstepsTabActive = document.getElementById("tab-footsteps").classList.contains("active");
      if (e.code === "Space" && footstepsTabActive) {
        e.preventDefault();
        tap();
      }
    });

    updateDisplay();
  }

  return { init };
})();
