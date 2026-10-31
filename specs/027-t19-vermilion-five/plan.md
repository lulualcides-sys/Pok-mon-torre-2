# T19 — Vermilion: primeiros cinco treinadores após Misty natural
## Origem verificável
Somente o save exportado pelo workflow real #41194363962 (PR #403): 15 treinadores Cerulean e Misty, 42 vitórias, 0 derrotas, estágio 2/treinador 0, Cascata e TM03 Water Pulse. CI publica `t19-earned-misty-save.json`, hash SHA-256, origem do commit e UID dos membros. Nenhuma fixture de vitória, Pokémon de debug, RNG injetado ou recompensa fabricada.
## Aceite
Cinco treinadores nativos de Vermilion com cliques Phaser, recuperação via Centro, AUTO nativo ativado, XP real, progressão trainer 0→5, wins 42→47 e losses 0. Rocha/Cascata e TM39/TM03 persistem, sem antecipar medalha do Lt. Surge/TM Shock Wave. Salvar checkpoint após cada vitória real, validar reload idêntico. Derrota ou timeout mantém CI vermelha, mais relatório/screenshot; não editar gameplay.
## Risco e controles
Início da fase 2 ainda pode precisar de ajustes de IA/rotas. Não modificar o save do jogador. Somente prova em CI no Chromium (não Android real). Sem merge e publicação até CI verde + regressões, revisão e HTTP do SHA.
