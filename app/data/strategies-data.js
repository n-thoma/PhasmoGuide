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
        "One of the easier ghosts to deal with since it has no major offensive strengths, a slower hunt speed, and it can't kill players inside official hiding spots.",
      tips: [
        "If it finds you in a hiding spot, it can't finish you off there but expect it to beeline straight for you at the start of the next hunt.",
        "Don't confuse its speed with Obambo or The Twins. Watch across a few hunts for a change in base speed to rule those out.",
        "If it chases you into a hiding spot and then the hunt ends, that is most likely an Aswang."
      ],
    },
    {
      name: "Banshee",
      standOut: "Fixates on a single target player, both outside and during hunts.",
      tips: [
        "The Banshee is a female-only ghost; it can be excluded if the ghost presents a masculine name, or appears as a male ghost model.",
        "Watch the Sanity Monitor: if it hunts above 50% average sanity, whoever has the lowest sanity is likely the target; if it refuses to hunt below 50% while one player sits at high sanity, that player is the target.",
        "In multiplayer, have players act as bait one at a time (talking, holding active electronics) and see who it rushes for.",
        "When using a Parabolic Microphone or a Sound Recorder, the Banshee has a 33% chace of making one of its unique screams instead of a regular paranormal sound."
      ],
    },
    {
      name: "Dayan",
      standOut: "Its speed locks to whatever the nearest player is doing within 10m — dangerously fast if you're moving.",
      tips: [
        "The Dayan is a female-only ghost; it can be excluded if the ghost presents a masculine name, or appears as a male ghost model.",
        "Assume a 65% hunt threshold rather than the usual 50%, since it's hard to avoid walking near it entirely.",
        "If caught in range during a hunt, crouch and stay still since moving only makes it faster.",
        "It's slightly faster than your default speed, so break line-of-sight or use Incense/Tier III Salt rather than trying to outrun it.",
      ],
    },
    {
      name: "Deildegast",
      standOut: "Starts fast (3.0 m/s) but grinds down the more nearby items get moved or interacted with.",
      tips: [
        "Interact with ~15 items between hunts to drag its speed down to something manageable! (Even dead players' interactions count)",
        "Its speed resets after every hunt and after a burned crucifix, so keep re-doing this between attempts.",
      ],
    },
    {
      name: "Demon",
      standOut: "Hunts far more aggressively than normal, with a much shorter cooldown between hunts.",
      tips: [
        "Time the gap between hunts — under 25 seconds (and not from a cursed hunt) strongly points to Demon.",
        "Time its smudge recovery too: hunting again 60-90 seconds after a correctly-timed smudge is a solid tell.",
      ],
    },
    {
      name: "Deogen",
      standOut: "Rushes from range but grinds to a crawl once it's actually close. In other words: the nearer it gets, the slower it moves.",
      tips: [
        "Just keep moving. Once it's near you it becomes the slowest ghost in the game and simply can't catch up.",
        "Use a Spirit Box near the edge of a Tier III Motion Sensor's range (1m) to catch its unique heavy-breathing response.",
      ],
    },
    {
      name: "Gallu",
      standOut: "Switches between normal, enraged, and weakened states. Can't cross salt once it's enraged.",
      tips: [
        "Be careful collecting Ultraviolet evidence with salt since stepping in it flips Gallu into its enraged state.",
        "If a salt pile stays undisturbed after the ghost has clearly already crossed that spot once, that's a strong Gallu tell (Wraith and an enraged Gallu are the only other explanations).",
        "After an enraged Gallu hunts, it gets put into its weakened state."
      ],
    },
    {
      name: "Goryo",
      standOut: "Only ever shows up on a D.O.T.S. Projector when viewed through a camera, never with the naked eye. Goryos also never change favorite rooms.",
      tips: [
        "Point a Video Camera at an active D.O.T.S. Projector; seeing the ghost there but not in direct view all but confirms a Goryo.",
        "Seeing D.O.T.S. without a camera rules it out completely.",
        "A ghost changing its favorite room also rules out a Goryo completely."
      ],
    },
    {
      name: "Hantu",
      standOut: "Speed swings hard with room temperature: sluggish in warm rooms, fast in freezing ones.",
      tips: [
        "Leave the fuse box on and listen for uneven footstep timing during a hunt as it moves between rooms of different temperatures.",
        "No line-of-sight acceleration, so a speed change that tracks room temperature (not chase distance) is the tell.",
        "The Hantu's ability to emit freezing breath when the breaker is off can be used to identify it without evidence.",
        "If you do not obtain Freezing Temperatures as one of the ghost's types of evidence on a limited evidence game (1/2 evidence), then the Hantu can be safely ruled out.",
        "The Hantu cannot turn on fuse boxes, so if this happens, it is not a Hantu."
      ],
    },
    {
      name: "Jinn",
      standOut: "Snaps to a fixed 2.5 m/s the instant it spots a distant target, as long as the fuse box is on.",
      tips: [
        "Watch from the far end of a long hallway with full line-of-sight for a sudden speed jump the moment it spots you.",
        "Don't confuse this with Revenant's speed jump, which is far more drastic.",
        "The Jinn cannot turn off the fuse box, so if this happens, it is not a Jinn",
        "Leave an EMF reader at the fuse box while the fuse box is on; if it picks up a reading but the fuse box never turned off, it is likely a Jinn using its ability."
      ],
    },
    {
      name: "Kormos",
      standOut: "Detects footsteps rather than sight, and can't hear across floors.",
      tips: [
        "Stay still and silent during a hunt! A normal ghost would beeline straight to you, but Kormos often can't find a stationary player.",
        "If it's on a different floor, you're free to move around without it noticing.",
        "The Kormos cannot perform mist form and chasing ghost events, so if these happen, it is not a Kormos."
      ],
    },
    {
      name: "Mare",
      standOut: "Hunts more readily when the lights in its room are off.",
      tips: [
        "A ghost that turns a light on directly rules out Mare.",
        "When a Mare is performing a ghost event, the Mare as a 11.11% chance of choosing the light-shattering event instead of 6.67% like other ghosts.",
        "If a player turns on a light 4m of a Mare, it has a 1/7 chance of turning the light off almost immediately.",
        "A Mare is more likely to hunt when the lights in its room are off."
      ],
    },
    {
      name: "Moroi",
      standOut: "Gets faster the lower the team's average sanity drops, ranging from 1.5 up to 2.25 m/s.",
      tips: [
        "Watch for it visibly speeding up across several hunts as sanity drops.",
        "For a faster read, sharply drop sanity mid-hunt (a cursed possession works) with everyone hidden, and listen for an immediate speed change.",
        "You can also gain sanity mid-hunt using Sanity Medication to see if the ghost get slower."
      ],
    },
    {
      name: "Myling",
      standOut: "Its hunting footsteps and sounds carry only ~12m instead of the usual 20m.",
      tips: [
        "Drop an active electronic (10m interference range) at your hiding spot. If the ghost's footsteps go nearly silent just past that point during a hunt, suspect Myling.",
        "Two paranormal sounds picked up within 80 seconds on a Parabolic Microphone/Sound Recorder confirms it.",
      ],
    },
    {
      name: "Obake",
      standOut: "Its fingerprints are inconsistent (sometimes missing, sometimes decaying unusually fast), and it can briefly flicker into a different ghost model.",
      tips: [
        "UV-check every surface it touches; getting fingerprints sometimes and not others (rather than every time) points to Obake.",
        "There is a 1/6 chance for the Obake to create a unique handprint/fingerprint pattern: a six-fingered handprint, two fingerprints, five fingerprints on keyboards and prison cell doors.",
        "Loop it somewhere you can keep watching closely, or use a Video Camera — it'll flash \"Ghost Shapeshift\" on screen the moment it changes models.",
      ],
    },
    {
      name: "Obambo",
      standOut: "Runs two distinct base speeds: a slow \"calm\" state and a fast \"aggressive\" one.",
      tips: [
        "A hunt that runs about 20% shorter than expected, or one that starts fast and stays fast, points to Obambo.",
        "A sudden speed snap mid-hunt for no apparent reason is Obambo switching states. Make sure not to confuse it with The Twins, which has similar speeds but doesn't change mid-hunt this way.",
      ],
    },
    {
      name: "Oni",
      standOut: "Noticeably more active than other ghosts and generous with evidence, but can't perform mist-form events.",
      tips: [
        "Seeing a mist-form ghost event immediately rules out Oni.",
        "Its ghost-event collisions drain double the usual sanity, so expect the team's sanity to fall faster than normal.",
        "Opposite of the Phantom, an Oni is more visible during a hunt."
      ],
    },
    {
      name: "Onryo",
      standOut: "Terrified of open flame — fire actively suppresses its ability to hunt.",
      tips: [
        "The Onryo will try to hunt after it blows out 3 firelights. If it does not hunt or burn a crucifix after blowing out 3 firelights, it is not an Onryo. If it does hunt or burn a crucifix before burning out all 3 firelights, it is not an Onryo.",
      ],
    },
    {
      name: "Phantom",
      standOut: "Stays invisible for longer stretches during hunts and vanishes completely from photos.",
      tips: [
        "If a photo labeled as a \"Ghost Photo\" but the ghost is not visible in it, you are most likely dealing with a Phantom",
        "Watch hunts for noticeably long invisible stretches (more than a second at a time).",
      ],
    },
    {
      name: "Poltergeist",
      standOut: "Can only interact with the environment by throwing objects! Never lighting fires, honking horns, or similar.",
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
        "To confirm it, leave one active electronic out and watch for a sudden roaming speed spike. Don't confuse this with Hantu warming/cooling between rooms.",
      ],
    },
    {
      name: "Revenant",
      standOut: "Nearly silent while roaming, but rockets to 3 m/s the instant it detects a player.",
      tips: [
        "Sparse, widely-spaced footsteps while it's nearby but not hunting you is a strong Revenant tell. Hide immediately!",
        "If it's already chasing, don't try to outrun it! Tier III Salt, Incense, or Sanity Medication's sprint boost are your best bets to create distance.",
      ],
    },
    {
      name: "Shade",
      standOut: "Avoids interacting with the environment and refuses to hunt in a room where a player is present.",
      tips: [
        "On Nightmare/Insanity, drop sanity low and stand in its room with an escape route ready; a ghost that still won't hunt with you right there suggests Shade.",
        "A quiet, low-activity contract with few interactions is itself a hint.",
      ],
    },
    {
      name: "Spirit",
      standOut: "No unique ability — the game's baseline ghost, which makes it easy to mistake for something else without solid evidence.",
      tips: [
        "When incense is used on a Spirit, it will not be able to start another hunt for 180 seconds instead of the normal 90 seconds.",
      ],
    },
    {
      name: "Thaye",
      standOut: "Dangerous early (fast and high sanity threshold) then visibly calms down and slows the longer players stay near it.",
      tips: [
        "Unlike Obambo, it doesn't speed up with line-of-sight. A ghost that's fast early but never accelerates on a chase, and clearly mellows out over the contract, is likely Thaye.",
        "Save hunt-related objectives for later in the contract, once it's aged enough to be an easy loop.",
      ],
    },
    {
      name: "The Mimic",
      standOut: "Always throws in a false Ghost Orb on top of its real three evidences, and can act like an entirely different ghost from one moment to the next.",
      tips: [
        "Confirming one more evidence type than your difficulty should allow is close to a guaranteed tell.",
        "Inconsistent behavior across the contract where it acts like different ghosts at different times is the other classic giveaway.",
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
        "When the Wraith is not hunting, it has a chance to teleport to a random player, generating an EMF Level 2 reading where it teleported to."
      ],
    },
    {
      name: "Yokai",
      standOut: "Hunts more readily when players talk or cluster nearby, but has short-range hearing and weak electronics detection during hunts.",
      tips: [
        "Stand just outside its immediate sight with an active device or your mic on. If it wanders past without noticing, that points to Yokai.",
        "Talking near it only raises its hunt threshold, it doesn't make hunts more aggressive once one starts.",
      ],
    },
    {
      name: "Yurei",
      standOut: "Its signature move is leaving a door only partly open or closed instead of fully.",
      tips: [
        "After incensing a Yurei, it cannot appear in its D.O.T.S state for 90 seconds nor can it leave its favorite room for 90 seconds.",
        "When opening or closing doors (including tent doors), it will use a stronger force than other ghosts.",
        "The Yurei can only open or close a door completely, not partially. This does not apply to hunts.",
        "Note that all ghosts can open/close doors completely. So do not assume fully opened/closed doors means it's a Yurei."
      ],
    },
  ],
};
