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

## Pokédex FireRed e desbloqueios por nível — 23/10/2026
- A referência de aprendizagem agora cobre **151 Pokémon Kanto**, usando dados `pokemon_moves.csv`, `moves.csv` e `version_groups.csv` do banco aberto PokeAPI, exclusivamente `version_group_id=7` (FireRed/LeafGreen). Código: `tools/pokearena/torre2-frlg-learnsets.js`.
- **ATK (LMB)** é o básico; **HAB 2 (RMB)**, **HAB 3 (Q)** e **ULT (E)** permanecem nas posições Poké Arena 2D; **ESQUIVA (ESPAÇO)** é defensiva, separada. Usar apenas animações instaladas no motor original ou previamente aprovadas.
- Os 151 aprendem golpes em seus **níveis** oficiais; ataques herdados de fases pré-evolutivas permanecem utilizáveis; a forma evoluída continua exigindo evolução somente por nível e **após batalha**. Os primeiros mapas com learnsets curados mantêm seus níveis já aprovados.
- A Pokédex mostra golpes, **LV de desbloqueio** e marca **TM** para golpes que só podem ser ensinados (não concedidos por progresso). Para espécies como Ditto e Magikarp, slots sem golpes oficiais legítimos ficam vazios; não inventar ou copiar ataques de outra espécie só para completar quatro.
- Mewtwo de testes (nível 50) mantém **biblioteca livre**; o progresso/salvamento Kanto v1 segue com a mesma chave, sem reset.
- Os novos Pokémon de Kanto escolhem movimentos por sua **própria** tabela FireRed entre os efeitos existentes, e não apenas por coincidência do tipo. Efeitos originais e todo o conjunto de golpes aprovados seguem intocados.
- Observação: a campanha não implementa automaticamente eventos de recompensa/distribuição de todas as TMs; elas continuam exigindo ensino explícito. Nenhuma animação nova foi inventada nesta etapa.
