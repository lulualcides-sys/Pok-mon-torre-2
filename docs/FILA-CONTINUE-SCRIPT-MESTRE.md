# FILA DE CONTINUIDADE — Pokémon Torre 2

**Controle operacional para o comando `continue`**  
Atualização de referência: 27/10/2026, base `a5961ceef11b28a35b76600ab6e545abe0e92e1f`. A fila é **reavaliada** a cada execução porque outros agentes podem alterar a `main`.

Referências obrigatórias: [Script Mestre integral](./SCRIPT-MESTRE-DEFINITIVO-2026-10-27.md), [Controle das 37 seções](./CONTROLE-EXECUCAO-SCRIPT-MESTRE.md), [AGENTS.md](../AGENTS.md) e [Guia rápido](./GUIA-RAPIDO-REPOSITORIO.md).

## Contrato para o comando `continue`

1. **Não fazer perguntas de rotina nem recomeçar pelo patch 1.** `Continue` significa: abrir esta fila, inspecionar a `main`/commits/PRs atuais, selecionar o **primeiro trabalho não encerrado** sem colisão com outro agente e executar implementações/testes reais autorizados do Script Mestre.
2. Cada item começa como **PENDENTE DE FECHAMENTO**, mesmo que tenha componentes já implementados. Antes de escrever código, auditar o que existe e **marcar como VALIDADO** se os critérios já forem comprovados; não refazer por rotina.
3. Um item só fica **VALIDADO** com evidência da implementação, testes aplicáveis, integração e verificação no navegador. Sem execução, registrar **PARCIAL**, **BLOQUEADO** ou **NÃO VERIFICADO**, com motivo e próxima ação. `Concluído` nunca significa apenas que um arquivo existe.
4. **Trabalho simultâneo:** as PRs #30 (Brock/progressão natural), #16 (Toxic) e #17 (Shiny) estavam abertas na data de referência. Conferir novamente. Não alterar escopos concorrentes nem sobrescrever commits; preferir revisão, validação ou outra tarefa independente. Criar branch isolada, commits pequenos e PR com diff auditável.
5. **Preservação:** não modificar golpes, sprites e controles já aprovados, nem o padrão do cliente Poké Arena 2D; nenhuma substituição estética não aprovada. Saves e progresso do jogador não podem ser resetados. Obedecer à política integral de golpes quando aplicável.
6. **Ciclo de cada `continue`:** escolher fila → verificar arquivos relevantes → corrigir → testes focados → suite aplicável + build + navegador + CI → merge seguro → GitHub Pages → abrir jogo publicado e checar SHA/comportamento → atualizar **esta fila** e [controle das 37 seções](./CONTROLE-EXECUCAO-SCRIPT-MESTRE.md) com **commit, links, resultado e pendências**. Se não concluir todos os passos, distinguir claramente.
7. Se um item estiver bloqueado, **registrar bloqueio e escolher o seguinte independente**, sem pular regressões críticas; retornar ao bloqueado assim que destravado. Não alegar execução futura ou publicação que ainda não ocorreu.
8. A numeração **T01–T31 é uma divisão operacional proposta**, não a contagem original do Script Mestre (37 seções, 10 fases). Os 31 itens não significam 31 patches implementados; podem envolver múltiplos commits ou ser validados sem alterações.

## Já implementado / histórico que não deve ser refeito sem motivo

- Captura automática no alvo e cálculo de captura FRLG de 151 espécies, quatro verificações, consumo de Pokébola e equipe/PC — [relatório anterior](./PATCH-MESTRE-2026-10-24.md). A animação integral e cobertura de novas transições ainda precisam de auditoria.
- Parte da tabela Gen III, status, IA de troca, poções limitadas, quatro climas e laboratório Mewtwo 50 — implementação/testes anteriores com lacunas.
- Pokédex, TMs de sete líderes, rematches condicionais, menu de insígnias e sprites de insígnias, Center e BAG de batalha. Toxic do líder Koga segue PR própria.
- Botão AUTO e velocidade alinhada à Arena `35bbd8f`; relatório pós-batalha `c8223fc`; Salão da Fama `6f85d1d`; BAG em batalha `e77bd4f`; cura `2a44839`.
- Correções recentes: derrota duplicada ao voltar do Center `10da46d`; encontros de grama sem limite artificial `c705d0b`; testes de oito batalhas naturais `e992105`.
- **Não estão comprovados** como inteiramente jogados e aprovados os 13 chefes até Campeão: parte foi percorrida por depuração/fixtures e não em campanha natural.

## Fila única e obrigatória, na ordem de prioridade

A coluna "fechar quando" é o critério objetivo. Os números são fixos para manter continuidade entre chats.

