# Plano de implementação — 001 / fluxo do Script Mestre

## Plano de continuidade pós-CI verde — T20→T19 (31/10/2026)
1. Preservar a prova completa da PR #369 (squash `1fcc64eb`): 13 treinadores genuínos, captura nativa de Spearow e Geodude, Brock, Rocha e TM Rock Tomb; CI #41153415212 e visual #41153419869 aprovados. O merge não introduziu ajustes de combate e não implica publicação HTTP automática.
2. Revalidar testes/Pages da `main` integrada. Não confundir o resultado da branch antiga com teste da `main` nova. Sem comprovação de SHA público, registrar publicação como pendente.
3. Prioridade T19: estender a prova natural a Cerulean/Misty no save efetivamente conquistado, sem injetar níveis, insígnias, HP, vitórias ou TMs; amostrar XP/cooldowns, recuperação no Centro e persistência após reload. Manter teste de longa duração isolado de CI rotineira.
4. Se houver falha, reproduzir em Chromium com logs e corrigir apenas a causa concreta, sem alterar VFX aprovados, IA Arena ou T10 #381. Não reutilizar a branch antiga #369 para novos recursos.


## Lote T03 — escolha de Eevee sem UID legado (30/10/2026)
- **Causa:** seletor de UI exige UID; saves antigos permitem membros sem UID, portanto Eevee elegível não pode escolher Vaporeon/Jolteon/Flareon.
- **Patch mínimo:** apenas `torre2-campaign-core.js`, helper de tokens determinísticos por localização/índice e sem colisão, mapeamento por índice do membro selecionado, UID persistido somente após `saveCampaign` concluir. Sem migração em massa.
- **RED inferido do código:** `typeof undefined!=='string'` bloqueia a escolha; regressões novas cobrem equipe/PC, colisão, storage negado, Shiny/TM. **GREEN ainda não executado**; aguardar CI real.
- **Gates:** T03 workflow PR (Node, check, reuse, build, testes compiled, Chromium UI e suíte browser), guardião visual, revisão, merge e Pages HTTP SHA. Rollback isolado do helper e teste; nenhuma alteração em VFX, sprites, IA, clima, combate ou saves existentes.


## Lote T08 — gate compartilhado de ULT preferida (30/10, PR #368)

- **Causa:** o seletor `chooseKantoSignatureUlt` tinha `excluded` canônico; o caminho `preferredSignature` em `resolveKantoIntro` checava apenas renderização, dano e bloqueio pontual. Corrigir compartilhando predicado exportado, sem editar catálogos, VFX, TM/HM, saves, cooldowns ou UI.
- **RED→GREEN:** regressão adicionada primeiro (`2aeff6de`); execução isolada do código-fonte antes da correção falhou para Tackle/Surf/Scratch/Transform; depois `aa0cd1c0` retornou Vine Whip nos quatro casos, 19/19 testes do arquivo no harness isolado. Esse harness **não substitui** `npm test`, `check`, `check:reuse`, build, CI, Chromium ou Pages.
- **Gates/rollback:** PR #368 draft; aguardar todos os workflows do HEAD e revisão; revalidar main, merge somente verde, conferir SHA publicado via Pages HTTP. Rollback restrito ao predicado compartilhado e teste. Não tocar PRs #270/#329, Toxic #16 ou Shiny #17.


## Lote 30/10 — retry estrito no workflow público independente

- Reusar `tools/dev/pages-public-503-retry.cjs` e testes existentes sem modificar o classificador; alterar somente o passo Chromium de `.github/workflows/pokedex-public-live.yml` para até 3 execuções completas com limpeza de diagnóstico antes de cada tentativa.
- RED: #41091689377; teste do classificador já existe e será executado pela CI da PR. Validar YAML/workflow, CI e navegador; não mesclar com checks vermelhos. Rollback: reverter apenas workflow; sem mudanças de runtime.


## Lote T07/T08 — gate de VFX customizado na introdução (30/10/2026)
- **Arquivos:** `tests/kanto-intro-moves.test.js` (regressões RED) e `tools/pokearena/torre2-kanto-intro-moves.js` (um gate em `introRenderable`). Não editar `kanto-ultimate-policy.js`, catálogos, sprites ou fontes externas.
- **Causa:** `push()` filtrava `approved` apenas em `supplemental`, e o fallback neutro chamava `lowPower()` sem verificar aprovação de `new-phaser-fx`. Centralizar gate impede os dois vazamentos sem mudar VFX.
- **Processo:** branch isolada da main `8ac91ddee8df3230e6d2c067dc62f00b67d38f9b`, PR #365. RED #41084164169; patch SHA `4070ccbfb4f7d3489fa4290633af981a12dea692`. Aguardar CI/Chromium e guardião do HEAD final, revisão, compatibilidade main e Pages HTTP após merge. **Rollback:** reverter somente predicado/testes; nenhum save migrado.


