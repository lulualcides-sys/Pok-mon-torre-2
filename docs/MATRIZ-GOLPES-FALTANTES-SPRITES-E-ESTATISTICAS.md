# Pokémon Torre 2 — Catálogo do que falta e lotes para reaproveitar sprites

**Auditoria real do cliente Phaser + planejamento (21/10/2026):** 18 tipos, **269** golpes/status planejados, **98** já presentes no cliente original, **11** feitos especificamente no Torre 2 dentro do planejamento e **160** ainda sem implementação no catálogo capturado. A classificação é por **nome**, não mede qualidade visual nem se um Pokémon do Kanto aprende o movimento. Golpes originais do cliente não serão alterados.

## Regra mestre: sprite não é estatística
Reaproveitar somente a matriz de pixel art, contorno, paleta, fases e efeitos visuais, **nunca copiar `dano`, `tipo`, `precisao`, `poder`, `pp`, efeitos adicionais ou alcance** de um golpe para outro. Pesquisar cada movimento em Pokémon Database/Bulbapedia antes da mecânica e registrar tipo, categoria, poder, precisão, PP, contato, prioridade, efeitos e exceções. Normalizar **dano da arena separadamente** da potência oficial, mantendo a proporção/semântica; mudar apenas a arte não deve alterar o resultado da batalha. Sem projétil teleguiado ou acerto garantido; teste de colisão e de erro manual.

O sprite do Hyper Fang foi aprovado: reaproveitar em outras mordidas **sem mudar o original**. O efeito de Smog é base para nuvens, Pay Day para vários impactos independentes, Rock Blast para pedras/escombros, Petal Dance para pétalas, Ice Beam para feixes guiados pela mira manual. Golpes não aprovados não são referência de arte congelada.

### Último lote: estatísticas originais verificadas

| Golpe | Tipo/categoria | Potência | Precisão | PP | Efeito |
| --- | --- | ---: | ---: | ---: | --- |
| Mud-Slap | Ground/Special | 20 | 100% | 10 | Dano + precisão do alvo -1 estágio, máximo -6 |
| Seed Bomb | Grass/Physical | 80 | 100% | 15 | Dano físico sem efeito adicional |
| Super Fang | Normal/Physical | fixo | 90% | 10 | Reduz HP atual do alvo à metade quando acerta |

Referências: https://pokemondb.net/move/mud-slap, https://pokemondb.net/move/seed-bomb, https://pokemondb.net/move/super-fang.

## Lotes de alto reaproveitamento: 40 golpes

| Lote | Golpes ainda ausentes | Base visual aprovada | Regras distintas que NÃO podem ser copiadas |
| --- | --- | --- | --- |
| Projéteis e esferas | Mud Shot, Mud Bomb, Energy Ball, Dark Pulse, Dragon Pulse, Flash Cannon, Power Gem, Moonblast | Pay Day / Rock Blast / Shadow Ball | Cada um: precisão, status, alvo, dano e resistência próprios |
| Espinhos e rajadas | Pin Missile, Icicle Spear, Scale Shot, Poison Sting, Ice Shard, Magical Leaf, Fury Cutter | Pay Day / Swift / Rock Blast | Quantidade real de hits; Magical Leaf não erra por precisão no original; Fury Cutter cresce de poder em acertos consecutivos |
| Mordidas, lâminas e contato | Bite, Poison Fang, Ice Fang, Psychic Fangs, Night Slash, Metal Claw, Leaf Blade, Cross Chop | Hyper Fang / Crabhammer | Contato real, chance de efeito/status, críticos e categoria corretos |
| Feixes, vento e ondas | Dragon Breath, Psyshock, Zap Cannon, Frost Breath, Icy Wind, Heat Wave, Sludge Wave, Fairy Wind | Ice Beam / Smog | Não copiar efeitos especiais: paralisia, congelamento, redução de velocidade, diferença dano físico/especial |
| Drenagem | Mega Drain, Giga Drain, Draining Kiss | Absorb (lógica de energia; arte ainda não aprovada) | Mega/Giga Drain curam 50% do dano; Draining Kiss 75% |
| Solo, rocha e impactos | Rock Tomb, Ancient Power, Sand Tomb, Drill Run, Earth Power, Stomping Tantrum | Rock Blast / Bone Club / Bonemerang | Rock Tomb reduz velocidade, Ancient Power pode aumentar atributos, Sand Tomb prende, Drill Run prioriza críticos |

