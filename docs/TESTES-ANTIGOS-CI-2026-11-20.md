# Testes antigos do CI — triagem de 20/11/2026 (item 30 da lista do dono)

## O que estava quebrado

Cerca de **210 workflows antigos** começam baixando o jogo do site do Poké Arena 2D (`capture-client.mjs`). Desde a captura da 0.77.3, o site responde **HTTP 403** ao CI. Por isso todos falhavam **antes de testar qualquer coisa**.

## O que foi feito

- Quando o site responde 403, `capture-client.mjs` não tenta de novo nem contorna o bloqueio. Ele chama `published-build-fallback.mjs`, que monta **o jogo publicado exato** a partir da nossa cópia autorizada:
  - o release público `torre2-audited-site-alpha0773`, com SHA-256 e MANIFEST fixados, que falha fechado se algo não bater;
  - o mesmo overlay do Pages (`publish-alpha0762.mjs`).
- `build-preview.mjs` reconhece esse build (`site-capture/TORRE2-PUBLISHED-BUILD.json`) e o mantém.
- Resultado: os testes antigos voltam a rodar e testam **o jogo que está no ar** (base 0.77.3).

## Resultado no build publicado (local, Chromium 1243 headless)

- **Testes sem navegador:** 45 de 67 passam.
- **Amostra de 14 testes de navegador** (de 149): 5 passam.

As falhas restantes **não são o 403**: são diferenças reais entre o que cada teste antigo esperava (base 0.71.3, telas antigas da campanha) e o jogo de agora. Há três tipos:

1. **Base 0.77.3:** espécies que viraram nativas (Grimer, Muk, Staryu, Starmie e outras) e kits nativos alterados pelos donos do jogo base (Dugtrio, Mew, Hoopa). O Torre 2 não altera kits nativos, então esses testes precisam ser revistos um a um. Pela regra da fonte nativa, nunca se "corrige" um kit nativo para fazer teste passar.
2. **Telas refeitas com aprovação do dono:**
   - menu com MULTIPLAYER e sem NEWS;
   - campanha em cards, sem mapas pintados;
   - Pokédex e Sumário novos.
   O teste guarda a tela antiga.
3. **Para investigar:** casos que podem ser defeito de verdade, por exemplo "Oddish abilities must render", "honedge uses the exact tempo helper" e os timeouts de campanha natural.

**Próximo passo sugerido:** revisar por grupos. Atualizar só os testes do tipo 2, com a referência da aprovação; investigar os do tipo 3; e registrar os do tipo 1 como lacunas da base. Nenhum teste foi enfraquecido ou apagado neste PR.

## Testes sem navegador (67)

