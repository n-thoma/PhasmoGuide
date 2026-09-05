// Strategies tab: pick a ghost, see what makes it stand out and how to
// identify it, condensed from the wiki's per-ghost Strategies sections.
window.PhasmoStrategies = (function () {
  const data = window.PHASMOGUIDE_STRATEGIES || { strategies: [] };

  let searchText = "";
  let selectedName = null;

  let listEl, detailEl, searchInputEl;

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function getFiltered() {
    return data.strategies.filter((s) => s.name.toLowerCase().includes(searchText.toLowerCase()));
  }

  function renderList() {
    const filtered = getFiltered();
    listEl.innerHTML = "";
    filtered.forEach((entry) => {
      const li = document.createElement("li");
      li.className = "strategy-list-item";
      if (entry.name === selectedName) li.classList.add("selected");
      li.textContent = entry.name;
      li.addEventListener("click", () => {
        selectedName = entry.name;
        renderList();
        renderDetail(entry);
      });
      listEl.appendChild(li);
    });

    if (selectedName && !filtered.some((s) => s.name === selectedName)) {
      selectedName = null;
      detailEl.innerHTML = '<p class="empty-hint">Select a ghost to see how to identify it.</p>';
    }
  }

  function renderDetail(entry) {
    const tipsHtml = entry.tips.map((t) => `<li>${escapeHtml(t)}</li>`).join("");
    detailEl.innerHTML = `
      <h3>${escapeHtml(entry.name)}</h3>
      <div class="detail-section">
        <span class="detail-label">What Stands Out</span>
        <p>${escapeHtml(entry.standOut)}</p>
      </div>
      <div class="detail-section">
        <span class="detail-label">How To Find It</span>
        <ul>${tipsHtml}</ul>
      </div>
    `;
  }

  function init() {
    listEl = document.getElementById("strategy-list");
    detailEl = document.getElementById("strategy-detail");
    searchInputEl = document.getElementById("strategy-search");

    renderList();

    searchInputEl.addEventListener("input", (e) => {
      searchText = e.target.value;
      renderList();
    });
  }

  return { init };
})();
