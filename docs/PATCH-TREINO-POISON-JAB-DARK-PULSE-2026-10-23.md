# Pokémon Torre 2 — Correção de Treinamento, Poison Jab e Dark Pulse — 23/10/2026

## Solicitações implementadas

### Treinamento: só um golpe por acionamento, cooldown zero preservado

**Causa real:** o motor Phaser original processa todos os botões `esp/e/q/rmb/lmb` marcados como pressionados no mesmo quadro de batalha. Antes o Treinamento zerava `fighter.cd` em `step` e `poststep`, então apertar duas teclas ou manter um botão pressionado disparava ataques paralelos sem o bloqueio por cooldown.

**Correção:** `tools/pokearena/torre2-training-input.js#singleTrainingCastReader`, carregado só pelo Treinamento, preserva o controle original de movimentação e mira, mas entrega **um único comando de ataque por pressão nova**, bloqueia repetição ao segurar botão e não permite nova execução antes da animação ativa terminar. Ao fechar o treino, o `leer` original é restaurado. O cooldown continua sendo zero, energia e ultimate continuam cheios e Onix continua imóvel e sem perda de HP.

### Aprovações novas (salvas, não modificadas)

O usuário aprovou **Acid, Acid Spray, Icy Wind, Mud Shot, Mud Bomb, Silver Wind e Twister**. **Earth Power** já estava aprovado, confirmado novamente. As sete funções visuais correspondentes em `visual-upgrades.js` mantêm exatamente os mesmos bytes da versão `src-934c8c7dab`. A suíte `tests/batch24-visuals.test.js` bloqueia alterações futuras nesses corpos de função via checksum. O catálogo, o registro de licença/proveniência e o filtro NEW foram atualizados (19 novas assinaturas aprovadas e quatro ainda não aprovadas visualmente: Ancient Power, Dark Pulse, Ice Shard, Poison Jab). Os três golpes de aço e os demais aprovados continuam protegidos.

### Dark Pulse (ainda em avaliação)

O cliente Poké Arena 2D capturado em `src-747e24b561/datos.js` **não declara Dark Pulse como golpe nativo**; portanto não é possível simplesmente delegar uma forma original Dark Pulse como foi feito com Aura Storm/Steel Beam.

Para evitar um efeito inventado genérico, a nova animação segue a descrição canônica de Pokémon, com **ondas de anéis de energia preta e violeta** dirigidas ao alvo (em vez de luas artificiais girando), e **reutiliza efetivamente a máscara de anel pixel art original de Poké Arena 2D** `src-747e24b561/vfx.js#MAPAS['p-pulsoAgua']`, recolorida na nova forma `pixels.js#p2darkring`. Várias ondas escuras encadeadas mantêm a mira e a colisão existentes. Mecânicas e golpes aprovados não foram alterados.

Referência original: https://bulbapedia.bulbagarden.net/wiki/Dark_Pulse_(move)

### Ice Shard (ainda em avaliação)

Só **mudança de design**: os sete projéteis independentes no estilo Pay Day, cadência, colisão e dano dividido permanecem os mesmos. Máscaras adicionais `pixels.js#iceDagger` e `#frostChip` agora têm faces branco-gelo, facetas ciano, contorno azul profundo e pontas cristalinas.

### Poison Jab (ainda em avaliação)

**Causa real:** o sprite físico da perfuração era desenhado além de uma sonda de colisão de apenas 17 pixels do lutador; muitos golpes tocavam visualmente o alvo sem passar na verificação de alcance. No treino, o HP do Onix era restaurado imediatamente, fazendo o contador de dano normal do `strike()` retornar zero mesmo após contato legítimo.

**Correção:** para Poison Jab **somente**, o dash alcança seu limite natural e a sonda faz contato até a ponta roxa desenhada, verificando a direção (sem mirar automaticamente). Contato registrado -> um único dano e um **impacto roxo de partículas pontiagudas e faíscas pixeladas** `paintReworkedImpact`. Fora de alcance ou direção errada -> nenhum dano/impacto falso. No treino, a contagem real de acertos e `LastDamage` reconhecem corretamente o dano mesmo quando o alvo restaura seu HP. Poder 80, precisão 100% e chance 30% de envenenamento continuam como estavam.

## Proveniência e proteção das quatro bases

- Torre 2: reaproveitamento do sistema de colisão/efeitos existente; ataques aprovados preservados
- Poké Arena 2D: motor nativo Phaser/WebGL e máscara de anel real `MAPAS['p-pulsoAgua']`
- Emerald Arena MIT: física de fragmentos já adaptada em `batch24/emerald-fragments.js` (atribuição em `EMERALD-LICENSE.txt`)
- Zarza: **referência técnica apenas**, sem código/arte transplantados; mantida a exceção original explícita. Não afirmar reutilização direta das quatro fontes

## Testes e publicação

Rodar `npm test`, `npm run check:reuse`, `tests/batch24-built.test.mjs`, `tests/batch24-browser.cjs` e `tests/source-client-smoke.cjs` via Actions. Só confirmar link público quando a etapa final verificar o fingerprint novo pelo GitHub Pages.
