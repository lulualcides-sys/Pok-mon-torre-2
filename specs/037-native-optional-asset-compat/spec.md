# T05 — optional native ui-balls preload
The external Poké Arena client changed the optional `ui-balls` preload statement while its `balls20.png` asset remains unavailable. The isolated Phaser build fails before browser checks.

Acceptance: remove exactly one recognized `ui-balls` spritesheet preload in the **copied** client only when no other native JS module references its key. Accept safe numeric frame-size changes. Fail closed for changed path, multiple statements, missing frame metadata or native consumers. Do not alter VFX, combat, source capture, saves, HUD or production.
