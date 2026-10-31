# Plano
- Mudar apenas `tools/pokearena/torre2-campaign-scene.js` na renderização de resumo/Dex. Não ler, alterar ou copiar texturas.
- Teste mobile `tests/t17-shiny-ui-mobile-browser.cjs` inspeciona objetos Phaser reais e salva PNGs, incluindo avistado vs capturado.
- Gates: Node, check/reuse, build WebGL, Chromium mobile + regressão original e guardião visual acionado pela cena.
- Se PR #389 integrar antes, revisar compatibilidade no merge: o código usa campos opcionais e não precisa de sua presença no boot.
- Rollback isolado, sem migração de saves, VFX ou API.