| ID | Situação inicial | Escopo / seções do Mestre | Fechar quando |
|---|---|---|---|
| **T01** | **VALIDADA — 14 vitórias naturais até Brock; Pages pós-merge a conferir** | Campanha normal até Brock: conferir PR #30, Rival após 12 vitórias, XP/HP, Centro, encontros sem limite e salvar (§18,20,31,34) | Conseguir chegar a Brock e vencê-lo no Phaser **sem vitórias forçadas**, com log/resultado da partida |
| **T02** | **PRÓXIMO — PARCIAL** | FIGHT, POKÉMON, BAG, RUN e botões mobile nos modos Arena/campanha (§4) | Menus corretos e clicáveis no navegador desktop/mobile |
| T03 | PARCIAL | Tela preta, sprite, atributo, evolução e HUD (§5,6) | Todas as linhas evolutivas verificadas sem tela preta, nomes/níveis/sprites consistentes |
| T04 | PARCIAL | Dano residual de projéteis, hitboxes, troca, K.O. e transições (§15,29) | Sem dano destinado ao alvo anterior, incluindo multi-impacto e troca rápida |
| T05 | PARCIAL | Save idempotente, backup, migração e restauração (§31) | Recarregar após batalha/captura/compra/evolução sem perda nem duplicação |
| T06 | PARCIAL | Captura e fórmula Gen III, inventário, probabilidade, raios e balanços (§2,3) | Captura/fuga naturais sem mira, consumo correto e animação completa mobile/desktop |
| T07 | PARCIAL | Learnsets FRLG dos 151, TMs, evoluções e dados únicos na Pokédex/Sumário (§7) | 151 espécies coerentes nos modos aplicáveis, sem golpes ilegais ou ausentes |
| T08 | PARCIAL | Iniciais Lv5 com 3 golpes equilibrados, ULT Lv8, evoluções sem apagar golpes (§8) | Todos os novos iniciais e capturados respeitam o desbloqueio e o save |
| T09 | PARCIAL | Cooldowns (inclusive os golpes específicos pedidos), velocidade e recargas simétricas (§11,19) | Cooldowns mensurados em campo, sem ataques infinitos e sem perder dinâmica |
| T10 | PARCIAL | AUTO de batalha e movimento Arena/campanha/CPU (§11,19) | AUTO liga/desliga, não fere cooldowns nem muda movimentos nativos aprovados |
| T11 | PARCIAL | 17 tipos Gen III, imunidades, STAB, crítico, fórmula e físico/especial (§9) | Testes matemáticos e dano real coerente no Phaser |
| T12 | PARCIAL | Escolha de ataques e troca estratégica dos treinadores (§11,12) | IA sem loop, sem informação futura e com decisões coerentes em batalha |
| T13 | **PR #16** | Toxic de Koga, poison/burn, VFX e persistência (§10,22) | PR auditada, integração segura, imunidades e testes de Toxic reais |
| T14 | PARCIAL | Sono, paralisia, congelamento, confusão e remédios em batalha (§10,23) | Status/timers persistem corretamente nas trocas e são curáveis sem duplicações |
| T15 | PARCIAL | Sol, chuva, areia, granizo e interações de movimentos (§14) | Quatro estados, expiração, precisão/recuperação e danos testados |
| T16 | PARCIAL | VFX globais de clima e status em pixel art (§10,14) | Animações proporcionais no WebGL e desempenho mobile, sem alterar efeitos aprovados |
| T17 | **PR #17** | Shiny 1%, sprites, evolução, Pokédex/PC/save (§16) | PR auditada, persistência real e sprites/estrelas exibidos corretamente |
| T18 | PARCIAL | Identidade de 151 Pokémon nas trocas, retratos, evoluções, diferentes modos (§6,7,16) | Amostragem de todas as espécies/modos com cobertura automática e visual das formas |
| T19 | PARCIAL | Campanha natural de Misty a Giovanni, rotas, equipes, insígnias, TMs (§20,24,34) | Oito insígnias obtidas por partidas jogadas normalmente, com saves |
| T20 | PARCIAL | Elite Four e Campeão, final, Hall of Fame (§20,24,34) | Vitória normal sequencial na Liga, sem fixtures de progresso |
| T21 | PARCIAL | Níveis, XP compartilhado, dano, HP e duração de batalhas (§19) | Comparação por fases e combate desafiador, sem vantagens artificiais |
| T22 | PARCIAL | Revanches, recargas de desafios e economia anti-exploit (§17) | Revanches sem duplicar eventos, insígnias, TMs ou farm instantâneo |
| T23 | PARCIAL | Loja, preços, TM, compatibilidade e remédios (§22) | Compras, uso, persistência e bloqueios regionais conferidos |
| T24 | PARCIAL | Mapa, cidades, rotas e áreas clicáveis (§21) | Todos os lugares levam a telas funcionais e progressão correta |
| T25 | PARCIAL | Mochila, PC, Pokémon Center, Sumário, Pokédex e Treinamento (§18,23) | Funciona em mobile/desktop, sem duplicar criaturas, itens ou saves |
| T26 | PARCIAL | Apresentação dos líderes, oito insígnias com sprites, recompensas únicas (§24,25) | 8 apresentações, 8 badges e suas TMs corretas em partidas reais |
| T27 | PARCIAL | Relatório de batalha, K.O., lançamento/recolhimento (§26,27,29) | Transições, resultados, valores e animações sem regressões |
| T28 | **NÃO AUDITADO** | Sons, música, volumes e mute persistente com licença (§28) | Áudio adequado e licenciado sem vazamentos, duplicações ou travamentos |
| T29 | PARCIAL | Laboratório isolado: 151, Mewtwo 50, captura, clima, Shiny, IA (§30) | Ferramentas completas; resultados nunca alteram o save principal |
| T30 | **PENDENTE** | Grande otimização + patch final de design em pixel art (§21,23,32 + decisão posterior) | Melhorar layout/legibilidade/performance 60 FPS alvo sem modificar sprites e ataques aprovados |
| T31 | **PENDENTE** | Regressão integral, 30 verificações, campanha até Campeão, CI/Pages (§33–37) | Provas em navegador real, build, CI, SHA implantado, links e pendências finais |

