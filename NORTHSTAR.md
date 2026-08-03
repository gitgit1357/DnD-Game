# NORTHSTAR — Workflow Discipline for Roadwarden: Solo Realm

This document exists because drift already happened once. It's not a style
guide — it's a specific record of how the project went sideways for 13
versions, what that cost, and the concrete habits that prevent it from
happening again. Read this before touching anything else. It assumes no
memory of prior sessions — everything it refers to is either in this file
or in the other docs it points to.

## What actually happened (so the pattern is recognizable next time)

After v0.69.0, the project entered an extended build arc — a landing-page
rebuild, six Arrival Engine alphas, the v0.72.0 release, then a food-system
rebalance across three more versions. Two things went wrong simultaneously,
and they were the same root cause wearing two faces:

1. **Test reports stopped.** Thirteen versions shipped with no `TEST_REPORT.md`
   entry. Nobody decided to stop testing — each version just felt like "not
   done yet, I'll test at the end of this arc," and the arc never ended
   cleanly, it just flowed into the next thing.
2. **Version labels drifted independently.** Five different places in the
   code ended up disagreeing with each other and with the actual shipping
   version — including a player-visible message that announced the wrong
   rules version on every single load. Nobody was pausing at version
   boundaries to check these against each other.

Separately, deeper content problems accumulated because of a **related**
failure: development time went into systemic depth (institutional politics,
budget contests, seasonal simulation) that the project's own stated goal
didn't call for yet. The goal was *"complete a one-hour vertical slice
before expanding the world."* Institutional budget politics is real design
work, but a player doing a one-hour slice barely touches it — it's the kind
of system a solo developer finds satisfying to build precisely because it
has no natural stopping point. That's the tell: **work with no natural "done"
condition is where scope silently drifts.**

On top of that, two content mistakes made it into shipped code before being
caught in review, not before writing:
- A new companion was named one letter off from an existing name already in
  the random name pool ("Corran Ashe" vs. "Corren") — would have read as a
  typo to any player who saw both.
- An entire cinematic opening sequence was built around arriving at a town
  called "Fenreach," while the actual mechanical starting town had no
  canonical name override and generated randomly — and unrelated to both of
  those, there's a real world region *also* called "Fenreach" elsewhere on
  the map. Three different things sharing a name, discovered only when
  someone finally traced why the intro's promise didn't match the town
  screen.

None of these were caught by `node --check`. All of them were caught by
grepping for the specific string before shipping, and by asking "does this
collide with something that already exists" as a specific, separate step
from "does this run."

## The non-negotiable per-version loop

Every version — **including alpha/UX-only releases, which is exactly where
the 13-version gap started** — goes through all of these steps. Skipping a
step because "this one's small" is the exact reasoning that produced the gap.

1. **Before writing code:** read `DESIGN_FOUNDATION.md`'s pillars and the
   current vertical-slice milestone list. Ask: is what I'm about to build one
   of the named milestones, or is it new systemic depth? If it's the latter,
   say so explicitly and confirm that's actually wanted right now — don't
   default to building it because it's interesting.
2. **Check version currency first.** Compare `GAME_VERSION` in `index.html`
   against the most recent entry in `TEST_REPORT.md`. If they don't match,
   that itself is drift — stop and reconcile before adding anything new.
3. **While writing:** any new named entity (character, place, item) gets
   grepped against existing name/place pools before it's considered done.
   "Does this collide with something that already exists" is a distinct
   check from "does this compile."
4. **Bump `GAME_VERSION`.** It's a single constant at the top of the script
   — every title, save label, badge, and log message reads from it. There is
   no longer a reason for version strings to disagree; if you find one that
   does, that's a regression in this discipline, not a new problem.
5. **Run `node --check`** on the extracted script.
6. **Run `node tests/run_tests.js`.** Add new targeted checks for whatever
   was just built. Prioritize testing **the seam between new content and the
   existing engine** over re-testing engine internals that other features
   already exercise — that seam is where new bugs actually live.
