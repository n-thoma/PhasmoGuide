// Ghosts tab: evidence-narrowing filter, ghost list, and detail panel.
window.PhasmoGhosts = (function () {
  const data = window.PHASMOGUIDE_DATA || { evidenceTypes: [], ghosts: [], dataStatus: "" };

  // Each evidence type cycles through three states: unset (map has no entry
  // — "Not sure yet"), "confirmed" ("It is"), "excluded" ("It is not").
  const evidenceState = new Map();
  let searchText = "";
  let selectedGhostName = null;

  // Number of evidence types the current contract's difficulty actually
  // reveals (fewer evidence types are obtainable on harder difficulties —
  // the rest are hidden, not absent). Source: the wiki's Difficulty page
  // settings table ("Evidence given" row: Amateur 3, Intermediate 3,
  // Professional 3, Nightmare 2, Insanity 1, Apocalypse III 0).
  const DIFFICULTY_EVIDENCE_COUNT = {
    amateur: 3,
    intermediate: 3,
    professional: 3,
    nightmare: 2,
    insanity: 1,
    apocalypse3: 0,
  };
  let evidenceCount = DIFFICULTY_EVIDENCE_COUNT.professional;

  // Ghost Orb is exempt from the difficulty's evidence cap: per the wiki,
  // The Mimic "will always produce false ghost orbs" as a bonus tell the
  // Journal doesn't count toward the normal 3-evidence puzzle, so it stays
  // selectable (and un-lockable) no matter how many "real" evidence types
  // the difficulty allows.
  const MIMIC_TELL_EVIDENCE = "Ghost Orb";

  let evidenceToggleEl, ghostListEl, ghostCountEl, ghostDetailEl, searchInputEl, clearBtnEl;
  let difficultySelectEl, customEvidenceCountEl, evidenceCountReadoutEl;

  function regularConfirmedEvidence() {
    return [...evidenceState.entries()]
      .filter(([e, s]) => s === "confirmed" && e !== MIMIC_TELL_EVIDENCE)
      .map(([e]) => e);
  }

  // A normal ghost can never show more evidence than the difficulty allows.
  // Seeing that many "real" evidences confirmed plus a Ghost Orb on top is
  // only possible for The Mimic, which fakes an orb regardless of its
  // (fixed, non-orb) real combo.
  function isMimicSignal() {
    return (
      regularConfirmedEvidence().length === evidenceCount &&
      evidenceState.get(MIMIC_TELL_EVIDENCE) === "confirmed"
    );
  }

  function matchesFilters(ghost) {
    const nameMatches = ghost.name.toLowerCase().includes(searchText.toLowerCase());
    if (isMimicSignal()) {
      return nameMatches && ghost.name === "The Mimic";
    }
    const evidenceMatches = [...evidenceState].every(([evidence, state]) => {
      if (state === "confirmed") return ghost.evidences.includes(evidence);
      if (state === "excluded") return !ghost.evidences.includes(evidence);
      return true;
    });
    return nameMatches && evidenceMatches;
  }

  function getFilteredGhosts() {
    return data.ghosts.filter(matchesFilters);
  }

  // Drop the most-recently-confirmed evidence beyond what the current
  // difficulty can actually reveal, e.g. after switching from Amateur (3)
  // to Insanity (1) with two already confirmed. Ghost Orb is never trimmed.
  function enforceEvidenceCap() {
    const confirmed = regularConfirmedEvidence();
    if (confirmed.length > evidenceCount) {
      confirmed.slice(evidenceCount).forEach((e) => evidenceState.delete(e));
    }
  }

  function cycleEvidenceState(evidence) {
    const current = evidenceState.get(evidence);
    if (current === "confirmed") evidenceState.set(evidence, "excluded");
    else if (current === "excluded") evidenceState.delete(evidence);
    else evidenceState.set(evidence, "confirmed");
  }

  function renderEvidenceCountReadout() {
    evidenceCountReadoutEl.textContent = `${regularConfirmedEvidence().length} of ${evidenceCount} evidence confirmed`;
  }

  function renderEvidenceToggles() {
    renderEvidenceCountReadout();
    const atCap = regularConfirmedEvidence().length >= evidenceCount;
    evidenceToggleEl.innerHTML = "";
    data.evidenceTypes.forEach((evidence) => {
      const state = evidenceState.get(evidence);
      const isMimicTell = evidence === MIMIC_TELL_EVIDENCE;
      const locked = !isMimicTell && atCap && state !== "confirmed";

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "evidence-toggle-btn";
      if (state === "confirmed") btn.classList.add("confirmed");
      if (state === "excluded") btn.classList.add("excluded");
      if (locked) btn.classList.add("locked");
      btn.disabled = locked;

      const stateLabel = state === "confirmed" ? "It is" : state === "excluded" ? "It is not" : "Not sure yet";
      const lockIcon = locked ? '<span class="evidence-lock" aria-hidden="true">🔒</span>' : "";
      btn.innerHTML = `<span class="evidence-name">${escapeHtml(evidence)}</span><span class="evidence-state">${lockIcon}${stateLabel}</span>`;
      btn.addEventListener("click", () => {
        cycleEvidenceState(evidence);
        renderEvidenceToggles();
        renderGhostList();
      });
      evidenceToggleEl.appendChild(btn);
    });
  }

  function renderGhostList() {
    const filtered = getFilteredGhosts();
    ghostCountEl.textContent = `${filtered.length} of ${data.ghosts.length} ghosts match`;

    ghostListEl.innerHTML = "";
    filtered.forEach((ghost) => {
      const li = document.createElement("li");
      li.className = "ghost-list-item";
      if (ghost.name === selectedGhostName) li.classList.add("selected");

      const nameEl = document.createElement("div");
      nameEl.className = "ghost-name";
      nameEl.textContent = ghost.name;

      const evEl = document.createElement("div");
      evEl.className = "ghost-evidence";
      evEl.textContent = ghost.evidences.join(" • ");

      li.appendChild(nameEl);
      li.appendChild(evEl);
      li.addEventListener("click", () => {
        selectedGhostName = ghost.name;
        renderGhostList();
        renderDetail(ghost);
      });
      ghostListEl.appendChild(li);
    });

    if (selectedGhostName && !filtered.some((g) => g.name === selectedGhostName)) {
      selectedGhostName = null;
      stopFootstepLoop();
      ghostDetailEl.innerHTML = '<p class="empty-hint">Select a ghost to see details.</p>';
    }
  }

  function renderList(title, items) {
    if (!items || items.length === 0) return "";
    const lis = items.map((i) => `<li>${escapeHtml(i)}</li>`).join("");
    return `<div class="detail-section"><span class="detail-label">${title}</span><ul>${lis}</ul></div>`;
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  // A handful of the newest ghosts don't have a "Discovered" Journal
  // portrait on the wiki yet — shown in place of <img class="ghost-portrait">
  // so every ghost's detail panel has the same layout either way.
  function ghostPortraitPlaceholder(name) {
    return `<div class="ghost-portrait ghost-portrait-placeholder" role="img" aria-label="No Journal image available yet for ${escapeHtml(
      name
    )}">
      <span aria-hidden="true">👻</span>
      <span class="ghost-portrait-placeholder-text">No image yet</span>
    </div>`;
  }

  // ---- Footstep audio preview ----
  // Approximates in-game footstep cadence for a given ghost speed so players
  // can compare it by ear against what they're hearing on a hunt. Must match
  // the Footsteps tab's STRIDE_METERS exactly, so a played tempo (BPM) and a
  // tapped-out speed reading agree for the same ghost speed.
  const FOOTSTEP_STRIDE_METERS = 0.872;
  const FOOTSTEP_LOOP_STEPS = 8;
  let audioCtx;
  let activeFootstepLoop = null; // { intervalId, btnEl }

  function playFootstepThud() {
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(150, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(55, audioCtx.currentTime + 0.09);
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.13);
      osc.connect(gain).connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.13);
    } catch (err) {
      // Audio isn't essential to the tool; ignore if unavailable.
    }
  }

  function stopFootstepLoop() {
    if (!activeFootstepLoop) return;
    clearInterval(activeFootstepLoop.intervalId);
    activeFootstepLoop.btnEl.classList.remove("playing");
    activeFootstepLoop.btnEl.textContent = "🔊";
    activeFootstepLoop = null;
  }

  function toggleFootstepLoop(speedMps, btnEl) {
    if (activeFootstepLoop && activeFootstepLoop.btnEl === btnEl) {
      stopFootstepLoop();
      return;
    }
    stopFootstepLoop();
    if (!speedMps) return;
    const intervalMs = 1000 / (speedMps / FOOTSTEP_STRIDE_METERS);
    let steps = 0;
    playFootstepThud();
    steps++;
    const intervalId = setInterval(() => {
      playFootstepThud();
      steps++;
      if (steps >= FOOTSTEP_LOOP_STEPS) stopFootstepLoop();
    }, intervalMs);
    btnEl.classList.add("playing");
    btnEl.textContent = "⏹";
    activeFootstepLoop = { intervalId, btnEl };
  }

  function footstepPlayButton(value, label) {
    const title = label ? `Play footstep tempo — ${label}` : "Play footstep tempo";
    return `<button type="button" class="footstep-play-btn" data-speed-play="${value}" title="${escapeHtml(
      title
    )}" aria-label="${escapeHtml(title)}">🔊</button>`;
  }

  // Compact "1.5m/s" form — the unit rides along in its own span so it can be
  // styled smaller/dimmer than the number without an explanatory label.
  function formatSpeedValue(value) {
    return `${value}<span class="speed-unit">m/s</span>`;
  }

  function formatSpeed(speed) {
    if (speed.type === "range" && speed.min != null && speed.max != null) {
      return `<span class="speed-chip">${formatSpeedValue(speed.min)}${footstepPlayButton(
        speed.min,
        "min"
      )}</span> - <span class="speed-chip">${formatSpeedValue(speed.max)}${footstepPlayButton(speed.max, "max")}</span>`;
    }
    if (speed.type === "multiple" && speed.values && speed.values.length > 0) {
      return speed.values
        .map((v) => `<span class="speed-chip">${formatSpeedValue(v.value)}${footstepPlayButton(v.value, v.label)}</span>`)
        .join(" | ");
    }
    if (speed.base != null) return `<span class="speed-chip">${formatSpeedValue(speed.base)}${footstepPlayButton(speed.base)}</span>`;
    return "Unknown";
  }

  function formatHuntSanity(huntSanity) {
    if (huntSanity.type === "range" && huntSanity.min != null && huntSanity.max != null) {
      return `${huntSanity.min}% - ${huntSanity.max}%`;
    }
    if (huntSanity.type === "multiple" && huntSanity.values && huntSanity.values.length > 0) {
      return huntSanity.values.map((v) => `${v.value}%`).join(" | ");
    }
    if (huntSanity.base != null) return `${huntSanity.base}%`;
    return "Unknown";
  }

  // A row with a value plus a toggle button that reveals/hides an adjacent
  // notes block — shared by Speed and Hunt Sanity, which are the two stats
  // that can carry ghost-specific caveats too detailed to show by default.
  function renderStatWithNotes(label, valueHtml, notes, key) {
    const toggleBtn = notes
      ? `<button type="button" class="stat-notes-toggle" data-notes-toggle="${key}" aria-expanded="false">Notes</button>`
      : "";
    const notesBlock = notes
      ? `<div class="detail-notes" data-notes-panel="${key}" hidden>${escapeHtml(notes)}</div>`
      : "";
    return `
      <div class="detail-section">
        <span class="detail-label">${label}</span>
        <span class="stat-row"><span class="stat-value">${valueHtml}</span>${toggleBtn}</span>
        ${notesBlock}
      </div>`;
  }

  function renderDetail(ghost) {
    stopFootstepLoop();
    ghostDetailEl.innerHTML = `
      ${
        ghost.imageUrl
          ? `<img class="ghost-portrait" src="${escapeHtml(ghost.imageUrl)}" alt="${escapeHtml(
              ghost.name
            )} as shown in the Journal" loading="lazy">`
          : ghostPortraitPlaceholder(ghost.name)
      }
      <h3>${escapeHtml(ghost.name)}</h3>
      <div class="detail-section">
        <span class="detail-label">Evidence</span>
        <ul>${ghost.evidences.map((e) => `<li>${escapeHtml(e)}</li>`).join("")}</ul>
      </div>
      ${renderStatWithNotes("Speed", formatSpeed(ghost.speed), ghost.speed.notes, "speed")}
      ${renderStatWithNotes("Hunt Sanity Threshold", formatHuntSanity(ghost.huntSanity), ghost.huntSanity.notes, "hunt-sanity")}
      ${renderList("Strengths", ghost.strengths)}
      ${renderList("Weaknesses", ghost.weaknesses)}
      ${ghost.abilityNotes ? `<div class="detail-section"><span class="detail-label">Notes</span>${escapeHtml(ghost.abilityNotes)}</div>` : ""}
      ${ghost.verified === false ? `<p class="seed-data-note">⚠ Unverified seed data — run <code>npm run scrape</code> to refresh from the wiki.</p>` : ""}
    `;
    const portraitImg = ghostDetailEl.querySelector(".ghost-portrait");
    if (portraitImg) {
      portraitImg.addEventListener(
        "error",
        () => {
          portraitImg.outerHTML = ghostPortraitPlaceholder(ghost.name);
        },
        { once: true }
      );
    }
    ghostDetailEl.querySelectorAll("[data-notes-toggle]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const key = btn.getAttribute("data-notes-toggle");
        const panel = ghostDetailEl.querySelector(`[data-notes-panel="${key}"]`);
        if (!panel) return;
        const isHidden = panel.hidden;
        panel.hidden = !isHidden;
        btn.setAttribute("aria-expanded", String(isHidden));
      });
    });
    ghostDetailEl.querySelectorAll("[data-speed-play]").forEach((btn) => {
      btn.addEventListener("click", () => {
        toggleFootstepLoop(Number(btn.getAttribute("data-speed-play")), btn);
      });
    });
  }

  function applyEvidenceCount(count) {
    evidenceCount = Math.min(3, Math.max(0, count));
    enforceEvidenceCap();
    renderEvidenceToggles();
    renderGhostList();
  }

  function init() {
    evidenceToggleEl = document.getElementById("evidence-toggles");
    ghostListEl = document.getElementById("ghost-list");
    ghostCountEl = document.getElementById("ghost-count");
    ghostDetailEl = document.getElementById("ghost-detail");
    searchInputEl = document.getElementById("ghost-search");
    clearBtnEl = document.getElementById("evidence-clear");
    difficultySelectEl = document.getElementById("difficulty-select");
    customEvidenceCountEl = document.getElementById("custom-evidence-count");
    evidenceCountReadoutEl = document.getElementById("evidence-count-readout");

    renderEvidenceToggles();
    renderGhostList();

    searchInputEl.addEventListener("input", (e) => {
      searchText = e.target.value;
      renderGhostList();
    });

    clearBtnEl.addEventListener("click", () => {
      evidenceState.clear();
      renderEvidenceToggles();
      renderGhostList();
    });

    difficultySelectEl.addEventListener("change", (e) => {
      const value = e.target.value;
      if (value === "custom") {
        customEvidenceCountEl.hidden = false;
        applyEvidenceCount(parseInt(customEvidenceCountEl.value, 10) || 3);
      } else {
        customEvidenceCountEl.hidden = true;
        applyEvidenceCount(DIFFICULTY_EVIDENCE_COUNT[value]);
      }
    });

    customEvidenceCountEl.addEventListener("input", (e) => {
      const n = parseInt(e.target.value, 10);
      if (n >= 0 && n <= 3) applyEvidenceCount(n);
    });

    customEvidenceCountEl.addEventListener("change", (e) => {
      const clamped = Math.min(3, Math.max(0, parseInt(e.target.value, 10) || 0));
      e.target.value = clamped;
      applyEvidenceCount(clamped);
    });
  }

  return {
    init,
    getAllGhosts: () => data.ghosts,
    stopAudio: stopFootstepLoop,
    playThud: playFootstepThud,
  };
})();
