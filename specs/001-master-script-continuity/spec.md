# Especificação — Continuidade segura do Script Mestre com Superpowers e Spec Kit
**Identificador:** 001-master-script-continuity
**Estado:** Em andamento — documentação de fluxo; execução das seções do Script Mestre permanece parcial
**Fonte funcional:** [Script Mestre definitivo](../../docs/SCRIPT-MESTRE-DEFINITIVO-2026-10-27.md) · [controle](../../docs/CONTROLE-EXECUCAO-SCRIPT-MESTRE.md) · [fila](../../docs/FILA-CONTINUE-SCRIPT-MESTRE.md)

## Objetivo
Tornar Superpowers + metodologia Spec Kit o padrão de **todas as futuras correções, melhorias e continuações** do Pokémon Torre 2, sem reiniciar as 37 seções nem alterar a jogabilidade para introduzir apenas o processo.

## Histórias e critérios de aceite
### US1 — Um agente recebe “continue”
Dado acesso ao projeto, quando o agente recebe “continue”, ele:
1. lê `AGENTS.md`, o índice rápido, a constituição e o trecho pertinente do Script Mestre;
2. compara HEAD/main, PRs abertas, branches concorrentes, CI e checkpoint existente;
3. escolhe a primeira pendência testável e não bloqueada;
4. desenvolve em branch isolada, produz testes e evidencia resultados;
5. atualiza fila/controle **somente após** prova verificável, preservando o histórico;
6. informa PR/SHA, gates e publicação confirmada ou não confirmada.

**Aceite:** a decisão sobre a próxima tarefa cita o checkpoint e não trata falhas, fixtures, CI inconclusa ou mero commit como homologação.

### US2 — Correção de um bug da campanha ou Arena
Dado um defeito reportado, quando o agente diagnostica:
- identifica a causa e cria/atualiza um teste que reproduz o defeito;
- corrige apenas o necessário, confere os efeitos colaterais e os aprovados;
- submete PR com checklist de testes relevantes e diagnóstico;
- não simula vitórias, medidor de ULT, loot ou evolução para parecer que corrigiu.

**Aceite:** evidências RED/GREEN (quando tecnicamente executáveis), build/CI compatíveis e ausência de regressão observada nas áreas tocadas.

### US3 — Gestão de conflito de trabalho
Dado outro agente com PR aberta no mesmo componente, quando surge nova tarefa:
- não sobrescreve a branch concorrente nem reverte melhorias aprovadas;
- evita alterações simultâneas nos mesmos arquivos; adia ou isola a tarefa;
- registra conflito e ação escolhida.

**Aceite:** PR legível, sem histórico destruído, com comportamento preservado.

## Restrições
- A constituição em `.specify/memory/constitution.md` é complemento ao `AGENTS.md` e à política integral de golpes.
- O catálogo atual de 151 Pokémon/121 kits Arena/227 VFX e os saves existentes não serão modificados para adotar o processo.
- Surf permanece aprovado; políticas de TM/HM, Scratch e Transform exigem decisões próprias, não mudanças incidentais.
- Arquivos `spec.md`, `plan.md`, `tasks.md` representam o **formato Spec Kit**; não se afirma instalação do CLI ou execução automática.
- “Superpowers instalado no ChatGPT” não garante que outro agente/runner tenha acesso a suas skills; nesse caso a disciplina é aplicada manualmente.
- Alterações de processo não provam correção de bug, vitória em Brock, publicação no Pages ou jogo completo.

## Estado observado no início do lote (2026-10-30)
- T20: [PR #329](https://github.com/lulualcides-sys/Pok-mon-torre-2/pull/329) aberta; CI [#41028820921](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/41028820921) **failure** no SHA `b386d3ca6092e2847aac7649286326c9f1d642dc`. Não alterar essa branch neste lote; dono/execução concorrente em curso.
- T07/T08: resta provar disparo legítimo da ULT e sanar variação de técnicas Lv5 de Charmander sob política integral de VFX.
- Pallet→Campeão sem checkpoint e Android físico continuam sem validação integral.

## Fora de escopo deste lote
- Modificar o motor Phaser, alterar VFX/cooldowns/IA, reformular movesets e saves.
- Integrar uma PR de combate concorrente ou declarar o Script Mestre concluído.
- Publicar automaticamente no GitHub Pages apenas porque a documentação foi adicionada.

## Lote T07/T08 — aprovação Surf e gate HM (30/10/2026)
**Cenário:** Surf permanece no catálogo VFX aprovado, enquanto a campanha não concede HM Surf por nível, TM gravada sem liberação ou editor. Scratch/Transform seguem adiados.
**Aceite:** teste compilado preserva renderer e metadados Surf após consultas a Pokédex/moveset; nenhum save é reescrito; nenhum HM é liberado. Testes Chromium/CI completos antes de merge; este lote não valida ULT em combate nem Brock.
