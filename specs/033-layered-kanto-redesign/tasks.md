- [x] Inspect current code and PR #417 (draft f2d08891, not merged).
- [x] Isolate work from main 105b63c924e5 and PR #418 campaign test work.
- [x] Model and interaction tests (progress, three buildings, no hitbox overlap).
- [x] Layered Cerulean scenery and native campaign integration (PR #419).
- [x] Initial atlas desktop/touch WebGL navigation and screenshots (Actions 41238350920).
- [x] Surface atlas c49aa23: actual WebGL desktop/touch first arrival, doors, menus, animation and trainer-to-battle transition (Actions 41263204733).
- [ ] Artistic quality gate against approved reference.
- [ ] Campaign menus and remaining distinct cities.
- [ ] Complete regression, review, integration and verified publication.

## Atlas continuation — PR #421
- Original transparent atlas: six independent cropped frames, 1536×1024, 564896 bytes.
- First Brock result anticipates city preload; leaving Cerulean evicts atlas after resolving progress.
- All six party cards accessible; doors aligned to art; NPC hitboxes checked against building zones.
- Main through 634bbc4 merged; AUTO, move-role and VS Seeker fixes preserved.
- Local unit suite: 377 passed after collection portrait and capture-source coverage; syntax/reuse checks passed. Legacy Steel certification remains outside this work.
- Browser failure b2ae2da resolved: test awaited two Phaser poststep events to register newly rebuilt input zones. Actions 41261246927 passed desktop/touch navigation, first-arrival and native battle entry on 5a68d43. Final vegetation adjustment passed in Actions 41261379057.
- Original surface atlas added: 512×512, four cropped 256px tiles, 173352 bytes. Animated water, pale paving, grass and masonry verified in actual WebGL; shared timer and both-atlas eviction tested. Cais/boat and gardens refined.
- Pokédex portrait cards and Bag inventory icons implemented. Collection loader has tests for partial completion, fast pagination, shutdown and unrelated texture preservation. Browser verification passed in Actions 41299829399 on 9212ac6: 22 Pokédex portraits, 5 Bag icons, exact saved-byte preservation, texture cleanup, desktop/touch navigation and native battle entry. Captures inspected.
- Artistic gate remains OPEN: composition, bridge/street-furniture detail and other cities still need work. Secondary-menu redesign is partial, not complete.

## Upstream compatibility boundary
The external client changed to `src-2755ffa8ef` during verification and failed the existing `ui-balls` patch guard before browser tests. The capture now defaults to `src-97f03e6e1b`, the module version verified in Actions 41263204733 and 41299829399. `POKEARENA_SOURCE_VERSION=latest` explicitly enables upstream compatibility audits; normal builds do not silently adopt new modules. Reports retain discovered/selected versions and the original homepage hash. Shared unversioned assets are still fetched and checked; this is not a complete immutable source archive. Full regression is rerun after this default change.

## Regional expansion — 2026-11-01
- Added original cropped regional gym atlas and replacement boat; shared Kanto texture cache.
- Added distinct Pewter, Vermilion, Celadon, Fuchsia, Saffron, Cinnabar, Viridian and Indigo scenery. Elite checkpoints share the League palace. Native routes/caves remain separate.
- City residents are decorative; three service entrances retain native Center/PC, Mart and gym actions. No walking or arena changes.
- Extended WebGL desktop/touch fixtures to all regional stages, exact save preservation and visible gym-door clicks. Local 381 tests, syntax, reuse and preview build passed before final door alignment change; rerun and CI evidence required.
- Remaining: review actual regional captures and polish art; full gym interior/subboss work and remaining secondary menu art are not claimed complete. No publication.
