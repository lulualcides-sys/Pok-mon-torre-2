# T17 — chance Shiny de encontro selvagem
**Critério:** encontro Kanto real sortear Shiny uma vez, independentemente da espécie, taxa exata de 1% por encontro (random estritamente inferior a 0.01), sem sorteio na Pokébola, retry de salvamento, entrada na batalha, reload ou evolução.
**Registros:** persistir `pendingWild.shiny`, transferir metadado `torre2.shiny` para Phaser, manter `member.shiny` após captura na equipe/PC/evolução; registrar `dexShinySeen` e `dexShinyCaught` sem conferir capturas por mero encontro.
**Segurança:** nenhuma gravação negada pode conceder Shiny, consumir itens, trocar Pokémon ou reescrever save. Sem alterar 227 VFX, PMD, arte, odds FRLG de captura, HP, golpes, IA ou combate.
**Fora de escopo:** paletas canônicas, estrelas 1,5s e indicadores visuais em Summary/Pokédex ainda dependem de revisão de assets/licença na PR histórica #17. Este lote de dados não comprova interface Shiny completa nem encontro natural com RNG real.
