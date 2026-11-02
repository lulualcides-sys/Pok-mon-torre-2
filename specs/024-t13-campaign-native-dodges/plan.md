# Plano T13
1. Base main `7e1ae79f`, sem editar PRs #406/#407, nem alterar IA ofensiva.
2. Introduzir helper de seleção `campaign-native-dodges.js` que utiliza seletor aprovado da Arena com fontes nativas P2 originais.
3. Resolver ESP *depois* de selecionar os quatro golpes e previews Lv5/Lv8, para impedir duplicação; não tocar em saves.
4. Copiar helper no build original Phaser sem alterar assets/efeitos.
5. Testes puros, build 151 e Chromium mobile/desktop, incluindo troca/KO e ESP pós-reload, antes do merge.
6. Revisão de PR, todos gates, compatibilidade com main, Pages + HTTP SHA exato. Rollback pelo revert do commit.
