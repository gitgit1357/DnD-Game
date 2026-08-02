# v0.58 Strict Campaign Clock & Temporal Accounting

## Core law
All sequential systems consume one canonical campaign clock. No subsystem may infer elapsed days from action count.

## Clock precision
- Persistent world clock: day + hour + minute.
- Combat: 6-second rounds accumulated into minutes before advancing the world clock.
- Day rollover is authoritative for food, transport upkeep, incidents, World Fact lifecycle, cross-region ripples, knowledge transmission, reputation decay, and world-event checks.

## Travel scale
- 1 travel leg = approximately 12 road miles.
- On foot: steady 4h/leg (~3 mph), careful 6h/leg, fast 3h/leg.
- Transport speed multipliers modify those times.
- Cross-region trips therefore naturally consume multiple days.

## Representative action costs
- Foraging: 2h.
- Practical skill rank training: 4h after prerequisites are met.
- Manual study: 8h.
- Dungeon exploration turn: 10 minutes.
- Combat round: 6 seconds.
- Routine market buy/sell: 10 minutes per transaction.

## Reputation and absence
Reputation is not erased by time, but social familiarity decays when a hero is absent.
- Broad regional renown begins decaying only after 1 year without either visiting the region or generating new recognized deeds there.
- Thereafter it decays gradually (roughly 1 point per 180 days of continued absence), never below 25% of the hero's historical peak regional renown through absence alone.
- Audience awareness decays faster than esteem; institutional/historical memory is more durable.
- Realm fame does not automatically decay through ordinary absence.
- Chronicle truth and recorded historical deeds never decay.

## Design implication
Time now connects travel, skill advancement, world facts, rumor transmission, ripples, supplies, and reputation. Future timed mechanics must call the canonical clock rather than inventing independent counters.
