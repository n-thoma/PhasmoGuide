#!/usr/bin/env node
/*
 * Scrapes map data from the Phasmophobia Fandom wiki and writes
 * app/data/maps-data.js in the shape the app expects.
 *
 * Usage:
 *   node scripts/scrape-maps.js                          # scrape every known map
 *   node scripts/scrape-maps.js --only "6 Tanglewood Drive"  # scrape just one
 *                                                             # (repeatable)
 *   node scripts/scrape-maps.js --dry-run                 # fetch + parse one
 *                                                          # map, dump its raw
 *                                                          # infobox for
 *                                                          # inspection
 *
 * Maps already in app/data/maps-data.js that aren't part of this run are left
 * untouched — the output is a merge by name, not a full overwrite — so maps
 * can be added a few at a time (e.g. verifying one before doing the rest).
 *
 * Selectors verified against the live wiki (2026-09-04):
 *  - Map size, floors, rooms, exits, faucets, and video feeds all come from
 *    the infobox's .pi-data-value per data-source key. (Discoverable Keys
 *    is deliberately not scraped — not something this app needs.)
 *  - The main photo and the three "Map Plans" diagrams (Rooms / Sanity /
 *    Temperatures tabs) live in the infobox too — the tabs are a
 *    wds-tabber widget, so diagrams are read from its tab labels + panels
 *    rather than assumed to always be exactly those three (a map missing a
 *    tab, or with an extra one, is handled the same way).
 *  - Cursed Possession locations come from the <img alt="..."> captions
 *    under the "Cursed Possession locations" heading in the article body,
 *    e.g. "The Haunted Mirror spawns on the wall next to the Master
 *    Bedroom door in the Foyer." The possession's name is picked out of
 *    that caption by matching against the known cursed-possession list
 *    below (there's no structured field for this on the wiki).
 *  - Layout tips is a plain <ul> under that heading.
 *  - Hiding spots come from "Key hiding spots and strategies": a paragraph
 *    naming N "sanctioned" spots followed by their <ul> (each item's <b>
 *    is the room name, the rest of the text is where in that room),
 *    then a paragraph on difficulty followed by a <ul> whose bolded items
 *    are "<Difficulty>: <count blocked>" (unbolded items are multiplayer
 *    notes, not difficulty rows — see extractHidingSpots). "Open" counts
 *    are computed here (total sanctioned minus blocked), since the wiki
 *    only states how many get blocked per difficulty.
 */

const fs = require("fs");
const path = require("path");
const cheerio = require("cheerio");

const BASE_URL = "https://phasmophobia.fandom.com";
const OUTPUT_FILE = path.join(__dirname, "..", "app", "data", "maps-data.js");
const REQUEST_DELAY_MS = 500;

// Real map articles under https://phasmophobia.fandom.com/wiki/Category:Maps
// — that category also lists non-map pages (Lobby, the generic "Map"
// mechanics page, and the Small/Medium/Large/Features subcategories
// themselves), which are deliberately excluded here.
const ALL_MAPS = [
  "6 Tanglewood Drive",
  "10 Ridgeview Court",
  "13 Willow Street",
  "42 Edgefield Road",
  "Asylum",
  "Bleasdale Farmhouse",
  "Brownstone High School",
  "Camp Woodwind",
  "Grafton Farmhouse",
  "Maple Lodge Campsite",
  "Nell's Diner",
  "Point Hope",
  "Prison",
  "Sunny Meadows Mental Institution",
];

// No structured field identifies which cursed possession a Cursed
// Possession locations image is showing — matched against its <img alt>
// caption instead (see file header).
const CURSED_POSSESSIONS = [
  "Ouija Board",
  "Summoning Circle",
  "Monkey Paw",
  "Music Box",
  "Tarot Cards",
  "Voodoo Doll",
  "Haunted Mirror",
];

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

function extractInfoboxField($, key) {
  return $(`aside.portable-infobox .pi-item[data-source="${key}"] .pi-data-value`)
    .first()
    .text()
    .replace(/\s+/g, " ")
    .trim();
}

function extractMainImage($) {
  return $('aside.portable-infobox figure.pi-image[data-source="img"] a.image').attr("href") || null;
}

