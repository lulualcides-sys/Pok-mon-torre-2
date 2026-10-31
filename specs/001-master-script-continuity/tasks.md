# Tarefas — 001 / Superpowers + Spec Kit

## T19 — cinco treinadores e Misty (31/10/2026)
- [x] CI #41178359400 SUCCESS, save genuíno #13033958812, #400 integrada.
- [x] Criar teste e workflow isolados, sem manipular progresso.
- [ ] Validar cinco treinadores, Misty, Cascata, TM03, XP, reload e hash em Chromium real; investigar logs/screenshots se falhar.
- [ ] Exigir CI completa, revisão, merge e Pages HTTP do SHA final.
- [ ] Próxima frente diferente: T31 #402, não T10.


## T19 — dez Cerulean, HEAD sincronizado (31/10/2026)
- [x] CI natural #41174200072, visual #41174210095, T25 #41174210051 SUCCESS no HEAD antigo; artifact #13032891442.
- [x] Sincronizar PR #400 sem force com main que contém #396 e #401.
- [ ] CI/Chromium do HEAD combinado, revisão, merge e Pages HTTP exato.
- [ ] T19 Misty/Cascata/TM03 em save legítimo, sem fixture de vitórias.


## T08 — corrigir metadado de poder em golpes de treino (31/10/2026)
- [x] Reproduzir em módulo real isolado: `dano` baixo com `poder` 130/150 nos slots Lv5 e Lv8 (RED).
- [x] Adicionar regressão `tests/kanto-intro-moves.test.js` (`83106e92`) e corrigir apenas o clone de treino (`110cc7d2`); GREEN isolado [40,40,40,60].
- [ ] Executar gates completos e Chromium no HEAD final, revisar, mesclar somente verde e comprovar Pages HTTP do SHA integrado.
- [ ] Frente seguinte DIFERENTE: T31 diagnóstico de carregamento ou T19 Cerulean, sem reabrir T10.


## Lote T22 — rematch legado (31/10/2026)
- [x] Reproduzir RED: pendência sem token trava recarga, valida resultado falso e lança exceção em ticket nulo.
- [x] Corrigir token durável e testar oito verificações focadas GREEN; preserva saves e combate.
- [ ] CI completa no HEAD final, Chromium desktop/mobile, guardião e revisão; merge só com gates verdes.
- [ ] Pages/HTTP SHA após merge; não declarar publicado antes.
- [ ] Próxima frente independente T19 pós-Brock→Misty.

