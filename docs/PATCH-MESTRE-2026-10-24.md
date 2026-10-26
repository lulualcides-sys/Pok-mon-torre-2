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


## Continuação: troca estratégica dos líderes

Líderes, Elite Four e Campeão avaliam tipos visíveis do oponente, os próprios golpes desbloqueados e HP da reserva. A política é uma adaptação do Torre 2, não reprodução da IA original de FRLG. Considera desvantagem de tipo, ataque pouco eficaz ou HP baixo; exige reserva viva, saudável e útil. Treinadores comuns e selvagens continuam usando a IA simples.

Primeira avaliação após oito segundos simulados, reavaliação a cada quatro, intervalo mínimo de vinte entre trocas e limite de três por batalha. Não troca durante ataque, dash, uso de item, desmaio ou transição. Reusa o recolhimento/lançamento existente, limpeza de projéteis e estados por integrante; não cria novos VFX.

125 testes unitários passaram. Chromium confirmou troca tática de Charmander para Bulbasaur diante de Squirtle, com animação completa: Charmander permaneceu vivo, Bulbasaur entrou com seus 73% de HP (133/182), HP do jogador permaneceu 176, e uma nova troca foi bloqueada pelo intervalo. A configuração e o relógio foram ajustados por depuração para testar a decisão; isso não representa uma campanha jogada.

O lote anterior 17683ef passou localmente no npm run test:browser completo e no source-client-smoke, com captura, PC, trocas, mobile, prévias da Arena e efeitos existentes. A publicação e validação remota devem ser confirmadas separadamente.

A validação remota 40164706150 interrompeu no teste climático, com dano medido zero; nenhuma publicação desse lote foi feita. O teste agora desabilita o controle de combate antes da medição e estabelece explicitamente o clima, evitando que ações autônomas ou tempo decorrido alterem a amostra. A medição isolada passou localmente: areia 13 HP no Charizard e 0 no Onix; dano de Água 106,70 normal, 160,05 na chuva e 53,35 no sol. A nova execução remota continua sendo necessária.


## Continuação: percurso dos 13 chefes e identidade do HUD

O primeiro percurso no navegador detectou que o descritor do encontro apontava para o ás do líder, enquanto a equipe começava pelo primeiro integrante. Brock abria com nível 14 e sprite de Onix, embora o primeiro membro fosse Geodude nível 12. A entrada agora toma espécie, nível e golpes do mesmo membro de cada equipe, sem recalcular o primeiro moveset pelo nível do ás.

A revisão visual encontrou também nome/retrato antigos no HUD após uma troca. O HUD nativo agora é atualizado junto do lutador, incluindo tipos e nomes dos golpes; a barra de HP não herda o rastro do membro anterior. As regressões conferem nome e retrato, além do sprite de batalha.

O percurso automatizado local verificou Brock, Misty, Lt. Surge, Erika, Koga, Sabrina, Blaine, Giovanni, Lorelei, Bruno, Agatha, Lance e Campeão: 53 entradas de equipe, progressão, dinheiro e salvamento. Usa pulos de rota e nocautes forçados; NÃO é uma campanha jogada normalmente nem teste de balanceamento. A versão src-5cc7bffeee com a conferência adicional do HUD também passou nos 13 chefes e 53 entradas. O relatório está em evidence/campaign-debug-tour-20261025.json.

Insígnias agora se limitam aos oito ginásios; conquistas da Elite e Campeão ficam em leagueHonors. Migração idempotente mantém vitórias antigas, equipe, dinheiro e progresso. O teste do cliente construído confirmou oito insígnias e cinco honras ao terminar, inclusive lendo um save antigo com as 13 marcas juntas.

A execução remota 40165034819 revelou que o teste climático lançava o laboratório com a configuração antiga. A configuração agora é alterada no mesmo objeto usado pelos controles, aguarda dois quadros de renderização e calcula o clique pelos limites reais do canvas. A checagem explícita da configuração permanece. O teste passou localmente; sucesso remoto ainda deve ser confirmado.

Pendências observadas no percurso: somente Brock concede TM; demais recompensas de ginásio, apresentação/relatório completo e campanha normal continuam pendentes. Não extrapolar o percurso de depuração para alegar que o Script Mestre inteiro foi concluído.

A regressão das Pokébolas agora registra as fases no evento poststep, em vez de depender de capturar uma fase de 360 ms após uma operação de screenshot. Conserva verificações de alinhamento do raio, corpo oculto no lançamento, liberação, cinco trocas e identidade do HUD. Passou localmente com zero erros de frame.


## Integração com as correções paralelas da Arena

Incorporados 5510f9f, 2476fc2 e 2a7379c da principal: ficha/evolução, energia dos golpes iniciais e velocidade de caminhada fora da campanha. O conflito na lista de arquivos do cache foi resolvido conservando todos os módulos das duas frentes. Há backup remoto pre-master-integration-20261025-2a7379c.

