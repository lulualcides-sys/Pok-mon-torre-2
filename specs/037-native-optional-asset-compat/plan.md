# Plan
Source: `tools/pokearena/build-preview.mjs`; new pure guard `tools/pokearena/optional-ui-balls.mjs`; regression `tests/optional-ui-balls.test.js`.

The original copied Phaser client is read-only in the repository. At build time, scan native JS consumers, then remove only the recognized unavailable preload. Preserve every other byte of the source module. Keep the old exact patch as a compatibility marker. Rollback: revert this branch. A passing unit test does **not** certify a Phaser/WebGL build or visual approval; existing external-source failures remain separate.
