# Controle de execução — Script Mestre Definitivo (Pokémon Torre 2)

**Atualizado em:** 27/10/2026. **Base inspecionada:** `main` @ `c705d0b84f0d85cf3a4e59d8fa0fc4b75aec964c`.  
**Especificação integral e imutável de referência:** [SCRIPT-MESTRE-DEFINITIVO-2026-10-27.md](./SCRIPT-MESTRE-DEFINITIVO-2026-10-27.md) (37 seções numeradas e 10 fases de execução — **não** 37 patches concluídos).  
**Histórico técnico precedente:** [PATCH-MESTRE-2026-10-24.md](./PATCH-MESTRE-2026-10-24.md). **Regras dos agentes:** [AGENTS.md](../AGENTS.md).

## Como interpretar este controle

- **Histórico validado:** existe relato com testes/commits anteriores; a funcionalidade **não foi reexecutada nesta atualização documental**.
- **Parcial:** parte do escopo foi codificada, mas ainda faltam integrações, casos, visual, regressões ou validação real.
- **Em PR:** alteração não integrada no `main` de referência.
- **Pendente / não auditado:** falta implementação demonstrada ou evidência suficiente. **Não presumir que está ausente do código** sem inspecionar o módulo.
- Cada atualização de linha deve citar **commit/PR**, **comando e resultado de teste**, **navegador e ambiente**, além da **pendência remanescente**. Não marcar “concluído” por haver um arquivo, teste com fixture ou passagem por 13 chefes em modo de depuração.
- Não alterar/apagar aprovações anteriores, saves ou código em andamento de outra branch. Revalidar HEAD e PRs antes de mexer em `main`.
- O Script Mestre mais recente explicita as frentes autorizadas; diante de conflito com o roadmap histórico de 21/10, preservar golpes/cliente aprovados e aplicar o novo escopo **apenas nas áreas solicitadas**, sem reorganização indiscriminada.

## Quadro por seção (evidências até o HEAD acima)

