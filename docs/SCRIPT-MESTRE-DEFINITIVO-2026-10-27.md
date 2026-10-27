🎮 SCRIPT MESTRE DEFINITIVO — POKÉMON TORRE 2

PATCH COMPLETO — CAMPANHA, CAPTURA, BATALHAS, STATUS, CLIMA, IA, REVANCHES E POLIMENTO

MODELO: GPT-6 Astra Médio
REPOSITÓRIO: https://github.com/lulualcides-sys/Pok-mon-torre-2
JOGO: https://lulualcides-sys.github.io/Pok-mon-torre-2/

MOTOR: Phaser/WebGL
REFERÊNCIA DE MECÂNICAS: Pokémon FireRed/LeafGreen, geração III
REFERÊNCIA VISUAL: Pokémon Arena 2D

---

1. MISSÃO PRINCIPAL

Quero que você assuma o desenvolvimento e a correção geral do Pokémon Torre 2.

Sua missão é corrigir os problemas existentes, reorganizar as mecânicas, melhorar os sistemas e verificar a campanha completa até o Campeão.

Quero modificações reais no GitHub e testes no navegador.

Não quero somente recomendações, imagens demonstrativas ou alterações superficiais.

Leia obrigatoriamente "AGENTS.md", "README.md" e os arquivos pertinentes à versão realmente publicada.

Antes de começar:

1. Confira os commits recentes.
2. Identifique o código que está sendo executado no jogo público.
3. Verifique alterações de outros agentes.
4. Crie uma branch de segurança.
5. Preserve os saves.
6. Planeje as alterações para evitar conflitos.

REGRA MÁXIMA: PRESERVAR OS GOLPES, SPRITES E EFEITOS JÁ APROVADOS.

Não refaça o jogo do zero.

---

2. SISTEMA DE CAPTURA DEFINITIVO

A POKÉBOLA SEMPRE ACERTA O ALVO

Remover completamente a mira manual.

Não quero:

- Retículo.
- Direção manual.
- Controle de precisão.
- Chance de errar o arremesso.

Toda Pokébola lançada deve atingir automaticamente o Pokémon selvagem.

100% DE ACERTO NO ALVO NÃO SIGNIFICA 100% DE CAPTURA.

A captura depende exclusivamente do cálculo de captura, espécie, HP, status e tipo de Pokébola.

Botão de captura

Adicionar um botão pequeno e bonito com sprite de Pokébola.

Ao clicar, abrir um menu funcional com:

- Poké Ball.
- Great Ball.
- Ultra Ball.
- Quantidades disponíveis.
- Seleção e lançamento.

Corrigir o travamento atual ao abrir a captura.

Animação

1. Pokébola sai do treinador.
2. Trajetória curva com rotação.
3. Acerta automaticamente o Pokémon.
4. Pokébola abre.
5. Raio vermelho atinge o corpo.
6. Pokémon diminui.
7. Corpo é absorvido.
8. Pokébola fecha e cai.
9. Balança conforme o resultado.
10. Captura bem-sucedida mostra "GOTCHA!".
11. Falha libera novamente o Pokémon.

Usar pixel art proporcional, com animação integrada ao Phaser/WebGL.

---

3. CÁLCULO ORIGINAL DE CAPTURA FIRE RED

Implementar o algoritmo da terceira geração, com taxas corretas por espécie.

Referências:

https://bulbapedia.bulbagarden.net/wiki/Catch_rate

https://pokemondatabase.com/tools/catch-rate/firered-leafgreen/

Multiplicadores de Pokébola

- Poké Ball: 1×.
- Great Ball: 1,5×.
- Ultra Ball: 2×.
- Master Ball, se implementada: captura garantida.

Multiplicadores de status

- Normal: 1×.
- Paralisado: 1,5×.
- Envenenado: 1,5×.
- Queimado: 1,5×.
- Dormindo: 2×.
- Congelado: 2×.

Fórmula de referência

"a = ((3 × HPmax - 2 × HPatual) × catchRate × bonusBall × bonusStatus) / (3 × HPmax)"

Utilizar os arredondamentos, limites e a ordem de operações originais de FireRed/LeafGreen.

Para as capturas não garantidas, utilizar o limite de balanços da geração III:

"b = 1048560 / sqrt(sqrt(16711680 / a))"