### Regras de ordenação

- **T01 é o próximo trabalho a fechar.** Correções urgentes de estabilidade podem ser antecipadas se bloquearem T01; registrar exatamente essa mudança.
- T02–T06 corrigem estabilidade; T07–T12 combate; T13–T17 status/clima/Shiny; T18–T20 conteúdo da campanha; T21–T26 economia/menus; T27–T30 polimento e visual; T31 aceitação final. Regressão e CI ocorrem **durante todo o processo**, não somente em T31.
- Interdependências permitem trabalhar em outro item não conflitante enquanto aguardam revisão de PR; **não integrar PR não validada**.
- Dentro de cada pacote, procurar problemas conhecidos, preservar regressões existentes e evitar criar funcionalidades duplicadas. Manter o controle das 37 seções sincronizado.

## Registro das execuções

| Data | Item | Base / PR / commit | Testes e navegador | Pages SHA | Estado e próximo passo |
|---|---|---|---|---|---|
| 27/10/2026 | Inicialização da fila (documentação) | `a5961ceef` | Nenhum teste de jogabilidade nesta ação documental | Não verificado para esta documentação | T01 primeiro; PR #30 aberta na inspeção; 31 pacotes são planejamento, não patches já implementados |

| 27/10/2026 | T01 / auditoria do limite Victory Road–Lorelei | `main` `2437020`; correção [PR #36](https://github.com/lulualcides-sys/Pok-mon-torre-2/pull/36), commit `564cf31` | Sintaxe, npm test, check/reuse, build Phaser e regressão específica aprovados em [run 40577322862](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/40577322862); suíte geral de navegador ainda em execução na última consulta | NÃO VERIFICADO — PR ainda não integrada | Corrigir apenas grama na câmara Lorelei sem bloquear a Victory Road; T01 continua aberta: equipe natural, Rival #13 e Brock (PR #30) |

| 27/10/2026 | T01 / fechamento correção Lorelei e teste equipe natural | [PR #36](https://github.com/lulualcides-sys/Pok-mon-torre-2/pull/36) integrada `774b8b6`; [PR #38](https://github.com/lulualcides-sys/Pok-mon-torre-2/pull/38) aberta em draft | [CI #40577322862](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/40577322862) e [CI integrado #40578446714](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/40578446714) aprovados; [PR #38 CI #40579140270](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/40579140270) em andamento no registro | [Pages #40578491197](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/40578491197): sucesso, site público não verificado diretamente | T01 parcial: aguardar/verificar teste real com capturas; derrotar Rival #13 e Brock sem resultados forçados |

| 27/10/2026 | T01 / Brock vencido em campanha natural | [PR #38](https://github.com/lulualcides-sys/Pok-mon-torre-2/pull/38) integrada `76783d9` | [CI real #40579140270](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/40579140270) **sucesso**: 12 treinadores, compras e 2 capturas RNG reais, Rival #13 e Brock, 14 vitórias/0 derrotas, stage 1, insígnia Rocha + TM39; [CI pós-merge #40591596826](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/40591596826) aprovado | [Pages #40591672705](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/40591672705) ainda executando na consulta; jogo público não conferido visualmente | **T01 validada em Phaser CI**, não significa campanha inteira concluída. Próximo T02: FIGHT/POKÉMON/BAG/RUN desktop + mobile |

**Ao terminar um pacote:** alterar o estado específico desta tabela, acrescentar linha ao registro e manter links para CI e para a versão pública. No próximo `continue`, escolher o primeiro não validado e não bloqueado; consultar o estado real mais recente antes de agir.
