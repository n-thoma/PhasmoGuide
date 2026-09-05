// Seasonal/event theme switcher: swaps the CSS custom-property palette via a
// data-theme attribute on <body> (see styles.css) and remembers the choice.
//
// The stored preference is either "auto" (resolve from today's date every
// launch) or an explicit theme name chosen via the buttons, which pins that
// theme regardless of date until the user picks "Auto" again.
window.PhasmoTheme = (function () {
  const STORAGE_KEY = "phasmoguide-theme";
  const EXPLICIT_THEMES = ["default", "easter", "halloween", "christmas"];
  const MS_PER_DAY = 86400000;

  function stripTime(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  }

  // Anonymous Gregorian algorithm (Meeus/Jones/Butcher) for Easter Sunday.
  function computeEasterSunday(year) {
    const a = year % 19;
    const b = Math.floor(year / 100);
    const c = year % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31); // 3 = March, 4 = April
    const day = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(year, month - 1, day);
  }

  // Halloween: Oct 1 – Nov 2. Christmas: Dec 1 – Jan 6 (Twelfth Night).
  // Easter: 2 weeks before Easter Sunday through the week after it, since
  // the date itself moves every year with the lunar calendar.
  function getSeasonalTheme(date) {
    const month = date.getMonth() + 1;
    const day = date.getDate();

    if (month === 10 || (month === 11 && day <= 2)) return "halloween";
    if (month === 12 || (month === 1 && day <= 6)) return "christmas";

    const easter = computeEasterSunday(date.getFullYear());
    const diffDays = Math.round((stripTime(date) - stripTime(easter)) / MS_PER_DAY);
    if (diffDays >= -14 && diffDays <= 7) return "easter";

    return "default";
  }

  function resolveTheme(preference) {
    return preference === "auto" ? getSeasonalTheme(new Date()) : preference;
  }

  function apply(preference) {
    const resolved = resolveTheme(preference);
    if (resolved === "default") {
      delete document.body.dataset.theme;
    } else {
      document.body.dataset.theme = resolved;
    }
    document.querySelectorAll(".theme-btn").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.themeChoice === preference);
    });
  }

  function init() {
    let saved = "auto";
    try {
      saved = localStorage.getItem(STORAGE_KEY) || "auto";
    } catch (err) {
      // localStorage unavailable (e.g. disabled storage) — fall back to auto.
    }
    if (saved !== "auto" && !EXPLICIT_THEMES.includes(saved)) saved = "auto";
    apply(saved);

    document.querySelectorAll(".theme-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const preference = btn.dataset.themeChoice;
        apply(preference);
        try {
          localStorage.setItem(STORAGE_KEY, preference);
        } catch (err) {
          // Ignore — theme still applies for the rest of this session.
        }
      });
    });

    // Hidden dev shortcut: the theme buttons stay in the DOM for testing but
    // are display:none (see styles.css) unless this reveals them. Not
    // persisted — every launch starts with them hidden again.
    document.addEventListener("keydown", (e) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "t") {
        e.preventDefault();
        document.body.classList.toggle("theme-debug");
      }
    });
  }

  return { init };
})();
