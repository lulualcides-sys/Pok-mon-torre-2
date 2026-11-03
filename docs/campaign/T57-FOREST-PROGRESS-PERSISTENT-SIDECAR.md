# T57 — progresso da Floresta em armazenamento separado

A visita à Viridian Forest só passa a ser gravada depois que o Phaser abre com sucesso a textura do mapa. A gravação fica em uma chave separada, versionada e específica ao UID do Pokémon inicial: `torre2:kanto:forest-visited:v1:<uid>`.

A equipe pode ser reordenada, o inicial pode evoluir ou ir ao PC, e o navegador pode ser recarregado sem perder indevidamente a visita. Um novo inicial gera outro UID e não herda o avanço. IDs desconhecidos, chaves forjadas ou saves antigos sem UID estável não são gravados. Se `localStorage` estiver bloqueado, a campanha permanece jogável e o jogador pode precisar revisitar a floresta.

Não modifica as chaves principais de save ou backup, schema de `saveCampaign`, insígnias, batalhas, Pokédex, créditos nem os 60 fundos aprovados. O primeiro estágio visual **continua bloqueado** até as artes de Pallet, Rota 1, Viridian City e Viridian Forest serem aprovadas.

A trava da Rota 2 exige também dez checkpoints de batalha; salvar a visita não permite pular as batalhas.
