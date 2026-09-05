// Timers tab: simple countdown timers, plus multi-stage timers that count up
// from a shared start and fire an audio+visual cue as each named checkpoint
// (e.g. "Demon", "Standard ghost", "Spirit") is crossed.
window.PhasmoTimers = (function () {
  let timers = [];
  let nextId = 1;
  let gridEl;
  let audioCtx;

  function playTone(frequency = 880, durationSec = 0.4, volume = 0.2) {
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.value = frequency;
      gain.gain.setValueAtTime(volume, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + durationSec);
      osc.connect(gain).connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + durationSec);
    } catch (err) {
      // Audio isn't essential to the tool; ignore if unavailable.
    }
  }

  function formatTime(totalSeconds) {
    const s = Math.max(0, Math.ceil(totalSeconds));
    const m = Math.floor(s / 60);
    const rem = s % 60;
    return `${m}:${String(rem).padStart(2, "0")}`;
  }

  // ---- Simple countdown timers ----

  function addTimer(label, seconds) {
    timers.push({
      kind: "simple",
      id: nextId++,
      label,
      totalSeconds: seconds,
      remaining: seconds,
      running: false,
      intervalId: null,
    });
    render();
  }

  function startTimer(timer) {
    if (timer.running) return;
    timer.running = true;
    timer.intervalId = setInterval(() => {
      timer.remaining -= 1;
      if (timer.remaining <= 0) {
        timer.remaining = 0;
        timer.running = false;
        clearInterval(timer.intervalId);
        timer.intervalId = null;
        playTone(880, 0.4, 0.2);
      }
      updateSimpleCard(timer);
    }, 1000);
    render();
  }

  function pauseTimer(timer) {
    timer.running = false;
    if (timer.intervalId) clearInterval(timer.intervalId);
    timer.intervalId = null;
    render();
  }

  function resetTimer(timer) {
    pauseTimer(timer);
    timer.remaining = timer.totalSeconds;
    render();
  }

  function updateSimpleCard(timer) {
    const display = document.getElementById(`timer-display-${timer.id}`);
    if (!display) return;
    display.textContent = formatTime(timer.remaining);
    display.classList.toggle("done", timer.remaining <= 0);
  }

  function renderSimpleCard(timer) {
    const card = document.createElement("div");
    card.className = "timer-card";
    card.innerHTML = `
      <div class="timer-label">${timer.label}</div>
      <div id="timer-display-${timer.id}" class="timer-display${timer.remaining <= 0 ? " done" : ""}">${formatTime(timer.remaining)}</div>
      <div class="timer-controls">
        <button data-action="toggle">${timer.running ? "Pause" : "Start"}</button>
        <button data-action="reset">Reset</button>
      </div>
      <button class="timer-remove" data-action="remove">Remove</button>
    `;
    card.querySelector('[data-action="toggle"]').addEventListener("click", () => {
      timer.running ? pauseTimer(timer) : startTimer(timer);
    });
    card.querySelector('[data-action="reset"]').addEventListener("click", () => resetTimer(timer));
    card.querySelector('[data-action="remove"]').addEventListener("click", () => removeTimer(timer.id));
    return card;
  }

  // ---- Multi-stage timers (count up, fire a cue at each named checkpoint) ----

  function buildStages(rawStages) {
    return rawStages.map((s) => ({ ...s, fired: false }));
  }

  function addMultiTimer(config) {
    const timer = {
      kind: "multi",
      id: nextId++,
      label: config.label,
      note: config.note || "",
      core: !!config.core,
      elapsed: 0,
      running: false,
      intervalId: null,
      computeStages: config.computeStages || null,
      computeBase: config.computeBase || null,
      selects: config.selects || null,
      selectValues: {},
      baseSeconds: config.baseSeconds != null ? config.baseSeconds : null,
      stages: [],
    };
    if (timer.selects) {
      timer.selects.forEach((s) => {
        timer.selectValues[s.id] = s.default != null ? s.default : s.options[0].value;
      });
      if (timer.computeBase) timer.baseSeconds = timer.computeBase(timer.selectValues);
    }
    const rawStages = timer.computeStages ? timer.computeStages(timer.baseSeconds) : config.stages;
    timer.stages = buildStages(rawStages);
    timers.push(timer);
    render();
  }

  function startMultiTimer(timer) {
    if (timer.running) return;
    timer.running = true;
    timer.intervalId = setInterval(() => {
      timer.elapsed += 1;
      timer.stages.forEach((stage, i) => {
        if (!stage.fired && timer.elapsed >= stage.seconds) {
          stage.fired = true;
          playTone(660 + i * 220, 0.35, 0.22);
        }
      });
      updateMultiCard(timer);
      if (timer.stages.every((s) => s.fired)) pauseMultiTimer(timer);
    }, 1000);
    render();
  }

  function pauseMultiTimer(timer) {
    timer.running = false;
    if (timer.intervalId) clearInterval(timer.intervalId);
    timer.intervalId = null;
    render();
  }

  function resetMultiTimer(timer) {
    pauseMultiTimer(timer);
    timer.elapsed = 0;
    timer.stages.forEach((s) => (s.fired = false));
    render();
  }

  function updateMultiCard(timer) {
    const elapsedEl = document.getElementById(`timer-elapsed-${timer.id}`);
    if (elapsedEl) elapsedEl.textContent = formatTime(timer.elapsed);
    timer.stages.forEach((stage, i) => {
      const row = document.getElementById(`stage-row-${timer.id}-${i}`);
      if (!row) return;
      const statusEl = row.querySelector(".stage-status");
      if (stage.fired) {
        if (!row.classList.contains("reached")) {
          row.classList.add("reached", "stage-flash");
          setTimeout(() => row.classList.remove("stage-flash"), 1400);
        }
        statusEl.textContent = "✓ Reached";
      } else {
        statusEl.textContent = `in ${Math.max(0, stage.seconds - timer.elapsed)}s`;
      }
    });
  }

  function renderMultiCard(timer) {
    const card = document.createElement("div");
    card.className = "timer-card timer-card-multi";

    const selectsHtml = timer.selects
      ? `<div class="timer-selects">
          ${timer.selects
            .map(
              (s) => `
              <label class="timer-select-field">
                <span>${s.label}</span>
                <select id="timer-select-${timer.id}-${s.id}"${timer.running ? " disabled" : ""}>
                  ${s.options
                    .map(
                      (opt) =>
                        `<option value="${opt.value}"${
                          opt.value === timer.selectValues[s.id] ? " selected" : ""
                        }>${opt.label}</option>`
                    )
                    .join("")}
                </select>
              </label>`
            )
            .join("")}
        </div>`
      : "";

    const stagesHtml = timer.stages
      .map(
        (stage, i) => `
        <div id="stage-row-${timer.id}-${i}" class="stage-row${stage.fired ? " reached" : ""}">
          <span class="stage-label">${stage.label}</span>
          <span class="stage-target">${formatTime(stage.seconds)}</span>
          <span class="stage-status">${
            stage.fired ? "✓ Reached" : `in ${Math.max(0, stage.seconds - timer.elapsed)}s`
          }</span>
        </div>`
      )
      .join("");

    card.innerHTML = `
      <div class="timer-label">${timer.label}</div>
      ${selectsHtml}
      <div id="timer-elapsed-${timer.id}" class="timer-display multi-display">${formatTime(timer.elapsed)}</div>
      <div class="stage-list">${stagesHtml}</div>
      ${timer.note ? `<div class="timer-note">${timer.note}</div>` : ""}
      <div class="timer-controls">
        <button data-action="toggle">${timer.running ? "Pause" : "Start"}</button>
        <button data-action="reset">Reset</button>
      </div>
      ${timer.core ? "" : `<button class="timer-remove" data-action="remove">Remove</button>`}
    `;
    card.querySelector('[data-action="toggle"]').addEventListener("click", () => {
      timer.running ? pauseMultiTimer(timer) : startMultiTimer(timer);
    });
    card.querySelector('[data-action="reset"]').addEventListener("click", () => resetMultiTimer(timer));
    if (!timer.core) {
      card.querySelector('[data-action="remove"]').addEventListener("click", () => removeTimer(timer.id));
    }
    if (timer.selects) {
      timer.selects.forEach((s) => {
        card.querySelector(`#timer-select-${timer.id}-${s.id}`).addEventListener("change", (e) => {
          timer.selectValues[s.id] = e.target.value;
          if (timer.computeBase) timer.baseSeconds = timer.computeBase(timer.selectValues);
          timer.stages = buildStages(timer.computeStages(timer.baseSeconds));
          timer.elapsed = 0;
          render();
        });
      });
    }
    return card;
  }

  // ---- Shared ----

  function removeTimer(id) {
    const timer = timers.find((t) => t.id === id);
    if (!timer || timer.core) return;
    if (timer.intervalId) clearInterval(timer.intervalId);
    timers = timers.filter((t) => t.id !== id);
    render();
  }

  function render() {
    gridEl.innerHTML = "";
    timers.forEach((timer) => {
      gridEl.appendChild(timer.kind === "multi" ? renderMultiCard(timer) : renderSimpleCard(timer));
    });
  }

  function init() {
    gridEl = document.getElementById("timer-grid");

    // Multi-stage checkpoint timers. Values sourced from the current
    // Phasmophobia wiki (Incense/Hunt/Myling pages) — check them there if
    // a future game update changes these numbers.
    addMultiTimer({
      label: "Incense — Hunt Prevention",
      note: "Won't stop a hunt already in progress or prevent cursed hunts.",
      core: true,
      stages: [
        { label: "Demon", seconds: 60 },
        { label: "Standard ghost", seconds: 90 },
        { label: "Spirit", seconds: 180 },
      ],
    });

    addMultiTimer({
      label: "Hunt Cooldown",
      note: "Minimum time after a hunt ends before the ghost can hunt again. Doesn't apply to cursed hunts.",
      core: true,
      stages: [
        { label: "Demon", seconds: 20 },
        { label: "Standard ghost", seconds: 25 },
      ],
    });

    const HUNT_DURATION_TABLE = {
      amateur: { small: 15, medium: 30, large: 40 },
      intermediate: { small: 20, medium: 40, large: 50 },
      high: { small: 30, medium: 50, large: 60 },
    };
    addMultiTimer({
      label: "Hunt Duration",
      note: "Obambo is 20% shorter only if it enters its aggressive state. \"After a cursed hunt\" applies to every hunt for the rest of the contract once any cursed hunt has happened.",
      core: true,
      selects: [
        {
          id: "difficulty",
          label: "Difficulty",
          default: "intermediate",
          options: [
            { value: "amateur", label: "Amateur" },
            { value: "intermediate", label: "Intermediate" },
            { value: "high", label: "Prof./Nightmare/Insanity" },
          ],
        },
        {
          id: "map",
          label: "Map Size",
          default: "small",
          options: [
            { value: "small", label: "Small" },
            { value: "medium", label: "Medium" },
            { value: "large", label: "Large" },
          ],
        },
      ],
      computeBase: (values) => HUNT_DURATION_TABLE[values.difficulty][values.map],
      computeStages: (base) => [
        { label: "Obambo (aggressive)", seconds: Math.round(base * 0.8) },
        { label: "Standard ghost", seconds: base },
        { label: "After a cursed hunt", seconds: base + 20 },
      ],
    });

    addMultiTimer({
      label: "Paranormal Sound Window",
      note: "A sound heard before 64s can only be a Myling. 80s is the earliest a standard ghost can produce one, not Myling — Myling's own window starts at 64s.",
      core: true,
      stages: [
        { label: "Myling possible from", seconds: 64 },
        { label: "Any ghost possible from", seconds: 80 },
        { label: "Overdue past", seconds: 127 },
      ],
    });

    addTimer("Hiding Recommended (~30s)", 30);

    document.getElementById("custom-timer-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const labelEl = document.getElementById("custom-timer-label");
      const secondsEl = document.getElementById("custom-timer-seconds");
      const label = labelEl.value.trim();
      const seconds = parseInt(secondsEl.value, 10);
      if (!label || !seconds || seconds <= 0) return;
      addTimer(label, seconds);
      labelEl.value = "";
      secondsEl.value = "";
    });
  }

  return { init };
})();
