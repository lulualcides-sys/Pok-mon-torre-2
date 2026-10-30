# Arena/treinamento — caminhos iniciais

- Código: `tools/pokearena/torre2-arena-tempo.js`, `torre2-evolution-kits.js`.
- Regras: Arena mantém catálogo de golpes liberados e evolução dinâmica segundo decisões aprovadas; campanha tem travas próprias.
- Testes: `tests/arena-native-speed.test.js`, `tests/arena-free-moves.test.js`, `node tools/dev/testes-focados.mjs arena`.
- Identificar se a falha é do AUTO da campanha ou da Arena. Não transferir mudanças de cooldown de um modo ao outro por acidente.
