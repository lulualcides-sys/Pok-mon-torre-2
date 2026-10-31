# Proteção contra retrabalho — todos os 283 golpes PB Ranked vs política de golpes do Torre 2

**283 nomes cruzados; 45 já têm correspondência com histórico de aprovação/baseline no Torre 2.** Esses 45 devem ter prioridade de **preservação**, não de nova implementação.
Os outros 238 ainda precisam de uma busca completa no motor de batalha do Torre 2; **não** significam golpes ausentes.

Usa como fonte a **política real do repositório** `data/move-reuse-policy.json` em main, verificada no momento desta extração. Pode mudar posteriormente, então repetir comparação antes de qualquer patch.

## Golpes que não devemos substituir automaticamente

Aerial Ace · Ancient Power · Bite · Confuse Ray · Crabhammer · Dark Pulse · Double Kick · Earth Power · Energy Ball · Fire Punch · Flame Wheel · Flash Cannon · Fury Cutter · Giga Drain · Guillotine · Ice Beam · Ice Fang · Ice Punch · Ice Shard · Icy Wind · Leaf Blade · Metal Claw · Metronome · Mud Bomb · Night Slash · Pay Day · Petal Dance · Pin Missile · Poison Fang · Poison Jab · Protect · Psychic · Rain Dance · Seed Bomb · Shadow Ball · Silver Wind · Sing · Sleep Powder · Sonic Boom · Surf · Swift · Thunder Punch · Thunder Wave · Tri Attack · X-Scissor

## Contagem por tipo

| Tipo | Em PB Ranked | Protegidos na política Torre2 | Restantes para auditoria |
| --- | ---: | ---: | ---: |
| bug | 9 | 4 | 5 |
| dark | 14 | 3 | 11 |
| dragon | 14 | 0 | 14 |
| electric | 13 | 2 | 11 |
| fairy | 8 | 0 | 8 |
| fighting | 18 | 1 | 17 |
| fire | 21 | 2 | 19 |
| flying | 15 | 1 | 14 |
| ghost | 10 | 2 | 8 |
| grass | 17 | 6 | 11 |
| ground | 9 | 2 | 7 |
| ice | 15 | 5 | 10 |
| normal | 48 | 8 | 40 |
| poison | 8 | 2 | 6 |
| psychic | 18 | 1 | 17 |
| rock | 8 | 1 | 7 |
| steel | 17 | 2 | 15 |
| water | 21 | 3 | 18 |

## Fluxo para cada golpe

1. Procurar nome e aliases dentro do cliente real do Pokémon Torre 2, biblioteca de golpes e arquivos de efeitos.
2. Ler `data/move-reuse-policy.json`; se aprovado, não mexer no VFX, HUD ou dano aprovado.
3. Consultar a matriz AST PB Ranked para atributos de ataque e referências estáticas; não confundir isso com observação em partida.
4. Se for recurso novo, planejar em módulo isolado, com arte própria/licenciada, colisão e testes focados; sem publicar diretamente.

[Matriz completa JSON](AUDITORIA-DUPLICATAS-E-PRESERVACAO-283.json)
