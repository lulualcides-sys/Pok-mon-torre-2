# T83 — Porta de entrada real Celadon → VS Seeker → Poké Mart

## Causa registrada

Em `tests/surge-shop-rematch-browser.cjs`, o teste criava uma fixture de campanha no estágio 3 e aguardava diretamente `__torre2BattlePath.stage===3`. Na homologação atual, o Phaser apresenta primeiro o mapa original aprovado `celadon-city`. O timeout de 60 segundos bloqueava tanto a auditoria VS Seeker quanto os sprites FireRed do Mart sem executá-las.

## Mudança isolada

1. O Chromium espera a vista real `celadon-city` e o botão Phaser `torre2-approved-exit`.
2. Clica no botão real respeitando o ajuste 16:9 do canvas.
3. Exige a BattlePath de estágio 3 com botão VS Seeker ativo.
4. Confirma que sair do mapa não altera o save.
5. Executa o restante do teste original: atlas, mapa Brock, item sprites FRLG, TMs e erros do runtime.

Somente teste + documento. Não alteramos gameplay, 60 imagens aprovadas, battle checkpoints, receitas, sprites ou progressão. O cenário segue fixture controlada, não história concluída naturalmente.

## Regras de promoção

Exigir sucesso do teste navegador e Guardião Visual no mesmo SHA; merge somente em `test/homologacao-kanto-20261103`. Não publicar produção (`main`, GitHub Pages) sem aprovação expressa do usuário.