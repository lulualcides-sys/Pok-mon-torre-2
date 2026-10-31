# Implementation plan
- Make `torre2-weather-status-float.js` a standalone native Phaser text effect, reading weather.js authoritative multipliers.
- Install exclusively from `installPartyBattle`, so original Arena stays unchanged. Process weather revision in the scene update event, only during live combat; track roster index on switch.
- Copy new module through explicit `build-preview.mjs` file list. Guard against double status labels and clean up tweens/text on scene shutdown.
- Unit test all four climates, both signs, neutral, expiry, switch, duplicate prevention. Chromium mobile lab test checks Bulbasaur +20 and Squirtle -20 under sun, Rain Dance changes, screenshot and save integrity.
- Require CI including browser regression and visual guard. Publish only after merge and HTTP verification.
