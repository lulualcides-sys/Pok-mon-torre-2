# Checklist T31 — estabilidade
- [x] Inspecionar HEAD, PRs concorrentes, Script Mestre e módulos impactados; escolher três módulos independentes.
- [x] Adicionar oito cenários de regressão RED, sem alterar a mecânica no primeiro commit.
- [ ] Confirmar RED executado em CI ou runner validado.
- [ ] Aplicar guards e correlação por UID, preservando comportamento válido.
- [ ] Confirmar GREEN e testes focados.
- [ ] Confirmar npm test/check/check:reuse, build e Chromium Phaser, guardião visual.
- [ ] Revisar HEAD da main, PR e integrar somente se verdes.
- [ ] Confirmar GitHub Pages e HTTP no SHA exato do merge.
- [ ] Atualizar controle das 37 seções apenas com evidências verificadas; jogo completo/Android continuam parciais.
