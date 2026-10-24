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

## Continuação: combate e status

A primeira validação remota passou no run 40098332518, commit ae8b847ffc61945c0f9b12e1d2c6b8389e6dbf97.

- Tabela Gen III: 17 tipos, 289 pares e 4913 combinações duplas testadas; inclui resistências antigas de Aço. STAB e queimadura física aplicados na campanha. Não substitui ainda a fórmula inteira de dano ou atributos originais.
- Itens de treinadores possuem inventário por etapa, uso a 25% de HP, mensagem nativa, preparação de 1,2 segundo e intervalo de 20 segundos. O controle da IA fica bloqueado durante o uso. Poções não passam do HP máximo. Sprite do item e partículas dedicadas ainda estão pendentes.
- Status utiliza o mesmo objeto est dos efeitos nativos: condição principal exclusiva, confusão separada, imunidades Gen III. Uma janela equivale a quatro segundos simulados; pausas de captura e troca não avançam a simulação. Veneno/queimadura perdem 1/8 do HP máximo por janela; Toxic começa em 1/16 e cresce. Sono dura 2–5 janelas; congelamento verifica 20% de recuperação por janela. Paralisia e confusão fazem uma verificação por janela de tentativa de ataque, nunca por frame.
- Status principal é serializado por integrante e restaurado nas trocas; confusão se encerra na troca. Toxic reinicia o contador na entrada. Captura preserva HP e status do alvo. Centro cura ambos.
- Nível e abreviação do status aparecem abaixo do lutador, ocultos nas transições.

Validação local: 112 testes unitários e npm run check passaram. Testes do cliente construído cobrem as 151 formas, campanha por chamadas diretas e learnsets FRLG. No Chromium/WebGL: imunidade Elétrico/Terra, poção única de Brock e bloqueio de ataques passaram; aplicação nativa de veneno, exclusividade, serialização, sono e descongelamento também passaram. Os testes de status usam chamadas controladas; ainda falta verificar todas as combinações em partidas normais.

O antigo npm run test:browser apontava ao laboratório Pixi da raiz e falhou por indisponibilidade da dependência CDN, antes de abrir o jogo. O comando agora valida o cliente Phaser construído em _site/arena2d, incluindo evoluções/FIGHT, tipos/status/itens e captura/trocas/mobile. O teste antigo permanece em test:browser:legacy. Requer construir _site antes e informar CHROME_BIN.
