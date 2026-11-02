# Pokémon Torre 2 — auditoria de desempenho (02/11/2026)

## Objetivo e critérios

**Alvo de produto:** 60 FPS (16,67 ms por quadro) em hardware compatível; em celulares mais fracos, manter 30 FPS estáveis (33,33 ms por quadro) sem travamentos de entrada em batalha. Esses números são metas, **não resultados atuais comprovados**. Não reduzir resolução nativa ou remover efeitos e sprites aprovados sem prova de gargalo e regressões.

## Gargalo identificado e correção

No Laboratório REA, o mesmo `Phaser.Graphics` desenhava a cada `update` todas as montanhas, chão, borda, linhas, vegetação, pedras e detalhes de fundo, e chamava `Phaser.Text.setText` a cada `update`. Nenhum desses elementos estáticos precisa ser recalculado.

A alteração está em `tools/pokearena/torre2-rea-vector-preview.js`:

1. Fundo de pixel art criado **uma única vez por instância de cena**, em um `Phaser.Graphics` separado que não recebe `clear` ou novas instruções de preenchimento durante a atualização.
2. Apenas os objetos móveis, alvo com impacto e partículas de contato usam o `Phaser.Graphics` dinâmico, que é limpo/redesenhado na atualização.
3. Texto principal atualizado **apenas quando muda o movimento ou o efeito de impacto**; metadados REA atualizados somente quando muda o modo. Sem atualização de textura de texto em todos os quadros.
4. O painel continua opcional e restrito ao Laboratório. A campanha original, IA, golpe, hitbox, dano, clima, inventário e saves não são modificados.
5. Teste de isolamento verifica **dois objetos Graphics** (um estático/um dinâmico), fundo com mais de 100 retângulos de pixel art, zero redesenho de fundo em 370 quadros e reaberturas, no máximo 15 atualizações do rótulo e 5 dos detalhes no período. Os testes matemáticos e de encerramento continuam aprovados.

## Medições reais de navegador, com limites

[Execução #41421905558](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/41421905558) — Chromium headless, WebGL através de **SwiftShader**, 1280×720, **a mesma batalha** em três intervalos de ~2,6 segundos (não três dispositivos nem A/B com binários distintos):

| Intervalo | Quadros observados | FPS medido | Intervalo mediano | p95 |
|---|---:|---:|---:|---:|
| Laboratório sem overlay REA | 25 | 9,55 | 100 ms | 183,3 ms |
| Mesmo combate com overlay REA ligado | 27 | 10,32 | 100 ms | 150 ms |
| Mesmo combate após fechar overlay | 36 | 13,85 | 66,7 ms | 100 ms |

A amostra com overlay foi aproximadamente 8% mais rápida do que a inicial, mas **não atribuir ganho causal**: os intervalos são curtos, sequenciais e o software renderer muda com aquecimento/caching. Isso **não prova ganho de 8% em produção**, nem comprova 30/60 FPS reais.

A execução confirma funcionalidade do painel, compilação, 3 impactos, 10 reaberturas em teste, proteção da interface, saída para a campanha e saves intocados. O resultado é compatível com o maior gargalo estar **fora do painel REA** neste ambiente, e não significa que o jogo público esteja em 9 FPS.

## Próximas gates antes da publicação

- Repetir medições A/B em **Chromium com GPU real** e preferencialmente Android real, usando a **mesma luta**, resolução e efeitos; coletar média, p50, p95 e travamentos de frame e entrada em batalha.
- Perfil CPU/GPU por subsistema no combate convencional e no mapa (clima/VFX/HUD/animação/troca/entrada); não aplicar desativação de golpes ou cortes visuais sem saber o custo.
- Aplicar as otimizações de **baixo risco**, como cache de elementos estáticos, invalidação por eventos e redução de alocações evitáveis, somente após confirmar o caminho quente.
- Reexecutar bateria de regressão de campanha, Arena, clima, capturas, saves, VS e controles mobile antes de mesclar.
- A PR [#459](https://github.com/lulualcides-sys/Pok-mon-torre-2/pull/459) é **draft**. Nenhuma alteração foi mesclada/publicada na `main`.

Não extrapolar o resultado do Laboratório para a campanha inteira.