Implementar as quatro verificações internas.

Não confundir quatro verificações com quatro lançamentos.

O resultado visual deve ter até três balanços antes da confirmação ou fuga.

Taxas por espécie

Utilizar as taxas reais dos 151 Pokémon.

Exemplos:

- Rattata: 255.
- Caterpie: 255.
- Pikachu: 190.
- Mewtwo: 3.

Não inventar uma taxa genérica para todos.

Captura bem-sucedida deve registrar o Pokémon na equipe, PC e Pokédex.

Falha deve consumir uma Pokébola e continuar a batalha.

Pokémon pertencentes a treinadores não podem ser capturados.

---

4. CORRIGIR O BOTÃO FIGHT NA ARENA

O modo Arena está sem o botão Fight.

Restaurar e testar:

- FIGHT.
- POKÉMON.
- BAG.
- RUN, quando permitido.

Fight precisa abrir os golpes disponíveis.

Corrigir problemas de sobreposição, interação e carregamento.

Testar no celular e no computador.

---

5. CORRIGIR A TELA PRETA

Quando determinados Pokémon evoluem, a arena fica preta.

Investigar:

- Spritesheets.
- Atlas.
- Texturas.
- Animações.
- Evoluções.
- Carregamento.
- Referências inválidas.
- Escalas.
- Objetos antigos.
- Transições de cena.

Testar todas as linhas evolutivas disponíveis.

Nenhuma evolução pode quebrar a renderização.

---

6. CORRIGIR OS SPRITES DAS BATALHAS

Garantir correspondência correta entre:

- Espécie.
- Evolução.
- Sprite.
- Nome.
- Nível.
- HP.
- Moveset.

Corrigir sprites misturados, antigos ou duplicados durante trocas.

Adicionar o nível embaixo do Pokémon, com tamanho pequeno e discreto.

Preservar o estilo visual aprovado.

---

7. SISTEMA DE GOLPES DOS 151 POKÉMON

Reorganizar os movesets usando FireRed/LeafGreen.

Corrigir situações como:

- Rattata com Blizzard.
- Hyper Beam atribuído incorretamente.
- Clefairy utilizando golpes inadequados.
- Pokémon sem golpes.
- Evoluções com ataques incoerentes.

Centralizar os dados:

- Golpes por nível.
- Compatibilidade com TMs.
- Golpes aprendidos.
- Desbloqueios.
- Evoluções.
- Movesets adversários.

A Pokédex, o sumário e a batalha devem consultar os mesmos dados.

Separar os learnsets originais de FireRed das adaptações exclusivas do Torre 2.

Não modificar as animações dos golpes aprovados.

---

8. QUATRO GOLPES E DESBLOQUEIOS

Pokémon iniciais começam no nível 5.

Todos devem conseguir atacar imediatamente.

Organização:

- ATK: golpe básico.
- SLOT 2: golpe complementar.
- SLOT 3: golpe intermediário.
- ULT: golpe principal.

Preferencialmente, quatro golpes coerentes.

Se não houver quatro disponíveis no nível 5, permitir três golpes e desbloquear a ULT no nível 8.

Essa adaptação deve ser equilibrada e compatível com a espécie.

Golpes mais fortes devem surgir nos níveis apropriados.

Pokémon capturados devem possuir movesets coerentes com seus níveis.

Evoluir não pode apagar ataques válidos.

---

9. SISTEMA COMPLETO DE TIPOS

Implementar a tabela de efetividade da geração III.

Conferir:

- Vantagens.
- Resistências.
- Imunidades.
- Tipos duplos.
- STAB.
- Acertos críticos.
- Classificação físico/especial da geração III.

Os danos devem considerar nível, atributos, poder do golpe, efetividade e condições aplicáveis.

Mensagens discretas:

- SUPER EFETIVO!
- POUCO EFETIVO...
- NÃO AFETOU!
- ACERTO CRÍTICO!

Não utilizar letras gigantes ou emojis.

Criar testes permanentes para a tabela completa de tipos.

---

10. CONDIÇÕES DE STATUS COMPLETAS — NOVA IMPLEMENTAÇÃO

Quero implementar corretamente as condições de status de FireRed, adaptadas ao combate em tempo real do Torre 2.

Poison — Envenenamento

