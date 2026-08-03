# Test Report — v0.73.2 (backfill covering v0.70–v0.73.2)

## Why this report exists
Test reports stopped being written after v0.69.0. Thirteen versions shipped
without one: the landing-page rebuild (v0.70–v0.71), the six-stage Arrival
Engine alphas (v0.72.0-alpha1–alpha6), the v0.72.0 release, and the
provisions/food rebalance (v0.73.0 → v0.73.1 → v0.73.2, two of which were
hotfixes). This report backfills that gap and re-establishes the per-version
test-report discipline.

## Production syntax
- Extracted production inline JavaScript: `node --check` — PASS.

## Version-sync audit (found during this pass, now fixed)
Five independent places had drifted out of sync with the actual shipping
version, because nothing forced them to update together:

| Location | Was | Now |
|---|---|---|
| `<title>` tag | `v0.71.0` | Set from `GAME_VERSION` |
| `freshState().version` | `0.72.0-alpha5` | `GAME_VERSION` |
| `normalizeState()` version stamp | hardcoded `"0.70.0"` on every load | `GAME_VERSION` |
| Autosave / campaign / character save payloads | hardcoded `"0.70.0"` | `GAME_VERSION` |
| Player-visible load message | *"migrated to rules version 0.65.0"* | `GAME_VERSION` |
| Market / Inn venue badges | hardcoded `v0.73.2` | `` v${GAME_VERSION} `` |

**Fix:** introduced a single `const GAME_VERSION="0.73.2"` at the top of the
script; every location above now reads from it instead of a hand-typed
literal. `document.title` is also set from it at load. Confirmed via
targeted harness checks below that `state.version` (fresh state and after
`normalizeState()`) and `document.title` all now agree.

**Note:** `state.version` was confirmed to be a display/label field only —
no migration branch anywhere reads it to gate logic — so this was a data-
accuracy bug (wrong info in exports, save summaries, and the load-confirmation
message), not a functional/save-corruption bug.

## Targeted runtime harness (new — backfills v0.70–v0.73.2)
Built a Node harness that loads the extracted production script into a
stubbed-DOM `vm` context (localStorage, document, window stubs) and exercises
real functions directly, following the existing stubbed-DOM harness pattern.

PASS (16/16):
1. `GAME_VERSION` constant is `0.73.2`.
2. `freshState().version` matches `GAME_VERSION`.
3. `normalizeState()` stamps `state.version` to `GAME_VERSION`, not a stale literal.
4. `normalizeState()` is correctly a no-op before a hero exists.
5. `document.title` reflects `GAME_VERSION`.
6. `ARRIVAL_STAGES` sequence is exactly `fade → title → map → approach → narration → choice → outcome`.
7. `ArrivalEngine.choose('help')` records the choice and jumps to the `outcome` stage.
8. `ArrivalEngine.skip()` marks `arrivalChoice` as `"skipped"`.
9. Helping the merchant (`applyArrivalConsequence`, `'help'`) grants +1 reputation, +1 karma, +2 hours, a Bandage, a Merchant's Trade Token, and +1 Greenmarch reputation.
10. Continuing to Fenreach (`'continue'`) records the roadside-disappearances lead and the pre-storm-arrival flag without spending time.
11. `applyArrivalConsequence()` is idempotent — will not re-apply if `arrivalConsequenceApplied` is already true.
12. `ensureProvisionStock()` seeds Journey Supplies stock (18–30 range) when a town market predates the food rebalance.
13. `ensureProvisionStock()` leaves existing positive stock untouched.
14. `buyProvisionBundle()` moves stock from market to hero inventory and spends coin correctly.
15. `buyProvisionBundle()` refuses to sell more than the market has in stock.
16. `forage()` still uses WIS DC 9 per the documented v0.73.0 rebalance.

## Limitation
This harness stubs the DOM well enough to reach game-logic functions
directly; it is not a full browser/UI automation pass (no visual
verification of the Arrival Engine's animated map, settlement approach, or
narrative character-creator scenes). Those remain manually reviewed only.
The harness now ships with the package under `tests/` — run with
`node tests/run_tests.js` from the package root.

---

# Test Report — v0.74.0-alpha1 (Fenreach Vertical Slice: First Companion)

## Production syntax
- Extracted production inline JavaScript: `node --check` — PASS.

## What shipped
- `generateWatchDeserter()` — Wren Halloway, the first handcrafted companion. Fixed goal/fear/boundary/secret (not drawn from the generic pools), always offered as one of the four initial recruit candidates.
- Recruit-screen caption distinguishing Wren as a story character.
- `state.flags.deserterRecruited` / `deserterMet`, set in `confirmCompanions()`, so the upcoming quest can branch on whether the player recruited them.

## New targeted harness checks (4 new, 20/20 total passing)
1. `generateWatchDeserter()` produces the fixed narrative fields (name, role, class, goal, secret) rather than randomized ones.
2. Those fixed fields (`storyId`, `goal`, `secret`, `boundary`) survive being passed back through `normalizeCompanion()` unchanged.
3. `confirmCompanions()` sets `deserterRecruited=true` and adds Wren to the party when selected.
4. `confirmCompanions()` sets `deserterRecruited=false` and correctly leaves Wren out when passed over — the flag distinction the quest branch depends on.

## Not yet covered
- No UI/visual check of the recruit screen rendering (caption text, layout).
- The quest, dungeon, and boss that this companion sets up do not exist yet — `deserterRecruited`/`deserterMet` are currently write-only (no reader).

---

# Test Report — v0.74.0-alpha2 (Fenreach Vertical Slice: First Quest, Dungeon, Boss)

## Production syntax
- Extracted production inline JavaScript: `node --check` — PASS.

## What shipped
- `generateReedsQuest()` — "What the Reeds Took," the first handcrafted quest, wired as the initial offer in `confirmCompanions()`.
- Patron and twist branch on `deserterRecruited` / `merchantRescued` (four distinct combinations), giving the opening arrival choice and companion recruitment real narrative payoff for the first time.
- Confirmed the quest rides entirely on the existing story/site quest engine — no new dungeon-generation or combat code was needed. `dungeonEnemyFor("objective", quest)` correctly turns `quest.foe` ("a revenant of the drowned patrol") into a named, undead-classified, fanatical boss.
- Resolved the Alderwick/Fenreach naming inconsistency flagged in `DESIGN_FOUNDATION.md` — all Arrival Engine references to the destination town now say "Alderwick." The unrelated world region named "Fenreach" (with its own town, Mirecross) was left untouched.

## New targeted harness checks (8 new, 28/28 total passing)
1. `generateReedsQuest()` produces a well-formed `site`-objective quest (place, foe, questType, local origin/target region, positive reward) compatible with the existing engine's expectations.
2. Patron branches to Wren Halloway when the deserter was recruited.
3. Patron branches to "the watch sergeant" when neither flag is set (arrival skipped, or continued without recruiting Wren).
4. Patron branches to "the rescued merchant" when only `merchantRescued` is set.
5. Twist text references both threads ("same causeway") when both flags are set together.
6. `dungeonEnemyFor("objective", quest)` correctly derives a named, undead-kind, fanatical boss from the quest's `foe` string.
7. **End-to-end:** `generateDungeonSite()` builds the full expected room graph (entrance/guard/water/stores/refuse/shrine/objective) for the reeds quest, with the boss correctly placed in the objective room.
8. **End-to-end:** simulating `winCombat()` against the reeds-quest boss (with the boss enemy and `state.encounter` set up exactly as `renderDungeon()` would) correctly advances `quest.objective.current` to `required` and routes `state.afterLootPhase` to `"questEnd"` — the actual link between this new content and the existing generic engine, verified directly rather than assumed.

## Not yet covered
- No UI/visual check of the quest-offer screen, dungeon rooms, or boss combat rendering.
- `placeId:"flooded_watchtower"` has no matching atlas-location entry yet, so the quest doesn't produce a map marker — flagged as a known gap in the changelog.
- The final reward/turn-in step (`completeReadyQuest`) was not separately tested here — it's shared, generic code already exercised by every other quest type in the game, not new content introduced by this quest. The full manual chain (accept → travel → clear non-boss rooms → fight the boss via actual turn-based combat RNG → loot → questEnd choice → travel home → turn in) has still not been played by a human.

---

# Test Report — v0.74.0-alpha3 (Wren's Secret Reveal)

## Production syntax
- Extracted production inline JavaScript: `node --check` — PASS.

## What shipped
- `revealWrenSecretAtReedsClimax()` — fires when the reeds-quest boss is defeated with Wren in the party. Guaranteed (not RNG-gated like the existing generic `maybeRevealCompanionSecret()`), tied to the specific moment the patrol's fate is confirmed.
- Quest tagged with `storyId:"reedsQuest"` for climax-specific logic to key off, avoiding string-matching on `place`/`task` text.

## New targeted harness checks (4 new, 32/32 total passing)
1. Full `winCombat()` integration: with Wren in the party and the reeds-quest boss reduced to 1 HP, winning correctly sets `secretRevealed=true` and grants +1 loyalty.
2. Guard: does nothing (no throw) when Wren isn't in the party.
3. Guard: does nothing for any quest other than the reeds quest (`storyId` mismatch).
4. Guard: idempotent — calling it again with `secretRevealed` already true does not re-grant loyalty.

## Caught during this pass
An early version of check #1 compared `finalWren.loyalty === wren.loyalty + 1`, but `wren` and the companion object inside `state.companions` are the same reference — so `wren.loyalty` had already been mutated by the time of comparison, making the assertion compare a value against itself plus one of itself (a bug that would have failed loudly here, but is exactly the kind of aliasing mistake that can silently pass in a differently-shaped test). Fixed by capturing `loyaltyBefore` prior to calling `winCombat()`.

## Not yet covered
- No UI/visual check of how the reveal message renders in the actual game log.
- Still no human playthrough of any part of this quest chain.

---

# Test Report — v0.74.0-alpha4 (First Playtest Fixes)

## Production syntax
- Extracted production inline JavaScript: `node --check` — PASS.
- No JS logic changed this pass — CSS only.

## Source
Found by an actual human playtest on a phone (three screenshots), not by the
harness — which is expected, since the harness never lays anything out or
renders CSS. This is the first real-world validation of the layout code the
harness could never have covered.

## Bugs found and fixed
1. `.approach-caption` / `.arrival-map-caption` were anchored only ~90px
   from the screen bottom — barely more than the action button below them
   occupies. A caption long enough to wrap to 3 lines had its last line
   covered by the button. Increased clearance to `max(148px,20svh)` on both.
2. The "choice" stage's kicker text ("Your first choice") rendered
   underneath the Sound/Skip buttons pinned near the top of the screen,
   since scene content is vertically centered independent of those fixed
   controls. Added `padding-top:112px` to `.arrival-scene` on narrow
   viewports.
