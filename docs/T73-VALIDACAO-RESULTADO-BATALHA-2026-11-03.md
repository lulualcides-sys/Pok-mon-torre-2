# T73 — Rejeição de resultados antigos de batalha

**Somente homologação** — base `test/homologacao-kanto-20261103`. Preservar os 60 mapas originais. Sem merge para `main` e sem deploy.

## Falha comprovada no código T72
Em `Campanha.create()`, qualquer evento de resultado com `marker.stage===state.stage` e `marker.trainer===state.trainer` executava `resolveBattle` caso não passasse na condição `marker.kind==='wild'&&pendingWild.id===marker.id`. Isso **convertia um resultado de selvagem expirado (inclusive após a captura) em vitória ou derrota de treinador**, e podia avançar indevidamente um líder, gerar dinheiro, insígnia ou TM.

## Correção e segurança
- `torre2-battle-result-validation.js` classifica resultados em `trainer`, `wild`, `rematch` ou `null`; é pura e não salva nem gera recompensas.
- **Treinador:** exige `marker.kind==='trainer'`, mesma etapa e índice, campanha não finalizada.
- **Selvagem:** exige `kind==='wild'`, espécie pendente idêntica, mesma etapa/treinador e o **contador do encontro** persistido `wildEncountersStage`. O marcador em `startWildBattle()` passa esse contador sem modificar o esquema do save. Um selvagem da mesma espécie em outro encontro não consegue reutilizar um resultado obsoleto.
- **Revanche:** mantém a validação nativa do ticket único `validRematchResult`; ticket ausente ou obsoleto é rejeitado.
- Resultado inválido é ignorado **antes de aplicar HP/status**, sem chamar `resolveBattle` ou `resolveWildBattle`, sem relatório de vitória e sem gravar dinheiro/XP/insígnia.
- Módulo incluído explicitamente no pacote Phaser e no fingerprint de cache. Testes T73 no T41 e verificação de build impedem importar um módulo que não foi copiado.

## Limites da validação
O cenário de navegador injeta exclusivamente um **resultado selvagem inválido** em uma fixture de Vermilion, verifica que o checkpoint não muda e que nenhuma falsa vitória é exibida. Os testes unitários cobrem também selvagens válidos, reuso da mesma espécie, marcadores de treinador e tickets de revanche. Isso **não** é uma batalha jogada naturalmente, não comprova uma jornada completa e não altera o usuário real. As 60 WebPs e os sprites permanecem inalterados.

**Portão para avançar:** T41 PASS, Guardião Visual PASS e build desktop/mobile de homologação PASS no SHA final. Apenas branch de testes, nunca a produção sem aprovação final expressa.
