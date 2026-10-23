# Pokémon Torre 2 — Lt. Surge: Thunder Wave, Sonic Boom, Screech

Versão: 23/10/2026. Patch integrado ao jogo Phaser/WebGL.

## Aprovados, preservados
- **Ice Shard**: aprovado pelo usuário no chat em 23/10/2026. Mantidos os sete cristais pequenos com rotação e trilhas, colisão e dano já aprovados.
- **Ancient Power**: aprovado no chat. Mantidas pedras 20% maiores com contorno verde-claro e todas as 12 poses.
- Todos os 23 golpes novos do lote original estão visualmente aprovados; Dragon Pulse original do Poké Arena permanece sem duplicação.

## Três golpes visualmente aprovados (23/10/2026)
- **Thunder Wave**, elétrico, STATUS, 0 dano, 100% precisão FRLG, PP20: descarga de raio amarelo com ramificações ciano. O projétil deve tocar fisicamente no alvo. Paralisa no motor de status original por 7 s no tempo da arena; não afeta Ground; Electric pode ser paralisado em FireRed. Não tenta simular dano elétrico nem ataque automático.
- **Sonic Boom**, normal, dano fixo de **20 HP**, precisão 90%, PP20: anéis concêntricos azul-esbranquiçados, em ondas sonoras com rastro. Colisão manual pelo segmento de trajetória, sem homing. Usa `puro:true` da API real `recibir` e imunidade Ghost explícita. Não modifica dano fixo por nível, Defesa ou fraqueza. Ao errar, não causa nenhum dano.
- **Screech**, normal, STATUS, 0 dano, precisão 85%, PP40: rajada aguda de anéis violeta discretos, sem projétil de dano. No impacto, reduz **Defesa em dois estágios** (acumula até -6, dura 7 s na arena). A função `get defensa` original só é estendida quando `escena.datos.torre2` está presente; o motor original fora da campanha permanece igual. O jogo Phaser usa um atributo de Defesa combinado, portanto afeta a Defesa única, não duas estatísticas separadas.

## Lt. Surge original do Pokémon FireRed
O chefe possui **3 Pokémon** na ordem Voltorb → Pikachu → Raichu.
- Voltorb (Lv 21): **ATK Tackle**, **HAB2 Sonic Boom**, **HAB3 Screech**, **ULT Shock Wave**
- Pikachu (Lv 18): **ATK Quick Attack**, **HAB2 Thunder Wave**, **HAB3 Double Team**, **ULT Shock Wave**
- Raichu (Lv 24): mesmos quatro movimentos originais do líder.

A organização em botões do nosso jogo é diferente do RPG por turnos, por isso Shock Wave ocupa E e consome a barra ULT. Todos os ataques existentes e aprovados continuam na biblioteca.
A equipe **do jogador** usa seu próprio moveset: Voltorb Tackle/Sonic Boom/Screech/Explosion; Electrode Tackle/Sonic Boom/Discharge/Explosion. Thunder Wave passa a estar disponível para Pikachu, Raichu, Magnemite e Magneton (respeitando desbloqueio dos novos Pokémon).

## Reuso, origem e licenças
- Torre2: `batch24/runtime.js#swept` para contato real; original Pokémon Torre 2.
- Poké Arena 2D: `pixels.js#stamp` e máscaras P2 `p2darkring`, `p2star`, `curl`; atribuição original de Poké Arena 2D retida.
- Emerald Arena: 12 poses de fragmentos `emerald-fragments.js#FRAGMENT_POSES`, derivadas de física MIT com aviso em `EMERALD-LICENSE.txt`.
- Pokémon Zarza: inspecionado anteriormente como referência de superfície; **não** houve cópia de código nem sprites por falta de licença de redistribuição confirmada. Exceção permanece documentada no manifesto `data/move-reuse-policy.json`.

## Gates
- `npm test` (inclui `tests/surge3.test.js`)
- `npm run check:reuse`: os novos golpes têm registro verificado por fonte; Zarza mantido como exceção honesta
- `node tests/surge3-built.test.mjs`: catálogo e golpes reais, Pokedex e os 3 NPCs
- `node tests/batch24-browser.cjs`: screenshots e verificações no Chromium WebGL, incluindo status e 20 HP fixos
- `node tests/source-client-smoke.cjs`: Pokédex, campanha e 5 botões
- Publicar no GitHub Pages apenas quando **tudo passar** e o fingerprint da versão nova estiver no endereço público.

### Referências oficiais
- https://pokemondb.net/move/thunder-wave
- https://pokemondb.net/move/sonic-boom
- https://bulbapedia.bulbagarden.net/wiki/Screech_(move)
- https://bulbapedia.bulbagarden.net/wiki/Lt._Surge
