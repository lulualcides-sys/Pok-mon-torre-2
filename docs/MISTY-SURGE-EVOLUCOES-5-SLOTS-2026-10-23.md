# Pokémon Torre 2 — Misty e Lt. Surge + cinco comandos por evolução
**Patch de 23 de outubro de 2026 · Integração Phaser/WebGL**

## Escopo

1. Manter o primeiro mapa de Brock com 13 treinadores e o fluxo existente.
2. Preparar o segundo mapa **Route 3 → Mt. Moon → Route 4 → Cerulean**, com **15 treinadores** e líder **Misty**. Misty enfrenta com **Staryu → Starmie**, usando Starmie como ace no nível 21; não usar o antigo Wartortle provisório.
3. Preparar o terceiro mapa **Routes 24/25 → Routes 5/6 → S.S. Anne → Vermilion**, com **17 treinadores** e líder **Lt. Surge**. A equipe original de FireRed é **Voltorb → Pikachu → Raichu**, com Raichu no nível 24.
4. Preservar a organização de batalha sequencial (um treinador após o outro, líder destacado), os sprites de treinadores FireRed, as interações PC/Mart/grama e o visual original Phaser. As cidades já possuem texturas de referência FRLG (Cerulean e Vermilion); rótulos de rotas aparecem no mapa e ao selecionar treinadores. Não alterar mapas posteriores.
5. **ATK (LMB)** fraco, **HAB 2 (RMB)**, **HAB 3 (Q)**, **ULT (E)** com energia, **ESQUIVA (ESPAÇO)** sem dano. Cada evolução tem **seu próprio** conjunto de quatro ataques e a esquiva obrigatória. A equipe só evolui após a batalha e aprende os golpes da nova forma; o mecanismo original fora da campanha é preservado. Os cinco comandos aparecem com seus nomes no sumário.

## Pokémon adicionados com sprites PMD oficiais da base SpriteCollab

**Rota de Misty — 7 novas famílias, 15 sprites por forma/evolução**
- Paras → Parasect
- Clefairy → Clefable
- Sandshrew → Sandslash
- Ekans → Arbok
- Staryu → Starmie
- Psyduck → Golduck
- Poliwag → Poliwhirl → Poliwrath

**Rota de Surge — 6 novas famílias, 14 sprites por forma/evolução**
- Oddish → Gloom → Vileplume
- Bellsprout → Weepinbell → Victreebel
- Meowth → Persian
- Diglett → Dugtrio
- Voltorb → Electrode
- Magnemite → Magneton

Total: **13 famílias novas, 29 atlas evolutivos adicionais**. Somadas às **10 famílias pré-Brock**, são 23 famílias additivas de Kanto, com sprites animados Idle/Walk e demais movimentos quando presentes. O jogo reutiliza a biblioteca de sprites PMD já creditada, sem imagens artificiais, nem alterações de efeitos aprovados.

## Golpes por forma — exemplos

| Família | ATK (LMB) | HAB 2 (RMB) | HAB 3 (Q) | ULT (E) |
|---|---|---|---|---|
| Staryu | Water Gun | Rapid Spin | Bubble Beam | Water Pulse |
| Starmie | Water Gun | Bubble Beam | Psybeam | Water Pulse |
| Voltorb | Tackle | Shock Wave | Charge Beam | Explosion |
| Electrode | Tackle | Shock Wave | Discharge | Explosion |
| Pikachu | Thunder Shock | Quick Attack | Swift | Thunderbolt |
| Raichu | Thunder Shock | Quick Attack | Thunderbolt | Thunder |
| Beedrill | Poison Sting | Peck | Fury Attack | Cross Poison |
| Butterfree | Tackle | Gust | Confusion | Psybeam |
| Venusaur | Razor Leaf | Sludge Bomb | Ingrain | Frenzy Plant |
| Blastoise | Water Gun | Bubble Beam | Hydro Typhoon | Hydro Cannon |
| Charizard | Ember | Flamethrower | Fire Spin | Blast Burn |

O plano por forma de **todas as famílias** está em `tools/pokearena/torre2-early-kanto-species.js` (`KANTO_ROUTE_SLOTS`, `KANTO_NATIVE_EVOLUTION_SLOTS`). **Esquiva** é um quinto comando defensivo separado, não substitui um dos quatro golpes. Alguns golpes só ficam disponíveis no nível necessário ou na evolução apropriada: por exemplo, Caterpie e Metapod não podem usar o ultimate de Butterfree antes de evoluírem.

## Polimento visual

- **Ancient Power**: pedras giratórias 20% maiores, com contorno pixel art verde-claro e núcleo natural de pedra. Status visual pendente até avaliação do usuário.
- **Ice Shard**: preservadas as sete trajetórias já aprovadas em estilo Pay Day; o cristal pequeno ganha rotação/tombamento e cintilação com 12 poses, sem mexer no dano nem no alcance. Status visual pendente.
- **Dark Pulse** e **Poison Jab**: já aprovados e integralmente preservados; nenhuma alteração.

## Reutilização das quatro fontes

- **Torre 2:** sistemas de progresso/captura/esquiva, colisão, efeitos já aprovados.
- **Poké Arena 2D:** motor Phaser/WebGL original, golpes nativos disponíveis, distribuição de ataques e sprites PMD.
- **Emerald Arena:** componentes de física de fragmentos sob MIT onde já empregados.
- **Pokémon Zarza:** referência técnica apenas, sem copiar código/arte sem licença de redistribuição verificada.

A exclusão de golpes duplicados continua: Dragon Pulse usa o original do cliente. O presente patch **não implementa efeitos novos** que substituam os aprovados.

## Testes

`npm test` inclui `tests/misty-surge-routes.test.js`, conferindo 23 famílias, slots por evolução, exceções de P2 e Ancient Power/Ice Shard. A build para Pages passa por `tests/misty-surge-built.test.mjs`, que verifica atlas reais, loadouts de evoluções, ginásios e combate, antes do Chromium real.