- O Pokémon perde HP periodicamente.
- Dano proporcional ao HP máximo.
- Veneno não pode causar dano sem limite de frequência.
- Toxic deve ter efeito de envenenamento progressivo, separado do veneno comum.
- Respeitar imunidades da terceira geração.
- Permitir cura com itens apropriados e Pokémon Center.

Visual: pequenas partículas roxas e indicador discreto "PSN".

Burn — Queimadura

- Causa dano periódico.
- Reduz o dano físico conforme a regra da geração III.
- Respeita imunidades aplicáveis.
- Não pode produzir dano duplicado por erro de timer.

Visual: pequenas chamas em pixel art e indicador "BRN".

Sleep — Sono

- Pokémon fica temporariamente incapaz de utilizar ataques comuns.
- Duração baseada na mecânica FireRed, adaptada ao combate em tempo real.
- Despertar deve acontecer corretamente.
- Respeitar movimentos que podem ser usados enquanto dorme, quando implementados.
- Não deixar o Pokémon dormindo indefinidamente.

Visual: pequenas letras Z pixeladas e indicador "SLP".

Paralysis — Paralisia

- Reduz a capacidade de movimentação ou velocidade de ação.
- Pode interromper ataques conforme probabilidade equivalente à geração III.
- Não bloquear permanentemente o Pokémon.
- Aplicar corretamente às duas equipes.

Visual: pequenas descargas elétricas amarelas e indicador "PAR".

Freeze — Congelamento

- Pokémon fica temporariamente incapaz de agir normalmente.
- Implementar recuperação e descongelamento conforme FireRed.
- Golpes apropriados de fogo devem interagir com o congelamento.
- Respeitar imunidades.
- Não congelar permanentemente por falha de temporizador.

Visual: cristais de gelo pequenos e indicador "FRZ".

Confusion — Confusão

- Pokémon pode falhar ao executar ataques.
- Pode causar dano em si mesmo conforme as regras de confusão da geração III.
- Deve ter duração limitada.
- Confusão é uma condição temporária separada dos principais status persistentes.
- Não pode causar dano repetido várias vezes pelo mesmo evento.

Visual: pequenas estrelas girando acima do Pokémon.

Regras gerais

- Não permitir empilhamento inválido de condições principais.
- Manter Confusion separada das condições persistentes.
- Adaptar durações por turnos para janelas de ação em tempo real, documentando a conversão.
- Usar uma única fonte de verdade para estados e timers.
- Status aplicados devem aparecer corretamente no HUD e no sumário.
- Respeitar persistência e cura conforme as regras adotadas.
- Preservar os efeitos de status depois de trocas, quando aplicável.
- Evitar que status do Pokémon derrotado seja transferido ao próximo.

IMPORTANTE: a captura também deve utilizar esses status reais, especialmente Sleep, Freeze, Paralysis, Poison e Burn.

Testes

Testar todas as condições no laboratório com:

- Jogador.
- Adversário.
- Trocas.
- Cura.
- Captura.
- Desmaio.
- Mudança de cena.
- Salvamento.

---

11. COOLDOWNS E IA DE ATAQUE

Corrigir a frequência de uso dos golpes seguindo o Pokémon Arena 2D.

- Ataques básicos com recarga menor.
- Intermediários com recarga equilibrada.
- Golpes fortes com recarga maior.
- Ultimates com recarga adequada.

A IA deve respeitar os mesmos cooldowns do jogador.

Corrigir especialmente a Clefairy utilizando Hyper Beam e Psybeam continuamente.

Não permitir ataques infinitos, cooldowns zerados indevidamente ou golpes incompatíveis.

---

12. IA DE TROCA ESTRATÉGICA

Líderes, Elite Four e Campeão devem saber trocar Pokémon estrategicamente.

A troca pode ocorrer quando:

- Existe desvantagem significativa de tipo.
- O Pokémon está com HP baixo.
- Outro integrante oferece vantagem.
- A troca faz sentido tático.

Limites:

- Não trocar continuamente.
- Respeitar animação.
- Respeitar cooldowns.
- Não utilizar Pokémon desmaiados.
- Não manipular HP ou movimentos.
- Não conhecer comandos futuros do jogador.

Treinadores comuns devem utilizar IA mais simples.

---

13. TREINADORES USANDO POÇÕES — NOVA IMPLEMENTAÇÃO

