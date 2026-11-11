# T35 — Pokémon ace decorativo nos ginásios (rascunho isolado)

## Contrato
Apenas no **interior** do ginásio, ao lado do líder, exibir o `boss` já presente em `GYMS` com sprite PMD local, sombra e idle leve. Não renderizar na cidade, rota, arena ou HUD. Não modificar `GYMS`, equipes, RNG, XP, saves, treinadores, recompensas ou combate. Não criar hit zones nem bloqueios de caminho.

## Implementação parcial neste PR
O módulo `torre2-gym-ace.js` fornece `gymAceSpec`, `preloadGymAce` e `renderGymAce`, com descarte explícito do tween e fallback sem textura. O código **ainda não está conectado ao runtime**: aguarda o mapa interior real e posições da plataforma final da frente T33/PR #421. O sprite existente é retrato PMD; a adequação estética a overworld deve ser aprovada em captura real antes de integrar.

## Gates de conclusão (pendentes)
- Conectar **somente** na cena interior do ginásio, nunca na cidade; testar Brock/Onix e Misty/Starmie em desktop e mobile com capturas **reais** do Phaser.
- Inspecionar proporção, escala, sombra, idle, FPS e sobreposição com líder, escadas, 3–4 subchefes e zonas de toque.
- Validar origem/licenças dos sprites; manter a ordem canônica dos confrontos e save byte a byte.
- Executar `npm test`, `npm run check`, `npm run check:reuse`, build, browser e guardião visual no SHA exato. Somente então considerar merge/publicação, após aprovação visual.

## Compatibilidade
Lê `GYMS.boss` e `KANTO_DEX` da fonte vigente; Giovanni permanece Rhyhorn (não Nidoking). Não adiciona confrontos nem grind. Este PR é **DRAFT** e não altera a campanha em produção.
