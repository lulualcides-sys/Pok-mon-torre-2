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

## Fontes e política visual aprovada

**Não reaproveitar golpes do Pokémon Torre 1.** O catálogo anterior de candidatos foi excluído do Pokémon Torre 2. Seus sprites e efeitos de golpes ficam preservados no repositório original, mas **não são importados ao Torre 2**.

**Pokémon novos:** o usuário não precisa reenviar os sprites que já estão no Torre 1 para identificar espécies e recursos, e podemos obter sprites de Pokémon adicionais na SpriteCollab com créditos. Entretanto, o **novo efeito de golpe sempre será feito do zero no Phaser**, baseado em código, acabamento e comportamentos do `pokearena2d.com`; não usar o renderer antigo nem os efeitos Pixi/Canvas do Torre 1.

## Banco de ataques enxuto e reutilizável

O banco novo está em [data/kanto-new-phaser-moves.json](../data/kanto-new-phaser-moves.json), com 18 tipos e meta de **14 golpes ofensivos + 2 status por tipo**. Foram definidos **269 candidatos de golpes novos**; 19 posições ainda estão em aberto para não inventar golpes ou incluir ataques típicos de outros Pokémon como genéricos.

Este arquivo é **planejamento**; nenhuma animação inédita está pronta por constar na lista. Para ficar igual ao padrão do Poké Arena 2D, cada golpe novo usará o **Phaser 3/WebGL, pixel art com contorno, orientação, animações de 8 a 16 frames quando necessário, partículas e impacto sincronizado com dano**, reaproveitando rotinas gráficas que existem no Poké Arena 2D, mas **criando novos sprites e animações próprios**.

A biblioteca de golpes é compartilhada. Não existem 14 artes para cada espécie. Cada Pokémon terá **quatro golpes equipados** na campanha e aprenderá novos golpes conforme nível e espécie; várias espécies podem utilizar a mesma animação de Surf ou Thunderbolt com ajustes proporcionais.

### Golpes exclusivos: criar com animação própria

- **Cubone/Marowak — Bonemerang**: osso lançado que gira, atinge e retorna ao lançador; **dois contatos/impactos** distintos, com timing próprio.
- **Cubone/Marowak — Bone Club**: contato curto com osso físico, impacto e recuo. O mesmo asset de osso poderá aparecer em Bonemerang, sem igualar a coreografia.
- **Exeggcute/Exeggutor — Barrage e Egg Bomb**: vários ovos em sequência vs ovo grande de impacto; duas silhuetas distintas.
- **Meowth/Persian — Pay Day**: moedas pixeladas projetadas e estilhaços dourados no impacto.
- **Kangaskhan — Dizzy Punch**: sequência física com estrelas de confusão.
- **Porygon — Conversion e Tri Attack**: conversão de tipos com mudança na aparência do HUD, e ataque com três elementos cruzados.
- **Ditto/Mew — Transform**: transição de sprite e habilidades para o alvo; exige lógica de combate específica.
- **Magikarp — Splash**: salto sem dano para preservar a identidade e funcionamento real.
- **Hitmonlee — Rolling Kick / High Jump Kick**: aproximação física sem projétil, golpe no contato e recuo.
- **Chansey — Soft-Boiled**: cura com animação de ovo/efeito discreto.
- **Jynx — Lovely Kiss**: beijo e sono com ícones/status sem poluir a tela.
- **Pikachu — Volt Tackle**: investida elétrica envolvendo o corpo, faíscas de rastro e recoil.
- **Mewtwo — Psystrike**: carga psíquica e impacto próprio, não uma Shadow Ball recolorida.
- **Venusaur/Charizard/Blastoise — Frenzy Plant, Blast Burn e Hydro Cannon**: finalizadores com identidade distinta por elemento.

**Prioridade sugerida:** Bonemerang, Bone Club, Tri Attack, Pay Day, Dizzy Punch, Transform, Volt Tackle, Psystrike e os três finalizadores. Cada exclusivo terá prévia e teste em batalha, depois aprovação antes de entrar na campanha.

## Ordem de integração

1. Conservar a tela inicial do Poké Arena e seus outros modos solo, com a evolução original nesses modos.
2. Importar sprites Kanto por prioridade de campanha, usando os 27 Kanto conhecidos no manifesto do site e depois SpriteCollab; nunca comprometer performance do mobile pré-carregando o catálogo inteiro.
3. Selecionar 14 + 2 **candidatos** por tipo, dar preferência aos efeitos Phaser já funcionais e adaptar assets aprovados do Torre 1 quando necessários.
4. Associar golpes a cada espécie, suas evoluções por nível e seu learnset; usar os efeitos compartilhados.
5. Testar no jogo WebGL/Phaser (dano no impacto, CPU, habilidades físicas, movimentos de status, Android horizontal, FPS) e confirmar que nenhuma mudança da campanha afeta Training/VS CPU/Arena Mode.
