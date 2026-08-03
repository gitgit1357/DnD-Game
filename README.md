# Roadwarden: Solo Realm v0.75.32

Canonical playable single-file release: `index.html`.

**Start here: read `NORTHSTAR.md` before making any changes.** It documents
the workflow discipline this project depends on and the specific ways it
broke down once already — skipping it is how that happens again.

## v0.75.32 — Fixed Arrival Backdrop Tiling/Repeating
The title/map stage's backdrop showed a visible seam/repeat. Root cause:
`.arrival-shell`'s base rule never set `background-size`, so the browser
defaulted to tiling the image at its natural size — a general bug
affecting every arrival stage with a photo, not just the one reported.
Fixed at the base rule so it applies uniformly. 100/100 tests passing.

## v0.75.31 — Fixed Text Legibility Against Bright Arrival Backdrops
The title/map stages' text was nearly unreadable against the bright
golden-hour road photo. Root cause: the shared vignette scrim was fully
transparent at dead center (exactly where the text sits), and two of
three text elements had no text-shadow at all. Fixed both — a general
fix that should hold up for any future arrival-stage art. 99/99 tests
passing.

## v0.75.30 — Rain-Gate Art Closes the Arrival Engine Gap
The dedicated art requested in v0.75.29 arrived — a rainy night gate
scene — and is now wired into both the Approach stage and the matching
"gate" outcome ending. Every arrival stage's art now matches its actual
content. `index.html` is ~4.7MB. 98/98 tests passing.

## v0.75.29 — Arrival Engine Art Now Matches Each Stage's Content
Title+map now share the road-journey photo instead of a vista shot that
didn't fit their text. Fade and Approach are deliberately left plain
rather than force a mismatched photo onto them — Approach genuinely
needs new art (rain/night/gate) that nothing sourced yet depicts. The
two different outcome endings (marsh vs. gate) are now distinguished via
a new `data-outcome` attribute so the marsh photo doesn't wrongly show
for the gate ending. 98/98 tests passing.

## v0.75.28 — Real Root Cause of the Arrival Engine Mystery, Found
The "map" and "approach" arrival stages were never a caching issue —
they inject an entirely separate procedural scene (an animated SVG map;
a layered CSS scene with rain/fire/silhouettes) that sits on top of and
hides `.arrival-shell`'s photo backdrop, which was correct the whole
time. Removed both procedural scenes in favor of the same simple pattern
every other stage already uses. 97/97 tests passing, including a real
end-to-end render of both stages confirming the fix.

## v0.75.27 — Full-Bleed Backdrops Everywhere + 13 More Screens Found
Converted `.scene-art` from a small 130px banner into a full-bleed
backdrop covering the whole screen (one CSS change, zero risk to all 37
existing usages — verified they're all unwrapped children of
`#sceneContent` before relying on this). Cards are translucent globally
now, not just on the creation screen. A deeper re-audit found 13 more
screens with zero art, all now wired with reused art. 96/96 tests
passing, including two fixture bugs caught before they could hide
anything and one implementation slip caught by re-checking the diff.

## v0.75.26 — Transparency Fixes + Removed Dead Combat Silhouette Code
Creation-section cards and the mobile landing-hero scrim are both
noticeably lighter now, so backdrop art actually shows through. Also
traced a reported chess-pawn/dagger/wolf emoji overlay on the combat
screen to its root: the code that would produce it has zero call sites
anywhere in the file — confirmed exhaustively, not assumed — meaning
that report reflects a different build than the one being edited here.
Removed the dead code regardless. 94/94 tests passing.

## v0.75.25 — Missing-Art Audit, Batch 2 of 2 (Complete)
Closes the audit started in v0.75.24: town/social screens, dungeon map,
and combat sub-panels (17 screens/branches) now reuse existing art.
Two purely mechanical reference screens (balance diagnostics, magic item
table) were deliberately left bare. All 30 originally-bare screens are
now accounted for. `index.html` is still ~4.0MB — reuse cost nothing.
91/91 tests passing.

