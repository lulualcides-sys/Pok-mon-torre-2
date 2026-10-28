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
| 4 | FIGHT da Arena | Validada em CI desktop/mobile (Pages pendente) | [PR #53](https://github.com/lulualcides-sys/Pok-mon-torre-2/pull/53), [CI #40600983129](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/40600983129) completo; Bolsa fixa pan/zoom, poção/antídoto, FIGHT, troca e RUN selvagem | Conferir [Pages #40602087786](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/40602087786) e demais modos em regressões futuras |
| 5 | Tela preta após evoluir | Parcial — 13 transições testadas em Arena | [PR #59](https://github.com/lulualcides-sys/Pok-mon-torre-2/pull/59), [CI #40602575454](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/40602575454): todas as evoluções das 3 famílias iniciais; [PR #44](https://github.com/lulualcides-sys/Pok-mon-torre-2/pull/44): Gyarados | Validar demais linhas evolutivas e nível/salvamento naturais na campanha |
| 6 | Identidade dos sprites | Parcial — 13 transições PMD auditadas | [#40602575454](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/40602575454): Venusaur #0003, Charizard #0006, Blastoise #0009, mais três estágios médios; [#40595592409](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/40595592409): Gyarados #0130 | Outras espécies, estágios de HUD e verificação no site público |
| 7 | Learnsets dos 151 | Parcial | Fonte de learnsets FRLG e resolução da Pokédex já relatadas | Auditar 151 espécies nos modos, evolução, golpes exclusivos e compatibilidade de TMs |
| 8 | 4 golpes e ULT nível 8 | Parcial | Bloqueio da campanha nível 5 / ULT nível 8 já integra `AGENTS.md`; regressões citadas | Validar novos iniciais, todos os modos, evolução, save e nenhuma ULT forte antecipada |
| 9 | Tipos/STAB/crítico | Parcial | Tabela de 17 tipos e testes de combinações, STAB e burn | Fórmula final de dano e classes físico/especial com testes de jogabilidade |
| 10 | Status e Toxic | Parcial + PR | Regras base documentadas; [PR #16](https://github.com/lulualcides-sys/Pok-mon-torre-2/pull/16) do Toxic ainda aberto | Auditar VFX, timeouts, cura em batalha, Toxic e todas as transições |
| 11 | Cooldowns e IA de ataque | Parcial | Restrições descritas e correções específicas de movimentos no histórico | Auditoria por espécie/golpe dos cooldowns de ambos os lados |
| 12 | IA de troca estratégica | Parcial | Política de troca limitada para líderes e chefes no patch mestre | Partidas reais, transições, múltiplas reservas e compatibilidade mobile |
| 13 | Poções de treinadores | Parcial | Inventário por etapa, limiar de HP, atraso e intervalo relatados | Sprites/partículas e teste natural por cada líder/Elite Four |
| 14 | Clima | Parcial | Sol/chuva/areia/granizo com duração, multiplicadores e laboratório relatados | Efeitos de pixel art globais, movimentos ainda não ligados e precisão/recuperação |
| 15 | Dano residual na troca | Parcial — segurança de limpeza integrada | [PR #57](https://github.com/lulualcides-sys/Pok-mon-torre-2/pull/57) e [CI #40601951402](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/40601951402) testaram cleanup idempotente de efeitos nulos/repetidos, filas multi-hit e trocas no Phaser | Testar golpes reais multi-hit, troca rápida/KO e Pages pós-merge |
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


## Continuidade de T02 e T04 — 27/10/2026

- T02: [PR #53](https://github.com/lulualcides-sys/Pok-mon-torre-2/pull/53) integrada em SHA 81e29698a07f6fd41d088522afb3bfc2a40b5232. [CI #40600983129](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/40600983129) e [CI main #40602048321](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/40602048321) passaram. Bolsa acompanhando zoom/pan, poção e antídoto consumidos por clicks reais, troca e RUN desktop/mobile já testados. [Pages #40602087786](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/40602087786) aguardando resultado na consulta. Não afirmar publicação até sucesso.
- T04: [PR #57](https://github.com/lulualcides-sys/Pok-mon-torre-2/pull/57) draft previne erro quando lista de projéteis contém valores nulos ou referências repetidas na troca e KO. [CI #40601951402](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/40601951402): testes unitários e switching em Chromium passaram; suíte integral em execução quando consultada. Não integrar até CI completo.
- A validação T02 cobre menus FIGHT/BAG/POKÉMON/RUN nos cenários desktop e mobile testados; não equivale a toda combinação de modos nem ao teste em dispositivo físico. T04 permanece parcial para os golpes multi-hit e todas as transições.

## Atualização T03 — evoluções finais dos três iniciais (27/10/2026)

- [PR #59](https://github.com/lulualcides-sys/Pok-mon-torre-2/pull/59), integrada no commit 4eaf476286d35c940993fd0f1a23245422db8bd5, adiciona apenas um teste Chromium/Phaser e workflow. [CI #40602575454](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/40602575454) passou. Bulbasaur→Ivysaur→Venusaur (PMD #0003); Charmander→Charmeleon→Charizard (PMD #0006); Squirtle→Wartortle→Blastoise (PMD #0009), duas evoluções por linha via botão EVO na Arena. Texturas carregadas, sprites visíveis e quatro slots de golpes não vazios. Nada foi alterado em golpes, sprites, VFX ou runtime do jogo.
- Em conjunto com o teste Magikarp→Gyarados da [PR #44](https://github.com/lulualcides-sys/Pok-mon-torre-2/pull/44), há 7 transições de evolução verificadas no navegador (6 dos três iniciais + 1 Gyarados). Estes testes preparam a experiência no fixture da Arena e **não comprovam evolução natural por nível na campanha**; T03 continua parcial até testar demais espécies e saves.
- T02: [Pages #40602087786](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/40602087786) concluiu com **sucesso** para commit 81e29698a07f6fd41d088522afb3bfc2a40b5232, após integrar a correção pan/zoom da Bolsa. A publicação posterior que inclui apenas testes T03 ainda precisa de confirmação.
- T04: [PR #57](https://github.com/lulualcides-sys/Pok-mon-torre-2/pull/57) draft, sem merge na verificação; os testes unitários e de troca/KO no Chromium passaram e a suíte total ainda estava em execução. Não declarar concluída.

## T04 — proteção adicional de projéteis na troca e KO (27/10/2026)

- [PR #57](https://github.com/lulualcides-sys/Pok-mon-torre-2/pull/57) foi integrada em SHA 9083fecc003a76c148ababfda7f70aff619558f1. O [CI completo #40601951402](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/40601951402) passou: testes de unidade, build nativo, troca de Pokémon no Chromium e suite de navegador oficial.
- Correção restrita a [torre2-combat-boundary.js](../tools/pokearena/torre2-combat-boundary.js): ao recolher Pokémon, slots nulos em efeitos não interrompem a limpeza e referências duplicadas são destruídas só uma vez. Filas de impactos pendentes são descartadas sem curar/danificar o elenco. Os testes injetam colisões múltiplas em fixture; não são prova de cada golpe real existente.
- A seção §15 e a T04 seguem PARCIAIS até percursos Phaser com golpes multi-hit reais, trocas de inimigos, K.O. rápido e eventual dano residual. [CI main #40603066070](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/40603066070) e Pages da atualização estavam em execução na consulta; só declarar publicação após sucesso.
- Próximo: concluir regressões naturais T03/T04 e continuar T05–T31, sem alterar golpes, efeitos ou sprites aprovados.

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


## Ampliação de cobertura T03 — evoluções Kanto (27/10/2026)

- [PR #62](https://github.com/lulualcides-sys/Pok-mon-torre-2/pull/62), [CI #40604186040 (tentativa 2)](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/40604186040): sintaxe, `npm test`, `npm run check`, `npm run check:reuse`, build Phaser e seis transições de evoluções nativas no Chromium/WebGL concluíram com sucesso.
- Pidgey→Pidgeotto→Pidgeot; Caterpie→Metapod→Butterfree; Weedle→Kakuna→Beedrill. Todas as espécies mostraram sprites PMD legíveis; finais preservaram quatro slots. Metapod/Kakuna **não** receberam ULT prematura.
- §5/§6 e T03 seguem **parciais**: 13 transições verificadas com fixture de Arena, sem comprovação de evolução natural por nível ou persistência na campanha; outras formas e verificação pública pós-merge ainda pendentes.

## T05 — checkpoints de eventos persistidos e reload Phaser (27/10/2026)
- A [PR #63](https://github.com/lulualcides-sys/Pok-mon-torre-2/pull/63) foi integrada em `ae2be47b785e4d68abe0910618ff3685d8a7c926`. Arquivos adicionados: `tests/t05-event-checkpoints-built.test.mjs`, `tests/t05-event-persistence-browser.cjs`, `.github/workflows/master-t05-event-persistence.yml`. **Nenhum runtime, VFX, sprite, golpe ou controle foi alterado.**
- [CI #40604422947](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/40604422947) concluiu com **sucesso**: `npm test`, `npm run check`, `npm run check:reuse`, captura/build versionado, teste de persistência em compras, encontros, capturas, vitória/derrota, evolução pós-batalha, depósito/retirada/troca no PC, badge/TM e recarga real no Chromium/Phaser após captura e vitória; também passou a suíte `npm run test:browser` e teste de backup preexistente.
- A evolução de Caterpie e a recompensa de Brock são **fixtures de checkpoint**, não vitórias naturais; a validação T01 da campanha até Brock permanece separada. T05 e §31 **PARCIAIS** até testar demais sequências de save e confirmar o SHA público após o merge. [CI main #40605087607](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/40605087607) **sucesso**. [Pages #40605125735](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/40605125735) **sucesso**: o job confirmou por HTTP o build público `src-1e196ed3a9` em 27/10/2026, após o merge de `ae2be47` e as atualizações documentais. Isso valida publicação técnica, não a campanha natural completa.
- T03 avançou em paralelo pela PR #62; não houve alterações nos mesmos arquivos. Próximo trabalho independente: expandir saves em transições de status/KO ou regressão de multi-hit T04, sempre após conferir HEAD e PRs.


## Continuidade aberta: T03 / evolução natural pós-Brock (27/10/2026)

- [PR #64](https://github.com/lulualcides-sys/Pok-mon-torre-2/pull/64) foi aberta com um modo opt-in em `tests/section20-natural-team-brock-browser.cjs` e workflow `.github/workflows/master-t03-natural-ivysaur.yml`. O objetivo é ampliar as 14 vitórias reais até Brock e continuar sem manipular os resultados, até o nível 16 do Bulbasaur; verificar evolução pós-batalha, persistência após reload e sprite/golpes no combate seguinte.
- [CI de validação #40605870480](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/40605870480) **ainda em andamento nesta observação**. Esta descrição é uma **tarefa em teste, não um resultado validado**. O Script Mestre §5/§6 e a T03 seguem **PARCIAIS** até concluir e integrar a execução.
- [GitHub Pages #40605125735](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/40605125735) **sucesso** para `132641f2d01193fe5bb154375d8ebf3fc4876348`, anterior à PR #64; não afirmar que a alteração de teste esteja no site. Não é necessária mudança de runtime nem de sprites para este teste.


## Seções 5, 6 e 31 — verificação de Ivysaur em batalha real (28/10/2026 UTC)

- [PR #64](https://github.com/lulualcides-sys/Pok-mon-torre-2/pull/64), merge `7eb2112f8c84d84af46cb4489a4758881606db61`, foi integrado **somente com testes e workflow**. [CI da branch #40607000250](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/40607000250) e [CI da main #40607960008](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/40607960008): **sucesso**. A branch passou pelos 169 unitários, verificações de fontes de golpes, build Phaser e suíte de 14 testes de navegador.
- **Teste com fixture pré-batalha explícita:** estágio de Cerulean e Bulbasaur Lv15 com EXP a um ponto do Lv16; aliado Squirtle Lv20. Oponente Sandshrew Lv15 foi derrotado em combate Phaser real, sem resultado, HP, XP ou sprite impostos durante a luta. O Bulbasaur não mudou enquanto combatia (256 amostras); evoluiu APÓS a vitória, foi recarregado como Ivysaur Lv16, UID mantido, save intacto e sprite real `pmd-0002-Idle` com frame 32×32/4 golpes carregados.
- **Limite:** este NÃO é percurso natural jogado do início até Ivysaur. [O workflow longo anterior #40605870480](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/40605870480) terminou com derrota legítima na sexta luta, e não pode provar falha de evolução. Preservar T03/§5/§6 **PARCIAIS**, pois ainda faltam transições de outras famílias, jogabilidade natural e saves variados. Pages pós-merge pendente de confirmação separada.


### T03 — publicação confirmada pelo GitHub Actions

- [Pages #40607987285](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/40607987285) **concluído com sucesso**, head `7eb2112f8c84d84af46cb4489a4758881606db61`, contendo a PR #64; [CI main #40607960008](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/40607960008) **sucesso**. PR #66 foi apenas documental e não modifica o build.
- **Não houve conferência visual direta** no site externo nesta execução porque as tentativas de acesso a `/arena2d/` e `/arena2d/version.json` falharam pela ferramenta disponível. Não declarar T03 validada em todas as modalidades; manter **PARCIAL**.


## §5/§6 — Kanto Slowbro e 69 evoluções lineares no build (28/10/2026 UTC)

- [PR #68](https://github.com/lulualcides-sys/Pok-mon-torre-2/pull/68), merge `4b02d51614945cbf0d5b9d0207af90e6dbcf7877`: correção mínima em `torre2-campaign-core.js` para selecionar **Slowbro** após alcançar nível 37 com Slowpoke na campanha; antes, opção Slowking da tabela genérica impedia uma escolha e evolução automática em Kanto. Não alterar sprites/VFX/golpes/IA ou famílias externas.
- [CI #40609591781](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/40609591781) **aprovado**: 69 transições lineares distintas de Kanto em estado preparado com **nenhuma evolução após derrota**, espécie/nível corretos após o resolvedor de vitória, UID/nickname/TM, persistência e bloqueio de evolução repetida; 169 testes unitários existentes, política de fontes, build e 14 testes Chromium oficiais também aprovados. [Falha anterior #40609421151](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/40609421151) diagnosticou a regressão Slowpoke Lv37.
- As 69 provas foram feitas usando o **resolvedor em fixtures** do build Phaser; não são 69 combates e evoluções exibidos visualmente nem partidas naturais até o nível. **Eevee e seus três ramos** ficaram fora da matriz linear; evolução visual integral e percurso natural seguem sem evidência. §5/§6 e T03 permanecem **PARCIAIS** até testes por modalidade e saves reais. CI main/Pages do merge: verificar execução atual; não presumir sucesso de publicação.


### T03 / §5–§6 — publicação validada no GitHub Actions (28/10/2026 UTC)

- [CI `main` #40610461674](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/40610461674) **sucesso** e [GitHub Pages #40610493854](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/40610493854) **sucesso** no build `4b02d51614945cbf0d5b9d0207af90e6dbcf7877` da PR #68. O merge documental posterior `74fc278e3958f334ae9ea77dd3c1960b1b1b0732` alterou apenas os dois arquivos deste controle/da fila, conforme comparação GitHub, sem modificar o jogo.
- **Limites:** não foi possível abrir diretamente o site público para inspeção visual independente. São 69 resultados em testes de progressão com fixtures, não 69 evoluções renderizadas nem campanha completa. §5, §6 e T03 **PARCIAIS**.
