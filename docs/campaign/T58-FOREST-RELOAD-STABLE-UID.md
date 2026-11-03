# T58 — Floresta: UID original recuperável após reload, sem tocar nos saves

O estágio 0 mantém o marco de Viridian Forest em armazenamento separado. Antes o marcador era identificado pelo UID do Pokémon escolhido como primeiro na equipe **após o reload**. Se o inicial tivesse evoluído e estivesse no PC, um Pokémon recém-capturado podia assumir o lugar 1; nesse caso o jogo não encontrava a visita anterior.

Agora, ao gravar uma visita **após renderizar o mapa**, armazena também um ponteiro separado para o UID do inicial. Na próxima abertura o ponteiro só é aceito quando esse mesmo UID estiver presente na equipe ou no PC; o jogo não concede a visita a um Pokémon não relacionado. Reiniciar a jornada ou escolher novo inicial limpa o ponteiro anterior após uma operação de save/reset bem-sucedida.

Não muda os saves principais, backups, batalhas, Pokémon, recompensas, nem os 60 WebP homologados. Se a gravação/remoção do sidecar for negada, o jogo continua no comportamento conservador anterior. Abertura visual ainda bloqueada até os quatro fundos adicionais serem aprovados.