## v0.75.24 — Missing-Art Audit, Batch 1 of 2
Audited every screen in the game and found 30 with no background art at
all. Batch 1 (12 screens — spellbooks, skills/talents/equipment,
party/companion management) now reuse already-embedded art, at
essentially zero file-size cost. Batch 2 (~18 more) still pending, by
mutual agreement to check in between batches. 90/90 tests passing.

## v0.75.23 — Real Class Portraits Replace Procedural Avatars
All 9 classes now show a real painted portrait instead of a small
procedural SVG shape. Confirmed tradeoff: ancestry no longer shows in
the avatar (one portrait per class, not per class-per-ancestry).
Portraits downscaled and compressed specifically for icon-size display
(~106KB total for all 9), kept lean deliberately since they only ever
show at 40-150px. `avatarSVG()` kept its exact name/signature so no
call site needed to change. 89/89 tests passing.

## v0.75.22 — Backdrop Behind the Entire Creation Screen
Fixed a real gap caught from an on-device screenshot: character-creation
art only covered the sidebar, everything below (choice cards, info
panels) was plain because those cards use an opaque background. Added
the backdrop to the whole screen and scoped a translucent-card override
so it actually shows through — scoped to creation only, not changed
game-wide. 86/86 tests passing.

## v0.75.21 — Real Art: Character Development + Master Spellbook
Sixth art batch: the Character Development hub and the Master Spellbook
(shared by hero and companions) now have real backdrops — a training
yard and a glowing arcane tome, respectively. `index.html` is ~3.8MB;
file size continues to climb steadily with each batch, flagged again for
awareness. 85/85 tests passing.

## v0.75.20 — Fixed: Companions Always "Objecting" to Every Quest
Root cause: a scoring bug in the party-council opinion logic double-counted
alignment law for chaotic companions (CG/CN/CE), landing them at exactly
the "object" threshold on every single plain quest, deterministically,
regardless of the quest's actual content. Fixed the double penalty;
verified murder-flavored quests still correctly draw a strong refusal
from Lawful Good and support from Chaotic Evil. 83/83 tests passing.

## v0.75.19 — "The Chronicle Opens" Backdrop
Added art to the guided character creator's final "Alden, will you take
the road?" screen — reused the existing char-creation image (no new art
sourced), keyed off a new `data-step="review"` attribute mirroring the
Arrival Engine's existing `data-stage` pattern. 81/81 tests passing,
including a real driven-through-the-creator verification.

