# Adventure Loop UX Audit — v0.67.0

## Purpose
v0.67 begins the player-facing integration phase. Major background simulation is frozen while navigation, action clarity, feedback, and campaign usability are audited.

## Findings from the current interface
- The campaign already had a useful top-level navigation foundation.
- Town play exposed more than twenty peer actions simultaneously, making common actions compete visually with specialist systems.
- Field Magic existed but was reachable primarily through Party/town buttons rather than a first-class navigation destination.
- The interface did not explicitly recommend a sensible next action based on quest, provisions, or party condition.

## Implemented in v0.67
- Added a dedicated Magic top-level tab.
- Added a contextual Suggested Next Step card in settlements.
- Grouped settlement actions into Immediate, Explore, Services, and Character panels.
- Preserved every pre-v0.67 settlement action; this is an organization pass, not a feature-removal pass.
- Made the action grouping responsive for narrow/mobile screens.

## Complexity law
Background systems may remain deep, but ordinary play should expose only the information and controls relevant to the player's current decision.

## Remaining audit work
- Conduct long-form browser playtests from character creation through several quests and seasons.
- Measure repeated clicks required for travel, healing, quest turn-in, inventory use, and combat recovery.
- Review combat, dungeon, travel, and forage screens for the same context-grouping treatment.
- Add clearer consequence summaries after important choices.
- Audit accessibility, keyboard operation, mobile layout, and text density.
- Do not claim public-release readiness until real-browser campaign testing is complete.
