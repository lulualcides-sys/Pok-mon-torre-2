# Pokémon Torre 2 — Golpes específicos: controle de conclusão
Data: 21/10/2026

**Alvo deste ciclo:** apenas golpes que não possuem visual original no Poké Arena 2D. Não redesenhar originais. Nada de novas tecnologias globais nesta etapa. **17 golpes específicos aprovados, incluindo Petal Dance. Três novos golpes aguardam avaliação visual: Metronome, Absorb e X-Scissor.**

| Nome | Situação | Base técnica | Próxima ação |
|---|---|---|---|
| Bonemerang | ✅ aprovado | Golpe próprio Torre 2 | Congelar |
| Bone Club | ✅ aprovado | Golpe próprio Torre 2 | Congelar |
| Tri Attack | ✅ aprovado | Golpe próprio Torre 2 | Congelar |
| Pay Day | ✅ aprovado | Golpe próprio Torre 2 | Congelar |
| Shadow Ball | ✅ aprovado | Golpe próprio Torre 2 | Congelar |
| Ice Beam V6 | ✅ aprovado | Chorro nativo, paleta de gelo | Congelar |
| Rock Blast | ✅ aprovado | Pedras pixeladas individuais | Congelar |
| Confuse Ray amarelo | ✅ aprovado | Primeira versão das três luzes | Congelar |
| Soft-Boiled | ✅ aprovado | Ovo e cura pixelados | Congelar |
| Swift | ✅ aprovado | 7 estrelas com trajetória e colisão individuais | Congelar |
| Lovely Kiss | ✅ aprovado | Lábios e cinco corações pixelados | Congelar |
| Sing | ✅ aprovado | Notas musicais pixeladas | Congelar |
| Crabhammer | ✅ aprovado | Pinça pixelada | Congelar |
| Smog | ✅ aprovado | 17 bolhas, impactos individuais | Congelar |
| Hyper Fang | ✅ aprovado | Incisivos grandes de rato | Congelar |
| Guillotine | ✅ aprovado | Duas pinças visíveis fechando no alvo | Congelar |
| Petal Dance | ✅ aprovado | Pétalas pequenas acompanhando a mira manual (Ice Beam) | Congelar |

**Proteções:** nenhum item aprovado muda sem autorização explícita. Original Pokémon Arena 2D: manter 100% do visual pré-existente. Surf permanece oculto/não equipável.

**Adiados:** ajuste global de origem do golpe ao corpo/movimentos até inclusão dos 151 Pokémon de Kanto; iluminação dinâmica mais adiante.

**Avaliação futura de golpes específicos:** comparar catálogo original para confirmar ausência de VFX nativo antes de iniciar qualquer novo ataque; se houver VFX nativo, não fazer outro.

## Próximos golpes após concluir os 11

Triagem inicial e ordem sugerida em [CATALOGO-PROXIMOS-GOLPES-ESPECIFICOS.md](./CATALOGO-PROXIMOS-GOLPES-ESPECIFICOS.md). Cada candidato ainda precisa de conferência visual no cliente atual antes de implementação.

## Revisão de Bite / Crunch e aprovação de Gust / Poison Sting (21/10/2026)
- **Gust — ✅ aprovado, congelado.** Manter renderer, precisão, dano e colisões sem mudanças.
- **Poison Sting — ✅ aprovado, congelado.** Manter ferrão, chance de envenenamento e colisões sem mudanças.
- **Bite — ✅ aprovado, congelado.** Duas mandíbulas pixeladas em 8 posições reais (abrir → fechar → reabrir), contorno escuro, tamanho proporcional e uma única colisão verdadeira. Visual baseado no spritesheet de mordida fornecido e confirmado pelo usuário.
- **Crunch — ✅ aprovado, congelado.** Entrada original preservada (sem duplicar) e renderer alterado somente no moveset da campanha. Duas mordidas sequenciais com a mesma matriz, a primeira reta/horizontal e a segunda girada a 90 graus/vertical. Dano do movimento pode ocorrer uma única vez se alguma das duas fechar sobre o alvo, sem autoacerto. Aprovação visual recebida; não alterar arte e dano sem solicitação expressa.
- Não alterar visual dos golpes originais Pokémon Arena 2D, nem os específicos previamente aprovados, fora os dois movimentos autorizados neste patch.

