# The Forum 2026 Prototype Workspace

## Run
```bash
npm install
npm run dev
```

## Current Routes
- `/` Entry Gate (narration agreement + sentinel portal)
- `/nexus` 3D-style portal world hub
- `/chronomap` ChronoMap Chamber
- `/forum/:id` Semantic Thread Lens
- `/gauntlet` Challenge Contracts + Trial Modules
- `/round-table` Staging + room whiteboard + file scan shelf
- `/arena` WorldSpeak Arena with intro video and AI moderation overlays
- `/ledger` Public Accountability Ledger + appeals
- `/oracle` Oracle Watchtower
- `/vault` Relics + Resource Vault
- `/inner-temple` Inner Temple
- `/about` Build summary

## State Systems
- `src/state/forumState.tsx`: debate lifecycle, moderation, receipts, appeals, ledger.
- `src/store/chronoMapSlice.ts`: nodes/edges/time windows/pulse events.
- `src/store/reasoningSlice.ts`: trial modules, stability meter, heatmap, badges/relics.
- `src/store/insightSlice.ts`: topic signals, disagreement radar, dissonance flags, council directives.
- `src/store/templeSlice.ts`: reflections, orb states, session history, insight profile.
- `src/store/realmState.tsx`: persistent realm provider and synchronization bridge.

## Intro Media Present
- `public/videos/sentinel_gate.mp4`
- `public/videos/arena-intro.mp4`
- `public/videos/chronomap-intro.mp4`
- `public/videos/oracle-intro.mp4`
- `public/videos/inner-temple-intro.mp4`
- `public/audio/ForumEnter.mp3`
- `public/audio/arena_croud_chant.mp3`

## Optional Intro Media Still Useful
- `public/videos/gauntlet-intro.mp4`
- `public/videos/round-table-intro.mp4`
- `public/videos/ledger-intro.mp4`
- `public/videos/vault-intro.mp4` (placeholder hook already wired)
