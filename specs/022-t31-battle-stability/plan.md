# Plano T31 — confiabilidade dos módulos existentes
1. Base `main` `a343714b5d0e215ead337e19d0566891d6b39b71`; branch isolada da T19 AUTO e testes Misty.
2. Adicionar testes RED em `tests/t31-battle-stability.test.js` reproduzindo as falhas sem mudar dados de jogador.
3. Corrigir três módulos já usados: `torre2-trainer-items.js`, `torre2-battle-report.js` e `torre2-weather.js`; manter percursos válidos idênticos.
4. Revisar diffs, executar gates no PR e somente integrar em main com CI/Chromium verdes, compatibilidade e publicação HTTP verificável.
5. Rollback: reverter o commit específico da PR; não restaurar arquivos de outras frentes. Sem novas dependências, licenças, sprites ou golpes.
6. Limite de ambiente: sem checkout remoto no contêiner local; teste unitário local não pode ser alegado até CI da branch executar.