// The Rooms field has at least four different shapes across map pages, with
// no separator between the loose text and a nested <ul> that sometimes
// follows it (reading .text() on the whole field runs them together, e.g.
// "30 (2F)64 (Total)"):
//   - plain text only, one "<count> (<floor>)" pair per floor (Tanglewood)
//   - plain text floors + a nested <ul> of "<count> (Total)" /
//     "<count> (Possible ghost rooms)" (Brownstone, Prison, Asylum)
//   - plain text is just a bare number, no floors at all (Camp Woodwind)
//   - plain text is "<count> (Total)" and the nested <ul> holds the
//     per-floor breakdown instead, as "<floor>: <count>" (Sunny Meadows)
// Rather than assume which part holds what, every "<count> (<label>)" and
// "<label>: <count>" pair found anywhere in the field is collected first,
// then classified by its label (Total / Possible ghost rooms / otherwise a
// floor) — so it doesn't matter which shape a given map happens to use.
function extractRooms($) {
  const container = $('aside.portable-infobox .pi-item[data-source="rooms"] .pi-data-value').first();
  if (container.length === 0) return null;

  const pairs = [];
  const parenPattern = /(\d+)\s*\(([^)]+)\)/g;

  function addParenPairs(text) {
    let match;
    let found = false;
    while ((match = parenPattern.exec(text))) {
      found = true;
      pairs.push({ count: Number(match[1]), label: match[2].trim() });
    }
    parenPattern.lastIndex = 0;
    return found;
  }

  container
    .children("ul")
    .children("li")
    .each((_, li) => {
      const text = $(li).text().replace(/\s+/g, " ").trim();
      if (addParenPairs(text)) return;
      const colonMatch = text.match(/^(.+?):\s*(\d+)$/);
      if (colonMatch) pairs.push({ count: Number(colonMatch[2]), label: colonMatch[1].trim() });
    });

  const $textOnly = container.clone();
  $textOnly.children("ul").remove();
  const floorText = $textOnly.text().replace(/\s+/g, " ").trim();
  const foundParens = addParenPairs(floorText);
  if (!foundParens && /^\d+$/.test(floorText)) {
    pairs.push({ count: Number(floorText), label: "Total" });
  }

  if (pairs.length === 0) return null;

  let total = null;
  let possibleGhostRooms = null;
  const byFloor = [];
  pairs.forEach(({ count, label }) => {
    const norm = label.toLowerCase();
    if (norm === "total") total = count;
    else if (norm.includes("possible ghost room")) possibleGhostRooms = count;
    else byFloor.push({ count, floor: label });
  });

  return { byFloor, total, possibleGhostRooms };
}

// The infobox's "Map Plans" widget is a wds-tabber — read whatever tabs it
// actually has rather than assuming Rooms/Sanity/Temperatures every time.
function extractDiagrams($) {
  const tabber = $("aside.portable-infobox .wds-tabber").first();
  if (tabber.length === 0) return [];
  const labels = tabber
    .find(".wds-tabs__tab-label")
    .map((_, el) => $(el).text().trim())
    .get();
  const diagrams = [];
  tabber.find(".wds-tab__content").each((i, panel) => {
    const href = $(panel).find("a.image").attr("href");
    if (href) diagrams.push({ label: labels[i] || `Plan ${i + 1}`, imageUrl: href });
  });
  return diagrams;
}

// Thumbnail <img src> looks like ".../revision/latest/scale-to-width-down/185?cb=..."
// — dropping the crop segment gives the original full-resolution file.
function toFullRes(src) {
  return src.replace(/\/revision\/latest\/scale-to-width-down\/\d+/, "/revision/latest");
}

// The wiki isn't consistent about heading capitalization between map pages
// (e.g. "Cursed_Possession_locations" on some, "Cursed_possession_locations"
// on others), so headings are matched by a case-insensitive id pattern
// instead of an exact #id selector. .first() picks the article's own
// heading over any same-named one nested in an embedded "Restricted"
// sub-map section further down the page (e.g. Brownstone High School).
function findHeading($, idPattern) {
  const span = $(".mw-headline")
    .filter((_, el) => idPattern.test($(el).attr("id") || ""))
    .first();
  return span.closest("h2, h3");
}

