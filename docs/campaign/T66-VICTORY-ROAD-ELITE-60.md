# T66 — Liga Pokémon em cima dos 60 fundos originais

**Escopo:** exclusivamente imagens 42–47 já aprovadas, sem substituir, recortar, gerar ou reposicionar nenhum WebP.

## Implementação

- Após Giovanni, etapa 8 começa nas **Rotas 22–23** (índice 43), não no Planalto Indigo. O clique de Victory Road (44) segue até o Planalto Indigo (45) pela porta superior, com retorno bidirecional.
- A porta **Liga Pokémon** no Planalto Indigo aciona o desafio nativo de Lorelei somente na etapa 8. Não pula os 17 treinadores prévios nem concede vitória.
- Os interiores dos ginásios Sabrina, Blaine e Giovanni possuem o desafio nativo em sua arena, cada um limitado às etapas 5, 6 e 7. A batalha exige treinadores vencidos e grava resultados somente pelo sistema de combate existente.
- A imagem original **Elite Four** (46) contém as cinco salas juntas. As arenas Bruno, Agatha, Lance e Champion ativam desafios somente nas etapas 9, 10, 11 e 12, respectivamente; não são criados quatro ou cinco mapas adicionais.
- A porta da **Sala da Fama** (47) só pode ser navegada quando o estado atual tem `champion === true`. Essa entrada visual não dá medalhas ou premiações automaticamente.

## Restrições e pendências

- O Ginásio Giovanni tem saída pintada para **Viridian City**, que não é um fundo separado entre as 60 imagens. Não há teleporte falso dessa porta para as Rotas 22/23; a passagem de etapa 7 para etapa 8 conserva o fallback do sistema de campanha.
- Os quatro últimos ginásios ainda precisam de sprites de líderes/subchefes homologados por cima das artes (não embutidos nos fundos). Não foi criada IA/batalha substituta.
- As imagens Elite Four e Hall of Fame não simulam vitória: o `resolveBattle` nativo segue controlando a conclusão, experiência, dinheiro, medalhas, campeão e saves.
- Nenhum mapa Sevii é desbloqueado apenas por clicar numa placa ou pela presença de uma aresta no atlas. A integração 48–60 fica para o próximo patch.

## QA e publicação

Requer teste T41 de hotspots/adjacências e Guardião Visual desktop/mobile com provas de tela e não mutação de saves antes de qualquer merge. PR DRAFT; a versão pública permanece preservada.