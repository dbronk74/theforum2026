# The Forum 2026 - Asset Tracker

## Deployed Intro Videos (present in `public/videos`)
- `sentinel_gate.mp4`
- `arena-intro.mp4`
- `chronomap-intro.mp4`
- `oracle-intro.mp4`
- `inner-temple-intro.mp4`
- `gauntlet-intro.mp4`
- `vault-intro.mp4`

## Still Missing (referenced by code)
- `round-table-intro.mp4`
- `ledger-intro.mp4`

## Audio Present
- `public/audio/ForumEnter.mp3`
- `public/audio/arena_croud_chant.mp3`

## Path Requirements
All runtime media should resolve through:
- `assetPath('videos/<name>.mp4')`
- `assetPath('audio/<name>.mp3')`

Do not use root-absolute media URLs (e.g. `/videos/...`) because GitHub Pages serves from `/theforum2026/`.

