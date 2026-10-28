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
| **T01** | **VALIDADA — 14 vitórias naturais até Brock; Pages sucesso #40591672705** | Campanha normal até Brock: conferir PR #30, Rival após 12 vitórias, XP/HP, Centro, encontros sem limite e salvar (§18,20,31,34) | Conseguir chegar a Brock e vencê-lo no Phaser **sem vitórias forçadas**, com log/resultado da partida |
| **T02** | **VALIDADA EM CI — câmera/BAG e RUN desktop/mobile; Pages pendente** | FIGHT, POKÉMON, BAG, RUN e botões mobile nos modos Arena/campanha (§4) | Menus corretos e clicáveis no navegador desktop/mobile |
| T03 | **PARCIAL — 13 transições Arena, 69 limites de nível de Kanto e Ivysaur pós-vitória (fixtures sinalizadas)** | Tela preta, sprite, atributo, evolução e HUD (§5,6) | Todas as linhas evolutivas verificadas sem tela preta, nomes/níveis/sprites consistentes |
| T04 | **PARCIAL — limpeza segura de projéteis e KO integrada; multi-hit pendente** | Dano residual de projéteis, hitboxes, troca, K.O. e transições (§15,29) | Sem dano destinado ao alvo anterior, incluindo multi-impacto e troca rápida |
| T05 | **PARCIAL — backup estrutural e reload aprovados** | Save idempotente, backup, migração e restauração (§31) | Recarregar após batalha/captura/compra/evolução sem perda nem duplicação |
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

