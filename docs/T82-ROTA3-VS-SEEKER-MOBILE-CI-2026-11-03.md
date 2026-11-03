# T82 — VS Seeker mobile após mapas aprovados

**Somente homologação. Não mesclar em `main` nem publicar Pages.**

## Falha demonstrada

O teste de navegador T22 esperava `__torre2BattlePath.progress===3` assim que começava a campanha no estágio 1. O Phaser da homologação agora abre a imagem aprovada `route-3` por padrão; portanto, o teste expirava em 60 segundos **antes de tentar uma revanche**. Isso não prova que o VS Seeker em si esteja com defeito.

## Correção

O teste com Chromium mobile prepara o mesmo estado controlado, aguarda `route-3`, toca a saída real do mapa aprovado, abre o botão nativo `VS SEEKER` na BattlePath, seleciona um treinador concluído pela interface do atlas e inicia a revanche com o botão nativo. Após recarregar, percorre novamente as mesmas telas para confirmar que a carga e o ticket não se duplicam, que a ação repetida é recusada e que `RETOMAR REVANCHE` conserva o ticket original.

A alteração é **exclusivamente de teste**: nenhuma imagem aprovada, golpe, save, BattlePath, cenário de batalha, regra ou recompensa foi alterada.

## Aceitação

- `Master T22 — VS Seeker mobile restart and anti-duplicate` com Chromium real PASS; verificar o log e as capturas, não apenas a existência de uma PR.
- T41, Guardião Visual e homologação isolada PASS antes de integrar à branch de testes.
- Não alegar vitória natural: os checkpoints usados pelo teste são fixtures controladas.
