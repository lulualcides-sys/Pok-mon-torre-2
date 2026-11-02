# Campanha Torre 2 — Revisão visual do mapa

## Avaliação do usuário
A primeira versão continha muitos elementos, nós sobrepostos, textos pequenos e um botão de batalha difícil de encontrar.

## Modificações nesta revisão
- Mapa reduzido para **cinco nós grandes por página** com caminho em zigue-zague, sob um cenário verde discreto e com contorno pixelado.
- Removido excesso de árvores, texturas e rótulos numéricos. Destaque apenas no nó atual; ao vencer um treinador, o painel acompanha a nova posição.
- Botão fixo e grande **▶ INICIAR BATALHA**, em laranja, sempre no canto inferior direito; se houver captura pendente, torna-se **▶ CAPTURAR POKÉMON** com menu das três Pokébolas.
- Painel **MINHA EQUIPE** com as seis posições visíveis, retratos PMD oficiais do cliente capturado, nível, HP, seleção visual do Pokémon ativo e toque para abrir o sumário existente.
- **Mochila desenhada em pixel art** no canto superior direito do painel, abre inventário, poções e TMs; seleção com retratos também dentro da bolsa.
- Rodapé esquerdo com nomes completos **GRAMA ALTA, CENTRO POK. e POKÉ MART**, em vez das siglas GR, HP, M.
- Topo da campanha mostra a cidade e o líder do ginásio; controles Centro/PC, Menu e Reset não se sobrepõem.
- O cliente já tinha 11 golpes aprovados; **nenhuma animação foi alterada**, tampouco os novos Sing, Crabhammer ou Smog, ainda aguardando avaliação do usuário.

## Controle
A interface continua no Phaser/WebGL e utiliza sprites/portraits do cliente. Não incorpora CSS nem Canvas 2D ao jogo. Compatível com o mesmo salvamento v1.
