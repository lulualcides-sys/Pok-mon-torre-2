# T22 — VS Seeker não sobrescreve um bilhete de revanche pendente

**Situação:** A função `reserveRematch` permite uma segunda reserva quando `charge === 3`, mesmo com `rematches.pending` ainda válido. Se o usuário interromper a batalha, voltar ao mapa e completar três atividades, uma nova reserva destrói o token anterior e o resultado da luta original é ignorado.

**Comportamento solicitado:** Apenas um bilhete de revanche pendente por jornada. Enquanto existir, novos pedidos devem ser recusados sem consumir cargas nem incrementar `sequence`. O resultado original deve continuar válido para conclusão única, após a qual novas reservas são permitidas.

**Restrições:** Não conceder XP, dinheiro, vitórias ou insígnias; não mudar a regra de recarga 3 atividades, reinício de batalha e menu móvel já homologados, nem alterar saves, sprites, golpes, VFX, IA ou mecânica de Kanto. O teste de navegador original exige que, após reload e carga zero, a tentativa duplicada seja negada; deve continuar passando.

**Aceite:** Teste Node do cenário interrompido+recarregado, CI `npm test` / `check` / `check:reuse`, cliente real e VS Seeker em Chromium mobile, regressão do navegador original e guardião visual; merge somente após gates verdes e publicação verificada separadamente.
