# L18 API URL Changes — molly

**Date:** 2026-05-24
**Cloud URL:** https://molly-app.occachildcare.ca

## What I Changed
- **Created `frontend/src/config.ts`** — New central config file with a `USE_CLOUD` toggle that controls both API and WebSocket base URLs.
- **Modified `frontend/src/api/client.ts`** — Replaced hardcoded cloud URL with import from `src/config`.
- **Modified `frontend/src/hooks/useWebSocket.ts`** — Replaced hardcoded WebSocket URL with import from `src/config`.

## How to Switch Between Local and Cloud (specific to MY project)
Open `frontend/src/config.ts` and change line 4:
- **Cloud (current):** `const USE_CLOUD = true;` → hits `https://molly-app.occachildcare.ca`
- **Local dev:** `const USE_CLOUD = false;` → hits `http://localhost:8000`

That single boolean controls both the REST API URL (`client.ts`) and the WebSocket URL (`useWebSocket.ts`).

## After Switching
Just press **Cmd+R** in the iOS Simulator to reload Metro — no full rebuild needed. The config file is plain TypeScript imported at runtime, so Metro's hot reload picks up the change immediately.

## Why I Chose This Approach
The project had no config folder, env files, or Platform.select() pattern — URLs were hardcoded directly in `client.ts` and `useWebSocket.ts`. Rather than introducing a new dependency (like react-native-dotenv) or a build-time env system, I added a single `config.ts` file that both modules import from. This is the lightest change: one new file, two one-line edits, and a clearly commented toggle at the top of the config. Anyone opening `config.ts` immediately sees how to switch environments.

## Files Inspected but Skipped
None — the only two files containing server URLs were `client.ts` and `useWebSocket.ts`, and both were updated.
