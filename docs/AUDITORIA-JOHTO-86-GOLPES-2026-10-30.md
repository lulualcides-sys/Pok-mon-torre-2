# Auditoria Johto — os 86 golpes introduzidos na geração II

**Data:** 30/10/2026. **Escopo:** comparar o que já existe; nenhum moveset, sprite, efeito ou save foi alterado. Não confundir nome detectado, efeito cadastrado, disponibilidade de batalha e aprovação artística.

## Resumo conferido

| Situação | Número | Significado |
|---|---:|---|
| Presente no código ou catálogo Phaser Torre 2 | **30** | 19 nomes de cliente, 12 customizados e 1 sobreposição (Shadow Ball) |
| Mecânica de clima já existe | **2** | Sandstorm e Sunny Day: não confirmados como golpes equipáveis |
| Referência de golpe no Pokémon Torre 1, PixiJS | **8** | Visual/código reaproveitável por adaptação, não implementação Phaser |
| Sem entrada específica comprovada nas fontes | **46** | Não significa que todos sejam necessários à primeira versão de Johto |
| **TOTAL** | **86** | Movimentos introduzidos na Gen II, não todos os movimentos aprendidos em Johto |

**Legenda:** N = nome encontrado no cliente Phaser capturado (kit ou definição de técnica), sem garantir que esteja equipável na campanha; C = efeito incluído em catálogo próprio Phaser do Torre 2; N+C = uma entrada em ambas as origens, sem duplicar; W = mecânica de clima, não golpe equipável demonstrado; R = apenas referência PixiJS do Torre 1; M = não localizado como movimento específico nas fontes. Golpes como Rapid Spin, Rollout e Feint Attack foram vistos como esquivas (ESP), não devem ser prometidos como botões ofensivos.

## Bases verificadas

