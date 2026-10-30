# Plano de implementação — 001 / fluxo do Script Mestre
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
