# Especificação — Arena compacta + refinamento visual da campanha (05/11/2026)

## Objetivo e critérios de aceite

**Arena:** apenas na cena nativa `seleccion`, mostrar exatamente **8 Pokémon por página (4 colunas × 2 linhas)**. Preservar as setas anteriores/próximas, o contador de página, a seleção por toque/teclado e a possibilidade de alcançar todo o elenco. **Não** alterar sprites, escala interna de combate, HUD, arena de luta, golpes, kits ou cooldowns.

**Campanha:** padronizar visual de painéis pixel art sem alterar a experiência de combate. Cobrir Pokédex, Equipe, PC, Poké Mart, Bolsa, Sumário, Remédios, ginásios, insígnias, captura, Centro Pokémon, laboratório, revanches e telas complementares. Preservar cards e sprites aprovados dos treinadores e seus eventos/callbacks.

## Restrições permanentes

- A campanha mantém sprites existentes, saves/UIDs, seleção de Pokémon, dinheiro, TMs, VS Seeker, interações e callbacks.
- A Arena recebe só redução de densidade e paginação, sem nova busca, filtros ou painel de detalhes.
- Renderização Phaser/WebGL, nearest-neighbor, sem substituição da HUD de batalha.
- Não publicar se algum teste de regressão, navegador ou proteção visual falhar.

## Evidência exigida

- Testes da transformação de `seleccion.js` e navegação física no Chromium em desktop e mobile.
- Testes Node da moldura e das interfaces de campanha; builds reais `build-preview.mjs`.
- Guardião visual desktop/mobile e QA da Pokédex, equipe, PC e loja.
- Merge somente após validações verdes. Publicação só confirmada depois do deploy GitHub Pages e da verificação de arquivo público no SHA correspondente.
