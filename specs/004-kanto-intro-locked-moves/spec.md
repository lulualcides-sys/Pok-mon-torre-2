# 004 — Gate de golpes realmente disponíveis no tutorial Kanto (T07/T08)

## Problema reproduzível no código
O filtro de prévia Lv5 aceitava VFX existentes, mas marcados pendentes, indisponíveis ou dependentes de TM/HM. A criação da prévia zerava `pendiente` e podia disponibilizar uma habilidade não autorizada; o seletor de ULT Lv8 também ignorava esses marcadores.

## Critérios de aceite
- Nenhum movimento com `pendiente`, `torre2Unavailable`, `torre2RequiresTM` ou `torre2RequiresHM` pode ser selecionado como prévia ou ULT temática.
- Os três controles Lv5 permanecem utilizáveis por VFX aprovado, com Struggle neutro como último recurso quando a espécie não tem três movimentos autênticos renderizáveis. Não afirmar três nomes FRLG em espécies sem três golpes oficiais.
- Preservar todos os VFX, Surf aprovado, TM/HM da campanha, Scratch/Transform adiados, saves e Arena original.
- Verificar Node, check/reuse, build, Chromium Phaser, revisão, CI, merge e Pages SHA/HTTP antes de marcar publicado. A prova de 150/150 Pokédex Lv50 é independente e não conclui Lv5/8 natural.
