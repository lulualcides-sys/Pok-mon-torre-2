# Pokémon Torre 2 — Mud-Slap, Seed Bomb e Super Fang

## Escopo
Lote novo e isolado solicitado em 21/10/2026. Não altera os 17 golpes específicos aprovados, o cliente original Poké Arena, o logo nem o menu **Pokémon Torre** (já aprovados). Mantém o padrão pixel art com contorno escuro, pequenos fragmentos, colisão física, dano no contato e sem Canvas 2D.

## Implementação
Arquivo novo: `tools/pokearena/torre2-adapted-moves-fx.js`. Importado por `torre2-signature-fx.js`, distribuído por `build-preview.mjs` com nova assinatura de cache por revisão e registrado em `torre2-move-pool.js`, Mewtwo de testes e lista de espécies elegíveis.

| Golpe | Base de comportamento/arte reaproveitada | Diferencial | Mecânica real |
| --- | --- | --- | --- |
| Mud-Slap | Movimento de tiro de lama tipo Sludge Bomb simplificado | Pequena bolota sombreada em marrom e respingos de barro de poucos pixels | Um impacto se acertar a mira; após causar dano reduz temporariamente a precisão da mira do rival por 3,7 s (pilha até 3), apenas na campanha solo |
| Seed Bomb | Bullet Seed + fratura/fragmentos de Egg Bomb | Uma única semente verde maior, estilhaçando seis lascas | Uma colisão e um dano de planta, nenhum dano fora da trajetória |
| Super Fang | **Cópia das matrizes aprovadas de Hyper Fang** em módulo separado | Boca abre/fecha, incisivos brancos destacados, faíscas pequenas | Mordida de contato com alcance curto. Dano fixo de **metade do HP atual**, arredondado para baixo, bloqueada por invulnerabilidade e imunidade Ghost |

A correção da precisão do Mud-Slap está numa intervenção mínima em `luchador.js` durante a compilação, somente se `this.escena.datos?.torre2` e se a vítima estiver realmente com `est.torre2MudAccuracy`. Não muda a mecânica dos golpes originais fora desse efeito.

## Critérios de aprovação
- Renderizar matriz pixelada em cada quadro, **sem desenhar nada invisível**.
- Testar que usuário pode errar mire fora do alvo e que o rival pode se desviar.
- O bloqueio físico não causa dano nem penalidade de precisão.
- Nenhum dos três golpes é considerado **visualmente aprovado** antes de avaliação do usuário.
- Menu aprovado e todo golpe previamente aprovado permanecem congelados.
- Página pública precisa confirmar presença dos três arquivos por verificação automática.

Referência de mecânica para Mud-Slap: https://pokemondb.net/move/mud-slap
