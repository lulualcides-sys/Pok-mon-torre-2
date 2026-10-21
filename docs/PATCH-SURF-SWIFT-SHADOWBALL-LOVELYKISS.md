# Pokémon Torre 2 — Patch: 2 refinamentos + 4 movimentos novos

**Status em 20–21/10/2026:** implementado, commitado e testado em batalha real Phaser 3/WebGL e Android horizontal.

## Refinamentos pedidos

- **Tri Attack** — preservada a identificação triangular fogo/gelo/eletricidade; os três feixes estão mais compridos, os vértices mais separados e o impacto reúne os três elementos e um anel de expansão. Dano no contato; mantém a chance combinada de efeito.
- **Pay Day** — conserva nove moedas e impactos independentes, agora espalhadas em **leque**, com trajetórias laterais e alturas diferentes, em vez de uma linha.
- **Bonemerang e Bone Club** — mantidos sem mudança, conforme aprovação do usuário.

## Quatro movimentos novos de fato criados

| Golpe | Tipo | Visual e comportamento |
| --- | --- | --- |
| **Surf** | Água | Onda pixelada larga, crista de espuma, gotas e contato sincronizado com o avanço. |
| **Swift** | Normal | Sete estrelas douradas com trilhas convergentes; atinge o alvo sem erro de pontaria, como o movimento original. |
| **Shadow Ball** | Fantasma | Orbe violeta escura, partículas espectrais e anel animado ao colidir. |
| **Lovely Kiss** | Normal / Status | Beijo e corações rosa animados; acerto de 75% e sono temporário, **sem dano**. |

**Arquitetura:** ataques novos em `tools/pokearena/torre2-next-batch-fx.js`, ligados a `torre2-signature-fx.js`; descritores de tipo, cooldown e custo em `torre2-move-pool.js`. O compositor `build-preview.mjs` os incorpora ao cliente original Poké Arena 2D em `_site/arena2d` e ao ramo `pokearena2d-cliente-phaser`.

Nenhuma animação de golpe do Pokémon Torre 1 foi importada. O trabalho usa Phaser/WebGL e a infraestrutura de VFX do cliente do Poké Arena 2D. Os efeitos são novas interpretações em pixel art, não cópias perfeitas.

**Mewtwo de teste nível 50:** banco ampliado de 157 para **161 golpes selecionáveis**, os quatro novos aparecem no Sumário. Os quatro golpes inicialmente equipados continuam os aprovados Bonemerang, Bone Club, Tri Attack e Pay Day; Surf, Swift, Shadow Ball e Lovely Kiss podem ser equipados manualmente nos slots pelo Sumário.

**Próxima etapa das espécies:** os novos ataques deverão ser vinculados aos Pokémon compatíveis quando seus sprites e learnsets estiverem disponíveis na campanha Kanto. Ser selecionável no Mewtwo de teste não significa estar automaticamente disponível em todos os Pokémon.

## Testes concluídos

- Teste de Kanto offline, evolução por nível, Mewtwo e seleção/armazenamento dos quatro golpes novos.
- Batalha real contra Onix: invocação dos **oito efeitos** pelo motor `usarHabilidad`, renderização e captura individual em `tests/source-client-smoke.cjs`.
- Navegação pelo Sumário, filtro de tipo, busca, seleção e jogo na tela Android horizontal.
- Verificação pública da cópia Phaser isolada no Chromium e GitHack.
- Workflow: https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/39520429183

Ainda cabe avaliação visual e de balanceamento pelo usuário antes de declarar os quatro golpes novos definitivamente aprovados.

## Referências para fidelidade funcional

- https://bulbapedia.bulbagarden.net/wiki/Surf_(move)
- https://bulbapedia.bulbagarden.net/wiki/Swift_(move)
- https://bulbapedia.bulbagarden.net/wiki/Shadow_Ball_(move)
- https://bulbapedia.bulbagarden.net/wiki/Lovely_Kiss_(move)
