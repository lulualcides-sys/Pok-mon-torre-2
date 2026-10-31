# Plano T22

1. Partir de `main` SHA `be1d230c695b97500eb9e6f0c7dd6746fa7dfb75`, sem tocar nas PRs concorrentes #386 T03, #369 T20 e #381 T10.
2. Adicionar primeiro teste em `tests/rematch-policy.test.js` cobrindo bilhete persistente, três recargas, segunda tentativa, consumo único e reserva posterior.
3. Em `tools/pokearena/torre2-rematch-policy.js`, retornar `null` se `pending` existir, preservando valores e sem criar estado adicional.
4. Reusar `.github/workflows/master-t22-mobile-rematch.yml`, com gatilho de PR nos arquivos afetados; contém cliente Phaser original, teste VS Seeker móvel e suíte de navegador.
5. Conferir PR e `main`, executar gates remotos antes do merge e confirmar Pages/HTTP SHA exato após integração. Sem alegar campanha completa nem Android físico.

**Rollback:** reverter unicamente a PR T22. **Risco conhecido:** o menu existente informa a carga disponível quando uma reserva for recusada; nenhuma cópia de UI é modificada para evitar conflito com T03/T20.