Quero que treinadores importantes consigam utilizar itens durante as batalhas, seguindo a lógica de FireRed.

Quem pode utilizar

- Treinadores comuns selecionados: raramente.
- Líderes de ginásio: itens limitados.
- Elite Four: itens apropriados ao desafio.
- Campeão: utilização mais estratégica.

Não quero todos os treinadores utilizando poções constantemente.

Itens possíveis

- Potion.
- Super Potion.
- Hyper Potion.
- Full Restore, nas etapas apropriadas.
- Itens de cura de status quando fizer sentido.

Comportamento da IA

O treinador pode utilizar uma poção quando seu Pokémon estiver com HP baixo e houver vantagem estratégica.

Respeitar:

- Quantidade limitada de itens.
- Inventário configurado para o treinador.
- Recuperação correta de HP.
- Limites de HP máximo.
- Animação visível.
- Tempo de utilização.
- Bloqueio temporário de ataques durante o uso.
- Continuidade normal da luta.

O treinador não pode curar e atacar simultaneamente.

Não permitir poções infinitas.

Não permitir utilização repetida sem intervalo.

Visual

Adicionar:

1. Pequeno sprite do item.
2. Animação curta de utilização.
3. Partículas de cura.
4. Recuperação visível da barra de HP.
5. Mensagem discreta informando o item.

Tudo em pixel art.

Balanceamento

Definir os itens disponíveis para cada treinador nos dados da campanha.

Respeitar a dificuldade das regiões.

Líderes iniciais devem ter recursos modestos.

Elite Four e Campeão podem possuir recursos melhores.

Não tornar as lutas excessivamente demoradas.

---

14. SISTEMA DE CLIMA — NOVA IMPLEMENTAÇÃO

Quero que as batalhas possuam condições climáticas com efeitos reais e animações em pixel art.

Os climas devem seguir a mecânica da geração III, adaptando apenas a duração ao combate em tempo real.

Sunny Day — Sol intenso

- Aumenta o poder dos golpes de Fogo conforme FireRed.
- Reduz o poder dos golpes de Água.
- Interage corretamente com movimentos afetados pelo sol.
- Respeita os efeitos de recuperação e demais interações da geração III.

Visual: iluminação quente, raios de sol e pequenas partículas douradas.

Não transformar a arena inteira em uma tela amarela.

Rain Dance — Chuva

- Aumenta o poder dos golpes de Água.
- Reduz o poder dos golpes de Fogo.
- Afeta os golpes especiais que interagem com chuva.
- Respeita as regras de precisão e recuperação da terceira geração.

Visual: chuva em pixel art, gotas diagonais e discretos respingos.

Sandstorm — Tempestade de areia

- Causa dano periódico aos Pokémon vulneráveis.
- Respeita a imunidade natural dos tipos Rocha, Terra e Aço ao dano climático.
- Mantém as regras da terceira geração, sem adicionar bônus de gerações posteriores.
- Deve ser visualmente legível.

Visual: partículas de areia e vento atravessando a arena.

Hail — Granizo

- Causa dano periódico aos Pokémon vulneráveis.
- Respeita a imunidade de Pokémon do tipo Gelo ao dano do granizo.
- Interage corretamente com os golpes afetados pelo clima.

Visual: pequenos cristais de gelo caindo pela arena.

Regras climáticas

- Apenas um clima global ativo por vez.
- Um novo clima substitui o anterior conforme as regras adotadas.
- Duração limitada.
- Não acumular dano climático duas vezes no mesmo intervalo.
- Clima deve afetar jogador e adversário corretamente.
- Não manter clima de outra batalha por acidente.
- Clima precisa funcionar nas diferentes arenas regionais.
- Respeitar as regras de FireRed para movimentos específicos.
- Integrar com sistema de dano, status e cooldowns.

A duração original por turnos deve ser convertida para janelas de combate documentadas e testáveis.

Arenas e clima

As arenas podem ter aparência regional própria, mas o clima visual não deve conceder vantagens automaticamente sem uma regra explícita.

Preservar as arenas já aprovadas.

Testes

Testar:

- Cada tipo climático.
- Troca de clima.
- Expiração.
- Dano periódico.
- Imunidades.
- Modificadores de golpes.
- Interações com status.
- Desempenho no celular.

---