function extractCursedPossessions($) {
  const heading = findHeading($, /^cursed_possession_locations$/i);
  if (heading.length === 0) return [];
  const scope = heading.nextUntil("h2");
  const results = [];
  scope.find("img").each((_, el) => {
    const src = $(el).attr("data-src") || $(el).attr("src");
    if (!src || src.startsWith("data:")) return;
    const alt = ($(el).attr("alt") || "").trim();
    const item = CURSED_POSSESSIONS.find((name) => alt.includes(name)) || null;
    results.push({ item, description: alt, imageUrl: toFullRes(src) });
  });
  return results;
}

// "Layout tips" is a <ul> of freeform notes about how rooms are
// grouped/counted on this map (e.g. which nooks count as their own room).
// Some tips have a nested <ul> of their own (e.g. listing which rooms allow
// a short roam) — walking only *direct* <li> children keeps those out of
// the top-level array, and stripping the nested <ul> before reading a
// tip's own text keeps its sub-items from bleeding into that text.
function extractLayoutTips($) {
  const heading = findHeading($, /^layout_tips$/i);
  if (heading.length === 0) return [];
  const ul = heading.nextUntil("h2, h3").filter("ul").first();
  if (ul.length === 0) return [];
  return ul
    .children("li")
    .map((_, li) => {
      const $li = $(li);
      const nestedItems = $li
        .children("ul")
        .children("li")
        .map((_, sub) => $(sub).text().replace(/\s+/g, " ").trim())
        .get();
      const $textOnly = $li.clone();
      $textOnly.children("ul").remove();
      const text = $textOnly.text().replace(/\s+/g, " ").trim();
      return { text, subItems: nestedItems };
    })
    .get();
}

// "Key hiding spots and strategies" follows a consistent shape across map
// pages: a paragraph naming N "sanctioned" hiding spots followed by their
// <ul>, then a paragraph on difficulty followed by a <ul> whose bolded
// items are "<Difficulty>: <count blocked>" and whose unbolded items are
// either a multiplayer bonus ("3-player game: +1 available hiding spot")
// or a freeform note — the presence of a <b> distinguishes difficulty rows
// from the rest, and a "<N>-player game: +<N>" pattern distinguishes a
// multiplayer bonus row from a plain note.
function extractHidingSpots($) {
  const heading = findHeading($, /^key_hiding_spots_and_strategies$/i);
  if (heading.length === 0) return null;
  const scope = heading.nextUntil("h2");

  let sanctioned = [];
  const blockedByDifficulty = [];
  const multiplayerBonus = [];
  const notes = [];

  scope.filter("p").each((_, p) => {
    const text = $(p).text();
    if (/sanctioned/i.test(text)) {
      sanctioned = $(p)
        .next("ul")
        .find("li")
        .map((_, li) => {
          const $li = $(li);
          const bold = $li.find("b").first();
          if (bold.length === 0) return { room: null, description: $li.text().replace(/\s+/g, " ").trim() };
          const room = bold.text().trim();
          const description = $li
            .text()
            .slice(bold.text().length)
            .replace(/^,?\s*/, "")
            .replace(/\s+/g, " ")
            .trim();
          return { room, description };
        })
        .get();
    }
    if (/difficulty/i.test(text) && /filled|sealed|blocked|prevent/i.test(text)) {
      $(p)
        .next("ul")
        .find("li")
        .each((_, li) => {
          const $li = $(li);
          const bold = $li.find("b").first();
          if (bold.length > 0) {
            const difficulty = bold.text().replace(/:\s*$/, "").trim();
            const rest = $li
              .text()
              .slice(bold.text().length)
              .replace(/^:?\s*/, "")
              .trim();
            const blocked = /none/i.test(rest) ? 0 : parseInt(rest, 10);
            if (!Number.isNaN(blocked)) blockedByDifficulty.push({ difficulty, blocked });
          } else {
            const liText = $li.text().replace(/\s+/g, " ").trim();
            const bonusMatch = liText.match(/^(\d+)-player game:\s*\+(\d+)/i);
            if (bonusMatch) {
              multiplayerBonus.push({ players: Number(bonusMatch[1]), bonus: Number(bonusMatch[2]) });
            } else {
              notes.push(liText);
            }
          }
        });
    }
  });

  scope.find("small").each((_, el) => {
    const text = $(el).text().replace(/\s+/g, " ").trim();
    if (text) notes.push(text);
  });

  if (sanctioned.length === 0 && blockedByDifficulty.length === 0) return null;

  const total = sanctioned.length;
  const difficultyTable = blockedByDifficulty.map((row) => ({
    difficulty: row.difficulty,
    open: total > 0 ? total - row.blocked : null,
  }));

  const joinedNotes = notes.map((n) => n.replace(/\.?$/, ".")).join(" ");
  return { sanctioned, difficultyTable, multiplayerBonus, notes: joinedNotes };
}

