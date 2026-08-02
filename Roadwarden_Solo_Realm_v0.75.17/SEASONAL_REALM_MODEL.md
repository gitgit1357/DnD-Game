# Seasonal Realm Simulation & Regional Resilience Model — v0.62.0

## Governing laws

1. **Environmental conditions are state; disasters are threshold events.** Rainfall, temperature, river level, crop health, pest pressure, disease pressure, and wildfire risk change continuously. A World Fact is created only when those conditions exceed a region's ability to cope.
2. **The same weather does not produce the same damage everywhere.** Impact is driven by event intensity, regional exposure, and preparedness. A flood-adapted river culture can absorb water levels that devastate a normally dry, poorly drained region.
3. **Regions learn and forget.** Surviving a meaningful hazard improves preparedness modestly. Long hazard-free periods slowly erode unused preparedness and institutional memory.
4. **Recovery capacity matters.** Regions with stronger recovery capacity rebuild infrastructure and prosperity faster when no active seasonal crisis is present.
5. **Good seasons matter too.** Strong crop health and quiet seasons can rebuild food security, infrastructure, and prosperity rather than the simulation being disaster-only.
6. **Economic hardship accumulates across years.** Persistent low prosperity, food insecurity, or public order produces hardship years. Bandit pressure rises from those conditions rather than from an arbitrary random bandit roll.
7. **Society reacts.** High bandit pressure increases law-enforcement capacity/patrol effort. Enforcement can suppress some insecurity but creates economic burden.
8. **Seasonal facts use the existing causal engine.** Once created, a flood, drought, infestation, severe winter, wildfire, disease crisis, or bandit surge is a normal World Fact: it can enter the Director, affect travel/commerce, transmit delayed ripples, generate contracts, and become history.

## Calendar

- 360-day campaign year
- Spring: 90 days
- Summer: 90 days
- Autumn: 90 days
- Winter: 90 days
- Seasonal climate rolls establish broad conditions at season change.
- Weekly updates create drift and hazard checks.
- Annual socioeconomic assessment evaluates long-run prosperity/order/food stress.

## Regional profile dimensions

Each region defines:
- climate identity
- hazard exposure
- preparedness by hazard
- recovery capacity
- baseline food security
- baseline prosperity
- baseline public order

Hazards currently modeled:
- flooding
- drought
- crop infestation
- wildfire
- severe winter
- storms
- disease pressure
- socioeconomic road banditry

## Core impact principle

Conceptually:

`impact = hazard intensity × exposure × vulnerability after preparedness`

Preparedness reduces vulnerability but never makes a region immune. Rare hazards can therefore be especially destructive where infrastructure and institutional experience are weak.

## Long-term socioeconomic feedback

Bad years can reduce:
- food security
- prosperity
- public order
- infrastructure

Repeated hardship raises bandit pressure. Once road insecurity becomes independently consequential, it becomes a World Fact. Authorities then increase law-enforcement effort, creating a feedback loop rather than a one-way decline.

## Guardrails

- No per-farm simulation. State is regional.
- No hazard becomes a quest merely because a weather value moved slightly.
- World Facts require threshold-crossing impact.
- Seasonal crises remain subject to the strict campaign clock and delayed realm transmission.
- Historical truth and public knowledge remain separate.
