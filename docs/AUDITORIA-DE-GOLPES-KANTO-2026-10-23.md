# Pokémon Torre 2 — auditoria de cobertura de golpes de Kanto
Data: 23/10/2026.

## Não duplicar nada que já funciona
O catálogo do Poké Arena 2D tem prioridade. Os movimentos customizados já aprovados do Torre 2 continuam intactos. Consultar `TEST_LIBRARY`, `availableMoves()`, `EARLY_KANTO_SLOTS` e `KANTO_ROUTE_SLOTS` antes de criar qualquer VFX novo. Se um golpe nativo já existir, apenas disponibilizar à espécie correta.

## Estado visual confirmado pelo usuário
- Thunder Wave e Screech: aprovados
- Sonic Boom: **APROVADO pelo usuário** em 23/10/2026. Preservar as três meias-luas brancas pixeladas em sequência, com rastro e impacto branco, dano fixo de 20 HP e imunidade Ghost. Não reaparecer em NEW.
- Ancient Power e Ice Shard: aprovados
- Preservar as demais artes já aprovadas

## Lacunas candidatas para próximos capítulos (não alegar ausência antes de testar o catálogo compilado)
| Prioridade | Golpe | Uso em Kanto | Como reaproveitar |
|---|---|---|---|
| Alta | Sleep Powder | Butterfree, Oddish/Gloom, Bellsprout/Weepinbell | partículas de pó aprovadas; somente status sono após contato |
| Alta | Stun Spore | Butterfree e famílias de planta | variantes do pó aprovado; paralisia, sem dano |
| Alta | Psychic | Abra/Kadabra/Alakazam, Drowzee/Hypno, Starmie | pulsos psíquicos nativos se existirem, sem novo orbe genérico |
| Alta | Aerial Ace | Fearow, Pidgeot e lutadores voadores | avanço/corte existente com colisão real |
| Alta | Protect | diversos Pokémon e TMs em Kanto | defesa breve, não projétil |
| Média | Light Screen | suporte psíquico/elétrico | tela pixelada protetora com duração definida |
| Média | Rain Dance | Pokémon de água, clima | chuva pixelada, estado de arena |
| Média | Sand Attack | Pidgey, Sandshrew e outros | areia do Mud-Slap adaptada, reduz precisão |
| Média | Fire Punch | Hitmonchan, Magmar | contato físico com impacto de fogo existente |
| Média | Ice Punch | Hitmonchan, Jynx | contato com partículas de gelo aprovadas |
| Média | Thunder Punch | Hitmonchan, Electabuzz | contato com raio existente |
| Média | Cross Chop | Primeape, Machamp | dois cortes de contato, sem projétil |
| Média | Flame Wheel | Growlithe, Ponyta | chama que acompanha Pokémon no avanço |

### Regra de criação
1. Consultar se o movimento já está em `TEST_LIBRARY` do jogo compilado.
2. Confirmar disponibilidade/nível da espécie na história atual e FireRed quando for relevante.
3. Caso não exista: criar arte de 8–16 poses em pixel art real, reutilizando elementos aprovados, mantendo colisão/impacto sincronizados.
4. Não adicionar de uma vez à lista NEW tudo que aparece aqui. Implementar em lotes pequenos para avaliação visual.
5. **Psyshock não é do FireRed original (introduzido após a geração III)**; não priorizar numa campanha fiel a FireRed.

## Auditar automaticamente
O teste `tests/misty-surge-built.test.mjs` imprime candidatos não encontrados na biblioteca compilada. Cruzar essa saída com os golpes acima; lista de sugestões não é confirmação de ausência.

## Pokédex
A correção de 23/10 normaliza apenas números inválidos das fichas das evoluções, refaz o moveset exibido com `resolveLoadout` e preserva os sprites e a lógica real de batalha. Rodar `tests/source-client-smoke.cjs` para verificar Nidorina/Nidoqueen e Nidorino/Nidoking.
