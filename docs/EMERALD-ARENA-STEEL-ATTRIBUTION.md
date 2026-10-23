# Pokémon Torre 2 — patch Steel FX / Treinamento — 23/10/2026

## Direção da troca (corrigida pelo usuário)

- **Flash Cannon RECEBE o efeito visual ANTIGO do Steel Beam**. Mesmo feixe metálico brilhante, sem autolesão. Poder 80, precisão 100%, 10% chance de reduzir Sp.Def.
- **Steel Beam RECEBE a execução ORIGINAL do Aura Storm/Chorro**, no motor Phaser do Poké Arena 2D, com paleta metalTorre2 prateada independente. Poder 140, precisão 95%, dano próprio igual a 50% do HP máximo ao disparar.
- **Mirror Shot**: descarta a placa espelhada giratória. O original em Pokémon é um clarão energético que parte do corpo polido; 65 poder, 85% precisão, 30% chance de reduzir Accuracy.
- **Treinamento**: Onix parado; recebe colisão/dano numérico do motor real e tem seu HP restaurado imediatamente. Um contador mostra dano, total e acertos. Energia e ultimate do jogador são 100. Sem alterar o salvamento.

Referências: https://pokemondb.net/move/flash-cannon ; https://pokemondb.net/move/steel-beam ; https://pokemondb.net/move/mirror-shot ; https://bulbapedia.bulbagarden.net/wiki/Mirror_Shot_(move)

## O que realmente veio das quatro fontes

| Fonte | Recurso localizado | Integração REAL, ou limitação |
|---|---|---|
| Torre 2 | Feixe do antigo Steel Beam, efeito e colisão custom; Ice Beam V6 | **Reuso real**: feixe antigo transferido para Flash Cannon. O sistema de golpes e colisões existente permanece |
| Poké Arena 2D | Lucario Aura Storm em src-747e24b561/datos.js; função Chorro e pintarHaz em habilidades.js | **Reuso real**: o motor original Chorro executa Steel Beam via delegação na tabela FORMAS e paleta adicional metalTorre2. Os originais não foram editados |
| Pokémon Zarza | poke-arena-beams.js (beamContact/stepArenaBeams) e poke-arena-vfx.js (paintArenaCharge/paintArenaShot/impactBloom), identificados em docs/REA-ZARZA-VARREDURA-AMPLIADA.md | **Somente estudado**. Não há licença de redistribuição confirmada desses módulos; nenhum código ou arte do Zarza foi diretamente portado. Não afirmar reuso real |
| Emerald Arena | https://github.com/GBurgardt/pokemon-emerald-arena/blob/main/game/overlay/src/arena_physics.c — Fragment e ArenaPhysics_Update | **Reuso real MIT**: coeficientes de física de fragmentos no pequeno impacto de Mirror Shot, implementados em mirrorFragments no arquivo Steel FX |

### Aviso de licença relativo ao código Emerald Arena adaptado

MIT License
Copyright (c) 2026 German Burgardt

Permission is hereby granted, free of charge, to any person obtaining a copy
of the original software and associated documentation files (the "Software"),
to deal in the Software without restriction, including without limitation
the rights to use, copy, modify, merge, publish, distribute, sublicense,
and/or sell copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

Escopo MIT: apenas o código novo da arena, instalador e ferramentas. Não inclui os recursos Pokémon, os arquivos do motor decompilado ou artes e sprites de terceiros.

## Aprovação

Nenhum dos três golpes foi marcado como aprovado. Como não se comprovou reuso real do Zarza, os três permanecem requires-rework no registro de origem, apesar das alterações funcionais entregues. Não alterar outros golpes previamente aprovados.
