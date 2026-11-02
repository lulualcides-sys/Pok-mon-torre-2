# T24 — grande lote de campanha, mapa e relatório
## Falhas reproduzidas no código original
1. Em todo 3º e 9º checkpoint de cada página, a ação `capture` tinha prioridade sobre `battle`, impedindo tocar diretamente no treinador obrigatório. CTA inferior funcionava mas o nó do mapa não.
2. Nós de capture já derrotados não abriam revanches pelo VS Seeker — contrariando os outros treinadores e o pedido de revanche em todos os mapas.
3. A mesma zona de 60×63 px era classificada como `capture` em vez do tipo de treinador, confundindo automações e UX.
4. Relatório de batalha preservava os eventos, mas só avançava para frente sem indicador de página ou retorno, especialmente ruim com vários golpes, evoluções e TMs.

## Solução implementada
- Arquivo de política pura, sem dependências: batalha, ginásio, revanche ou bloqueado calculados por checkpoint/progresso; captura vira badge opcional com touch-zone específica acima do nó.
- Treinadores de todas as rotas continuam treinadores; chaves de salvamento, prêmio, VS Seeker, custos, nível, golpes, IA e sprites não mudam.
- Relatório mostra indicador n/N e navegação anterior/próximo; mantém todos os eventos e o CTA de continuar.
- Testes puros, contrato compilado, mobile real Phaser com toque, regressões existentes de rematches e de relatórios.
## Restrições
Não afirmar vitória natural sobre Misty; navegador usa fixture de estágio 0 para validar UI. Não tocar PRs concorrentes #403, #408, #409; merge somente após gates verdes e Pages HTTP.