- [PokeAPI moves.csv](https://github.com/PokeAPI/pokeapi/blob/master/data/v2/csv/moves.csv), filtro generation_id=2: exatamente 86 nomes canônicos.
- [Pokémon Torre 2 commit 3f920834](https://github.com/lulualcides-sys/Pok-mon-torre-2/tree/3f920834edfab91635a13e77e04508f7eeb7a49b): tools/pokearena/torre2-move-pool.js, batch24/catalog.js, torre2-finale13-catalog.js, torre2-weather.js.
- [Cliente Phaser capturado, datos.js](https://github.com/lulualcides-sys/Pok-mon-torre-2/blob/pokearena2d-cliente-phaser/src-7bdd1f3685/datos.js), espelhado em 30/10/2026 03:06:51 UTC, módulos src-7bdd1f3685, origem src-ccb26f5340. [Registro de proveniência](https://github.com/lulualcides-sys/Pok-mon-torre-2/blob/pokearena2d-cliente-phaser/capture-provenance.json). Inclui habilidades e evoluções; nem todo nome implica ataque equipável.
- [Antigo inventário de 164 movimentos](https://github.com/lulualcides-sys/Pok-mon-torre-2/blob/main/data/pokearena2d-source-moves.json) é fotografia de captura anterior, NÃO contém todos os nomes encontrados no cliente mais recente.
- [Pokémon Torre 1 commit 1c9d774](https://github.com/lulualcides-sys/Pok-mon-torre/tree/1c9d774c14473e773670c3d0d4457435c9cdbd42/effects/moves): catálogo PixiJS com 312 entradas em catalog/manifest.json. Primeiras versões de arte não equivalem a 312 golpes aprovados. Consultado STATUS_APROVADOS.json separadamente.

## Matriz de 86 movimentos (ordem canônica do dataset)

| Nº | Golpe | Estado | Observação |
|---:|---|:---:|---|
| 1 | sketch | **M** | — |
| 2 | triple-kick | **M** | — |
| 3 | thief | **M** | — |
| 4 | spider-web | **M** | — |
| 5 | mind-reader | **M** | — |
| 6 | nightmare | **M** | — |
| 7 | flame-wheel | **C** | — |
| 8 | snore | **M** | — |
| 9 | curse | **M** | — |
| 10 | flail | **N** | — |
| 11 | conversion-2 | **M** | — |
| 12 | aeroblast | **N** | — |
| 13 | cotton-spore | **M** | — |
| 14 | reversal | **N** | — |
| 15 | spite | **M** | — |
| 16 | powder-snow | **M** | Torre 1 tem Pó de Gelo, mas catalogado como status; NÃO equivale a Powder Snow de dano. |
| 17 | protect | **C** | — |
| 18 | mach-punch | **R** | Catálogo PixiJS com primeira versão; não presume golpes/prioridade em Phaser. |
| 19 | scary-face | **R** | Catálogo PixiJS, primeira versão; não integrado no Phaser. |
| 20 | feint-attack | **N** | ESP/esquiva em kit nativo; não atribuir automaticamente a ataque. |
| 21 | sweet-kiss | **M** | — |
| 22 | belly-drum | **M** | — |
| 23 | sludge-bomb | **N** | Kit do Gengar confirmado; evitar VFX duplicado. |
| 24 | mud-slap | **C** | — |
| 25 | octazooka | **M** | — |
| 26 | spikes | **M** | Torre 1 tem atlas visual de espinhos genéricos, não prova de golpe Spikes. |
| 27 | zap-cannon | **M** | — |
| 28 | foresight | **M** | — |
| 29 | destiny-bond | **M** | — |
| 30 | perish-song | **M** | — |
| 31 | icy-wind | **C** | — |
| 32 | detect | **M** | — |
| 33 | bone-rush | **N** | — |
| 34 | lock-on | **N** | — |
| 35 | outrage | **N** | — |
| 36 | sandstorm | **W** | Motor de clima de areia presente, golpe equipável NÃO confirmado. |
| 37 | giga-drain | **C** | — |
| 38 | endure | **M** | — |
| 39 | charm | **N** | — |
| 40 | rollout | **N** | ESP/esquiva em kit nativo. |
| 41 | false-swipe | **M** | — |
| 42 | swagger | **M** | — |
| 43 | milk-drink | **M** | — |
| 44 | spark | **R** | Faísca com módulo próprio no Torre 1 (effects/moves/faisca/index.js), PixiJS, não Phaser. |
| 45 | fury-cutter | **C** | — |
| 46 | steel-wing | **M** | — |
| 47 | mean-look | **M** | — |
| 48 | attract | **M** | — |
| 49 | sleep-talk | **M** | — |
| 50 | heal-bell | **M** | — |
| 51 | return | **M** | — |
| 52 | present | **M** | — |
| 53 | frustration | **M** | — |
| 54 | safeguard | **R** | — |
| 55 | pain-split | **M** | — |
| 56 | sacred-fire | **N** | ULT do Ho-Oh no cliente capturado. |
| 57 | magnitude | **M** | — |
| 58 | dynamic-punch | **N** | — |
| 59 | megahorn | **N** | — |
| 60 | dragon-breath | **R** | Também citado na política de evolução do Torre 2, mas VFX Phaser próprio não comprovado. |
| 61 | baton-pass | **M** | — |
| 62 | encore | **M** | — |
| 63 | pursuit | **M** | — |
| 64 | rapid-spin | **N** | ESP/esquiva em kit nativo. |
| 65 | sweet-scent | **M** | — |
| 66 | iron-tail | **N** | Presente no kit de Steelix capturado. |
| 67 | metal-claw | **C** | — |
| 68 | vital-throw | **M** | — |
| 69 | morning-sun | **M** | — |
| 70 | synthesis | **R** | — |
| 71 | moonlight | **R** | Catálogo PixiJS; a mecânica de cura precisa ser verificada. |
| 72 | hidden-power | **M** | — |
| 73 | cross-chop | **C** | — |
| 74 | twister | **C** | — |
| 75 | rain-dance | **C** | VFX próprio Phaser e motor de chuva. |
| 76 | sunny-day | **W** | Motor de clima de sol presente, golpe equipável NÃO confirmado. |
| 77 | crunch | **N** | — |
| 78 | mirror-coat | **N** | Presente no kit do cliente capturado. |
| 79 | psych-up | **M** | — |
| 80 | extreme-speed | **N** | Definição MOV usada pelo cliente; conferir espécie e slot em Johto. |
| 81 | ancient-power | **C** | — |
| 82 | shadow-ball | **N+C** | Cliente + Phaser personalizado aprovado, contar uma vez. |
| 83 | future-sight | **R** | Catálogo PixiJS; dano retardado não comprovado no Phaser. |
| 84 | rock-smash | **M** | — |
| 85 | whirlpool | **M** | — |
| 86 | beat-up | **M** | — |

## Onde a classificação anterior falhou

- **Sacred Fire, Iron Tail, Mirror Coat, Sludge Bomb, Extreme Speed, Dynamic Punch, Bone Rush, Feint Attack, Rapid Spin, Lock-On:** nomes presentes no cliente capturado; foram incorretamente apresentados como faltantes.
- **Mach Punch, Scary Face, Spark/Faísca, Safeguard, Dragon Breath, Synthesis, Moonlight e Future Sight:** referências reais no Pokémon Torre 1, mas dependem de adaptação e teste no Phaser; não duplicar ou recriar sem consultar esses originais.
- **Sandstorm e Sunny Day:** lógica de clima existe em tools/pokearena/torre2-weather.js, mas não há golpe Phaser selecionável comprovado apenas por essa classe.
- **Powder Snow:** existe item semelhante Pó de Gelo no Torre 1, catalogado como status, NÃO o mesmo ataque com dano; conferir antes de reaproveitar.
- **Spikes:** existe sprite genérico effects/elements/v59/spikes/atlas.png no Torre 1, mas não a implementação do golpe com armadilhas.
- Não presumir que um golpe compatível com Pokémon Johto já esteja desbloqueado por nível/TM no jogo; a distribuição precisa ser feita com learnsets e slots, ULT distinta, equilíbrio e testes.

## Prioridade para expandir Johto sem duplicar trabalho

1. Reutilizar de forma comprovada os 30 nomes já encontrados no Torre 2, sem mexer em VFX aprovados e sem confundir esquivas com ataque.
2. Adaptar/testar as oito referências PixiJS de acordo com a semântica oficial, começando por Spark, Mach Punch e Dragon Breath; usar documentação e ativos apenas com licença adequada.
3. Entre os 46 sem entrada específica, priorizar Zap Cannon, Octazooka, Milk Drink, Spikes, Powder Snow, Steel Wing, Perish Song, Destiny Bond e Baton Pass conforme a necessidade real dos 100 Pokémon.
4. Reaproveitar também os ataques originais da geração I que espécies de Johto aprendem: NÃO precisamos desenvolver os 46 para colocar todos os 100 Pokémon no jogo. Quantidade definitiva só após cruzar learnsets, status, ULT e biblioteca de efeitos.

**Estado:** auditoria documental de código; não significa 100 Pokémon de Johto integrados, 86 golpes jogáveis, nem validação visual individual.
