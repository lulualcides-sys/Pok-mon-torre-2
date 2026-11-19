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

## Revisão 19/11/2026 — padrão visual nativo da Alpha 0.76.2

Pedido do dono do projeto: um design bonito em pixel art, no padrão do cliente-base, **sem mexer na arena (luta)**. Só `tools/pokearena/torre2-trainer-cards.js` mudou: é apresentação, sem alterar saves, progressão, kits nem o HUD de combate.

- **Kit nativo:** `marco`, `aro`, `candado`, `pastillaTipo`, `fondoMenu`, a paleta `UI` e `texto` com a fonte Cifras, que aumenta sozinha no celular. É o mesmo visual das telas League e Gyms.
- **Ação principal:** um botão dourado grande, "▶ Batalhar" ou "▶ Desafiar líder". Embaixo ficam só Equipe, Bolsa, Centro, Loja e **Mais**. Captura, Treino, VS Seeker, Pokédex, Insígnias, Áudio, Tela cheia e Reiniciar foram para o "Mais".
- **Equipe e progresso sempre visíveis:** o painel da cidade tem medalhão, líder, tipo do ginásio e barra "até o líder". A equipe aparece com 6 retratos, nível e HP, e há dinheiro e as 8 insígnias no topo.
- **Cards:** 4 por página, em painel nativo, com todos os Pokémon reais do adversário em chips de 22 px, nível, tipos em português e estado escrito (▶ Próximo, ✓ Vencido, cadeado). O card do líder tem borda dourada e a insígnia.
- **Identidade da cidade:** o fundo regional aprovado entra como camada leve sobre o fundo nativo, mais o medalhão da cidade e o painel "Jornada em Kanto" na última página.
- **Testes de design atualizados** para o layout novo, mantendo as garantias de comportamento: índices, revanche, bloqueio, seções rota/ginásio e roster completo.
