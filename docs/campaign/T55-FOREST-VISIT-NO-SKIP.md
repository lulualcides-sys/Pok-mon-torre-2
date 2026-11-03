# T55 — A floresta deve ser visitada antes de Pewter

A conclusão dos dez checkpoints de batalha da primeira rota **não substitui** a passagem real pela Floresta de Viridian. Para permitir a travessia da saída norte da Rota 2 até Pewter, agora são necessários **dois fatores**: (a) pelo menos dez checkpoints originais já concluídos, (b) confirmação de renderização bem-sucedida da Floresta após entrar a partir da Rota 2.

O marcador de visita vive exclusivamente na memória da cena Phaser e é associado ao UID do primeiro Pokémon. Não altera JSON de save, versão, badges ou progresso. Reiniciar uma jornada com outro inicial limpa o marcador. Fechar o navegador antes de chegar a Pewter exige revisitar a floresta por segurança, em vez de conceder um salto de história.

Esta é uma proteção de lógica preparada para as quatro artes ausentes. O indicador só será ativado quando a Floresta for um WebP individual aprovado e realmente renderizado no Phaser. Nunca marcar a visita por um clique que falhou ao carregar a textura.

**Gates:** T41 de caminhos, testes sintéticos de falso salto, Guardião Visual e, quando houver arte validada, testes com toque Android e saves de retorno.