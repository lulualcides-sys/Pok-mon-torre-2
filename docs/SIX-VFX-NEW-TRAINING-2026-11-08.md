# Seis novos golpes — laboratório visual integrado ao Phaser

**Estado:** integração isolada para revisão visual; ainda não é um novo kit ou golpe de campanha, Arena/VS ou Training tradicional.

## Arte entregue
Um PNG original transparente com 96 quadros (seis spritesheets de 16 frames, 56 × 56 pixels por frame) em `reference-assets/vfx-six/atlas.png`. Origem: as seis imagens em pixel art produzidas nesta conversa. As miniaturas foram convertidas com preservação de transparência, redução de paleta e alinhamento de pixels. Hash SHA-256 no `manifest.json`.

Golpes: Gunk Shot, Magnet Bomb, Ominous Wind, Drill Run, Freeze-Dry e Head Smash.

## Dentro do jogo
A nova cena `VfxSixLab` é registrada em `tools/pokearena/build-preview.mjs` e aparece no menu de jogar como **NOVOS GOLPES 2D**. Usa o Phaser/WebGL do próprio Poké Arena 2D, seis botões para escolher os golpes, 16 frames de preparação/voo/impacto/dissipação, e retorno à tela de título. O PNG é copiado para `arena2d/assets/torre2/vfx-six/atlas.png` e incluído no fingerprint de cache do Pages.

## O que não foi modificado
- Todo kit original do Poké Arena 2D, Arena, campanha, Pokédex, evoluções e ULT.
- Os golpes aprovados, seus sprites e a batalha normal.
- Saves, dano/HP, cooldowns, colisões, status e economia.

O alvo de treino na nova cena é **somente visual**; não é uma simulação de dano real. Inserir efeitos em combate com acerto, status, recuo, aprendizagem e balanceamento exige uma segunda etapa de validação, com mecânicas Pokémon oficiais e aprovação visual explícita. O lote está **pendente de aprovação artística** até a inspeção no jogo.

## Validação e publicação
`node --test tests/six-vfx-training.test.mjs` verifica PNG, SHA, 96 frames e seis ciclos de animação. O CI valida o código. O fluxo completo de `pages-native-vfx-preflight` deve preservar os kits nativos e verificar Phaser/Chromium. Merge e publicação só após CI verde, revisão e checagem do SHA no endereço do jogo.

Contribuição de terceiros: não há extração de VFX exclusivos do Poké Arena 2D, Zarza ou Emerald Arena; o código é uma cena isolada e spritesheets originalmente geradas. A consulta à biblioteca é anterior à criação; não se afirma que esses materiais externos foram copiados.
