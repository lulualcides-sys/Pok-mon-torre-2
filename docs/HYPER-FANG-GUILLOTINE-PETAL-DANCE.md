# Pokémon Torre 2 — Três novos golpes de espécie (sem alterar originais)

- Hyper Fang: Rattata/Raticate. Mandíbulas dentadas de pixel art com fechamento e avanço curto; colisão física real, 90% de acerto, 10% de recuo após impacto.
- Guillotine: Pinsir. Duas pinças com sprites geométricos de pixels que se fecham no alvo; baixa precisão (~30%) e golpe de finalização apenas após contato, sem acerto automático à distância e falha contra alvos de nível superior quando tal nível está disponível.
- Petal Dance: Oddish/Gloom/Vileplume e família Bellsprout/Victreebel. 16 pétalas em espiral colorida; até três contatos separados com o inimigo e confusão no usuário ao final da dança.

Os três não estão aprovados: aguardar avaliação visual. Usam Phaser/WebGL e formas próprias em `tools/pokearena/torre2-kanto-signatures-fx.js`; não tocam no renderizador nativo do Poké Arena 2D, nem nos 14 golpes específicos aprovados.

Mewtwo de teste consegue equipar os três. Famílias de Pokémon que ainda não existem no ROSTER podem equipar quando forem integradas.

Documentação e testes no GitHub; publicar somente após CI.