## Plano 30/10 — investigar timeout real da Pokédex pública
**Escopo:** somente `tests/pokedex-public-live-browser.cjs` e registros de evidência. Capturar `document.readyState`, cenas Phaser ativas, canvas, erros de página, HTTP >=400, requisições falhas e screenshot ao falhar no boot; relançar o erro original. Revisar artifact e comparar com a execução Pages que passou antes de alterar código do jogo. **Rollback:** reverter este teste; não há migração de saves nem alteração de efeitos. **Concorrência:** não tocar PRs #329, #352, #353, Toxic #16 ou Shiny #17. Gates: sintaxe CJS, guardião Chromium no PR e, após merge autorizado, auditoria pública integral.
**Escopo deste PR:** introdução segura do método; sem alteração de runtime.
**Branch:** `docs/spec-kit-superpowers-master-workflow-20261030`

## Contexto técnico examinado
- Motor publicado: Phaser/WebGL; fontes em `tools/pokearena/`, testes em `tests/`, workflows em `.github/workflows/`.
- Guia de navegação: `docs/GUIA-RAPIDO-REPOSITORIO.md`.
- Regras existentes: `AGENTS.md`, `docs/agentes/POLITICA-GOLPES-INTEGRAL.md`, Script Mestre 37 seções, controle e fila T01–T31.
- Concorrência em 30/10: PR #329 sobre T20 ativa e CI recente vermelha; não modificar testes dela neste PR.

## Arquitetura documental mínima
1. `.specify/memory/constitution.md`: princípios imutáveis e precedência das fontes (Spec Kit).
2. `specs/001-master-script-continuity/spec.md`: resultados observáveis, invariantes e escopo.
3. `specs/001-master-script-continuity/plan.md`: plano atual, interfaces e gates.
4. `specs/001-master-script-continuity/tasks.md`: tarefas e evidências.
5. `AGENTS.md`: roteamento para fluxo Superpowers + Spec Kit antes de cada patch.

## Fluxo padrão para próximos lotes
1. **Reconhecimento:** conferir HEAD + PRs/CI, ler arquivos necessários, localizar o último checkpoint, distinguir defeito factual de histórico.
2. **Especificação:** definir um cenário verificável e uma mudança mínima em `spec.md`; não duplicar o Script Mestre inteiro.
3. **Plano:** dependências e módulos concretos, impacto nos saves/VFX/rotas e nos agentes concorrentes, teste reproduzível, rollback.
4. **Execução:** branch isolada; usar skills do Superpowers quando disponíveis (debug sistemático, TDD, execução, revisão e verificação).
5. **Gates:** reproduzir falha quando pertinente; executar testes focados, unitários, build e Chromium real aplicável; CI da branch; respeitar `check:reuse` para VFX.
6. **Integração:** revisar diff, manter PR transparente, só integrar quando verificações forem satisfatórias; confirmar GitHub Pages e HTTP na versão exata antes de declarar publicado.
7. **Rastreabilidade:** registrar SHA, CI, evidência real e limites na fila/controle.

## Próximo lote funcional — T20 (em outra branch)
- Inspecionar artefatos/logs da CI #41028820921 da PR #329.
- Reproduzir a falha com ações Phaser verdadeiras; evitar tratamento artificial de HP, XP, wins, medidor ou RNG.
- Corrigir **a causa comprovada** ou ajustar teste que não represente gameplay real.
- Verificar 13 treinadores, capturas reais, Brock, insígnia/TM e save persistente antes de declarar homologação. CI verde e Pages são gates diferentes.
- Se a PR #329 ainda estiver sendo alterada por outro agente, atuar em outra tarefa não conflitante em vez de reescrever sua branch.

## Validação deste PR documental
- Conferir existência de todos os arquivos e vínculos Markdown.
- Conferir texto anterior de `AGENTS.md` preservado e novo roteamento adicionado.
- Nenhum `src/`, `tools/`, `data/`, `tests/`, `.github/workflows/` ou save alterado.
- Conferir diff e checagens automáticas do PR, quando disponíveis. Não declarar testes de jogo executados se não rodaram.

