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

---

## ANEXO DE PROGRESSO — CONTROLE VIVO (27/10/2026)

> **Leia este anexo antes de executar qualquer nova etapa.** As **1.301 linhas originais do Script Mestre, acima, permanecem intactas**; o anexo não altera nenhuma regra de jogo. O estado abaixo registra o que a documentação, os commits e as PRs indicavam na base `0c17224a5fbf55c90c6de9e0b03a44887aa6c1df`. Não é um relatório de testes novos: **nenhum teste de jogabilidade foi executado para elaborar esta atualização documental**. O texto original define **37 seções**; a fila T01–T31 divide o trabalho em **31 pacotes operacionais**, não em 31 patches já finalizados.

**Documentos complementares e obrigatórios:** [fila operacional T01–T31](./FILA-CONTINUE-SCRIPT-MESTRE.md) (ordem de execução e critérios de fechamento), [controle das 37 seções](./CONTROLE-EXECUCAO-SCRIPT-MESTRE.md) (evidências de cada seção), [relatório histórico](./PATCH-MESTRE-2026-10-24.md) e [regras dos agentes](../AGENTS.md). Se outro agente mudar o projeto, **reavaliar o HEAD e as PRs** antes de decidir a próxima tarefa. Nunca transferir cegamente estados antigos.

### A. Implementações e correções já registradas — não refazer sem erro comprovado

- **Captura (§2–3):** lançamentos sem mira com acerto automático no alvo, fórmula FRLG de captura com taxas das 151 espécies e quatro verificações, Pokébolas consumidas conforme o resultado, integração com equipe/PC. **Parcial** até comprovar toda a animação e casos de navegador.
- **Estabilidade de batalha (§4–6,15,29):** correção anterior de FIGHT/paginação, atributo inválido que produzia câmera preta na evolução, atualização de identidade do lutador e limpeza de danos anteriores na troca. Ainda requer regressões amplas em Arena e campanha.
- **Combate (§7–12):** tabela de tipos Gen III, STAB, status e cooldowns básicos, adaptador de learnsets, três golpes iniciais no nível 5 e ULT no nível 8, política de troca estratégica e poções limitadas para treinadores. **Pendente fechar** fórmula integral de dano e todos os Pokémon/modos.
- **Status, clima e laboratório (§10,14,30):** efeitos mecânicos básicos de veneno, burn, sleep, paralysis, freeze, confusion e quatro climas; laboratório para 151 espécies e Mewtwo nível 50 com isolamento do save relatado. Ainda faltam VFX, ligações de golpes/itens, Shiny e captura isolada completos.
- **Campanha e sistemas (§17–26,31):** estrutura de Kanto, revanches opcionais, loja/PC/Pokédex, Center, sete TMs, estojo de oito insígnias com sprites, BAG de batalha, painel pós-luta e Salão da Fama. São sistemas com implementações registradas, **não a prova de conclusão de toda a campanha**.
- **Commits de 27/10:** `35bbd8f` (AUTO e velocidade da Arena), `e77bd4f` (Bolsa em batalha), `c8223fc` (painel de resultado), `6f85d1d` (Salão da Fama), `2a44839` (cura), `10da46d` (derrota antiga não reaplicada no Center), `c705d0b` (remoção da trava de cinco buscas na grama). O commit `e992105` documenta **oito batalhas iniciais naturais**, não a campanha inteira.

**Regra de precisão:** “já implementado” não significa “100% concluído”; se o resultado documentado foi obtido por depuração, fixture ou teste controlado, não chamar de campanha jogada normalmente. Não declarar a publicação de alterações novas sem verificar CI, Pages e o jogo real.

### B. Estado seção a seção (fotografia da auditoria)

**Legenda:** “Histórico validado” = teste/documentação anterior, não reexecutado neste anexo; “Parcial” = há trabalho e lacunas; “Em PR” = não integrado; “Pendente / não auditado” = sem evidência bastante para fechar. 

