# T83 — Entrada real do estágio 3 → VS Seeker → Poké Mart

## Causa verificada

O teste `tests/surge-shop-rematch-browser.cjs` aguardava diretamente `__torre2BattlePath.stage===3` e expirava em 60 segundos, antes de alcançar o VS Seeker ou a loja. A homologação suporta duas entradas legítimas ao cenário no estágio 3: mapa aprovado `celadon-city` quando a textura está carregada, ou a tela nativa BattlePath como fallback seguro. O primeiro ajuste de T83 presumiu exclusivamente Celadon e também expirou; isso foi corrigido no segundo commit.

## Abordagem

1. Esperar **um de dois estados reais** no Phaser ativo: `__torre2ApprovedMapView.id==='celadon-city'` ou `__torre2BattlePath.stage===3`.
2. Registrar no log qual tela foi exibida e se a textura aprovada estava carregada.
3. **Se** o mapa aprovado estiver na tela, clicar sua saída por coordenadas reais com contenção 16:9; se o jogo já estiver na BattlePath, não criar navegação artificial.
4. Exigir o botão nativo VS Seeker e integridade byte-a-byte do checkpoint antes/depois da navegação.
5. Preservar todos os demais passos do teste: mapa Brock, cliques nativos do atlas, sprites FireRed na loja e bloqueio das TMs não adquiridas.

Somente teste e documentação: nenhum código do jogo, assets aprovados, save, batalha, economia ou lógica de rematch foi alterado. Fixture controlada não prova vitória de campanha real.

## Gate

Promover somente após sucesso dos workflows Mart, rival/cooldowns e Guardião Visual no SHA final, e merge apenas na branch `test/homologacao-kanto-20261103`. O jogo oficial em `main`/Pages não deve ser publicado sem aprovação expressa.