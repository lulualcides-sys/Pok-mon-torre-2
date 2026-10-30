# Tarefas — 001 / Superpowers + Spec Kit

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
