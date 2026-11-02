# Pokémon Torre 2 — Biblioteca visual de Kanto

Referências visuais recebidas do usuário em outubro de 2026. Arquivos mantidos **exatamente como enviados**, sem ampliar, suavizar, redesenhar ou separar frames.

## Pastas

- `maps/cities/` — 10 cidades e ilhas com ambientes e interiores visíveis na própria folha
- `maps/routes/` — Rota 24 e Rota 25 / Bill's House
- `maps/dungeons/` — Mt. Moon, Victory Road e Seafoam Islands
- `maps/locations/` — Forest, Safari, Pokémon Tower, Team Rocket, Power Plant, Silph Co., Porto/S.S. Anne e Indigo Plateau
- `characters/players/` — Red e Leaf
- `characters/trainers/` — sprites de treinadores para batalha
- `characters/overworld/` — sprites de NPCs e personagens para ambientes
- `ui/` — screenshot do layout do jogo usado como referência, não como textura
- `manifest.json` — índice completo com arquivo, tamanho, hash SHA-256 e original

## Como procurar

Para localizar uma cidade ou sprite, busque pelo nome em inglês no `manifest.json`. Para abrir uma folha, acesse a pasta correspondente no GitHub.

## Como integrar

Esta pasta contém **referências de arte**, não substitui os arquivos de produção. Para implementação, use crops/tilemaps apropriados (16 px quando couber), `nearest-neighbor`, recorte preciso por mapa/interior e hotspots por local, com controles de toque/clique. A entrada em Poké Mart / casas / Centros não é desbloqueada só por salvar o PNG. **Preserve os golpes aprovados e a lógica da Arena 2D.**

## Fontes adicionais

- [The Spriters Resource — catálogo de jogos](https://www.spriters-resource.com/browse/games/page-1/?tags%5B1%5D%5B0%5D=309) — consultar individualmente apenas o que faltar; não foi feito download em massa e o acervo externo não foi importado.

## Direitos

Estas imagens foram enviadas pelo usuário como referência. Os elementos Pokémon/FireRed/Emerald geralmente pertencem à Nintendo, Game Freak e/ou a seus respectivos artistas. **Repositório público significa redistribuição**: verifique direitos/licenças antes de republicar assets de terceiros; atribuição por si só não é uma licença. Não declarar o pacote como CC0 ou próprio.