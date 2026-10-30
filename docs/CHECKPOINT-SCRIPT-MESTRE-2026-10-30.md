# Checkpoint do Script Mestre — 30/10/2026 (T07/T08 e T20)

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
