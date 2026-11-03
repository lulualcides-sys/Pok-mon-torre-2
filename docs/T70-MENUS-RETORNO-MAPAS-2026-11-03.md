# T70 — Retornos dos menus para as 60 artes aprovadas

**Somente versão de homologação.** Patch baseado em `test/homologacao-kanto-20261103`; não atualiza `main` ou o GitHub Pages.

## Defeito concreto
Os botões **Voltar** dos menus Centro Pokémon, Mart, Bolsa, PC e Pokédex reiniciavam integralmente o Phaser com `scene.restart()`. O Estojo de Insígnias enviava o usuário à HUD antiga com `renderCampaign(state)`. Isso era desnecessário após a T69, que permite retornar ao mapa aprovado sem perder contexto.

## Mudança
Os seis controles agora chamam `returnFromPartyToMap(state)`, que lê novamente o checkpoint e revalida etapa, insígnias e estado de Campeão. Mantêm-se:
- As 60 imagens aprovadas, sem alterar seus bytes, posições ou sprites;
- As operações existentes e atômicas do save: cura, compra, PC e itens;
- A possibilidade de voltar à interface nativa quando o mapa não estiver mais disponível;
- O fluxo de salvamento após concluir a animação da cura — continua sendo uma ação separada e confirmada.

## Validação
`tests/t70-approved-menu-return.test.mjs` verifica os seis botões, filtros de progresso e que não existem recompensas artificiais. `tests/approved-map-real-browser.cjs` abre cada um dos seis menus na fixture **etapa 2 de Vermilion**, clica realmente em Voltar com mouse ou toque, e comprova o retorno a `vermilion-city` com a área interativa ativa e o save **byte a byte inalterado**.

Fixture de etapa e imagens de Chromium **não são** provas de que o jogador venceu naturalmente os ginásios. Conexões ainda não aprovadas, chaves Rocket/Tanoby e início Pallet continuam fora do escopo. A validação de performance em aparelhos Android reais permanece pendente.

### Critério
T41, Guardião Visual e homologação completos precisam passar no SHA final antes da integração. Publicação na main/Pages somente após aprovação final explícita do usuário.
