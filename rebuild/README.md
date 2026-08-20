# Roadwarden: Solo Realm — Production Rebuild

This directory is the production rebuild path. The repository root remains the frozen legacy/reference prototype and salvage source.

## Governing rule
The world is authoritative. UI and DM layers are interfaces and may not own persistent world facts.

## Current phase
Phase 1 — Architecture and Salvage Audit.

## Technical spike
The rebuild uses native JavaScript ES modules so the same source can execute in a browser and be imported directly by Node tests without a bundler. This is intentionally minimal and may be revisited if a later gate demonstrates a concrete need.

Run tests from this directory with:

```sh
npm test
```

Serve the browser spike with any static file server, for example:

```sh
npm run serve
```

Then open `http://localhost:8000`.