15. CORRIGIR DANO ENTRE POKÉMON

Quando um Pokémon adversário desmaia, o próximo não pode receber dano destinado ao anterior.

Corrigir:

- Projéteis antigos.
- Hitboxes.
- Timers.
- Eventos de colisão.
- Alvos inválidos.
- Efeitos persistentes indevidos.

O Pokémon seguinte deve entrar com HP e status corretos.

Testar golpes de múltiplos impactos e trocas rápidas.

---

16. POKÉMON SHINY

Preservar a chance de 1% de um Pokémon selvagem ser Shiny, conforme o padrão do Torre 2.

Ao entrar:

- Utilizar sprite Shiny correto.
- Mostrar estrelas pequenas.
- Emitir brilho discreto.
- Animação de aproximadamente 1,5 segundo.

A condição Shiny deve permanecer após:

- Captura.
- Troca.
- Evolução.
- Armazenamento no PC.
- Reinicialização.
- Novas batalhas.

Mostrar um pequeno indicador no sumário e na Pokédex.

Não sortear novamente o Shiny após capturar.

---

17. REVANCHES CONTRA TREINADORES — NOVA IMPLEMENTAÇÃO

Quero um sistema de revanches inspirado no VS Seeker de Pokémon FireRed.

Objetivo

Permitir enfrentar novamente treinadores derrotados para conseguir:

- Experiência.
- Dinheiro.
- Treinamento.
- Novas estratégias de batalha.

Não quero revanches obrigatórias para avançar na história.

Como funciona

Após derrotar determinados treinadores, uma opção de revanche poderá ser desbloqueada.

No mapa, mostrar um pequeno símbolo próximo ao treinador indicando que existe uma revanche disponível.

A seleção deve ser simples, sem precisar criar vários mapas.

Regras

- Somente treinadores já derrotados.
- Revanches desbloqueadas conforme a progressão.
- Algumas equipes podem aumentar de nível após novas insígnias.
- Não permitir que a revanche avance os contadores da campanha principal.
- Não entregar novamente insígnias.
- Não entregar novamente TMs únicos.
- Não alterar o progresso dos ginásios.
- Não duplicar recompensas.
- Respeitar limites de dificuldade.

Disponibilidade

Adaptar o conceito do VS Seeker ao mapa atual, que funciona por seleção de treinadores e rotas.

Em FireRed, o VS Seeker é recarregado caminhando; como nosso mapa é diferente, implementar uma recarga baseada em atividades reais do jogo ou em progresso, sem exigir movimento artificial.

Não criar um botão que permita ganhar dinheiro infinitamente em poucos segundos.

Balanceamento

- Recompensas justas.
- XP apropriado.
- Dinheiro moderado.
- Recompensas controladas para evitar exploração.
- Equipes mais fortes conforme a campanha avança.
- Possibilidade de treinar Pokémon recém-capturados.

Não transformar revanches em batalhas repetitivas obrigatórias.

Interface

Adicionar uma pequena opção de "REVANCHE" na seleção do treinador disponível.

O treinador pode possuir uma nova fala antes da luta.

Após a vitória, mostrar XP e dinheiro recebidos no relatório de batalha.

Testes

Verificar que:

- O treinador original permanece derrotado.
- A campanha não retrocede.
- A revanche não concede insígnias novamente.
- O dinheiro é contabilizado corretamente.
- A equipe adversária corresponde à dificuldade desbloqueada.
- O sistema não permite repetição ilimitada sem recarga.

---

18. POKÉMON CENTER

Corrigir e deixar funcional:

- Cura de HP.
- Cura de status.
- Recuperação dos desmaiados.
- Animação curta.
- Salvamento.

O jogador não pode ficar preso sem Pokémon disponíveis.

---

19. BALANCEAMENTO GERAL

Revisar:

- Dano.
- HP.
- Níveis.
- Cooldowns.
- Tipos.
- Status.
- Clima.
- IA.
- Itens dos treinadores.
- Experiência.
- Dinheiro.
- Revanches.
- Dificuldade dos líderes.

Quero batalhas desafiadoras, mas justas.

Não quero ataques absurdos nem adversários com vantagens artificiais.

---

20. REVISÃO COMPLETA DA CAMPANHA

Revisar Kanto desde o primeiro treinador até o Campeão.

Conferir:

- Rotas.
- Encontros selvagens.
- Treinadores.
- Times.
- Níveis.
- Evoluções.
- Golpes.
- Recompensas.
- Ginásios.
- Elite Four.
- Campeão.

Utilizar FireRed/LeafGreen como referência para as equipes e a progressão.

Preservar a estrutura existente aprovada.

---

21. MAPA PRINCIPAL

Quero um mapa mais bonito e organizado.

Melhorar:

- Fundos.
- Caminhos.
- Treinadores.
- Rotas.
- Cidades.
- Ginásios.
- Botões.
- Indicadores de progresso.
- Áreas selecionáveis.

Os locais precisam funcionar:

- Poké Mart.
- Pokémon Center.
- PC.
- Mochila.
- Pokédex.
- Sumário.
- Treinamento.
- Captura.
- Ginásios.
- Revanches.

Não quero menus decorativos sem funcionalidade.

Manter o estilo FireRed e o padrão visual atual.

---

22. ECONOMIA, LOJA E TMS

Quero loja e economia equilibradas.

Vender:

- Poké Ball.
- Great Ball.
- Ultra Ball.
- Potion.
- Super Potion.
- Outros itens de cura apropriados.
- TMs desbloqueados por etapa.

Não liberar todos os TMs de uma vez.

Usar preços equilibrados.

O dinheiro deve ser recebido por treinadores, líderes e revanches, com limites justos.

Preservar a compatibilidade dos TMs com as espécies.

Usar sprites fiéis a FireRed e recursos com permissões adequadas.

---

23. REDESIGN DOS MENUS

Melhorar:

MOCHILA: itens, quantidades, sprites e utilização.

SUMÁRIO: Pokémon, nível, HP, status, evolução e golpes.

POKÉDEX: 151 espécies, evoluções, golpes, tipos, status e Shiny.

TREINAMENTO: XP, nível, evolução e informações claras.

PC: depositar, retirar e organizar Pokémon sem duplicações.

LOJA: sprites, preços, saldo e compras.

Tudo deve seguir o padrão visual do mapa.

---

24. APRESENTAÇÃO DOS LÍDERES

Antes da batalha:

- Líder em destaque.
- Cidade e ginásio.
- Pokémon mais forte ao lado.
- Tamanho proporcional.
- Fala personalizada.

Após derrotar:

- Tela de vitória.
- Fala do líder.
- Insígnia.
- TM de recompensa.
- Dinheiro.
- Salvamento.

Não entregar recompensas únicas repetidamente.

---

25. ESTOJO DAS OITO INSÍGNIAS

Criar uma tela bonita com as oito insígnias de Kanto.

Organizar em duas linhas de quatro.

Insígnias conquistadas aparecem coloridas; as restantes ficam apagadas.

Ao selecionar, mostrar líder, ginásio, cidade e TM recebido.

Usar as recompensas de FireRed:

- Brock — Rock Tomb.
- Misty — Water Pulse.
- Lt. Surge — Shock Wave.
- Erika — Giga Drain.
- Koga — Toxic.
- Sabrina — Calm Mind.
- Blaine — Fire Blast.
- Giovanni — Earthquake.

---

26. RELATÓRIO DE BATALHA

Após cada batalha, mostrar:

- Vitória ou derrota.
- XP recebido.
- Dinheiro ganho.
- Pokémon que subiram de nível.
- Golpes desbloqueados.
- Evoluções.
- Itens.
- Insígnias, quando aplicável.

Animação curta, legível e bonita.

Não duplicar XP ou recompensas ao atualizar a página.

---

27. ANIMAÇÃO DE K.O.

Criar um K.O. em pixel art:

- Letras bem desenhadas.
- Pequeno impacto.
- Animação rápida.
- Transição natural para resultado.

Diferenciar desmaio de um Pokémon do fim da luta.

---

28. EFEITOS SONOROS

Adicionar sons para:

- Lançamento da Pokébola.
- Raio vermelho.
- Captura.
- Escape.
- Balanços da Pokébola.
- Golpes.
- Impactos.
- Críticos.
- Status.
- Climas.
- Evolução.
- Shiny.
- K.O.
- Vitória.
- Insígnia.
- Loja.
- Cura.
- Menus.

Música adequada para mapa, batalhas, líderes, Elite Four e Campeão, com recursos licenciados.

