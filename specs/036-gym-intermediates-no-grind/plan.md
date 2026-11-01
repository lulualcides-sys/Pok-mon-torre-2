# Plano T19

1. Isolar um modelo puro `gymIntermediateModel` que lê apenas estado, GYMS, TRAINERS_PER_GYM e routeNode, sem mutações.
2. Desenhar até quatro NPCs laterais usando `addFireRedNPC` já existente; somente índice atual clicável.
3. Integrar à tela de ginásio da PR #440, preservando ace e botão do líder; alternar CTA entre rota/intermediário/líder sem alterar motor.
4. Testar 8 estágios, IDs, rival/Rocket, posições, saves; gerar prova real desktop/mobile e comparar com conceito C.
5. Não mesclar enquanto PR #440/base ou gates de navegador estiverem vermelhos.

## Complemento — correção de navegação

Branch isolada baseada no HEAD da PR #441, sem tocar na main ou nas PRs de arte. Ajustar `torre2-battle-path.js` para substituir os últimos nós por uma única entrada de ginásio, e `torre2-campaign-scene.js` para abrir o interior pela cidade, portal e CTA. Testar 8 estágios em Node e a transição Brock/Misty no Chromium Phaser desktop/mobile. A PR permanece DRAFT até CI verde e revisão visual; o patch não contém sprites nem mecânicas de batalha.