| § | Subsistema | Estado | Já identificado em histórico/commits | O que ainda exige trabalho/verificação |
|---|---|---|---|---|
| 1 | Missão e preparação | Parcial | `AGENTS.md`, índice de código, branches e backups anteriores | Revisar conflitos e HEAD a cada lote; evidenciar a versão realmente publicada |
| 2 | Captura sem mira e animação | Parcial | Lançamento automático, menu e consumo/captura descritos no patch mestre | Inspecionar todas as etapas visuais e captura em fluxo natural/celular |
| 3 | Fórmula original FRLG | Histórico validado | Taxas das 151 espécies, arredondamentos e quatro verificações registrados com testes no patch mestre | Regressão da integração mais recente, inclusive RNG natural e saves |
| 4 | FIGHT da Arena | **Parcial** (FIGHT/BAG/POKÉMON desktop-mobile, RUN selvagem integrado) | [PR #48](https://github.com/lulualcides-sys/Pok-mon-torre-2/pull/48) merged `0f726b9`, [CI #40596836115](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/40596836115) **sucesso completo**; [CI mobile anterior #40592499809](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/40592499809) | Antídoto em batalha e posicionamento do menu com câmera móvel exigem patch próprio; conferir Pages e testes em outros modos antes de encerrar T02 |
| 5 | Tela preta após evoluir | Parcial — mais 3 famílias testadas | Além do histórico e de Gyarados, [PR #46](https://github.com/lulualcides-sys/Pok-mon-torre-2/pull/46) + [CI #40596220909](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/40596220909) testaram Ivysaur, Charmeleon e Wartortle com textura e frames reais | Cobertura restante, campanha natural, transições e Pages público |
| 6 | Identidade dos sprites | Parcial | PMD #0002 Ivysaur, #0005 Charmeleon, #0008 Wartortle e #0130 Gyarados identificados em Arena após EVO, comprovados [CI #40596220909](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/40596220909) e [#40595592409](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/40595592409) | Conferir HUD, atributos, todas as espécies/formas/trocas e jogo público |
| 7 | Learnsets dos 151 | Parcial | Fonte de learnsets FRLG e resolução da Pokédex já relatadas | Auditar 151 espécies nos modos, evolução, golpes exclusivos e compatibilidade de TMs |
| 8 | 4 golpes e ULT nível 8 | Parcial | Bloqueio da campanha nível 5 / ULT nível 8 já integra `AGENTS.md`; regressões citadas | Validar novos iniciais, todos os modos, evolução, save e nenhuma ULT forte antecipada |
| 9 | Tipos/STAB/crítico | Parcial | Tabela de 17 tipos e testes de combinações, STAB e burn | Fórmula final de dano e classes físico/especial com testes de jogabilidade |
| 10 | Status e Toxic | Parcial + PR | Regras base documentadas; [PR #16](https://github.com/lulualcides-sys/Pok-mon-torre-2/pull/16) do Toxic ainda aberto | Auditar VFX, timeouts, cura em batalha, Toxic e todas as transições |
| 11 | Cooldowns e IA de ataque | Parcial | Restrições descritas e correções específicas de movimentos no histórico | Auditoria por espécie/golpe dos cooldowns de ambos os lados |
| 12 | IA de troca estratégica | Parcial | Política de troca limitada para líderes e chefes no patch mestre | Partidas reais, transições, múltiplas reservas e compatibilidade mobile |
| 13 | Poções de treinadores | Parcial | Inventário por etapa, limiar de HP, atraso e intervalo relatados | Sprites/partículas e teste natural por cada líder/Elite Four |
| 14 | Clima | Parcial | Sol/chuva/areia/granizo com duração, multiplicadores e laboratório relatados | Efeitos de pixel art globais, movimentos ainda não ligados e precisão/recuperação |
| 15 | Dano residual na troca | Parcial | Limpeza de projéteis/timers e testes de troca relatados | Regressão nos golpes multi-hit, derrotas e trocas rápidas após novos VFX |
| 16 | Shiny 1% | Em PR | [PR #17](https://github.com/lulualcides-sys/Pok-mon-torre-2/pull/17) ainda aberto | Sprite canônico, persistência nas evoluções, batalha real e integração |
| 17 | Revanches | Parcial | Política de cargas, recompensa moderada e bloqueio de prêmio único relatados | Validar níveis, rotas e economia em jogo normal |
| 18 | Pokémon Center | Parcial | Cura/remoção de status e animação; correção de reaplicação de derrota `10da46d` | Fluxo sem fixtures após KO total e consistência dos saves antigos |
| 19 | Balanceamento geral | Parcial | Ajustes pontuais de HP, XP, velocidade e economia | Métricas de duração e dificuldade do início até a Liga |
| 20 | Campanha completa | Parcial (Brock validado naturalmente) | 14 vitórias consecutivas no Phaser, com 2 capturas RNG, Rival #13 e Brock; [PR #38](https://github.com/lulualcides-sys/Pok-mon-torre-2/pull/38), [CI #40579140270](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/40579140270) | Prosseguir de Misty até o Campeão em percurso natural; #30 é diagnóstico anterior e não prova de falha atual |
| 21 | Mapa e locais | Parcial | Mapa, rotas e loja já inspecionados em relatórios | Abrir **cada local** e comprovar todos os menus e transições |
| 22 | Loja, TMs e economia | Parcial | Sete TMs compatíveis por espécie e lojas por etapa no patch mestre | Toxic de Koga (PR #16), remédios em batalha, todas as regras de consumo |
| 23 | Redesign de menus | Parcial | Sumário, Pokédex, estojo, Bolsa e BAG de batalha `e77bd4f` | Cobrir PC, mochila, mobile, acessibilidade e funcionamento real |
| 24 | Apresentação dos líderes | Parcial / não auditado | Times/HUD dos chefes e recompensas descritos | Validar apresentações visuais, falas, ás, insígnia e salvamento de cada líder |
| 25 | Estojo das insígnias | Histórico validado / integração a rever | Interface 2×4; [sprites descritos](./BADGE-SPRITES-2026-10-26.md) | Confirmar publicação/frames e transição após vitórias sem fixtures |
| 26 | Relatório de batalha | Parcial | Painel nativo relatado pelo commit `c8223fc` | Regressão de todas as recompensas, XP, insígnias e recarga sem duplicação |
| 27 | K.O. em pixel art | Pendente / não auditado | Sem evidência consolidada nesta revisão | Auditar implementação atual, efeitos, derrota de membro vs fim da luta |
| 28 | Sons e música | Pendente / não auditado | Sem evidência consolidada nesta revisão | Licenciamento, áudio do jogo, controles, persistência e testes |
| 29 | Lançamento/recolhimento | Parcial / não auditado | Animação de Pokébola documentada | Verificar sincronismo de sprites, raios, transições e bloqueio de ataques |
| 30 | Laboratório 151 | Parcial | Seleção 151 e Mewtwo 50, climas/status e isolamento do save relatados | Shiny, captura isolada e cobertura de todas as transições e VFX |
| 31 | Salvamento seguro | **Parcial — recuperação de corrupção estrutural validada** | [PR #49](https://github.com/lulualcides-sys/Pok-mon-torre-2/pull/49): backup se team/stage/box inválidos, [CI #40597965984](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/40597965984) com reload real, [Pages #40598347863](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/40598347863) sucesso | Cobrir saves após captura, evolução, compra, batalha e continuidade natural sem duplicação |
| 32 | FPS/desempenho | Pendente / não auditado | Meta declarada de 60 FPS e builds de navegador | Medir frame-time real, memória e estabilidade no Android/desktop |
| 33 | Testes obrigatórios | Parcial | Fluxos de CI, testes de unidade/browser e verificação do `c705d0b` | Cobertura completa das 30 verificações e documentação de lacunas |
| 34 | Campanha jogada até o Campeão | **Parcial — apenas até Brock** | [#40579140270](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/40579140270): 14 vitórias naturais até Brock, badge Rocha e TM39 | Jogar Misty, demais líderes, Elite Four e Campeão sem progresso ou HP forçados |
| 35 | 10 fases de execução | Parcial | Frentes de correção e integração em andamento | Encerrar fases com critérios objetivos, sem pular regressões |
| 36 | Preservação do projeto | Parcial (política ativa) | Proteções explícitas em `AGENTS.md` e política de golpes | Auditar alterações futuras contra aprovações e integridade dos saves |
| 37 | GitHub/publicação | Parcial (pipeline ativo) | CI e Pages da base `c705d0b` concluíram com sucesso | Para **cada patch futuro**, verificar diff, run, SHA implantado e jogo público |

## Continuação da T01 — correção isolada da fronteira Victory Road/Lorelei (27/10/2026)

- [PR #36](https://github.com/lulualcides-sys/Pok-mon-torre-2/pull/36): elimina encontro selvagem permitido **depois** da escada de 17 treinadores de Victory Road, quando a câmara Lorelei é liberada. Preserva os encontros selvagens anteriores e bloqueia os demais chefes da Liga. Código e teste de regressão escritos em branch isolada, sem alterar golpes, sprites, dificuldade, inventários ou salvamentos.
- [Workflow 40577322862](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/40577322862): sintaxe, `npm test`, check/reuse, build real Phaser e teste específico passaram; suite geral de navegador ainda **em execução na última consulta**. Até aprovação integral e merge, **não marcar como publicado**.
- **T01 permanece ABERTA**: [PR #30](https://github.com/lulualcides-sys/Pok-mon-torre-2/pull/30) documenta derrota genuína do único Bulbasaur no Rival #13 após 12 vitórias; não representa bug automaticamente. Próximo foco é captura/treinamento reais, recuperação no Centro, revanche legítima contra Rival e Brock. Não inventar vitória e não modificar a PR #30 de outro agente inadvertidamente.

## Atualização T01 — validação da PR #36 e equipe natural para Rival (27/10/2026)

- [PR #36](https://github.com/lulualcides-sys/Pok-mon-torre-2/pull/36) foi **integrada** em `774b8b690407f390ce0f3698a34aabb8149a102b`. O [CI específico #40577322862](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/40577322862), a suíte de navegador, a [validação integrada #40578446714](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/40578446714) e o [workflow Pages #40578491197](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/40578491197) concluíram com sucesso. **Acessibilidade visual do site público não foi checada diretamente nesta execução**, somente o resultado remoto do Pages.
- [PR #38](https://github.com/lulualcides-sys/Pok-mon-torre-2/pull/38) (draft) acrescenta **teste, não modificação de jogo**: 12 vitórias de treinadores sem forçar K.O.; 12 Pokébolas compradas por botão real, duas capturas com RNG natural, cura real pelo Centro, depois Rival #13 e Brock. Não repetir trabalho do [PR #30](https://github.com/lulualcides-sys/Pok-mon-torre-2/pull/30) nem presumir vitória. O [run #40579140270](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/40579140270) estava em execução durante este registro; **resultado a confirmar**.
- **Próximo `Continue`:** conferir o resultado e evidências da PR #38; se falhar, identificar a causa real (captura RNG, interface, HP, composição de equipe, IA) antes de alterar código. T01 só fecha após Brock vencido normalmente, sem fixtures, e verificação pós-merge/Publicação.


## Marco validado em 27/10/2026 — T01 / Brock

- O [teste Chromium/Phaser #40579140270](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/40579140270) **concluiu com sucesso**. Logs: 12 vitórias consecutivas com Bulbasaur nível 5→12, compras de 12 Pokébolas no Poké Mart por clique, **duas capturas normais (Geodude e Weedle, depois Kakuna/Beedrill por evolução)**, cura no Centro por botão, vitória no Rival #13, vitória no Brock #14. Sem injeção de K.O., HP, nível, dinheiro, probabilidades, prêmios ou vitórias.
- Estado após Brock: `stage=1`, `trainer=0`, `wins=14`, `losses=0`, **insígnia Rocha** e **TM39 Rock Tomb**. O Bulbasaur atingiu nível 13; equipe de apoio evoluiu ao longo das vitórias. O Mewtwo permaneceu apenas no PC.
- [PR #38](https://github.com/lulualcides-sys/Pok-mon-torre-2/pull/38) integrada em `76783d9d1b828c192b8c94c1ff4c7d34ccd857cd`, **somente teste e workflow**, sem mudança das regras do jogo. [CI em main #40591596826](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/40591596826) aprovado. [Pages pós-merge #40591672705](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/40591672705) ainda em execução na consulta; navegador público não auditado diretamente.
- **T01 validada em teste real do Phaser, não significa campanha inteira concluída.** Se PR #30 permanecer aberta com o diagnóstico antigo de derrota usando apenas Bulbasaur, ela não invalida a vitória com equipe legítima. Não alterar os saves nem os sprites/golpes para acomodar artificialmente o teste antigo.
- **Próxima tarefa na fila: T02** — FIGHT/POKÉMON/BAG/RUN, desktop/mobile, na Arena e campanha. A progressão real de Misty em diante segue T19/T20 e a conclusão até Campeão continua pendente (§34).

## T02 — validação de toque mobile e próximo fechamento (27/10/2026)

- A [PR #41](https://github.com/lulualcides-sys/Pok-mon-torre-2/pull/41) introduziu apenas o teste [t02-mobile-menu-browser.cjs](../tests/t02-mobile-menu-browser.cjs) e seu workflow, integrada em `f797b82b1f1189c18e3931acf882a38a84113962`. **Nenhum golpe, sprite, interface ou save de usuário mudou.**
- O [run Chromium/Phaser #40592499809](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/40592499809) **passou**: touchscreen 854×480 aciona o FIGHT do modo Arena com 6 sprites; BAG da campanha abre/fecha; Pokémon troca de Bulbasaur para Squirtle por hotspot real; sem consumo de item, vitória ou progresso fictícios. Squirtle é um fixture isolado somente no navegador de testes e Mewtwo permaneceu no PC.
- A primeira execução [#40592307860](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/40592307860) falhou porque o fixture tentou apagar Mewtwo; migração do jogo o restaurou conforme planejado. O fixture foi corrigido, não o jogo; então o run seguinte passou.
- **T02 continua parcial.** Não foi demonstrada cobertura integral dos menus de desktop, dos golpes e de RUN quando permitido. Próximo `Continue`: examinar o fluxo de controles restante sem duplicar o que os testes existentes já cobrem.
- **T01:** [Pages #40591672705](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/40591672705) confirmou sucesso do commit de T01 `76783d9`. A campanha natural está validada até Brock, não até Campeão. Um teste em navegador separado contra o site público ainda não foi executado.


## T03 — primeiro teste de tela preta após evolução (27/10/2026)

- [PR #44](https://github.com/lulualcides-sys/Pok-mon-torre-2/pull/44) integrada em `9a0dc6112097da215c1efdcfb67119f3d4c1ec76`, somente teste de navegador e workflow. [CI #40595592409](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/40595592409) aprovado: evolução **Magikarp → Gyarados** acionada na batalha; cena `combate` permanece ativa, textura `pmd-0130-Idle` carregada, sprite visível, frame 72×128, canvas WebGL 1280×720 e ataques por toque após evolução.
- Esta prova é **pontual**: não assegura que todas as 151 espécies e linhas evolutivas estejam livres de tela preta. A T03 continua parcial; não foram alterados golpes, sprites, VFX ou jogabilidade.
- A [PR #43](https://github.com/lulualcides-sys/Pok-mon-torre-2/pull/43) trata de RUN e desktop da T02 de modo concorrente. [Run #40595345855](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/40595345855) falhou na suíte global da Bolsa (antídoto não consumido no teste), embora o teste isolado de RUN selvagem tenha passado. **Não integrar T02 sem revisão dos testes finais do HEAD**.
- **Próximo `Continue`:** verificar novo HEAD/CI da PR #43; concluir T02 se estiver estável e prosseguir com a matriz T03 das evoluções, preservando os recursos já aprovados.

## T03 — quatro evoluções verificadas na Arena (27/10/2026)

- A [PR #46](https://github.com/lulualcides-sys/Pok-mon-torre-2/pull/46) foi integrada no commit `db8baf0cc1e917fff14dca4600581f4beb88ff17`. Introduziu **somente** o teste `tests/t03-starter-evolutions-browser.cjs` e um workflow, sem alterar o motor, golpes, sprites, saves ou VFX.
- O [CI #40596220909](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/40596220909) teve sucesso no **Phaser da Arena**: ao acionar o EVO nativo, Bulbasaur virou Ivysaur (PMD `pmd-0002-Idle`), Charmander virou Charmeleon (`pmd-0005-Idle`) e Squirtle virou Wartortle (`pmd-0008-Idle`). Em cada evolução, a cena continuou ativa, a textura estava carregada, o frame era não vazio e os quatro golpes tinham nomes sem `pendiente`.
- Junto ao teste de Magikarp → Gyarados da PR #44, há **quatro linhas evolutivas pontualmente verificadas**. No novo teste, a prontidão para EVO foi preparada com experiência apenas no **fixture do navegador**, não em nível natural da campanha. Logo, T03 e a seção §34 continuam abertas. Um teste do site público pós-merge ainda precisa ser feito.
- **T02:** a PR #43 para RUN e menus desktop ainda está isolada. Os logs da execução [#40595946184](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/40595946184) confirmam clique RUN selvagem bem-sucedido e RUN ausente contra treinador, mas falha posterior no teste desktop do Antídoto na Bolsa (estoque não consumido e modal continuou aberto). Não integrar até revisar o último HEAD e validar a suíte completa.


## T02 — RUN isolado e teste real de desktop (27/10/2026)

- A [PR #43](https://github.com/lulualcides-sys/Pok-mon-torre-2/pull/43) **foi fechada sem merge** porque também continha experimentos de câmera/posição da Bolsa que não passaram regressões. Nenhuma dessas mudanças deve ser incorporada automaticamente.
- A [PR #48](https://github.com/lulualcides-sys/Pok-mon-torre-2/pull/48) traz **apenas** RUN de selvagens, teste Chromium desktop e workflow; não modifica sprites, golpes, Bolsa nem modos Arena. RUN limpa `pendingWild`, conserva HP/status da equipe, inventário, XP, dinheiro, vitórias e derrotas; não existe em batalhas com treinadores. O botão foi movido para o espaço entre a Bolsa e o AUTO após auditoria de zona nativa de profundidade 9600.
- No [CI #40596836115](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/40596836115), checks, build e fase de navegador de RUN/BAG/POKÉMON desktop, FIGHT mobile **passaram**. Na última consulta o `npm run test:browser` **ainda executava**. Portanto, **não declarar PR #48 integrada, deploy concluído ou T02 fechada**.
- Um teste anterior de antídoto em batalha apresentou clique perdido quando a câmera movia a projeção do menu. Esse problema continua **pendente de diagnóstico e correção separados**, sem aplicar os experimentos malsucedidos à main.
- Próximo `Continue`: verificar a conclusão do CI #40596836115 e, se aprovado, integrar PR #48 com verificação de Pages. Depois solucionar antídoto e demais controles T02. **T03 já está sendo trabalhada em outra frente; não sobrescrevê-la.**

## Marco T02 — RUN integrado sem alterações na Bolsa (27/10/2026)

- A [PR #48](https://github.com/lulualcides-sys/Pok-mon-torre-2/pull/48) **foi integrada na main** como `0f726b9f804423174cf116baa169adf19d8fe59e`. O [workflow completo #40596836115](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/40596836115) finalizou em **success**: validações sintáticas, testes unitários, proteção de golpes, build Phaser, cliques de RUN e troca no desktop, FIGHT/BAG no mobile e suíte oficial `npm run test:browser`.
- RUN existe **apenas em encontros selvagens**, posicionado longe do hitzone HUD (578,66). Fugir cancela somente o encontro, grava HP/status por UID, não concede XP, itens, dinheiro, vitórias nem derrotas. Nenhuma regra de captura, sprite ou golpe aprovado foi modificada.
- A [PR #43](https://github.com/lulualcides-sys/Pok-mon-torre-2/pull/43) experimental foi encerrada **sem merge**. Mudanças não aprovadas na Bolsa ficaram fora da PR #48.
- **T02 permanece parcial:** teste antigo de Antídoto com câmera dinâmica ainda falhou na frente experimental, enquanto o novo teste normal de BAG abriu/fechou e manteve estoque. Essa falha **não foi corrigida nem declarada concluída**; requer investigação isolada da transformação de hitzones depois de movimentos da câmera.
- O [CI pós-merge #40597754055](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/40597754055) estava em execução na consulta. **Não declarar novo SHA publicado em Pages até workflow de deploy confirmado.** As tarefas T03–T05 já foram tratadas em outras frentes concorrentes: revisar HEAD e PRs antes do próximo patch.

## Atualização integrada: T05 backup e T02 mobile (27/10/2026)

- **T05:** [PR #49](https://github.com/lulualcides-sys/Pok-mon-torre-2/pull/49) integrada em `74c7aaaceb1d1a779d0e35caf1a92ee98ec463af`. O [CI #40597965984](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/40597965984) passou com cinco testes de integridade, build original, teste Chromium de recarregamento e restauração de backup de save com JSON válido porém estrutura inválida (equipe vazia). Mantidos PC/Mewtwo, HP, dinheiro, itens/TM, insígnia e progresso; reset continua apagando backup. [CI main #40598307857](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/40598307857) e [Pages #40598347863](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/40598347863) **sucesso**. T05 ainda **parcial** até auditar saves após todos os eventos (evolução, captura, compra, K.O.).
- **T02:** [PR #52](https://github.com/lulualcides-sys/Pok-mon-torre-2/pull/52) integrou em `2eaa3305f09e6403f06218f7f6b3481e22d2111f` novo teste de menu e **RUN touchscreen real** com viewport móvel, sem modificar o runtime. [CI #40598192704](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/40598192704) passou a suite inteira. [CI main #40599157504](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/40599157504) passou. O [Pages #40599199331](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/40599199331) estava **aprovado** nesta consulta. RUN somente em selvagens, nenhuma fuga de treinador.
- **T02 Bag/câmera:** [PR #53](https://github.com/lulualcides-sys/Pok-mon-torre-2/pull/53) em draft, mudança de scrollFactor dos objetos visuais e hitzones para evitar hitboxes deslocadas sob pan/zoom; [CI #40599441925](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/40599441925) ainda **não havia concluído** na verificação deste registro. **Não integrar** a PR com teste falho ou sem evidência. Há outra branch experimental de mesmo tema, `fix/master-t02-bag-hud-camera-20261027`, que não foi mesclada; comparar antes de avançar e evitar sobreposição.
- **Próximo trabalho seguro:** concluir diagnóstico câmera/antídoto da T02 somente após CI sólido. Em paralelo, avançar T03/T04 em branches sem conflito. Sem alterações em golpes, VFX ou sprites aprovados.


## Evidências do estado de referência (27/10/2026)

- `main` analisada: `c705d0b84f0d85cf3a4e59d8fa0fc4b75aec964c` — remoção do bloqueio de cinco encontros selvagens; [PR #32](https://github.com/lulualcides-sys/Pok-mon-torre-2/pull/32).
- [CI da base: sucesso](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/40573480857) e [Pages: sucesso](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/40573532116). Isso **não prova** que as 37 seções foram concluídas ou que a campanha foi jogada inteira.
- Outros commits recentes: `35bbd8f` (AUTO na campanha e velocidade alinhada à Arena), `e77bd4f` (BAG em batalha), `c8223fc` (relatório pós-batalha), `6f85d1d` (Salão da Fama), `10da46d` (derrota/Centro).
- PRs abertas na inspeção: [#30 — progressão natural da campanha](https://github.com/lulualcides-sys/Pok-mon-torre-2/pull/30), [#17 — Shiny](https://github.com/lulualcides-sys/Pok-mon-torre-2/pull/17), [#16 — Toxic de Koga](https://github.com/lulualcides-sys/Pok-mon-torre-2/pull/16). **Consultar novamente** antes de editar: essa situação pode mudar.
- Este registro é uma **auditoria documental**. **Nenhum teste local nem navegador foi executado para criar este arquivo**. A ausência de revalidação deve ser preservada explicitamente.

## Próxima sequência de trabalho recomendada

1. **Base da campanha:** inspecionar o PR #30 e os arquivos da etapa 20; reproduzir no navegador o fluxo natural, com save isolado, sem injetar vitória. Desbloquear Brock sem afetar os resultados dos oito encontros anteriores.
2. **Unificar sem sobrescrever:** revisar PRs #16 (Toxic) e #17 (Shiny) quanto a licença/VFX, casos de teste e compatibilidade; só integrar após validações e revisão da HEAD.
3. **Ampliar percurso natural:** verificar ginásios e rotas até o Campeão, coletando evidências por etapa, evolução, XP, loja, rivais e casos de derrota.
4. **Fechar sistemas parciais:** climatologia visual, status/itens em batalha, 151 movesets nas interfaces, laboratório, som e performance. Corrigir uma família de bugs por vez com testes focados.
5. **Grande patch de design e pixel art apenas após estabilidade:** manter sprites e golpes aprovados intactos; testar desktop e Android.
6. Para cada entrega: registrar `base SHA → commit SHA → testes → link CI → SHA de Pages → percurso real → pendências`. Se não houve alguma das validações, registrar "não verificado".

**Regra de continuidade:** este controle é atualizado **somente com evidências verificáveis**. Não usar a palavra "concluído" para código apenas escrito, fixtures, testes omitidos ou publicação presumida.
