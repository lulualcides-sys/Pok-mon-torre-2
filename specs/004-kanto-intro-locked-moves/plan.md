# Plano 004 — T07/T08 sem desbloqueio indevido

1. Verificar HEAD/PRs; isolar o patch do trabalho em andamento (#270 ULT natural e #329 Brock).
2. RED lógico: no código anterior `lowPower` validava só dano/forma e `trainingMove` removia `pendiente`; o seletor de assinatura verificava apenas forma e aprovação de novo VFX.
3. GREEN: filtrar os quatro estados de bloqueio em `torre2-kanto-intro-moves.js` e `kanto-ultimate-policy.js`; regressão em `kanto-intro-moves.test.js` com entradas bloqueadas, sem mutar biblioteca.
4. CI isolada: npm test, check, check:reuse, build Phaser/WebGL, cobertura Kanto e navegador Chromium real. Sem inventar partidas naturais.
5. Revisar diff, só integrar com gates verdes, comprovar versão pública por HTTP; atualizar fila e controle.

**Rollback:** reverter apenas o filtro e teste deste PR; nenhum save ou asset é migrado.

## Correção guiada por RED (30/10)
- RED: CI #41066647123, `tests/t08-151-signature-ult-built.test.mjs`, `144 !== 149`; diagnóstico identificou os cinco Pokémon e três VFX aprovados com `pendiente:true` herdado.
- GREEN proposto: no agregador `torre2-move-pool.js`, zerar apenas a flag herdada quando o renderer substituto é **explicitamente aprovado** (`signature.approved===true`), não está pendente e foi herdado para o catálogo T2. Não modificar `ROSTER` nativo nem aceitar flags TM/HM.
- Adicionar regressão compilada de Bug Bite, Bite e Swift, manter gate 149, rodar Node, check, check:reuse, build e Chromium. Só mesclar se todas as CIs do SHA final passarem; verificar Pages SHA/HTTP.