## Riscos e rollback
- **Risco:** agentes interpretarem docs como prova de jogo concluído. **Mitigação:** estados explícitos e verificação obrigatória.
- **Risco:** CLI Spec Kit não disponível. **Mitigação:** arquivos em formato compatível, sem dependência de CLI.
- **Risco:** múltiplos agentes alterando `AGENTS.md`. **Mitigação:** branch isolada, não fazer force-push, rever base antes do merge.
- **Rollback:** reverter apenas commits de documentação; nenhuma migração de dados é necessária.

## Lote T07/T08 — separar VFX Surf de liberação HM (30/10/2026)
- Escopo: comentário do onboarding, teste de catálogo compilado, política integral e nomes de workflow; nenhuma lógica Phaser/WebGL, efeito, save, TM ou sprite alterado.
- Risco controlado: o teste exige VFX Surf instalado, preserva seus metadados após consultas e mantém HM indisponível na campanha sem autorização específica.
- Verificação: `npm test`, `npm run check`, `npm run check:reuse`, build, teste compilado T08 e Chromium pelo workflow do PR. Não afirmar execução local ou Pages antes dos gates.
- Concorrência: não tocar PR #329 (T20), #270 (ULT), Toxic #16 nem Shiny #17. Rollback isolado do patch documental/teste, sem migração de save.


## Lote 30/10 — corrigir a classificação de falhas HTTP públicas, não a jogabilidade

- **RED real:** Pages #41045137532 falhou com HTTP 503 em `assets/vfx/hilo.png`; Pages #41072227909 falhou com HTTP 503 em `torre2/laboratory.js` apesar de confirmar a versão pública. Diagnóstico e screenshot foram gerados pelo teste existente.
- **Mudança mínima:** `tools/dev/pages-public-503-retry.cjs` classifica exclusivamente 503 do domínio Pages e rejeita outros erros; `tests/pages-public-503-retry.test.cjs` testa casos positivos/negativos. `.github/workflows/pages.yml` repete o **mesmo** Chromium integral no máximo duas vezes adicionais após erro comprovadamente transitório. `.github/workflows/pokedex-public-live.yml` executa os testes do classificador em PR.
- **Não alterar:** Phaser, client original, 227 VFX, Surf aprovado, Scratch/Transform adiados, capturas, Pokémon, saves, TM/HM, arte, guardião visual ou PRs #329/#360/#361.
- **Gates:** Node RED/GREEN, CI da PR, build/Chromium existentes, revisão de diff, merge apenas com checks verdes, Pages main e HTTP SHA exato. Falha persistente exige investigar asset real, não ignorar o erro.
- **Rollback:** reverter apenas o classificador e o bloco de retry dos workflows; não há migração de dados.

## T19 — plano de validação incremental (31/10/2026)
1. Produzir uma única vez a origem legítima pelo teste T20 já integrado, com `T19_EXPORT_EARNED_SAVE=1`; exportar bytes do localStorage apenas depois de Brock, Rocha e TM39 comprovados.
2. Verificar integridade SHA-256 e replay desses mesmos bytes no Chromium, sem fixtures de vitória, nível, XP ou equipe.
3. Cura pelo Centro e combate real contra o primeiro treinador de Cerulean; exigir XP, avanço do índice, badge/TM invariantes e reload persistente.
4. Em derrota ou timeout, manter resultado real e screenshot para diagnóstico, sem alterar gameplay para satisfazer o teste.
5. Não homologar Misty ou Android até evidência própria; workflow completo e Pages somente após gates verdes. Não repetir a longa corrida em toda execução.

## T19 — execução econômica pós-Brock (31/10/2026)
- Branch isolada da main `679df0b6d6714ed7348dd63265d906be508c4649`, não reexecutar o roteiro T20 de ~30–53 min: usar artifact ID 13028307911 da CI verde #41162666401, com SHA-256 e provenance verificados no teste.
- Teste incremental `tests/t19-earned-brock-five-cerulean-browser.cjs` só altera o harness; workflow `master-t19-five-earned-cerulean.yml` exige Node, npm test/check/check:reuse, build Phaser, cinco lutas Chromium, suíte browser completa e guardião PR. Falha real continua vermelha e screenshot preservada.
- Rollback: remover workflow/teste, nenhum save/runtime alterado. Artefato expira em 21 dias; uma execução futura precisa gerar nova origem natural verificada, não inventar save.
