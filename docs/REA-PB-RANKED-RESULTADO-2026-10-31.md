# Resultado verificado do REA — PB Ranked — 31/10/2026

## Execução real

**GitHub Actions:** https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/41226497651 — `success`.

**Artefato de evidência:** https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/41226497651/artifacts/13050909538 — zip com `dom-public.json`, `landing-public.png`, `rea-inspect-web-page.json`, `rea-analyze-web-bundle.json`, `summary.json`. Retenção 7 dias.

**Resultado confirmado:** navegador Chrome descartável e Playwright conectados ao mesmo CDP; `rea inspect-web-page` concluído; `rea analyze-web-bundle` concluído; screenshot e DOM público coletados. Não foi feita autenticação, partida ou extração de sprites/código para redistribuição. Não há prova de gameplay real.

### Medidas do navegador REA

- Documento observado: `https://ranked.pokemonbattlegrounds.com/`, título `PB Ranked`.
- Inventário de DOM: **1.556 nós**.
- Acessibilidade: **451 nós**, texto não autorizado/preservado.
- Scripts: **12 identificados**, **11 analisados por AST** de forma completa na execução; análise global **parcial**, com um bundle atingindo limite de 30 segundos; **47.846 nós AST** visitados no total.
- Recursos observados: **102** na página pública. Esses caminhos são observações de metadados, não downloads de ativos para o Torre 2.
- DOM expõe 4 elementos canvas (resoluções HTML `1920×1080`, `300×150`, `480×270`, `300×150`); não significa quatro arenas renderizadas.
- Rede/WebSocket observados na janela curta: nenhum evento; eventos anteriores à conexão não foram capturados.
- A tela pública exibe botões de login com Discord e Google e um formulário de escolha de treinador. Os mecanismos de partida não foram executados.

### Inventário de 17 nomes de arenas no seletor público

1. Mt. Silver
2. Mt. Silver Summit
3. Battle Stadium
4. Steven's Cave
5. Champion Room
6. N's Castle
7. Lumiose City
8. Indigo Plateau
9. Cerulean Cave
10. Lumiose Conference
11. Aether Paradise
12. Aether Paradise Deck
13. Battle Tower
14. Unova League
15. Wyndon Stadium
16. Sootopolis Isle
17. Area Zero

Há ainda `Random arena` / `Random arenas`, que é uma opção de seleção aleatória, não uma 18ª arena. **Os 17 nomes foram identificados no DOM; os cenários e mapas internos não foram visualizados.**

### Inventário de comportamento apenas por nomes de arquivos servidos na página

- **Famílias de animação aparente `/baked2/{id}/`:** `Idle`, `Walk`, `Hop`, `Attack`, `SpAttack`, `Swing`, `Twirl`, `Charge`, `Shoot`, `Hurt`, `Sleep`, `RearUp`, `Double`, `Rotate`, `Slice`, `Cringe`.
- **Sistemas JS com nomes detectados:** `audio.js`, `abilities.js`, `controls.js`, `app.js`, `roster.js`, `backdrop.js`, `cosmetics.js`, `grid.js`, `ranks.js`, `achievements.js` e bundle de aplicação. Nome do módulo não comprova seu comportamento.
- **Exemplos de arquivos sob `/assets/fx/`:** referências com nomes `arceus`, `jirachi`, `dialga`, `palkia`, `calyrex-shadow`, `necrozma`, `hoopa-unbound`, `substitute`. **Não concluir que esses Pokémon/golpes estão jogáveis ou que seus VFX foram capturados.**
- **Treinadores:** menu exibiu Red, Blue, Ash, Cynthia, Steven, Iris, Dawn, Alain, entre outros. Há caminhos para imagens de treinadores e rostos no carregamento. A coreografia de arremesso e liberação não foi observada.

## Ações de engenharia com base na evidência

| O que verificamos | Aproveitamento seguro no Pokémon Torre 2 |
| --- | --- |
| Estrutura pública `Walk/Hop/Charge/Shoot/Hurt` | Definir máquina de estados *própria* para entrada, movimento, ataque e reação, avaliando lacunas no Phaser |
| 17 ambientes nomeados | Criar um catálogo de cenários próprios, começando pelas arenas que ampliem a campanha; não importar os tilemaps/arte |
| `abilities.js` e bundle grande | Usar REA só para identificar famílias e contratos públicos; sem redistribuir código proprietário |
| Botões AUTO/Dodge e regras publicadas | Prototipar controle híbrido: deslocamento/esquiva da IA com ataque controlado; preservar AUTO agressivo e HUD |
| Seletor de treinador e imagens de rosto | Comparar escala/tempo de entrada e preparar nova animação própria de arremesso **quando houver gravação de referência** |
| Categorias de golpe (raio, projétil, dash) | Reusar biblioteca aprovada do Torre, conferir colisão/dano no impacto e só produzir VFX adicionais necessários |

## Não verificado (não declarar concluído)

- Lista completa de golpes, spritesheets, arenas realmente renderizadas, câmera e colisões em partidas.
- Visual de Pokébola sendo lançada pelo treinador.
- Movimento real, timings/velocidade dos Pokémon, resposta da IA, efetividade visual e performance mobile.
- Se a licença do site permite reutilização de seus arquivos. **Nenhuma autorização de redistribuição foi apresentada para este terceiro.**

## Continuação sem sobrescrever o Script Mestre

A priorização detalhada e os contratos de preservação estão em [REA-PB-RANKED-2026-10-31.md](REA-PB-RANKED-2026-10-31.md). Quando existir acesso legítimo a uma sessão real ou vídeos de partida, a próxima auditoria deverá registrar sequência visível quadro a quadro. Não marcar a presente análise como auditoria completa de batalha.
