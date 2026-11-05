# Plano técnico — UI não combatente

1. **Delimitar:** branch sobre `main`, verificar PRs concorrentes. Usar `torre2-selection-pages.mjs` para alterar apenas grade nativa e paginação; manter o construtor de `casilla` e o roteamento de clique.
2. **Arena:** substituir 8×2 por 4×2, preservando setas e `card.objects`; revisar asserts e teste Chromium.
3. **Campanha:** criar moldura pixel em `torre2-campaign-art.js` e método `uiSection` isolado em `torre2-campaign-scene.js`. Reutilizar sem reescrever HTML, salvar dados ou alterar `trainer-cards.js` e cenas nativas de combate.
4. **Verificações:** testes estáticos e unitários de limites/interações; CI `Guardião visual`, build/Chromium nativo, teste de seleção e inspeção de screenshots.
5. **Entrega:** PR auditável, sem sobreposição com PR #576 da Pokédex. Integrar apenas após gate verde; GitHub Pages é destino único do jogo.
 
**Riscos conhecidos:** mudanças futuras no cliente-base podem exigir atualizar as âncoras da paginação. Tela de seleção usa geometria nativa (por opção expressa do usuário); nenhum novo sprite de Pokémon é desenhado. O refino de campanha é visual, não comprova um redesign completo de cada microcomponente.