Adicionar:

- Volume geral.
- Volume de efeitos.
- Volume de música.
- Silenciar.

Salvar as preferências.

O áudio não pode causar travamentos ou duplicações.

---

29. LANÇAMENTO E RECOLHIMENTO

Preservar e melhorar as animações existentes.

Entrada:

1. Lançamento.
2. Abertura.
3. Raio vermelho.
4. Materialização.
5. Pokémon pronto.

Recolhimento:

1. Raio alcança o Pokémon.
2. Pokémon diminui.
3. Corpo é absorvido.
4. Sprite desaparece.
5. Próximo entra.

Sincronizar raios, sprites, efeitos e sons.

Não permitir ataques durante transições.

---

30. LABORATÓRIO DE TESTES

Criar laboratório separado da campanha.

Permitir testar:

- Os 151 Pokémon.
- Níveis.
- Evoluções.
- Shiny.
- Golpes.
- Cooldowns.
- Tipos.
- Status.
- Clima.
- Capturas.
- IA.
- Trocas.
- Itens de treinadores.
- Efeitos e animações.

Manter Mewtwo nível 50 disponível para testes.

O laboratório não pode alterar o save principal nem conceder recompensas à campanha.

---

31. SALVAMENTO SEGURO

Salvar automaticamente após:

- Batalhas.
- Capturas.
- Compras.
- Evoluções.
- Alterações na equipe.
- Insígnias.
- TMs.
- Alterações no PC.

Preservar compatibilidade com saves existentes.

Manter backup recuperável.

Não permitir duplicação de Pokémon, dinheiro, recompensas ou itens.

Não resetar minha campanha.

---

32. ESTABILIDADE E DESEMPENHO

Objetivo de 60 FPS.

Otimizar:

- Partículas.
- Efeitos de status.
- Climas.
- Sprites.
- Texturas.
- Áudio.
- Carregamento.
- Memória.
- Eventos.
- Timers.
- Trocas.

Manter fullscreen 16:9 e compatibilidade mobile.

Não reduzir a qualidade dos golpes aprovados.

---

33. TESTES OBRIGATÓRIOS

Testar todos os sistemas com testes automatizados e navegador real.

Especialmente:

1. Fight funcionando.
2. Captura sem mira.
3. Fórmula FireRed.
4. Sprites corretos.
5. Evolução sem tela preta.
6. Learnsets dos 151.
7. Desbloqueios.
8. Tipos e STAB.
9. Cooldowns.
10. IA.
11. Trocas sem dano residual.
12. Todos os status.
13. Status afetando captura.
14. Itens dos treinadores.
15. Limites de poções da IA.
16. Os quatro climas.
17. Dano climático.
18. Interações de clima com golpes.
19. Shiny com 1%.
20. Salvamento Shiny.
21. Revanches.
22. XP e dinheiro das revanches.
23. Recompensas de ginásios.
24. Pokémon Center.
25. Loja.
26. PC.
27. Relatórios de batalha.
28. Efeitos sonoros.
29. Laboratório isolado.
30. Campanha até o Campeão.

Executar:

"npm test"

"npm run check"

"npm run test:browser"

Adicionar testes de regressão permanentes para os bugs corrigidos.

---

34. JOGAR A CAMPANHA ATÉ O FINAL

Quero testes reais no navegador.

Percorrer:

1. Brock.
2. Misty.
3. Lt. Surge.
4. Erika.
5. Koga.
6. Sabrina.
7. Blaine.
8. Giovanni.
9. Lorelei.
10. Bruno.
11. Agatha.
12. Lance.
13. Campeão.

Em cada etapa, verificar:

- Times.
- Níveis.
- Golpes.
- Status.
- Clima.
- IA.
- Uso de itens.
- Sprites.
- HP.
- XP.
- Recompensas.
- Progressão.

Também verificar revanches e novos sistemas nas rotas onde estiverem disponíveis.

Utilize automação para acelerar testes, mas diferencie atalhos de depuração de jogabilidade normal.

Não afirmar que jogou até o final se não executou e verificou esse percurso.

---

35. ORDEM DE EXECUÇÃO

FASE 1 — ESTABILIDADE

Fight, captura, tela preta, sprites, trocas, dano indevido e travamentos.

FASE 2 — COMBATE

