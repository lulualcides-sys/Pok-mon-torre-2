# Pokémon Torre 2 — Próximos golpes específicos (triagem)

Data da consulta: 21/10/2026.

## Situação: todos os 11 golpes implementados estão aprovados
Bonemerang, Bone Club, Tri Attack, Pay Day, Swift, Shadow Ball, Lovely Kiss, Ice Beam V6, Rock Blast, Confuse Ray amarelo, Soft-Boiled.

**Não mudar nenhum desses nem qualquer golpe que já possua efeito próprio no Poké Arena 2D.** Surf continua removido do catálogo customizado.

## Como esta triagem foi feita
Foi conferido o arquivo `src-8d89349697/datos.js` da branch `pokearena2d-cliente-phaser`: 175 declarações com `nombre:"…",forma:"…"` e 144 nomes diferentes, distribuídos por 49 formas de animação. Esta é uma **fotografia específica do cliente capturado**, não o universo completo de todos os golpes Pokémon, e uma ausência nessa lista **não comprova** que não existe animação em alguma versão posterior do site ou outro módulo. Antes de criar cada novo efeito, confirmar a falta visual diretamente na versão instalada no Torre 2.

## Lote sugerido — prioritários após checagem visual

| Prioridade | Golpe | Categoria | Efeito específico que precisaríamos construir se não houver visual nativo |
|---|---|---|---|
| 1 | Absorb | planta/dreno | Linha de energia verde que sai do alvo e volta para quem atacou; cura sincronizada |
| 2 | Sleep Powder | planta/status | Pó leve com origem no Pokémon, dispersão e sono somente se acertar |
| 3 | Spore | planta/status | Nuvem de esporos específica, diferente da poeira de sono |
| 4 | Thunder Wave | elétrico/status | Descarga elétrica fina e paralisia aplicada no contato |
| 5 | Poison Powder | veneno/status | Nuvem de pó roxo, trajetória e status |
| 6 | Stun Spore | planta/status | Pó paralisante com paleta própria e contato real |
| 7 | Acid | veneno/projétil | Spray ácido irregular em pixel art e respingo localizado |
| 8 | Poison Jab | veneno/contato | Investida/agulhada curta com efeito de veneno somente no golpe |
| 9 | Aqua Tail | água/contato | Golpe de cauda e arco de água conectado ao corpo |
| 10 | Will-O-Wisp | fogo/status | Pequenas chamas azuis guiadas; sem explosão cartonizada |
| 11 | Ice Punch | gelo/contato | Soco de contato e cristais no impacto |
| 12 | Haze | gelo/status | Névoa leve sem cobrir toda a arena |
| 13 | Mega Drain | planta/dreno | Versão mais forte do dreno de Absorb |
| 14 | Giga Drain | planta/dreno | Dreno maior, proporcional, e cura após contato |
| 15 | Icy Wind | gelo/vento | Rajada fria, partículas finas e expansão com vento |
| 16 | Waterfall | água/investida | Água envolvendo avanço físico, não projétil genérico |
| 17 | Dream Eater | psíquico/dreno | Drenagem visível condicionada ao sono do alvo |
| 18 | Dark Pulse | sombrio/onda | Onda de energia escura em arcos progressivos |
| 19 | Sing | normal/status | Notas musicais pixeladas indo até o alvo |
| 20 | Metronome | normal/status | Pequena sequência de dedos/ícones antes de ativar outro golpe |

## Outros candidatos para auditoria futura
Toxic, Reflect, Light Screen, Protect, Substitute, Transform, Swords Dance, Bind, Wrap, Self-Destruct, Petal Dance, Dragon Rage. **Não começar esses automaticamente** e não substituir efeitos nativos existentes com base apenas nesta lista.

## Golpes que o catálogo original já apresenta com forma VFX — não recriar
Razor Leaf, Leech Seed, Ember, Fire Blast, Water Gun, Rock Throw, Water Pulse, Bubble, Bubble Beam, Hydro Pump, Solar Beam, Hyper Beam, Aura Storm, Thunderbolt, Thunder, Discharge, Vine Whip, Rock Slide, Stone Edge, Flamethrower, Fire Spin, Explosion, Blizzard, Hypnosis, Confusion, Psywave, entre outros.

## Processo do próximo golpe
1. Abrir o golpe na versão atual do Poké Arena 2D usada no Torre 2 e confirmar se **realmente não tem visual específico**.
2. Se já tiver: não fazer nada, preservar.
3. Se faltar: pesquisar visual oficial, procurar o melhor modelo visual do próprio Arena 2D, usar o Zarza apenas como biblioteca de técnicas.
4. Implementar um golpe por vez em Phaser/WebGL, testar em combate; enviar para aprovação.
5. Ao aprovar, congelar e marcar ✓.

**Sugestão:** começar pela checagem e, se confirmado ausente, implementação de **Absorb**. Foi uma deficiência já apontada pelo usuário e permite reaproveitar a base de drenagem em Mega Drain e Giga Drain, sem mudar golpes existentes.
