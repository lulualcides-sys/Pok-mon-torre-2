# T35 — Pokémon ace decorativo no ginásio (01/11/2026)

## Contrato

Cada ginásio deve mostrar, na sua tela interior e na plataforma final, o líder FRLG com o **boss atual de GYMS** como sprite pixel art completo PMD, sombra e animação Idle discreta. Onix, Starmie, Raichu, Vileplume, Weezing, Alakazam, Arcanine e Rhyhorn. Giovanni não muda para Nidoking. Não desenhar o ace na cidade, na rota nem na arena.

## Restrições

Decoração somente; não tocar equipes, TRAINERS_PER_GYM, índices de checkpoints, batalha, VFX, IA, saves, progressão, dinheiro, XP ou desbloqueio de líderes. Atlas local do cliente PMD/SpriteCollab, sem CDN em runtime; não usar portrait/ícone como sprite de corpo inteiro. Um sprite por palco, filtro nearest, sem hitbox ou input, escala limitada, memória mobile controlada. Não renderizar após sair da tela enquanto asset carrega.

## Critérios de aceite

Prova Phaser/WebGL REAL, 1280×720 e mobile 854×480, para Misty+Starmie e Brock+Onix, com sala de ginásio separada, sprite visível e CTA sem colisão. Save byte a byte preservado antes/depois; screenshots revisadas visualmente; npm test, check, check:reuse, build e CI verde. Aprovação artística explícita necessária antes de merge. Este patch não conclui ainda a migração dos 3/4 subchefes existentes para dentro do ginásio: manter como tarefa separada com proteção de identidade rival/Rocket.