**Primeiros lotes sugeridos:** Lotes 1 e 2 (15 golpes) para estabelecer variações de sprites; depois Lote 3 (8), e assim por diante. Golpes de status complexos (Protect, Spikes, Toxic, Rain Dance, Swords Dance, etc.) não devem ser feitos apenas com recoloração porque requerem comportamento novo.

## Catálogo completo: os 160 nomes ausentes

| Tipo | Encontrados no cliente original | Feitos no Torre 2 | Faltam | Nomes faltantes |
| --- | ---: | ---: | ---: | --- |
| normal | 7 | 1 | 8 | Scratch, Headbutt, Double-Edge, Take Down, Strength, Slam, Protect, Swords Dance |
| fire | 11 | 0 | 5 | Flame Wheel, Heat Wave, Fire Punch, Will-O-Wisp, Sunny Day |
| water | 8 | 0 | 8 | Aqua Jet, Surf, Whirlpool, Muddy Water, Scald, Brine, Rain Dance, Aqua Ring |
| electric | 10 | 0 | 5 | Spark, Volt Switch, Thunder Punch, Zap Cannon, Thunder Wave |
| grass | 5 | 3 | 8 | Mega Drain, Giga Drain, Energy Ball, Leaf Storm, Magical Leaf, Power Whip, Leaf Blade, Sleep Powder |
| ice | 2 | 1 | 12 | Ice Shard, Icy Wind, Ice Punch, Ice Fang, Avalanche, Frost Breath, Freeze-Dry, Triple Axel, Ice Spinner, Icicle Spear, Haze, Mist |
| fighting | 9 | 0 | 7 | Double Kick, Brick Break, Cross Chop, Mach Punch, Focus Blast, Bulk Up, Detect |
| poison | 2 | 1 | 13 | Poison Sting, Acid, Sludge, Sludge Wave, Poison Jab, Venoshock, Gunk Shot, Poison Fang, Acid Spray, Clear Smog, Belch, Toxic, Poison Gas |
| ground | 2 | 1 | 13 | Mud Shot, Mud Bomb, Earth Power, Stomping Tantrum, Bulldoze, High Horsepower, Drill Run, Scorching Sands, Sand Tomb, Magnitude, Fissure, Sand Attack, Spikes |
| flying | 7 | 0 | 9 | Gust, Peck, Aerial Ace, Air Slash, Hurricane, Sky Attack, Pluck, Tailwind, Roost |
| psychic | 6 | 0 | 8 | Psychic, Psyshock, Future Sight, Stored Power, Psycho Cut, Psychic Fangs, Expanding Force, Light Screen |
| bug | 4 | 1 | 11 | Bug Bite, Fury Cutter, Silver Wind, Bug Buzz, Signal Beam, Pin Missile, Struggle Bug, Pollen Puff, U-turn, Infestation, Lunge |
| rock | 5 | 1 | 7 | Rock Tomb, Ancient Power, Power Gem, Head Smash, Meteor Beam, Sandstorm, Stealth Rock |
| ghost | 6 | 2 | 5 | Night Shade, Shadow Punch, Ominous Wind, Poltergeist, Curse |
| dragon | 6 | 0 | 8 | Dragon Breath, Dragon Rage, Dragon Pulse, Dragon Hammer, Twister, Scale Shot, Breaking Swipe, Dragon Cheer |
| dark | 3 | 0 | 13 | Bite, Dark Pulse, Night Slash, Foul Play, Snarl, Pursuit, Thief, Assurance, Payback, Beat Up, Brutal Swing, Taunt, Nasty Plot |
| steel | 3 | 0 | 11 | Metal Claw, Iron Head, Flash Cannon, Steel Wing, Smart Strike, Steel Beam, Mirror Shot, Magnet Bomb, Metal Burst, Metal Sound, Autotomize |
| fairy | 2 | 0 | 9 | Fairy Wind, Dazzling Gleam, Moonblast, Draining Kiss, Disarming Voice, Misty Explosion, Spirit Break, Alluring Voice, Misty Terrain |

**Avisos:** (1) o cliente capturado inclui evoluções e outros Pokémon de gerações posteriores e a presença no código não garante desbloqueio em Kanto; (2) a lista de 160 cobre o planejamento salvo de 269, **não** a totalidade de todos os movimentos existentes em toda a franquia; (3) Surf permanece oculto no Torre 2 por rejeição visual anterior e não deve ser habilitado automaticamente; (4) implementação não significa aprovação visual, que depende de revisão do usuário.
