# T16 — Afinidade de clima +20% por espécie

## Pedido
Quando um golpe de clima estiver ativo, Pokémon cujo tipo combina com esse clima causam +20% de dano **ofensivo**, até ele acabar. A regra é própria de Pokémon Torre 2, não uma reivindicação das regras originais de FireRed. Não inventar VFX nem golpes pendentes.

## Especificação
- Sunny Day / SOL: beneficiados FIRE e GRASS; prejudicados WATER e ICE.
- Rain Dance / CHUVA: beneficiados WATER e ELECTRIC; prejudicados FIRE, GROUND e ROCK.
- Sandstorm / AREIA: beneficiados ROCK, GROUND e STEEL; prejudicados GRASS, FLYING e ICE.
- Hail / GRANIZO: beneficiados ICE e WATER; prejudicados FIRE, GRASS e DRAGON.
- Qualquer ataque não-puro da espécie elegível ganha **um** fator 1.2 ou sofre **um** fator .8, independente do tipo do golpe.
- Pokémon duplo tipo que reúna afinidade e oposição ao mesmo clima fica neutro (1.0); dois tipos do mesmo lado não empilham.
- As penalidades originais de 50% por golpe Água no sol, Fogo na chuva e Solar Beam ficam preservadas. Se coincidirem com -20% por espécie, aplica-se só a penalidade maior (-50%), não ambas, evitando dano cair a 40% por dupla penalização.
- Efeitos do oponente também são elegíveis, sem vantagem apenas ao jogador.
- O estado climático é único e simétrico, dura 20 segundos simulados e termina sem persistência nos saves.
- Preservar: água -50% no sol, fogo -50% na chuva, Solar Beam -50% em chuva/areia/granizo, Thunder/precisão, imunidades e dano residual, recuperação, animações e cooldowns.
- Para evitar +80% não intencional, substituir o bônus climático Gen III de +50% Fogo no sol / Água na chuva pela regra alternativa solicitada de +20% **por espécie**. Explicar que é uma house rule.
- Movimentos de clima só podem ser equipados se os efeitos e os dados canônicos já estiverem integrados; não liberar outros golpes só para habilitar bônus.
- Original Arena/VS CPU sem torre2 não recebe novo dano.

## Evidências
Unidades cobrem os 4 climas, 6 tipos beneficiados, 0 para tipos não elegíveis, tipo duplo, duração, troca de clima, contrapenas, Solar Beam, ambas as equipes; teste no Chromium verifica ataque nativo e expiração. Nenhuma taxa real de vitória ou publicação pode ser declarada sem gate.
