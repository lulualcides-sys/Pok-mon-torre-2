- [x] Inspect current code and PR #417 (draft f2d08891, not merged).
- [x] Isolate work from main 105b63c924e5 and PR #418 campaign test work.
- [x] Model and interaction tests (progress, three buildings, no hitbox overlap).
- [x] Layered Cerulean scenery and native campaign integration (PR #419).
- [x] Initial atlas desktop/touch WebGL navigation and screenshots (Actions 41238350920).
- [ ] Final atlas head: first-arrival, actual door taps, trainer-to-battle transition and screenshots.
- [ ] Artistic quality gate against approved reference.
- [ ] Campaign menus and remaining distinct cities.
- [ ] Complete regression, review, integration and verified publication.

## Atlas continuation — PR #421
- Original transparent atlas: six independent cropped frames, 1536×1024, 564896 bytes.
- First Brock result anticipates city preload; leaving Cerulean evicts atlas after resolving progress.
- All six party cards accessible; doors aligned to art; NPC hitboxes checked against building zones.
- Main through 0961adc merged without changing its AUTO, cooldown or move-role fixes.
- Local unit suite: 370 passed; syntax/reuse checks passed. Legacy Steel certification remains outside this work.
- Browser failure b2ae2da resolved: test awaited two Phaser poststep events to register newly rebuilt input zones. Actions 41261246927 passed desktop/touch navigation, first-arrival and native battle entry on 5a68d43. Final vegetation-only adjustment still awaits new screenshots.
- Artistic gate remains OPEN: buildings improved, but water, masonry, foliage density and landscape composition still fall short of the concept. Remaining cities/secondary menus are not complete.
