# Plano de execução T22

**Base:** main `be1d230c695b97500eb9e6f0c7dd6746fa7dfb75`, sem alterar PR #386 T03, PR #369 T20, PR #381 T10.

1. Adicionar testes de reserva única após três novas recargas e recuperação segura quando ticket é inválido por avanço da história.
2. Aplicar guarda apenas ao código de reserva de ticket (`torre2-rematch-policy.js`), sem tocar no resultado, pagamentos ou código de combate.
3. No menu de `torre2-campaign-scene.js`, refatorar a inicialização existente de revanche numa função local para reuso. Exibir `RETOMAR REVANCHE` só quando o ticket de mesmo mapa/treinador e checkpoint foi autenticado por `validRematchResult`.
4. Expandir teste Chromium móvel existente para iniciar uma revanche nativa, interromper, reler save, provar a recusa normal, retomar a mesma luta e comparar ticket/economia; sem fabricar vitória.
5. Executar workflow T22 existente (npm test/check/check:reuse, build Phaser, Chromium mobile e browser completo), guardião visual e revisão de diff. Não mesclar até verde.
6. Após merge, confirmar main CI e Pages/HTTP do SHA exato.

**Rollback:** reverter esta PR. **Riscos:** o controle adicional precisa caber no painel móvel sem ocultar o botão de retorno; o teste do toque real é o gate mínimo.
