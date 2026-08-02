## v0.75.17 — Library of Chronicles (Real Feature, Not Just Art)
The person's original mockup from several turns back — a painted bookshelf save-slot screen — finally gets built as an actual feature, not just an art swap. This is the first genuinely new screen added during the visual pass, using the Library art sourced back in the first art batch.

**Investigated the existing save system before building anything.** The game already had a complete, working multi-slot save system (`SAVE_SLOT_COUNT=3`, `savePayload()`, `characterSavePayload()`, `slotDescription()`, `loadSaveSlot()`, `deleteSaveSlot()`) — it was just presented as a plain text modal (`showSaveManager`). Rather than build a second, competing save system, `renderLibraryOfChronicles()` is a new full-screen presentation layer over the *same* underlying data and the *same* `loadSaveSlot()` used everywhere else — no save-format changes, no migration risk.

**One deliberate departure from the original mockup:** the mockup showed a numeric "68% complete" progress bar per save. This game has no real concept of campaign completion (it's an open-ended sandbox, not a fixed-length campaign), so a fabricated progress percentage would be fiction the game can't back up. Replaced it with real data instead — day/region/level are already shown via existing summary fields, plus hero health status (reusing the existing `healthStateText()`/`healthPercent()` helpers) as a meaningful "how are they doing" indicator that actually reflects saved state.

- New `.library-shell`/`.library-shelf`/`.library-book`/`.library-spine` CSS: each save slot renders as a book with a colored spine (rotating red/blue/green by position) and its own card body — hero name, level/ancestry/class/background, region, health status, companion roster, save timestamp.
- Empty slots get their own card with a direct "Begin a New Chronicle" action.
- New `eraseLibrarySlot()` wraps the existing delete logic but re-renders the Library afterward instead of falling back to the old modal — the previous `deleteSaveSlot()` wasn't reused directly because it always calls `showSaveManager()` to refresh, which would have popped the wrong UI.
- The two main-menu "Load Character" entry points now open the Library directly. The in-game DM Journal panel's own load button (a different context — a permanent utility available anytime mid-campaign, not a menu-time decision) was deliberately left pointing at the original modal.

4 new targeted harness checks (75 → 79 total, all passing): empty-slot state; a real populated slot built from an actual `characterSavePayload()` (not a hand-rolled stub) showing correct hero/companion/region data with working Continue and Erase buttons; the erase-and-refresh flow end-to-end; and confirmation that both main-menu entry points were repointed while the DM Journal's was correctly left alone.

`index.html` is now ~2.9MB (the Library background art was already embedded from batch one; this release is pure feature code, no new image weight).

## v0.75.16 — Real Art for Recruitment, Level-Up, and the Reeds Quest Climax
Fourth art batch, continuing the reeds-quest progression: recruiting companions, leveling up, and the emotional payoff of the questline.

- **Recruitment reused, no new art needed**: `renderRecruit()` — where the person picks up to two companions, including Wren — takes place at "The Lantern & Stag," the exact same inn already illustrated in v0.75.14. Wired in the existing `.scene-art-inn` image rather than sourcing a duplicate.
- **Character Growth (level-up)**: `showLevelUp()` now shows a real backdrop (a lone traveler sharpening a blade by firelight) — unconditional, since every character levels up regardless of which quest they're on.
- **The Wren reveal**: `renderQuestEnd()` — "The Choice at [place]," the moral-choice screen right where `revealWrenSecretAtReedsClimax()` has just fired — now shows dedicated art (a figure kneeling among wreckage in a moonlit ruin) conditional on `state.quest.storyId==="reedsQuest"`, matching the same conditional pattern established for the dungeon backdrop in v0.75.15. No generic quest-end art exists yet, so other quest types still render this screen with no backdrop — a real gap, not a bug, since there's currently only one handcrafted quest with a twist worth illustrating.

3 new targeted harness checks (72 → 75 total, all passing): recruitment reuses the inn class; level-up shows its new backdrop; and quest-end shows the Wren art only when `storyId` is `"reedsQuest"`, confirmed via both a positive case and a negative case built from the same `generateReedsQuest()`/`normalizeQuest()` fixtures used elsewhere in the suite.

`index.html` is now ~2.8MB with 19 art pieces sourced across five delivery batches — 18 wired in, Library of Chronicles still held for later. Continuing to watch this — still a single working file, but worth keeping in mind as more art gets added.

## v0.75.15 — Real Art for Character Creation and the Arrival Engine (Reeds Quest Opening)
Third art batch, following the game's actual opening progression: Character Creation → the Arrival Engine (the animated multi-stage sequence that plays right after character creation, previously undocumented in earlier art passes) → the reeds/marsh content that kicks off Wren Halloway's questline.

**Discovered along the way:** the Arrival Engine already existed as a fully custom system (`ARRIVAL_STAGES=["fade","title","map","approach","narration","choice","outcome"]`) with its own animated procedural SVG map for the "map" stage, but no photo backgrounds at all behind its text stages — just a dark radial vignette. Also confirmed via `arrivalText()` that the reeds/marsh/merchant-cart scenario is **universal narrative content**, not randomized per starting background — every character's arrival involves the same overturned cart and the same reeds, which made sourcing dedicated "reeds" art worthwhile rather than generic filler.

- **Character Creation** (`.creation-intro`): the sticky sidebar shown while building a character now has the real art behind it, layered under a `rgba(33,22,14,.74)→rgba(16,11,7,.86)` scrim (darker than a typical scene banner, since this panel holds dense form text that needs strong contrast) instead of the old flat gradient alone.
- **Arrival Engine, non-map stages**: added two new CSS rules keyed off the `data-stage` attribute the engine already sets on `#arrivalOverlay` — no JS changes needed. `fade`/`title`/`approach` use the "approaching the region" art; `narration`/`choice`/`outcome` use the reeds/marsh art, since those are exactly the stages where the merchant-cart-in-the-reeds scenario plays out. The `map` stage is untouched — it already has its own dedicated animated SVG map and shouldn't get a competing photo background.
- **Reeds-quest dungeon (conditional)**: `renderDungeon()`'s backdrop now checks `state.quest?.storyId==="reedsQuest"` and shows a dedicated flooded-ruin marsh interior for that specific quest's dungeon site, falling back to the generic stone-dungeon art (from v0.75.14) for every other dungeon. This is the first backdrop in the project that's conditional on quest identity rather than screen type.

4 new/updated targeted harness checks (69 → 72 total, all passing): the dungeon CSS conditional and both of its image rules exist; an actual end-to-end render (via `generateReedsQuest()`/`generateDungeonSite()`, the same fixtures used by the project's existing reeds-quest integration tests) confirms the reeds backdrop shows for a reeds-quest site and the generic one shows otherwise; the character-creation sidebar's CSS carries both the real image and the expected scrim; and both Arrival Engine stage-group CSS rules are present.

`index.html` grew to ~2.4MB with all 4 new images embedded (still a single portable file). All source JPEGs (10 art pieces total across three batches, plus the still-unwired Library of Chronicles image) are kept in `art_source/`.

## v0.75.14 — Real Art for Travel, Town, Dungeon, Combat, Market, and Inn
Second art batch: the person generated 6 more painted illustrations (plus a 7th for the Library of Chronicles, held back until that screen exists) from a second prompt list targeting the highest-traffic screens — three that previously shared a flat CSS placeholder (moon/hills/road/walker), and four that had **no art at all** (Town, Dungeon, Combat, Market, Inn).

Same collage-splitting approach as before: analyzed pixel gutters to find the grid boundaries programmatically (this collage used white gutters between a 4-column top row and a 3-column bottom row, rather than the black gutters of the first collage), cropped all 7 panels, visually verified 3 of them directly, and embedded 6 of them as base64 JPEGs:
- **Travel** (`.scene-art-travel`): replaces the shared CSS moon/hills/road/walker across all three travel screens (`renderTravel`, `renderQuestTravel`, `renderCityTravel`) — one image, one CSS class, reused exactly like the retired CSS was.
- **Town** (`.scene-art-town`): new banner inserted into `renderTown()`, right below the "Travel to Another City" button.
- **Dungeon** (`.scene-art-dungeon`): new banner inserted into `renderDungeon()`, right after the room name heading.
- **Market** (`.scene-art-market`): new banner inserted into `showShop()`.
- **Inn** (`.scene-art-inn`): new banner inserted into `showInn()`.
- **Combat** (`.combat-stage`): the existing combat formation stage (previously a flat gradient behind the party/enemy figure silhouettes and nameplates) now uses the real art as its background — no markup changes needed, since this element already existed with its own background rule.

Removed the retired CSS entirely: the `.scene-art .moon/.hills/.road/.walker` rules and the now-unused `@keyframes walk` animation are gone, replaced by a shared `.scene-art{height:130px;...;background-size:cover;background-position:center}` base plus one small `background-image` rule per screen.

6 new targeted harness checks (63 → 69 total, all passing), one per screen: Town, Market, Inn, the 3 travel screens together, Combat, and Dungeon.

`index.html` grew from ~1.2MB to ~1.6MB with all 6 new images embedded. The 7th image (Library of Chronicles) is kept in `art_source/` alongside the others, ready to wire in once that screen is built.

## v0.75.13 — Title Fix Corrected (No More Mid-Word Break) + a Real Test Suite Bug Found
The v0.75.12 title fix over-corrected: `overflow-wrap:break-word` let the renderer split "Roadwarden" mid-syllable ("ROADWAR-DEN") to balance the three title lines, which reads worse than the original clipping. Replaced the whole approach: removed the artificial `max-width:Nch` limit entirely (relying on the title's real container width instead), and explicitly disallowed word-breaking with `word-break:keep-all;overflow-wrap:normal` so "Roadwarden" can never be split, under any circumstance. Also tightened the mobile font-size clamp's viewport-width factor (13vw → 10vw) so the title scales down more readily on narrow phones, leaving real headroom for the unbroken word instead of relying on breaking as a last resort.

**Also found and fixed a real bug in the test suite itself, unrelated to the title:** three harness checks (added in v0.75.10/v0.75.11) had hardcoded absolute paths pointing at specific version-numbered directories (e.g. `.../Roadwarden_Solo_Realm_v0.75.10/index.html`). Once the project moved to a new version folder, those tests were silently reading a **frozen snapshot of an old file** instead of the current one — meaning they'd report PASS regardless of what the current code actually did. This was caught only because fixing the title surfaced a test that kept reporting PASS against a change it should have flagged as FAIL. Replaced all hardcoded paths with `require("path").join(__dirname, "..", "index.html")`, which always resolves to the actual current file regardless of what the containing folder is named — this class of bug can't recur.

2 updated/new targeted harness checks (62 → 63 total, all passing): confirms the title CSS has no ch-based max-width and explicitly disallows word-breaking; confirms the mobile font clamp's vw factor was tightened to 10 or below. Both checks now correctly read the live file thanks to the path fix above.

## v0.75.12 — Title Clipping Fixed + More Transparent Caption Boxes
Two issues from real device screenshots on the new-art build:

**"ROADWARDEN" was getting clipped off the right edge of the title.** `.landing-title` had `max-width:10ch`, sized on the assumption that 1ch (the width of a "0" character) roughly matches the average glyph width — but this project's bold display serif renders noticeably wider than that per character, so the single word "Roadwarden" (10 characters) actually rendered wider than its own 10ch container and overflowed past `.landing-hero`'s `overflow:hidden` boundary, getting clipped mid-word ("ROADWARDI..."). Raised `max-width` to `13ch` and added `overflow-wrap:break-word` as a safety net so any future similarly-tight case degrades to a mid-word break instead of invisibly clipping off-screen.

**Intro caption boxes were too opaque, hiding too much of the new art.** Reduced the background opacity on both the compact intro-caption (`rgba(11,8,6,.66)` → `rgba(11,8,6,.4)`) and the fullscreen version used during actual intro playback (`rgba(...,.8)/rgba(...,.65)` → `rgba(...,.42)/rgba(...,.32)`), with slightly less blur on each, so the painted scenes read through clearly behind the text while the caption stays legible.

2 new targeted harness checks (60 → 62 total, all passing): the title's CSS no longer has an under-13ch max-width and does carry the overflow-wrap safety net; both caption box variants have alpha values meaningfully below their old (.66/.8) values.

## v0.75.11 — Fixed: Menu Background Photo Was Invisible (Real Bug)
Screenshots from real device play confirmed all 6 intro slides showing the real v0.75.10 art correctly — but the main menu background was still a flat dark gradient, no photo visible at all.

Root cause: `.landing-hero::before`, a leftover pseudo-element from before the photo existed (originally the flat placeholder sky/ground color the CSS-drawn moon/mountains/fortress used to sit on top of), still carried a fully **opaque** 3-stop gradient with `z-index:-4`. Per CSS stacking rules, a negative-z-index child of a `position:relative` parent paints *after* the parent's own background but *before* the parent's other content — meaning this opaque layer was painting directly on top of the new `background-image` on `.landing-hero` itself, completely hiding it. `.landing-hero::after` (the actual intended text-legibility scrim, `z-index:-1`) uses proper alpha transparency and was never the problem — `::before` had simply been forgotten when the photo was wired in during v0.75.10, since only the separate `.hero-landscape` decorative divs were addressed at the time, not this pseudo-element.

Fixed by clearing `::before`'s background entirely (`background:none`), letting the real photo show through with `::after`'s translucent scrim still darkening it for text legibility exactly as designed.

1 new targeted harness check (59 → 60 total, all passing) asserting `.landing-hero::before` doesn't carry an opaque background of any kind (not just checking for the one specific gradient that caused this bug, so a future accidental reintroduction of any opaque overlay here would also be caught).

## v0.75.10 — Real Painted Art: Menu Background + All 6 Intro Slides
The person generated real painted illustrations externally (matching the moody dusk-fantasy style established earlier) for the main menu background and all six intro slides, and sent them as a single comparison collage. Split the collage into 7 individual images via pixel-boundary detection (no manual cropping needed), verified each crop against the source, and wired all 7 into the game as embedded base64 JPEGs — keeping the single-file deployment model intact.

**Removed** all procedural CSS/SVG scenery that had been built for this purpose across v0.75.8–v0.75.9 (the layered mountains, veiled moon, pine treeline, winding path SVG, and lantern for the "road" scene, plus the flatter placeholder scenes for wilds/conflict/people/realm/heroic, plus the CSS-drawn moon/mountains/fortress/road/trees on the main menu) — all six intro slides and the menu background now use the same simple mechanism: a background-image CSS rule pointing at an embedded `data:image/jpeg;base64,...` URI, with the existing dark-scrim overlay and caption box working unchanged on top.

`landingSlideVisual()` collapsed from six separate per-scene HTML generators (plus the `pineTreeline()` helper) down to one `INTRO_ART` lookup table and a single generic render path — meaningfully simpler than what it replaced, not just prettier.

The seven source JPEGs are also kept in a new `art_source/` folder alongside `index.html` for reference/future re-editing, separate from the embedded copies.

**File size:** `index.html` grew from ~850KB to ~1.2MB with all 7 images embedded (JPEG, modest crop resolution ~500-1530px wide) — still a single portable file, no external assets or build step required.

2 new targeted harness checks (58 → 59 total, all passing): every intro scene renders with a distinct, real embedded image (not the retired procedural CSS) and none of the old scene-specific markers remain; and the main menu's CSS references the real embedded background image rather than the retired decorative divs.

**Known limitation:** the source images are native ~500×300px (intro slides) / ~1530×400px (menu), cropped from a lower-resolution collage rather than generated at full target resolution — they may look slightly soft when stretched to fill a large phone screen. Worth regenerating at higher native resolution later if that's noticeable in play.

## v0.75.9 — Intro Slide Rendering Hardened + Simplified
Bug report from actual browser play: the first intro slide ("The Old Road", the one upgraded in v0.75.8) flashed white and then jumped straight to slide 2 onward. Confirmed the v0.75.8 markup itself was syntactically valid and rendered correctly in this project's Node-based harness — but that harness stubs the DOM and cannot catch environment-specific rendering failures (e.g. mobile WebView quirks), so a real browser-only failure wasn't visible to the automated tests. Rather than leave that gap open, made two changes:
- **Hardened `renderFullScreenIntroSlide()`**: the call to build a slide's visual now runs inside a try/catch. If any scene's visual generator throws for any reason (this one or a future one), the slide falls back to a plain gradient background with just the caption text, instead of leaving `#introVisual` completely empty — which is what an unhandled exception was doing, and is almost certainly what produced the reported "flash of white": the overlay's dark shell was inserted, but the inner slide content never got set, showing through to the page's default background until the auto-advance timer (independent of whether the render succeeded) moved on to the next, unaffected slide.
- **Simplified the winding-path SVG**: removed the `<defs>`/`linearGradient`/`url(#id)` indirection in favor of a single solid-color stroke. Gradient references resolved via `url(#id)` on SVG injected through `innerHTML` (rather than parsed as part of the original document) are a known source of inconsistent behavior across browsers/WebViews — removing it eliminates one plausible trigger for the failure even without being able to reproduce the exact mobile environment here.
- Also cleaned up a redundant CSS rule on the path container (`left`+`right`+`width` all set at once, which is over-constrained).

1 new targeted harness check (57 → 58 total, all passing): forces `landingSlideVisual` to throw via monkeypatch and confirms `renderFullScreenIntroSlide()` still populates a non-empty, caption-bearing fallback instead of leaving the slide blank.

**Still open:** the exact root cause of the original failure in the person's browser hasn't been confirmed (no way to run a real browser in this environment to reproduce it directly) — this release defends against the symptom and removes a plausible cause, but the person should re-test to confirm the flash is gone.

## v0.75.8 — First Visual Art Pass: "The Old Road" Intro Scene
Direct follow-up to the visual-appeal feedback, scoped to a concrete starting point: the person shared a reference painting (moody dusk landscape — veiled moon, layered mountains, pine treeline, a winding path, a lit lantern on a signpost) and asked for that mood applied to the game's opening intro scene, which previously used flat two-tone gradient bands, a plain circle sun, a single zigzag hill silhouette, and a straight trapezoid road.

No image-generation tool is available in this environment, and the project's own art rule (`GUI_VISUAL_ROADMAP.md`) requires a license audit before shipping any sourced external graphic, plus the single-file/offline deployment model makes embedding raster assets awkward. So this pass is entirely CSS/SVG — no new files, no licensing exposure, no build step.

Rebuilt the `intro-scene-road` visual (used for the first intro slide, "The Old Road") from scratch:
- Multi-stop dusk sky gradient (deep navy → dusty blue-grey → warm amber near the horizon) replacing the old flat two-band split.
- A soft cloud-streak layer and a veiled moon (radial-gradient disc with a soft grey cloud wisp drawn over one edge) instead of a plain flat-color circle.
- Two depth-layered mountain silhouettes (a paler, lower-opacity far layer and a darker near layer) instead of one single zigzag hill shape, for actual atmospheric depth.
- A procedural pine treeline: a new `pineTreeline()` helper generates a row of small triangular pine silhouettes at deterministic (not random-per-render) positions, in two size/depth tiers, replacing the empty gap between hills and road.
- The straight trapezoid road replaced with a genuinely winding path, drawn as an inline SVG cubic-bezier curve with a top-to-bottom gradient stroke (lighter/distant to darker/near).
- A lantern-lit signpost (post, lantern box, and a warm radial-gradient glow halo) on the roadside, echoing the reference image's hanging lamp.
- The walking hero figure is preserved in place.

This scene is reused both in the compact intro-slide list (`.intro-visual`, ~290px) and the fullscreen cinematic intro (`.fullscreen-intro .intro-visual`, full viewport) without any markup changes — the new layers are all percentage/gradient-based so they scale to both contexts, matching how the original flat version worked.

1 new targeted harness check (56 → 57 total, all passing) asserting the new scene's markup contains the moon, both mountain layers, at least 6 procedural pine trees, the winding path SVG, and the lantern — a regression guard against silently reverting to the old flat placeholder.

**Scoped deliberately small:** only the "road" intro scene was touched. The other five intro scenes (`wilds`, `conflict`, `people`, `realm`, `heroic`) and in-game scene art (travel, dungeon, etc.) still use the original flat style, pending confirmation this direction lands well before extending it further.

## v0.75.7 — Weapon Wear Balance Fix + Ammo Recovery
Direct playtest feedback: "the game is genuinely fun, no big bugs, but weapons wear out too fast, and arrows should have a reasonable chance of being recovered from a fallen foe."

**Weapon wear was harsher than intended.** Every attack — hit or miss — cost the weapon 1 durability, and the -1 damage penalty kicked in as soon as the weapon dropped below 75% of max durability (roughly 11-12 swings on a typical starting weapon like a Spear or Longsword). Fixed both halves of this:
- Weapons (hero basic attack, Power Attack, Cunning Strike, Marked Shot, and companion basic attacks) now only take wear on a **successful hit** — a miss costs nothing.
- Loosened the penalty curve: `weaponConditionDamagePenalty` now stays at 0 until below 50% durability (was 75%), and `weaponConditionAccuracyPenalty` stays at 0 until below 15% (was 25%). Combined with hit-only wear, a weapon should feel fine for roughly 4x longer than before it's noticeably worn.

**Arrows (and bolts, sling bullets) had zero recovery chance.** Only magic ammunition with an "ammoReturn" enchantment had any chance of being recovered after firing — ordinary ammo was just gone the moment it was loosed, no matter how the fight ended. Added a `trackAmmoSpent()`/`recoverSpentAmmo()` pair: every shot fired (hero's basic attack, Marked Shot, or a companion's ranged attack) is tallied per encounter, and on any outcome where the party holds the field — plain victory, or a surrender resolved by accept/disarm/execute — roughly 55% of the ammo spent that fight is recovered and shown on the loot screen as "Recovered ammunition." Fleeing or losing the fight forfeits it, consistent with the existing fallen-companion-gear recovery rule from v0.75.4.

5 new targeted harness checks (51 → 56 total, all passing): the loosened penalty thresholds at key ratios; a direct hit-vs-miss wear comparison using a monkeypatched `roll()` for determinism; ammo tallying; a 1000-sample statistical check that recovery lands in a plausible 30-80% band and never exceeds what was spent; and that `resolveSurrender('accept')` now also routes to the loot screen purely because ammo was spent, even with no fallen companions (the arrows are the party's own property, not the enemy's, so they shouldn't ride on the surrender terms).

Also discussed: visual appeal / text density. A `GUI_VISUAL_ROADMAP.md` already exists in the project, deliberately deferred until "simulation architecture stabilizes." Holding off on that until scope (lightweight readability polish vs. the fuller tabbed-hub redesign the roadmap describes) is confirmed with the person.

## v0.75.6 — Travel Discoverability Fix
Reported as "without taking a quest there is no way to actually travel between towns." The feature already existed and worked correctly (`showTravelDestinations()`/`beginCityTravel()` have no quest requirement and were verified by direct simulation to list every region and travel freely), but it was genuinely hard to find: the actual "Travel" button lived inside the "Immediate" tab of the town action panel, which sat below the town-overview cards, a full Quest Board card, and a "Suggested Next Step" card that — with no quest active — always recommended "Find a New Quest." On a phone screen showing a handful of sentences at a time, that's several screens of scrolling past two separate quest-focused prompts before reaching a button that was never gated in the first place. Per the project's own discoverability law (a working-but-buried mechanic counts as a bug), added a prominent "🗺 Travel to Another City" button immediately below the town description — before any other card — so it's visible without scrolling regardless of quest state. The original Immediate-tab entry is untouched; this is purely additive. 1 new targeted harness check (50 → 51 total, all passing) asserting the Travel action's markup appears earlier in the rendered town HTML than the Quest Board section.

## v0.75.5 — Flee Warning for Abandoned Companion Gear
Following straight from v0.75.4: fleeing a battle already forfeits a fallen companion's gear (by design — it's only recoverable if the party holds the field), but the player had no warning before committing to that loss. Extracted the escape-check logic out of `combatAction('flee')` into a new `attemptFlee()` function, and added a gate in front of it: if `state.encounter.fallenCompanions` has any recoverable items, choosing "Flee Battle" now shows a confirmation modal naming exactly which companion(s) and which items will be abandoned for good, with "Flee Anyway" and "Reconsider" options — fleeing with no fallen companions on the field is completely unaffected and skips straight to the escape roll as before. 3 new targeted harness checks (50/50 total passing): the warning fires and names the gear when there's something to lose; the warning does not fire and the escape check proceeds directly when there isn't; and `attemptFlee()` (the extracted function called after confirming) still runs the real DEX-based escape logic.

## v0.75.4 — Companion Death Alert + Fixed a Real Loot-Loss Gap
A companion dying mid-fight only produced a log line, easy to miss compared to the hero's critical-HP warning modal. Also, while investigating, found that a dead companion's own gear was only actually merged into recoverable loot on a plain combat *victory* — if the enemy surrendered and the player chose Accept and Release, Disarm, or Execute, the companion's gear was silently lost forever (Accept skipped the loot screen entirely, so there was no recovery path at all in that case).
- `killCompanion()` now shows a modal ("☠ [Name] Has Fallen") the moment a companion dies, listing their carried weapon/armor/off-hand/items and stating plainly that this gear is recoverable if the party wins or resolves the fight through accept/disarm/execute, and lost only on flee or defeat.
- Added a shared `mergeFallenCompanionLoot()` helper and wired it into all three surrender resolutions (previously only `winCombat()` had it), so a companion's own gear is recoverable regardless of how the fight actually ends — it's the companion's property, not the enemy's, so it shouldn't ride on an unrelated mercy/execution choice.
- 6 new targeted harness checks (47/47 total passing) covering: `killCompanion()`'s recovery-item bookkeeping and modal; `mergeFallenCompanionLoot()`'s merge behavior; and specifically that `resolveSurrender('accept')` now routes to the loot screen when a companion died (previously it wouldn't) while leaving the no-death case's original no-loot-phase shortcut unchanged.

## v0.75.3 — First Real Playtest Bug Fixes (real bugs from an actual browser session)
The first human playtest of the v0.74–v0.75.2 content (Arrival Engine → Wren → Reeds quest → boss → permadeath) surfaced two real issues, one of which was a severe, silent, and permanent state-corruption bug.

**Fixed: the Arrival Engine's "help" choice permanently corrupted Greenmarch's reputation into `NaN`.**
`applyArrivalConsequence()`'s "help" branch wrote `state.world.reputations.greenmarch=(state.world.reputations.greenmarch||0)+1`, overwriting what is supposed to be a `{renown,fear,peakRenown,...}` object with a bare number. Every other reputation function (`regionRep`, `effectiveRenown`, `effectiveFear`, `reputationSpread`) expects the object shape, so from that point forward `.renown`/`.fear` reads off Greenmarch returned `undefined`, and any arithmetic on that produced `NaN` — permanently, since `NaN` never recovers on its own. This silently broke every CHA-based check performed while in a Greenmarch-region town (via `originSocialModifier()`, which reads `effectiveRenown()`/`effectiveFear()`), most visibly as a `DC NaN` / `Modifier NaN` roll on the very first quest-reward negotiation. Checks made outside town (`state.phase!=="town"`) were unaffected, which is why the very next Insight check on the road rolled fine — this made the bug intermittent-looking even though it was permanent.
- Fixed the "help" branch to call `adjustReputation(1,0,"greenmarch",0,"")`, which correctly updates the existing renown object through the same path every other reputation change in the game uses, instead of hand-rolling a broken shortcut.
- Added a self-healing repair pass inside `ensureWorldState()`: if any region's reputation entry is found to be a bare number (or otherwise not an object) — whether from this bug or any other future one — it's now converted into a proper `{renown,fear,...}` object instead of silently propagating `NaN` forever. This protects existing saves that already hit the bug, not just new campaigns.
- 4 new targeted harness checks (41/41 total passing): the "help" choice now produces a well-formed reputation object with finite `renown`/`fear`; a deliberately pre-corrupted (bare-number) save entry self-heals via `ensureWorldState()` back to finite values; `adjustReputation()` on Greenmarch correctly increments the existing object rather than replacing it; and the pre-existing "help choice" test (which had been asserting the *buggy* `=== 1` number as correct) was rewritten to assert the correct object shape.

**Investigated but not confirmed as a bug: back-row party members taking melee damage.**
Traced `enemyFormationTargetIds()` → `meleeFormationTargetIds()` directly against the production script: when a living front-row party member exists, a melee enemy's valid target pool is correctly restricted to front-row members only — confirmed via a direct harness reproduction with a back-row hero and a front-row companion, where the enemy's only valid target was the front-row companion. The game's own combat screen also explicitly states this rule to the player. Likely explanation for what was observed in the real session: the hero took the damage before repositioning to the back row (or in an earlier encounter), and the HP total simply carried forward. No code change made pending more specific reproduction detail (which round, or the exact log line) from further playtesting.

**Added: companion/hero armor now shown on the compact combat party cards.**
The "Give Items" / equipment screen already showed Weapon, Armor, and Off-Hand for a companion, but the compact party cards shown during combat (`heroCard`/`companionCards` in `renderCombat()`) only showed weapon and off-hand — armor was implied only through the Defense number, not named. Added the armor name (with any magic title) to both the hero's and each companion's combat card line, next to weapon and off-hand. Manually verified via a direct harness render of a combat scene (the harness intentionally doesn't assert on rendered HTML elsewhere — this project's testing discipline draws a line between engine-logic checks, which the harness covers, and UI/rendering, which needs an actual browser pass).

## v0.75.2 — Earlier Warning Thresholds + Party-Expansion Backlog
- Adjusted `heroConditionTier()` thresholds per the person's request: "Wounded" now triggers at 75% HP or below (was 50%), and the critical/modal warning now triggers at 50% HP or below (was 25%) — giving noticeably more lead time to react before things get dangerous.
- Updated the tier-bucketing test's example values to match the new boundaries.
- Logged a backlog item in `DESIGN_FOUNDATION.md`: party expansion via level/reputation, explicitly flagged as "for later" — two distinct directions noted (attached minions scaling with a companion's level, vs. raising the hardcoded 2-companion party cap), along with the concrete code location of that cap and the systems a cap-raise would touch (formation, turn order, card UI, balance). Logged now, not built now — per the Northstar's scope discipline, this is new systemic depth and needs a deliberate "yes, now" decision rather than being a default next step.

## v0.75.1 — No One-Shot Kills From Full Health (from the first real permadeath)
The first actual permadeath under v0.75.0 happened in a single blow — the hero was killed outright before the low-HP warning ever had a chance to fire, since the warning triggers on crossing into critical HP, and a one-shot kill from full health skips every tier in between. Player-proposed fix: if the hero is at full HP, no single attack can deal more than maxHP−1 damage — guaranteeing at least one hit of breathing room (and a guaranteed trip through the critical-HP warning) before death becomes possible. Deliberately scoped to full HP only — an already-wounded hero can still die in one hit, since by then they'd have already had a chance to see the warning from an earlier hit.
- Added `applyHeroDamageMercyCap(rawDmg)`: returns `maxHp-1` (capped) only when the hero was at full HP *and* the raw damage would have been lethal; otherwise passes damage through unchanged.
- Wired into both places an enemy can damage the hero: the main attack path (combining base damage and venom's bonus damage into one total before checking the cap, closing a loophole where venom alone could still push a "safely under the cap" hit into lethal territory) and the breath-weapon special attack.
- A capped hit gets its own distinct log message ("...but at full strength, [hero] barely survives, reeling at 1 HP") rather than silently changing the displayed damage number.
- Gear-wear calculation now correctly uses the actual (possibly capped) damage applied, not the theoretical uncapped amount.
- 2 new targeted harness checks (38/38 total passing): a hero at full HP survives a deliberately overwhelming hit at exactly 1 HP with no chronicle entry recorded, while an already-wounded hero taking the identical hit is correctly killed and recorded — confirming the cap is scoped exactly as intended.

## v0.75.0 — True Permadeath, Persistent Chronicle, and Mandatory Low-HP Warnings
A design tension flagged rather than silently resolved: the "no permanent soft-locks" pillar had been read as "no permanent character death," which quietly undercut the "every decision becomes part of your legend" pillar — a rescue-and-continue defeat mechanic has no real stakes for a chronicle game. Presented three concrete directions (raise the stakes on rescue / true permadeath / player-chosen toggle) with their trade-offs; the person chose true permadeath.
- **`defeat()` now ends the character permanently**, replacing the old "revives at 1 HP, loses half your coin, back to town" rescue mechanic.
- **New persistent Chronicle** (`CHRONICLE_KEY` in localStorage, independent of the per-campaign autosave — survives across hero deaths and new campaigns): every fallen hero gets a recorded epitaph — name, class, ancestry, level, cause of death, place, day, and which companions survived to carry word of it. Viewable from the landing page via "View the Chronicle."
- **The autosave is deliberately cleared on death** (`localStorage.removeItem(AUTOSAVE_KEY)`) so a fallen hero cannot be resumed by reloading — permadeath has to actually mean permanent.
- **Mandatory low-HP warning system, shipped in the same version as the death mechanic itself, not as a follow-up:** `heroConditionTier()` buckets the hero into healthy/wounded/critical/fallen; the combat HP display now shows a persistent "Wounded"/"Gravely Wounded" badge; and `maybeWarnCriticalCondition()` fires an unmissable one-time modal the moment the hero first crosses into critical HP during an encounter ("You Are Gravely Wounded... there is no rescue waiting on the road"), hooked into both combat-damage exit paths (`enemyAttack()` and the breath-weapon special path). Adding real stakes without fair warning would just be cruelty.
- Rewrote the test that depended on the old rescue behavior; added 4 new targeted checks (36/36 total passing) covering: permadeath replaces rescue, the chronicle entry persists across a real localStorage round-trip, HP-tier bucketing, and the warning firing exactly once per encounter.
- Updated `DESIGN_FOUNDATION.md`'s pillar list: pillar 1 now explicitly scopes "no soft-locks" to progression/mechanics, not survival; a new pillar 5 documents permadeath and the warning system as inseparable from each other.

## v0.74.0-alpha5 — Defeat/Rescue Clarity Fix (from a real player report)
A player reported: "I flee battle and failed the roll but fled anyway." Reproduced exactly via the harness — not a flee-logic bug. The actual sequence: hero was already critically hurt, failed the flee roll, the enemy's free "exposed" attack (which gets +2 accuracy for a failed flee) dealt enough damage to drop hero HP to/below 0, which correctly triggered the game's existing no-permadeath rescue mechanic (`defeat()`): HP reset to 1, half of coin lost, sent back to town. Working as designed — but it happened as an instant, silent phase change with no distinct visual beat, so it read exactly like "the flee somehow worked" instead of "you went down and got rescued." The player only realized what had actually happened by checking the character sheet and seeing 1 HP.
- **Fix:** `defeat()` now shows an explicit modal ("You Go Down") the player must acknowledge, naming the HP loss, the coin cost, and the reputation hit, before landing in town — matching the pattern the game already uses for dice-roll results, rather than a silent phase flip.
- 1 new targeted harness check (33/33 total passing) reproducing the exact reported scenario: an already-hurt hero, a failed flee roll, and confirming the outcome is the defeat/rescue path (town, 1 HP, halved coin, correct log message) rather than a successful escape.
- No underlying game logic changed — the mechanic was already correct. This is purely a communication fix.

## v0.74.0-alpha4 — First Playtest Fixes (real browser bugs, not harness-catchable)
Found by an actual human playing on a phone — exactly the category of bug a
stubbed-DOM harness cannot see, since it never lays anything out. Three
distinct CSS issues:
- **Approach/map scene captions collided with the action button below them.** `.approach-caption` and `.arrival-map-caption` were anchored only ~90px from the bottom, which is barely more than the button's own footprint — a caption long enough to wrap to 3 lines had its last line covered by "Approach the Gate"/"Follow the Road". Pushed both captions to `max(148px,20svh)` clearance.
- **The "choice" stage's kicker text ("Your first choice") collided with the Sound/Skip buttons pinned near the top of the screen**, since the scene content is vertically centered independent of those fixed buttons. Added `padding-top:112px` to `.arrival-scene` on narrow viewports so centered content can no longer render underneath the button cluster.
- **Recruit-screen candidate cards had no `overflow-wrap`/`word-break` rule anywhere in the stylesheet**, so a long unbroken name (Wren Halloway's surname) visibly overflowed the card into the neighboring grid cell instead of wrapping. Root cause was two-layered: added `overflow-wrap:break-word` (plus an `overflow:hidden` backstop) to `.card`, and separately fixed the underlying flexbox issue — `.hero-header-row`'s text container had no `min-width:0`, so flexbox's default `min-width:auto` was overriding the wrap rules and refusing to let the box shrink below the word's content width in the first place.

No JS/logic changes — CSS only, so the existing 32/32 test suite is unaffected and unchanged. This is exactly the class of bug the harness is structurally unable to catch (it never renders layout), which is why the Northstar calls a human playtest the necessary next step rather than "more tests."

## v0.74.0-alpha3 — Fenreach Vertical Slice: Wren's Secret Reveal
- Added `revealWrenSecretAtReedsClimax()` — a guaranteed, narratively-timed payoff for recruiting Wren, distinct from the existing generic loyalty-RNG secret reveal (which would fire eventually but not necessarily at the moment it means something). When the reeds-quest boss falls with Wren in the party, she finds proof of what happened to her patrol and confirms her secret on the spot, with a small loyalty gain.
- Tagged the quest with `storyId:"reedsQuest"` (matching the existing companion `storyId` pattern) so this and future climax-specific logic can identify it without magic-string place comparisons.
- 4 new targeted harness checks (32/32 total passing): the reveal fires correctly through the full `winCombat()` path, and is correctly guarded against firing without Wren present, for other quests, or a second time.
- **Caught during testing:** an early version of the test itself had an aliasing bug (comparing a mutated object against itself) that would have silently passed for the wrong reason — fixed before shipping.

## v0.74.0-alpha2 — Fenreach Vertical Slice: First Quest, Dungeon, and Boss
- Added `generateReedsQuest()` — "What the Reeds Took," the first handcrafted quest. Patron and twist branch on the arrival-choice and companion-recruitment flags already tracked (`deserterRecruited`, `merchantRescued`), so the opening choices from v0.72 finally pay off.
- Wired into `confirmCompanions()` as the initial quest offer for every new campaign, replacing the random `generateQuest()` call.
- The quest's `foe` ("a revenant of the drowned patrol") flows through the existing `dungeonEnemyFor()` engine unmodified, producing a named undead boss with the fanatical trait — no new dungeon or combat code needed. This means the quest, dungeon, and boss milestones are delivered together, riding on the same tested procedural engine the troll-bounty and rescue quest types already use.
- **Resolved the Alderwick/Fenreach naming inconsistency** flagged in the design doc: renamed every Arrival Engine reference to the destination town (button text, narration, map label, character-creator dialogue, log messages) from "Fenreach" to "Alderwick," matching the already-tested settlement lore. The unrelated world region literally named "Fenreach" (with its own town, Mirecross) was left untouched — it was never part of the confusion.
- 8 new targeted harness checks (28/28 total passing): quest shape/engine-compatibility, all three patron branches, the combined-threads twist text, boss-enemy derivation from `quest.foe`, and an end-to-end simulation confirming that winning combat against the boss correctly advances the quest objective and routes to `questEnd` — the actual link between this new content and the existing generic engine.
- **Known gap:** the quest's `placeId` ("flooded_watchtower") has no matching atlas-location entry, so `bindQuestToAtlas()` currently no-ops for it — no map marker appears. Low-risk to add later; not blocking.

## v0.74.0-alpha1 — Fenreach Vertical Slice: First Companion
- Added Wren Halloway, the Watch Deserter — the first handcrafted (non-randomized) companion, always offered as one of the four initial recruit candidates.
- **Caught and fixed:** the character was originally named "Corran Ashe," one letter off from "Corren" in the existing random `NAMES` pool — the two could appear side by side in the recruit screen and read as a typo. Renamed before this went further, since every future quest reference to this companion inherits the name.
- Fixed goal, fear, boundary, and secret (not drawn from the generic pools) anchor the upcoming vertical-slice quest: Wren knows what happened to their patrol in the marsh and hasn't told anyone.
- Recruit screen flags Wren as a story character rather than a random pick.
- Added `state.flags.deserterRecruited` / `deserterMet`, tracked at party formation, for the upcoming quest branch to read regardless of whether the player recruits them.
- 4 new targeted harness checks (20/20 passing): fixed-narrative fields survive `normalizeCompanion()`, and `confirmCompanions()` correctly tracks recruitment either way.
- **Known gap (pre-existing, not introduced here):** the package has no `DESIGN_FOUNDATION.md`, despite that being one of the four standard deliverable docs. Flagged for a follow-up pass, not blocking this feature.

## v0.73.2-sync — Process & Version Sync
- Diagnosed and closed a 13-version test-report gap (v0.70 through v0.73.2 shipped with no test coverage; last report was v0.69.0).
- Fixed five independent stale-version-string locations that had drifted out of sync: `<title>` tag, initial `state.version`, `normalizeState()`'s version stamp, three save-payload constructors, and a player-visible load message that literally said "rules version 0.65.0."
- Introduced a single `GAME_VERSION` constant; every version-label location in the app now reads from it instead of a hand-typed literal, so this class of drift can't recur silently.
- Confirmed `state.version` is a display/label field only (no migration logic branches on it), so this was a data-accuracy fix, not a save-compatibility risk.
- Added a packaged Node test harness (`tests/harness.js`, `tests/run_tests.js`) that loads the production script into a stubbed-DOM `vm` context and backfills 16 targeted checks for the previously-untested Arrival Engine (stage sequencing, both opening-choice consequence branches, idempotency guard) and the provisions rebalance (stock seeding, purchase flow, forage DC). All 16 pass.

## v0.73.2
- Added a dedicated, always-visible Journey Supplies stall at the top of the market Buy tab.
- Added guaranteed inn pantry purchase buttons backed by repaired staple stock.
- Existing saves now replenish missing or zero provision stock when a market or inn opens.
- Added visible v0.73.2 venue badges so testers can confirm the correct build is open.

# v0.73.1 — Food Availability & Mobile Layout Hotfix

- Added save migration that seeds Journey Supplies into pre-existing town markets.
- Added standalone inn meals without requiring a room.
- Added inn pantry purchases for 1, 3, or 7 Journey Supplies.
- Disabled sticky campaign toolbars on phone-width screens to prevent venue overlap.

# v0.73.0-food-test — Provision Rebalance

- Reframed Rations as lightweight Journey Supplies while preserving save compatibility.
- Reduced base price to 4 silver per person-day and increased normal town stock.
- Limited ordinary regional scarcity inflation for staple provisions.
- Foraging now takes 1 hour, uses DC 9, normally yields at least one full party-day plus skill benefit, and can return a partial yield on an ordinary failure.
- Expanded hunger into Well Fed, Peckish, Hungry, Very Hungry, Famished, and Starving stages. Serious loyalty loss begins at Famished; HP loss begins at Starving.
- Inn rest now includes supper, breakfast, and next-day provisions for 3 gold.
- HUD and warning text now emphasize Journey Supplies rather than ration micromanagement.

# v0.72.0

## Arrival Experience — Release Candidate

- Completed the full opening journey from cinematic intro to narrative character creation.
- Added optional procedural ambient sound using the browser Web Audio API.
- Added a visible Sound On/Off control and smooth audio fades by scene.
- Added scene-exit transitions, subtle storm-light effects, film grain, and mobile safe-area refinements.
- Added reduced-motion and reduced-data performance fallbacks.
- Preserved opening-choice consequences, save/load behavior, and the original creator fallback.

# v0.72.0-alpha6

- Replaced the post-arrival scroll-to-form handoff with a full-screen narrative character creator.
- Added guided scenes for name, calling, ancestry, culture, background, optional cleric faith, and final review.
- Added responsive option cards, progress indicator, back navigation, and classic-creator fallback.
- Preserved the existing stat rolling, equipment, origin logic, opening consequence, recruitment, save/load, and autosave systems.

# v0.72.0-alpha5

- Added a dedicated consequence stage after the first arrival choice.
- Helping the merchant now grants +1 Greenmarch reputation, +1 karma, a Bandage, and a Merchant's Trade Token, while advancing arrival time by two hours.
- Continuing to Fenreach now records the Roadside Disappearances lead and preserves arrival time.
- Consequences are applied once, after the hero is created, and persist in saves.
- Updated the opening choice text to make the tradeoff visible before selection.

# v0.72.0-alpha5

- Added a data-driven dynamic opening narration layer.
- Arrival text now adapts to the currently selected calling and background.
- Seasonal and regional rainfall conditions alter weather, sky, and road language.
- Map, settlement approach, narration, and first-choice text share one generated arrival context.
- Existing arrival stages, choice storage, character creation, and save/load flow remain intact.

## v0.72.0-alpha4
### Settlement approach and zoom transition
- Added a sixth Arrival Engine stage between the animated realm map and narration.
- Added a cinematic forward camera push toward Fenreach's gate.
- Added layered marsh, road, rain, clouds, walls, towers, rooftops, and flickering gate lights.
- Added reduced-motion behavior and retained manual Continue/Skip controls for testing.
- Existing opening choice and character-creation handoff remain intact.

# v0.72.0-alpha1 — Arrival Engine Foundation

- Added a full-screen `ArrivalEngine` state machine launched by **Begin a New Chronicle**.
- Added five testable stages: opening fade/title, chapter card, placeholder realm map, arrival narration, and first choice.
- Added a temporary Continue control at each stage for deterministic testing.
- Added Skip Arrival and reduced-motion-safe transitions.
- Records the opening choice in `state.flags.arrivalChoice`.
- Hands off cleanly to the existing character creator.
- Existing intro, autosave, character saves, and campaign saves remain unchanged.

# Changelog

## v0.71.0
- Rebuilt the landing page as a full-height illustrated hero instead of a two-column form-first layout.
- Made Begin a New Chronicle the dominant first action.
- Continue Chronicle now appears only when a valid autosave exists.
- Moved load, import, and replay controls into a quieter secondary utility row.
- Moved character creation below the first viewport and added smooth navigation into setup.
- Added responsive fantasy landscape artwork using self-contained CSS, with no external image dependency.
- Improved mobile stacking, tap targets, safe first-screen composition, and setup readability.


## v0.66.0
### Political agendas, influence & leadership drift
- Added persistent institution agendas with momentum across budget years.
- Institutional influence now drifts from repeated wins/losses, satisfaction, agenda momentum, faction backing, and active scandals.
- Existing regional factions can support or undermine aligned institutions without inventing new factions.
- Sustained influence dominance can create persistent regional leadership eras (Resilience, Commerce, Security, Welfare).
- Leadership philosophy modestly biases future budget contests while objective crises and rival blocs still matter.
- Severe opposition dissatisfaction under a dominant bloc can generate institutional scandal World Facts that weaken future influence.
- Regional finance summary now exposes the current leadership era.

## v0.65.0
### Institutional politics & contested budgets
- Added institution-specific budget preferences and persistent satisfaction/influence state.
- Annual regional priority is now chosen through a scored institutional budget contest rather than a single global optimization function.
- Winning institutions gain satisfaction; losing institutions can become dissatisfied over repeated budget defeats.
- Close/divided votes can create `institutionalPolitics` World Facts.
- Added fact-derived mediation quests for contested budgets and normal quest-resolution support.
- Asset maintenance is now prioritized politically under treasury scarcity.
- Capital project selection can follow adopted political priorities when no urgent condition dictates a project.
- Regional dashboard exposes budget-politics summary.

## v0.64.0
### Institutional budgets, maintenance, and political priorities
- Added persistent regional institutional treasuries and annual revenue.
- Added dynamic political priority selection: resilience, commerce, security, or welfare.
- Institutional projects now require capital budget; prosperity still bears opportunity cost during construction.
- Completed resilience projects now track condition and annual upkeep.
- Deferred maintenance lowers asset condition and can erode preparedness/infrastructure benefits.
- Dashboard/resilience views expose treasury, priority, under-maintained assets, asset condition, and upkeep.

### Field Magic
- Added out-of-combat healing and cleansing spellcasting for hero and caster companions.
- Field casting targets any living party member, consumes normal spell points/reagents, uses spell mastery, and costs 10 campaign minutes.
- Added affliction storage migration for hero/companions.
- Added Cleric `Purifying Litany` and Wodewose `Cleansing Sap` cleanse paths.
- Field healing/cleansing does not automatically create fame.

### Future UI track
- Added a documented future plan for tabbed navigation and licensed/free-use travel, forage, and combat visuals.


## v0.68.0
- Rebuilt the landing page into a stronger title-screen presentation.
- Added a 6-panel animated graphic-novel-style intro slideshow.
- Added replay / next / previous intro controls and autoplay preference.
- Kept New Game / Continue Autosave / Load access on the landing page for faster entry.


## v0.69.0
- Added Adventure Focus mode.
- Added collapsible Character and DM Journal side panels with persistent UI preferences.
- Simplified the campaign HUD into primary and secondary status tiers.
- Added clearer icon-labeled navigation.
- Condensed town context into summary cards and expandable detail sections.


## v0.72.0-alpha2
### Animated realm map and travel route
- Replaced the temporary CSS map with a responsive inline SVG realm map.
- Added a cinematic route-drawing animation ending at Fenreach.
- Added restrained parchment drift, cloud movement, terrain marks, region labels, and a destination pulse.
- Added reduced-motion behavior that displays the completed route without animation.
- Preserved the five-stage Arrival Engine and existing character-creation handoff.
