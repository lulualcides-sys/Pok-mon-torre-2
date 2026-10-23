# Pokémon Torre 2 — fila de efeitos e golpes baseada no Emerald Arena

Auditoria técnica: 22/10/2026. Fonte original: https://github.com/GBurgardt/pokemon-emerald-arena (v0.13.0, `e1502f9`). Estudo detalhado salvo no Arsenal: https://github.com/lulualcides-sys/Arsenal/blob/main/docs/EMERALD-ARENA-AUDITORIA-TORRE-2-2026-10-22.md

**IMPORTANTE:** o Emerald Arena é código C para GBA e o Torre 2 usa Phaser/WebGL. Não inserir ROM nem código GBA diretamente. Código novo MIT pode ser adaptado mantendo licença; sprites PMDCollab, Pokémon e cenários de colaboradores devem ser tratados separadamente. Golpes originais do Poké Arena 2D e efeitos customizados já aprovados são intocáveis.

## Seleção para próximos patches

| Ordem | Recurso | O que estudar no Emerald Arena | Diretriz de implementação no Torre 2 | Estado |
| --- | --- | --- | --- | --- |
| P0 | Captura selvagem | `arena_capture.inc`: mirar, arremessar, errar, absorver, cair, balançar, escapar/capturar | Aperfeiçoar sequência já existente, manter chance por espécie/status/HP/bola, alinhar raios, limpar círculos/sombra, jogar na equipe/PC, salvar sem perda | Melhorar sistema, sem refazer |
| P0 | Entrada/troca | `arena_sendout.inc`: arco da bola, luz, escala do Pokémon | Refinar sincronização Phaser e limpar sprites anteriores sem apagar animações aprovadas | Melhorar sistema |
| 1 | Protect | `arena_guard.inc` + `graphics/arena/guard/source.html` | Barreira em pixel art que absorve/interrompe golpes, com duração e colisão | Checar auditoria nativa |
| 2 | Rollout | `arena_rollout.inc` | Corpo enrolado nas cores do próprio Pokémon, rolagem acelerada, contato, obstáculos e recuo | Checar auditoria nativa |
| 3 | Smokescreen | `arena_cover.inc` | Névoa com ocultação/obstrução de mira e comportamento da IA | Checar auditoria nativa |
| 4 | Double Team | `arena_double_team.inc` | Clones temporários que recebem dano e desaparecem com o impacto | Checar auditoria nativa |
| 5 | Dig | `arena_dig_fly.inc` | Subsolo, deslocamento, surgimento e ataque temporizado | Checar auditoria nativa |
| 6 | Fly | `arena_dig_fly.inc` | Ascensão, sombra móvel, pouso e impacto | Checar auditoria nativa |
| 7 | Seismic Toss | `arena_toss.inc` | Agarrão de perto, elevação, descida, cratera, finalização especial | Checar auditoria nativa |
| 8 | Teleport | `arena_moves.c` + `arena_warp_toss.inc` | Desaparecer/reaparecer, esquiva real sem projétil | Checar auditoria nativa |
| 9 | Rain Dance e solo | `arena_storm.inc`, `arena_elements.inc` | Poças, água/eletricidade/gelo/fogo com duração e FPS previsíveis | Checar golpe e sistema |
| 10 | Choque de chamas | `arena_flame_clash.inc` | Quando dois jatos se encontram, faíscas e dissipação em vez de cruzamento | Extensão de VFX, **sem modificar Flame­thrower aprovado** |
| 11 | Reflect / Light Screen | `arena_guard.inc` / `arena_moves.c` | Escudos separados com redução de dano e temporizador | Checar auditoria nativa |
| 12 | Destruição de cenário | `arena_physics.c` | Pedras, madeira e efeitos de impacto com fragmentos leves | Cenários regionais, sem alterar mapas aprovados |

## Cruzamento automático por nome: foto da matriz de 21/10

O Emerald Arena tem **89** entradas de movimentos em `arena_moves.c`. Destes, **27** aparecem também no conjunto de **160 ausentes** da **matriz antiga** de Torre 2, que NÃO é uma auditoria da build atual. **Quatro desses 27 já estão aprovados em `torre2-move-pool.js`**: Peck, Bite, Rock Tomb e Gust — **nunca duplicar ou refazer**.

Outros 23 nomes candidatos dessa foto:
Protect; Rain Dance; Cross Chop; Aerial Ace; Surf; Icy Wind; Slam; Scratch; Leaf Blade; Mach Punch; Mega Drain; Headbutt; Steel Wing; Dragon Breath; Shadow Punch; Night Shade; Acid; Mud Shot; Giga Drain; Sand Attack; Light Screen; Fire Punch; Psychic.

**Surf está bloqueado por reprovação visual anterior**: não reabilitar sem decisão específica. Com isso, 22 nomes ficam como candidatos a investigar, **não como 22 faltas confirmadas**. Muitos golpes não citados na matriz anterior (Double Team, Substitute, Rollout etc.) devem ser checados em todos os movesets antes de escrever outro VFX.

## Regras operacionais permanentes

- Antes de criar um golpe, reconstruir a versão mais recente do cliente e executar `node tools/pokearena/audit-moves.mjs` para conferir `MISSING_IN_CAPTURED_CLIENT`. Checar aliases PT/EN e o `SIGNATURE_MOVES`.
- Projetar o golpe fiel ao funcionamento da referência, com quadros pixelados e som/impacto no momento certo; animação no próprio combate WebGL. Não usar Canvas 2D, CSS de formas ou vídeo colado.
- Respeitar o comportamento oficial individual, sobretudo golpes de contato, falha por mira, PP, status, chance, hitbox, alcance e efeitos no inimigo. Não transferir poder/tipo/precisão de outro golpe só porque reutilizou uma sprite-base.
- Novo golpe em arquivo/pasta própria, 8–16 frames conforme necessário; proteger arquivos aprovados; preservar save; comparar FPS em celular; publicar somente após commit, CI, screenshots e confirmação da build ao vivo.
- Solicitação de *cópia exata* significa perseguir o resultado visual e o timing conforme a referência; reutilizar arquivo de arte/código apenas quando sua licença permitir. Caso contrário, arte própria equivalente.

**Primeiro lote de 4 sugerido:** Protect, Rollout, Smokescreen, Double Team. **Primeiro pacote de sistema sugerido:** corrigir/aperfeiçoar captura e entrada antes de criar o lote de golpes. O usuário escolhe o lote; não executar os dois silenciosamente.
