# Especificação — VS de treinadores (30/10/2026)

## Objetivo
Antes do combate normal contra treinador, rival, Rocket, líder, Elite Four e revanches, apresentar durante aproximadamente 1,5 s o protagonista Red e seu adversário em pixel art nativa FRLG, VS central, nomes e Pokébolas correspondentes à equipe real. Referência: vídeo fornecido pelo usuário, cena aproximadamente 15,6–17,1 s.

## Cenários e critérios
- Primeira batalha pelo botão de campanha: VS com Red, adversário coerente, uma Pokébola para cada lado e entrada normal em combate.
- Líder/rival/Rocket/Elite e revanche: rótulo, sprite e equipe reais. Não inventar Pokémon adicionais.
- Selvagens, treino e laboratório: sem VS, fluxo anterior preservado.
- Interação mobile: nenhum clique inicial deve acionar comando inesperado no combate. Overlay bloqueia toque na campanha durante introdução.
- Cancelamento por saída/restart: destruir o overlay e cancelar seu timer, sem lançar combate depois.
- WebGL/Phaser, sprites já existentes e texturas de Pokébolas aprovadas; sem vídeo embutido, Canvas 2D de efeitos ou assets externos.
- O VS jamais altera o save, progresso, golpes, level, IA, HP, XP, TMs, chance de captura ou mecânicas.
- Publicar apenas após testes de sintaxe, regressão, Chromium, build real e Pages verificado no SHA.

## Fora de escopo
Alterar ataques, personagens jogáveis, Pokédex, sistemas de captura/loja, combate Arena e campanha natural completa.
