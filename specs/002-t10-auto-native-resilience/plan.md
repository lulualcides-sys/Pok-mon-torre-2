# Plano — T10 AUTO contra travamentos e trocas

1. Basear na main verificada e não sobrescrever a PR #369 de T20 nem #372 de T03.
2. Extrair escolha do oponente vivo na cena real, recarregar a IA nativa quando qualquer lado troca e impedir fallback manual com AUTO ativo.
3. Direcionar apenas LMB pressionado por assistência à posição real do adversário; não mexer nos controles manuais nem mudar a decisão dos outros slots.
4. Acrescentar regressões Node para inimigo nocauteado, Onix substituto, troca de espécie/estágio, cooldown e energia, e falta de saída da IA.
5. Executar CI e Chromium sobre o cliente Phaser de verdade com preservação dos VFX aprovados.
6. Só homologar e publicar após checks, revisão e auditoria HTTP; aceitar derrota real como dado, não simular sucesso.
