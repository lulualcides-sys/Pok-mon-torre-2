# Plano

Escopo mínimo: `tools/pokearena/torre2-campaign-scene.js`, testes do Centro e gates de validação.

1. Importar a função `originalBallSprite` existente, sem refazer a biblioteca de sprites.
2. Substituir somente o objeto Graphics por Image na repetição da tela Centro; preservar tween, labels e save.
3. Validar presença de texturas, alpha e tween na cena Phaser real; executar testes unitários, build e browser.
4. PR em branch isolada, CI, merge e validação do GitHub Pages.
5. Reverter este único patch se os checks indicarem regressão.

Não tocar em outros efeitos VFX, arte já aprovada ou árvore de saves.
