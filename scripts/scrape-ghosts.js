#!/usr/bin/env node
/*
 * Scrapes ghost data from the Phasmophobia Fandom wiki and writes
 * app/data/ghosts-data.js in the shape the app expects.
 *
 * Usage:
 *   node scripts/scrape-ghosts.js            # full scrape
 *   node scripts/scrape-ghosts.js --dry-run  # fetch + parse one ghost only,
 *                                             # dump its raw infobox for
 *                                             # inspection/selector tuning
 *
 * Selectors verified against the live wiki (2026-09-02):
 *  - Evidence comes from the <table class="article-table"> under the
 *    "Evidence" heading, not the infobox (the infobox's Evidence1/2/3
 *    fields only carry an icon with an inconsistent alt/title, e.g.
 *    "D.O.T.S. Projector (Evidence)" instead of the plain evidence name).
 *  - Strengths/weaknesses come from the infobox's [data-source="strength"]
 *    and [data-source="weakness(es)"] blocks. When a ghost has only one
 *    entry, the wiki renders it as plain text instead of a <ul><li> list,
 *    so both shapes must be handled.
 *  - There is no structured speed/sanity field anywhere on these pages.
 *    Per the wiki's Hunt page, "Most ghosts move at a base speed of
 *    1.7 m/s" and hunt sanity is "the standard 50%" unless a ghost's own
 *    page states otherwise in prose (e.g. Demon: "a normal hunt sanity
 *    threshold of 70%"), so those are used as defaults and overridden
 *    only when a ghost's page gives an explicit number.
 *  - Speed and hunt sanity threshold share the same object shape
 *    ({type, base/min/max/values, notes}) and the same escape hatch:
 *    ghosts with a multi-state or conditional value (not reducible to one
 *    regex-extracted number) are hand-verified in SPEED_OVERRIDES /
 *    HUNT_SANITY_OVERRIDES below instead of parsed from prose.
 */

const fs = require("fs");
const path = require("path");
const cheerio = require("cheerio");

const BASE_URL = "https://phasmophobia.fandom.com";
const CATEGORY_URL = `${BASE_URL}/wiki/Category:Ghosts`;
const OUTPUT_FILE = path.join(__dirname, "..", "app", "data", "ghosts-data.js");
const REQUEST_DELAY_MS = 500;

const STANDARD_BASE_SPEED = 1.7;
const STANDARD_HUNT_SANITY_THRESHOLD = 50;

