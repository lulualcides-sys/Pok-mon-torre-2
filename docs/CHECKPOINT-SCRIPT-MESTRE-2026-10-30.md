# Checkpoint do Script Mestre — 30/10/2026 (T07/T08 e T20)

## ATUALIZAÇÃO VERIFICADA — publicação T07/T08, execução T20 ativa (30/10/2026)

- **Main vigente:** `23e1e698ae5e38b1b497631f53401faa4d7d1311`, com [PR #371](https://github.com/lulualcides-sys/Pok-mon-torre-2/pull/371) integrada; CI completa T07/T08 [#41115777531](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/41115777531) **success**; guardião Phaser desktop/mobile [#41115785704](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/41115785704) **success**; CI da main [#41117371766](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/41117371766) **success**. Apenas testes e workflow na PR #371, **nenhuma alteração de gameplay**.
- **Publicado com HTTP comprovado:** [Pages #41117424694](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/41117424694) **success**, HTTP `src-bcb09bb0d1`, `PASS_PUBLIC_POKEDEX_RELEASE`. Auditoria independente [#41118798835](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/41118798835) **success**. Publicação dessa main verificada, não da PR #369.
- **T07/T08 provado no Chromium:** duas execuções independentes de 3 treinadores reais (Pidgey, Rattata, Metapod), Bulbasaur Lv5→Lv8 com 602 XP reais; em uma o save foi recarregado sem mudar EXP/UID, os controles manuais funcionaram após desligar AUTO pelo botão Phaser, e o golpe `ULT · Solar Beam` foi **executado 1 vez** no **modo Treinamento** com medidor nativo cheio. **Não** comprova ULT disparada em batalha normal com medidor ganho por combate. AUTO continua ligado por padrão. Matriz compilada 150 espécies de campanha × 8 níveis = 1.200 verificações, 149 ULTs temáticas, Ditto como exceção, **não são 150 partidas naturais** nem teste Android físico.
- **T20 ainda PARCIAL:** PR antiga [#329](https://github.com/lulualcides-sys/Pok-mon-torre-2/pull/329) **fechada sem merge**; sucessora ativa [#369](https://github.com/lulualcides-sys/Pok-mon-torre-2/pull/369), **draft**, HEAD `64947675aed5bd226e16be499546608e09eff84e` (somente teste + workflow). CI antiga [#41109051839](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/41109051839) fez 13 treinadores reais, capturas legítimas e chegou a Brock, mas ficou presa no Onix após Geodude derrotado; outra [#41110958613](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/41110958613) venceu 12 treinadores, com capturas/Beedrill por evolução, mas teve quatro derrotas reais e parou antes do rival. **Sem Rocha nem TM39 comprovados**.
- **Em validação, não afirmar sucesso:** CI T20 de HEAD `64947675` [#41117255105](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/41117255105) ainda **em execução na última consulta**; guardião visual [#41117265664](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/41117265664) **success**. O teste concede até 3 novas tentativas reais por treinador e 7 derrotas ao todo, Centro Pokémon e ganho de XP em batalhas selvagens, sem injetar HP, XP, RNG, vitórias, insígnias ou TMs.
- **Próxima ação:** ler logs/artefatos da #41117255105, diagnosticar e corrigir apenas falhas reais, comprovar 13 treinadores + Brock + Rocha + TM39 no mesmo save; só depois merge T20 e Pages HTTP da main integrada. Preservar Surf, VFX, sprites, saves e política de golpes; Scratch/Transform adiados. A jornada Pallet→Campeão sem checkpoint ainda não foi homologada.

Histórico abaixo é anterior a esta atualização; suas menções a PR #329 pendente e CI antiga são informações da época, não o estado atual.


**Escopo:** somente evidências e pendências verificadas. Este arquivo NÃO certifica conclusão das 37 seções, nem publicação de uma execução pendente.

## T07/T08 — três iniciais: nível 5 → 8 por XP real

- **Integrado:** [PR #327](https://github.com/lulualcides-sys/Pok-mon-torre-2/pull/327), squash `412e639d799bcbfdd3286eed84b782a6cdd028f6`. **CI verde**: [#40999290700](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/40999290700). Charmander e Squirtle ganharam experiência em três lutas de rota reais pelo modo AUTO Phaser, desbloquearam a ULT reduzida Lv8, preservaram a progressão e o slot E após reload. Bulbasaur já tinha teste integrado em [PR #321](https://github.com/lulualcides-sys/Pok-mon-torre-2/pull/321).
- **Limite essencial:** o teste confirma que a ULT está **equipada e visível**, mas não que foi **disparada** no combate seguinte. A energia especial real ainda estava baixa, sem injeção de medidor; `ultCast:false` foi documentado nos logs. Teste de uso real da ULT com medidor carregado naturalmente fica pendente.
- **Defeito revelado pelo relatório T08:** o kit de Charmander Lv5 ainda é **Ember / Struggle 2 / Struggle 3**, em vez de três técnicas variadas da própria espécie. Não chamar a regra dos três golpes do Script Mestre de concluída. `Scratch` continua expressamente adiado no overlay atual; não antecipar `Metal Claw` Lv13 ou inventar um renderer apenas para esconder as lacunas.
- Squirtle tem **Tackle / Bubble / Water Gun** no Lv5; este checkpoint não altera essas artes aprovadas, nem o Surf (aprovado pelo usuário, com política de TM/HM da campanha a tratar separadamente).

## T20 — jornada real até Brock, ainda PARCIAL

- [PR #328](https://github.com/lulualcides-sys/Pok-mon-torre-2/pull/328) integrada: oito vitórias com inicial da fábrica de produção, XP/ULT, save persistente, sem equipe de Mewtwo laboratório. Não equivale a vencer Brock ou toda a campanha.
- [PR #329](https://github.com/lulualcides-sys/Pok-mon-torre-2/pull/329) **ainda não integrada neste checkpoint**: a primeira CI [#40990285269](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/40990285269) parou com derrota legítima na Rocket; a segunda [#40991020627](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/40991020627) chegou a **10 vitórias** mas a batalha 11 não terminou em quatro minutos, com Bulbasaur/Pikachu desmaiados (100% de HP somente no Nidoran ativo).
- **Correção de teste, sem tocar no runtime:** commit `a8ce906a01b889999cb2795a4f27a111f402dd0d` na PR #329 faz o navegador clicar no **Centro Pokémon real** entre lutas sempre que algum integrante da equipe está ferido. Verifica que a cura não altera índice de treinador, dinheiro, Pokébolas, vitórias nem derrotas. Validação: [CI #41001229488](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/41001229488). **Não marcar sucesso antes da conclusão verde e dos logs de 13 treinadores + Brock**.

## Ordem de continuidade

1. Conferir resultado final da CI #41001229488. Se falhar, examinar logs + artefatos no ponto preciso, sem mascarar derrotas ou injetar HP/XP/vitórias. Ajustar apenas o defeito comprovado; nova CI no commit corrigido.
2. Se as 13 lutas e Brock passarem naturalmente: revisar gates, atualizar PR #329 e integrar quando testada em main; verificar Pages e HTTP público no SHA, sem confundir teste com publicação.
3. T07/T08: obter prova de uso real da ULT sob medidor **carregado legitimamente**. Tratar ataques provisórios de Charmander sem quebrar política atual do Scratch, limites de nível e necessidade de aprovação de VFX.
4. Somente depois de estabilizar Kanto, retomar Johto conforme [auditoria dos 86 movimentos](AUDITORIA-JOHTO-86-GOLPES-2026-10-30.md): priorizar reutilização, não implementar os 46 golpes não localizados automaticamente.
5. **Pallet → Campeão sem checkpoint e Android físico ainda NÃO testados integralmente**. Não declarar o Script Mestre concluído.

## Invariantes obrigatórias

Preservar 151 Pokémon e 121 kits da Arena, efeitos aprovados (incluindo Surf, Seismic Toss e os VFX da biblioteca), saves, identidade UID, captura Gen III, habilidades de nível/ULT, 60 FPS como objetivo e nenhuma simulação artificial de vitória ou progresso.
