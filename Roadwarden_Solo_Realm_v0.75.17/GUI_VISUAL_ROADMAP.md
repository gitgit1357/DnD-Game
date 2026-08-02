# Future GUI & Visual Overhaul Roadmap

This is intentionally **not** implemented in v0.64.0. It is preserved as a dedicated future milestone after simulation architecture stabilizes.

## Goals
1. Replace the button-heavy single-screen presentation with clear tabs/hubs (Adventure, Party, Journal, World, Inventory, Magic, Realm/Chronicle).
2. Keep context-sensitive primary actions visible while moving secondary/system actions into tabs.
3. Add lightweight visual presentation for travel, foraging, settlements, hazards, and combat.
4. Preserve the single-file/offline-friendly deployment model where practical.

## Art/licensing rule
Before shipping external graphics, perform a source-by-source license audit. Prefer public-domain, CC0, or licenses explicitly allowing redistribution/modification in a packaged game. Store attribution/license notes with the release. Do not assume an image is free merely because it is downloadable.

## Suggested visual layers
- Region/location scene art or reusable biome panels.
- Travel/weather overlays tied to seasonal simulation.
- Forage discovery cards.
- Enemy/party combat portraits and terrain backdrops.
- Icons for tabs, conditions, institutions, World Facts, reputation audiences, and Chronicle events.

## Architecture rule
UI presentation must consume existing state; it must not become a second source of gameplay truth.
