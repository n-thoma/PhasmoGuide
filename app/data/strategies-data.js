// Hand-written, condensed from each ghost's "Strategies"/"Identification"
// section on the Phasmophobia Fandom wiki (not scraped — paraphrased for
// length and readability). Re-check the wiki if a game update changes a
// ghost's mechanics significantly.
window.PHASMOGUIDE_STRATEGIES = {
  dataStatus: "Hand-curated summaries, condensed from the wiki's per-ghost Strategies sections (2026-09-02).",
  strategies: [
    {
      name: "Aswang",
      standOut:
        "One of the easier ghosts to deal with — no major offensive strengths, a slower hunt speed, and it can't kill players inside official hiding spots.",
      tips: [
        "If it finds you in a hiding spot, it can't finish you off there — but expect it to beeline straight for you at the start of the next hunt.",
        "Don't confuse its speed with Obambo or The Twins — watch across a few hunts for a change in base speed to rule those out.",
      ],
    },
    {
      name: "Banshee",
      standOut: "Fixates on a single target player, both outside and during hunts.",
      tips: [
        "Watch the Sanity Monitor: if it hunts above 50% average sanity, whoever has the lowest sanity is likely the target; if it refuses to hunt below 50% while one player sits at high sanity, that player is the target.",
        "In multiplayer, have players act as bait one at a time (talking, holding active electronics) and see who it rushes for.",
        "Single-player has no target to read — lean on its unique scream on a Parabolic Microphone/Sound Recorder instead.",
      ],
    },
    {
      name: "Dayan",
      standOut: "Its speed locks to whatever the nearest player is doing within 10m — dangerously fast if you're moving.",
      tips: [
        "Assume a 65% hunt threshold rather than the usual 50%, since it's hard to avoid walking near it entirely.",
        "If caught in range during a hunt, crouch and stay still — moving only makes it faster.",
        "It's slightly faster than your default speed, so break line-of-sight or use Incense/Tier III Salt rather than trying to outrun it.",
      ],
    },
    {
      name: "Deildegast",
      standOut: "Starts fast (3.0 m/s) but grinds down the more nearby items get moved or interacted with.",
      tips: [
        "Interact with ~15 items between hunts to drag its speed down to something manageable — even dead players' interactions count.",
        "Its speed resets after every hunt and after a burned crucifix, so keep re-doing this between attempts.",
      ],
    },
    {
      name: "Demon",
      standOut: "Hunts far more aggressively than normal, with a much shorter cooldown between hunts.",
      tips: [
        "Time the gap between hunts — under 25 seconds (and not from a cursed hunt) strongly points to Demon.",
        "Time its smudge recovery too: hunting again 60–90 seconds after a correctly-timed smudge is a solid tell.",
      ],
    },
    {
      name: "Deogen",
      standOut: "Rushes from range but grinds to a crawl once it's actually close — the nearer it gets, the slower it moves.",
      tips: [
        "Just keep moving. Once it's near you it becomes the slowest ghost in the game and simply can't catch up.",
        "Use a Spirit Box near the edge of a Tier III Motion Sensor's range to catch its unique heavy-breathing response.",
      ],
    },
    {
      name: "Gallu",
      standOut: "Switches between calm, enraged, and weakened states — and can't cross salt once it's enraged.",
      tips: [
        "Be careful collecting Ultraviolet evidence with salt — stepping in it flips Gallu into its enraged state.",
        "If a salt pile stays undisturbed after the ghost has clearly already crossed that spot once, that's a strong Gallu tell (Wraith and an enraged Gallu are the only other explanations).",
      ],
    },
    {
      name: "Goryo",
      standOut: "Only ever shows up on a D.O.T.S. Projector when viewed through a camera — never with the naked eye.",
      tips: [
        "Point a Video Camera at an active D.O.T.S. Projector; seeing the ghost there but not in direct view all but confirms a Goryo.",
        "Seeing D.O.T.S. without a camera rules it out completely.",
      ],
    },
    {
      name: "Hantu",
      standOut: "Speed swings hard with room temperature — sluggish in warm rooms, fast in freezing ones.",
      tips: [
        "Leave the fuse box on and listen for uneven footstep timing during a hunt as it moves between rooms of different temperatures.",
        "No line-of-sight acceleration, so a speed change that tracks room temperature (not chase distance) is the tell.",
      ],
    },
    {
      name: "Jinn",
      standOut: "Snaps to a fixed 2.5 m/s the instant it spots a distant target, as long as the fuse box is on.",
      tips: [
        "Watch from the far end of a long hallway with full line-of-sight for a sudden speed jump the moment it spots you.",
        "Don't confuse this with Revenant's speed jump, which is far more drastic.",
      ],
    },
    {
      name: "Kormos",
      standOut: "Detects footsteps rather than sight, and can't hear across floors.",
      tips: [
        "Stay still and silent during a hunt — a normal ghost would beeline straight to you, but Kormos often can't find a stationary player.",
        "If it's on a different floor, you're free to move around without it noticing.",
      ],
    },
    {
      name: "Mare",
      standOut: "Hunts more readily when the lights in its room are off.",
      tips: [
        "Leave the lights on in its favorite room and watch for it snapping them back off — ghosts can't touch lights during a manifestation event, so this is a clean confirmation.",
        "A ghost that turns a light on directly rules out Mare.",
      ],
    },
    {
      name: "Moroi",
      standOut: "Gets faster the lower the team's average sanity drops, ranging from 1.5 up to 2.25 m/s.",
      tips: [
        "Watch for it visibly speeding up across several hunts as sanity drops.",
        "For a faster read, sharply drop sanity mid-hunt (a cursed possession works) with everyone hidden, and listen for an immediate speed change.",
      ],
    },
    {
      name: "Myling",
      standOut: "Its hunting footsteps and sounds carry only ~12m instead of the usual 20m.",
      tips: [
        "Drop an active electronic (10m interference range) at your hiding spot — if the ghost's footsteps go nearly silent just past that point during a hunt, suspect Myling.",
        "Two paranormal sounds picked up within 80 seconds on a Parabolic Microphone/Sound Recorder confirms it.",
      ],
    },
    {
      name: "Obake",
      standOut: "Its fingerprints are inconsistent — sometimes missing, sometimes decaying unusually fast — and it can briefly flicker into a different ghost model.",
      tips: [
        "UV-check every surface it touches; getting fingerprints sometimes and not others (rather than every time) points to Obake.",
        "Loop it somewhere you can keep watching closely, or use a Video Camera — it'll flash \"Ghost Shapeshift\" on screen the moment it changes models.",
      ],
    },
    {
      name: "Obambo",
      standOut: "Runs two distinct base speeds — a slow \"calm\" state and a fast \"aggressive\" one.",
      tips: [
        "A hunt that runs about 20% shorter than expected, or one that starts fast and stays fast, points to Obambo.",
        "A sudden speed snap mid-hunt for no apparent reason is Obambo switching states — don't confuse it with The Twins, which has similar speeds but doesn't change mid-hunt this way.",
      ],
    },
    {
      name: "Oni",
      standOut: "Noticeably more active than other ghosts and generous with evidence, but can't perform mist-form events.",
      tips: [
        "Seeing a mist-form ghost event immediately rules out Oni.",
        "Its ghost-event collisions drain double the usual sanity, so expect the team's sanity to fall faster than normal.",
      ],
    },
    {
      name: "Onryo",
      standOut: "Terrified of open flame — fire actively suppresses its ability to hunt.",
      tips: [
        "Keep firelights burning near it; if it won't hunt as long as they're lit, that's a strong tell.",
        "Blowing out a lit flame within 30 seconds of first lighting it (20s on relights) all but locks in the identification.",
      ],
    },
    {
      name: "Phantom",
      standOut: "Stays invisible for longer stretches during hunts and vanishes completely from photos.",
      tips: [
        "A photo that shows nothing where the ghost should be — with no interference pattern — is close to a guaranteed tell; D.O.T.S. is the most reliable moment to try this.",
        "Watch hunts for noticeably long invisible stretches (more than a second at a time).",
      ],
    },
    {
      name: "Poltergeist",
      standOut: "Can only interact with the environment by throwing objects — never lighting fires, honking horns, or similar.",
      tips: [
        "Scatter several objects around its room; multiple items flying at once, even in a lit room where other ghosts can't throw, is the giveaway.",
        "Any non-throw interaction (fire, radio, car alarm) rules Poltergeist out completely.",
      ],
    },
    {
      name: "Raiju",
      standOut: "Speeds up dramatically when active electronics are nearby.",
      tips: [
        "Turn off or remove electronics from the ghost room to keep it weak.",
        "To confirm it, leave one active electronic out and watch for a sudden roaming speed spike — don't confuse this with Hantu warming/cooling between rooms.",
      ],
    },
    {
      name: "Revenant",
      standOut: "Nearly silent while roaming, but rockets to 3 m/s the instant it detects a player.",
      tips: [
        "Sparse, widely-spaced footsteps while it's nearby but not hunting you is a strong Revenant tell — hide immediately.",
        "If it's already chasing, don't try to outrun it — Tier III Salt, Incense, or Sanity Medication's sprint boost are your best bets to create distance.",
      ],
    },
    {
      name: "Shade",
      standOut: "Shy — avoids interacting with the environment and refuses to hunt in a room where a player is present.",
      tips: [
        "On Nightmare/Insanity, drop sanity low and stand in its room with an escape route ready; a ghost that still won't hunt with you right there suggests Shade.",
        "A quiet, low-activity contract with few interactions is itself a hint.",
      ],
    },
    {
      name: "Spirit",
      standOut: "No unique ability — the game's baseline ghost, which makes it easy to mistake for something else without solid evidence.",
      tips: [
        "Smudge it, then smudge again after ~160–170 seconds; if it doesn't hunt within 60 seconds of the second smudge, that points to Spirit over faster-recovering ghosts like Demon.",
      ],
    },
    {
      name: "Thaye",
      standOut: "Dangerous early — fast and high sanity threshold — then visibly calms down and slows the longer players stay near it.",
      tips: [
        "Unlike Obambo, it doesn't speed up with line-of-sight — a ghost that's fast early but never accelerates on a chase, and clearly mellows out over the contract, is likely Thaye.",
        "Save hunt-related objectives for later in the contract, once it's aged enough to be an easy loop.",
      ],
    },
    {
      name: "The Mimic",
      standOut: "Always throws in a false Ghost Orb on top of its real three evidences, and can act like an entirely different ghost from one moment to the next.",
      tips: [
        "Confirming one more evidence type than your difficulty should allow is close to a guaranteed tell.",
        "Inconsistent behavior across the contract — acting like different ghosts at different times — is the other classic giveaway.",
      ],
    },
    {
      name: "The Twins",
      standOut: "Can interact with the environment from far outside the room it's actually in, creating misleading red-herring activity.",
      tips: [
        "Two interactions less than 2 seconds apart is impossible for any other ghost and confirms The Twins.",
        "A subtly different base speed from one hunt to the next (1.5 or 1.9 m/s instead of the standard 1.7) is the other classic tell.",
      ],
    },
    {
      name: "Wraith",
      standOut: "Never steps in or disturbs salt.",
      tips: [
        "Lay a line of salt across a doorway it's likely to cross; passing straight through untouched confirms Wraith (an enraged Gallu is the only other ghost that can do this).",
        "Placing salt in the middle of a Summoning Circle before summoning works well too.",
      ],
    },
    {
      name: "Yokai",
      standOut: "Hunts more readily when players talk or cluster nearby, but has short-range hearing and weak electronics detection during hunts.",
      tips: [
        "Stand just outside its immediate sight with an active device or your mic on — if it wanders past without noticing, that points to Yokai.",
        "Talking near it only raises its hunt threshold, it doesn't make hunts more aggressive once one starts.",
      ],
    },
    {
      name: "Yurei",
      standOut: "Its signature move is leaving a door only partly open or closed instead of fully.",
      tips: [
        "Watch doors outside of hunts — one stopping mid-swing on its own is a strong tell.",
        "If it favors its ability instead, Incense its favorite room and watch with Motion Sensors: no exit or D.O.T.S. sighting within 90 seconds rules Yurei out.",
      ],
    },
  ],
};
