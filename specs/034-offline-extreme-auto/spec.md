# Especificação — AUTO extremo offline com evolução nativa
Data: 2026-11-03 | Escopo: Arena, League e VS CPU (Pokémon Torre 2)

## Critérios observáveis
- Ao ativar AUTO nos modos individuais `cpu`, `arena`, `liga` e `league`, usar um cérebro nativo extremo, mais reativo e ofensivo que o atual, mantendo dano, HP, energia, cooldowns, golpes e sprites originais.
- Reconstruir a IA apenas quando realmente mudar Pokémon, estágio evolutivo ou adversário. Preservar a leitura manual e o botão atuais.
- Ao ficar `puedeEvolucionar` ou `puedeMega` verdadeiro, solicitar EVO/MEGA via entrada nativa, sem fabricar EXP, mega-meter ou alterar `etapa` diretamente.
- Campanha: sem evolução durante luta e sem mudanças táticas. Treinamento mantém perfil original.
- Negar AUTO em PvP, online, replay ou batalhas com dois participantes humanos.

## Aceitação
- Unidade: isolamento de modos, configurações, falso/verdadeiro dos flags nativos e rebind de estágio.
- Chromium/Phaser: combate VS CPU com Magikarp realmente evoluindo com AUTO; controles manuais após desligar; nenhuma exceção.
- Build, testes completos e CI devem passar antes de integrar à `main`; Pages público só é confirmado por release HTTP na versão correta.
