# T44 — Native abilities import compatibility

## Observable failure
The 2026-11-02 native client (src-d4dfea5df3) changes the exact config import in habilidades.js. Visual guard run 41532659667 fails during build-preview before any WebGL screenshot, after the optional ball preload compatibility is handled.

## Acceptance
Retain the upstream config import byte-for-byte, add exactly one weatherFromMove import only when its original config symbols can be verified, and refuse ambiguous/unrelated changes. Do not change battle mechanics, VFX, save schema, trainer distribution or map art. Validate unit test, full build, visual guard and desktop/mobile screenshots before merge.