// Ghosts whose real hunt speed is a continuous range or a set of distinct
// fixed values, not one flat base speed. The wiki has no structured field
// for this (see extractSpeed below), and reliably distinguishing "range"
// from "multiple discrete values" from freeform prose isn't feasible to
// automate, so these are hand-verified against each ghost's own wiki page
// (2026-09-02) — recheck there if numbers seem off after a game update.
// `type` drives rendering: "range" shows min-max, "multiple" lists each
// value with its label, "fixed" shows a single base speed.
const SPEED_OVERRIDES = {
  Aswang: {
    type: "fixed",
    base: 1.53,
    notes:
      "Line-of-sight acceleration is faster than normal (0.075x/s instead of 0.05x/s), reaching its max of 2.53 m/s after 8.67s instead of 13s.",
  },
  Deildegast: {
    type: "range",
    min: 0.4,
    max: 3.0,
    notes:
      "Starts at 3.0 m/s and drops 0.1 m/s per moved/interacted object down to a 0.4 m/s floor; resets to 3.0 m/s after a hunt ends or a crucifix burns out.",
  },
  Deogen: {
    type: "range",
    min: 0.4,
    max: 3.0,
    notes:
      "Speed is set by pathfinding distance to its target, not line-of-sight: 3 m/s beyond 6m, scaling down to a 0.4 m/s floor as it closes in. Gets no line-of-sight speed boost.",
  },
  Hantu: {
    type: "range",
    min: 1.4,
    max: 2.7,
    notes:
      "Speed depends on the room's temperature during a hunt: 1.4 m/s above 15°C (59°F), rising in steps to 2.7 m/s below 0°C (32°F). Has no line-of-sight acceleration.",
  },
  Moroi: {
    type: "range",
    min: 1.5,
    max: 2.25,
    notes:
      "Speed rises in steps as average sanity drops below its 50% hunt threshold, from 1.5 m/s at 45%+ sanity up to 2.25 m/s at 0-5% sanity.",
  },
  Thaye: {
    type: "range",
    min: 1,
    max: 2.75,
    notes:
      "Hunt speed starts at 2.75 m/s and drops ~0.175 m/s per \"age\" gained (it ages roughly every 1-2 minutes while a player stays nearby), bottoming out at a 1 m/s floor by age 10+. Does not get a line-of-sight speed boost.",
  },
  Dayan: {
    type: "multiple",
    values: [
      { value: 1.2, label: "nearest player standing still within 10m" },
      { value: 1.7, label: "no player within 10m (standard)" },
      { value: 2.25, label: "nearest player walking within 10m" },
    ],
    notes: "Speed locks to whichever value applies based on the closest player's movement state within 10m.",
  },
  Gallu: {
    type: "multiple",
    values: [
      { value: 1.36, label: "weakened state" },
      { value: 1.7, label: "standard state" },
      { value: 1.955, label: "enraged state" },
    ],
    notes: "Switches to its enraged (faster) state after protective equipment is used against it, and to its weakened (slower) state after a hunt.",
  },
  Jinn: {
    type: "multiple",
    values: [
      { value: 1.7, label: "standard" },
      { value: 2.5, label: "fixed boost (fuse box on, target >3m away and in LoS)" },
    ],
    notes: "Speed locks to 2.5 m/s while its boost conditions hold; any line-of-sight acceleration earned meanwhile applies once the boost ends.",
  },
  Obambo: {
    type: "multiple",
    values: [
      { value: 1.445, label: "calm state" },
      { value: 1.955, label: "aggressive state" },
    ],
    notes: "Aggressive-state hunts are faster but 20% shorter; calm-state hunts are slower but last the normal duration.",
  },
  Raiju: {
    type: "multiple",
    values: [
      { value: 1.7, label: "standard" },
      { value: 2.5, label: "fixed boost (near active electronics)" },
    ],
    notes: "Also raises its hunt sanity threshold to 65% while boosted.",
  },
  Revenant: {
    type: "multiple",
    values: [
      { value: 1, label: "roaming (no player detected)" },
      { value: 3, label: "chasing a detected player" },
    ],
    notes: "Decelerates back to 1 m/s over about 2.7 seconds after losing track of a player.",
  },
  "The Twins": {
    type: "multiple",
    values: [
      { value: 1.5, label: "slow twin" },
      { value: 1.9, label: "fast twin" },
    ],
    notes: "Whichever twin is currently hunting keeps its own fixed base speed and still gets line-of-sight acceleration on top of it.",
  },
  "The Mimic": {
    type: "fixed",
    base: 1.7,
    notes: "Copies the hunt movement speed of whichever ghost type it's currently imitating, so its actual speed varies contract to contract.",
  },
  Kormos: {
    type: "fixed",
    base: 1.7,
    notes:
      "Multiplies its current speed by 1.3x when moving to a detection waypoint without line-of-sight, which combined with line-of-sight acceleration can reach a 3.65 m/s top speed.",
  },
};

// Same rationale as SPEED_OVERRIDES: the wiki has no structured hunt-sanity
// field, and ghosts with a real multi-state threshold (or a bypass ability)
// can't be reduced to a single regex-extracted number, so these are
// hand-verified against each ghost's own wiki page (2026-09-04) — recheck
// there if numbers seem off after a game update. `type` mirrors speed's:
// "multiple" lists each threshold with its condition, "fixed" is one number.
const HUNT_SANITY_OVERRIDES = {
  Demon: {
    type: "fixed",
    base: 70,
    notes: "Has a rare chance to trigger an ability-driven hunt at any sanity percentage, bypassing the threshold entirely.",
  },
  Deogen: {
    type: "fixed",
    base: 40,
    notes: "",
  },
  Kormos: {
    type: "multiple",
    values: [
      { value: 50, label: "standard" },
      { value: 70, label: "a player is sprinting in its current room" },
    ],
    notes: "The boosted threshold only applies outside of hunts.",
  },
  Mare: {
    type: "multiple",
    values: [
      { value: 60, label: "room lights off" },
      { value: 40, label: "room lights on" },
    ],
    notes: "Below 40% average sanity, the Mare can hunt regardless of whether the lights are on.",
  },
  Obambo: {
    type: "multiple",
    values: [
      { value: 10, label: "calm state" },
      { value: 65, label: "aggressive state" },
    ],
    notes: "There's a wide 10-65% sanity band where it can only hunt while in its aggressive state.",
  },
  Onryo: {
    type: "fixed",
    base: 60,
    notes: "Can trigger an ability-driven hunt at any sanity once its flame-blowout counter reaches 3, bypassing the threshold.",
  },
  Raiju: {
    type: "multiple",
    values: [
      { value: 50, label: "standard" },
      { value: 65, label: "boosted (near active electronics)" },
    ],
    notes: "The boosted threshold applies under the same active-electronics condition that boosts its speed.",
  },
  Shade: {
    type: "fixed",
    base: 35,
    notes: "",
  },
  "The Mimic": {
    type: "fixed",
    base: 50,
    notes: "Copies the hunt sanity threshold of whichever ghost type it's currently imitating, so its actual threshold varies contract to contract.",
  },
  Yokai: {
    type: "multiple",
    values: [
      { value: 50, label: "standard" },
      { value: 80, label: "a player is using voice chat in its current room" },
    ],
    notes: "Only the threshold rises when talked near — it doesn't hunt more aggressively otherwise, so talking has no effect once average sanity is already below 50%.",
  },
};

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchHtml(url) {
  const res = await fetch(url, {
    headers: { "User-Agent": "PhasmoGuide-Scraper/0.1 (personal fan project)" },
  });
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  return res.text();
}