## Aprovação e retorno à campanha normal — 21/10/2026
- **Bite e Crunch aprovados**, ambas as animações congeladas. Não alterar outros golpes aprovados.
- Removido o modo especial `?testMoves=bite-crunch`, seu save separado e a abertura automática do sumário Mewtwo.
- **Entrada normal:** tela inicial aprovada, botão Play → Kanto Campaign; progresso do jogador permanece em `pokemon-torre-2-kanto-campaign-v1`.
- **Próximo lote proposto para as primeiras rotas:** String Shot (Caterpie/Weedle), Peck (Spearow), Leech Life (Zubat). Validar ausência no cliente capturado antes de criar sprites próprios; usar Phaser/WebGL pixel art, manter efeitos nativos intactos.

## Menu principal — aprovado em 21/10/2026
O menu inicial com o nome **Pokémon Torre**, logo em pixel art, mesmo layout, fundo, botões, tipografia e navegação foi **aprovado** pelo usuário. **Não modificar** menu, logo, dimensões ou funcionamento sem novo pedido.

## Novo lote sob revisão — 21/10/2026
**Metronome, Absorb e X-Scissor continuam SEM visto de aprovação.** Último feedback: Metronome e Absorb reduzidos aproximadamente 50% (palma/dedo, folha, gotas, retornos e faíscas). X-Scissor foi refeito com **dois cortes diagonais cruzados em X, contorno preto, ponta afiada, interior azul-esverdeado e impacto somente no encontro real**. Todos usam sprites de matriz em Phaser/WebGL. Não alterar golpes aprovados nem o menu.