## v0.75.18 — Clickable Calling/Ancestry/Background Cards
Calling, Ancestry, and Background in character creation are now
directly-clickable card grids instead of select-then-confirm dropdowns —
click a card, see the info update immediately, no separate step. Also
found and documented a real limitation in the test harness's mock DOM
(doesn't parse HTML attribute values into element properties) while
verifying this change. 80/80 tests passing.

## v0.75.17 — Library of Chronicles (Real Feature)
The bookshelf save-slot screen from the original mockup, actually built —
not just an art swap. Built as a new presentation layer over the existing
save system (same data, same `loadSaveSlot()`, no format changes). One
deliberate change from the mockup: dropped the fabricated "68% complete"
progress bar in favor of real data (day, region, level, health status)
since this game has no actual completion concept to measure. 79/79 tests
passing, including a real save-write/load/erase round trip.

## v0.75.16 — Real Art: Recruitment (reused), Level-Up, Reeds Climax
Fourth art batch: companion recruitment reuses the existing inn art (same
location, no duplicate needed), character growth gets a real campfire
backdrop, and the reeds quest's climax — right where Wren's secret comes
out — gets dedicated art, conditional on quest identity like the v0.75.15
dungeon backdrop. `index.html` is ~2.8MB with 18 of 19 sourced images
wired in (Library of Chronicles still pending). 75/75 tests passing.

## v0.75.15 — Real Art: Character Creation + Arrival Engine + Reeds Dungeon
Third art batch, following the opening progression: Character Creation,
the Arrival Engine (a fully custom animated multi-stage sequence with its
own procedural SVG map, discovered while wiring this in), and a
quest-specific flooded-ruin backdrop for the reeds quest's dungeon
(conditional on `state.quest.storyId` — the first backdrop keyed to quest
identity rather than screen type). `index.html` is now ~2.4MB. 72/72
tests passing, including a real end-to-end render test using the
project's existing reeds-quest fixtures.

## v0.75.14 — Real Art: Travel, Town, Dungeon, Combat, Market, Inn
Second art batch wired in: real painted backdrops now on the three travel
screens (replacing a flat CSS placeholder), and on Town, Dungeon, Combat,
Market, and Inn — all of which had zero art before. A 7th image (Library
of Chronicles) is kept in `art_source/` for when that screen gets built.
`index.html` is now ~1.6MB, still a single portable file. 69/69 tests
passing.

## v0.75.13 — Title Fix Corrected + Test-Suite Path Bug Found
The v0.75.12 title fix over-corrected into a mid-word break
("ROADWAR-DEN"). Replaced with a cleaner fix: no artificial character
limit, word-breaking explicitly disallowed, tighter mobile font scaling.
Also found and fixed a real bug in the test suite itself — three checks
had hardcoded paths to old version-numbered folders and were silently
validating stale snapshots instead of the live file; now resolved
relative to the test file's own location so this can't recur. Swept the
rest of the suite for the same pattern — nothing else affected.

## v0.75.12 — Title Clipping Fixed + More Transparent Caption Boxes
"ROADWARDEN" was getting clipped off the edge of the main menu title
(a too-tight `max-width:10ch` on bold display serif text that renders
wider than 1ch/character) — fixed with more headroom plus a safety net.
Also made the intro slide caption boxes noticeably more transparent so
the new painted art shows through clearly instead of being mostly
covered by a near-opaque box.

## v0.75.11 — Fixed: Menu Background Photo Was Invisible
The v0.75.10 art embed left a leftover opaque CSS layer (`.landing-hero::before`,
originally the placeholder color behind the old CSS-drawn scenery) painting
directly on top of the new photo, hiding it completely — all 6 intro slides
showed correctly, only the main menu didn't. Cleared the opaque layer; the
photo now shows through with the existing text-legibility scrim on top of it,
as intended.

## v0.75.10 — Real Painted Art: Menu Background + All 6 Intro Slides
The person generated 7 real illustrations externally and sent them as a
collage; split programmatically into individual images and embedded all
7 (as base64 JPEGs) — the main menu background and all six intro slides
now show real painted art instead of any CSS/SVG placeholder. Simpler
code too: six per-scene generators collapsed into one lookup table.
`index.html` grew from ~850KB to ~1.2MB, still a single portable file.
Source images kept in `art_source/` for reference. Note: the art is
native ~500px-wide (cropped from a collage) so may look a little soft
on a large screen — worth regenerating at higher resolution later.

## v0.75.9 — Intro Slide Rendering Hardened + Simplified
Fixed a real bug reported from actual browser play: the new "Old Road"
intro slide flashed white before the intro continued. Rendering that
slide's visual now falls back to a plain caption instead of leaving it
blank if anything throws, and the winding path's SVG gradient reference
(a known source of quirky behavior in some mobile browsers) was
simplified to a solid color. Please re-test to confirm the flash is gone.

## v0.75.8 — First Visual Art Pass: "The Old Road" Intro Scene
First step on the visual-appeal feedback: rebuilt the opening intro scene
using only CSS/SVG (no image-generation tool available, and no raster
assets fit the single-file/no-external-licensing constraints). Layered
mountains, a veiled moon, a procedural pine treeline, a genuinely winding
path (was a straight trapezoid), and a lantern-lit signpost, replacing the
old flat two-tone gradient bands. Deliberately scoped to just this one
scene first — the other five intro scenes are untouched pending feedback
on whether this direction lands.

## v0.75.7 — Weapon Wear Balance + Ammo Recovery
Direct playtest feedback: fun game, no big bugs, but weapons wore out too
fast and arrows never came back. Weapons now only take wear on a
successful hit (not a miss), and the durability penalty curve is loosened
so a weapon feels fine for roughly 4x longer before it's noticeably worn.
Ordinary ammunition (arrows, bolts, sling bullets) now has a real chance
(~55%) of being recovered from the battlefield after any fight the party
holds — previously only enchanted ammo could ever come back.

## v0.75.6 — Travel Discoverability Fix
Reported as "no way to travel between towns without a quest." The feature
already worked fine — it was just buried below the Quest Board and a
"Suggested Next Step" card that always pushed toward questing, several
screens down on a phone. Added a prominent "Travel to Another City" button
immediately below the town description, visible without scrolling.

## v0.75.5 — Flee Warning for Abandoned Companion Gear
Fleeing a battle already meant forfeiting a fallen companion's gear by
design, but there was no warning before committing to it. Choosing "Flee
Battle" now shows a confirmation naming exactly which companion(s) and
which items would be abandoned for good, with an explicit "Flee Anyway" /
"Reconsider" choice — unaffected if nothing would be lost.

## v0.75.4 — Companion Death Alert + Fixed a Real Loot-Loss Gap
A companion dying only produced a log line, easy to miss. Added a modal
alert (parity with the hero's critical-HP warning) naming the fallen
companion and their gear. Also found and fixed a real bug while doing
this: a dead companion's own gear was only recoverable after a plain
victory — if the enemy surrendered and was released, disarmed, or
executed, that gear was silently lost forever. Now recoverable across all
of those outcomes too.

## v0.75.3 — First Real Playtest Bug Fixes
The first human playtest of the v0.74–v0.75.2 content surfaced a severe,
silent bug: the Arrival Engine's opening "help" choice corrupted Greenmarch's
reputation into a bare number instead of the `{renown,fear,...}` object every
other reputation function expects, permanently turning CHA checks made in
town into `NaN`. Fixed at the source and added a self-healing repair for any
save already hit by it. Also added companion/hero armor to the compact combat
party cards (previously only weapon and off-hand were shown). A third report
— back-row party members apparently taking melee damage — was investigated
and the row-restriction logic checked out correctly in direct testing; left
open pending a clearer reproduction. See `CHANGELOG.md` for full detail.

## v0.75.2 — Earlier Warning Thresholds + Party-Expansion Backlog
Wounded now shows at 75% HP (was 50%), and the critical warning modal fires
at 50% HP (was 25%) — more lead time to react. Also logged a party-expansion
backlog item (minions vs. raising the party cap) in `DESIGN_FOUNDATION.md`
for a future session — not built yet, deliberately deferred.

## v0.75.1 — No One-Shot Kills From Full Health
The first real permadeath happened in a single blow, skipping the low-HP
warning entirely. Fix: a single attack can never one-shot a hero who was at
full HP — capped to 1 HP survival instead, guaranteeing the warning system
gets its chance. Already-wounded heroes get no such protection; the stakes
are still real. See `CHANGELOG.md` for detail.

## v0.75.0 — True Permadeath, Persistent Chronicle, Mandatory Low-HP Warnings
Character death is now real and permanent, with a persistent cross-campaign
Chronicle recording every fallen hero's epitaph, and an unmissable low-HP
warning system shipped in the same version — not as a follow-up. Replaces
the old rescue-on-defeat mechanic, which had quietly given the game no real
stakes. See `DESIGN_FOUNDATION.md` for the updated pillars and
`CHANGELOG.md`/`TEST_REPORT.md` for the full detail.

## v0.74.0-alpha5 — Defeat/Rescue Clarity Fix
Traced a real player report ("failed the flee roll but fled anyway") to a
working-as-designed mechanic (no-permadeath rescue) that communicated itself
so poorly it read as a bug. Fixed the communication, not the mechanic — see
`CHANGELOG.md` for the full diagnosis.

## v0.74.0-alpha4 — First Playtest Fixes
Three real CSS bugs found by an actual human playing on a phone — not
catchable by the harness, since it never renders layout. Caption text
colliding with action buttons on the approach/map arrival scenes, the
"choice" stage's kicker text rendering under the Sound/Skip buttons, and a
long companion name overflowing the recruit-screen card into its neighbor.
See `CHANGELOG.md` for the specifics and `TEST_REPORT.md` for what's still
unverified. This is exactly why the Northstar calls a real playtest the
necessary next step rather than more automated testing.

## v0.74.0-alpha3 — Fenreach Vertical Slice: Wren's Secret Reveal
A guaranteed, narratively-timed payoff for recruiting Wren: when the reeds-
quest boss falls with her in the party, she confirms what happened to her
patrol on the spot, distinct from the generic loyalty-RNG reveal every other
companion uses. See `TEST_REPORT.md` for coverage, including a test-authoring
mistake caught and fixed during this pass.

## v0.74.0-alpha2 — Fenreach Vertical Slice: First Quest, Dungeon, and Boss
"What the Reeds Took" is now the opening quest offer for every new campaign.
Patron and twist branch on whether the player recruited Wren Halloway and/or
helped the merchant during the arrival sequence — the first payoff for those
earlier choices. The quest rides entirely on the existing procedural dungeon
and combat engine: no new systems were needed to get a working dungeon and a
named boss (a revenant of the drowned patrol). Also resolves the
Alderwick/Fenreach naming inconsistency flagged in `DESIGN_FOUNDATION.md`.
See `TEST_REPORT.md` for coverage and known gaps.

## v0.74.0-alpha1 — Fenreach Vertical Slice: First Companion
First deliverable toward the "Project Fenreach" vertical slice. Wren Halloway,
a Watch Deserter, is now always one of the four initial recruit candidates,
with fixed (not randomized) goal/fear/boundary/secret tied to a marsh-patrol
disappearance.


## v0.73.2-sync — Process & Version Sync
A test-report gap opened after v0.69.0 and ran thirteen versions deep
(through the Arrival Engine alphas and the food rebalance) before being
caught. This pass closed it: backfilled test coverage for that whole span,
fixed five places where version labels had drifted out of sync with each
other, and introduced a single `GAME_VERSION` constant so the app can't
silently drift like this again. See `TEST_REPORT.md` for the full audit.

**Going forward:** every version bump should update `GAME_VERSION` in one
place, run `node tests/run_tests.js`, and get a corresponding entry in
`TEST_REPORT.md` before moving to the next feature — including alpha/UX-only
releases, which is exactly where this gap started.

## v0.66.0 highlights
- Institutions now carry long-term agendas and political momentum across years.
- Influence rises or falls through victories, satisfaction, faction backing, scandals, and accumulated agenda success.
- Dominant blocs can create persistent regional leadership eras that bias future policy without fully controlling it.
- Severe opposition to a dominant bloc can surface as scandal World Facts with lasting political consequences.
- Institutional budget priorities are now contested among councils, guilds, military bodies, faith institutions, scholarly groups, and trade interests.
- Each institution has persistent satisfaction/influence memory and a preferred budget priority.
- Close or divided annual budget votes can create persistent institutional-politics World Facts and mediation contracts.
- Maintenance spending now follows political priority under scarcity, allowing neglected assets to deteriorate even when other programs are protected.
- Capital investment recommendations can follow the adopted annual priority when no emergency project dominates.
- v0.64 Field Magic and all prior strict-clock, seasonal, ripple, Chronicle, reputation, and living-world systems remain intact.

See `POLITICAL_AGENDA_MODEL.md`, `INSTITUTIONAL_POLITICS_MODEL.md`, and `INSTITUTIONAL_BUDGET_MODEL.md`.


## v0.68.0 Focus
This build improves first-impression UX with a more atmospheric landing page and a lightweight animated intro slideshow designed to work well in mobile and desktop browsers.


## v0.70.0 Focus
- Full-screen one-pass opening sequence with skip, fade-out, and replay support.
This build continues the UX cleanup by reducing persistent screen clutter while preserving access to all simulation and adventuring systems.


## v0.72.0-alpha1 Focus
- Full-height illustrated landing hero with one dominant new-chronicle action.
- Conditional Continue Chronicle action when an autosave exists.
- Character creation moved below the opening viewport for a cleaner first impression.
- Responsive, self-contained CSS landscape artwork for desktop and mobile.


## v0.72.0-alpha1 Arrival Engine
Selecting **Begin a New Chronicle** now opens a testable full-screen arrival sequence with a five-stage state flow, reusable scene rendering, fade handoff, skip behavior, a placeholder realm map, narration, and a recorded first choice. The sequence hands off to the existing character creator without altering campaign save/load logic.


## v0.72.0-alpha2 Animated Realm Map
- Replaced the placeholder map with a self-contained illustrated SVG realm map.
- Added a one-pass glowing route trace from the western road to Fenreach.
- Added subtle map drift, cloud motion, regional labels, roads, rivers, mountains, settlements, and reduced-motion fallbacks.
- Arrival state flow and save/load behavior remain unchanged.


## v0.72.0 Settlement Approach
- Added a dedicated map-to-settlement approach stage between the realm map and opening narration.
- The camera now pushes down the final road toward Fenreach through rain, reeds, marsh water, distant hills, and gate lanterns.
- Added layered, self-contained CSS scenery with no external asset dependency.
- Added mobile-responsive composition and a reduced-motion fallback.
- Preserved skip behavior, arrival choices, character-creation handoff, and save/load compatibility.


## Alpha 5 opening consequence
The first arrival choice now resolves through a dedicated outcome scene and creates persistent campaign effects. Helping the merchant grants Greenmarch reputation, karma, supplies, and a trade token but costs two hours. Continuing records a roadside-disappearances lead and preserves daylight.


## v0.72.0 — Narrative Character Creation
The Arrival Engine now hands directly into a full-screen, story-driven character creator. Name, calling, ancestry, culture, background, cleric faith, and final review are presented as conversations inside Fenreach. The classic one-page form remains available as a fallback.


## v0.72.0 — Arrival Experience Complete

- Final cinematic transition cleanup between arrival stages.
- Optional synthesized wind-and-rain ambience with an in-scene sound toggle; no external audio files or internet connection required.
- Subtle storm lighting, film grain, safe-area handling, and improved small-phone layouts.
- Reduced-motion and reduced-data fallbacks disable nonessential effects.
- The complete opening now flows from full-screen intro through arrival, first consequence, and narrative character creation.


## Provision Rebalance Test
Food is intended to support expeditions rather than dominate play. Journey Supplies are cheap and common in settlements, foraging is a reliable one-hour fallback, and hunger escalates gradually over several missed days. The inventory key remains `Rations` internally so existing saves remain compatible.


## v0.73.2 hotfix
- Existing saves now receive Journey Supplies in markets when the old market stock predates the food rebalance.
- Inns sell standalone hot meals and Journey Supplies in 1, 3, and 7-unit bundles.
- Mobile toolbars return to normal document flow to prevent overlap with venue content.


## v0.73.2 provisions hotfix
The market and inn now render a dedicated Journey Supplies purchase panel. Provision stock is repaired whenever either venue opens, including old saves with missing or depleted staple stock.