// Category:Ghosts also catches stray non-ghost articles (mechanic pages
// like "Ghost Model", user blog posts). Every real ghost article carries
// an authoritative navbox at the bottom ("Ghosts: Aswang • Banshee • ..."),
// so fetch one candidate page and use that navbox as the definitive list
// instead of trusting raw category membership.
async function getGhostLinks() {
  const categoryHtml = await fetchHtml(CATEGORY_URL);
  const $category = cheerio.load(categoryHtml);
  const candidates = [];
  $category(".category-page__member-link").each((_, el) => {
    const href = $category(el).attr("href");
    const name = $category(el).text().trim();
    if (href && name && !href.includes(":")) candidates.push({ name, url: `${BASE_URL}${href}` });
  });
  if (candidates.length === 0) return [];

  const sampleHtml = await fetchHtml(candidates[0].url);
  const $sample = cheerio.load(sampleHtml);
  const navboxHeader = $sample('th.color1 a[title="Ghost"]').first();
  const navboxRow = navboxHeader.closest("table").find("tr").eq(1);
  const links = [];
  navboxRow.find("a[href^='/wiki/']").each((_, el) => {
    const href = $sample(el).attr("href");
    const name = $sample(el).text().trim();
    if (href && name) links.push({ name, url: `${BASE_URL}${href}` });
  });
  // The navbox renders the current page's own entry as plain text
  // (.mw-selflink), not a link, since MediaWiki never self-links — add it
  // back using the URL we already fetched it from.
  const selfLink = navboxRow.find(".mw-selflink").first();
  if (selfLink.length > 0 && selfLink.text().trim()) {
    links.push({ name: selfLink.text().trim(), url: candidates[0].url });
  }
  return links.length > 0 ? links : candidates;
}

function parseInfobox($) {
  const raw = {};
  $("aside.portable-infobox .pi-item[data-source]").each((_, el) => {
    const key = $(el).attr("data-source");
    const text = $(el).text().replace(/\s+/g, " ").trim();
    raw[key] = text;
  });
  return raw;
}

// The infobox's main portrait (e.g. "Moroi Discovered.jpg") — same image
// shown in the Journal once a ghost is identified in-game.
function extractImageUrl($) {
  const img = $("aside.portable-infobox .pi-image-thumbnail").first();
  const src = img.attr("src");
  return src || null;
}

// Strength/weakness infobox blocks render as a <ul><li> list when there are
// multiple entries, but as plain text directly in .pi-data-value when there
// is only one. Handle both.
function extractListOrText($, dataSource) {
  const container = $(`aside.portable-infobox [data-source="${dataSource}"]`).first();
  if (container.length === 0) return [];
  const valueEl = container.find(".pi-data-value").first();
  if (valueEl.length === 0) return [];
  const items = valueEl.find("li");
  if (items.length > 0) {
    return items.map((_, li) => $(li).text().replace(/\s+/g, " ").trim()).get();
  }
  const text = valueEl.text().replace(/\s+/g, " ").trim();
  return text ? [text] : [];
}

// The infobox's Evidence1/2/3 fields only carry an icon (empty/inconsistent
// alt text). The clean evidence names live in the <table class="article-table">
// under the "Evidence" heading instead. Some pages have a second, unrelated
// article-table earlier on the page (e.g. a hunt-stats table), so anchor on
// the "Evidence" heading itself rather than taking the first table on the page.
function extractEvidences($) {
  const marker = $("#Evidence").first();
  if (marker.length === 0) return [];
  const heading = marker.closest("h2, h3");
  if (heading.length === 0) return [];
  const table = heading.nextUntil("h2, h3").find("table.article-table").first();
  if (table.length === 0) return [];
  return table
    .find("td")
    .map((_, td) => $(td).text().replace(/\s+/g, " ").trim())
    .get()
    .filter(Boolean);
}

