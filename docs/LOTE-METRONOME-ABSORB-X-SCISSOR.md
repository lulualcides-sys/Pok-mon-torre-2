# Pokémon Torre 2 — 21/10/2026 — Metronome, Absorb, X-Scissor

## Aprovação recebida
**Petal Dance:** aprovado pelo usuário no estado de mira manual inspirado no Ice Beam; manter todas as pétalas, cores, trajetórias e mecânicas atuais congeladas. Os demais 16 golpes aprovados continuam intocados.

## Novo lote implementado (aguardando avaliação visual)
| Golpe | Pokémon Kanto | Arte em Phaser/WebGL | Funcionamento |
|---|---|---|---|
| Metronome | Clefairy, Clefable, Chansey, Mew | Dedinho de mão em quatro poses de pixel art, pequenas estrelas | Sortear dentre golpes existentes com renderer válido e executar o efeito sorteado; não se chama novamente |
| Absorb | Oddish, Bellsprout, Paras, Tangela, **Omanyte/Omastar (água/pedra)** e evoluções | Broto pixelado verde enviado por mira manual; energia volta após contato | Dano de planta se o disparo acertar; recupera metade do **dano realmente causado** apenas quando partículas retornam; nenhum HP em caso de erro |
| X-Scissor | Scyther, Pinsir, Parasect, Beedrill | Duas lâminas pixeladas verdes cruzando num X, sem projétil | Golpe físico tipo inseto a curta distância; dano único apenas quando cruzamento toca o inimigo |

Todos os três estão disponíveis para equipar em Mewtwo nível 50, sem modificar os renderizadores ou golpes nativos de Poké Arena 2D. Não possuem marca ✓ de aprovação até avaliação do usuário.

## Implementação
- **Arquivo isolado:** `tools/pokearena/torre2-next-specific-fx.js`; não edita código-fonte gráfico nativo.
- `tools/pokearena/torre2-signature-fx.js` agrega os três novos renderizadores, sem alterar os anteriores.
- `tools/pokearena/torre2-move-pool.js` registra os golpes e Pokémons elegíveis.
- `tools/pokearena/build-preview.mjs` inclui módulo na build e permite Metronome escolher um golpe já instalado.
- Testes de hit/miss, retorno e cura, sorteio de outro golpe, recursos WebGL e limpeza.

## Bases de pesquisa
- Pokémon Database — Absorb: https://pokemondb.net/move/absorb (50% de recuperação).
- Pokémon Database — X-Scissor: https://pokemondb.net/move/x-scissor (físico BUG, poder 80, sem efeito secundário).
- Bulbapedia — Metronome: https://bulbapedia.bulbagarden.net/wiki/Metronome_(move) (seleção aleatória, com exceções).

**Regra de alcance e habilidade:** Absorb e X-Scissor não usam autoaim; inimigo em linha errada/fora de alcance não perde HP. Feixes futuros seguem apenas `l.ax/l.ay` com giro suave, padrão Ice Beam, nunca teleguiamento.
