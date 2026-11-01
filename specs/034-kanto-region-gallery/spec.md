# T34 — Kanto eight-region visual gallery (isolated, preview-only)

Approved 2026-10-31: Pallet → Route 1 → Viridian → Route 2/Viridian Forest → Pewter/Brock → Route 3 → Mt. Moon → Route 4. Cerulean/Misty remains the **first integrated artistic prototype** on PR #421, which must stay draft until approved. This gallery is a separate experimental branch, not a replacement for PR #421.

## Contract
- Native Phaser/WebGL scene, built from original pixel-geometry. **Not** a screenshot pasted onto a game scene, **not** production gameplay, **not** a claim of completed Kanto maps.
- Three reusable map families: city, route (including forest), cave. Each region uses its own palette, paths, landmarks and biome. Pallet has Oak's lab and houses but no invented Mart or Gym. Route 1 has no invented trainers; city NPCs are not battle trainers.
- Zero changes to battle HUD, campaign source, moves, VFX, difficulty, stage/trainerIndex, RNG or saves. Native preview uses a separate Phaser Scene, loaded only by the CI browser harness, never by the deployed game.
- Deliver 16 actual Chromium screenshot files (8 maps × desktop/mobile), plus index.html and report.json in one GitHub Actions artifact. Every caption must say preview-only/not integrated.
- Gate: focused unit tests, source check, native client build, Chromium WebGL renderer=2, eight clickable next transitions on each viewport, no page errors, byte-identical localStorage. **No merge or Pages deployment** until the user approves and the eventual real map integration passes all campaign/visual regression gates.
- Next integration work, after Cerulean approval: connect Pallet + Route 1 with native movement and real battle/capture services, then advance canonically toward Brock before Misty. Never force-reset existing saves.

## Evidence status
CI artifact is proof only when workflow completes successfully; the presence of test code alone does not prove screenshots exist. GitHub PR #421 remains independent.
