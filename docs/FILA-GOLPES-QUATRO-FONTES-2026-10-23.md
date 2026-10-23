# Pokémon Torre 2 — fila deduplicada, quatro fontes e três golpes de aço

Registrado em 23/10/2026. Este documento preserva o planejamento desta conversa. O inventário antigo é de 21/10; a existência de um nome aqui exige nova auditoria do cliente antes de implementar.

## Regras de implementação

- Fontes: T2 = golpes aprovados no Torre 2; P2 = Poké Arena 2D; Z = Zarza; E = Emerald Arena.
- Reaproveitar motor, atlas, técnicas e sprites *somente* com licença/permissão de uso; não importar ROM nem material de terceiros sem autorização. Preservar os avisos MIT do código original do Emerald Arena.
- NUNCA substituir os movimentos originais do P2 ou os efeitos do T2 já aprovados. PT/EN e aliases contam uma única vez. Nenhum golpe do Torre 1.
- Fazer golpes novos em Phaser/WebGL e pixel art 8–16 fases; mirar, esquivar, colidir, aplicar status e dano no momento correto; testar no navegador e no celular.
- Esta lista elimina itens já na assinatura congelada em `torre2-move-pool.js` e Surf (reprovado); não substitui auditoria atual de `datos.js`/`TEST_LIBRARY`.
- Scratch permaneceu adiado por orientação anterior. Não programar sem novo pedido.

## Prioridade futura absoluta: Mewtwo lifts rocks (Emerald Arena)

Fonte de referência: https://www.reddit.com/r/retrogamedev/comments/1woojdu/ e https://github.com/GBurgardt/pokemon-emerald-arena

Coreografia: Mewtwo ergue 3 a 5 pedras reais do solo, suspende em órbitas curtas, mira e arremessa; cada pedra usa colisão independente, gera fragmentos no choque, pode errar e pode bater no cenário. E = levitação e interação com pedras; T2 = rochas de Rock Blast/Rock Tomb; P2 = pose de Confusion/Psywave, tamanho e movimento original; Z = sombras, trajetória e impacto. NÃO duplicar Rock Blast, Rock Throw ou Rock Tomb; habilidade especial original, com 12–16 poses principais. A animação era apenas prévia e não estava na distribuição pública do Emerald Arena na data pesquisada.

## Primeiro grupo de 24 candidatos (somente planejamento)

1. Psychic
2. Protect
3. Sleep Powder
4. Thunder Wave
5. Giga Drain
6. Mega Drain
7. Dark Pulse
8. Mud Shot
9. Leaf Blade
10. Cross Chop
11. Aerial Ace
12. Icy Wind
13. Fire Punch
14. Ice Punch
15. Thunder Punch
16. Flame Wheel
17. Energy Ball
18. Poison Jab
19. Ancient Power
20. Pin Missile
21. Psyshock
22. Rain Dance
23. Light Screen
24. Sand Attack

## Golpes solicitados agora — patch de aço

| Golpe | Reutilização das 4 fontes | Arte e comportamento novos |
|---|---|---|
| Flash Cannon | P2 Hyper Beam/Chorro; T2 Ice Beam/Metal Claw; Z beamContact e impacto; E reação de cenário | Disparo metálico concentrado, 80 de poder, 100% precisão, 10% chance de baixar Sp. Def |
| Steel Beam | P2 Hyper Beam/Chorro; T2 Ice Beam/Shadow Ball; Z carga/feixes; E colisões | Feixe metálico largo e articulado, 140 de poder, 95% precisão; usuário perde 50% HP máximo no uso |
| Mirror Shot | P2 projéteis; T2 Shadow Ball/Metal Claw; Z brilho/atlas; E choque | Placa facetada de reflexos girando, 65 de poder, 85% precisão, 30% chance de baixar precisão |

## Catálogo restante (não duplicar os três do patch)

### NORMAL — 8

Scratch, Headbutt, Double-Edge, Take Down, Strength, Slam, Protect, Swords Dance.

**Plano de reutilização:** Poké Arena 2D Quick Attack e Pound; T2 Horn Attack/Double Kick; Zarza contato e deslocamento; Emerald Arena impacto corporal.

### FIRE — 5

Flame Wheel, Heat Wave, Fire Punch, Will-O-Wisp, Sunny Day.

**Plano de reutilização:** P2 Flamethrower/Fire Spin; T2 Confuse Ray; Zarza flame clashes, partículas e iluminação; Emerald Arena solo/clima.

### WATER — 7

Aqua Jet, Whirlpool, Muddy Water, Scald, Brine, Rain Dance, Aqua Ring.

**Plano de reutilização:** P2 Hydro Pump/Water Gun/Waterfall; T2 Smog e Mud-Slap para spray; Zarza trilha aquática; Emerald Arena poças e reação do solo.

### ELECTRIC — 5

Spark, Volt Switch, Thunder Punch, Zap Cannon, Thunder Wave.

**Plano de reutilização:** P2 Thunderbolt/Discharge/Volt Tackle; T2 Shadow Ball; Zarza descarga e movimento; Emerald Arena colisão.

### GRASS — 8

Mega Drain, Giga Drain, Energy Ball, Leaf Storm, Magical Leaf, Power Whip, Leaf Blade, Sleep Powder.

**Plano de reutilização:** P2 Vine Whip/Razor Leaf/Solar Beam; T2 Absorb/Petal Dance/Seed Bomb; Zarza atlas e carga; Emerald Arena terreno.

