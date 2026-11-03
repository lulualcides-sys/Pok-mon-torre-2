# T56 — proteção da visita à Floresta ao trocar a equipe
O marcador visual que libera a passagem da Rota 2 norte para Pewter agora segue o UID do Pokémon inicial da jornada, mesmo após troca da ordem da equipe ou movimentação para o PC. Evolução conserva o UID. O marcador é descartado se esse UID não estiver mais presente na equipe ou no PC, em vez de atribuir o progresso a um novo Pokémon que ocupou a primeira posição.

A regra preserva o formato de save existente e não migra, reinicia ou remove Pokémon, badges, itens, IA ou batalhas. O marcador ainda é transitório na memória, portanto fechar o navegador requer revisitar a floresta — limitação conhecida e explícita até a implementação futura de checkpoint persistente aprovado.

Abertura Pallet-first e as quatro artes faltantes permanecem pendentes. PR em rascunho sem deploy até teste real da campanha.
