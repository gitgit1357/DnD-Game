# Roadwarden: Solo Realm — Design Foundation

## What this is
A single-file, browser-based solo RPG. No build system, no server, no
external assets beyond Google Fonts — everything else (art, sound, maps) is
generated in CSS/SVG/Web Audio at runtime. `index.html` is the entire game.

## Core pillars
1. **No permanent soft-locks — in progression, not survival.** Any failed
   check, destroyed quest item, or bad roll must leave a recovery path for
   *advancing the story*. This does NOT extend to the hero's life: as of
   v0.75.0, character death is real and permanent (see pillar 5). The two
   were conflated for a while — a rescue-on-defeat mechanic existed under
   this same pillar — until it became clear that "no soft-locks" and "no
   real stakes" are different promises, and the second one was undercutting
   the chronicle premise. If a mechanic can strand the player's *progress*
   without a way forward, that's a bug. A mechanic that lets the player
   *lose their character* is not a bug — it's the point.
2. **Discoverability.** A mechanic that works but is buried (companion
   growth, knowledge-item loot, a stat nobody explains) is a bug, not a
   feature waiting to be found.
3. **One coherent progression economy.** XP curve, attribute caps, spell
   costs, and loot rates are one interlocking system, not independent
   knobs. Changing one is expected to mean checking the others.
4. **Every meaningful decision becomes part of the player's legend.** The
   opening choice, a companion's secret, a boss's resolution path — these
   should have visible, lasting consequences, not just flavor text.
5. **Death is permanent and it is the legend, not a game-over screen.**
   When the hero falls, that's recorded in a persistent Chronicle (a
   localStorage log independent of any single campaign's save) as an
   epitaph — name, class, level, cause, place, day, and who survived to
   tell it. The autosave is deliberately cleared on death so a fallen hero
   cannot be resumed. The player then begins a new hero. Because failing to
   flee, pushing one room too far into a dungeon, or refusing to retreat
   can now permanently end a character, the game owes the player a clear,
   unmissable warning before that happens — see the HP-condition warning
   system (`heroConditionTier`, `maybeWarnCriticalCondition`) introduced
   alongside permadeath for exactly this reason. Adding stakes without
   adding fair warning would just be cruelty; the warning is not optional
   scope, it shipped in the same version as the death mechanic itself. As of
   v0.75.1, this extended to a mercy cap: no single attack can one-shot a
   hero who was at full HP — the first hit of any encounter is guaranteed
   to leave at least 1 HP and trigger the warning, rather than skipping
   straight past every tier the warning watches for. This protection is
   scoped strictly to full HP; an already-wounded hero has no such cap.

## Two layers of systems (and the tension between them)
The codebase currently has two layers of very different character:

- **Systemic/generative layer:** procedural quests, dungeons, companions,
  regional institutional politics, budgets, seasonal effects, field magic.
  Deep, well-tested, largely invisible to a short session.
- **Authored/narrative layer:** the Arrival Engine opening sequence, and
  (as of v0.74.0-alpha1) the first handcrafted companion and the vertical
  slice quest arc being built around them.

These are not in conflict, but they compete for development time, and the
project's own stated goal — *"Complete Project Fenreach as a polished
one-hour vertical slice before expanding the world"* — points at the
authored layer. When in doubt about what to build next, the vertical slice
milestones (first companion, first handcrafted quest, first dungeon, first
boss) take priority over new systemic depth.

## Naming inconsistency — RESOLVED in v0.74.0-alpha2
~~The Arrival Engine's own text generator hardcodes...~~ Fixed: all Arrival
Engine references to the destination town now say "Alderwick," matching the
already-tested Greenmarch settlement lore (bailiffs, granary quest, road
names). The unrelated world region literally named "Fenreach" elsewhere on
the map (with its own canonical town, Mirecross) was untouched — it was
never part of the confusion, just a coincidental name reuse.

## Art direction
Graphic novel style: heavy ink, grayscale, selective gold accents.
Cinematic illustration treatment reserved for major story moments, not
routine UI. Currently executed entirely in CSS/SVG (Arrival Engine's map
and settlement-approach scenes) — no raster art assets exist in the
package yet.

## Testing discipline
A Node harness (`tests/harness.js`, `tests/run_tests.js`) loads the
production script into a stubbed-DOM `vm` context and exercises real
functions directly. See `NORTHSTAR.md` for the full per-version workflow
this depends on — it's the authoritative checklist, written specifically
because this discipline broke down once already.

## Backlog — not scoped yet, logged so context isn't lost
**Party expansion via level/reputation.** Idea from the person, explicitly
flagged as "for later" rather than now. Two distinct directions, not the
same feature — worth deciding between them rather than assuming:
- **Minions/followers attached to existing companions**, scaling with that
  companion's level. Likely the smaller lift: if a minion acts as an
  attached bonus (extra attack, extra HP pool) rather than an independent
  combat actor, it may not need new formation/turn-order logic at all.
- **Raising the actual party-size cap** (currently hardcoded at 2 — see
  `if(state.companions.length>=2)return` in the inn recruit function),
  unlocked by level and/or reputation thresholds. Bigger lift: touches
  formation (front/back row logic), combat turn order, the recruit/party
  card UI (recently fixed for overflow bugs — more cards may strain that
  layout further), and combat balance math throughout, since more bodies in
  the fight changes difficulty everywhere.

Before building either: check this against the vertical-slice milestone
list per the Northstar's scope-discipline section — this is new systemic
depth, not a named milestone, so it's a deliberate "yes, build this now"
decision when the time comes, not a default next step.

## Reference docs
Systemic depth is documented per-system: `INSTITUTIONAL_POLITICS_MODEL.md`,
`INSTITUTIONAL_BUDGET_MODEL.md`, `POLITICAL_AGENDA_MODEL.md`,
`SEASONAL_REALM_MODEL.md`, `FIELD_MAGIC_MODEL.md`, `REALM_REACTION_MODEL.md`,
`REALM_RIPPLE_MODEL.md`, `REALM_TRANSMISSION_MODEL.md`,
`RESILIENCE_INVESTMENT_MODEL.md`, `SECONDARY_WORLD_FACT_MODEL.md`,
`TIME_ACCOUNTING_MODEL.md`, `TEMPORAL_AUDIT_REPORT.md`. These remain
accurate and don't need duplication here — this document exists to state
the pillars and priorities that decide what gets built next, which none of
the per-system docs cover.
