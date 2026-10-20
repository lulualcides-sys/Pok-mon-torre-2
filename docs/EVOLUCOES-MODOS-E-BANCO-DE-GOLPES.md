# Pokémon Torre 2 — evolução por modo, sprites reutilizados e banco enxuto de golpes

## Regra confirmada pelo criador

| Modo | Evolução durante a luta | Como evoluir |
| --- | --- | --- |
| **Kanto Campaign (Pokémon Torre 1)** | **PROIBIDA** | Ganhar níveis de experiência; mostrar nova forma **somente depois de terminar a batalha**. Pedras/troca/amizade não são requisitos deste jogo. |
| **Training** | **PERMITIDA** | Mesmo mecanismo de energia/EXP e botão EVO/MEGA do cliente original Poké Arena 2D. Não impor nível de campanha. |
| **VS CPU** | **PERMITIDA** | Evolução dinâmica original, inclusive Mega quando disponível. |
| **Arena Mode** | **PERMITIDA** | Evolução dinâmica original. |
| **League e demais modos offline** | **PERMITIDA** | Usar as regras do modo original, sem regras da campanha. |

A separação é decidida pelo marcador `escena.datos?.torre2` da luta. O código-fonte do Poké Arena 2D original, o layout, fonte, sprites, controle de toque e HUD permanecem intactos para os outros modos.

O botão EVO desaparece **somente** no controle de toque da campanha. Os prompts EVO/MEGA desaparecem **somente** no HUD da campanha. O comando de teclado/controle EVO/MEGA não funciona durante a campanha, mas permanece funcionando nos demais modos. O ganho de nível e a transformação após a batalha usam o módulo `src/progression.js` próprio do Torre 2.

## Não será necessário pedir ao usuário para reenviar todos os sprites

Fontes já conhecidas no repositório [Pokémon Torre 1](https://github.com/lulualcides-sys/Pok-mon-torre):

- [312 nomes/IDs de golpes e catálogos de efeitos](https://github.com/lulualcides-sys/Pok-mon-torre/blob/main/effects/moves/catalog/manifest.json);
- [efeitos aprovados ou protegidos](https://github.com/lulualcides-sys/Pok-mon-torre/blob/main/effects/moves/STATUS_APROVADOS.json); versões aprovadas não podem ser sobrescritas;
- [sprites e suas referências](https://github.com/lulualcides-sys/Pok-mon-torre/tree/main/assets/sprites) e [padrão visual](https://github.com/lulualcides-sys/Pok-mon-torre/blob/main/effects/moves/PADRAO_VISUAL_OFICIAL.md);
- [animações de Bolhas e Pistola d'Água](https://github.com/lulualcides-sys/Pok-mon-torre/tree/main/effects/moves/v128-water-preview) — exemplo de fidelidade visual aprovada;
- cliente do [pokearena2d.com](https://www.pokearena2d.com/) recuperado pelo REA, com o motor Phaser, arquivos `habilidades.js`, `vfx.js`, `arena.js`, `sprites.js` e spritesheets;
- [SpriteCollab/PMDCollab](https://github.com/PMDCollab/SpriteCollab) para outras espécies e animações Pokémon, sob CC BY-NC com créditos por autor.

**Atenção:** um arquivo referenciado em `assets/sprites/CATALOGO.json` pode estar somente na biblioteca histórica e não fisicamente dentro do repositório Torre 1. Verificar origem e arquivo real, nunca afirmar que está integrado apenas por constar no catálogo. A tradução de um efeito antigo Canvas/Pixi para Phaser não é automática. Só usar novo sprite depois de baixar/portar, conferir licença, montar animações e testar em combate.

## Banco econômico — 14 golpes de ataque + 2 de status por tipo

Criado o arquivo de candidatos [data/kanto-shared-moves.json](../data/kanto-shared-moves.json).

- **18 tipos**, cada um com **teto de 14 ataques + 2 golpes de status** no primeiro conjunto compartilhado de Kanto. Esses números **não** são 16 animações obrigatórias para *cada Pokémon*.
- Os mesmos spritesheets, efeitos e rotinas de impacto do Phaser são compartilhados por todos os Pokémon que legalmente aprendem o golpe.
- O conjunto inicial importado do catálogo do Torre 1 possui **246 candidatos**; faltam **42 vagas** para preencher os 288 slots-alvo (ex.: dark/ghost/flying); isso **não** equivale a 246 golpes já portados ou jogáveis.
- Antes de incluir um golpe no jogo, remover duplicatas PT/EN, verificar categoria/tipo/nome inglês, confronto com learnsets, status aprovado e efeito visual, timing/colisão/dano. Não usar o tipo automaticamente registrado no catálogo antigo como prova de correção (ex.: Scratch/Arranhão tipo Normal).
- **Reutilizar famílias de efeitos** (`projetil`, `chorro`, `burbujas`, `ola`, `rayo`, `dash`, `tajo`, `zona`, `escudo`, `viento` etc.). Não criar arte duplicada quando dois golpes compartilham comportamento; diferenciar forma, escala, tempo, paleta e impacto para manter identidade.
- **Status:** 2 golpes de status distintos por tipo como primeira meta; podem compartilhar as animações de status (brilhos, cura, escudo, poeira) adaptadas quando fizer sentido sem confundir seus efeitos.
- **Pokémon com tipos duplos:** usam o banco dos dois tipos, com movesets determinados pela espécie e seu nível. Pokémon não recebem golpes aleatórios só porque partilham um tipo. Movimentos de cobertura Normal devem ser permitidos conforme learnsets, sempre com até quatro golpes equipados na campanha.

### Exemplo de Água: Water Gun, Bubble Beam, Surf e Hydro Pump

O Poké Arena 2D já possui lógicas e texturas de jato, bolhas, ondas (`ola`) e hidrocanhão (`hidrocanon`). Reaproveitar essa **linguagem de pixel art** e o renderer do jogo, mas respeitar a silhueta de cada golpe:

- **Water Gun:** jato estreito contínuo; 
- **Bubble Beam:** várias bolhas, não um laser;
- **Surf:** uma onda ampla e móvel que alcança o alvo e dissipa em espuma;
- **Hydro Pump:** coluna/jato concentrado, mais poderoso e estreito que Surf.

Surf não é apenas Water Gun com escala maior: requer composição e frames de frente de onda. **O efeito de Surf ainda não está concluído.**

## Ordem de integração

1. Conservar a tela inicial do Poké Arena e seus outros modos solo, com a evolução original nesses modos.
2. Importar sprites Kanto por prioridade de campanha, usando os 27 Kanto conhecidos no manifesto do site e depois SpriteCollab; nunca comprometer performance do mobile pré-carregando o catálogo inteiro.
3. Selecionar 14 + 2 **candidatos** por tipo, dar preferência aos efeitos Phaser já funcionais e adaptar assets aprovados do Torre 1 quando necessários.
4. Associar golpes a cada espécie, suas evoluções por nível e seu learnset; usar os efeitos compartilhados.
5. Testar no jogo WebGL/Phaser (dano no impacto, CPU, habilidades físicas, movimentos de status, Android horizontal, FPS) e confirmar que nenhuma mudança da campanha afeta Training/VS CPU/Arena Mode.
