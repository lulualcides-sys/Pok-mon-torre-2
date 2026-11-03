# T72 — Carregamento do mapa após a vitória em ginásio/Liga

**Escopo exclusivo:** homologação em `test/homologacao-kanto-20261103`, sem merge em `main`, sem atualização do GitHub Pages. Preservar os 60 WebPs aprovados.

## Diagnóstico
O Phaser executa `Campanha.preload()` com o save **antes** de `Campanha.create()` processar o resultado recém-finalizado. A vitória do líder então grava `next.stage++`, mas a textura preparada ainda é a da etapa antiga. Por isso a nova cena aprovada não é garantida após confirmar o relatório; o jogador pode permanecer na HUD legada até reiniciar manualmente.

## Correção focada
- O resultado segue o único resolvedor `resolveBattle`, que grava checkpoint, EXP, dinheiro, insígnias e TMs. A UI não concede nada.
- O relatório continua obrigatório e é exibido **antes** de qualquer transição; a escolha de Eevee tem prioridade, como aprovado na T71.
- Somente quando `battleOutcomeCommitted` é verdadeiro e a etapa **realmente mudou**, o clique em **Continuar** descarta `__torre2ApprovedReturn` e invoca `scene.restart({})` com payload vazio.
- Esse reinício excepcional permite a `preload()` ler o novo save e trazer a imagem correta da nova etapa. O objeto de resultado consumido não é reaplicado, evitando insígnias, TM e XP duplicados.
- Vitórias comuns e derrotas que **não mudam a etapa** continuam com o retorno T71 sem restart e sem mudança nas 60 artes.

## Provas
- `tests/t72-approved-leader-transition.test.mjs`: ordenação commit → relatório → reinício, proteção dos gates Liga/Campeão, nenhuma recompensa no renderer.
- `tests/approved-map-real-browser.cjs`: fixture controlada com a **vitória sinalizada contra Misty**, processada pelo resolvedor nativo, exigindo `stage=2`, insígnias Rocha/Cascata e TM, e verificando o carregamento real de `cerulean-city` ao clicar no relatório em desktop e mobile. Reiniciar uma segunda vez não pode duplicar qualquer recompensa.
- Outro cenário controlado envia uma vitória de treinador normal já na etapa 2, exigindo apenas +1 treinador e +1 vitória, nenhuma nova insígnia e permanência em Cerulean após **Continuar**.

Esses cenários são **testes do resolvedor com resultados controlados**, não comprovação de um jogador ter vencido naturalmente. O percurso real Pallet → Liga e as quests ainda pendentes não são declarados concluídos.

**Gate para integrar:** T41 + Guardião Visual + homologação nativa desktop/mobile PASS na SHA final. Sem produção até aprovação final expressa.
