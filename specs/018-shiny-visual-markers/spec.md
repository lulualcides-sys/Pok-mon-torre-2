# T17 — Marcadores Shiny visíveis na UI nativa (sem mudar sprites)
## Requisitos
- Um indivíduo com `member.shiny === true` exibe `✦ SHINY` no sumário.
- No Dex, `dexShinyCaught` distingue captura Shiny; `dexShinySeen` indica avistamento, sem premiar captura; `dexCaught` regular mantém seu `★`.
- Menu, fullscreen, 4 slots, equip, rota, sprites PMD, VFX, saves e Arena não sofrem mudanças.
- Legível no Chromium mobile 854x480 e sem write em localStorage pela consulta.
## Limites
- Esta PR NÃO implementa arte Shiny canônica nem estrelas animadas de 1,5s. Essas dependem de licenças e testes de VFX na PR histórica #17.
- O teste usa fixture de save preparada e não prova Shiny natural em RNG. A PR #389 T17 trabalha a mecânica de sorteio separadamente.
