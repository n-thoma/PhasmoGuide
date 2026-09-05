// Maps tab: browse maps grouped by size, see the wiki's Rooms/Sanity/
// Temperatures floor-plan diagrams, and where each cursed possession spawns.
window.PhasmoMaps = (function () {
  const data = window.PHASMOGUIDE_MAPS || { maps: [], dataStatus: "" };
  const SIZE_ORDER = ["small", "medium", "large"];
  const SIZE_LABELS = { small: "Small", medium: "Medium", large: "Large" };

  let searchText = "";
  let selectedName = null;
  let selectedDiagramIndex = 0;

  let listEl, detailEl, searchInputEl, countEl;

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function getFiltered() {
    return data.maps.filter((m) => m.name.toLowerCase().includes(searchText.toLowerCase()));
  }

  function appendMapItem(mapEntry) {
    const li = document.createElement("li");
    li.className = "map-list-item";
    if (mapEntry.name === selectedName) li.classList.add("selected");
    li.textContent = mapEntry.name;
    li.addEventListener("click", () => {
      selectedName = mapEntry.name;
      selectedDiagramIndex = 0;
      renderList();
      renderDetail(mapEntry);
    });
    listEl.appendChild(li);
  }

  function renderList() {
    const filtered = getFiltered();
    if (countEl) countEl.textContent = `${filtered.length} of ${data.maps.length} maps`;
    listEl.innerHTML = "";

    SIZE_ORDER.forEach((size) => {
      const group = filtered.filter((m) => m.size === size);
      if (group.length === 0) return;
      const heading = document.createElement("li");
      heading.className = "map-list-heading";
      heading.textContent = `${SIZE_LABELS[size]} (${group.length})`;
      listEl.appendChild(heading);
      group.forEach(appendMapItem);
    });

    const unsized = filtered.filter((m) => !SIZE_ORDER.includes(m.size));
    if (unsized.length > 0) {
      const heading = document.createElement("li");
      heading.className = "map-list-heading";
      heading.textContent = "Unsorted";
      listEl.appendChild(heading);
      unsized.forEach(appendMapItem);
    }

    if (selectedName && !filtered.some((m) => m.name === selectedName)) {
      selectedName = null;
      detailEl.innerHTML = '<p class="empty-hint">Select a map to see its layout.</p>';
    }
  }

  function simpleStatTile(label, value) {
    return `<div class="map-stat"><span class="map-stat-label">${escapeHtml(label)}</span><span class="map-stat-value">${escapeHtml(
      String(value)
    )}</span></div>`;
  }

  // Rooms carries more than one number (a per-floor breakdown, sometimes a
  // total and a "possible ghost rooms" count too), so it gets its own tile
  // layout instead of being squeezed into a single-line stat like the rest.
  function roomsStatTile(rooms) {
    if (!rooms) return "";
    const byFloorText = rooms.byFloor.map((f) => `${f.count} (${f.floor})`).join(", ");
    const total = rooms.total != null ? rooms.total : rooms.byFloor.reduce((sum, f) => sum + f.count, 0) || null;
    const extraParts = [];
    if (byFloorText && total != null) extraParts.push(`${total} total`);
    if (rooms.possibleGhostRooms != null) extraParts.push(`${rooms.possibleGhostRooms} possible ghost rooms`);
    const mainValue = byFloorText || (total != null ? `${total} total` : "Unknown");
    return `
      <div class="map-stat map-stat-rooms">
        <span class="map-stat-label">Rooms</span>
        <span class="map-stat-value">${escapeHtml(mainValue)}</span>
        ${extraParts.length > 0 ? `<span class="map-stat-extra">${escapeHtml(extraParts.join(" • "))}</span>` : ""}
      </div>`;
  }

  function renderStats(mapEntry) {
    const tiles = [
      simpleStatTile("Size", mapEntry.size ? SIZE_LABELS[mapEntry.size] || mapEntry.size : "Unknown"),
      mapEntry.floors ? simpleStatTile("Floors", mapEntry.floors) : "",
      roomsStatTile(mapEntry.rooms),
      mapEntry.exits ? simpleStatTile("Exits", mapEntry.exits) : "",
      mapEntry.faucets ? simpleStatTile("Faucets", mapEntry.faucets) : "",
      mapEntry.videoFeeds ? simpleStatTile("Video Feeds", mapEntry.videoFeeds) : "",
    ].join("");

    return `<div class="detail-section"><div class="map-stats-grid">${tiles}</div></div>`;
  }

  function renderLayoutTips(mapEntry) {
    if (!mapEntry.layoutTips || mapEntry.layoutTips.length === 0) return "";
    const items = mapEntry.layoutTips
      .map((tip) => {
        const subHtml =
          tip.subItems && tip.subItems.length > 0
            ? `<ul>${tip.subItems.map((s) => `<li>${escapeHtml(s)}</li>`).join("")}</ul>`
            : "";
        return `<li>${escapeHtml(tip.text)}${subHtml}</li>`;
      })
      .join("");
    return `
      <div class="detail-section">
        <span class="section-title">Layout Tips</span>
        <ul>${items}</ul>
      </div>`;
  }

  function renderHidingSpots(mapEntry) {
    const hs = mapEntry.hidingSpots;
    if (!hs) return "";

    const difficultyRows = (hs.difficultyTable || [])
      .map(
        (row) =>
          `<tr><td>${escapeHtml(row.difficulty)}</td><td>${
            row.open != null ? escapeHtml(String(row.open)) : "?"
          }</td></tr>`
      )
      .join("");
    const difficultyTableHtml = difficultyRows
      ? `<span class="detail-label">By Difficulty</span>
        <table class="hiding-spots-table">
          <thead><tr><th>Difficulty</th><th>Open Spots</th></tr></thead>
          <tbody>${difficultyRows}</tbody>
        </table>`
      : "";

    const sanctionedRows = (hs.sanctioned || [])
      .map(
        (s) =>
          `<tr><td>${escapeHtml(s.room || "—")}</td><td>${escapeHtml(s.description || "")}</td></tr>`
      )
      .join("");
    const sanctionedTableHtml = sanctionedRows
      ? `<span class="detail-label">Sanctioned Spots</span>
        <table class="hiding-spots-table">
          <thead><tr><th>Room</th><th>Description</th></tr></thead>
          <tbody>${sanctionedRows}</tbody>
        </table>`
      : "";

    const bonusRows = (hs.multiplayerBonus || [])
      .map(
        (b) =>
          `<tr><td>${escapeHtml(String(b.players))} Players</td><td>+${escapeHtml(String(b.bonus))}</td></tr>`
      )
      .join("");
    const bonusTableHtml = bonusRows
      ? `<span class="detail-label">Multiplayer Bonus</span>
        <table class="hiding-spots-table">
          <thead><tr><th>Players</th><th>Bonus Spots</th></tr></thead>
          <tbody>${bonusRows}</tbody>
        </table>`
      : "";

    return `
      <div class="detail-section">
        <span class="section-title">Hiding Spots</span>
        ${difficultyTableHtml}
        ${sanctionedTableHtml}
        ${bonusTableHtml}
        ${hs.notes ? `<p class="detail-notes">${escapeHtml(hs.notes)}</p>` : ""}
      </div>`;
  }

  function renderDiagrams(mapEntry) {
    if (!mapEntry.diagrams || mapEntry.diagrams.length === 0) return "";
    const activeIndex = Math.min(selectedDiagramIndex, mapEntry.diagrams.length - 1);
    const tabs = mapEntry.diagrams
      .map(
        (d, i) =>
          `<button type="button" class="map-diagram-tab${
            i === activeIndex ? " active" : ""
          }" data-diagram-index="${i}">${escapeHtml(d.label)}</button>`
      )
      .join("");
    const current = mapEntry.diagrams[activeIndex];
    return `
      <div class="detail-section">
        <span class="detail-label">Map Plans</span>
        <div class="map-diagram-tabs">${tabs}</div>
        <img class="map-diagram-image" src="${escapeHtml(current.imageUrl)}" alt="${escapeHtml(
      mapEntry.name
    )} — ${escapeHtml(current.label)} plan" loading="lazy">
      </div>`;
  }

  function renderCursedPossessions(mapEntry) {
    if (!mapEntry.cursedPossessions || mapEntry.cursedPossessions.length === 0) return "";
    const cards = mapEntry.cursedPossessions
      .map(
        (c) => `
        <figure class="cursed-possession-card">
          <img src="${escapeHtml(c.imageUrl)}" alt="${escapeHtml(c.description)}" loading="lazy">
          <figcaption>
            ${c.item ? `<strong>${escapeHtml(c.item)}</strong>` : ""}
            <span>${escapeHtml(c.description)}</span>
          </figcaption>
        </figure>`
      )
      .join("");
    return `
      <div class="detail-section">
        <span class="section-title">Cursed Possession Locations</span>
        <div class="cursed-possession-grid">${cards}</div>
      </div>`;
  }

  function renderDetail(mapEntry) {
    detailEl.innerHTML = `
      ${
        mapEntry.imageUrl
          ? `<img class="map-photo" src="${escapeHtml(mapEntry.imageUrl)}" alt="${escapeHtml(
              mapEntry.name
            )}" loading="lazy">`
          : ""
      }
      <h3>${escapeHtml(mapEntry.name)}</h3>
      ${renderStats(mapEntry)}
      ${renderDiagrams(mapEntry)}
      ${renderHidingSpots(mapEntry)}
      ${renderLayoutTips(mapEntry)}
      ${renderCursedPossessions(mapEntry)}
      ${
        mapEntry.verified === false
          ? `<p class="seed-data-note">⚠ Unverified seed data — run <code>npm run scrape:maps</code> to refresh from the wiki.</p>`
          : ""
      }
    `;
    detailEl.querySelectorAll("[data-diagram-index]").forEach((btn) => {
      btn.addEventListener("click", () => {
        selectedDiagramIndex = Number(btn.getAttribute("data-diagram-index"));
        renderDetail(mapEntry);
      });
    });
  }

  function init() {
    listEl = document.getElementById("map-list");
    detailEl = document.getElementById("map-detail");
    searchInputEl = document.getElementById("map-search");
    countEl = document.getElementById("map-count");

    renderList();

    searchInputEl.addEventListener("input", (e) => {
      searchText = e.target.value;
      renderList();
    });
  }

  return { init };
})();
