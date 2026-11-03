# T83 — Mapa aprovado do estágio 3 (Vermilion) → VS Seeker → Poké Mart

## Causa verificada em Chromium

O teste `tests/surge-shop-rematch-browser.cjs` aguardava `__torre2BattlePath.stage===3` diretamente e expirava em 60 segundos. A instrumentação do Phaser no mesmo estágio revelou: `approvedMap: "vermilion-city"`, `savedStage: 3`, `celadonTextureLoaded: false`, cena ativa `campanha`. O primeiro reparo errou ao pressupor Celadon; **Vermilion é o mapa de entrada efetivo** listado em `APPROVED_STAGE_MAPS[3]`. A progressão normal não foi modificada.

## Correção de teste

1. Preparar uma fixture válida de estágio 3, 3 insígnias, trainer 5 e 3 cargas VS Seeker.
2. Esperar a cena Phaser ativa e loader encerrado, registrar `approvedMap`, `pathStage`, textura de Vermilion e `savedStage`; falhar com diagnóstico explícito se não chegar a uma das duas telas válidas.
3. Se a imagem `vermilion-city` estiver aberta, clicar a **saída real ROTAS** respeitando a área útil 16:9 do canvas.
4. Se a BattlePath nativa já estiver ativa, não criar um mapa artificial nem simular eventos internos.
5. Verificar que o save não mudou; usar os botões reais de VS Seeker, confirmar mapas anteriores, clicar o mapa Brock, auditar os sprites FireRed do Poké Mart e a ausência das TMs de líderes ainda não adquiridas.

Modificação exclusiva em teste/documentação, sem alterações em gameplay, artes aprovadas, sprites, compra, captura, save, regras de roteiro ou publicação. Fixture controlada não constitui campanha naturalmente concluída.

## Gate

Só promover após os workflows de Mart, rival/cooldowns e Guardião Visual PASS no mesmo SHA final. Integrar somente a `test/homologacao-kanto-20261103`, nunca `main`/Pages sem aprovação final expressa.