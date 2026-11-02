# T17 — Shiny entrance in real battle
**Observable:** a Shiny party member and a Shiny wild opponent display nine legible, crisp native Phaser stars around the real sprite for 1.5 seconds after it appears. Subsequent real switches replay the entrance. Normal Pokémon receive no stars.
**Sources:** original, asset-free Graphics code adapted from the repo's historical PR #17 cosmetic draft, without adopting its unreviewed asset changes. Not a new attack/move, sprite, hitbox, recolor or combat renderer. No third-party assets.
**Safety:** zero changes to outcomes, RNG, rate, HP, controls, save, hitboxes, moves, cooldown or original native modes. Cleanup Graphics + listeners on 1.5s, KO, shutdown or scene destroy.
**Not complete:** real canonical Shiny palette art and 1.5s visual validation on an actual Android device. This CI's mobile emulator is Chromium touch emulation, not physical Android.
