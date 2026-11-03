# T76 — Misty: quatro sprites FireRed distintos + Starmie PMD Idle

**SOMENTE homologação**: `test/homologacao-kanto-20261103`. Nenhuma alteração nos 60 mapas WebP aprovados, combatentes, golpes, chances, saves, custos, níveis ou resultados. PROIBIDO deploy Pages/`main` antes de aprovação final expressa.

## Defeitos visuais observados em screenshot real
1. Os quatro adversários do ginásio aquático repetiam apenas `swimmer` e `lass` (dois NPCs iguais duas vezes).
2. O Starmie da Misty era apresentado como retrato quadrado pequeno de 30×30 pixels, diferente do sprite usado nas batalhas.

## Correção T76
- Manter as quatro plataformas e os quatro índices de combate originais [11,12,13,14]. Substituir os visuais repetidos por quatro sheets originais distintos do repositório pret/pokefirered, já disponibilizados pelo instalador local: `swimmer_m_land`, `sailor`, `picnicker`, `cooltrainer_f`. Nenhuma mudança de dificuldade/equipe ou identidade do adversário.
- Conservar Misty original `frlg-npc-misty` no centro da plataforma superior.
- Ler apenas o `Idle` da espécie 0121 a partir do manifesto SpriteCollab PMD local da versão Phaser, validar nome da PNG, tamanho e duração dos quadros. Carregar somente esse spritesheet extra na etapa 1, com transparência e pixel-art NEAREST. O Starmie é independente do fundo e ancorado com a base sobre o platô, sem retrato quadrado.
- Usar `torre2-gym-ace-source=pmd-idle` e marcadores por sprite para auditoria real sem bloquear hotspots. Na ausência do sprite oficial, não fabricar alternativa genérica; os testes de navegador devem reprovar a integração.
- Preservar os outros ginásios como estão por enquanto; Surge tem figuras pintadas na imagem aprovada e exige avaliação separada, sem sobreposição arbitrária.

## Evidência / não confundir
- Unitário `tests/t76-misty-native-sprites.test.mjs` exige quatro texturas diferentes, os índices 11–14, manifesto PMD seguro, e presença do Sprite no Phaser.
- `tests/approved-map-real-browser.cjs` em desktop e mobile exige `frlg-npc-misty`, quatro classes reais e `torre2-gym-ace-idle-0121` com transparência e tamanho adequado; faz screenshot nativo `approved-gym-misty-[desktop/mobile].png`.
- O teste navega com fixture controlada de história, **não é uma campanha completa concluída naturalmente**.
- Gates T41, Guardião Visual e ZIP homologação devem terminar PASS no SHA exato antes de integrar.

Próximas etapas somente com nova auditoria e aprovação visual: Lt. Surge, Erika, Koga, depois Sabrina/Blaine/Giovanni e Elite.
