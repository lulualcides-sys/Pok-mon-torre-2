# Checkpoint verificável — 31/10/2026 — Pokémon Torre 2

## Já integrado e PUBLICADO
- **Main SHA** `994e22861fc7693631dde07c8395936f88eaa4c3` após PR [#387](https://github.com/lulualcides-sys/Pok-mon-torre-2/pull/387) T22 VS Seeker (merge `21822f6b`) e [#386](https://github.com/lulualcides-sys/Pok-mon-torre-2/pull/386) T03 Eevee legado sem UID (merge `994e2286`). T22 teve 7 workflows de PR **success**; T03 teve 3 workflows da PR **success**. Não repetir nenhuma das duas correções sem regressão nova.
- Após o merge da main `994e2286`, REA/compilação #41153225432 e combate/WebGL #41153225403 **success**; Pages [#41153252202](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/41153252202) **success**, validação HTTP do cliente público `src-0dcbef4bd8`, Chromium `PASS_PUBLIC_POKEDEX_RELEASE src-0dcbef4bd8`. Esta é a versão publicada, não a branch T20.
- Integrações anteriores #382 T05 Bolsa atômica, #384 T08 filtro de TMs sem renderer e #385 T06 status persistido na captura também pertencem à main publicada. Testes de fixture/Chromium não comprovam jornada Pallet→Campeão.

## Primeiro bloqueio real — T20 jornada Pallet→Brock
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
