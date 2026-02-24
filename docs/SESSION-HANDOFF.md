# The Forum 2026 - Session Handoff

Last updated: 2026-02-24
Repository: https://github.com/dbronk74/theforum2026
Latest commit at write time: 61f98b2
Live URL (GitHub Pages): https://dbronk74.github.io/theforum2026/

## Current Status
The project is in active prototype mode with multi-branch realm flows, intro gating, AI-moderated debate simulation systems, and persistent client-side state.

The site is deployable and builds successfully with:

```bash
npm run build
```

## What Is Implemented

### Core Routes
- `/` Entry Gate (agreement + narration + sentinel portal)
- `/nexus` 3D-style portal hub
- `/chronomap` ChronoMap Chamber
- `/forum/:id` Semantic Thread Lens
- `/gauntlet` Trial modules + contract queue
- `/round-table` Staging + room realm + whiteboard + file scan shelf
- `/arena` Arena intro + chant + live moderation overlays
- `/ledger` Accountability records + appeal resolution
- `/oracle` Signal radar + directives + translator
- `/vault` Treasury/relic/economy panels
- `/inner-temple` Reflection branch with persistent artifacts
- `/about` Build summary

### State Architecture
- `src/state/forumState.tsx` (debate lifecycle)
- `src/store/chronoMapSlice.ts`
- `src/store/reasoningSlice.ts`
- `src/store/insightSlice.ts`
- `src/store/templeSlice.ts`
- `src/store/realmState.tsx` (sync + persistence)

### Deployment
- GitHub Actions workflow: `.github/workflows/deploy-pages.yml`
- GitHub Pages base-path handling fixed for media/static assets.

## Known Open Items (High Priority)
1. Add missing intro videos:
   - `public/videos/round-table-intro.mp4`
   - `public/videos/ledger-intro.mp4`
2. Optional: replace placeholder clips/watermarked clips with final cinematic versions.
3. Add reducer/unit tests for new realm slices.
4. Add interaction tests for key route flow (gate -> nexus -> branch).

## What Was Recently Fixed
- GitHub Pages media loading issue: hardcoded absolute paths were replaced with base-aware asset helper:
  - `src/utils/assetPath.ts`
- Added/pushed missing clips found on disk:
  - `public/videos/gauntlet-intro.mp4`
  - `public/videos/vault-intro.mp4`

## Resume Checklist After Reboot
1. Open this repo:
   - `/Users/macmini2/Desktop/website/forum2025-full`
2. Pull latest:
   ```bash
   git pull
   ```
3. Start dev server:
   ```bash
   npm run dev
   ```
4. Open browser:
   - local: `http://localhost:5173/`
   - deployed: `https://dbronk74.github.io/theforum2026/`

## Suggested Next Work Block
1. Import `round-table-intro.mp4` and `ledger-intro.mp4`.
2. Push and verify branch intro behavior on Pages.
3. Add test baseline for slices and critical flows.

