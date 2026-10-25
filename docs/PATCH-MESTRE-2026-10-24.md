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

## Continuação: clima e laboratório

O run 40123076942 passou no commit e540cfe. Esse commit foi integrado à principal e publicado pelo run 40125113130. A continuação incorporou também 52b63a9, correção independente dos controles móveis da Arena, sem sobrescrevê-la.

Clima agora pertence à batalha, com cinco janelas de quatro segundos, substituição e expiração. Sol/chuva aplicam 1,5× e 0,5× ao dano de Fogo/Água; Solar Beam é reduzido em chuva/areia/granizo. Areia/granizo causam 1/16 do HP máximo por janela, respeitando os tipos imunes e sem bônus moderno de defesa especial. Rain Dance ativa esse estado ao ser usado. Sol impede novo congelamento.

O laboratório abre pelo botão TREINAMENTO, permite escolher qualquer uma das 151 espécies nos dois lados, nível, clima, aplicar status, curar, trocar e enfrentar IA com itens limitados. Mewtwo nível 50 permanece padrão e reserva. O treino anterior de golpes permanece acessível. Resultados de laboratório/treino são ignorados pela campanha antes de qualquer mutação; teste real confirmou save idêntico após uma vitória de laboratório.

116 testes unitários passaram; navegador confirmou 151 configurações válidas, dano climático/imunidade, multiplicadores reais de Água, prevenção de congelamento pelo sol e expiração durante simulação. O teste usa configuração direta para acelerar, não uma campanha completa.

Pendências de clima: os três movimentos climáticos ainda ausentes precisam de integração ao catálogo com efeitos aprovados; visuais globais de sol/areia/granizo e sincronização do visual Rain Dance com o estado global continuam pendentes. As funções de precisão de Thunder e recuperação climática estão testadas isoladamente, mas ainda não estão ligadas a todos os renderizadores/golpes. O laboratório ainda não oferece Shiny e captura isolada. Não declarar estes itens completos.


## Continuação em 25/10: revanches e prévias da Arena

Revanches opcionais de treinadores comuns/Rocket derrotados nas etapas 1–7 usam três cargas obtidas em vitórias reais fora de revanches. A reserva consome a carga antes de entrar; o resultado exige o ticket salvo e é aceito uma única vez. Níveis sobem moderadamente com insígnias e respeitam o teto regional. Vitória concede metade do dinheiro normal e 60% do XP compartilhado. Não altera o contador principal nem concede novamente insígnia ou TM. Por enquanto a seleção contempla apenas treinadores da etapa atual, sem ginásios ou antigos mapas.

Navegador: revanche selecionada pelo mapa, nível 15 dentro do teto 21, dinheiro 1400 → 1520, +211 XP, carga zerada; repetição do resultado não concede prêmio. O teste acelera o desmaio adversário por depuração; não representa vitória jogada normalmente.

A tela de preparação da Arena carregava sprites somente quando a aparência diferia da forma base. As espécies adicionais de Kanto, ainda não carregadas, apareciam como quadros verdes. Agora a prévia aguarda o carregamento nativo da própria espécie e só cria o sprite quando a animação existe. Teste Chromium confirmou seis prévias animadas e clique real em FIGHT iniciando seis lutadores com sprites válidos.

Cliente-base capturado nesta continuação: src-bf2b6eb2f1. Versão local construída: src-944d16417a. Os testes usam uma saída isolada (_validation), evitando reconstrução dos arquivos durante a execução. Testes do cliente construído agora aceitam PREVIEW_ROOT, com _site como padrão de CI.

121 testes unitários, checagem de sintaxe e política de reaproveitamento passaram. Regressões do cliente construído passaram para atributos das 151 formas, learnsets, progressão por chamadas diretas, revanches e preservação dos movimentos do lote finale13. Laboratório e revanche passaram também no navegador. A suíte completa e a publicação desta continuação devem ser registradas após sua execução, sem presumir sucesso.
