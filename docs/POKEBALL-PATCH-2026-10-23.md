# Pokéball body synchronization — 23 October 2026

Restore point: `backup/ball-system-d53a756` (`d53a75675db62547581fc68846a2092c37460533`).

References inspected frame by frame: user-supplied `1000993418(3).mp4`, 1–3 seconds (short arcing entry, luminous opening, materialization), and `1000993754(3).mp4`, 32–36 seconds (absorption, grounded ball, shakes, GOTCHA). They guide timing and behavior; no video or raster overlay is shipped.

The patch adapts the existing Phaser choreography and existing 16×16 ball atlas. It adds no attacks, changes no approved move renderer, and uses no new third-party assets. The four-source requirement for new moves does not apply to this repair of existing ball infrastructure.

- Real PMD head/feet metadata and the full-size rendered sprite determine a stable body anchor. Shrinking preserves this anchor while moving it into the ball; it does not recompute a target from shrinking bounds.
- A narrow, parallel pixel beam replaces the triangular fill. The mouth's luminous center matches the beam origin. Both are in Phaser world coordinates and receive the same camera transform.
- Initial release and player/enemy replacement share one lifecycle. The actor stays completely hidden during THROW; OPEN/RELEASE materializes it in place. Recall removes the body and ground effects before replacement.
- Game-level elapsed time, rather than frame counts, drives the shared transition. Shutdown detaches listeners. A lock suspends native simulation (projectiles, status damage and regeneration), while the animation clock remains live.
- Capture reuses the same body transforms and beam, rotates its physical ball, pulls the actor inward, hides its shadow, and progressively releases it on breakout. Existing catch rolls, inventory and party/PC registration remain authoritative. Capture also saves current party HP.

Validation commands: `npm test`, `npm run check`, `npm run test:browser`, `node tests/ball-choreography-browser.cjs`, `node tests/source-client-smoke.cjs`.

The local environment cannot launch Chrome: its process singleton socket is denied. The legacy browser command was attempted and blocked at startup. Actual Phaser/WebGL browser validation runs on GitHub Actions in `ball-patch-validation.yml`; it saves screenshots and metrics, and the existing Pages workflow runs the full Phaser smoke test again before deployment. Local checks must never be described as successful browser validation.
