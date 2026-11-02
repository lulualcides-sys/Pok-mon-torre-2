# Pokémon Torre 2 — Patch conjunto: Kanto Summit Map + 3 golpes específicos

Implementado em 21/10/2026, separado do Pokémon Torre 1. O patch adiciona recursos à campanha Kanto sem substituir animações nativas Poké Arena 2D e sem alterar nenhum dos 11 golpes específicos já aprovados.

## Patch 1 — Campanha por nós
- **Mapa de rota** verde em Phaser Graphics/WebGL, progressão de baixo para cima e páginas de até 9 nós, inspirada na captura enviada pelo usuário (não é imagem estática e não depende de CSS/Canvas 2D).
- Nós de **treinadores, rival, Equipe Rocket e líder**. Rival/Rocket substituem posições dentro dos 13+ treinadores já existentes; não perdem as vitórias ou insígnias anteriores. A cada líder vencido desbloqueia-se o próximo estágio.
- **Grama alta regional** com nomes das áreas e encontros inspirados em FireRed. Prioriza espécies da rota; somente espécies já integradas em ROSTER/evoluções entram de fato em combate. Outros nomes aparecem como FUTURO, porque o cliente base ainda não possui os 151 Pokémon prontos para batalha. Não inventar encontros substitutos em regiões erradas.
- **Centro Pokémon:** cura de HP sem custo, mantém PC/equipe armazenados, e não altera a progressão.
- **Poké Mart:** moedas ganhas após vitórias; compra de Poké Balls, Great/Ultra Balls, Potion/Super Potion e TMs. Estoque persiste em localStorage.
- **Bolsa:** selecionar Pokémon ativo, usar poções, ensinar TMs compradas; resumo dos golpes permanece disponível. TM ensinada passa a constar na biblioteca pessoal de golpes do Pokémon.
- **Capturas:** precisam da Pokébola escolhida, descontam item e respeitam chance calculada. Encontros selvagens não avançam o índice de treinadores. Até cinco encontros de grama por estágio. A batalha usa a cena original Phaser; a evolução continua só após a luta.
- **Compatibilidade:** saves v1 recebem o novo inventário sem apagar equipe, nível, badge ou Pokémon do PC.
- **Elites:** preservam as lutas preexistentes; o mapa e grama por área referem-se aos oito ginásios Kanto.

## Patch 2 — Sing, Crabhammer, Smog
Todos são **novos** `torre2_*` e implementados em `tools/pokearena/torre2-species-fx.js`, separados da arte nativa.
- **Sing:** sequência de 5 notas musicais pequenas em pixel, diferentes trajetórias, acerto por varredura e **55%** de chance de dormir após contato; Jigglypuff/Wigglytuff.
- **Crabhammer:** garra pixelada com pinças em arco e respingo de água, **somente corpo a corpo**, com possibilidade de crítico; Krabby/Kingler.
- **Smog:** fumaça de pixel em pequenas nuvens irregulares que viajam e acertam fisicamente; **40%** de chance de veneno após contato; Koffing/Weezing.
- Por enquanto os três estão **em avaliação, não aprovados**. Mewtwo de teste tem os 3 disponíveis no sumário. Jigglypuff, Krabby e Koffing serão jogáveis na campanha quando suas formas e kit estiverem completos no cliente; o arquivo de golpes já define atribuição pelas famílias.

## Restrições e critérios para aceitação
- **Não mexer** em Ice Beam V6, Confuse Ray, Soft-Boiled, Rock Blast, Swift, Lovely Kiss, Pay Day, Shadow Ball, Bone Club, Bonemerang, Tri Attack nem nos golpes nativos.
- As rotas completas por espécie no estilo FireRed dependem da integração dos Pokémon restantes. O mapa não finge disponibilidade de sprites.
- Sem Canvas 2D, CSS de efeitos ou PNG estático para golpes.
- Confirmar em Chromium batalha real, movimento, acerto/erro, consequência status, inventário, TM, saves e responsividade.

## Arquivos
- `tools/pokearena/torre2-route-data.js` — mapa, paradas e encontros
- `tools/pokearena/torre2-campaign-core.js` — motor de campanha/economia/captura
- `tools/pokearena/torre2-campaign-scene.js` — mapas, grama, centro, loja, bolsa
- `tools/pokearena/torre2-species-fx.js` — novos VFX de espécies
- `tools/pokearena/torre2-signature-fx.js` — registra os 3 sem mexer nas implementações aprovadas
- `tools/pokearena/torre2-move-pool.js` — moveset e TM
- `tests/solo-kanto-built.test.mjs` — testes de economia/rota/save
- `tests/source-client-smoke.cjs` — navegador Phaser e testes de colisão dos 3