3. Recruit-screen candidate cards had no `overflow-wrap`/`word-break` rule
   anywhere in the stylesheet, so a long unbroken name overflowed visibly
   into the neighboring grid cell. Two-layered root cause: added
   `overflow-wrap:break-word` + `overflow:hidden` to `.card`, and separately
   fixed the underlying flexbox issue (`.hero-header-row`'s text container
   had no `min-width:0`, so flexbox's default `min-width:auto` was
   overriding the wrap rule and refusing to let the box shrink in the first
   place — the CSS equivalent of fixing the symptom without the cause).

## Regression check
Ran the full harness suite (32/32 passing) to confirm no JS behavior
regressed — expected, since these were CSS-only changes, but confirmed
rather than assumed.

## Not yet covered
- These three fixes have not been re-verified in an actual browser by a
  human yet — they were diagnosed and patched from screenshots and CSS
  inspection. The next playtest pass should specifically re-check these
  three screens.
- No other screens have been playtested yet (dungeon rooms, combat, loot,
  quest resolution, character creator).

---

# Test Report — v0.74.0-alpha5 (Defeat/Rescue Clarity Fix)

## Production syntax
- Extracted production inline JavaScript: `node --check` — PASS.

## Source and diagnosis
Player report: "I flee battle and failed the roll but fled anyway." Two rounds
of clarifying questions plus a direct harness reproduction pinned this down
precisely — NOT a flee-logic bug. Sequence: hero already critically hurt →
failed flee roll → the enemy's free "exposed" attack (a real mechanic: failed
flee grants the enemy +2 accuracy) dealt enough damage to drop hero HP to/
below 0 → the game's existing no-permadeath `defeat()` mechanic correctly
fired: HP reset to 1, half of coin lost, reputation -1, sent to town. This is
by design (matches the "no permanent soft-locks" pillar). The actual problem:
it happened as an instant, silent phase change, so it read exactly like a
successful flee rather than "you went down and got rescued." The player only
discovered what had happened by manually checking the character sheet's HP.

## Fix
`defeat()` now shows an explicit acknowledgment modal ("You Go Down") naming
the HP loss, coin cost, and reputation hit, before the town screen renders —
consistent with how the game already surfaces dice-roll results, rather than
a silent state change the player has to reverse-engineer.

## New targeted harness check (1 new, 33/33 total passing)
Reproduces the exact reported scenario end-to-end: hero at 3/13 HP, a real
dungeon encounter, `combatAction("flee")` with a forced-failure roll via
`window._rollCallback(false, ...)` (simulating clicking Continue on a failed
roll modal), confirming the result is `phase==="town"`, `hero.hp===1`, coin
correctly halved, and the defeat log message present — i.e., confirming this
is the defeat/rescue path, not an escape.

## Method note
No underlying game logic was changed — the mechanic was already correct.
This is the first bug in this project traced through a structured back-and-
forth with the person (two rounds of targeted clarifying questions) rather
than found directly via a screenshot or code inspection alone, and then
confirmed by reproducing the exact reported numbers (1 HP, halved coin) in
the harness before writing any fix.

---

# Test Report — v0.75.0 (True Permadeath, Persistent Chronicle, Low-HP Warnings)

## Production syntax
- Extracted production inline JavaScript: `node --check` — PASS.

## Design context
This version resolves a real tension between two existing pillars rather
than a bug fix: "no permanent soft-locks" (pillar 1) had been implemented in
a way that also meant "no permanent character death" (a rescue-on-defeat
mechanic), which quietly worked against "every decision becomes part of your
legend" (pillar 4). Three directions were presented to the person with their
trade-offs; true permadeath was chosen. See `DESIGN_FOUNDATION.md` for the
updated pillar language and `NORTHSTAR.md` for this logged as a worked
example of the "surface tension, don't silently resolve it" practice.

## What shipped
1. `defeat()` rewritten: no more HP-to-1 revival. Records a permanent
   Chronicle entry (`recordChronicleDeath`), clears the autosave so the
   fallen hero can't be resumed, and shows a memorial modal offering to
   begin a new hero.
2. Persistent Chronicle storage (`CHRONICLE_KEY`, separate from the
   per-campaign `AUTOSAVE_KEY`) — survives hero death and new campaigns.
   Viewable via "View the Chronicle" on the landing page.
3. Mandatory low-HP warning system shipped in the same version:
   `heroConditionTier()` (healthy/wounded/critical/fallen), a persistent
   condition badge on the combat HP display, and `maybeWarnCriticalCondition()`
   — an unmissable one-time modal the instant the hero first crosses into
   critical HP in a given encounter. Hooked into both places hero HP can
   drop from an enemy's turn (`enemyAttack()`'s standard path and the
   breath-weapon special path).

## Test changes
The v0.74.0-alpha5 test asserting the old rescue behavior (town, 1 HP,
halved coin) no longer describes reality and was replaced. New checks
(4 new, 36/36 total passing):
1. The exact previously-reported scenario (already-hurt hero, failed flee,
   fatal exposed hit) now correctly results in permadeath: hero HP reflects
   real lethal damage (not revived to 1), and a chronicle entry with the
   correct name/cause/place/epitaph text is recorded.
2. `recordChronicleDeath()`/`loadChronicleLog()` round-trip through the
   harness's real (in-memory-stubbed) `localStorage` correctly, confirming
   persistence isn't just an in-memory illusion within a single call.
3. `heroConditionTier()` correctly buckets all four HP ranges.
4. `maybeWarnCriticalCondition()` fires exactly once when HP first crosses
   into critical territory within an encounter, and does not re-fire or
   error on a second call.

## Caught during this pass
Two of my own test-authoring mistakes, both fixed before shipping (not
silently corrected):
- First draft of the permadeath test asserted `hero.hp === 3` (the
  pre-damage value), assuming the hero object would be left untouched.
  Actually the correct behavior is that HP reflects the real lethal damage
  (it read -5) — fixed the assertion to `hp <= 0`, which is what actually
  matters (confirming no artificial revival, not preserving a specific
  stale number).

## Not yet covered
- No human playtest of the actual death flow, the memorial modal, or the
  Chronicle log screen in a browser.
- The persistent Chronicle has not been tested for growth/display beyond a
  couple of entries (no pagination or capacity concerns expected at normal
  play volume, but untested at scale).

---

# Test Report — v0.75.1 (No One-Shot Kills From Full Health)

## Production syntax
- Extracted production inline JavaScript: `node --check` — PASS.

## Source
Direct consequence of the player's first real permadeath under v0.75.0: it
happened in a single blow from full health, so the critical-HP warning
(which fires on *crossing into* critical HP) never got a chance to trigger —
a one-shot kill skips every tier the warning watches for. Player proposed
the fix directly: cap a single attack's damage to maxHP−1 when — and only
when — the hero was at full HP before the hit.

