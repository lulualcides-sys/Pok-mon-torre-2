# PATCH ÚNICO — Pokémon Torre 2 — 23/10/2026

## Escopo solicitado: unir os 3 patches de visuais em apenas 1

**Treinamento:** Onix imóvel continua a receber dano numérico real sem reduzir HP; HP do alvo 100%, energia 100%, ultimate 100% e **todos os cooldowns zerados durante o treino**. A ação de ataque ainda precisa completar a própria animação, evitando efeitos simultâneos artificiais e travamentos. Batalhas normais inalteradas.

**11 golpes com novos quadros visuais (12 poses por golpe):**
- Dark Pulse: núcleo negro com aura violeta, cinco crescentes orbitais e rastros escuros
- Ancient Power: nove pedras facetadas de tamanhos variados, órbita e poeira realista, sem confundir com Rock Blast
- Ice Shard: sete cristais independentemente lançados, espaçados e manualmente direcionados no estilo de Pay Day; dano base distribuído pelos sete fragmentos
- Icy Wind: quatro camadas de vento e cristais crescendo em abertura cônica
- Acid: jato corrosivo fino com gotas concentradas e rastro esverdeado
- Acid Spray: névoa de 11 gotas em leque, em contraste com Acid
- Poison Jab: perfuração de agulha roxa, contato físico e faíscas
- Silver Wind: rajada de escamas e folhas prateadas brilhantes, com cintilação
- Twister: vórtice espiral de cinco camadas de diâmetro variável, detritos
- Mud Shot: projétil compacto de lama com gotas e estilhaços de barro
- Mud Bomb: massa espessa em rotação com cinco lascas orbitais e rastro sujo

**15 animações com aprovação explícita do usuário, protegidas:** três de aço (Flash Cannon, Steel Beam e Mirror Shot) e os 12 do lote — Fury Cutter, Earth Power (pedido grafado "Darth Power"), Giga Drain, Energy Ball, Ice Fang, Icicle Spear, Mega Drain, Leaf Blade, Pin Missile, Night Slash, Poison Fang e Sludge.

O código dessas animações foi preservado; apenas os indicadores `approved` e o histórico de aprovação foram registrados.

## Base e licenças

- Pokémon Torre 2: reutilização da ideia já aprovada do **Pay Day**, colisão por segmento `swept`, animação de contato e sprites pixelados sem alterar efeitos aprovados
- Poké Arena 2D: motor **Phaser/WebGL** e máscara de cintilação `MAPAS.estrella` já adaptada no módulo `batch24/pixels.js`
- Emerald Arena: física de fragmentos de código novo MIT, via `batch24/emerald-fragments.js`; atribuição e licença preservadas em `batch24/EMERALD-LICENSE.txt`
- Pokémon Zarza: inspecionado no patch anterior, mas **sem cópia de arte ou código** enquanto a autorização de redistribuição não for confirmada. Exceção específica registrada no arquivo de política; nunca declarar que os quatro foram efetivamente portados

## Proteções

- 23 golpes da versão Torre 2, sem duplicar o **Dragon Pulse** nativo (24º nome da lista)
- Visuais aprovados nunca entram nos 11 novos renderizadores
- Frames dispostos em gráficos pixel art, sem imagens estáticas PNG/CSS, sem Canvas 2D
- Colisão, timing e status dos outros golpes permanecem; dano só no contato.
- Ice Shard dispersa dano entre sete cristais, sem transformar um único golpe em sete golpes completos
- O cooldown zero vale apenas para o treino; fora dele os tempos oficiais do projeto continuam

## Validação

Tests: `npm test`, `npm run check:reuse`, `node tests/batch24-built.test.mjs`, `node tests/batch24-browser.cjs`, `node tests/source-client-smoke.cjs` em CI no GitHub. Publicar GitHub Pages só após passar pelo portão de testes e confirmar que está servindo o fingerprint novo.
