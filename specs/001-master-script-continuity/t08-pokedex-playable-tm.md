# T08 — Pokédex de TMs com efeitos realmente utilizáveis (31/10/2026)

## Spec
Problema: a listagem de golpes de TM da Pokédex derivava apenas de compatibilidade FRLG + presença de um item na biblioteca, podendo anunciar renderizador ainda pendente, não aprovado, indisponível ou sem forma. Isto não concede a TM, mas induz o jogador a acreditar que ela poderá ser equipada. Critério de aceite: as linhas `method: 'TM'` são adicionadas só quando há VFX instalado e disponível, sem aprovação pendente; a compatibilidade FRLG é preservada. Nenhuma TM é ensinada ou removida do inventário por esta consulta.

## Plano
- Alterar exclusivamente o filtro de publicação TM em `torre2-move-pool.js`, sem mudar `availableMoves`, controles de ataque, saves, catálogos, animações e timing.
- Manter Surf aprovado como VFX, mas sem conceder automaticamente sua HM. Não alterar Scratch ou Transform.
- Auditar 150 espécies de campanha, cruzando cada TM anunciada com `TEST_LIBRARY`, `isPendingApprovalMove`, indisponibilidade e compatibilidade real.
- Aproveitar CI existente de `pokedex-151-legal-kits.yml` (suíte, build, Chromium, checks e revisão visual), sem criar fluxo duplicado.

## Tarefas e evidências
- [x] Verificado código da `main` após PR #382 e verificado o filtro anterior em `campaignLearnset`.
- [x] Filtro e regressão da matriz criados na branch `fix/t08-dex-tm-approved-renderers-20261030`.
- [ ] Testes compilados dos 150 Pokémon e regressões de browser concluídos na CI exata da branch.
- [ ] Revisão de diff, merge, CI `main`, Pages com HTTP confirmado para SHA mesclado.
- [ ] Jogo completo até Campeão, energia natural para cada ULT e Android físico continuam pendentes, fora do escopo deste patch.

Risco: o filtro pode retirar uma linha TM sem VFX realmente disponível — resultado intencional, sem afetar os dados oficiais nem as técnicas já conquistadas. Sem substituições de efeitos aprovados.
