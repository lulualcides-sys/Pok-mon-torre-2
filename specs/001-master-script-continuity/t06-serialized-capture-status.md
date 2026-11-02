# T06 — Bônus de captura para status Gen III persistidos

## Problema e especificação
O cálculo FRLG `normalizedCaptureStatus` interpretava apenas rótulos textuais. O estado persistido pelo módulo `gen3-status.js` é um objeto `{kind:'dormido'|'congelado'|'veneno'|'quemado'|'paralizado', ...}`; quando um combatente expõe esse objeto como fallback, o cálculo reduzia o bônus de captura a `none` sem aviso.

## Contrato de correção
- Aceitar texto nativo OU objeto estruturado com `kind`, `nombre`, `name`, `status`, `estado`.
- `dormido` e `congelado`: 2× no fator FRLG. `veneno`, `quemado`, `paralizado`: 1,5×. Confusão e objetos desconhecidos: nenhum bônus.
- Preservar prioridade de `fighter.est` (status realmente ativo) e impedir efeitos cumulativos.
- Não alterar `CATCH_RATES`, `BALL_BONUS`, RNG/shakes, fórmula de inteiro, IDs, persistência, sprites, efeito da Pokébola, VFX, espécies ou permissão de capturar treinadores.

## Plano, testes e evidências
- [x] Inspecionar cálculo, serializer Gen III, integração Phaser e testes existentes.
- [x] Adicionar primeiro regressão para os 151 Pokémon e estados em objeto; não afirmar RED remoto sem CI anterior.
- [x] Corrigir apenas o parser de status em `torre2-capture-mechanics.js`.
- [x] Adicionar gatilho `pull_request` ao workflow T06 existente para unidades, build Phaser e testes Chromium de captura; não criar CI duplicada.
- [ ] CI T06 (unitários 151, `npm test`, `check`, `check:reuse`, navegador), guardião visual e verificação de diffs aprovados.
- [ ] Merge somente com todos os gates verdes e compatibilidade com `main`.
- [ ] Confirmar Pages e SHA público, sem tratar smoke de Chromium como campanha inteira.

Não há modificação na biblioteca de golpes e não são criados VFX novos. Reverter exclusivamente o diff deste lote se houver regressão.