function normalizeMap(name, url, $) {
  const sizeRaw = extractInfoboxField($, "mapsize").toLowerCase();
  const size = ["small", "medium", "large"].includes(sizeRaw) ? sizeRaw : null;
  const diagrams = extractDiagrams($);
  const cursedPossessions = extractCursedPossessions($);
  return {
    name,
    verified: size !== null && diagrams.length > 0,
    size,
    imageUrl: extractMainImage($),
    floors: extractInfoboxField($, "floors") || null,
    rooms: extractRooms($),
    exits: extractInfoboxField($, "exits") || null,
    faucets: extractInfoboxField($, "faucets") || null,
    videoFeeds: extractInfoboxField($, "videofeeds") || null,
    diagrams,
    cursedPossessions,
    layoutTips: extractLayoutTips($),
    hidingSpots: extractHidingSpots($),
    wikiUrl: url,
  };
}

async function scrapeMap(name) {
  const url = `${BASE_URL}/wiki/${encodeURIComponent(name.replace(/ /g, "_"))}`;
  const html = await fetchHtml(url);
  const $ = cheerio.load(html);
  return normalizeMap(name, url, $);
}

function loadExisting() {
  if (!fs.existsSync(OUTPUT_FILE)) return [];
  const text = fs.readFileSync(OUTPUT_FILE, "utf8");
  const jsonStart = text.indexOf("{");
  if (jsonStart === -1) return [];
  try {
    const data = JSON.parse(text.slice(jsonStart, text.lastIndexOf("};") + 1));
    return Array.isArray(data.maps) ? data.maps : [];
  } catch {
    return [];
  }
}

function writeOutput(maps) {
  const byName = new Map(maps.map((m) => [m.name, m]));
  const sorted = ALL_MAPS.filter((name) => byName.has(name)).map((name) => byName.get(name));
  // Keep any scraped map not (yet) in ALL_MAPS rather than silently dropping it.
  ALL_MAPS.forEach((name) => byName.delete(name));
  const extras = [...byName.values()];

  const payload = {
    dataStatus: `Scraped from ${BASE_URL}/wiki/Category:Maps on ${new Date().toISOString().slice(0, 10)}. Review any map with "verified": false — its size or map-plan diagrams didn't parse as expected.`,
    maps: [...sorted, ...extras],
  };
  const contents = `// Generated by scripts/scrape-maps.js — do not hand-edit; re-run the scraper instead.\nwindow.PHASMOGUIDE_MAPS = ${JSON.stringify(payload, null, 2)};\n`;
  fs.writeFileSync(OUTPUT_FILE, contents, "utf8");
  console.log(`Wrote ${payload.maps.length} maps to ${OUTPUT_FILE}`);
  const unverified = payload.maps.filter((m) => !m.verified).map((m) => m.name);
  if (unverified.length > 0) {
    console.log(`Unverified (size or diagrams didn't parse cleanly): ${unverified.join(", ")}`);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const onlyNames = args.flatMap((a, i) => (a === "--only" ? [args[i + 1]] : [])).filter(Boolean);
  const targets = onlyNames.length > 0 ? onlyNames : ALL_MAPS;

  if (dryRun) {
    const name = targets[0];
    console.log(`Dry run: fetching ${name}`);
    const url = `${BASE_URL}/wiki/${encodeURIComponent(name.replace(/ /g, "_"))}`;
    const html = await fetchHtml(url);
    const $ = cheerio.load(html);
    console.log(JSON.stringify(normalizeMap(name, url, $), null, 2));
    return;
  }

  const scraped = [];
  for (const name of targets) {
    try {
      console.log(`Scraping ${name}...`);
      scraped.push(await scrapeMap(name));
    } catch (err) {
      console.error(`Failed to scrape ${name}: ${err.message}`);
    }
    await sleep(REQUEST_DELAY_MS);
  }

  const existing = loadExisting().filter((m) => !scraped.some((s) => s.name === m.name));
  writeOutput([...existing, ...scraped]);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