## Proteção adicional — original Poké Arena / Pokémon Arena 2D
- O usuário também aprova e protege **todas as animações de golpes já existentes no cliente original**, não apenas os 17 efeitos próprios aprovados do Pokémon Torre 2.
- Os vídeos de **Pokémon Arena** e o cliente **Poké Arena 2D (https://www.pokearena2d.com/)** são referências visuais prioritárias para novos golpes realmente ausentes; respeitar autorização/licenças de assets.
- Nunca acrescentar outra entrada de golpe cujo nome canônico já esteja na base, incluindo traduções Português/Inglês; o original tem prioridade.
- Reaproveitar sprites, escala, quadros e padrões de impacto não significa copiar poder, dano, categoria, precisão, estados ou alcance.
- Auditoria automática em `tools/pokearena/audit-moves.mjs` + teste de biblioteca no `tests/solo-kanto-built.test.mjs`, bloqueio na publicação Pages se detectar sobreposição.
- Mesma textura de projétil para **golpes distintos** pode ser uma família visual, mas precisa ter silhueta e comportamento legíveis; não criar recolorações genéricas sem fidelidade.

## Refinamento dos golpes após aprovação de Super Fang (21/10/2026)
- **Super Fang — ✅ APROVADO, CONGELADO:** animação e mecânicas preservadas exatamente; teste de assinatura bloqueia mudanças não autorizadas.
- **Mud-Slap — ✅ APROVADO, CONGELADO:** mantida bolota de lama; splash original ampliado 12,5%; três respingos menores nas laterais, rastro curto com 3 partículas; dano, precisão, tipo, velocidade, alcance e redução de precisão inalterados.
- **Seed Bomb — ✅ APROVADO, CONGELADO:** semente permanece intacta durante o voo; rachadura aparece no impacto, miolo verde claro rapidamente visível; seis fragmentos originais + três microfragmentos de casca; sem danos extras; mecânica e estatísticas inalteradas.
- Nenhuma mudança no menu, sprites do cliente Pokémon Arena 2D ou outros golpes aprovados.

## Requisito permanente — Clash e dissipação (21/10/2026)
- **Todos os ataques com colisão entre golpes compatíveis** devem ter quadro de contato de Clash e animação de dissipação dos dois efeitos (ou do mais fraco, dependendo das regras), com pixel art e fragmentos proporcionais. **Status, cura e golpes sem volume físico** não recebem colisão artificial.
- Aplicar ao encontro real entre ataques oponentes, nunca no lançamento ou por proximidade sem contato. Não causar dano indevido em Pokémon durante dissipação, e não deixar sprite fantasma após encerramento. Rastrear se o ataque sobrevive, cancela ou perde potência conforme os atributos próprios.
- **Origem dos efeitos:** aproveitar o sistema já existente do cliente Poké Arena 2D para projéteis e raios sem alterá-los; criar a mesma interface de colisão para novos movimentos personalizados e avançar por classes (projéteis, feixes, cones, lâminas, área). Preservar estatísticas e as artes de todos os movimentos aprovados.
- Um Clash nunca pode modificar as matrizes dos sprites aprovados: o efeito entra como camada transitória e deve ser testado em batalha (inclusive ao errar, acertar e quando é cancelado por outro ataque).
- Esta regra é **meta de cobertura global**. Registrar quais classes já são realmente cobertas pelos testes, sem marcar prematuramente todos os ataques como finalizados.

### Cobertura atual de Clash (implantação inicial, 21/10/2026)
- **Projétil nativo × projétil nativo:** a base Pokémon Arena 2D já fornece colisão, texto CLASH, som e encerramento dos projéteis. **Preservado sem edições**.
- **Feixe nativo × feixe nativo:** o cliente já detecta cruzamento de segmentos e aciona CLASH. **Preservado sem edições**.
- **Mud-Slap/Seed Bomb × projétil nativo ou entre si:** ponte nova em `tools/pokearena/torre2-clash-fx.js`, raio físico, cancelamento antes do dano, **10 quadros de pixel art com dissipação**, criação postergada para que o loop do Phaser não descarte o efeito. Sem mexer no sprite aprovado nem no Super Fang.
- **Outros movimentos específicos próprios:** **ainda pendentes de instrumentação individual da hitbox**. Não marcar como concluídos globalmente até o teste na arena; golpes sem projétil (mordidas, status, cura) exigem interfaces de hitbox adequadas.
- **Teste automático:** `tests/solo-kanto-built.test.mjs` garante instalação; `tests/source-client-smoke.cjs` cobre colisão real, erro de mira, aliados, dissipação e descarte completo de gráficos Phaser.

## Patch avanço/contato e três golpes iniciais — 21/10/2026
- **Bite / Crunch:** manter exatamente os sprites de mandíbula aprovados, agora mover o Pokémon na direção da mira (avanço real), aplicar dano somente no contato do ator e recuar à posição inicial. Crunch continua com duas mordidas horizontal/vertical e no máximo uma aplicação de dano.
- **Peck — ✅ aprovado, congelado:** bico pequeno dourado em pixel art, avanço/contato/recuo e efeito de impacto contido.
- **Leech Life — ORIGINAL PRESERVADO:** o usuário confirmou que não sabia que já existia. O visual customizado foi CANCELADO, a forma nativa continua `golpe` e nenhum renderer verde deve substituir o original. Não mudar sem pedido explícito.
- **Bug Bite — ✅ aprovado, congelado:** boca menor de inseto verde com contorno escuro, contato físico uma única vez com avanço/recuo.
- **Congelamentos:** demais golpes aprovados intocados, assim como menu, campanha, save e sprite do cliente original. O comportamento especial de frutas não é simulado sem um sistema de berries.


## Regra confirmada pelo usuário: prioridade total aos golpes originais — 21/10/2026
- Se um golpe já existe no cliente original Poké Arena 2D, **não modificar nem substituir a arte, mecânica, cores, estatísticas ou moveset nativo**, mesmo que já exista uma ideia para reimplementá-lo. Só alterar após **pedido explícito do usuário sabendo que o golpe já existe**.
- **Leech Life**: mudança verde abortada e visual original restaurado; sem duplicata, sem alteração no unlock da campanha.
- **Peck e Bug Bite** receberam aprovação visual em 21/10/2026; manter as artes e efeitos intactos. **Bite e Crunch** seguem a alteração de avanço/recuo expressamente autorizada. Poison Sting e Gust continuam congelados.

## Aprovações e próximo lote — 21/10/2026
- **Peck e Bug Bite: ✅ aprovados e congelados.** Dano, colisão, recuo, pixel art e sprites mantidos sem alterações. Bite e Crunch permanecem aprovados. **Leech Life original também preservado**.
- **Três golpes sugeridos para início de Kanto (não implementar sem pedido):** Scratch (Charmander/Meowth, arranhão físico com contato), Sand Attack (Pidgey/Sandshrew, grãos de areia pixelados, redução de precisão quando acertar) e Sleep Powder (Bulbasaur/Butterfree, nuvem de pó de sono pixelado, precisão de 75% e sem dano).
- A lista do cliente capturado `datos.js` foi consultada: Scratch, Sand Attack e Sleep Powder não constam como entradas nativas; conservar a regra de revalidar antes de programar e nunca sobrescrever golpes originais.


## Auditoria ofensiva pré-Brock / lote de 4 golpes — 21/10/2026
**Solicitação:** somente golpes de dano para os Pokémon disponíveis da Route 1, Route 2 / Viridian Forest, Route 22 e equipe do Brock, antes de implementar mais espécies. NÃO criar Scratch (dispensado pelo usuário) nem Growl/Tail Whip/Sand Attack/Sleep Powder (status adiados). Preservar todos os originais.

**Auditoria do cliente Phaser original (`pokearena2d-cliente-phaser/src-7e7509264a/datos.js`):**
- Já disponíveis como golpe original: Tackle, Quick Attack, Wing Attack, Vine Whip, Razor Leaf, Ember, Bubble, Water Gun, Thunder Shock, Rock Throw, Rock Slide, Low Kick, Karate Chop, String Shot (status), entre outros.
- Já criados e aprovados no Torre 2: Gust, Poison Sting, Bite, Peck, Bug Bite, Hyper Fang, Mud-Slap, Rock Blast e outros. Não recriar.
- **Novos golpes de dano implementados, pendentes de aprovação visual:** Rock Tomb (Brock/Onix, 60 de potência, mira manual, uma colisão com dano e redução de velocidade), Horn Attack (Nidoran, chifre, contato/recuo), Double Kick (Nidoran, dois chutes com checagens e danos separados), Fury Attack (Spearow, 2–5 bicadas atingindo individualmente). Todos sprite matrix em Phaser/WebGL, sem alterar cliente original.
- **Lacuna de espécies antes do Brock:** a captura Phaser atual só inclui Bulbasaur, Charmander, Squirtle e Onix da lista imediata; ainda não há Pidgey, Rattata, Caterpie, Metapod, Weedle, Kakuna, Pikachu, Spearow, Nidoran♂/♀, Mankey ou Geodude no ROSTER. Suas entradas do mapa são filtradas até os sprites/atores serem integrados. Portanto, ter um ataque no catálogo ≠ ter o Pokémon jogável.
- Os golpes são cadastrados para essas espécies futuras, não surgem artificialmente como Pokémon capturados. Mewtwo nível 50 mantém biblioteca de teste para escolher.
- Não considerar a revisão completa do learnset por nível até definir a geração de referência de cada espécie; dano de golpe e desbloqueio são etapas diferentes.


### Complemento ofensivo pré-Brock — Metal Claw e Bind
- **Metal Claw**: Charmander em FireRed/LeafGreen aprende o ataque antes de Brock; golpe STEEL, 50 poder, 95% precisão, toque da garra de metal com avanço e recuo, 10% de chance de aumento do ataque no acerto. Não é sprite nativo capturado; novo pixel art e aguarda aprovação.
- **Bind**: Onix aprende antes de Brock; NORMAL 15 poder, 85% precisão, quatro pulsos de dano no nosso tempo real, somente após contato físico, com enrolamento pixelado temporário. Aproxima, acerta e recua, deixando a animação de aprisionamento na vítima. Também aguarda aprovação visual.
- **Roteiro de sprite/learnset**: nas novas espécies, a equipe deve vincular esses golpes conforme níveis e geração, preservando os nativos. Não atribuir Double Kick a Mankey; Mankey mantém Low Kick e Karate Chop nativos.


## Filtro TIPO > NEW — 21/10/2026
- No sumário, **TIPO ▾** inclui **NEW** depois de ALL, sem substituir os tipos Pokémon.
- NEW mostra automaticamente somente golpes próprios do Torre 2 ainda **pendentes de aprovação visual**: `source === 'new-phaser-fx'` e `approved !== true`. **Os golpes do Poké Arena 2D estão preservados e nunca entram em NEW**, mesmo que seu registro não possua `approved`.
- Pendentes atuais: **Rock Tomb, Horn Attack, Double Kick, Fury Attack, Metal Claw, Bind**, mais **Metronome, Absorb, X-Scissor** que aguardavam revisão.
- Lista com contador no botão NEW, filtro, páginas, busca, marcadores NEW nos itens e troca dos quatro slots do Mewtwo de teste lv50. Quando NEW é escolhido, pesquisa antiga é limpa para revelar todos os pendentes.
- Quando a aprovação for registrada como `approved:true`, o golpe sai automaticamente de NEW, continuando no seu tipo normal e no ALL.
- Sem alterar arte, colisão, balanceamento, menu principal, ataques nativos ou progresso de campanha.