## Checkpoint T20 após integração — 31/10/2026
- [x] Corrida real Pallet→Brock concluída: 13 treinadores, captura de Spearow/Geodude, Brock, Rocha e TM Rock Tomb (CI #41153415212).
- [x] Guardião visual #41153419869 e testes nativos da branch concluídos com sucesso.
- [x] PR #369 incorporada à main em `1fcc64eb53407b535cc8919832bacbfd492c7354`.
- [ ] Verificar CI pós-merge e Pages HTTP do SHA correspondente na main; sem isso não afirmar nova publicação.
- [ ] Continuar T19 de Rocha até Misty com progressão natural no mesmo save, registrar Cascata/TM e cobertura de navegação/evolução/capturas/PC.
- [ ] Completar Pallet→Campeão em um save real; não marcar as 37 seções como concluídas.


## Lote T03 — Eevee legado sem UID (30/10/2026)
- [x] Localizar bloqueio no código da main `be1d230c` e isolar escopo sem conflito com PRs #369/#381.
- [x] Preparar teste de regressão e correção focada para Eevee legado na equipe/PC, colisão de UID e gravação negada; **nenhuma execução ainda declarada**.
- [ ] Executar CI do HEAD exato: npm test/check/check:reuse, build, testes compilados, Chromium real e guardião visual.
- [ ] Revisar PR, compatibilidade com main, merge somente verde e confirmar Pages HTTP do SHA integrado.
- [ ] Validar evolução em jornada natural, além das fixtures; T03 e 37 seções seguem parciais.


## Lote validado 30/10/2026 — T07/T08 integrada e T20 ainda em teste

- [x] **T07/T08 PR #371 integrada:** main `23e1e698ae5e38b1b497631f53401faa4d7d1311`; CI de provas reais [#41115777531](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/41115777531) e guardião [#41115785704](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/41115785704) `success`. Dois testes antigos corrigidos: AUTO ON nas lutas, mudança por botão para controle manual, evolução Caterpie→Metapod correta.
- [x] **Experiência e ULT real verificadas:** em duas execuções independentes, Bulbasaur Lv5→Lv8 por três vitórias nativas. Uma ULT Solar Beam disparada no modo Treinamento com medidor cheio **do próprio jogo**, sem energia/XP artificial; save e controles funcionais. Energia naturalmente carregada **na batalha normal** continua sem prova.
- [x] **Cobertura compilada:** 150 espécies de campanha com 8 checkpoints, 149 ULTs temáticas, Ditto exceção, biblioteca ≥227 efeitos. Não afirmar 150 partidas naturais nem Android físico.
- [x] **Publicação HTTP da main T07/T08:** Pages [#41117424694](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/41117424694) `success`, `src-bcb09bb0d1`, `PASS_PUBLIC_POKEDEX_RELEASE`; auditoria pública [#41118798835](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/41118798835) `success`.
- [x] **T20: diagnosticar duas falhas antigas** [#41109051839](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/41109051839) (13 treinadores, Brock travou em Onix) e [#41110958613](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/41110958613) (12 treinadores, 4 derrotas reais, sem Brock); manter resultados naturais, sem fabricar vitórias.
- [x] **T20 HEAD `64947675`:** roteiro isolado permite recuperação real por checkpoint e XP obtido em batalhas, sem modificar o runtime; guardião [#41117265664](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/41117265664) `success`.
- [ ] **Consultar conclusão da CI T20 atual** [#41117255105](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/41117255105); sem conclusão na última verificação; não reaproveitar a CI de HEAD anterior.
- [ ] **13 treinadores + Brock, Rocha e TM39** legitimamente comprovados, PR #369 mergeada com gates completos e Pages HTTP do SHA novo, sem conflitos com a main.
- [ ] **Campanha completa e 151 partidas naturais:** Pallet→Campeão sem fixture e ULT de cada espécie em combate normal; Android físico ainda não homologados.

Os lotes históricos abaixo mantêm o estado original registrado na época; itens `[ ]` sobre PR #368/#365 e #329 não prevalecem sobre os merges e o fechamento posteriormente comprovados.


## Lote de continuidade T20 — 30/10/2026, PR #369 (evidências recentes)

- [x] Conferir main `7f13aff`, PR #368 integrada, Pages #41104806619 **success** com HTTP `src-5f26a94885`; preservar os efeitos e saves existentes.
- [x] Fechar a PR #329 sem merge após falhas verificadas; abrir a PR #369 sobre main atual, sem reverter os patches aprovados.
- [x] Reproduzir e registrar falha de captura esgotada na CI #41107213221 (após 5 treinadores reais); criar teste de fuga RUN nativa `aba07c4` e instrumentação passiva `c3571f8`, sem alteração de runtime.
- [x] Guardião visual #41110964852 **success** para `c3571f8` (teste estático e Phaser desktop/mobile).
- [ ] **Aguardar conclusão real, ler log/artifacts e diagnosticar** CI T20 do mesmo HEAD #41110958613; não usar workflow do commit anterior como evidência atual.
- [ ] Comprovar com Chromium 13 treinadores + Brock, Rocha e TM39 com vitórias legítimas; corrigir somente causas reproduzidas de timeout, sem alterar RNG/XP/HP/AI às cegas.
- [ ] Completar gates de PR #369, merge e novo Pages com checagem pública de SHA; só então avançar à próxima etapa T20.
- [ ] Continuar T07/T08: 151 espécies e ULT verdadeiramente disparada com energia natural, sem desfazer a correção pontual da PR #368.


## Lote T08 — ULT preferida excluída, PR #368 (30/10)

- [x] Revalidar main `a1aada1e`, PRs concorrentes, política integral de quatro fontes, Surf aprovado e Scratch/Transform adiados; não criar VFX.
- [x] Reproduzir RED com código-fonte real: Tackle, Surf, Scratch e Transform entram pela preferência explícita antes da correção; adicionar regressão (`2aeff6de`).
- [x] Aplicar gate canônico compartilhado (`aa0cd1c0`), executar harness isolado de 19 testes do arquivo (19/19 verdes) e revisar diff de três arquivos.
- [ ] CI HEAD PR #368: `npm test`, `check`, `check:reuse`, build, Chromium e guardião visual completos e verdes.
- [ ] Revisar compatibilidade com main atual, merge somente após gates verdes e confirmar Pages/HTTP SHA exato.
- [ ] Validar 151 kits e ULT com energia em partidas naturais; Brock/T20 e 37 seções seguem parciais.


## Lote 30/10 — 503 isolado na auditoria independente
- [x] Diagnosticar RED real #41091689377: único HTTP 503 em `src-78948ecbc5/red.js`; ausência de erro Phaser; Pages #41090646026 aprovado para mesmo release.
- [x] Reusar classificador/testes estritos existentes e adicionar loop de até 3 auditorias completas no workflow independente, sem alterar runtime.
- [ ] CI de PR: teste do classificador, Chromium, testes aplicáveis, revisão e compatibilidade com main.
- [ ] Integrar somente com gates verdes; confirmar Pages HTTP no SHA integrado e auditoria independente sem erro.
- [ ] Retomar T07/T08 natural e T20; não homologar 151 partidas ou Brock por fixtures.


## Lote T07/T08 — VFX sem aprovação não entra no Lv5/ULT (30/10/2026)
- [x] Inspecionar AGENTS, política integral, 4-fontes exigidas para **novo VFX** (não criado aqui), Script Mestre, fila, Spec Kit, main, PRs e Pages.
- [x] Escrever regressões antes do patch: CI #41084164169 **RED** por duas assertivas (renderer FRLG e contato Struggle não aprovados).
- [x] Corrigir somente `introRenderable` para exigir `approved===true` quando `source==='new-phaser-fx'`; SHA `4070ccbfb4f7d3489fa4290633af981a12dea692`.
- [ ] CI de branch final: `npm test`, `check`, `check:reuse`, build, matriz 151, Chromium real e guardião visual verdes.
- [ ] Revisão, compatibilidade com main atual, merge da PR #365 apenas após todos os gates verdes.
- [ ] Pages deploy do SHA integrado + confirmação HTTP no endereço público correto.
- [ ] Provar ULT com energia natural e três técnicas autênticas Lv5 para 151; campanha longa e Brock ainda pendentes.


## Lote 30/10 — diagnóstico de boot público
- [x] Reproduzir evidência da falha externa: CI #41050887159 (`waitForFunction` 90 s, sem artifact) versus Pages #41050085664 verde e versão pública `src-dc921f3851`.
- [x] Acrescentar captura de estado Phaser/erros/rede e screenshot antes de relançar o timeout; verificar sintaxe JavaScript.
- [ ] Revisão e CI Chromium do PR desta branch.
- [ ] Diagnosticar a causa real com o novo artifact e corrigir se necessário; não confundir timeout com falta de 150 kits.
- [ ] Comprovar auditoria pública integral, sem falha, no SHA publicado.
Critério para `[x]`: arquivo/ação verificado neste PR. **Nenhuma tarefa funcional é concluída só pela criação destes documentos.**

## Integração documental (este PR)
- [x] T001 — Auditar `AGENTS.md`, Script Mestre, controle, fila, checkpoint e status da PR #329.
- [x] T002 — Criar `.specify/memory/constitution.md` com precedência e garantias de não regressão.
- [x] T003 — Criar `spec.md` e `plan.md` ancorados no Script Mestre existente.
- [x] T004 — Adicionar esta fila com critérios e evidências, sem declarar conclusão das 37 seções.
- [x] T005 — Atualizar `AGENTS.md` para invocar Superpowers e Spec Kit por padrão.
- [ ] T006 — Conferir arquivos e integridade documental no GitHub, revisar diff e abrir PR.
- [ ] T007 — Conferir checks do PR e integrar apenas quando validado; não afirmar Pages antes de prova.

## Continuação funcional (fora do escopo deste PR; manter na fila principal)
- [ ] T020-A — Ler logs/artefatos da CI #41028820921 da PR #329 e localizar causa comprovada.
- [ ] T020-B — Validar 13 treinadores, capturas, Centro Pokémon e Brock em batalha natural, sem fixture que injete resultados.
- [ ] T020-C — Verificar CI, merge e Pages por SHA exato após T020-B.
- [ ] T007/008-A — Demonstrar uso da ULT Lv8 com energia ganha legitimamente e save/reload.
- [ ] T007/008-B — Resolver alternativas Lv5 de Charmander mediante política integral de golpes e aprovações.
- [ ] T020-D — Continuar Pallet→Campeão pelo mesmo save; Android físico permanece pendente.

## Evidências consultadas em 2026-10-30
- `main` em `c02ad0a77ee32c2f16be5d57c47420b055192a23` na inspeção inicial.
- PR #329: `b386d3ca6092e2847aac7649286326c9f1d642dc` no momento da inspeção; CI [#41028820921](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/41028820921) com resultado `failure`. Estado sujeito a alterações concorrentes.
- `docs/CHECKPOINT-SCRIPT-MESTRE-2026-10-30.md`: §20 e T07/T08 parciais. Não usar o resultado antigo de CI como se fosse o mais recente sem nova consulta.

**Atualização posterior:** só marcar T005–T007 como concluídos após verificar cada etapa. Nenhum `[x]` acima significa implementação de gameplay.

## Lote T07/T08 — Surf aprovado / HM separado (30/10/2026)
- [x] Diagnóstico: política integral e mensagens do teste ainda chamavam Surf de reprovado, contradizendo aprovação mais recente.
- [x] Patch proposto: manter o VFX aprovado, atualizar política/comentários/nomes do gate e acrescentar assertiva de imutabilidade do renderer no teste compilado.
- [ ] CI `npm test`/`check`/`check:reuse`/build/Chromium do SHA da PR integralmente verde.
- [ ] Revisão, merge e verificação Pages HTTP do SHA exato, caso haja publicação.
- [ ] Prova de ULT com medidor ganho em combate natural e 13 treinadores + Brock: continuam pendentes, sem confundir este patch com homologação.


## Lote 30/10 — Pages 503 isolado, sem enfraquecer publicação

- [x] Identificar no log Pages #41072227909 a falha HTTP 503 de `laboratory.js` com `src-616165d778`, e comparar com auditoria independente #41072786298 verde no mesmo HEAD.
- [x] Criar classificador conservador e testes Node para 503 isolado, 404/500, origem incorreta, erros Phaser e falha de requisição adicional; integrar retry com limite três no workflow.
- [x] PR #362: CI #41075928453 **success** (classificador Node, npm test/check/check:reuse, build e Chromium público); guardião visual #41075928433 **success** (arte estática e screenshots Phaser).
- [ ] Revisar diff, compatibilidade com HEAD e mesclar somente após todos os gates aplicáveis verdes.
- [ ] Verificar novo Pages completo e HTTP público no SHA exato; manter T07/T08, T20 e 37 seções parciais até prova própria.

## T19 — save genuíno pós-Brock → primeiro treinador Cerulean (31/10/2026)
- [x] Implementado export opt-in dos bytes reais do save T20, SHA-256 e origem, sem mutação do save.
- [x] Criado teste Chromium independente que consome o checkpoint ganho, cura pelo Centro nativo, enfrenta o primeiro treinador da etapa 1 e verifica XP/UID/reload.
- [ ] Executar workflow T19 no HEAD da PR, revisar logs e artefatos; não afirmar vitória até CI verde.
- [ ] Estender naturalmente aos demais treinadores e Misty, Cascata e TM03 no mesmo save; sem fixtures.
- **Próxima frente distinta:** T25 PR #397 (não duplicar), depois T07/T08 lacunas comprovadas.

## T19 — cinco treinadores Cerulean sem reexecutar Brock (31/10/2026)
- [x] Verificado #398 GREEN (#41162666401, #41162678757), main anterior Pages #41166012257 com HTTP `src-3573202d00`, e merge #398 `679df0b6d6714ed7348dd63265d906be508c4649`.
- [x] Criado teste de cinco batalhas nativas + workflow com reutilização de artifact genuíno e SHA-256 estrito; sem gameplay editado.
- [ ] Aguardar CI HEAD exato e guardião; examinar logs/screenshots, corrigir somente falhas comprovadas, sem aprovar antes do resultado.
- [ ] Após prova, seguir até Misty/Cascata/TM03; não declarar rota completa nem Android físico.