function extractSpeed($, bodyText) {
  const sentences = [];
  $(".mw-parser-output > p").each((_, p) => {
    const text = $(p).text().replace(/\s+/g, " ").trim();
    if (!text) return;
    text.split(/(?<=\.)\s+/).forEach((sentence) => {
      if (/\bm\/s\b/.test(sentence)) sentences.push(sentence.trim());
    });
  });
  const notes = sentences.join(" ");

  const baseMatch = bodyText.match(/base speed of ([\d.]+)\s*m\/s/i);
  if (baseMatch) return { type: "fixed", base: Number(baseMatch[1]), min: null, max: null, values: null, notes };

  // No "base speed of X" sentence: either a standard-speed ghost (no m/s
  // mentioned at all) or one with conditional/fixed speed mechanics too
  // varied to reduce to a single number — leave base unset and rely on notes.
  // (Ghosts with a real range/multiple-value mechanic are hand-verified in
  // SPEED_OVERRIDES above and applied afterward in normalizeGhost.)
  if (sentences.length === 0) return { type: "fixed", base: STANDARD_BASE_SPEED, min: null, max: null, values: null, notes: "" };
  return { type: "fixed", base: null, min: null, max: null, values: null, notes };
}

function extractHuntSanity(bodyText) {
  const match = bodyText.match(/sanity threshold (?:of|is) (\d{1,3})\s*%/i);
  const base = match ? Number(match[1]) : STANDARD_HUNT_SANITY_THRESHOLD;
  return { type: "fixed", base, min: null, max: null, values: null, notes: "" };
}

function resolveSpeed(name, $, bodyText) {
  const override = SPEED_OVERRIDES[name];
  if (!override) return extractSpeed($, bodyText);
  return { type: "fixed", base: null, min: null, max: null, values: null, notes: "", ...override };
}

function resolveHuntSanity(name, bodyText) {
  const override = HUNT_SANITY_OVERRIDES[name];
  if (!override) return extractHuntSanity(bodyText);
  return { type: "fixed", base: null, min: null, max: null, values: null, notes: "", ...override };
}

function normalizeGhost(name, url, $) {
  const bodyText = $(".mw-parser-output").text().replace(/\s+/g, " ");
  const evidences = extractEvidences($);
  return {
    name,
    verified: evidences.length === 3,
    evidences,
    speed: resolveSpeed(name, $, bodyText),
    huntSanity: resolveHuntSanity(name, bodyText),
    strengths: extractListOrText($, "strength"),
    weaknesses: extractListOrText($, "weakness(es)"),
    abilityNotes: "",
    imageUrl: extractImageUrl($),
    wikiUrl: url,
  };
}

async function scrapeGhost(name, url) {
  const html = await fetchHtml(url);
  const $ = cheerio.load(html);
  return normalizeGhost(name, url, $);
}

function writeOutput(ghosts) {
  const evidenceTypes = Array.from(new Set(ghosts.flatMap((g) => g.evidences))).sort();
  const payload = {
    dataStatus: `Scraped from ${CATEGORY_URL} on ${new Date().toISOString().slice(0, 10)}. Review any ghost with "verified": false — its evidence table didn't parse as expected.`,
    evidenceTypes,
    ghosts,
  };
  const contents = `// Generated by scripts/scrape-ghosts.js — do not hand-edit; re-run the scraper instead.\nwindow.PHASMOGUIDE_DATA = ${JSON.stringify(payload, null, 2)};\n`;
  fs.writeFileSync(OUTPUT_FILE, contents, "utf8");
  console.log(`Wrote ${ghosts.length} ghosts to ${OUTPUT_FILE}`);
  const unverified = ghosts.filter((g) => !g.verified).map((g) => g.name);
  if (unverified.length > 0) {
    console.log(`Unverified (evidence table didn't parse cleanly): ${unverified.join(", ")}`);
  }
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const links = await getGhostLinks();
  console.log(`Found ${links.length} ghost pages.`);

  if (dryRun) {
    const first = links[0];
    if (!first) {
      console.error("No ghost links found — check CATEGORY_URL / .category-page__member-link selector.");
      return;
    }
    console.log(`Dry run: fetching ${first.name} (${first.url})`);
    const html = await fetchHtml(first.url);
    const $ = cheerio.load(html);
    console.log("Raw infobox fields:", parseInfobox($));
    console.log("Evidences:", extractEvidences($));
    console.log("Strengths:", extractListOrText($, "strength"));
    console.log("Weaknesses:", extractListOrText($, "weakness(es)"));
    console.log("Normalized:", normalizeGhost(first.name, first.url, $));
    return;
  }

  const ghosts = [];
  for (const { name, url } of links) {
    try {
      console.log(`Scraping ${name}...`);
      ghosts.push(await scrapeGhost(name, url));
    } catch (err) {
      console.error(`Failed to scrape ${name}: ${err.message}`);
    }
    await sleep(REQUEST_DELAY_MS);
  }

  writeOutput(ghosts);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
