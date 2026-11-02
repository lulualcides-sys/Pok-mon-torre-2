# Plano T17 — mecanismo de dados independente da arte
- Fonte: `tools/pokearena/torre2-campaign-core.js`; reutilizar captura, migração e commit transacional existentes.
- Unitário/compilado: `tests/t17-shiny-single-roll-built.test.mjs` verifica RNG de duas chamadas, limite 1%, recarga, equipe/PC, Eevee e localStorage negado.
- Gates: npm test/check/check:reuse, compilação Phaser, teste compilado e regressão Chromium; revisar outros workflows disparados pelo core.
- Rollback: reverter somente este lote após verificação de saves e compatibilidade; não tocar PR #17 aberta enquanto arte permanecer sem homologação.
- Não integrar antes de SHA exato e todas as CI aplicáveis verdes.