A revisão final retirou a política antiga de troca por HP (acionada a cada 75 frames), que ainda coexistia com a nova política. Agora apenas a política limitada decide as trocas. A regressão coloca a batalha na etapa 2 e observa mais de 75 frames com HP baixo durante o intervalo, para detectar reintrodução do comportamento antigo.

O run 40186990237 passou integralmente no runtime 48221e7, incluindo os 13 chefes e o smoke-test amplo. A versão combinada exige nova validação; 130 testes unitários já passaram. Não confundir o sucesso anterior com a publicação da integração posterior.

## Publicação integrada e correção visual do laboratório

O commit a5bb697 passou integralmente na execução 40216698665 (npm test, check, test:browser, percurso de depuração dos 13 chefes e source-client-smoke). Foi integrado sem sobrescrever commits paralelos e publicado pelo Pages 40244335267. O navegador público carregou src-85ed87c705, abriu FIGHT com seis lutadores e iniciou o laboratório Mewtwo 50 contra Onix.

A inspeção pública encontrou controles do laboratório fora da tela, também visíveis como ausentes na evidência local anterior. O teste instalado-flag não detectava esse erro. A câmera nativa camUI já centraliza a interface; setScrollFactor(0) aplicava deslocamento indevido. Os botões agora usam a transformação nativa e o indicador climático fica na camada UI. O teste passou a clicar nas posições visíveis de Status P1 e Clima, verificando veneno e granizo, além da mecânica e isolamento do save. A imagem laboratory-controls-visible.png foi inspecionada: cinco controles visíveis, PSN e GRANIZO 20s. Não foram alterados sprites nem efeitos aprovados.

Esta correção não conclui os visuais climáticos, Shiny, demais sete TMs de ginásio ou a campanha jogada normalmente. A publicação deste ajuste menor deve ser confirmada separadamente da publicação a5bb697.

## Recompensas de TM e compatibilidade (26/10)

Sete ginásios agora concedem os golpes já instalados: Rock Tomb, Water Pulse, Shock Wave, Giga Drain, Calm Mind, Fire Blast e Earthquake. Toxic de Koga permanece pendente e não é apresentado como TM utilizável. Os cinco novos itens da loja ficam bloqueados até a etapa correspondente. Nenhum renderer ou efeito foi alterado.

A lista de compatibilidade das TMs deriva da mesma tabela FRLG_MACHINES dos 151 Pokémon; foram removidas as listas parciais antigas e a exceção irrestrita de ensino por TM ao Mewtwo. O Mewtwo de teste continua com sua biblioteca completa própria. Magikarp não aprende Water Pulse; Squirtle aprende; Mewtwo não aprende Giga Drain por TM, e Mew aprende.

gymTMClaims registra entregas independentemente do inventário consumível. Saves antigos com ginásios concluídos recebem recompensas faltantes uma vez; a TM de Brock já entregue pelos builds antigos não é recriada. TMs já na bolsa ou aprendidas são reconhecidas. A migração usa o salvamento com backup anterior, preservando equipe, dinheiro e progresso.

Teste permanente do cliente construído percorre as 13 premiações, verifica sete TMs jogáveis, consumo, releitura idempotente, bloqueios de compra e compatibilidade. Novo teste de navegador ensina Water Pulse ao Squirtle por clique real na Mochila, recarrega a página e verifica que o prêmio não reaparece. A preparação desse teste usa um save com Misty já derrotada: não representa vitória normal contra Misty. Publicação e suíte remota deste lote ainda precisam ser verificadas.

## Estojo de insígnias (26/10)

O lote ebffed4 foi publicado pelo Pages 40294361119 e passou integralmente na validação 40294281601, incluindo test:browser, os 13 chefes por depuração e source-client-smoke. Na página pública, os módulos route-data/campaign-core de src-f71b3e1298 foram comparados byte a byte com o build testado. Mapa e loja abriram no navegador público.

Continuação baseada em 34fb838: preservadas as quatro correções paralelas de golpes iniciais, ULT nível 8 e janela de treino do Ditto. Cópia de trabalho isolada e backup pre-badge-case-20261026-34fb838.

O contador de insígnias do mapa abre agora um estojo Phaser com oito glifos originais de interface em pixel art, duas linhas de quatro, cores para conquistadas e paleta apagada para restantes. Cada seleção mostra líder, cidade/ginásio e TM; o estado de recebimento consulta gymTMClaims, não a presença do consumível na bolsa. Toxic aparece explicitamente indisponível nesta versão. Nenhum golpe, VFX, sprite aprovado ou regra de recompensa foi alterado.

A regressão badge-case-browser usa fixture isolada, clica no botão real do mapa e nas oito insígnias, confere detalhes, retorno, layout móvel 854×480 e igualdade do save antes/depois da consulta. As imagens desktop/móvel foram inspecionadas. 139 testes unitários, check e regressões construídas de prêmios e golpes iniciais passaram. Esses testes não representam campanha normal até o Campeão. Publicação deste novo estojo deve ser confirmada separadamente.