| § | Área | Estado registrado | Próximo fechamento / verificação |
|---|---|---|---|
| 1 | Missão e preparação | Parcial | Revisar conflitos e HEAD a cada lote; evidenciar a versão realmente publicada |
| 2 | Captura sem mira e animação | Parcial | Inspecionar todas as etapas visuais e captura em fluxo natural/celular |
| 3 | Fórmula original FRLG | Histórico validado | Regressão da integração mais recente, inclusive RNG natural e saves |
| 4 | FIGHT da Arena | Parcial | Reproduzir no modo **Arena** e campanha, desktop/mobile, após alterações atuais |
| 5 | Tela preta após evoluir | Parcial | Cobertura integral das evoluções e trocas, no Phaser público |
| 6 | Identidade dos sprites | Parcial | Conferir espécies/formas/trocas de todas as equipes até Campeão |
| 7 | Learnsets dos 151 | Parcial | Auditar 151 espécies nos modos, evolução, golpes exclusivos e compatibilidade de TMs |
| 8 | 4 golpes e ULT nível 8 | Parcial | Validar novos iniciais, todos os modos, evolução, save e nenhuma ULT forte antecipada |
| 9 | Tipos/STAB/crítico | Parcial | Fórmula final de dano e classes físico/especial com testes de jogabilidade |
| 10 | Status e Toxic | Parcial + PR | Auditar VFX, timeouts, cura em batalha, Toxic e todas as transições |
| 11 | Cooldowns e IA de ataque | Parcial | Auditoria por espécie/golpe dos cooldowns de ambos os lados |
| 12 | IA de troca estratégica | Parcial | Partidas reais, transições, múltiplas reservas e compatibilidade mobile |
| 13 | Poções de treinadores | Parcial | Sprites/partículas e teste natural por cada líder/Elite Four |
| 14 | Clima | Parcial | Efeitos de pixel art globais, movimentos ainda não ligados e precisão/recuperação |
| 15 | Dano residual na troca | Parcial | Regressão nos golpes multi-hit, derrotas e trocas rápidas após novos VFX |
| 16 | Shiny 1% | Em PR | Sprite canônico, persistência nas evoluções, batalha real e integração |
| 17 | Revanches | Parcial | Validar níveis, rotas e economia em jogo normal |
| 18 | Pokémon Center | Parcial | Fluxo sem fixtures após KO total e consistência dos saves antigos |
| 19 | Balanceamento geral | Parcial | Métricas de duração e dificuldade do início até a Liga |
| 20 | Campanha completa | Parcial | [PR #30](https://github.com/lulualcides-sys/Pok-mon-torre-2/pull/30) aberta; avançar jogando de forma normal até Brock e Campeão |
| 21 | Mapa e locais | Parcial | Abrir **cada local** e comprovar todos os menus e transições |
| 22 | Loja, TMs e economia | Parcial | Toxic de Koga (PR #16), remédios em batalha, todas as regras de consumo |
| 23 | Redesign de menus | Parcial | Cobrir PC, mochila, mobile, acessibilidade e funcionamento real |
| 24 | Apresentação dos líderes | Parcial / não auditado | Validar apresentações visuais, falas, ás, insígnia e salvamento de cada líder |
| 25 | Estojo das insígnias | Histórico validado / integração a rever | Confirmar publicação/frames e transição após vitórias sem fixtures |
| 26 | Relatório de batalha | Parcial | Regressão de todas as recompensas, XP, insígnias e recarga sem duplicação |
| 27 | K.O. em pixel art | Pendente / não auditado | Auditar implementação atual, efeitos, derrota de membro vs fim da luta |
| 28 | Sons e música | Pendente / não auditado | Licenciamento, áudio do jogo, controles, persistência e testes |
| 29 | Lançamento/recolhimento | Parcial / não auditado | Verificar sincronismo de sprites, raios, transições e bloqueio de ataques |
| 30 | Laboratório 151 | Parcial | Shiny, captura isolada e cobertura de todas as transições e VFX |
| 31 | Salvamento seguro | Parcial | Verificar restauração, idempotência e integridade com saves legados |
| 32 | FPS/desempenho | Pendente / não auditado | Medir frame-time real, memória e estabilidade no Android/desktop |
| 33 | Testes obrigatórios | Parcial | Cobertura completa das 30 verificações e documentação de lacunas |
| 34 | Campanha jogada até o Campeão | **Pendente** | Jogar em fluxo normal até Campeão, conferir cada batalha e save |
| 35 | 10 fases de execução | Parcial | Encerrar fases com critérios objetivos, sem pular regressões |
| 36 | Preservação do projeto | Parcial (política ativa) | Auditar alterações futuras contra aprovações e integridade dos saves |
| 37 | GitHub/publicação | Parcial (pipeline ativo) | Para **cada patch futuro**, verificar diff, run, SHA implantado e jogo público |

### C. Ordem de trabalho vinculada ao comando «Continue»

1. **T01 — próximo obrigatório:** campanha natural até Brock, verificando o Rival, o Centro, HP/XP, capturas e saves. O PR #30 de diagnóstico estava aberto nesta revisão; **não duplicar a mesma alteração**.
2. **T02–T06:** estabilizar FIGHT/BAG/controles, evoluções, sprites, projéteis antigos, saves e animação de captura; revalidar o que já foi corrigido antes de escrever novas versões.
3. **T07–T12:** golpes específicos e learnsets dos 151, slots Lv5/ULT Lv8, cooldowns, AUTO, fórmula de dano, tipos, críticos, IA de ataque e troca.
4. **T13–T17:** Toxic e demais status, remédios em batalha, quatro climas e VFX, Shiny 1% com sprites e persistência. Revisar PRs #16 e #17 antes de integrar.
5. **T18–T20:** conferir identidades/evoluções e avançar naturalmente por todas as rotas, oito ginásios, Elite Four e Campeão; não confundir testes com fixtures com vitórias jogadas.
6. **T21–T26:** balanceamento, revanches/economia, loja/TMs, mapa clicável, Pokédex, sumário, PC, apresentações dos líderes e insígnias.
7. **T27–T29:** relatórios, K.O., lançamento/recolhimento, áudio licenciado e laboratório isolado dos 151.
8. **T30:** grande otimização e redesign visual em pixel art, **somente após estabilizar** os sistemas; não alterar sprites/golpes aprovados.
9. **T31:** 30 verificações obrigatórias, testes reais desktop/mobile, percurso até o Campeão, CI, merge, publicação e comprovação do SHA instalado.

### D. Trabalho simultâneo e regra de continuidade

- No momento desta revisão: [PR #30 — progressão natural até Brock](https://github.com/lulualcides-sys/Pok-mon-torre-2/pull/30), [PR #16 — Toxic de Koga](https://github.com/lulualcides-sys/Pok-mon-torre-2/pull/16) e [PR #17 — Shiny 1%](https://github.com/lulualcides-sys/Pok-mon-torre-2/pull/17) **abertas**. Conferir seus estados atuais a cada retomada. O próximo foco é **T01 / campanha natural até Brock**, ou a primeira frente independente se T01 ainda estiver sendo alterada por outro agente.
- Sempre que o usuário disser apenas **«Continue»**: ler este anexo + a fila + `AGENTS.md`; checar commits, PRs e código efetivamente publicado; escolher a primeira pendência sem colisão; auditar antes de codificar; corrigir, testar, integrar e publicar com evidência; atualizar este anexo, a fila e a matriz de 37 seções.
- Não tocar em golpes/sprites/VFX já aprovados, saves ou funcionalidades concluídas sem necessidade comprovada e autorização aplicável. Não reiniciar pela primeira seção por padrão; não criar componentes duplicados. Documentar bloqueios e prosseguir por escopo independente quando seguro.
- O **grande patch final de pixel art e design** acontece depois de estabilidade e validação dos sistemas, conforme T30; a aceitação completa é T31.


### E. Diário de continuidade — execução T01 de 27/10/2026

**Status: T01 parcial; próxima tarefa inalterada.** Foram conferidos `main`, `AGENTS.md`, PR #30 e o código da campanha. O diagnóstico anterior confirma 12 vitórias sem forçar K.O., derrota real contra o Rival #13 com apenas Bulbasaur e Brock **ainda não vencido**. Não será marcada vitória sem capturar/treinar normalmente e repetir o percurso.

Foi implementada na [PR #36](https://github.com/lulualcides-sys/Pok-mon-torre-2/pull/36) uma correção independente e limitada da grama alta: a etapa Victory Road (stage 8, treinadores 0–16) mantém encontros selvagens; após liberar Lorelei (trainer >= 17) e nas câmaras seguintes, iniciar novos encontros fica bloqueado. Há teste permanente para estado, dinheiro, Pokébolas e progresso. A [execução CI 40577322862](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/40577322862) passou por sintaxe, regras, unitários, build Phaser e testes focados; a regressão geral de navegador **ainda estava em execução na última checagem**. Até confirmação, **não afirmar merge ou publicação**.

**Próximo `Continue`:** revalidar CI/PR #36 e integrar somente se a suíte completa passou; conferir GitHub Pages. Em seguida focar no obstáculo real da T01 (capturar e treinar equipe, disputar Rival #13 e vencer Brock no Phaser sem trapaças), sem interferir no trabalho concorrente da PR #30.


### F. Continuação T01 — integração corrigida e teste natural de equipe

## Atualização T01 — validação da PR #36 e equipe natural para Rival (27/10/2026)

- [PR #36](https://github.com/lulualcides-sys/Pok-mon-torre-2/pull/36) foi **integrada** em `774b8b690407f390ce0f3698a34aabb8149a102b`. O [CI específico #40577322862](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/40577322862), a suíte de navegador, a [validação integrada #40578446714](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/40578446714) e o [workflow Pages #40578491197](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/40578491197) concluíram com sucesso. **Acessibilidade visual do site público não foi checada diretamente nesta execução**, somente o resultado remoto do Pages.
- [PR #38](https://github.com/lulualcides-sys/Pok-mon-torre-2/pull/38) (draft) acrescenta **teste, não modificação de jogo**: 12 vitórias de treinadores sem forçar K.O.; 12 Pokébolas compradas por botão real, duas capturas com RNG natural, cura real pelo Centro, depois Rival #13 e Brock. Não repetir trabalho do [PR #30](https://github.com/lulualcides-sys/Pok-mon-torre-2/pull/30) nem presumir vitória. O [run #40579140270](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/40579140270) estava em execução durante este registro; **resultado a confirmar**.
- **Próximo `Continue`:** conferir o resultado e evidências da PR #38; se falhar, identificar a causa real (captura RNG, interface, HP, composição de equipe, IA) antes de alterar código. T01 só fecha após Brock vencido normalmente, sem fixtures, e verificação pós-merge/Publicação.




### G. T01 — Brock validado sem vitória forçada; próximo T02

## Marco validado em 27/10/2026 — T01 / Brock

- O [teste Chromium/Phaser #40579140270](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/40579140270) **concluiu com sucesso**. Logs: 12 vitórias consecutivas com Bulbasaur nível 5→12, compras de 12 Pokébolas no Poké Mart por clique, **duas capturas normais (Geodude e Weedle, depois Kakuna/Beedrill por evolução)**, cura no Centro por botão, vitória no Rival #13, vitória no Brock #14. Sem injeção de K.O., HP, nível, dinheiro, probabilidades, prêmios ou vitórias.
- Estado após Brock: `stage=1`, `trainer=0`, `wins=14`, `losses=0`, **insígnia Rocha** e **TM39 Rock Tomb**. O Bulbasaur atingiu nível 13; equipe de apoio evoluiu ao longo das vitórias. O Mewtwo permaneceu apenas no PC.
- [PR #38](https://github.com/lulualcides-sys/Pok-mon-torre-2/pull/38) integrada em `76783d9d1b828c192b8c94c1ff4c7d34ccd857cd`, **somente teste e workflow**, sem mudança das regras do jogo. [CI em main #40591596826](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/40591596826) aprovado. [Pages pós-merge #40591672705](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/40591672705) ainda em execução na consulta; navegador público não auditado diretamente.
- **T01 validada em teste real do Phaser, não significa campanha inteira concluída.** Se PR #30 permanecer aberta com o diagnóstico antigo de derrota usando apenas Bulbasaur, ela não invalida a vitória com equipe legítima. Não alterar os saves nem os sprites/golpes para acomodar artificialmente o teste antigo.
- **Próxima tarefa na fila: T02** — FIGHT/POKÉMON/BAG/RUN, desktop/mobile, na Arena e campanha. A progressão real de Misty em diante segue T19/T20 e a conclusão até Campeão continua pendente (§34).



### H. T02 — controles móveis validados, pendências mantidas

## T02 — validação de toque mobile e próximo fechamento (27/10/2026)

- A [PR #41](https://github.com/lulualcides-sys/Pok-mon-torre-2/pull/41) introduziu apenas o teste [t02-mobile-menu-browser.cjs](../tests/t02-mobile-menu-browser.cjs) e seu workflow, integrada em `f797b82b1f1189c18e3931acf882a38a84113962`. **Nenhum golpe, sprite, interface ou save de usuário mudou.**
- O [run Chromium/Phaser #40592499809](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/40592499809) **passou**: touchscreen 854×480 aciona o FIGHT do modo Arena com 6 sprites; BAG da campanha abre/fecha; Pokémon troca de Bulbasaur para Squirtle por hotspot real; sem consumo de item, vitória ou progresso fictícios. Squirtle é um fixture isolado somente no navegador de testes e Mewtwo permaneceu no PC.
- A primeira execução [#40592307860](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/40592307860) falhou porque o fixture tentou apagar Mewtwo; migração do jogo o restaurou conforme planejado. O fixture foi corrigido, não o jogo; então o run seguinte passou.
- **T02 continua parcial.** Não foi demonstrada cobertura integral dos menus de desktop, dos golpes e de RUN quando permitido. Próximo `Continue`: examinar o fluxo de controles restante sem duplicar o que os testes existentes já cobrem.
- **T01:** [Pages #40591672705](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/40591672705) confirmou sucesso do commit de T01 `76783d9`. A campanha natural está validada até Brock, não até Campeão. Um teste em navegador separado contra o site público ainda não foi executado.



### I. T03 — regressão visual isolada da evolução Gyarados

## T03 — primeiro teste de tela preta após evolução (27/10/2026)

- [PR #44](https://github.com/lulualcides-sys/Pok-mon-torre-2/pull/44) integrada em `9a0dc6112097da215c1efdcfb67119f3d4c1ec76`, somente teste de navegador e workflow. [CI #40595592409](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/40595592409) aprovado: evolução **Magikarp → Gyarados** acionada na batalha; cena `combate` permanece ativa, textura `pmd-0130-Idle` carregada, sprite visível, frame 72×128, canvas WebGL 1280×720 e ataques por toque após evolução.
- Esta prova é **pontual**: não assegura que todas as 151 espécies e linhas evolutivas estejam livres de tela preta. A T03 continua parcial; não foram alterados golpes, sprites, VFX ou jogabilidade.
- A [PR #43](https://github.com/lulualcides-sys/Pok-mon-torre-2/pull/43) trata de RUN e desktop da T02 de modo concorrente. [Run #40595345855](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/40595345855) falhou na suíte global da Bolsa (antídoto não consumido no teste), embora o teste isolado de RUN selvagem tenha passado. **Não integrar T02 sem revisão dos testes finais do HEAD**.
- **Próximo `Continue`:** verificar novo HEAD/CI da PR #43; concluir T02 se estiver estável e prosseguir com a matriz T03 das evoluções, preservando os recursos já aprovados.



### J. T03 — três iniciais de Kanto também validados

## T03 — quatro evoluções verificadas na Arena (27/10/2026)

- A [PR #46](https://github.com/lulualcides-sys/Pok-mon-torre-2/pull/46) foi integrada no commit `db8baf0cc1e917fff14dca4600581f4beb88ff17`. Introduziu **somente** o teste `tests/t03-starter-evolutions-browser.cjs` e um workflow, sem alterar o motor, golpes, sprites, saves ou VFX.
- O [CI #40596220909](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/40596220909) teve sucesso no **Phaser da Arena**: ao acionar o EVO nativo, Bulbasaur virou Ivysaur (PMD `pmd-0002-Idle`), Charmander virou Charmeleon (`pmd-0005-Idle`) e Squirtle virou Wartortle (`pmd-0008-Idle`). Em cada evolução, a cena continuou ativa, a textura estava carregada, o frame era não vazio e os quatro golpes tinham nomes sem `pendiente`.
- Junto ao teste de Magikarp → Gyarados da PR #44, há **quatro linhas evolutivas pontualmente verificadas**. No novo teste, a prontidão para EVO foi preparada com experiência apenas no **fixture do navegador**, não em nível natural da campanha. Logo, T03 e a seção §34 continuam abertas. Um teste do site público pós-merge ainda precisa ser feito.
- **T02:** a PR #43 para RUN e menus desktop ainda está isolada. Os logs da execução [#40595946184](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/40595946184) confirmam clique RUN selvagem bem-sucedido e RUN ausente contra treinador, mas falha posterior no teste desktop do Antídoto na Bolsa (estoque não consumido e modal continuou aberto). Não integrar até revisar o último HEAD e validar a suíte completa.



### I. T02 — RUN na PR limpa, suíte geral ainda pendente

## T02 — RUN isolado e teste real de desktop (27/10/2026)

- A [PR #43](https://github.com/lulualcides-sys/Pok-mon-torre-2/pull/43) **foi fechada sem merge** porque também continha experimentos de câmera/posição da Bolsa que não passaram regressões. Nenhuma dessas mudanças deve ser incorporada automaticamente.
- A [PR #48](https://github.com/lulualcides-sys/Pok-mon-torre-2/pull/48) traz **apenas** RUN de selvagens, teste Chromium desktop e workflow; não modifica sprites, golpes, Bolsa nem modos Arena. RUN limpa `pendingWild`, conserva HP/status da equipe, inventário, XP, dinheiro, vitórias e derrotas; não existe em batalhas com treinadores. O botão foi movido para o espaço entre a Bolsa e o AUTO após auditoria de zona nativa de profundidade 9600.
- No [CI #40596836115](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/40596836115), checks, build e fase de navegador de RUN/BAG/POKÉMON desktop, FIGHT mobile **passaram**. Na última consulta o `npm run test:browser` **ainda executava**. Portanto, **não declarar PR #48 integrada, deploy concluído ou T02 fechada**.
- Um teste anterior de antídoto em batalha apresentou clique perdido quando a câmera movia a projeção do menu. Esse problema continua **pendente de diagnóstico e correção separados**, sem aplicar os experimentos malsucedidos à main.
- Próximo `Continue`: verificar a conclusão do CI #40596836115 e, se aprovado, integrar PR #48 com verificação de Pages. Depois solucionar antídoto e demais controles T02. **T03 já está sendo trabalhada em outra frente; não sobrescrevê-la.**



### J. T02 — RUN integrado, testes completos aprovados

## Marco T02 — RUN integrado sem alterações na Bolsa (27/10/2026)

- A [PR #48](https://github.com/lulualcides-sys/Pok-mon-torre-2/pull/48) **foi integrada na main** como `0f726b9f804423174cf116baa169adf19d8fe59e`. O [workflow completo #40596836115](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/40596836115) finalizou em **success**: validações sintáticas, testes unitários, proteção de golpes, build Phaser, cliques de RUN e troca no desktop, FIGHT/BAG no mobile e suíte oficial `npm run test:browser`.
- RUN existe **apenas em encontros selvagens**, posicionado longe do hitzone HUD (578,66). Fugir cancela somente o encontro, grava HP/status por UID, não concede XP, itens, dinheiro, vitórias nem derrotas. Nenhuma regra de captura, sprite ou golpe aprovado foi modificada.
- A [PR #43](https://github.com/lulualcides-sys/Pok-mon-torre-2/pull/43) experimental foi encerrada **sem merge**. Mudanças não aprovadas na Bolsa ficaram fora da PR #48.
- **T02 permanece parcial:** teste antigo de Antídoto com câmera dinâmica ainda falhou na frente experimental, enquanto o novo teste normal de BAG abriu/fechou e manteve estoque. Essa falha **não foi corrigida nem declarada concluída**; requer investigação isolada da transformação de hitzones depois de movimentos da câmera.
- O [CI pós-merge #40597754055](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/40597754055) estava em execução na consulta. **Não declarar novo SHA publicado em Pages até workflow de deploy confirmado.** As tarefas T03–T05 já foram tratadas em outras frentes concorrentes: revisar HEAD e PRs antes do próximo patch.



### K. T05 backup de save validado e RUN mobile integrado

## Atualização integrada: T05 backup e T02 mobile (27/10/2026)

- **T05:** [PR #49](https://github.com/lulualcides-sys/Pok-mon-torre-2/pull/49) integrada em `74c7aaaceb1d1a779d0e35caf1a92ee98ec463af`. O [CI #40597965984](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/40597965984) passou com cinco testes de integridade, build original, teste Chromium de recarregamento e restauração de backup de save com JSON válido porém estrutura inválida (equipe vazia). Mantidos PC/Mewtwo, HP, dinheiro, itens/TM, insígnia e progresso; reset continua apagando backup. [CI main #40598307857](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/40598307857) e [Pages #40598347863](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/40598347863) **sucesso**. T05 ainda **parcial** até auditar saves após todos os eventos (evolução, captura, compra, K.O.).
- **T02:** [PR #52](https://github.com/lulualcides-sys/Pok-mon-torre-2/pull/52) integrou em `2eaa3305f09e6403f06218f7f6b3481e22d2111f` novo teste de menu e **RUN touchscreen real** com viewport móvel, sem modificar o runtime. [CI #40598192704](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/40598192704) passou a suite inteira. [CI main #40599157504](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/40599157504) passou. O [Pages #40599199331](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/40599199331) estava **aprovado** nesta consulta. RUN somente em selvagens, nenhuma fuga de treinador.
- **T02 Bag/câmera:** [PR #53](https://github.com/lulualcides-sys/Pok-mon-torre-2/pull/53) em draft, mudança de scrollFactor dos objetos visuais e hitzones para evitar hitboxes deslocadas sob pan/zoom; [CI #40599441925](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/40599441925) ainda **não havia concluído** na verificação deste registro. **Não integrar** a PR com teste falho ou sem evidência. Há outra branch experimental de mesmo tema, `fix/master-t02-bag-hud-camera-20261027`, que não foi mesclada; comparar antes de avançar e evitar sobreposição.
- **Próximo trabalho seguro:** concluir diagnóstico câmera/antídoto da T02 somente após CI sólido. Em paralelo, avançar T03/T04 em branches sem conflito. Sem alterações em golpes, VFX ou sprites aprovados.



### L. Continuidade T02 validada em CI; T04 em regressão

## Continuidade de T02 e T04 — 27/10/2026

- T02: [PR #53](https://github.com/lulualcides-sys/Pok-mon-torre-2/pull/53) integrada em SHA 81e29698a07f6fd41d088522afb3bfc2a40b5232. [CI #40600983129](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/40600983129) e [CI main #40602048321](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/40602048321) passaram. Bolsa acompanhando zoom/pan, poção e antídoto consumidos por clicks reais, troca e RUN desktop/mobile já testados. [Pages #40602087786](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/40602087786) aguardando resultado na consulta. Não afirmar publicação até sucesso.
- T04: [PR #57](https://github.com/lulualcides-sys/Pok-mon-torre-2/pull/57) draft previne erro quando lista de projéteis contém valores nulos ou referências repetidas na troca e KO. [CI #40601951402](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/40601951402): testes unitários e switching em Chromium passaram; suíte integral em execução quando consultada. Não integrar até CI completo.
- A validação T02 cobre menus FIGHT/BAG/POKÉMON/RUN nos cenários desktop e mobile testados; não equivale a toda combinação de modos nem ao teste em dispositivo físico. T04 permanece parcial para os golpes multi-hit e todas as transições.


### M. Teste das evoluções finais dos três iniciais

## Atualização T03 — evoluções finais dos três iniciais (27/10/2026)

- [PR #59](https://github.com/lulualcides-sys/Pok-mon-torre-2/pull/59), integrada no commit 4eaf476286d35c940993fd0f1a23245422db8bd5, adiciona apenas um teste Chromium/Phaser e workflow. [CI #40602575454](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/40602575454) passou. Bulbasaur→Ivysaur→Venusaur (PMD #0003); Charmander→Charmeleon→Charizard (PMD #0006); Squirtle→Wartortle→Blastoise (PMD #0009), duas evoluções por linha via botão EVO na Arena. Texturas carregadas, sprites visíveis e quatro slots de golpes não vazios. Nada foi alterado em golpes, sprites, VFX ou runtime do jogo.
- Em conjunto com o teste Magikarp→Gyarados da [PR #44](https://github.com/lulualcides-sys/Pok-mon-torre-2/pull/44), há 7 transições de evolução verificadas no navegador (6 dos três iniciais + 1 Gyarados). Estes testes preparam a experiência no fixture da Arena e **não comprovam evolução natural por nível na campanha**; T03 continua parcial até testar demais espécies e saves.
- T02: [Pages #40602087786](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/40602087786) concluiu com **sucesso** para commit 81e29698a07f6fd41d088522afb3bfc2a40b5232, após integrar a correção pan/zoom da Bolsa. A publicação posterior que inclui apenas testes T03 ainda precisa de confirmação.
- T04: [PR #57](https://github.com/lulualcides-sys/Pok-mon-torre-2/pull/57) draft, sem merge na verificação; os testes unitários e de troca/KO no Chromium passaram e a suíte total ainda estava em execução. Não declarar concluída.


### N. T04 — limpeza segura de efeitos e projéteis na troca/K.O.

## T04 — proteção adicional de projéteis na troca e KO (27/10/2026)

- [PR #57](https://github.com/lulualcides-sys/Pok-mon-torre-2/pull/57) foi integrada em SHA 9083fecc003a76c148ababfda7f70aff619558f1. O [CI completo #40601951402](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/40601951402) passou: testes de unidade, build nativo, troca de Pokémon no Chromium e suite de navegador oficial.
- Correção restrita a [torre2-combat-boundary.js](../tools/pokearena/torre2-combat-boundary.js): ao recolher Pokémon, slots nulos em efeitos não interrompem a limpeza e referências duplicadas são destruídas só uma vez. Filas de impactos pendentes são descartadas sem curar/danificar o elenco. Os testes injetam colisões múltiplas em fixture; não são prova de cada golpe real existente.
- A seção §15 e a T04 seguem PARCIAIS até percursos Phaser com golpes multi-hit reais, trocas de inimigos, K.O. rápido e eventual dano residual. [CI main #40603066070](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/40603066070) e Pages da atualização estavam em execução na consulta; só declarar publicação após sucesso.
- Próximo: concluir regressões naturais T03/T04 e continuar T05–T31, sem alterar golpes, efeitos ou sprites aprovados.
