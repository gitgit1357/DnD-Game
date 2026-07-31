# v0.58 Temporal Audit Report

## Corrected high-impact distortions
- Combat rounds no longer consume one full hour; they consume 6 seconds and accumulate into the minute clock.
- Dungeon exploration turns now consume 10 minutes instead of 30.
- Travel legs now have a physical scale of about 12 road miles and mode-specific durations: steady ~4h, careful ~6h, fast ~3h on foot before transport modifiers.
- Foraging now consumes 2 hours per attempt.
- Routine market purchases/sales consume 10 minutes rather than 1 hour each.
- Practical rank advancement consumes 4 hours; manual study consumes 8 hours.
- Inn rest advances precisely to 07:00 the following morning.

## Canonical rollover systems
Only crossing midnight triggers daily food, transport upkeep, public incidents, World Fact lifecycle, cross-region ripples, knowledge transmission, reputation decay processing, and world-event checks.

## Reputation time behavior
- Visiting a region or generating newly recognized deeds there refreshes its social recency clock.
- Ordinary regional familiarity begins decaying after roughly one year away.
- Continued absence decays broad renown slowly, roughly one point per 180 days, with a 25% historical-floor guardrail.
- Audience awareness fades faster than esteem; durable historical memory remains.
- Realm fame/infamy does not automatically decay from ordinary absence.
- Chronicle events never disappear because of time.

## Remaining tuning backlog
Many one-hour social/administrative actions still intentionally use the canonical clock wrapper and can now be tuned individually without breaking day accounting. Future passes should calibrate conversations, rumor investigation, crafting, repairs, gambling, and civic actions against the same minute model rather than adding new independent counters.
