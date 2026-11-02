# Climate affinity native floating HUD — Script Mestre
- Display floating **ATK +20%** or **ATK -20%** at the affected Pokémon side, using the original Pixelify Sans font and outlined pixel aesthetic.
- Colors: calm mint green for bonus, warm coral for penalty. Animation floats up by 19px and fades in 1.12s, stays out of HUD hit targets and never blocks touch.
- Only trigger on a real active climate change or Pokémon entrance/switch; on expired weather remove any lingering label with no neutral toast. No recurring per-frame spam. No effect for neutral dual typing.
- Reuse `weatherSpeciesMultiplier` (actual 1.2 / .8), not a second independent list. Only communicate species-wide ATK damage modifier; do not misreport separate per-move FRLG -50% Water/Fire/Solar Beam rules as -20%.
- Display is scene-local and cosmetic, never saved, no damage, RNG, weather duration, actor stats, controls or existing attack VFX changes.
- Preserve original Arena outside campaign party/laboratory; test compiled Phaser touch emulator and existing regressions. Physical Android not tested.