7. **Write the `TEST_REPORT.md` entry before moving to the next feature.**
   Not after the next feature. Before. This is the step that broke last
   time, specifically because it felt safe to defer.
8. **Update `CHANGELOG.md` and `README.md`'s highlights.** Include what was
   *caught and fixed* during the pass, not just what was added — a mistake
   surfaced and corrected is more useful to the next session than a quiet fix.

## Scope discipline

Before starting any new systemic system (a new simulation layer, a new
economy, a new world-state model): check it against the milestone list in
`DESIGN_FOUNDATION.md`. If it's not on that list, it's not blocking — but
building it now instead of the named milestones is the specific decision
that created the original drift. Say so out loud rather than just starting.

A useful test: does this new system have a natural "done" condition, or does
it invite indefinite expansion (more factions, more budget categories, more
seasonal variables)? Systems in the second category are exactly the ones
that ate 13 versions last time. That doesn't mean don't build them — it
means don't build them *instead of* the vertical slice.

## Current state as of this handoff

Vertical slice milestones (from `DESIGN_FOUNDATION.md` / the original
handoff's "Next Milestones"):
- ✅ First companion — Wren Halloway, the Watch Deserter (v0.74.0-alpha1)
- ✅ First handcrafted quest — "What the Reeds Took" (v0.74.0-alpha2)
- ✅ First dungeon — delivered for free via the existing procedural site
  engine once the quest's `foe` field was set; verified via harness that the
  room graph and boss placement are correct
- ✅ First boss — "a revenant of the drowned patrol," verified via harness
  that it's correctly derived as a named, undead, fanatical enemy
- ✅ Companion payoff — recruiting Wren now has a guaranteed, specifically-
  timed reward (her secret confirmed at the boss's defeat), not just a
  generic RNG-gated mechanic shared by every companion
- ✅ v0.75.0: true permadeath replaced the old rescue-on-defeat mechanic,
  with a persistent cross-campaign Chronicle recording every fallen hero's
  epitaph, and a mandatory low-HP warning system shipped in the same
  version (stakes without warning is just cruelty, not design)

**A worked example of surfacing tension instead of picking a side:** the
original "no permanent soft-locks" pillar had been read as "no permanent
character death," which quietly worked against pillar 4 ("every decision
becomes part of your legend") — a rescue-and-continue defeat mechanic has
no real stakes. Rather than assume which one was "right" and build it, the
tension was named explicitly, three concrete directions were laid out with
their real trade-offs (keep-and-raise-stakes / true permadeath / player
toggle), and the person chose. This is the pattern for any future pillar
conflict: name the tension, give real options, let the person decide — do
not quietly resolve it by picking whichever direction is easier to build.

**What is NOT yet done, and is the actual next step:** a human has not
played this end-to-end in a browser. Everything above is verified at the
object-construction and engine-integration level through a stubbed-DOM Node
harness (`tests/harness.js`, `tests/run_tests.js`) — 36/36 checks passing —
which confirms the pieces connect correctly. It does not confirm the quest
is fun, that the pacing is right, that the boss fight is winnable/interesting
at expected party level, or that anything renders correctly in an actual
browser. **That playtest is the immediate next step for the next thread,**
before adding any more content or systems.

Known small gaps, non-blocking:
- The quest's `placeId` ("flooded_watchtower") has no atlas-location entry,
  so it produces no map marker.
- No visual/UI check has been done on the recruit-screen caption, the quest
  offer screen, or dungeon room rendering.

## Quick-start for a new thread

1. Read this file.
2. Read `DESIGN_FOUNDATION.md`.
3. Read the top entry of `CHANGELOG.md` and `TEST_REPORT.md` to confirm
   they describe the same version as `GAME_VERSION` in `index.html`.
4. If the person wants to keep building content: check the milestone list
   above before deciding what's next.
5. If the person wants to playtest: that's the actual next step — don't
   talk yourself out of it by finding more to build first.
