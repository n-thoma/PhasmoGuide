// App shell: tab navigation and module init.
(function () {
  function initTabs() {
    const tabBtns = document.querySelectorAll(".tab-btn");
    tabBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        const target = btn.dataset.tab;
        if (target !== "ghosts") window.PhasmoGhosts.stopAudio();

        tabBtns.forEach((b) => {
          b.classList.toggle("active", b === btn);
          b.setAttribute("aria-selected", b === btn ? "true" : "false");
        });

        document.querySelectorAll(".tab-panel").forEach((panel) => {
          panel.classList.toggle("active", panel.id === `tab-${target}`);
        });
      });
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    initTabs();
    window.PhasmoTheme.init();
    window.PhasmoGhosts.init();
    window.PhasmoMaps.init();
    window.PhasmoTimers.init();
    window.PhasmoFootsteps.init();
    window.PhasmoStrategies.init();
    window.PhasmoJerry.init();
  });
})();
