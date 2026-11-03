# T52 — Rota 2 fiel à imagem original

Arte homologada `assets/ui/kanto-approved-maps/kanto/route-2.webp` (1280×720), ID `route-2`, índice 1 do catálogo de 60, sem modificação de bytes.

## Interações desenhadas sobre a arte
- **Norte, PEWTER CITY:** hotspot `pewter` em x=.546, y=.069, largura=.145, altura=.122; destino real `pewter-city` já conectado no grafo aprovado. O acesso continua respeitando os controles de etapa da campanha.
- **Sul, VIRIDIAN FOREST:** hotspot `forest` em x=.480, y=.932, largura=.175, altura=.118; área identificada **sem destino ativado**, pois `viridian-forest` ainda não foi aprovada como WebP individual. O clique informa que a integração ainda está pendente; não abre Pewter como substituto.
- **Esquerda, DIGLETT'S CAVE:** entrada desenhada na arte, mas sem cenário correspondente no acervo atual; fica decorativa, sem evento/recompensa/teleporte inventado.

## Ordem obrigatória
Pallet Town → Rota 1 → Viridian City → **Rota 2 → Viridian Forest** → Pewter City/Brock. Rota 22 como opção lateral. A floresta precisa ser incluída antes de desbloquear a campanha visual do estágio zero; o atlas de 60 sozinho não permite alterar isso.

## Gates
Os dois hotspots são verificados por AABB, clique Phaser simulado, adjacência e travamento explícito da saída ausente. Os 60 WebP continuam com o mesmo SHA-256 e os saves não são modificados. Ainda falta validar a travessia real quando as quatro artes obrigatórias estiverem prontas.
