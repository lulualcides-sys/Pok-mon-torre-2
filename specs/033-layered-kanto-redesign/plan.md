# Layered Kanto Implementation Plan
> Execute inline using superpowers:executing-plans.
Goal: replace campaign presentation with layered interactive towns without changing combat.
Architecture: isolated renderer + pure layout model, native campaign handlers, no new save format. Build copies modules through existing mapping.
Spec: specs/033-layered-kanto-redesign/spec.md
Global constraints: no arena HUD edits; no new unverified third-party art; no walking; no invented progress; no release before browser and visual verification.
Review focus: returning from menus must preserve city; repeated entry must clean animations; six-member team must remain accessible; locked gym must preserve progression; mobile hotspots must align with art.

1. Pure city model and interaction tests: tools/pokearena/torre2-city-layout.js; tests/city-layout.test.js. Three landmark IDs, validated route counts, independent positions, immutable input. Run node --test tests/city-layout.test.js (RED then GREEN).
2. Original layered architecture/environment in torre2-city-scenery.js and UI in torre2-city-hub.js. Render via Phaser Graphics, shared sprites and bounded animated water layer. Test actual WebGL browser output, object cleanup and hotspot coordinates.
3. Wire campaign-scene.js and build-preview.mjs. Reuse centerScreen, martScreen, gymScreen, bagScreen, dexScreen, badgeCaseScreen, showSummary and rematch handlers. Preserve native battle path as route selector. Cerulean city is an optional view; native trainer route stays the default for compatibility; no save migration.
4. Validate Cerulean screenshots and functional buttons in Chromium desktop + touch. Only after this gate expand layouts and secondary-menu visual treatment. Don't substitute automatic assertions for visual quality assessment.
5. Run npm test/check/check:reuse + applicable built/browser regressions, review diff and concurrent main before PR. Integrate only verified approved result; otherwise retain draft with exact blockers.
Rollback: revert scoped new imports/renderer/mapping; original path and all battle logic remain available.

## Continuação de 31/10 — atlas original
A PR #419 foi integrada externamente em 827e3f3, incluindo as correções de botão/Clock. Preservar essas correções, rota padrão e navegação opcional. Substituir somente geometria visual básica por seis frames do atlas original gerado (552 KiB WebP), mantendo terreno/água/ponte em camadas. Nova branch `feat/cerulean-art-atlas-20261031`. Testar limites dos recortes, proporção, cache por estágio e presença real das seis peças no navegador; ampliar cobertura para seis membros. Não marcar acabamento artístico como concluído sem capturas verificadas.
