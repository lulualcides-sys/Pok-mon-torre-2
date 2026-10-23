# Pokémon Torre 2 — Kanto completo (23/10/2026)

## Conteúdo do patch
- Sonic Boom aprovado: manter as três meias-luas brancas e impacto branco, sem alterar física ou dano fixo de 20.
- Catálogo offline dos **151 Pokémon de Kanto**, dados de tipos e atributos derivados de PokeAPI CSV.
- Famílias já existentes no Poké Arena ou nos ginásios anteriores permanecem intactas.
- Novas famílias têm sprite PMD SpriteCollab no próprio domínio, fichas por evolução e quatro ataques **já instalados no motor**; nenhuma animação genérica é criada.
- As rotas recebem novos encontros normais. Lendários não aparecem como encontros selvagens comuns.
- A Pokédex mantém paginação em blocos de 36 e os saves existentes não são resetados.
- Distribuição por tipo reaproveita os golpes existentes; conferir e refinar movesets específicos de espécies em lotes posteriores, mantendo as animações aprovadas.

## Limites conhecidos
O catálogo e os sprites ficam prontos no jogo; concluir a Pokédex **não** equivale a garantir que todos os 151 tenham evento exclusivo de captura ou movesets FireRed individualizados. Isso requer um patch posterior de eventos/níveis. O teste de integração deve verificar os 151 arquivos de sprites e a existência de golpes reais para todas as famílias adicionadas.

## Licenças e fontes
- Dados: https://github.com/PokeAPI/pokeapi/tree/master/data/v2/csv
- Sprites PMD: https://github.com/PMDCollab/SpriteCollab (verificar atribuição e CC BY-NC no aviso do projeto)
- Código personalizado: repositório Pokémon Torre 2
