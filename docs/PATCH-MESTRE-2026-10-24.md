# Script Mestre — execução em andamento

Base: e6fbcc79781f5d9e9cd73559ed99cf37a54349fb.
Backup remoto: backup/pre-master-patch-2026-10-24-e6fbcc7.
Branch: fix/master-patch-2026-10-24.

## Correções implementadas

- Captura automática sem mira, setas ou possibilidade de errar o alvo.
- Taxas dos 151 Pokémon; aritmética inteira de FRLG, incluindo ordem dos arredondamentos, quatro verificações de 16 bits e até três balanços visíveis.
- Fonte para taxas e aritmética: pret/pokefirered, `src/data/pokemon/species_info.h` e `src/battle_script_commands.c`, `Cmd_handleballthrow`. Dados numéricos e implementação JavaScript própria; não foram copiados recursos gráficos dessa fonte.
- HP real e estados nativos de sono, congelamento, paralisia, veneno e queimadura alimentam captura. Confusão não fornece bônus.
- Removidas ofertas de captura de Pokémon de treinadores, inclusive ofertas antigas no save; Pokémon já capturados permanecem.
- Paginação da seleção em 28 famílias por página: FIGHT permanece visível.
- Atributos ausentes nas evoluções herdam valores válidos da base. Reprodução confirmada com Raticate: velocidade indefinida contaminava posições e câmera com NaN, deixando a arena preta.
- Pokédex consulta o resolvedor da campanha para exibir golpes, em vez dos kits nativos incompatíveis.
- Limpeza de efeitos de combate, tarefas de dano e ações pendentes nas trocas.
- Correção da remoção de listener após fuga da Pokébola.
- Cura da equipe também limpa campos de status persistentes.

## Evidência local

Antes das correções: 97 testes unitários passavam apesar dos defeitos.
Após as correções: 101 testes unitários; validação dos atributos das 151 espécies.
Chromium/WebGL: cinco trocas, fuga, captura no PC com equipe cheia, consumo único, recarga e viewport móvel. Outra execução reproduziu a câmera inválida em Raticate; após correção, nove formas passaram: Raticate, Nidoking, Clefable, Charmeleon, Charizard, Ivysaur, Venusaur, Wartortle e Blastoise. Seleção verificada com FIGHT em y=321, quatro páginas e 28 famílias visíveis.

Esses testes usam saves isolados, RNG controlado e escolha direta de espécies. Não equivalem a percorrer a campanha normalmente. A campanha até o Campeão ainda não foi jogada e verificada.

## Pendências do Script Mestre

Revisão integral de tipos/atributos/STAB/críticos, adaptação completa de status e climas, poções dos treinadores, estratégia ampliada da IA, revanches, economia/TMs, Shiny com sprites e persistência completos, remodelação dos menus/mapa, insígnias/relatórios, áudio, laboratório isolado e percurso completo da campanha. A página pública não deve ser anunciada como concluída pelo simples sucesso destes testes parciais.
