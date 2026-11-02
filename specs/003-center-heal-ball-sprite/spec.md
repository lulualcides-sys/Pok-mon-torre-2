# Centro Pokémon — sprite da Pokébola (30/10/2026)

O usuário quer substituir as Pokébolas borradas na tela "Recuperando sua equipe", mantendo o efeito de brilho/pulsação e a cura funcional.

## Aceitação
- Cada membro da equipe (até 6) exibe uma imagem Phaser da textura aprovada `torre2-original-ball-pokeball`, 16x16 com filtro NEAREST, exibida em 32x32 (2x).
- Manter alpha inicial 0,27 e tween `alpha:1, duration:260, delay:i*150, yoyo:true, repeat:1`.
- Não alterar HP/status/save, botão, intervalo de cura 1400 ms, feedback final de 450 ms nem o posicionamento dos nomes.
- Testar visualmente em Chromium desktop/mobile, sem inferir compatibilidade física Android.
- Somente publicar com CI e Pages verificáveis.
