# Tarefas — 001 / Superpowers + Spec Kit
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
