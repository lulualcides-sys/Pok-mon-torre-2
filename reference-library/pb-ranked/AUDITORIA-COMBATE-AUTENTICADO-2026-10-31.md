# Sessões autenticadas de combate — Pokémon Battlegrounds × Torre 2

**Data:** 31/10/2026  
**Tipo:** observação prática, não implementação de jogo  
**Conta:** sessão Google previamente autenticada pelo usuário no perfil privado do TinyFish; nenhuma credencial foi lida ou copiada  
**Objetivo:** verificar **dentro do jogo** golpes, ataques, movimentação, recargas, esquivas, trocas e arenas para futura seleção e adaptação original ao Pokémon Torre 2.

## Métodos e rastreabilidade

- [Sessão 1: entrada autenticada, Practice vs Bot e HUD](https://agent.tinyfish.ai/runs/d17745eb-c5cc-4e4f-8236-c6d6202d325b).
- [Sessão 2: prática 3v3 e AUTO, efeitos e feedback](https://agent.tinyfish.ai/runs/db3725da-4a5a-4e71-a91d-23824a88cd42).
- [Sessão 3: ataques manuais, DODGE, troca e derrota](https://agent.tinyfish.ai/runs/0b7a104a-322a-4ac8-ab26-d759b6131b0c).
- [REA/CDP público](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/41226497651) e [AST/REA profundo](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/41227227340) permaneceram como **inventário estático separado**. **REA não foi conectado ao contexto Google autenticado do TinyFish.**

Fonte estruturada: [COMBATE-OBSERVADO-2026-10-31.json](COMBATE-OBSERVADO-2026-10-31.json). São observações relatadas pelo navegador TinyFish a partir das telas e ações: não são medições independentes de frame/hitbox.

## Resultado real das sessões

A sessão Google previamente salva permitiu entrar em **PLAY → PRACTICE VS BOT → 1 EASY**, formato **3V3**, chegar à batalha e interagir com comandos. O bot é **nível 1**; mesmo neste modo existe fila de servidor. A segunda sessão alternou o botão AUTO e registrou combate; a terceira executou golpes manuais, DODGE, troca e chegou à tela **YOU LOST**. Uma vitória foi relatada pelo agente na segunda sessão, mas seu contexto cronológico é menos nítido e não é usada como prova de eficiência dos golpes.

| Arena | Evidência | Descrição |
| --- | --- | --- |
| N's Castle | **Nome no DOM da terceira partida** | Sala ladrilhada, paredes de tijolos verdes, plataformas circulares |
| Battle Stadium | Opção selecionável / primeira navegação | Não validar o cenário renderizado específico na segunda sessão |
| Outras arenas | 17 nomes no catálogo estático de seleção | Sem confirmação visual individual em partida |

## Golpes reconhecidos durante o combate

| Pokémon | Nome | Tipo/poder vistos quando disponíveis | Efeito ou estado visto | Grau de confirmação |
| --- | --- | --- | --- | --- |
| Tyranitar | Dark Pulse | DAR · 80 | Clique manual, indicador `ready → called`, energia escura/fumacenta, mensagens de dano/erro | **Ação e efeito vistos** |
| Tyranitar | Stone Edge | ROC · 100 | Clique manual, pedras/partículas e feedback de efetividade | **Ação e efeito vistos** |
| Tyranitar | Crunch | DAR · 80 | Clique manual, efeito de mandíbulas | **Ação e efeito vistos** |
| Tyranitar | Earthquake | GRO · 100 | Tremor/efetividade relatados | **Movimento no HUD; acionamento manual não isolado** |
| Crobat | Cross Poison | Não mensurado | Clique e resultado `No effect` naquele oponente | **Comando e mensagem vistos** |
| Crobat | Air Slash | Não mensurado | Botão de golpe disponível | **HUD apenas** |
| Crobat | Toxic | 2 uses no HUD | Botão disponível | **HUD apenas** |
| Crobat | Brave Bird | Não mensurado | Botão disponível | **HUD apenas** |
| Snorlax | Body Slam | Não mensurado | Botão disponível após entrada em campo | **HUD apenas** |
| Snorlax | Hyper Beam | 150 no HUD | Feedback de resistência reportado | **HUD e texto; ativação direta incerta** |
| Snorlax | Earthquake | Não mensurado | Botão disponível | **HUD apenas** |
| Snorlax | Rest | Não mensurado | Botão disponível | **HUD apenas** |

**Outras referências de combate:** efeito Water Pulse relatado na segunda sessão; tela apresentou `MISS`, `EFFECTIVE`, `SUPER EFFECTIVE`, `NOT VERY EFFECTIVE`, `No effect` e número de dano `163`. Essas mensagens foram observadas, mas **não** permitem inferir com exatidão fórmulas nem aplicabilidade para todas as espécies.

## Movimento, esquiva, AUTO e troca

| Sistema | Ação realmente executada | Resultado verificável | Falta medir |
| --- | --- | --- | --- |
| AUTO | Clique no alternador | Estados visuais mudaram; batalha continuou com ataques automáticos | Regras da IA, priorização e velocidade |
| MANUAL | Alternador clicado na 3ª sessão | Modo manual selecionado, ataques disparados por botão | Movimento efetivo com WASD e aceleração |
| DODGE | Pressionou `Space` e clicou DODGE | Estado CSS `dodge shake` virou `dodge shake cooling` | Distância, direção, invulnerabilidade e duração precisa |
| Golpes | Clicou Dark Pulse / Stone Edge / Crunch | Estado `move ready` mudou para `move ready called`; VFX visíveis | Cooldown em segundos, hitbox, FPS, animação quadro a quadro |
| Troca para Crobat | Clicou `Switch to Crobat` | Pokémon ativo mudou de Tyranitar para Crobat | Coreografia completa da troca e Pokébola |
| Snorlax ativo | Ocorreu durante sessão | Golpes próprios apareceram no HUD | Se entrada decorreu de KO, AUTO ou clique |
| Pokébola do treinador | Nenhuma ação isolada confirmada | Ícones de Pokébola visíveis na UI | Arremesso, abertura, retorno, absorção e timing |
| Arena | Combate em N's Castle | Câmera/palco de pedra observados | Layout, camadas, mapas/tilemaps, colisões e parallax |

**Atenção:** ícones de Pokébolas na equipe não provam que um treinador lançou ou recolheu uma Pokébola. Também não há evidência de captura selvagem neste modo de duelo.

## O que vale adaptar no Torre 2

1. **Feedback da esquiva:** indicador claro de disponibilidade/cooldown do DODGE; implementar movimentação original em Phaser/WebGL sem copiar arte ou tocar nos VFX já aprovados.
2. **Feedback dos golpes:** `ready`, `called`, `near`, `MISS`, `SUPER EFFECTIVE`, pequenas partículas de impacto sincronizadas ao cálculo de dano. Reaproveitar, em vez de duplicar efeitos existentes.
3. **Manual/AUTO:** manter controles aprovados da Arena; avaliar mudanças apenas na IA/autonomia da campanha em protótipo independente.
4. **Troca de Pokémon:** preservar efeitos da captura já aprovados; estudar melhor coreografia de devolução e entrada antes de desenvolver.
5. **Cenários:** usar N's Castle como **referência de composição**, não copiar tiles e personagens proprietários. Cerulean e campanha preservadas.

## Limitações e critérios de qualidade

- O usuário pediu cópia/catálogo para escolher depois; **os dados observados estão salvos em JSON**. Não foram copiadas as artes nem o código de terceiros para o jogo publicado.
- Ao contrário das pesquisas anteriores, **o login e o jogo contra bot funcionaram**. Não persistir o antigo estado como se o login ainda estivesse bloqueado.
- Animações descritas por um agente de navegador não equivalem a spritesheets extraídos, timing de quadros ou fonte editável. Screenshots/gravação estão vinculadas às sessões TinyFish e **não arquivadas nesta branch**.
- A indicação `dodge cooling` após uso não confirma o deslocamento de esquiva nem mede sua duração precisa.
- As sessões de navegação apresentam nomes de perfil/arena inconsistentes na segunda coleta. Só se afirma N's Castle quando explicitamente identificado pela terceira.
- A biblioteca de origem PB Ranked contém 119 nomes únicos em 123 registros, mas estes são **candidatos estáticos**, não 119 animações confirmadas em partida.
- Nenhuma alteração à `main`, saves, VFX aprovados, Arena HUD, mapa Cerulean ou GitHub Pages foi autorizada/realizada por esta pesquisa.
