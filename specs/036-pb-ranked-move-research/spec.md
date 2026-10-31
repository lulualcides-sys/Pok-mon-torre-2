# T36 — Auditoria massiva de golpes PB Ranked

Objetivo: tornar 283 nomes de golpes públicos pesquisáveis, comparáveis e auditáveis sem alterar o motor Phaser do Pokémon Torre 2.

## Critérios de aceite
- 283 nomes únicos, 245 no elenco público, 38 somente no AST; 70 com uso relatado, 10 com evidência fraca.
- Catálogo normalizado e comparação com 165 fontes P2 atuais, sem afirmar ausência no jogo quando não consta da lista.
- Preservação prioritária dos golpes aprovados e baseline; nenhum VFX sobrescrito.
- Exportação offline JSON, Markdown e HTML filtrável e acessível.
- Testes de integridade, duplicatas, não-mutação, proteção e segurança de HTML; CI verde no SHA do PR.
- Distinção explícita entre metadado, uso relatado, animação comprovada e publicação.

Fora de escopo: copiar código, VFX ou sprites de terceiros; implementar os 283 golpes, alterar saves/capturas/movesets, liberar ULT antecipadamente, mexer em campanhas ou publicar novos assets.
