# T19 — Lt. Surge, vitória natural a partir do treinador 17

Fonte: artifact `t19-vermilion-three-earned-native` #13056186388, CI #41235971117 SUCCESS no SHA `244d41ca4c5fe1dcb5c3b3ab8b78c75af11bc7c9`. O checkpoint da CI possui stage 2, trainer 17, >=64 vitórias e insígnias Rocha/Cascata. **Não é o save pessoal do jogador.**

A CI deve verificar hash SHA-256 do rawSave, sourceSha e origem; iniciar no mesmo save e clicar nos controles nativos do Phaser para Centro, Ginásio, confirmação DESAFIAR LÍDER, AUTO e eventuais trocas. O líder envia Voltorb, Pikachu e Raichu; nenhuma vitória, HP, XP, RNG, inventário ou badge pode ser injetado. Se ocorrer derrota genuína, registrar losses, curar pelo Centro, ganhar XP em encontros selvagens, tentar captura probabilística com estoque legítimo e repetir no máximo duas vezes. Respeitar cap Lv24.

Só declarar conclusão quando o navegador real registrar stage 3/trainer 0, vitória acumulada >=65, insígnia Trovao, TM34 Shock Wave, XP natural, reload byte a byte, sem pageerror. Testes npm/check/reuse, build Phaser, regressões T19/T25/T31 e guardião visual; PR draft até todos os gates verdes. Publicação requer merge e Pages HTTP verificado. O HUD de batalha, VFX, sprites e saves de jogadores permanecem intocados.
