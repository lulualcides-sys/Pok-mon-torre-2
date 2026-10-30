# Plano 004 — T07/T08 sem desbloqueio indevido

1. Verificar HEAD/PRs; isolar o patch do trabalho em andamento (#270 ULT natural e #329 Brock).
2. RED lógico: no código anterior `lowPower` validava só dano/forma e `trainingMove` removia `pendiente`; o seletor de assinatura verificava apenas forma e aprovação de novo VFX.
3. GREEN: filtrar os quatro estados de bloqueio em `torre2-kanto-intro-moves.js` e `kanto-ultimate-policy.js`; regressão em `kanto-intro-moves.test.js` com entradas bloqueadas, sem mutar biblioteca.
4. CI isolada: npm test, check, check:reuse, build Phaser/WebGL, cobertura Kanto e navegador Chromium real. Sem inventar partidas naturais.
5. Revisar diff, só integrar com gates verdes, comprovar versão pública por HTTP; atualizar fila e controle.

**Rollback:** reverter apenas o filtro e teste deste PR; nenhum save ou asset é migrado.
