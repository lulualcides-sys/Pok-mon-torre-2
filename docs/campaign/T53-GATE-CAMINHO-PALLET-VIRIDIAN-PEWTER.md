# T53 — pré-validação do prólogo completo de Kanto

A sequência **Pallet → Rota 1 → Viridian City → Rota 2 → Viridian Forest → Pewter** só estará ativa quando todas as seis imagens, hotspots **e conexões de ida/volta** forem comprovadas no grafo do atlas. Rota 22 é um desvio opcional a partir de Viridian e não deve ser requisito da campanha.

Esta verificação evita dois defeitos: (1) ir direto a Pewter apenas porque o WebP existe; (2) ficar preso em uma cidade quando uma arte for adicionada sem a saída correspondente. A lógica permite os IDs do prólogo na etapa 0 mesmo que imagens novas recebam índices além dos 60 originais, mas não permite teletransportes para outros destinos; o Ginásio Brock é uma exceção de ida/volta exclusivamente com Pewter City.

## Originais encontrados na Biblioteca, ainda não instalados
- `Mapa de Pallet Town em Pixel Art.png` (1672×941): arte candidata de cidade, contém UI/placas pintadas no próprio arquivo; revisar antes de transformar em WebP homologado.
- `Mapa de Viridian City em Pixel Art.png` (1672×941): arte candidata de cidade, contém menu próprio e rótulos pintados; revisar antes de importar.
- `Mapa de Kanto em Pixel Art.png`: montagem com trecho de Rota 1; não é um fundo individual adequado.
- Floresta de Viridian: nenhum fundo individual identificado na Biblioteca consultada.

Os 60 arquivos WebP aprovados permanecem intactos. Não importar essas imagens candidatas sem validação de consistência, nem declarar a abertura pronta. Os testes do prólogo são verificações de lógica; não provam travessia visual no navegador.