Learnsets, quatro slots, desbloqueios, tipos, STAB, críticos, cooldowns e IA.

FASE 3 — STATUS E CLIMA

Veneno, queimadura, sono, paralisia, congelamento, confusão e os quatro climas.

FASE 4 — CAPTURA E SHINY

Captura sem mira, fórmula FireRed, animações, inventário e Shiny.

FASE 5 — CAMPANHA E IA

Times, níveis, líderes, Elite Four, Campeão, trocas inteligentes e itens dos treinadores.

FASE 6 — REVANCHES E ECONOMIA

VS Seeker adaptado, XP, dinheiro, loja, TMs e balanceamento.

FASE 7 — SISTEMAS E INTERFACES

Mapa, Pokédex, mochila, sumário, PC, treinamento e Pokémon Center.

FASE 8 — POLIMENTO

Apresentações dos líderes, insígnias, K.O., relatórios, efeitos sonoros e música.

FASE 9 — LABORATÓRIO E TESTES

Laboratório dos 151, testes automatizados, navegador real e campanha completa.

FASE 10 — PUBLICAÇÃO

Commit, integração, testes finais e GitHub Pages.

Não deixar fases novas quebrarem sistemas já corrigidos.

---

36. PROTEÇÃO DO PROJETO

Preservar:

- Todos os 151 Pokémon.
- Todos os golpes aprovados.
- Sprites aprovados.
- Efeitos aprovados.
- Mewtwo nível 50.
- XP compartilhado.
- Evoluções.
- Pokédex.
- PC.
- Campanha.
- Fullscreen.
- Controles mobile.
- Dados salvos.

Não implementar sistemas duplicados.

Não substituir efeitos em pixel art por CSS, imagens estáticas ou vídeos.

Não adicionar habilidades passivas ou itens equipáveis novos neste patch, pois não foram selecionados. Apenas preservar a compatibilidade com as mecânicas já existentes.

---

37. GITHUB E PUBLICAÇÃO

Antes de trabalhar:

1. Ler "AGENTS.md".
2. Conferir commits recentes.
3. Verificar trabalhos de outros agentes.
4. Criar branch de segurança.
5. Confirmar a versão publicada.

Depois:

1. Implementar.
2. Testar.
3. Corrigir erros.
4. Retestar.
5. Fazer commit.
6. Sincronizar alterações.
7. Executar testes novamente.
8. Publicar no GitHub Pages.
9. Conferir a versão pública.

Entregar:

- Link do jogo atualizado.
- Hash do commit.
- Arquivos modificados.
- Bugs corrigidos.
- Recursos implementados.
- Testes executados.
- Etapas da campanha verificadas.
- Pendências reais.

Não declarar concluído aquilo que não foi realmente testado.

---

ORDEM FINAL — AUTORIZAÇÃO COMPLETA

Você está autorizado a executar todo este Script Mestre no Pokémon Torre 2.

Quero:

- Captura sem mira, mas com probabilidade real.
- Arena jogável.
- Sprites corretos.
- Nenhuma tela preta.
- Golpes coerentes para os 151 Pokémon.
- Quatro slots e desbloqueios.
- Tipos, STAB, críticos e imunidades.
- Status completos.
- Clima dinâmico.
- IA estratégica.
- Treinadores utilizando poções com limites.
- Sem dano indevido nas trocas.
- Shiny com 1%.
- Revanches com XP e dinheiro equilibrados.
- Campanha corrigida até o Campeão.
- Loja e TMs organizados.
- Mapa bonito e funcional.
- Interfaces consistentes.
- Estojo de insígnias.
- Relatórios de batalha.
- K.O. animado.
- Efeitos sonoros e música.
- Laboratório de testes.
- Salvamento seguro.
- Desempenho estável.

Não quero apenas código. Quero tudo funcionando dentro do jogo real.

Não peça autorização a cada pequena etapa. O patch inteiro está autorizado.

Preserve as atualizações aprovadas e não sobrescreva commits recentes de outros agentes.

Faça backup, implemente, teste, corrija, faça commit e confirme a publicação.

OBJETIVO FINAL: TRANSFORMAR O POKÉMON TORRE 2 EM UM JOGO COMPLETO, BONITO, ESTRATÉGICO, EQUILIBRADO E JOGÁVEL DO COMEÇO AO FIM.