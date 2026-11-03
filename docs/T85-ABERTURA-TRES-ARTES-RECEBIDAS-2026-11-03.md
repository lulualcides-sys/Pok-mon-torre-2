# T85 — Recebimento de três artes da abertura Kanto (03/11/2026)

**Escopo:** somente preview e futura homologação. **Não publicar em `main` nem sobrescrever os 60 WebPs aprovados.**

## Recebimento e verificação

Foram recebidas três fotografias digitais de ilustrações 1536×864 (os anexos .png são na realidade JPEG). Preparados arquivos WEBP 1280×720 em laboratório; hashes são dos arquivos efetivamente analisados. **Os binários destas três artes ainda precisam ser transferidos à pasta de mídia do GitHub. Este registro não é prova de que já aparecem no jogo.**

| Cena proposta | Anexo | SHA-256 original | WebP 1280×720 SHA-256 | Bytes |
|---|---|---|---|---:|
| `route-1` (rota inicial arborizada) | `1001008649.png` | `cfbf218967faf1e12da38bba3a307005a3f63ff36d20dd563ef543d7fbd02430` | `445ecea7c099d65226d709310ba78c76e465b45250d0e220bd71320e602bccca` | 416056 |
| `pallet-town` (cidade inicial) | `1001008650.png` | `182307b602cb8cd2365610bbb183f0da74ac3f260e045f6b94ea8fde533df9de` | `a07bef4b4e7296e5bc322b67366a61df9b84587643edcb0e46bdd328320c59a7` | 404384 |
| `viridian-city` (Viridian com ginásio de terra) | `1001008651.png` | `919109d3a492708c87c38a858f40c094783dc1462ea98382e2139820f8202366` | `937914f43730aa3cea78da475eab2000e37aab2ab2e77e1ae94d2377e544741f` | 427352 |

**Destinos de mídia planejados**, fora do manifesto dos 60 originais:
- `assets/ui/kanto-opening-user/pallet-town.webp`
- `assets/ui/kanto-opening-user/route-1.webp`
- `assets/ui/kanto-opening-user/viridian-city.webp`

## Hotspots para revisar manualmente no Chromium 640×360

Coordenadas são proporcionais à imagem e apenas candidatas para aferição. Não ativar antes de testar cliques reais sem sobreposição entre NPCs, placas e portas.

| Mapa | Ação | cx | cy | w | h |
|---|---|---:|---:|---:|---:|
| `pallet-town` | `route1` (saída norte) | .500 | .045 | .140 | .090 |
| `pallet-town` | `center` (porta do PC pintado) | .499 | .693 | .110 | .115 |
| `route-1` | `viridian` (saída norte) | .500 | .042 | .130 | .083 |
| `route-1` | `pallet` (saída sul) | .501 | .953 | .130 | .090 |
| `viridian-city` | `route1` (saída sul) | .499 | .941 | .130 | .095 |
| `viridian-city` | `forest` (saída norte) | .500 | .043 | .140 | .086 |
| `viridian-city` | `center` (porta PC) | .495 | .748 | .114 | .104 |
| `viridian-city` | `mart` (porta Loja) | .737 | .728 | .113 | .108 |
| `viridian-city` | `gym` (porta do ginásio) | .822 | .300 | .131 | .135 |

**Restrições:** nenhum deslocamento de personagem por cima da pintura; somente hotspots; o ginásio de Giovanni fica bloqueado até o ponto correto da campanha; cliques em NPC decorativo não criam combates ou recompensas fictícias; nenhum estado de save ou badges alterado pela navegação.

## Bloqueio restante — não afirmar que a abertura foi finalizada

A política `torre2-approved-opening.js` exige `pallet-town`, `route-1`, `viridian-city`, `route-2`, `viridian-forest`, `pewter-city` e hotspots revistos. O atlas original possui 60 mapas iniciados em `route-2`; a Viridian Forest não consta. A primeira arte arborizada tem aparência de rota/floresta, mas ainda é tratada aqui como `route-1` conforme sequência proposta, não como dois mapas simultâneos. **Não declarar liberação canônica enquanto a floresta faltar.**

## Tarefas obrigatórias antes de um novo deploy

1. Depositar os três WebPs verificados com os SHA-256 acima, via upload de binário autenticado; não criar placeholders nem mudar os hashes das 60 imagens originais.
2. Criar catálogo **aditivo** para os três mapas e build de instalação que recuse mídia ausente; não alterar índice/IDs dos 60 originais.
3. Conferir e corrigir hotspots por screenshot/click no Chromium Android + desktop, incluindo retorno e progressão.
4. Manter a abertura real bloqueada até resolver Viridian Forest e o restante dos contratos.
5. Gerar deploy **somente** no projeto Vercel `pokemon-torre-2-homologacao-teste`, verificar `READY` e executar smoke WebGL real. Nunca publicar no Pages oficial antes da aprovação.
