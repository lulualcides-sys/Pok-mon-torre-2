# Tarefas e gates
- [x] Inspecionar HEAD, PRs concorrentes e contrato do AUTO/campanha.
- [x] Corrigir filtro de `mega:false` fora da campanha e criar perfil extremo isolado.
- [x] Preparar testes unitários e teste real Chromium Magikarp → Gyarados.
- [x] Testes unitários executados com êxito na CI T10/T27 #41758133987, job #126339019115.
- [x] Build Phaser/WebGL e Chromium VS CPU Magikarp → Gyarados executados com êxito: `AUTO_NATIVE_EVOLUTION`, mesma CI #41758133987.
- [ ] Revisão geral: regressões focadas da campanha/Arena verdes na CI T10/T27; demais gates **não verdes**: T19 #41758133951, T31 #41758133954 e T25 #41758134006 falharam no teste geral `tests/master-patch-browser.cjs:96` por timeout da cena `seleccion` após nove batalhas.
- [ ] Merge e GitHub Pages no SHA esperado (não autorizado sem gates verdes).

**Estado:** Correção e EVO real verificados na CI focada; PR #545 em rascunho aguardando revisão dos gates gerais. `main` avançou com commit de menus não combatentes independente. Merge/publicação **não realizados**. Pages `main` #41758150718 falhou em regressão de navegador.
