# Checkpoint verificável — 31/10/2026 — Pokémon Torre 2

## CONTINUIDADE VERIFICADA 31/10/2026 — PR #369 T20 integrada; Pallet→Brock comprovado
- **Código de teste integrado:** PR [#369](https://github.com/lulualcides-sys/Pok-mon-torre-2/pull/369), squash `1fcc64eb53407b535cc8919832bacbfd492c7354`. Não duplicar #369 nem reabrir o antigo bloqueio do 13º rival.
- **CI original da branch:** [#41153415212](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/41153415212) **success**: build real Phaser, testes unitários e Chromium, 13 treinadores em save único iniciado com Bulbasaur Lv5, capturas genuínas de Spearow e Geodude, quatro derrotas normais e recuperação, Brock vencido, estágio 1, insígnia **Rocha** e TM **tm-rock-tomb**. Resultado final: 37 vitórias acumuladas (inclui treino selvagem), 4 derrotas, equipe Bulbasaur Lv14 / Spearow Lv14 / Geodude Lv12. Guardião visual da branch [#41153419869](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/41153419869) **success**.
- **Limites essenciais:** as 13 vitórias e Brock são execução real de combate automatizado com encontros/capturas sem forçar HP/vitória; não provam controle Android físico, jornada natural Brock→Campeão, nem Pages público no novo SHA. O teste original rodou sobre a branch da PR anterior ao merge; verificar CI da main e Pages HTTP para marcar publicação. A implementação de #369 altera somente teste/workflow, não balanceamento ou golpes.
- **Próxima frente independente:** T19 continuação pós-Brock → Cerulean/Misty, verificando no mesmo save XP, capturas, evolução, equipe, insígnias/TMs sem fixtures de nível/progresso, antes de afirmar campanha integral. T07/T08 permanecem parciais; T10 #381 permanece isolada por CI vermelha.
- **Golpe pedido no chat:** Egg Bomb na campanha `cd:2.3` já integrado pela PR [#394](https://github.com/lulualcides-sys/Pok-mon-torre-2/pull/394) em `5323ac25cce7cda03ed16a221c64fca7f1be6918`; Arena/VS e VFX mantidos.

## Já integrado e PUBLICADO
- **Main SHA** `994e22861fc7693631dde07c8395936f88eaa4c3` após PR [#387](https://github.com/lulualcides-sys/Pok-mon-torre-2/pull/387) T22 VS Seeker (merge `21822f6b`) e [#386](https://github.com/lulualcides-sys/Pok-mon-torre-2/pull/386) T03 Eevee legado sem UID (merge `994e2286`). T22 teve 7 workflows de PR **success**; T03 teve 3 workflows da PR **success**. Não repetir nenhuma das duas correções sem regressão nova.
- Após o merge da main `994e2286`, REA/compilação #41153225432 e combate/WebGL #41153225403 **success**; Pages [#41153252202](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/41153252202) **success**, validação HTTP do cliente público `src-0dcbef4bd8`, Chromium `PASS_PUBLIC_POKEDEX_RELEASE src-0dcbef4bd8`. Esta é a versão publicada, não a branch T20.
- Integrações anteriores #382 T05 Bolsa atômica, #384 T08 filtro de TMs sem renderer e #385 T06 status persistido na captura também pertencem à main publicada. Testes de fixture/Chromium não comprovam jornada Pallet→Campeão.

## Histórico anterior — bloqueio T20 já superado pela CI #41153415212
- PR [#369](https://github.com/lulualcides-sys/Pok-mon-torre-2/pull/369), branch `test/t20-pallet-brock-main-7f13aff-20261030`, HEAD `6259f3bebed2914b0b0ea58fc8f10f930b8ad0f0`, **DRAFT**.
- Gate anterior T20 #41146832163 **failure**: 12 vitórias reais de treinadores, equipe Bulbasaur Lv14 + dois Spearow Lv14/12, adversário 13º rival Charmander/Beedrill/Pikachu; timeout nativo de 240s contra Beedrill. **Nenhuma vitória sobre Brock, Rocha ou TM39 comprovada.**
- Patch `6259f3be` altera **somente teste de navegador** para buscar Geodude como contramedida por encontros aleatórios de grama, RUN e captura com Pokébolas nativas. Não altera RNG, vitória, HP, dano, XP, nível, espécies ou IA. Se não encontrar/capturar em até 32 encontros, gate deve permanecer vermelho.
- Novo T20 Chromium [#41153415212](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/41153415212) estava **em andamento** na consulta; guardião visual [#41153419869](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/41153419869) **success**. Verificar conclusão do mesmo HEAD antes de alterar ou homologar. É CI longa; não consultar repetidamente nem presumir sucesso.
- PR #369 usa base antiga; antes de integrar exigir revisão de compatibilidade com a `main` atual, 13 treinadores + Brock + Rocha + TM39 no mesmo save, testes/Chromium completos e nova publicação HTTP exata.

## Ordem de continuidade sem ciclos
1. Verificar CI T20 #41153415212; caso falhe, ler LOG da etapa e diagnóstico de captura/combate antes de mudar código; manter as vitórias genuínas. Enquanto estiver executando, tratar outra frente independente.
2. T07/T08 — validar golpes/ULT em campanha natural onde faltarem provas; não refazer kit de 151 já integrado nem mudar VFX aprovados.
3. T19/T21/T24/T25 — completar validação das regiões/progressão, se houver falha reproduzida, com branch isolada.
4. T31/§37 — só encerrar com Pallet→Campeão natural, Android físico quando disponível, CI verde e Pages HTTP. Nunca alegar QA Android sem dispositivo.
5. T10 principal #374 já integrada; PR complementar #381 DRAFT com CI #41147045118 **failure**. Não investir ciclos repetitivos nessa PR enquanto T20 e demais pendências tiverem prioridade.

**Preservação:** `AGENTS.md`, Script Mestre, política integral dos golpes, saves, sprites, VFX aprovados, modos Arena/treino e Phaser/WebGL intocados por este checkpoint. Este documento é apenas registro de evidências verificadas, não um patch de gameplay.