| Resultado | Teste | Primeira falha |
| --- | --- | --- |
| ❌ FAIL | `tests/arena-121-native-dodge-built.test.mjs` | ARENA_121_NATIVE_DODGE_AUDIT {"expected":121,"actualAdded":110,"nativeCount":61,"installedMoves":297,"nativeDodgeMoves":32,"exactSpecies":10 |
| ❌ FAIL | `tests/arena-family-selector-built.test.mjs` | AssertionError [ERR_ASSERTION]: The input did not match the regular expression /const POR_FILA=4,FILAS=2,PAGE_SIZE=8/. Input: |
| ✅ PASS | `tests/arena-johto-evolution-built.test.mjs` |  |
| ✅ PASS | `tests/batch24-built.test.mjs` |  |
| ✅ PASS | `tests/campaign-awards-built.test.mjs` |  |
| ✅ PASS | `tests/center-revive-built.test.mjs` |  |
| ❌ FAIL | `tests/evolution-modes-built.test.mjs` | AssertionError [ERR_ASSERTION]: touch EVO must appear in Training/Arena and be absent in Kanto |
| ✅ PASS | `tests/finale13-built.test.mjs` |  |
| ❌ FAIL | `tests/frlg-learnsets-built.test.mjs` | AssertionError [ERR_ASSERTION]: Separate campaign learnset must display level and TM requirements |
| ❌ FAIL | `tests/gen7-installed-built.test.mjs` | AssertionError [ERR_ASSERTION]: Ponyta may use Gen7 Double Kick ONLY because existing approved renderer exists |
| ❌ FAIL | `tests/greninja-native-skins-built.test.mjs` | AssertionError [ERR_ASSERTION]: The input did not match the regular expression /for\(const dex of \["0656","0657","0658"\]\)/. Input: |
| ✅ PASS | `tests/kanto-151-built.test.mjs` |  |
| ❌ FAIL | `tests/kanto-intro-loadout-built.test.mjs` | AssertionError [ERR_ASSERTION]: Charmander must use weak FireRed Scratch at Lv5, not a premature powerful move |
| ✅ PASS | `tests/master-patch-built.test.mjs` |  |
| ❌ FAIL | `tests/mew-lv50-natural-pokedex-built.test.mjs` | AssertionError [ERR_ASSERTION]: Real battle Mew Lv50 internal kit should use the exact native move names |
| ❌ FAIL | `tests/misty-surge-built.test.mjs` | AssertionError [ERR_ASSERTION]: staryu should dodge without damage |
| ✅ PASS | `tests/misty-wild-capture-ui-built.test.mjs` |  |
| ❌ FAIL | `tests/noncombat-pixel-buttons-built.test.mjs` | AssertionError [ERR_ASSERTION]: Pokédex tabs not skinned |
| ✅ PASS | `tests/pokedex-crossgen-families-built.test.mjs` |  |
| ❌ FAIL | `tests/public-phaser-preview.cjs` | name: 'Error' |
| ✅ PASS | `tests/rayquaza-mega-built.test.mjs` |  |
| ✅ PASS | `tests/rematches-built.test.mjs` |  |
| ✅ PASS | `tests/rival-payday-cooldowns-built.test.mjs` |  |
| ✅ PASS | `tests/section20-all-trainers-built.test.mjs` |  |
| ✅ PASS | `tests/section20-campaign-integrity-built.test.mjs` |  |
| ❌ FAIL | `tests/solo-kanto-built.test.mjs` | AssertionError [ERR_ASSERTION]: Core FireRed map missing: route1 |
| ❌ FAIL | `tests/source-client-smoke.cjs` | AssertionError [ERR_ASSERTION]: Keep every approved main-menu action in its original navigation order |
| ✅ PASS | `tests/status-items-built.test.mjs` |  |
| ✅ PASS | `tests/surge-shop-rematch-allmaps-built.test.mjs` |  |
| ✅ PASS | `tests/surge3-built.test.mjs` |  |
| ✅ PASS | `tests/t01-starter-no-lab-mewtwo-built.test.mjs` |  |
| ✅ PASS | `tests/t03-evolved-pokedex-built.test.mjs` |  |
| ✅ PASS | `tests/t03-kanto-evolution-boundaries-built.test.mjs` |  |
| ✅ PASS | `tests/t05-event-checkpoints-built.test.mjs` |  |
| ✅ PASS | `tests/t05-pc-transfer-atomic-built.test.mjs` |  |
| ✅ PASS | `tests/t05-summary-equip-atomic-built.test.mjs` |  |
| ✅ PASS | `tests/t07-151-movesets-built.test.mjs` |  |
| ✅ PASS | `tests/t07-approved-native-fallbacks-built.test.mjs` |  |
| ✅ PASS | `tests/t07-approved-native-overlap-built.test.mjs` |  |
| ❌ FAIL | `tests/t07-earliest-generations-built.test.mjs` | AssertionError [ERR_ASSERTION]: Expected values to be strictly equal: |
| ✅ PASS | `tests/t07-fire-blast-kanto-built.test.mjs` |  |
| ✅ PASS | `tests/t07-frlg-natural-catalog-built.test.mjs` |  |
| ❌ FAIL | `tests/t07-frlg-unrendered-136x639-built.test.mjs` | AssertionError [ERR_ASSERTION]: Known gap unexpectedly absent: transform |
| ❌ FAIL | `tests/t07-gen45-kanto-built.test.mjs` | AssertionError [ERR_ASSERTION]: Do not create/duplicate any VFX |
| ❌ FAIL | `tests/t07-ghost-characteristic-slots-built.test.mjs` | AssertionError [ERR_ASSERTION]: gastly lost Confuse Ray to HAB slot collision |
| ✅ PASS | `tests/t07-invalid-tm-save-151x227-built.test.mjs` |  |
| ❌ FAIL | `tests/t07-native-league-portrait-built.test.mjs` | AssertionError [ERR_ASSERTION]: Expected exactly one built native Phaser source version |
| ❌ FAIL | `tests/t07-stab-tm-mastery-built.test.mjs` | AssertionError [ERR_ASSERTION]: Do not invent/duplicate approved moves |
| ❌ FAIL | `tests/t08-151-signature-ult-built.test.mjs` | AssertionError [ERR_ASSERTION]: bite inherited a stale native pending flag despite its approved VFX |
| ✅ PASS | `tests/t08-arena-role-slots-built.test.mjs` |  |
| ✅ PASS | `tests/t08-editor-slot-suggestion-built.test.mjs` |  |
| ❌ FAIL | `tests/t08-equivalent-practice-equip-built.test.mjs` | AssertionError [ERR_ASSERTION]: arbok must be able to upgrade its own preview slot |
| ✅ PASS | `tests/t08-kanto-151-moves-level5-to-50-built.test.mjs` |  |
| ✅ PASS | `tests/t08-kanto-dex-live-levels-built.test.mjs` |  |
| ✅ PASS | `tests/t08-kanto-no-duplicate-native-built.test.mjs` |  |
| ✅ PASS | `tests/t08-kanto-onboarding-151-built.test.mjs` |  |
| ✅ PASS | `tests/t08-kanto-ult-level-transition-built.test.mjs` |  |
| ✅ PASS | `tests/t08-leech-seed-campaign-balance-built.test.mjs` |  |
| ❌ FAIL | `tests/t08-summary-real-moves-built.test.mjs` | AssertionError [ERR_ASSERTION]: Expected values to be strictly equal: |
| ✅ PASS | `tests/t08-summary-upcoming-151-built.test.mjs` |  |
| ✅ PASS | `tests/t08-ult-distinct-names-built.test.mjs` |  |
| ✅ PASS | `tests/t08-ult-saved-versus-battle-built.test.mjs` |  |
| ✅ PASS | `tests/t16-rain-40-equipment-built.test.mjs` |  |
| ✅ PASS | `tests/t16-weather-equipment-built.test.mjs` |  |
| ✅ PASS | `tests/t23-kanto-mart-tm-integrity-built.test.mjs` |  |
| ✅ PASS | `tests/t26-native-league-icons-built.test.mjs` |  |
| ✅ PASS | `tests/versus-intro-built.test.mjs` |  |

## Amostra de testes de navegador (14 de 149)

| Resultado | Teste | Primeira falha |
| --- | --- | --- |
| ✅ PASS | `tests/battle-bag-browser.cjs` |  |
| ❌ FAIL | `tests/t03-six-signature-evolutions-browser.cjs` | AssertionError [ERR_ASSERTION]: dugtrio must preserve the already-integrated Tri Attack native signature move |
| ✅ PASS | `tests/batch24-browser.cjs` |  |
| ❌ FAIL | `tests/pokedex-public-live-browser.cjs` | AssertionError [ERR_ASSERTION]: Public Doduo Pokédex differs from its current Lv50 battle moves |
| ✅ PASS | `tests/rayquaza-mega-browser.cjs` |  |
| ❌ FAIL | `tests/visual-guard-browser.cjs` | VISUAL GUARD CHROMIUM FAIL desktop-title Existing approved title actions must remain visible and ordered |
| ❌ FAIL | `tests/t03-evolution-visual-browser.cjs` | AssertionError [ERR_ASSERTION]: Oddish abilities must render |
| ❌ FAIL | `tests/t03-caterpie-butterfree-full-chain-browser.cjs` | name: 'TimeoutError' |
| ❌ FAIL | `tests/arena-native-speed-browser.cjs` | AssertionError [ERR_ASSERTION]: honedge uses the exact tempo helper |
| ❌ FAIL | `tests/t02-bag-camera-browser.cjs` | name: 'TimeoutError' |
| ❌ FAIL | `tests/t20-natural-champion-league-browser.cjs` | name: 'TimeoutError' |
| ✅ PASS | `tests/t03-final-starter-evolutions-browser.cjs` |  |
| ✅ PASS | `tests/league-auto-battle-browser.cjs` |  |
| ❌ FAIL | `tests/t03-focused-natural-ivysaur-browser.cjs` | page.evaluate: Error: Stage 1 chosen route enemy changed: {"id":"nidoran-f","leader":false,"kind":"trainer","spriteKind":"lass","name":"Garo |
