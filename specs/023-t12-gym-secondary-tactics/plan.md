# Plano de execução T12
1. Inspecionar código do leitor da CPU, dados de golpes reais, motor Gen III, script mestre, contratos e PRs concorrentes.
2. Testes RED para seleção legal de golpes Q/RMB; não criar novos VFX.
3. Alterar apenas a política auxiliar `torre2-trainer-strategy.js` e instrumento contadores no `torre2-party-battle.js` (diagnóstico de ações nativas).
4. Validar no build e via Chromium que o líder realmente possui o leitor original e nenhum HP/recompensa artificial é gerado; automatizar teste de integração com um cenário real de ginásio.
5. CI all green e revisão compatível com main; merge e Pages HTTP SHA exato após testes. Rollback por revert desse patch, sem mexer nas PRs abertas.