| 27/10/2026 | T02 / FIGHT, BAG e POKÉMON via touch no Android simulado | [PR #41](https://github.com/lulualcides-sys/Pok-mon-torre-2/pull/41) integrada em `f797b82`; teste + workflow, sem alterar jogo | [Actions #40592499809](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/40592499809) **sucesso**; FIGHT iniciou luta 6 sprites; BAG abriu/fechou sem consumo; slot de Squirtle funcionou, estoque/wins/stage preservados | [Pages do marco T01 #40591672705](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/40591672705) **sucesso**; Pages de `f797b82` ainda não confirmado | **T02 PARCIAL**: estender para desktop/campanha, paginação de golpes e RUN onde aplicável. Nada a refazer nos 3 controles já testados |

| 27/10/2026 | T03 / regressão inicial de evolução Magikarp→Gyarados | [PR #44](https://github.com/lulualcides-sys/Pok-mon-torre-2/pull/44) integrada em `9a0dc61`; teste/CI apenas | [Actions #40595592409](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/40595592409) **sucesso**: combate ativo, PMD Gyarados `pmd-0130-Idle`, quadro 72×128, canvas WebGL 1280×720, golpes por toque após evolução | Publicação pós-merge não confirmada nesta consulta | **T03 PARCIAL:** expandir cobertura para outras evoluções e campanha; T02 RUN/desktop ainda sob PR #43 com CI recente falhando; não sobrescrever |

| 27/10/2026 | T03 / 3 linhas iniciais de Kanto na Arena | [PR #46](https://github.com/lulualcides-sys/Pok-mon-torre-2/pull/46) integrada `db8baf0`; somente teste + CI | [Actions #40596220909](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/40596220909) **sucesso**: Bulbasaur→Ivysaur PMD #0002; Charmander→Charmeleon #0005; Squirtle→Wartortle #0008; sprites/frames visíveis e quatro golpes presentes sem placeholders | CI pós-merge/Pages ainda não confirmados nesta atualização; nenhum código do jogo modificado | T03 parcial: quatro evoluções distintas validadas somando Gyarados, faltam outras linhas e progressão natural. T02 PR #43 continua independente e depende de CI aprovado |

| 27/10/2026 | T02 / RUN selvagem em branch limpa | [PR #48](https://github.com/lulualcides-sys/Pok-mon-torre-2/pull/48) rascunho; [PR #43](https://github.com/lulualcides-sys/Pok-mon-torre-2/pull/43) experimental fechada sem merge | [CI #40596836115](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/40596836115): checks, build e teste real desktop/mobile **passaram** (RUN selvagem sem prêmio, BAG/POKÉMON desktop e FIGHT mobile); **suite browser oficial em execução na última verificação** | **NÃO PUBLICADO**: ainda falta completar CI, aprovação e merge da PR #48 | Não misturar experimentos da Bolsa com RUN. Antídoto em batalha é pendência isolada T02; preservar T03 concorrente |

| 27/10/2026 | T02 / RUN selvagem integrado com testes reais | [PR #48](https://github.com/lulualcides-sys/Pok-mon-torre-2/pull/48) integrada em `0f726b9` | [CI #40596836115](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/40596836115) **totalmente aprovado**: checks, suite unitária, build, cliques RUN/BAG/troca desktop, FIGHT mobile e `npm run test:browser` oficial | [CI pós-merge #40597754055](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/40597754055) e Pages do novo SHA **ainda não verificados** nesta consulta | T02 permanece parcial: antídoto em batalha/câmera e demais casos de menu; próximo escopo independente sem prejudicar T03–T05 concorrentes |

| 27/10/2026 | T05 / recuperar backup e T02 / RUN touch | [PR #49](https://github.com/lulualcides-sys/Pok-mon-torre-2/pull/49) `74c7aaa`; [PR #52](https://github.com/lulualcides-sys/Pok-mon-torre-2/pull/52) `2eaa330`; [PR #53](https://github.com/lulualcides-sys/Pok-mon-torre-2/pull/53) draft | T05 [#40597965984](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/40597965984) sucesso, T02 mobile [#40598192704](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/40598192704) sucesso | T05 [Pages #40598347863](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/40598347863) sucesso; T02 Pages ainda pendente no registro | T02 parcial: antídoto/câmera; T05 parcial: restante dos eventos save; T03/T04 próximos independentes |

| 27/10/2026 | T02 Bolsa/câmera e T04 fronteira | [PR #53](https://github.com/lulualcides-sys/Pok-mon-torre-2/pull/53) integrada 81e2969; [PR #57](https://github.com/lulualcides-sys/Pok-mon-torre-2/pull/57) draft | [CI #40600983129](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/40600983129) aprovado completo; [main #40602048321](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/40602048321) aprovado; T04 CI rodando | [Pages #40602087786](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/40602087786) aguardando conclusão | T02 validada em CI para fluxos cobertos; T04 parcial, suite completa/merge pendentes |

| 27/10/2026 | T03 / 3 linhas evolutivas completas | [PR #59](https://github.com/lulualcides-sys/Pok-mon-torre-2/pull/59) integrada 4eaf476 | [CI #40602575454](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/40602575454) sucesso: Venusaur, Charizard, Blastoise com PMD visível e 4 slots, duas evoluções cada | T02 Pages #40602087786 sucesso; T03 Pages pós-merge ainda pendente | T03 parcial: natural campanha, outras linhas; T04 PR57 aguardando suite total |

| 27/10/2026 | T04 / efeitos duplicados na troca e KO | [PR #57](https://github.com/lulualcides-sys/Pok-mon-torre-2/pull/57) merge 9083fec | [CI #40601951402](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/40601951402) completo aprovado: unitário, switch Chromium e browser oficial | CI main / Pages de T04 ainda em validação no registro | T04 parcial; faltam golpes multi-hit reais em batalha e outras situações de KO |

**Ao terminar um pacote:** alterar o estado específico desta tabela, acrescentar linha ao registro e manter links para CI e para a versão pública. No próximo `continue`, escolher o primeiro não validado e não bloqueado; consultar o estado real mais recente antes de agir.


## T03 — seis evoluções adicionais de espécies selvagens (27/10/2026)

- [PR #62](https://github.com/lulualcides-sys/Pok-mon-torre-2/pull/62), branch isolada sem alterações no runtime: novo teste Chromium/WebGL de Pidgey→Pidgeotto→Pidgeot, Caterpie→Metapod→Butterfree e Weedle→Kakuna→Beedrill.
- [Actions #40604186040, tentativa 2](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/40604186040): **sucesso**; `npm test`, sintaxe, `check`, `check:reuse`, build Phaser e **seis transições nativas** passaram; sprites PMD, textura carregada, renderização WebGL, identidade e golpes verificáveis. A primeira tentativa da mesma execução falhou no download transitório de assets e foi repetida com êxito.
- Metapod e Kakuna mantêm apenas três golpes disponíveis e ULT bloqueada; Butterfree e Beedrill exibem os quatro golpes após evoluir. Não enfraquecer nem destravar precocemente a progressão prevista.
- **T03 continua PARCIAL**: estes são testes de EVO no modo Arena com EXP preparada em fixture, **não** provas de evolução natural após combate da campanha; faltam outras linhagens, saves de evolução e a confirmação de Pages pós-merge. No total, 13 transições verificadas somando os testes anteriores.

| 27/10/2026 | T05 / checkpoints persistentes de eventos | [PR #63](https://github.com/lulualcides-sys/Pok-mon-torre-2/pull/63) integrada por squash em `ae2be47b785e4d68abe0910618ff3685d8a7c926`; base já continha PR #62 de T03 | [CI #40604422947](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/40604422947) **sucesso**: npm check/test, check:reuse, build Phaser, checkpoints de compra, encontro/captura, vitória/derrota, evolução pós-batalha, PC e recompensa de Brock; Chromium/WebGL com reload após captura e vitória, backup e suite `npm run test:browser` | [CI main #40605087607](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/40605087607) **sucesso**; [Pages #40605125735](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/40605125735) **sucesso** para HEAD documental `132641f2`, com verificação HTTP do site público servindo build `src-1e196ed3a9` | **T05 PARCIAL**: eventos cobertos por testes isolados e fixtures; não comprovam campanha natural nem todas as combinações de save. T03 foi trabalhada em paralelo na PR #62, sem colisão de arquivos. |


## T03 — extensão natural de nível 16 em execução (27/10/2026)

- [PR #64](https://github.com/lulualcides-sys/Pok-mon-torre-2/pull/64) **ABERTA, em validação**: extensão do teste natural até Brock e além, usando AUTO real sem forçar vitória/XP/HP ou evolução. Exige Bulbasaur→Ivysaur somente após vencer com nível 16, preservação de UID/save, reload e sprite PMD no combate seguinte.
- [Workflow #40605870480](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/40605870480): **em execução na última consulta**; não marcar T03 validada nem alterar o critério de fechamento até confirmar log, CI e merge. A branch só altera teste e workflow, não motor/VFX.
- Pages [#40605125735](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/40605125735) finalizou com sucesso no commit `132641f2d01193fe5bb154375d8ebf3fc4876348` (T03 anterior e T05); **isso não publica a PR #64**.
- Próximo agente: consultar primeiro a PR #64 e workflow; investigar eventual falha por logs/artefatos, sem criar outro teste idêntico. Se passar, integrar com HEAD atual e verificar novo Pages; atualizar T03 e §5–6 apenas com evidências reais.


## T03 — vitória real com checkpoint pré-preparado (28/10/2026 UTC)

- [PR #64](https://github.com/lulualcides-sys/Pok-mon-torre-2/pull/64) **integrada** em `7eb2112f8c84d84af46cb4489a4758881606db61`. Código do motor, sprites, golpes, saves e IA **não alterados**; teste `tests/t03-focused-natural-ivysaur-browser.cjs` + workflow.
- [CI T03 #40607000250](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/40607000250) **sucesso**: 169 testes unitários, `check`, `check:reuse`, build, prova Chromium/WebGL da evolução e 14 smoke tests oficiais de navegador. [CI da `main` #40607960008](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/40607960008) **sucesso**.
- **Evidência exata:** campanha em fixture de Cerulean, etapa 1/treinador 4, Bulbasaur nível 15 com 1 EXP faltando para nível 16 e Squirtle nível 20 de apoio. A luta **real, sem injeção de resultado/HP/XP durante o combate**, derrotou Sandshrew nível 15; Bulbasaur permaneceu Bulbasaur em 256 observações do combate e evoluiu após a vitória para Ivysaur nível 16; o UID e save sobreviveram ao reload. Próxima luta abriu sprite `pmd-0002-Idle` com quatro golpes e frame 32×32. Wartortle também evoluiu após a luta. Esta preparação **não comprova progressão natural desde Brock**.
- A execução anterior [#40605870480](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/40605870480) terminou com derrota real na sexta luta, antes da evolução; **não comprovou bug de evolução**. O teste longo opcional segue sem validação.
- **T03 ainda PARCIAL:** 13 transições de Arena + 1 evolução pós-batalha em cenário preparado; faltam jornadas inteiramente naturais, outras espécies, saves e verificações visuais. Pages após integração **a confirmar separadamente**; não confundir CI aprovado com publicação.


## Confirmação de publicação T03 — 28/10/2026 UTC

- [GitHub Pages #40607987285](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/40607987285) **sucesso** no commit `7eb2112f8c84d84af46cb4489a4758881606db61` que integra [PR #64](https://github.com/lulualcides-sys/Pok-mon-torre-2/pull/64). [CI da main #40607960008](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/40607960008) também **sucesso**. O merge documental [PR #66](https://github.com/lulualcides-sys/Pok-mon-torre-2/pull/66) não altera o runtime publicado.
- **Limite de verificação:** a abertura direta do site público/arquivo `arena2d/version.json` não foi possível nesta execução; sucesso do workflow atesta deployment, mas não a conferência humana visual externa do jogo. T03 segue **PARCIAL** até validar outras linhagens e progressão sem fixture.


## T03 — Slowpoke→Slowbro e matriz de 69 transições (28/10/2026 UTC)

- [PR #68](https://github.com/lulualcides-sys/Pok-mon-torre-2/pull/68) **integrada** no commit `4b02d51614945cbf0d5b9d0207af90e6dbcf7877`. A versão anterior deixava Slowpoke Lv37 com evolução pendente na campanha por oferecer Slowbro/Slowking sem escolha automática. Correção **de uma única seleção Kanto**: `slowpoke:'slowbro'` ao lado de Gloom/Vileplume e Poliwhirl/Poliwrath no `torre2-campaign-core.js`. Motor genérico, visuais e golpes aprovados inalterados.
- [CI focado #40609591781](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/40609591781): **SUCESSO**. `node --test tests/t03-kanto-evolution-boundaries-built.test.mjs` auditou **69 evoluções lineares** declaradas no Kanto: limite de nível, nenhuma evolução após derrota, evolução pós-vitória simulada no resolvedor, UID/apelido/TM preservados, slots obsoletos limpos, save sem duplicar/reverter e repetição bloqueada. `npm test`: **169 aprovados, 0 falhas**; `npm run check`, `check:reuse`, build Phaser e `npm run test:browser` (14 verificações) aprovaram. [CI inicial #40609421151](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/40609421151) reproduziu precisamente o erro Slowpoke; a segunda execução validou a correção.
- **Limitação obrigatória:** as 69 transições são **fixtures do resolvedor do build**, não 69 evoluções vistas jogando no Phaser nem vitórias naturais da campanha. O caso Eevee (três opções) foi excluído da matriz linear deliberadamente e precisa de escolha explícita/validação futura; não escolher um ramo aleatório. T03 **continua PARCIAL**, faltam inspeção visual generalizada, modos variados, evolução por partidas naturais e ramificações.
- O CI da `main` e o GitHub Pages posteriores ao merge **devem ser verificados separadamente**. Nenhuma conclusão de publicação é inferida do CI da PR.


### T03 — publicação do patch Slowbro confirmada (28/10/2026 UTC)

- [CI da `main` #40610461674](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/40610461674) **sucesso** no commit `4b02d51614945cbf0d5b9d0207af90e6dbcf7877` da [PR #68](https://github.com/lulualcides-sys/Pok-mon-torre-2/pull/68); [GitHub Pages #40610493854](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/40610493854) **concluído com sucesso** no mesmo SHA.
- O HEAD documental `74fc278e3958f334ae9ea77dd3c1960b1b1b0732` é descendente direto daquele build, diferindo somente em `docs/FILA-CONTINUE-SCRIPT-MESTRE.md` e `docs/CONTROLE-EXECUCAO-SCRIPT-MESTRE.md` (comparação GitHub confirmada). A correção de Slowpoke está, portanto, no artefato publicado pelo pipeline. **Acesso visual externo ao site permanece não verificado**; não confundir deploy bem-sucedido com teste visual das 69 espécies.
- T03 e §5/§6 permanecem **PARCIAIS**, com Eevee ramificado, evoluções visuais no Phaser e campanhas sem fixtures ainda pendentes.
