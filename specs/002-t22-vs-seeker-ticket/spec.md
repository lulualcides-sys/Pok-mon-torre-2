# T22 — Integridade e retomada de revanche interrompida

**Defeito original:** `reserveRematch` substituía `rematches.pending` ao completar 3 novas atividades mesmo enquanto o progresso da jornada permanecia igual. O token anterior deixava de ser válido, descartando indevidamente seu resultado.

**Critérios de aceite:**
- Uma revanche pendente no mesmo checkpoint da campanha não pode ser sobrescrita, mesmo que o VS Seeker recarregue para 3/3.
- Após recarregar durante a batalha, o treinador pode escolher **RETOMAR REVANCHE**, reutilizando exatamente o token original. O botão normal **REVANCHE** continua exigindo carga para nova reserva, preservando o fluxo anterior.
- Uma reserva anterior ligada a checkpoint de história ultrapassado não pode invalidar resultados nem bloquear novas revanches para sempre: após recarregar três vezes, nova reserva substitui o bilhete já inválido.
- Nenhum XP, dinheiro, vitória, derrota, insígnia, TM ou evolução é concedido pelo ato de retomar. O consumo de resultado continua exatamente uma vez.

**Não objetivo:** mudar a recarga, balanceamento, golpes, sprites, combate Phaser, formato do save, testes naturais Pallet→Campeão, Scratch/Transform ou Surf.

**Provas esperadas:** testes de política de reserva/consumo/stale, navegador móvel real com interromper/recarregar/negar botão normal/retomar original, regressão completa, guardião visual, merge e Pages/HTTP.
