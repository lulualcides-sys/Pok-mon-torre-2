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

## 2º refinamento — sprites desenhados, não formas geradas (21/10/2026)

O primeiro lote foi **reprovado visualmente** pelo usuário: contornos grandes, linhas lisas e ícones que pareciam Canvas. Esta revisão substitui integralmente **somente** `tools/pokearena/torre2-next-specific-fx.js` com arte organizada em matrizes de células de pixel (mesmo conceito aprovado em Petal Dance, Crabhammer e Guillotine), usando pequenos sprites desenhados com `K` como contorno escuro, tons médios, luz pontual e sequências de 12 quadros. O renderizador continua Phaser Graphics/WebGL, sem Canvas 2D, CSS, bitmap estático, linhas vetoriais ou círculos.

- **Metronome:** palma pixelada e dedo com quatro silhuetas autorais e ordem de doze posições; pequenas estrelas pixeladas, seguido do ataque sorteado do repertório real. Sem barra cinza/cursor artificial.
- **Absorb:** folha verde angular sombreada avança com a mira; após colisão, cinco pequenas partículas verdes retornam do inimigo ao usuário e restauram 50% do dano real. Sem desenho de broto repetido ao longo da trilha.
- **X-Scissor:** duas lâminas serrilhadas inteiramente desenhadas em matriz, com contorno escuro, lâmina verde e borda clara, atravessam a mesma posição em um X; único impacto físico no cruzamento e somente se acertar.

**Petal Dance e os 16 outros aprovados não sofreram alterações.** Estes três continuam **sem aprovação visual** até o usuário testar a atualização.

## 3º refinamento — 21/10/2026 (não aprovado ainda)
- **Menu principal:** logomarca "Pokémon Torre" aprovada e congelada; não editar menu, botões, logo, layout ou funções.
- **Metronome:** palma de 3 para 1,5 pixels/célula, dedo de 3 para 1,5; mover a palma e o dedo proporcionalmente; estrela e raio orbital reduzidos pela metade. Aleatoriedade e golpe sorteado preservados.
- **Absorb:** folha principal de 3 para 1,5 pixels/célula; motes e energia de cura de 2 para 1, estrelas e ondulação de trilha reduzidas ~50%; manter mira livre, dano apenas ao acertar e cura de 50% do dano real.
- **X-Scissor:** reprovado na versão anterior (parecia dois objetos verdes em X). Substituído por duas matrizes manuais de corte crescente/ciano, com ponta afiada, contorno escuro e núcleo claro. Doze quadros de movimento até cruzarem fisicamente em X, faíscas de pixel somente com contato real e uma só aplicação de dano. Nenhum projétil ou alvo teleguiado; efeitos duplicados substituídos por pequenos fragmentos para desempenho em Android.
- **Aprovação:** Metronome, Absorb e X-Scissor continuam aguardando avaliação visual. Os 17 golpes aprovados e o cliente original permanecem intocados.

Referência de funcionamento: [Pokémon Database — X-Scissor](https://pokemondb.net/move/x-scissor), golpe físico inseto feito com corte cruzado das garras/foices.
