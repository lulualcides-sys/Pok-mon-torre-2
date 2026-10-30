# Constituição do projeto — Pokémon Torre 2
<!-- Fluxo Spec Kit adaptado à estrutura já existente. Esta constituição complementa, nunca substitui, AGENTS.md e o Script Mestre. -->
**Versão:** 1.0.0 | **Adotada:** 2026-10-30 | **Escopo:** exclusivamente `lulualcides-sys/Pok-mon-torre-2`

## I. Fontes de verdade e precedência
1. Pedidos explícitos mais recentes do usuário e aprovações de golpes/efeitos prevalecem sobre anotações históricas conflitantes.
2. `AGENTS.md` e `docs/agentes/POLITICA-GOLPES-INTEGRAL.md` são as regras operacionais obrigatórias.
3. `docs/SCRIPT-MESTRE-DEFINITIVO-2026-10-27.md` é a especificação funcional principal das 37 seções.
4. `docs/CHECKPOINT-SCRIPT-MESTRE-2026-10-30.md`, `docs/CONTROLE-EXECUCAO-SCRIPT-MESTRE.md` e `docs/FILA-CONTINUE-SCRIPT-MESTRE.md` registram evidências e pendências; conferir também novos commits/PRs antes de agir.
5. `specs/` organiza próximos lotes; não autoriza contradizer o Script Mestre, aprovações ou código em produção.

## II. Preservação e compatibilidade
- Nunca refazer o jogo do zero, nem misturar com Pokémon Torre 1.
- Não alterar VFX, sprites, golpes, kits, esquivas e mecânicas aprovados sem pedido explícito.
- Preservar saves, IDs/UIDs, evolução, capturas Gen III, Pokémon, Pokédex, progressão, modos Arena/campanha e interfaces; migrations devem provar retrocompatibilidade.
- Para golpes/VFX consultar **obrigatoriamente** a política integral e as quatro fontes antes de codificar; não clonar material sem verificar origem e licença.
- Preservar Phaser/WebGL e pixel art; não implementar golpes via Canvas 2D, vídeo colado ou CSS de ataque.
- Surf é golpe aprovado; eventual política TM/HM da campanha exige patch separado. Transform e Scratch seguem adiados conforme decisões mais recentes documentadas, até nova autorização.

## III. Desenvolvimento orientado por especificações (Spec Kit)
Para cada alteração relevante, registrar ou atualizar `specs/<id>-<tema>/spec.md`, `plan.md` e `tasks.md`:
- `spec.md`: comportamento observável, cenários, critérios de aceite, restrições e não objetivos.
- `plan.md`: arquivos atuais, dependências, testes, riscos, rollback, interação com outros agentes e requisitos de licença.
- `tasks.md`: tarefas executáveis com gates verificáveis; estado `[ ]` ou `[x]` apenas com evidência.
Uma tarefa pequena pode apontar para o Script Mestre em vez de duplicá-lo. Não criar uma nova lista de 37 seções.

## IV. Execução com Superpowers
Quando os skills estão disponíveis no ambiente: seguir **brainstorming** para mudanças novas de comportamento, **systematic-debugging** para falhas, **test-driven-development** para regressões, **executing-plans** para planos aprovados, **requesting-code-review** e **verification-before-completion** antes de declarar conclusão. Se indisponíveis, aplicar os mesmos princípios manualmente, sem alegar execução do plugin.
Trabalhar em branch isolada. Não tocar em branch/PR ativa de outro agente sem coordenar. Teste falhando antes do conserto (RED), correção mínima, teste passando (GREEN), revisão e CI completa aplicável. Verificar resultado da pipeline e implantação HTTP na versão exata quando houver publicação.

## V. Verdade dos relatórios
Separar `documentado`, `implementado`, `testado em fixture`, `testado em Chromium real`, `testado em campanha natural`, `publicado e verificado`. Nunca converter teste preparado ou script executado em alegação de jornada natural ou teste em Android físico. Registrar SHA, PR, CI, evidência, bloqueios e próxima ação. Sem comprovação: `pendente/não verificado`.

## VI. Prioridade
Conferir HEAD, PRs concorrentes e CI antes de cada `continue`. Retomar a primeira pendência validável não bloqueada da fila. No checkpoint de 30/10: T20 (13 treinadores + Brock, PR #329, falhas de CI) e T07/T08 (ULT realmente disparada com medidor legítimo, 3 ataques coerentes Lv5) são parciais. A jornada natural Pallet→Campeão e Android físico ainda não têm homologação integral. Evitar alterar esses fatos sem nova prova.

## Governança
Toda mudança desta constituição exige motivo documentado, revisão de compatibilidade com `AGENTS.md` e registro de versão/data. Um agent não pode rebaixar um gate sem autorização expressa. Esta integração é **somente documentação de processo**, não instalação do CLI `specify` nem alteração do runtime.