## What shipped
- `applyHeroDamageMercyCap(rawDmg)`: full HP + would-be-lethal → returns
  `{dmg: maxHp-1, capped: true}`. Any other case (not at full HP, or damage
  that wouldn't be lethal anyway) → passes `rawDmg` through unchanged.
- Wired into the main enemy-attack path, combining base damage and venom's
  bonus damage into a single total before the cap check — otherwise venom
  alone could push a hit that looked safely under the cap into lethal
  territory after the fact.
- Wired into the breath-weapon special attack path as well (the only other
  source of hostile hero damage in the codebase — confirmed via a full grep
  for `hero.hp-=` before considering this complete).
- Capped hits get distinct, honest log text rather than silently changing
  the displayed damage number to something that didn't actually happen.
- Gear-wear now scales off the actual applied (possibly capped) damage.

## New targeted harness checks (2 new, 38/38 total passing)
1. A hero at full HP (13/13), hit by an enemy dealing deliberately
   overwhelming damage (a d999 to make RNG irrelevant), ends at exactly 1 HP
   with no chronicle entry recorded and the encounter still active — the
   mercy cap engaged correctly.
2. An already-wounded hero (5/13), hit by the identical overwhelming
   attack, is correctly killed and a chronicle entry is recorded — confirming
   the cap is scoped exactly to "at full HP," not blanket damage reduction.

## Not yet covered
- No human playtest of the mercy-cap message or the resulting 1-HP combat
  state in a browser.

---

# Test Report — v0.75.2 (Earlier Warning Thresholds + Backlog)

## Production syntax
- Extracted production inline JavaScript: `node --check` — PASS.

## What changed
`heroConditionTier()` thresholds adjusted per direct request: wounded at
<=75% HP (was <=50%), critical/modal warning at <=50% HP (was <=25%). No
other logic changed — `maybeWarnCriticalCondition()` and the mercy cap both
consume this function's output and needed no changes themselves.

## Test changes
Updated the tier-bucketing test's example values to land correctly under
the new boundaries (previous examples, e.g. 40% HP, would now bucket
differently than the test originally asserted). All other tests unaffected;
re-ran full suite to confirm — 38/38 passing.

## Non-code change
Logged a party-expansion backlog item in `DESIGN_FOUNDATION.md` per the
person's request — not built this pass, deliberately deferred with context
preserved (two directions, current hardcoded cap location, systems a
cap-raise would touch).

---

# Test Report — v0.75.3 (First Real Playtest Bug Fixes)

## Production syntax
- Extracted production inline JavaScript: `node --check` — PASS.

## Source
First human browser playtest of the v0.74–v0.75.2 vertical slice. Reported: (1) a `DC NaN` / `Modifier NaN` dice roll on the first quest-reward negotiation, (2) a back-row party member appearing to take melee damage, (3) a request to see companion armor alongside weapon/off-hand on party cards.

## Bug 1 — confirmed and fixed: Arrival Engine "help" choice corrupts Greenmarch reputation to NaN
Root-caused by direct reproduction against the production script via the Node harness (not guesswork): `applyArrivalConsequence()`'s "help" branch assigned a bare number to `state.world.reputations.greenmarch`, where every other reputation function expects a `{renown,fear,peakRenown,...}` object. Confirmed via harness that after this branch runs, `effectiveRenown("greenmarch")`, `effectiveFear("greenmarch")`, and `skillBonus("CHA",...)` all evaluate to `NaN` — and confirmed this only manifests for CHA checks made in-town (`originSocialModifier()` short-circuits to 0 outside town), matching why the very next on-the-road Insight check in the reported session rolled correctly.
- Fixed the assignment to route through `adjustReputation(1,0,"greenmarch",0,"")`.
- Added a repair pass in `ensureWorldState()` that converts any non-object reputation entry (bare number or otherwise) back into a valid object with finite `renown`/`fear`, so saves that already hit this bug self-heal rather than staying permanently NaN.

## Bug 2 — investigated, not confirmed
Directly tested `enemyFormationTargetIds()`/`meleeFormationTargetIds()` with a back-row hero and a living front-row companion: the enemy's valid melee target list correctly contained only the front-row companion. No fix made; flagged for the person to reproduce with more specific detail (round number / log line) on a fresh encounter.

## Feature — companion/hero armor added to combat party cards
`heroCard` and `companionCards` (used in `renderCombat()`) previously showed weapon and off-hand but not armor by name. Added armor (with magic title) to both templates. Verified by rendering an actual combat scene through the harness (with a caching `getElementById` stub, since the harness's default stub — deliberately — returns a fresh element per call and isn't meant for asserting on rendered HTML) and confirming the armor name appears in the output between weapon and off-hand.

## New targeted harness checks (4 new, 41/41 total passing)
1. The "help" arrival choice produces a well-formed `{renown,fear,peakRenown,...}` object with finite values for Greenmarch (rewritten from a prior test that had been asserting the *buggy* bare-number result as correct — that prior test is fixed, not just supplemented).
2. A deliberately pre-corrupted (bare-number) reputation entry self-heals via `ensureWorldState()` into a proper object with finite `renown`/`fear`.
3. `adjustReputation()` on Greenmarch increments the existing renown object correctly (not a replacement).
4. (Covered by #1's rewrite) `effectiveRenown()`/`effectiveFear()` return finite numbers after the "help" choice.

`ensureWorldState`, `effectiveRenown`, `effectiveFear`, `adjustReputation`, and `regionRep` were added to the harness's exposed function set to make these checks possible.

## Not yet covered
- No human playtest yet of the fixed negotiation flow or the new armor line on combat cards in an actual browser.
- Bug 2 (back-row melee damage) remains open pending a more specific reproduction from the person.

---

# Test Report — v0.75.4 / v0.75.5 (Companion Death Alert, Loot-Recovery Fix, Flee Warning)

## Production syntax
- Extracted production inline JavaScript: `node --check` — PASS at both v0.75.4 and v0.75.5.

## v0.75.4 — Companion death alert + fixed loot-recovery gap
Source: direct follow-up request after the v0.75.3 playtest fixes ("when a companion dies there needs to be a similar alert as when the hero is at 50% health and a loot option for his gear").
- Investigated the existing `fallenCompanions`/loot-recovery system (it already existed, just incompletely wired) rather than building a new one from scratch.
- Confirmed via direct harness reproduction that `resolveSurrender('accept')` — the mercy/full-release outcome — skipped the loot phase entirely, meaning a dead companion's own gear had **no recovery path at all** if the enemy surrendered and was released. `disarm`/`execute` had a `finalizeEnemyLoot`/`surrenderedLoot` object but never merged `fallenCompanions` into it (only plain `winCombat()` did).
- Fix: extracted `mergeFallenCompanionLoot(loot, enc)` as a shared helper; wired it into `winCombat()` (refactored from inline duplicate code) and all three `resolveSurrender()` outcomes; `accept` now builds a minimal salvage-only loot object and routes to the loot phase specifically when there's fallen-companion gear to offer, otherwise it keeps the original no-loot-phase shortcut unchanged.
- Added a death-alert modal in `killCompanion()`, styled the same way as the existing hero critical-HP warning (`maybeWarnCriticalCondition()`), naming the fallen companion and listing exactly what they were carrying, and stating the recovery condition (recoverable on win/accept/disarm/execute, lost on flee/defeat) up front rather than leaving the player to infer it from a log line.
- 6 new targeted harness checks added (41 → 47 total, all passing): fallen-item bookkeeping, modal contents (captured via a monkeypatched `showModal`, since the harness's stub DOM doesn't retain elements across calls), the loot-merge helper in isolation, and — the core regression — `resolveSurrender('accept')` now reaching the loot phase with a companion's gear when previously it wouldn't, while the ordinary no-death case is provably unchanged.
- `killCompanion`, `companionDeathItems`, `mergeFallenCompanionLoot`, and `resolveSurrender` added to the harness's exposed function set.

## v0.75.5 — Flee warning for abandoned companion gear
Source: direct follow-up request ("if you flee a battle that a companion has died in you should get an alert saying you will leave the gear on the field").
- Extracted the DEX-based escape-check logic out of `combatAction('flee')` into a standalone `attemptFlee()` function, then gated the flee button behind a check: if `state.encounter.fallenCompanions` has any items, show a confirmation modal naming exactly which companion(s) and which items would be abandoned for good, with explicit "Flee Anyway" / "Reconsider" choices, before the escape roll is ever attempted.
- Fleeing with no fallen companions on the field is unaffected — `combatAction('flee')` calls `attemptFlee()` directly, identical to the pre-existing behavior.
- 3 new targeted harness checks (47 → 50 total, all passing): the warning modal fires and names the correct companion/gear, and blocks the escape attempt until confirmed; the warning is skipped and the real escape-check modal shows immediately when there's nothing to lose; and `attemptFlee()` itself (the function called on confirmation) still runs the genuine DEX check flow after the refactor.
- `attemptFlee` added to the harness's exposed function set.

## Not yet covered
- No human playtest yet of the companion-death modal, the fixed surrender-loot paths, or the flee-warning modal in an actual browser.
- Bug 2 from the v0.75.3 report (back-row party members apparently taking melee damage) remains open pending a clearer reproduction from the person.

---

# Test Report — v0.75.6 (Travel Discoverability Fix)

## Production syntax
- Extracted production inline JavaScript: `node --check` — PASS.

## Source
Direct follow-up report: "without taking a quest there is no way to actually travel between towns."

## Investigation
Directly simulated a fresh town render and a `showTravelDestinations()` call via the harness before touching any code. Confirmed: no error, no quest requirement anywhere in `showTravelDestinations()` or `beginCityTravel()`, and every region listed as travelable with a working "Travel Here" button. The feature was never broken or gated — this was purely a discoverability problem: the working Travel button lived inside the "Immediate" tab of the town action panel, which renders below the town-overview cards, the full Quest Board card, and a "Suggested Next Step" card that recommends "Find a New Quest" whenever nothing else applies — meaning a player with no active quest sees two separate prompts nudging them toward questing before ever scrolling far enough to find Travel.

## Fix
Added a prominent, always-visible "🗺 Travel to Another City" button immediately below the town description, ahead of every other card, calling the same existing `showTravelDestinations()` — no new travel logic, no change to the original Immediate-tab entry, purely additive placement.

## New targeted harness check (1 new, 51/51 total passing)
Renders a fresh town scene and asserts the Travel button's markup (`showTravelDestinations()`) appears earlier in the output than the "Quest Board" heading, directly encoding the discoverability requirement rather than just the button's existence.

## Not yet covered
- No human playtest yet of the repositioned button's actual on-screen prominence in a browser.
- Bug 2 from the v0.75.3 report (back-row party members apparently taking melee damage) remains open pending a clearer reproduction from the person.

---

# Test Report — v0.75.7 (Weapon Wear Balance + Ammo Recovery)

## Production syntax
- Extracted production inline JavaScript: `node --check` — PASS.

## Source
Direct playtest feedback after v0.75.6: the game is fun with no major bugs, but weapons wear out too fast, and arrows should have a reasonable chance of recovery from a fallen foe.

## Weapon wear investigation and fix
Read the actual wear pipeline (`damageGear`, `weaponConditionAccuracyPenalty`, `weaponConditionDamagePenalty`) and the call sites (`weaponAttack`, `powerAttack`, `cunningStrike`, `markedShot`, `companionWeaponAttack`) before changing anything. Confirmed wear was applied unconditionally on every attack — hit or miss — and the -1 damage penalty threshold (below 75% of max durability) meant a starting weapon (e.g. Spear at 46 max) would show a penalty after only ~11-12 swings, hit or miss.
- Changed all five wear-dealing call sites to only apply wear when the attack roll succeeds.
- Loosened `weaponConditionDamagePenalty` (no penalty until ≤50% durability, was ≤75%) and `weaponConditionAccuracyPenalty` (no penalty until ≤15%, was ≤25%).

## Ammo recovery investigation and fix
Confirmed only magic ammunition with an `ammoReturn` affix had any recovery chance; ordinary Arrows/Bolts/Sling Bullets had none. Added `trackAmmoSpent(name)` (called from `weaponAttack`, `markedShot`, and `companionWeaponAttack` wherever `w.ammo` is consumed) and `recoverSpentAmmo(loot, enc)`, which rolls a per-unit 55% recovery chance for each type of ammo spent and adds recovered stacks to the loot object with a `"Recovered ammunition"` source badge. Wired into the same "holds the field" recovery paths as the v0.75.4 fallen-companion-gear system: plain victory (`winCombat`), and all three surrender resolutions (`accept`/`disarm`/`execute`) — `accept` now also triggers the loot phase purely because ammo was spent, even with no fallen companions, since spent ammunition is the party's own property and shouldn't be forfeit based on unrelated surrender terms.

## New targeted harness checks (5 new, 56/56 total passing)
1. `weaponConditionDamagePenalty`/`weaponConditionAccuracyPenalty` return the new loosened values at representative ratios.
2. Hero weapon wear is directly hit/miss-gated: a monkeypatched `roll()` forces a guaranteed miss (condition unchanged) then a guaranteed hit (condition drops by 1) on the same weapon.
3. `trackAmmoSpent()` tallies correctly across multiple ammo types.
4. `recoverSpentAmmo()` run against 1000 spent Arrows lands in a plausible 30-80% recovery band (not exactly deterministic given the per-unit roll, but bounded enough to catch a broken rate) and never exceeds the amount spent.
5. `resolveSurrender('accept')` routes to the loot screen when ammo was spent even with no fallen companions.

## Not yet covered
- No human playtest yet of the new wear feel or ammo recovery messaging in an actual browser.
- Visual appeal / text density: discussed but intentionally not started pending scope confirmation (lightweight polish vs. the fuller tabbed redesign already sketched in `GUI_VISUAL_ROADMAP.md`).
- Bug 2 from the v0.75.3 report (back-row party members apparently taking melee damage) remains open pending a clearer reproduction.

---

# Test Report — v0.75.8 (First Visual Art Pass: "The Old Road" Intro Scene)

## Production syntax
- Extracted production inline JavaScript: `node --check` — PASS.

## Source
Direct follow-up to visual-appeal feedback: the person shared a reference painting (moody dusk landscape with a veiled moon, layered mountains, pine treeline, winding path, and a lit lantern on a signpost) alongside a screenshot of the game's current flat-band intro scene, and asked for that mood applied to the intro first.

## Constraints acknowledged before starting
- No image-generation tool is available in this environment — this pass could not produce or use bespoke raster art.
- `GUI_VISUAL_ROADMAP.md` requires a source-by-source license audit before shipping any externally-sourced graphic; web-searching for existing images and shipping them would violate that.
- The single-file, offline-friendly deployment model makes embedding raster image assets awkward (base64 bloats the file; external references break portability).
- Given all three, this pass is CSS/SVG only — no new asset files, no licensing exposure.

## What changed
Rebuilt `.intro-scene-road` (CSS) and the `road` branch of `landingSlideVisual()` (markup): multi-stop dusk sky gradient, cloud-streak layer, a veiled moon (radial gradient + soft cloud wisp), two depth-layered mountain silhouettes (far/near, different opacity and color for atmospheric depth), a new `pineTreeline()` helper generating a deterministic row of triangular pine silhouettes in two depth tiers, a winding SVG cubic-bezier path (replacing the old straight trapezoid) with a gradient stroke, and a lantern-lit signpost (post + lantern box + radial-gradient glow halo). The walking hero figure is unchanged. All new layers are percentage/gradient-based so the same markup renders correctly in both the compact intro-slide list and the fullscreen cinematic intro without any conditional logic.

## New targeted harness check (1 new, 57/57 total passing)
Renders `landingSlideVisual(INTRO_SLIDES[0])` directly and asserts the output contains the moon, both mountain layers, at least 6 procedural pine-tree divs, the winding path SVG, and the lantern — guards against silently reverting to the old flat placeholder in a future edit.

## Not yet covered
- No way to render a screenshot in this environment (headless Chrome install was blocked by network restrictions) — the visual result has only been verified by reading the generated CSS/SVG output, not by seeing it rendered. This needs an actual browser check before calling the look finalized.
- Deliberately scoped to only the "road" intro scene. The other five intro scenes and in-game scene art are untouched pending confirmation this direction is a hit.
- Bug 2 from the v0.75.3 report (back-row party members apparently taking melee damage) remains open pending a clearer reproduction.

---

# Test Report — v0.75.9 (Intro Slide Rendering Hardened + Simplified)

## Production syntax
- Extracted production inline JavaScript: `node --check` — PASS.

## Source
Direct bug report from real browser play: the v0.75.8 "Old Road" intro slide flashed white, then the intro continued normally from slide 2 onward.

## Investigation
Re-ran the exact v0.75.8 markup generator (`landingSlideVisual(INTRO_SLIDES[0])`) through the harness again — it still produces valid, well-formed HTML with no exception, confirming the JS logic itself is sound in this environment. Attempted to install a headless browser (chromium via apt, puppeteer via npm) to reproduce directly; both were blocked by this environment's network/package restrictions, so the exact root cause could not be directly reproduced here.

Reasoned from the symptom instead: a slide that flashes white and then is skipped in favor of the next slide is consistent with `visual.innerHTML=landingSlideVisual(...)` throwing inside `renderFullScreenIntroSlide()` — the overlay shell (dark background) is inserted first and independently, but if the assignment throws, `#introVisual` stays empty (default/transparent), showing through to whatever's behind it, until the auto-advance `setTimeout` — which runs independently of whether the previous render succeeded — fires and renders the next (unaffected) slide.

## Changes made
1. Wrapped the `visual.innerHTML=landingSlideVisual(...)` call in `renderFullScreenIntroSlide()` in a try/catch, falling back to a plain gradient-background-plus-caption if any scene's visual generator throws, for any reason, now or in the future.
2. Simplified the road scene's winding-path SVG: removed the `<defs>/<linearGradient>/url(#id)` gradient reference in favor of a single solid stroke color. `url(#id)` references inside SVG that's injected via `innerHTML` (rather than present in the original parsed document) are a known source of inconsistent rendering across browsers and mobile WebViews — removing this indirection eliminates one concrete, plausible trigger even without being able to confirm it was the actual cause.
3. Removed a redundant over-constrained CSS declaration (`left`+`right`+`width` all set on the same absolutely-positioned element).

## New targeted harness check (1 new, 58/58 total passing)
Monkeypatches `landingSlideVisual` to throw, calls `renderFullScreenIntroSlide(0)`, and confirms the slide's container still ends up with non-empty, caption-bearing content rather than being left blank — directly encodes the fix for the reported symptom.

## Not yet covered
- The exact root cause in the person's specific mobile browser/WebView was not directly confirmed — this release defends against the symptom and removes one plausible cause, but needs a re-test on the actual device to confirm the flash is gone.
- No human playtest yet of the hardened fallback path in a real browser (only verified via harness monkeypatching).
- Bug 2 from the v0.75.3 report (back-row party members apparently taking melee damage) remains open pending a clearer reproduction.

---

# Test Report — v0.75.10 (Real Painted Art: Menu + All 6 Intro Slides)

## Production syntax
- Extracted production inline JavaScript: `node --check` — PASS.

## Source
The person generated 7 real painted illustrations externally (matching the established moody dusk-fantasy reference style) and sent them as one comparison collage image.

## Process
1. Split the collage programmatically: analyzed pixel rows/columns to find the near-black grid border lines separating the 7 panels (1 wide banner + 2×3 grid), rather than guessing coordinates — confirmed border positions via numpy before cropping.
2. Cropped all 7 panels, saved as individual JPEGs, and visually verified each crop (menu background, road, conflict, heroic scenes checked directly) against the source collage before using any of them.
3. Base64-encoded all 7 and wired them into `index.html`:
   - `landingSlideVisual()` reduced to an `INTRO_ART` lookup table (scene name → base64 data URI) plus one generic render function, replacing what had been six separate per-scene HTML generators and a `pineTreeline()` helper.
   - `.landing-hero`'s background is now the embedded menu art directly via CSS; the old `.hero-landscape` decorative divs are hidden (`display:none`) rather than removed from the markup, so no JS template changes were needed there.
   - All `.intro-scene-*` CSS (built across v0.75.8–v0.75.9 for the road scene, and originally for wilds/conflict/people/realm/heroic) was deleted and replaced with a single `.intro-visual-art{background-size:cover;background-position:center}` rule.
4. Round-tripped one embedded image back out of the generated `index.html` (extracted the base64, decoded it, reopened it with PIL) to confirm the embedding didn't corrupt the data.
5. Copied the 7 source JPEGs into a new `art_source/` folder alongside `index.html` for future reference/re-editing.

## New targeted harness checks (2 new, 59/59 total passing)
1. Renders all 6 intro scenes and confirms each produces a distinct, real `data:image/jpeg;base64,...` background (not a placeholder, not a repeat of another scene's image) and that the old `scene-moon` procedural marker is gone.
2. Confirms `.landing-hero`'s CSS in the actual `index.html` source references a real embedded background image rather than the retired decorative divs.

## Not yet covered
- No human playtest yet of how the real art actually looks on-device (only verified programmatically: correct crop boundaries, successful embedding, successful round-trip decode).
- The source images are native ~500×300px (intro slides) / ~1530×400px (menu) — cropped from a collage rather than generated at full target resolution. May look soft when stretched to fill a large phone screen; flagged to the person as a candidate for regenerating at higher resolution later.
- Bug 2 from the v0.75.3 report (back-row party members apparently taking melee damage) remains open pending a clearer reproduction.

---

# Test Report — v0.75.11 (Fixed: Menu Background Photo Was Invisible)

## Production syntax
- Extracted production inline JavaScript: `node --check` — PASS.

## Source
Screenshots from real device play (following the v0.75.10 art embed): all 6 intro slides correctly showed the new painted art, but the main menu screen still showed a flat dark gradient with no photo.

## Root cause
`.landing-hero::before` — a pseudo-element left over from before any photo existed, originally serving as the flat placeholder sky/ground color that the retired CSS-drawn moon/mountains/fortress divs sat on top of — still carried a fully opaque 3-stop `linear-gradient` with `z-index:-4`. Per CSS stacking order, a negative-z-index child of a `position:relative` parent paints after the parent's own background but before the parent's other content, so this opaque layer was rendering directly on top of the new `background-image` set on `.landing-hero` in v0.75.10 — completely hiding it. The intro-slide version of this pattern (`.intro-visual::before`) uses proper alpha-transparent overlays and was correctly left alone; only the menu hero's version was fully opaque, and it was missed during the v0.75.10 wiring because only the separate `.hero-landscape` decorative divs were addressed at the time, not this pseudo-element.

## Fix
Cleared `.landing-hero::before`'s background to `none`. `.landing-hero::after` (the actual intended text-legibility scrim, `z-index:-1`, proper alpha transparency) is untouched and continues to darken the photo for text contrast as designed.

## New targeted harness check (1 new, 60/60 total passing)
Reads the actual `.landing-hero::before` CSS rule from `index.html` and asserts its background is `none`/`transparent` and not any opaque gradient — written to catch the general class of bug (any future opaque overlay reintroduced here), not just the specific gradient that caused this one.

## Not yet covered
- No confirmation yet from the person that the menu background photo now displays correctly on their device — this fix is based on a code-level root-cause diagnosis of the reported screenshots, not a live re-test.
- Bug 2 from the v0.75.3 report (back-row party members apparently taking melee damage) remains open pending a clearer reproduction.

---

# Test Report — v0.75.12 (Title Clipping Fixed + More Transparent Captions)

## Production syntax
- Extracted production inline JavaScript: `node --check` — PASS.

## Source
Direct feedback from real device screenshots: "ROADWARDEN" clipped off-screen on the main menu ("2 things the roadwarden does not fit"), and a request to make the intro caption boxes more transparent so the new art shows through more.

## Fix 1: title clipping
`.landing-title` used `max-width:10ch`, which assumes 1ch ≈ average glyph width. This project's bold display serif renders wider than that per character, so "Roadwarden" (10 characters, no spaces to wrap at) rendered wider than its own container and overflowed into `.landing-hero`'s `overflow:hidden` region, visibly clipping. Raised to `max-width:13ch` and added `overflow-wrap:break-word` as a safety net.

## Fix 2: caption transparency
Reduced background alpha on `.intro-caption` (.66 → .4) and `.fullscreen-intro .intro-caption` (.8/.65 → .42/.32), with proportionally reduced `backdrop-filter:blur()`, so the painted art is clearly visible behind the caption text rather than mostly obscured by a near-opaque box.

## New targeted harness checks (2 new, 62/62 total passing)
1. Confirms `.landing-title`'s CSS has `max-width` at or above 13ch and includes `overflow-wrap:break-word`.
2. Confirms both caption-box CSS rules have alpha values meaningfully below their prior (.66/.8) values.

## Not yet covered
- No confirmation yet from the person that the title now displays in full and the captions read well against the art on their device.
- Bug 2 from the v0.75.3 report (back-row party members apparently taking melee damage) remains open pending a clearer reproduction.

---

# Test Report — v0.75.13 (Title Fix Corrected + Test-Suite Path Bug Found)

## Production syntax
- Extracted production inline JavaScript: `node --check` — PASS.

## Source
Direct feedback from a real device screenshot: the v0.75.12 title fix caused "Roadwarden" to break mid-word ("ROADWAR" / "DEN: SOLO" / "REALM") instead of clipping — an improvement in that nothing was hidden, but still wrong.

## Fix: title CSS
Removed `max-width:13ch` and `overflow-wrap:break-word` entirely (the combination that permitted the mid-word split). Replaced with `max-width:100%` (defers to the real container width via `.landing-content{width:min(720px,100%)}`) plus `word-break:keep-all;overflow-wrap:normal`, which explicitly forbids breaking within a word under any circumstance. Also tightened the mobile media query's font clamp (`13vw`→`10vw`) so the title shrinks more readily on narrow viewports, giving the now-unbreakable word real headroom instead of relying on a break as a fallback.

## Real bug found in the test suite itself
While verifying this fix, discovered that three existing checks (from v0.75.10/v0.75.11) read `index.html` via a **hardcoded absolute path containing the version-numbered folder name** (e.g. `/home/claude/handoff/Roadwarden_Solo_Realm_v0.75.10/index.html`). Once work continued in a newer version-numbered directory, those checks were silently validating a **stale, frozen copy of the file** rather than the current one — confirmed directly: after applying the v0.75.13 CSS fix, the old title test still reported PASS against an assertion that should have failed, because it was reading the *previous* version's file on disk. Fixed by replacing every hardcoded path with `require("path").join(__dirname, "..", "index.html")`, which always resolves relative to the test file's own location and cannot go stale when the project folder is renamed/versioned. Re-ran after the fix and confirmed the affected test correctly flipped to FAIL against the file it was actually supposed to be checking, before being updated to assert the corrected CSS.

## Updated/new targeted harness checks (63/63 total passing)
1. (Rewritten) Confirms `.landing-title` has no `max-width:Nch` limit and does have both `word-break:keep-all` and `overflow-wrap:normal`.
2. (New) Confirms the mobile media query's title font clamp uses a vw factor of 10 or less.

## Not yet covered
- No confirmation yet from the person that "Roadwarden" now renders on one unbroken line at every screen size they test.
- Should audit the rest of the test suite for any other hardcoded version-specific paths that might have been introduced the same way (a one-time sweep is warranted given this was found by accident, not by a deliberate audit).
- Bug 2 from the v0.75.3 report (back-row party members apparently taking melee damage) remains open pending a clearer reproduction.

---

# Test Report — v0.75.14 (Real Art: Travel, Town, Dungeon, Combat, Market, Inn)

## Production syntax
- Extracted production inline JavaScript: `node --check` — PASS.

## Source
Second art batch from the person, generated against the v0.75.7 prompt list (Travel, Town, Dungeon, Combat, Market, Inn, Library of Chronicles), sent as one collage image.

## Process
1. Split the collage programmatically via pixel-gutter detection (same technique as v0.75.10, adapted for this collage's white gutters and 4-column/3-column grid rather than the first collage's black-gutter 3×2+banner layout).
2. Visually verified 3 of the 7 crops directly (travel-road, dungeon, library-chronicles) against the source collage.
3. Wired in 6 of the 7 images (all except Library of Chronicles, held back per the person's request until that screen exists):
   - Replaced the shared CSS-drawn moon/hills/road/walker scene (used identically across `renderTravel`, `renderQuestTravel`, `renderCityTravel`) with one reusable `.scene-art-travel` image class.
   - Added new `.scene-art` banner divs (previously absent) to `renderTown()`, `renderDungeon()`, `showShop()`, and `showInn()`.
   - Updated `.combat-stage`'s existing background rule (previously a flat gradient) to the real combat art — no markup changes needed since the element already existed.
4. Deleted the now-unused `.scene-art .moon/.hills/.road/.walker` CSS and the `@keyframes walk` animation (confirmed via grep it wasn't referenced anywhere else before removing).
5. Copied all 7 source JPEGs (including the held-back Library image) into `art_source/` for future reference.

## New targeted harness checks (6 new, 69/69 total passing)
One check per updated screen confirming the real embedded image appears in that screen's rendered output or CSS: Town, Market, Inn, the 3 travel screens (checked together, confirming the old moon/hills markup is fully gone and the new shared class appears exactly 3 times), Combat (checked at the CSS level, confirming the flat gradient is gone), and Dungeon.

## Not yet covered
- No human playtest yet of how these 6 backdrops actually look on-device.
- Library of Chronicles image is embedded nowhere yet — held in `art_source/` pending that screen being built.
- Bug 2 from the v0.75.3 report (back-row party members apparently taking melee damage) remains open pending a clearer reproduction.

---

# Test Report — v0.75.15 (Character Creation + Arrival Engine + Reeds-Quest Dungeon Art)

## Production syntax
- Extracted production inline JavaScript: `node --check` — PASS.

## Source
Third and fourth art deliveries, following the game's opening progression (menu/intro → character creation → Arrival Engine → early quest content) discussed with the person.

## Investigation before wiring
Read the Arrival Engine's actual implementation before assuming anything about its structure: it's a fully custom animated multi-stage overlay (`fade→title→map→approach→narration→choice→outcome`) with its own procedural SVG map (route tracing, glowing markers) for the "map" stage specifically, and sets a `data-stage` attribute on `#arrivalOverlay` on every stage transition — a ready-made CSS hook, no JS changes required. Also read `arrivalText()` directly to confirm the reeds/merchant-cart scenario is fixed, universal content (not randomized per starting background/culture/season), which justified sourcing dedicated art for it rather than treating it as one of many random variants.

## What changed
1. `.creation-intro` (character creation sidebar): added the real art as a background layer, under a stronger scrim (`rgba(33,22,14,.74)→rgba(16,11,7,.86)`) than a typical banner, appropriate for a panel with dense form text.
2. Arrival Engine: two new CSS rules keyed off `[data-stage="..."]` — one shared image for `fade`/`title`/`approach` (arriving at the region), one shared image for `narration`/`choice`/`outcome` (the reeds/marsh scenario, which is what's actually being narrated in exactly those three stages). The `map` stage's existing SVG is untouched.
3. `renderDungeon()`: the backdrop element's class is now conditional — `state.quest?.storyId==="reedsQuest"` selects a dedicated flooded-ruin marsh interior; every other dungeon still gets the generic stone-dungeon art from v0.75.14. First quest-conditional (rather than screen-type-conditional) backdrop in the project.

## New/updated targeted harness checks (72/72 total passing)
1. Confirms the dungeon-backdrop conditional expression and both of its associated CSS image rules exist in source.
2. **End-to-end render test**: builds a real reeds quest via `generateReedsQuest()`/`generateDungeonSite()`/`normalizeQuest()` (the same fixtures the project's existing reeds-quest integration tests use — not a hand-rolled minimal stub), renders `renderDungeon()`, and confirms the reeds-specific class appears; repeats with `storyId` overridden to something else and confirms the generic class appears instead. (An earlier version of this test used a minimal hand-built quest object and threw inside dungeon generation — replaced with the project's own established fixture pattern rather than chasing down every field dungeon generation needs.)
3. Confirms `.creation-intro`'s CSS carries both the real image and the expected scrim color.
4. Confirms both Arrival Engine stage-group CSS rules are present with real embedded images.

## Not yet covered
- No human playtest yet of how any of these four backdrops actually look in the real animated Arrival Engine or character creation flow.
- Library of Chronicles image remains unwired, held in `art_source/` pending that screen being built.
- Bug 2 from the v0.75.3 report (back-row party members apparently taking melee damage) remains open pending a clearer reproduction.

---

# Test Report — v0.75.16 (Recruitment Reuse + Level-Up + Reeds Quest Climax Art)

## Production syntax
- Extracted production inline JavaScript: `node --check` — PASS.

## Source
Fourth art batch, continuing the reeds-quest progression: companion recruitment, character growth, and the questline's emotional climax.

## What changed
1. Checked `renderRecruit()` before sourcing new art and found it's set at "The Lantern & Stag" — the identical location/heading already illustrated for `showInn()` in v0.75.14. Reused `.scene-art-inn` rather than requesting duplicate art for the same place.
2. `showLevelUp()`: added a real backdrop, unconditional (every character growth screen, regardless of quest).
3. `renderQuestEnd()`: added a conditional backdrop matching the pattern established in v0.75.15 for the dungeon — `state.quest.storyId==="reedsQuest"` selects dedicated Wren-reveal art; other quest types (procedurally generated, no handcrafted twist) get no backdrop, since no generic quest-end art exists yet. This is a known gap, not a defect.

## New targeted harness checks (3 new, 75/75 total passing)
1. `renderRecruit()` render includes `scene-art-inn`.
2. `showLevelUp()` render includes `scene-art-levelup`.
3. `renderQuestEnd()` shows `scene-art-wren-reveal` when built from a real `generateReedsQuest()` fixture with `storyId` intact, and does not show it when `storyId` is overridden to something else — both cases built through the same `generateReedsQuest()`/`normalizeQuest()` fixtures used elsewhere in the suite, not hand-rolled stubs.

## Not yet covered
- No human playtest yet of how these three backdrops look in the actual recruit/level-up/quest-end screens.
- Non-reeds quests still show no backdrop at all on the "Choice at [place]" screen — worth a generic fallback image at some point if more handcrafted quests get added later.
- Library of Chronicles image remains unwired, held in `art_source/` pending that screen being built.
- Bug 2 from the v0.75.3 report (back-row party members apparently taking melee damage) remains open pending a clearer reproduction.

---

# Test Report — v0.75.17 (Library of Chronicles — Real Feature)

## Production syntax
- Extracted production inline JavaScript: `node --check` — PASS.

## Source
Direct request to pivot from art-only work to building the Library of Chronicles screen from the person's original mockup — real feature work, with the art already on hand.

## Investigation before building
Read the existing save system in full before writing anything: `SAVE_SLOT_COUNT`, `saveKey()`, `savePayload()`, `characterSavePayload()`/`campaignSavePayload()`, `slotDescription()`, `showSaveManager()`, `loadSaveSlot()`, `writeSaveSlot()`, `deleteSaveSlot()`. Confirmed a complete, working 3-slot save system already existed, presented only as a plain-text modal. Built the new screen as a presentation layer over this exact same data and the exact same `loadSaveSlot()` function used everywhere else in the game — deliberately avoided creating a second, parallel save mechanism.

## Deliberate design correction from the original mockup
The mockup showed a fabricated "68% complete" progress bar per save slot. This game has no real completion concept (open-ended sandbox, not a fixed campaign length), so that number would have been invented. Replaced with real data the game actually has: day/region/level (already in the existing summary payload) plus hero health status via the existing `healthStateText()`/`healthPercent()` helpers.

## What was built
- `renderLibraryOfChronicles()`: new full-screen view, book-styled cards (colored spine per slot, rotating red/blue/green) for each of the 3 character save slots, each showing hero/companion/region/health/timestamp data pulled from the real save payload. Empty slots get a direct "Begin a New Chronicle" action.
- `eraseLibrarySlot()`: a thin wrapper that removes the save and re-renders the Library — not a reuse of the existing `deleteSaveSlot()`, which always calls `showSaveManager()` internally to refresh (would have shown the wrong UI after erase).
- New `.library-shell`/`.library-shelf`/`.library-book`/`.library-spine` CSS.
- Repointed the two main-menu "Load Character" buttons to the new screen; deliberately left the in-game DM Journal panel's load button on the original modal, since that's a different context (a permanent mid-campaign utility, not a menu-time decision).

## New targeted harness checks (4 new, 79/79 total passing)
1. All-empty state: 3 empty-slot cards, "Begin a New Chronicle" present.
2. Populated state built from a **real** `characterSavePayload()` call (not a hand-rolled fixture) — confirms actual hero/companion names, region, and both action buttons render correctly, with the other two slots correctly still empty.
3. End-to-end erase flow: writes a real save, calls `eraseLibrarySlot()`, confirms the slot immediately shows empty again in the re-rendered output.
4. Confirms exactly 2 main-menu buttons were repointed to the new screen and exactly 1 (the DM Journal panel's) was correctly left on the old modal.

## Not yet covered
- No human playtest yet of how the Library screen actually looks/feels on-device, including the book-spine visual treatment.
- Only the "character" save type got the new Library treatment; "campaign" saves still use the original `showSaveManager()` modal — worth revisiting if that distinction turns out to be confusing in practice.
- The page-turn transition animation from the original mockup was not built in this pass (scoped out — this release is the save-slot screen itself, not the transition).
- Bug 2 from the v0.75.3 report (back-row party members apparently taking melee damage) remains open pending a clearer reproduction.

---

# Test Report — v0.75.18 (Clickable Calling/Ancestry/Background Cards)

## Production syntax
- Extracted production inline JavaScript: `node --check` — PASS.

## Source
Direct request: make Calling, Ancestry, and Background directly clickable instead of a dropdown-then-confirm flow.

## What changed
Replaced the three `<select>` elements with `.choice-grid` card layouts (same pattern as `renderRecruit()`'s companion cards). Each card's `onclick` calls a new `selectCreatorOption(fieldId, value, cardEl)`, which writes into a same-ID hidden `<input>` (preserving the exact data contract `createHero()` and the info-panel logic already depend on via `.value`), updates the `.selected` class on the clicked card's siblings, and calls a new `refreshCreatorInfo()` (extracted from the old closure-scoped `info()` so it's reachable from inline `onclick` handlers, which execute in global scope). Culture and Faith remain selects — out of scope for this request, and Faith's conditional Cleric-only visibility suits a dropdown better than a full card grid.

## Real bug found during verification (not a regression)
While testing this change by rendering `renderCreate()` through the harness, hit a crash reading `CLASSES[undefined]`. Root-caused to the harness's `makeElement()` mock: it does not parse HTML attributes into element properties, so every `getElementById()` call returns a blank stub with `value:""` regardless of what `value="..."` was written in the `innerHTML` elsewhere. This is a pre-existing limitation of the mock DOM — it never correctly simulated attribute-to-property initialization for *any* form element, including the old `<select>`s before this change — just never surfaced before because no earlier test exercised this exact "render a form, then read initial values back" path. Worked around it (both in manual verification and in the new permanent test) by pre-seeding the mock cache with elements that already carry the correct `.value`, matching what a real browser's HTML parser does automatically.

## New targeted harness check (1 new, 80/80 total passing)
Renders the creation screen, confirms the three old `<select>` elements are gone and the three new `.choice-grid` containers are present, then simulates clicking a "Rogue" Calling card and confirms: the underlying hidden input's value updates, the clicked card gets marked `.selected`, and the class-info panel re-renders to reflect the new selection.

## Not yet covered
- No human playtest yet of how the new card-based selection actually feels/looks on-device.
- Culture and Faith remain dropdowns; worth revisiting for consistency if the card-based approach is well received.
- The 3 issues raised in the same message (stale-file travel-art report) are addressed separately — see the conversation, not a code change, pending the person confirming which file/version they're actually viewing.
- Bug 2 from the v0.75.3 report (back-row party members apparently taking melee damage) remains open pending a clearer reproduction.

---

# Test Report — v0.75.19 ("The Chronicle Opens" Backdrop)

## Production syntax
- Extracted production inline JavaScript: `node --check` — PASS.

## Source
Direct request to add art to the "Alden, will you take the road?" screen.

## Investigation before implementing
Located the exact screen in `NarrativeCreator.render()`'s "review" branch — the final step of the guided character creator, which is the creator that actually runs by default (auto-invoked after the Arrival Engine finishes), distinct from the "Classic Creator" single-page form that got the clickable-card treatment in v0.75.18. Confirmed this screen already shows a 132px `avatarSVG()` procedural portrait — the request was for a backdrop behind it, not a replacement.

## What changed
- No new art sourced. Extracted the already-embedded char-creation base64 image (used for the Classic Creator's `.creation-intro` sidebar) directly from the existing CSS via regex, and reused it for this screen — consistent with the established reuse pattern (inn/recruit).
- Added a `data-step` attribute write to `#narrativeCreator` on every `NarrativeCreator.render()` call, mirroring the existing `data-stage` pattern already used by the Arrival Engine.
- Added `.narrative-creator[data-step="review"] .creator-shell{...}` CSS, scoped to only the final step.

## New targeted harness check (1 new, 81/81 total passing)
Drives a real `NarrativeCreator.start()`, captures the initial `data-step` (expected `"name"`), force-jumps to the last step via `NarrativeCreator.index = steps().length-1; render()`, and confirms: `data-step` flips to `"review"`, the rendered scene contains "The chronicle opens", and the corresponding CSS rule with a real embedded image exists in source. (First attempt at the CSS-existence check used an overly strict regex that broke on nested parens inside the `rgba()` gradient stops — fixed to a substring check instead of chasing a more complex regex.)

## Not yet covered
- No human playtest yet of how this backdrop looks alongside the existing avatar portrait on this screen.
- Bug 2 from the v0.75.3 report (back-row party members apparently taking melee damage) remains open pending a clearer reproduction.
- The travel-screen "still shows old art" report from earlier in this session is still unresolved pending the person confirming which file/version they're actually viewing — the code itself was re-verified correct.

---

# Test Report — v0.75.20 (Fixed: Companions Always "Objecting" to Every Quest)

## Production syntax
- Extracted production inline JavaScript: `node --check` — PASS.

## Source
Bug report: both party members objecting to every quest offered.

## Root-cause investigation
Traced the "Accept Quest" party-council opinion path: `showPartyCouncil('quest_accept')` → `councilContext('quest_accept')` (tags: `["contract","danger"]`, plus `murder`/`lawbreaking` only if the task text matches a regex) → `companionDecisionOpinion(companion, ctx)`.

Reproduced directly by running `companionDecisionOpinion()` against all 9 alignments on a plain, non-murder quest:

| Alignment | Score (before fix) | Stance (before fix) |
|---|---|---|
| LG/NG/LN/TN/LE/NE | 0 or 1 | uneasy |
| CG/CN/CE | **-2** | **object** |

All three chaotic alignments (`law:-1` in the `ALIGNMENTS` table) landed at exactly `-2` — the "object" threshold — on every single plain quest, deterministically, because of this line:
```js
if(has("contract")||has("duty")){score+=a.law;if(a.law>0)reasons.push(...);if(a.law<0)score-=1}
```
This both added the (already negative) `a.law` value and applied a second, redundant flat `-1` penalty for the same condition — double-counting the same alignment fact.

## Fix
Removed the redundant `if(a.law<0)score-=1`. Verified via direct function calls (not just reading the code) that:
- All 9 alignments now land at "uneasy" or better on a plain quest — no automatic "object".
- Chaotic alignments still score measurably lower than lawful ones (the intended flavor distinction is preserved, just without doubling it).
- A murder/assassination-flavored quest (`task` matching the existing regex) still correctly triggers `refuse` for a Lawful Good companion and a strongly positive score for Chaotic Evil — confirming the fix didn't flatten the meaningful, content-driven distinctions, only the blanket over-penalty on ordinary contracts.

## New targeted harness checks (2 new, 83/83 total passing)
1. Drives all 9 alignments through a real `companionDecisionOpinion()`/`councilContext('quest_accept')` call on a plain quest; asserts none land at "object" or "refuse", and that chaotic alignments still score lower than lawful ones.
2. Confirms a murder-flavored quest still produces `refuse` for Lawful Good and a higher (supportive) score for Chaotic Evil than for Lawful Good.

## Not yet covered
- No human playtest yet confirming the fix resolves the originally reported experience in an actual live party.
- Bug 2 from the v0.75.3 report (back-row party members apparently taking melee damage) remains open pending a clearer reproduction.
- The travel-screen "old art" report from earlier remains unresolved pending the person confirming which file/version they're viewing.

---

# Test Report — v0.75.21 (Character Development + Master Spellbook Art)

## Production syntax
- Extracted production inline JavaScript: `node --check` — PASS.

## Source
Sixth art batch: Character Development hub and Master Spellbook, both confirmed to be real full-screen views (not modals/sidebars) before wiring anything in.

## What changed
1. `showCharacterHub()`: added `.scene-art-training` banner right below the heading.
2. `showMasterSpellbook(actorId)`: added `.scene-art-spellbook` banner right below the heading. This function is shared by both the hero (`actorId="hero"`) and any companion (`actorId=<companionId>`) — confirmed both paths render the same banner correctly rather than assuming from reading the code alone.

## New targeted harness checks (2 new, 85/85 total passing)
1. Renders `showCharacterHub()` and confirms `scene-art-training` appears.
2. Renders `showMasterSpellbook('hero')` and `showMasterSpellbook(companionId)` in the same test and confirms both include `scene-art-spellbook`.

## Not yet covered
- No human playtest yet of how either backdrop looks alongside the dense list of skill/talent/spell cards on these screens.
- File size is now ~3.8MB — flagged to the person again; no action taken yet pending their direction.
- Bug 2 from the v0.75.3 report (back-row party members apparently taking melee damage) remains open pending a clearer reproduction.
- The travel-screen "old art" report from several turns back remains unresolved pending the person confirming which file/version they're viewing.

---

# Test Report — v0.75.22 (Backdrop Behind the Entire Creation Screen)

## Production syntax
- Extracted production inline JavaScript: `node --check` — PASS.

## Source
Direct feedback from an on-device screenshot: art only appeared in the sidebar, everything below (choice-grid cards, class/origin info panels) was plain, because `.card` uses a fully opaque background.

## What changed
1. Added the already-embedded char-creation image as a backdrop on `.creation-section` (the whole screen's wrapping container).
2. Scoped-overrode `.card`/`.choice-card` to a translucent version **only within `.creation-section`** so the new backdrop is actually visible through the cards, not just in the gaps between them. This was deliberately scoped rather than made global, to avoid changing the appearance of `.card` everywhere else in the game (town, market, inventory, etc.) where the opaque look is intentional and expected.

## New targeted harness check (1 new, 86/86 total passing)
Confirms both new CSS rules exist in source (the container background, and the scoped translucent-card override), and that a real `renderCreate()` render actually produces the `creation-section` wrapper class the CSS targets.

## Not yet covered
- No human playtest yet of how the full-screen backdrop looks alongside the translucent cards on an actual device.
- File size is now ~4.0MB.
- Bug 2 from the v0.75.3 report (back-row party members apparently taking melee damage) remains open pending a clearer reproduction.
- The travel-screen "old art" report from several turns back remains unresolved pending the person confirming which file/version they're viewing.
- Class-portrait avatar art (9 pieces, one per class) is pending — prompts have been given, art not yet received.
- An ancestry/culture/background plausibility system was discussed and deliberately deferred at the person's request, to keep to one task at a time.

---

# Test Report — v0.75.23 (Real Class Portrait Avatars)

## Production syntax
- Extracted production inline JavaScript: `node --check` — PASS.

## Source
Direct request to replace procedural SVG avatars with real painted class portraits. Scope (9 classes) and the ancestry-visual-representation tradeoff were both confirmed with the person before any art was generated.

## What changed
- `avatarSVG(ancestry, className, size)` now returns an `<img>` tag using an embedded class portrait instead of building an SVG shape. Name and signature kept identical to avoid touching any call site.
- New `CLASS_PORTRAITS` object maps each of the 9 class names to an embedded base64 JPEG.
- Unknown/unrecognized class names fall back to the Rogue portrait rather than crashing.
- Old `ANCESTRY_AVATAR_STYLE`/`CLASS_AVATAR_TINTS` tables left in place, unused, for potential rollback.
- Each portrait downscaled to 200×200 and compressed for small-icon use specifically (avatars display at 40–150px) rather than reused at backdrop quality — kept the whole 9-image set to ~106KB combined.

## New targeted harness checks (3 new, 89/89 total passing)
1. All 9 classes produce a real `<img>` with an embedded base64 JPEG, not the old SVG output.
2. An unrecognized class name still returns a valid embedded image (the Rogue fallback), not a crash or blank string.
3. A real hero (`renderCharacter()` → `characterPanel`) — an actual call site elsewhere in the codebase, not just a direct function call — renders with the new portrait, confirming the swap works through real usage.

## Not yet covered
- No human playtest yet of how these portraits look at actual in-game sizes (40px combat cards vs 150px creation-review portrait).
- Ancestry is now entirely absent from avatar visuals — flagged as a known, accepted tradeoff, not a defect.
- File size is now ~4.2MB.
- Bug 2 from the v0.75.3 report (back-row party members apparently taking melee damage) remains open.
- The travel-screen "old art" report from several turns back remains unresolved pending the person confirming which file/version they're viewing.
- An ancestry/culture/background plausibility system remains deliberately deferred per the person's request.

---

# Test Report — v0.75.24 (Missing-Art Audit, Batch 1 of 2)

## Production syntax
- Extracted production inline JavaScript: `node --check` — PASS.

## Source
Direct feedback: many screens have no background art; the person confirmed generic/reused art is fine, and asked for this to be done in a couple of checked-in batches rather than all at once.

## Investigation before implementing
Wrote a scanning script over every `sceneContent.innerHTML=` render function to find which ones reference `scene-art` and which don't. Found 30 bare screens total. Grouped them thematically and confirmed the grouping and batching approach with the person before writing any code.

## What changed (Batch 1, 12 screens)
All reuse already-embedded images — no new art sourced:
- `renderSpellbook`, `renderCompanionSpellbook` → spellbook tome art
- `showSkills`, `showTalents`, `showSecondaryDisciplines`, `showEquipment`, `showInventoryHub`, `useInventory`, `showPartyManagement`, `showCompanionLoyalty`, `showCompanionEquipment` → training-yard art
- `showCompanionGrowth` → the campfire/level-up art (matching `showLevelUp`, its hero equivalent, rather than the generic training art used for the rest of this batch)

## New targeted harness check (1 new, combined, 90/90 total passing)
Covers all 12 screens in one check, using real hero/companion fixtures. `renderCompanionSpellbook` required extra care: it only renders during that specific companion's active combat turn (`currentCombatActorId()!==id` returns early otherwise) and silently no-ops rather than erroring — the first version of this test lacked that gate and the check correctly failed, catching a fixture bug (not a wiring bug) before it shipped. Fixed by adding a minimal `state.encounter = {partyOrder:[id], turnIndex:0}` fixture.

## Not yet covered
- Batch 2 (~18 remaining screens: town/social, dungeon map, combat sub-panels, misc/debug) is pending, per the person's request to check in between batches.
- No human playtest yet of how the reused art looks across these 12 different screens' actual content density.
- Bug 2 from the v0.75.3 report (back-row party members apparently taking melee damage) remains open.
- The earlier stale-file mysteries (travel-screen art, arrival-engine "approach" stage) remain unresolved on the person's end; both were re-verified correct in the current source during this session.

---

# Test Report — v0.75.25 (Missing-Art Audit, Batch 2 of 2)

## Production syntax
- Extracted production inline JavaScript: `node --check` — PASS.

## Source
Continuation of the v0.75.24 audit; the person confirmed the direction ("this looks better, let's keep going") after reviewing batch 1.

## What changed (Batch 2, 17 screens/branches)
All reuse already-embedded images:
- Town art: `showCampaignDashboard`, `showPublicIncidents`, `showQuestJournal`, `showTownNPCs`, and all 3 branches of `classOpportunity`
- Inn art: `showDowntime`, `showInnRecruitment`, `showGamblingHouse`
- Training-yard art: `showCrafting`, `showForge`, `showTalentWeaponChoice`, `showCompanionLoyaltyTab`
- Dungeon art: `showDungeonMap`
- Combat art: `renderSurrenderOffer`, `showCombatHealTargets`, `showFieldSpellTargets`

**Deliberately excluded:** `showBalanceDiagnostics` and `showMagicItemTable` — both are dense mechanical/reference content, not scenes, consistent with how other reference-style screens (settlement dossiers, save manager) were already treated.

## New targeted harness check (1 new, combined, 91/91 total passing)
Covers all 17 screens/branches with real fixtures. Two fixture gaps were caught and fixed while building this test, before they could mask a real issue:
1. `classOpportunity`'s Rogue branch calls `skillBonus()`, which reads `hero.stats.DEX` — the first fixture attempt omitted `stats` entirely and threw; fixed by adding a complete stats object.
2. The non-Rogue class branch of `classOpportunity` needed its own separate hero fixture (a different class) to actually exercise that code path, since the function branches early based on `state.hero.class`.

## Audit closure
This closes the missing-art audit opened in v0.75.24: of the 30 originally-identified bare screens, 28 now have a background (12 in batch 1, 16 distinct functions across 17 insertion points in batch 2), and 2 (`showBalanceDiagnostics`, `showMagicItemTable`) were deliberately left as reference-only screens.

## Not yet covered
- No human playtest yet of how the reused art reads across this many different screens' content density, especially the three `classOpportunity` branches and the combat sub-panels, which are often on-screen only briefly.
- Bug 2 from the v0.75.3 report (back-row party members apparently taking melee damage) remains open.
- The earlier stale-file mysteries (travel-screen art, arrival-engine "approach" stage) remain unresolved on the person's end; the underlying code was re-verified correct both times.

---

# Test Report — v0.75.26 (Transparency Fixes + Dead Combat Code Removal)

## Production syntax
- Extracted production inline JavaScript: `node --check` — PASS.

## Source
Direct on-device feedback: (1) creation-section cards too opaque to see the backdrop art through, (2) two arrival-engine screenshots re-reported as still showing no art despite two prior verifications, (3) a report of a chess-pawn/dagger/wolf emoji overlay cluttering the combat screen, with a request to remove it.

## Investigation and what changed
1. **Creation-section card opacity**: reduced `.creation-section .card,.creation-section .choice-card` background from `rgba(34,24,16,.86),rgba(16,11,7,.92)` to `rgba(34,24,16,.5),rgba(16,11,7,.6)`.
2. **Mobile landing-hero scrim**: on the re-reported arrival-engine screenshots, noticed the landing screen (a related, adjacent report) also showed no visible art. Traced the actual CSS and found the mobile-only scrim gradient peaked at 94% opaque black exactly where the title sits (bottom-aligned via `align-items:flex-end`). Lightened to 10%→22%→62%.
3. **Combat silhouette emoji**: rather than accept the report at face value, traced the actual code path. `combatFigureGlyph()` — the function that would produce a dagger/wolf/chess-pawn-style icon — has zero call sites anywhere in the file. `.combat-silhouette`, the CSS class it would have used, likewise has zero JS generating an element with that class; its only two appearances are the CSS rule definitions themselves. `combatVisualStage()`, the function that actually builds the combat screen, was read directly and only outputs plain text nameplates. This is conclusive: the reported screen cannot be produced by the current file, regardless of caching behavior on the device. Removed the dead function and CSS as cleanup.
4. **Arrival-engine "still no art" re-report**: exhaustively re-walked every single CSS rule touching `.arrival-shell` in file order (8 rules total, printed in full) to rule out an override once and for all. No conflicting rule exists. Communicated this finding directly rather than repeating the same caching explanation a fourth time.

## New targeted harness checks (3 new, 94/94 total passing)
1. Confirms the creation-section card CSS opacity change is present in source.
2. Confirms the mobile landing-hero scrim CSS change is present in source.
3. Drives a real combat render using the exact scenario from the report (hero "Alden" the Rogue, companion "Wren Halloway" the Ranger, enemy "Boar" the beast) and confirms the output contains nameplates and the combat-stage backdrop, but zero `combat-silhouette` markup.

## Not yet covered
- No human playtest yet confirming the transparency changes read correctly on an actual device at actual screen brightness.
- The underlying stale-file/caching question for the arrival-engine screens and (evidently) at least one combat render remains unresolved on the person's end — the code itself has now been verified correct multiple times across multiple independent investigations.
- Bug 2 from the v0.75.3 report (back-row party members apparently taking melee damage) remains open.

---

# Test Report — v0.75.27 (Full-Bleed Backdrops Everywhere + 13 More Screens)

## Production syntax
- Extracted production inline JavaScript: `node --check` — PASS.

## Source
Direct feedback that several screens still had no art, and screens with art used a small banner strip above opaque cards rather than a full backdrop. Confirmed scope was "both" via clarifying question before starting.

## Architectural approach and why
Rather than touch 37 existing call sites individually (high risk of missing one or introducing inconsistency), converted the shared `.scene-art` CSS class itself from a bordered 130px banner into a full-bleed absolutely-positioned backdrop. Verified before relying on this that every existing usage is an unwrapped, direct child within `#sceneContent`'s innerHTML (checked several actual insertion contexts directly, including one with a very long embedded base64 string that initially looked like it had no match due to terminal truncation — confirmed via direct string search that it was present and correctly placed). This meant zero JS changes were needed for all 37 pre-existing screens to get the fuller treatment.

Also made `.card`'s background translucent globally (previously fully opaque; the v0.75.22 fix had only scoped this to the creation screen specifically).

## Deeper re-audit
The original v0.75.24 audit script only searched for the literal string `sceneContent").innerHTML=` — re-ran a broader version and found 13 more screens using slightly different code shapes that the first pass missed: `showStable`, `showFaith`, `showPublicIncident`, `showRumors`, `showPickpocketOpportunity`, `showEnchanter`, `showHuckster`, `showTravelDestinations`, `camp`, `showDisciplineSpellbook`, `showCombatItemTargets`, `showFieldMagic`, `renderLoot`. Also flagged `showWorldMap`, `renderCreate`, `renderCombat`, and `renderLibraryOfChronicles` as false positives (the latter three already have art via other mechanisms not caught by the scan; `showWorldMap` is a functional map UI, deliberately left bare like the Arrival Engine's "map" stage).

All 13 wired with reused art. One implementation slip caught and fixed during this pass: the first attempt at wiring `showTravelDestinations` accidentally inserted a no-op placeholder variable instead of the actual art div — caught by manually re-inspecting the diff rather than assuming the automated replacement succeeded, and corrected before testing.

## New/updated targeted harness checks (96/96 total passing)
1. One combined check driving real renders of all 13 newly-found screens with realistic fixtures (a Cleric with a valid `faith.id`, town data including an enchanter/huckster/NPCs/incidents, an active encounter for the combat-gated function, and pending loot).
2. Confirms the full-bleed `.scene-art` CSS and global translucent `.card` are both present in source.
3. Fixed an old v0.75.14 test that hardcoded "exactly 3" occurrences of `scene-art-travel` — broke the moment a legitimate 4th usage was added in `showTravelDestinations`; loosened to "at least 3."

Two fixture gaps were also caught and fixed while building the new combined check: `showFaith` needs `hero.faith.id` set (not just a bare faith object) for `faithDef()` to resolve correctly, and `showRumors` needs `hero.languages` populated for its `.join()` call.

## Not yet covered
- No human playtest yet of how the full-bleed backdrop treatment looks across this many different screens' actual content density — this is the single largest visual change made in one pass so far.
- Bug 2 from the v0.75.3 report (back-row party members apparently taking melee damage) remains open.
- The stale-file/caching mysteries from earlier in this session remain unresolved on the person's end for at least one screen (combat); the underlying code has been verified correct multiple times.

---

# Test Report — v0.75.28 (Real Root Cause of the Arrival Engine Mystery)

## Production syntax
- Extracted production inline JavaScript: `node --check` — PASS.

## Source
Direct feedback, reframed from earlier in this session: the person clarified they weren't looking at a stale/cached file — the "map" and "approach" arrival stages genuinely, currently look wrong and don't match the rest of the game's art.

## Root cause, found by tracing the actual render dispatch
`ArrivalEngine.render()` branches on `stage` and assigns `host.innerHTML` differently per stage. For "map" and "approach" specifically, this assigns an entirely separate procedural scene — a full animated SVG (route path, glowing markers, region labels) for "map", and a layered CSS scene (sky, hills, town silhouette, rain, fire) for "approach" — completely independent of `.arrival-shell`, the element the photo backdrop CSS was correctly attached to across three separate investigations earlier in this session. The photo was never broken; a different, opaque, hand-built scene was rendering on top of it the entire time.

## Fix
Replaced both stages' `host.innerHTML` assignments with the same simple `<section class="arrival-scene">` pattern already working correctly for fade/title/narration/choice/outcome — kicker text, copy text, and the stage's button, nothing else. Added `map` to the existing `fade/title/approach` shared-backdrop CSS group.

## New/updated targeted harness checks (2 total, 97/97 passing)
1. Updated an existing test (previously titled around "non-map stages," describing the old exclusion) to assert `map` is now correctly included in the shared photo-backdrop CSS group.
2. New: drives `ArrivalEngine.start()` and forces `stageIndex` to 2 (map) and 3 (approach), rendering each, and confirms neither produces the old procedural markup (`approach-world`, `realm-map-svg`) while both now produce the standard `arrival-scene` wrapper.

## Retrospective note
Three earlier investigations in this session (documented in prior TEST_REPORT entries) correctly proved the `.arrival-shell` CSS was present, complete, and un-overridden. All three were right about that specific claim — the CSS genuinely was correct — but incomplete, because none of them checked whether a *different* rendering path was producing the visible output instead. This entry corrects that gap.

## Not yet covered
- No human playtest yet confirming the map/approach stages now show the intended photo backdrop on an actual device.
- Bug 2 from the v0.75.3 report (back-row party members apparently taking melee damage) remains open.

---

# Test Report — v0.75.29 (Arrival Engine Art Matches Each Stage's Content)

## Production syntax
- Extracted production inline JavaScript: `node --check` — PASS.

## Source
Direct feedback after v0.75.28: the fix worked (real art now shows), but multiple stages incorrectly shared one photo regardless of what each stage's text actually describes.

## What changed
- Reassigned `title`+`map` from the hilltop-vista photo to the already-embedded travel-road photo, since both stages' text describes a road journey, not a vista moment.
- Left `fade` and `approach` deliberately without art. `fade` has no concrete scene in its text. `approach` describes rain, night, and a gate — none of which any currently-sourced image depicts; reusing a mismatched image again would repeat exactly what was being fixed.
- Added `overlay.dataset.outcome` (`"help"` or `"gate"`) set during `render()`, so the two different outcome endings can be styled differently. The `"help"` ending keeps the marsh photo (accurate — still set in the marsh). The `"gate"` ending gets an explicit `background-image:none` override so it doesn't silently inherit the marsh photo it doesn't match.

## Deliberate non-fix
Considered reusing the hilltop-vista photo for `approach` and the `"gate"` outcome as a stopgap, and rejected it — that image doesn't show rain, night, or a gate any better than the mismatch already being complained about. Left both plain rather than manufacture a different, still-wrong association.

## New targeted harness checks (2 new, 98/98 total passing)
1. Confirms the title+map CSS rule, the absence of any fade/approach background rule, the narration/choice/outcome shared rule, and the gate-ending override are all present and correctly scoped in source.
2. Drives `ArrivalEngine.render()` twice with different `this.choice` values at the outcome stage and confirms `dataset.outcome` correctly reads `"help"` vs `"gate"` — a real end-to-end check, not just a source-text check.

## Not yet covered
- No human playtest yet confirming these reassignments read correctly on-device.
- `approach` and the `"gate"` outcome still need dedicated art — flagged, not resolved. A prompt for this art hasn't been requested yet in this session.
- Bug 2 from the v0.75.3 report (back-row party members apparently taking melee damage) remains open.

---

# Test Report — v0.75.30 (Rain-Gate Art Closes the Arrival Engine Gap)

## Production syntax
- Extracted production inline JavaScript: `node --check` — PASS.

## Source
Person generated the dedicated art requested in v0.75.29 for the Approach stage: a rainy night gate scene matching the "Rain over Alderwick" text precisely.

## What changed
- Added a new `.arrival-overlay[data-stage="approach"] .arrival-shell{background-image:...}` rule using the new image.
- Replaced the v0.75.29 explicit `background-image:none` override for the gate-ending outcome with the same new image, since that ending is set at the same location (Alderwick's gate) as the Approach stage.

## Updated targeted harness check (1 updated, 98/98 total passing)
The v0.75.28 test asserting `approach`/`outcome-gate` were plain was updated to assert they now correctly share the new embedded image, alongside re-confirming title+map and narration/choice/outcome-help groupings are unchanged, and that `fade` remains deliberately plain.

## Status
This closes the Arrival Engine art gap entirely. Every stage's art now matches its actual content:
- fade: plain (no concrete scene in its text)
- title + map: road-journey photo
- approach + outcome (gate ending): new rain-gate photo
- narration + choice + outcome (help ending): marsh photo

## Not yet covered
- No human playtest yet confirming this reads correctly on-device.
- File size is now ~4.7MB, a larger jump than most prior single-image additions — flagged for awareness, no compression pass done yet.
- Bug 2 from the v0.75.3 report (back-row party members apparently taking melee damage) remains open.

---

# Test Report — v0.75.31 (Text Legibility Against Bright Arrival Backdrops)

## Production syntax
- Extracted production inline JavaScript: `node --check` — PASS.

## Source
Direct feedback with screenshots: the title/map arrival stages (golden-hour road photo added in v0.75.29) had nearly unreadable text.

## Root cause
Two compounding issues found by reading the actual CSS rather than guessing:
1. `.arrival-shell::after`'s vignette radial-gradient was `transparent 0 22%` at its center — exactly where the text block sits — meaning zero scrim protection in the one place it mattered most. This was invisible as a problem against earlier, generally darker photos, but the new bright golden-hour sky exposed it immediately.
2. `.arrival-kicker` and `.arrival-copy` had no `text-shadow` at all; only `.arrival-title` did. Two of three text elements had nothing helping them read against the photo.

## Fix
- Changed the vignette's center stop from `transparent` to `rgba(0,0,0,.4)`, giving a baseline dim everywhere including dead center, while keeping the existing edge-darkening progression.
- Added `text-shadow:0 2px 10px rgba(0,0,0,.85)` to `.arrival-kicker` and `text-shadow:0 2px 12px rgba(0,0,0,.85)` to `.arrival-copy`, matching the treatment `.arrival-title` already had.

This is a general fix (affects the shared CSS used by every arrival stage), not a one-off patch for this specific image — it should hold up against whatever art gets used here in the future.

## New targeted harness check (1 new, 99/99 total passing)
Confirms both new text-shadow rules and the updated vignette center value are present in source.

## Not yet covered
- No human playtest yet confirming this actually reads clearly on-device against the road photo.
- Bug 2 from the v0.75.3 report (back-row party members apparently taking melee damage) remains open.

---

# Test Report — v0.75.32 (Fixed Arrival Backdrop Tiling/Repeating)

## Production syntax
- Extracted production inline JavaScript: `node --check` — PASS.

## Source
Direct feedback with a screenshot showing a visible seam/repeat in the title/map stage's backdrop.

## Root cause
`.arrival-shell`'s base CSS rule never included `background-size`, `background-position`, or `background-repeat` — every per-stage rule only ever set `background-image`. Confirmed via direct grep that no per-stage rule sets these properties either, so nothing anywhere in the CSS ever constrained how the image should scale or repeat. Without `background-size`, the browser default is to render at the image's natural pixel size and tile (`background-repeat:repeat`) to fill the container — exactly the seam pattern shown in the screenshot.

This is a general bug affecting every arrival stage with a photo, not specific to one image — it was just visible in this particular image/viewport combination.

## Fix
Added `background-size:cover;background-position:center;background-repeat:no-repeat` to the base `.arrival-shell` rule, so it's inherited uniformly by every stage's background-image, current and future, without needing to be repeated in each per-stage selector.

## New targeted harness check (1 new, 100/100 total passing)
Confirms the base `.arrival-shell` rule includes all three new properties alongside its existing layout properties.

## Not yet covered
- No human playtest yet confirming the tiling is actually gone on-device.
- Bug 2 from the v0.75.3 report (back-row party members apparently taking melee damage) remains open.