### ICE — 12

Ice Shard, Icy Wind, Ice Punch, Ice Fang, Avalanche, Frost Breath, Freeze-Dry, Triple Axel, Ice Spinner, Icicle Spear, Haze, Mist.

**Plano de reutilização:** P2 Blizzard; T2 Ice Beam/Gust/Bite/Double Kick; Zarza rastro/impacto; Emerald Arena contato e terreno.

### FIGHTING — 6

Brick Break, Cross Chop, Mach Punch, Focus Blast, Bulk Up, Detect.

**Plano de reutilização:** P2 Karate Chop/Quick Attack; T2 X-Scissor/Crabhammer/Double Kick; Zarza pose e contato; Emerald Arena arremesso.

### POISON — 12

Acid, Sludge, Sludge Wave, Poison Jab, Venoshock, Gunk Shot, Poison Fang, Acid Spray, Clear Smog, Belch, Toxic, Poison Gas.

**Plano de reutilização:** T2 Smog/Poison Sting/Bite/Mud-Slap; P2 feixes nativos; Zarza nuvem e respingos; Emerald Arena dano no chão.

### GROUND — 13

Mud Shot, Mud Bomb, Earth Power, Stomping Tantrum, Bulldoze, High Horsepower, Drill Run, Scorching Sands, Sand Tomb, Magnitude, Fissure, Sand Attack, Spikes.

**Plano de reutilização:** T2 Mud-Slap/Rock Tomb/Rock Blast; P2 Earthquake; Zarza crateras/poeira; Emerald Arena física e fissuras.

### FLYING — 7

Aerial Ace, Air Slash, Hurricane, Sky Attack, Pluck, Tailwind, Roost.

**Plano de reutilização:** P2 Wing Attack; T2 Gust/Peck; Zarza feixes e deslocamento; Emerald Arena vento.

### PSYCHIC — 8

Psychic, Psyshock, Future Sight, Stored Power, Psycho Cut, Psychic Fangs, Expanding Force, Light Screen.

**Plano de reutilização:** P2 Confusion/Psywave; T2 Shadow Ball; Zarza energia e iluminação; Emerald Arena telecinese (Mewtwo lifts rocks).

### BUG — 10

Fury Cutter, Silver Wind, Bug Buzz, Signal Beam, Pin Missile, Struggle Bug, Pollen Puff, U-turn, Infestation, Lunge.

**Plano de reutilização:** T2 Bug Bite/X-Scissor/Seed Bomb; P2 String Shot; Zarza lâminas e emissões; Emerald Arena impactos.

### ROCK — 6

Ancient Power, Power Gem, Head Smash, Meteor Beam, Sandstorm, Stealth Rock.

**Plano de reutilização:** T2 Rock Blast/Rock Tomb; P2 Rock Slide/Rock Throw; Zarza fragmentos; Emerald Arena pedras interativas.

### GHOST — 5

Night Shade, Shadow Punch, Ominous Wind, Poltergeist, Curse.

**Plano de reutilização:** T2 Shadow Ball/Confuse Ray; P2 Psywave; Zarza energia e sombras; Emerald Arena objetos e colisão.

### DRAGON — 8

Dragon Breath, Dragon Rage, Dragon Pulse, Dragon Hammer, Twister, Scale Shot, Breaking Swipe, Dragon Cheer.

**Plano de reutilização:** P2 Draco Meteor/Dragon Dance/Hyper Beam; T2 Gust/Rock Blast; Zarza feixes; Emerald Arena choque de elementos.

### DARK — 12

Dark Pulse, Night Slash, Foul Play, Snarl, Pursuit, Thief, Assurance, Payback, Beat Up, Brutal Swing, Taunt, Nasty Plot.

**Plano de reutilização:** T2 Bite/Crunch/X-Scissor/Smog; P2 Quick Attack; Zarza contato e rastro; Emerald Arena impactos.

### STEEL — 7

Iron Head, Steel Wing, Smart Strike, Magnet Bomb, Metal Burst, Metal Sound, Autotomize.

**Plano de reutilização:** T2 Metal Claw/Ice Beam/Shadow Ball; P2 Hyper Beam/Chorro; Zarza brilho e beamContact; Emerald Arena física de colisão.

### FAIRY — 9

Fairy Wind, Dazzling Gleam, Moonblast, Draining Kiss, Disarming Voice, Misty Explosion, Spirit Break, Alluring Voice, Misty Terrain.

**Plano de reutilização:** T2 Lovely Kiss/Petal Dance/Absorb; P2 Psywave; Zarza partículas e aura; Emerald Arena solo e recuperação.

## Auditoria e origem

- Matriz-base: `docs/MATRIZ-GOLPES-FALTANTES-SPRITES-E-ESTATISTICAS.md` — foto antiga, NÃO status ao vivo.
- Reavaliar antes dos próximos patches em `tools/pokearena/audit-moves.mjs`, `tools/pokearena/torre2-move-pool.js` e capturas atuais.
- E: `docs/EMERALD-ARENA-LISTA-DE-IMPLEMENTACAO.md`; Z: `docs/REA-ZARZA-VARREDURA-AMPLIADA.md`.
- Referências de mecânica: https://pokemondb.net/move/flash-cannon, https://pokemondb.net/move/steel-beam, https://pokemondb.net/move/mirror-shot.
