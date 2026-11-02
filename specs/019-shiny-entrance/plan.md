# Plan
- Files: party-battle.js passes saved Shiny on team and wild battle descriptors, shiny-fx.js owns one cosmetic effect, build-preview.mjs copies module to versioned browser build.
- Trigger only after actual Pokéball sendout callbacks; wild opponent already present starts when battle party installs. Handle switches without duplicating save writes.
- Unit test Graphics lifecycle, bounds, cleanup; compiled Chromium touch test observes real Phaser Graphics, timeout and no fake victory, screenshot; full npm test/check/reuse and browser suite.
- Preserve approved move VFX, native Arena and PMD assets; revert this isolated branch if a gate fails; merge only after entire CI and browser.
