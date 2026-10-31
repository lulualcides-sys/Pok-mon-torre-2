# Catálogo mestre de golpes — PB Ranked × Pokémon Torre 2

Pesquisa técnica realizada em 31/10/2026. Base: cliente público Pokémon Battlegrounds; extração AST de metadados, complementada por sessões autenticadas no TinyFish contra bot. **Não contém código-fonte, efeitos ou sprites de terceiros.**

**283 nomes distintos** em **610 declarações/variantes**, distribuídos pelos 18 tipos de Pokémon.
**93 nomes** também constam do catálogo de 165 golpes da fonte Poké Arena 2D; **190 não constam naquela fonte**, mas podem já existir no Pokémon Torre 2.
**17 nomes** constam dos 37 IDs da baseline histórica de golpes personalizados do Torre 2. A baseline não representa o total do jogo.

**Classificação de evidência:** 'em sessão' significa que pelo menos o nome/ação foi registrado pelo navegador automatizado TinyFish. Essa marca não comprova todos os quadros visuais. 'Código' significa declaração do cliente, sem animação demonstrada.

**Cooldown:** valores brutos declarados no JavaScript; **unidade não estabelecida** (não interpretar como segundos). Poder é valor declarado naquela implementação; não transferir automaticamente ao balanceamento Gen III do Torre 2.

**Flags:** a presença de `beam`, `projectile`, `contact`, `melee` etc. é estrutural; `?` indica expressão que não foi resolvida estaticamente.

## BUG — 9 golpes

| Nome | Poder(es) | Categoria | Variantes | Cooldown bruto | Flags de execução | Fonte Poké Arena 2D | Baseline Torre 2 | Evidência |
| --- | ---: | --- | ---: | ---: | --- | --- | --- | --- |
| First Impression | 90 | phys | 1 | 430 | contact?, melee?, windup | não no catálogo-fonte | — | código |
| Fury Cutter | 40 | phys | 1 | 70 | contact?, melee?, windup | não no catálogo-fonte | — | código |
| Megahorn | 120 | phys | 4 | 420 | contact?, windup | sim | — | código |
| Pin Missile | 75 | phys | 1 | — | — | não no catálogo-fonte | — | código |
| Pollen Puff | 90 | spec | 1 | 200 | — | não no catálogo-fonte | — | código |
| Quiver Dance | 0 | stat | 1 | 420 | — | não no catálogo-fonte | — | código |
| Silver Wind | 60 | spec | 1 | — | — | não no catálogo-fonte | — | código |
| U-turn | 70 | phys | 3 | 150 | contact? | não no catálogo-fonte | — | código |
| X-Scissor | 80 | phys | 5 | 150 | contact?, highCrit? | não no catálogo-fonte | sim | código |

## DARK — 14 golpes

| Nome | Poder(es) | Categoria | Variantes | Cooldown bruto | Flags de execução | Fonte Poké Arena 2D | Baseline Torre 2 | Evidência |
| --- | ---: | --- | ---: | ---: | --- | --- | --- | --- |
| Bite | 60 | phys | 1 | — | — | não no catálogo-fonte | sim | código |
| Crunch | 80 | phys | 12 | 110, 210 | contact?, melee?, windup | sim | — | em sessão/menus |
| Dark Pulse | 80 | spec | 9 | 120, 200, 240 | projectile?, windup | não no catálogo-fonte | — | em sessão/menus |
| Foul Play | 95 | phys | 1 | — | contact? | não no catálogo-fonte | — | código |
| G-Max One Blow | 130 | phys | 1 | 600 | — | não no catálogo-fonte | — | código |
| Hyperspace Fury | 100 | phys | 1 | — | — | não no catálogo-fonte | — | código |
| Knock Off | 65 | phys | 3 | 180 | contact?, melee? | sim | — | código |
| Nasty Plot | 0 | status | 1 | 600 | utility? | não no catálogo-fonte | — | código |
| Night Daze | 85 | spec | 1 | 220 | windup | não no catálogo-fonte | — | código |
| Night Slash | 70 | phys | 4 | 70 | contact?, highCrit?, windup | não no catálogo-fonte | — | código |
| Pursuit | 40 | phys | 1 | 200 | contact?, melee? | não no catálogo-fonte | — | código |
| Sucker Punch | 70 | phys | 3 | 180 | contact?, utility?, windup | sim | — | código |
| Throat Chop | 80 | phys | 1 | — | contact?, windup | não no catálogo-fonte | — | código |
| Wicked Blow | 80 | phys | 1 | 240 | contact?, melee? | não no catálogo-fonte | — | código |

## DRAGON — 14 golpes

| Nome | Poder(es) | Categoria | Variantes | Cooldown bruto | Flags de execução | Fonte Poké Arena 2D | Baseline Torre 2 | Evidência |
| --- | ---: | --- | ---: | ---: | --- | --- | --- | --- |
| Clanging Scales | 110 | spec | 2 | 330 | — | não no catálogo-fonte | — | código |
| Clangorous Soul | 0 | status | 2 | 600 | utility? | não no catálogo-fonte | — | código |
| Draco Meteor | 130 | spec | 2 | 600, 720 | — | sim | — | código |
| Dragon Breath | 60 | spec | 1 | 180 | beam? | não no catálogo-fonte | — | código |
| Dragon Claw | 80 | phys | 5 | 110, 120 | contact?, melee? | sim | — | em sessão/menus |
| Dragon Dance | 0 | status | 4 | 420 | utility? | sim | — | código |
| Dragon Darts | 100 | phys | 2 | 210 | — | sim | — | código |
| Dragon Pulse | 85 | spec | 5 | 150, 200 | beam?, projectile? | sim | — | código |
| Dragon Rush | 100 | phys | 1 | 420 | — | sim | — | código |
| Horn Throw | 0 | status | 1 | — | — | não no catálogo-fonte | — | código |
| Nihil Light | 100 | spec | 1 | — | — | não no catálogo-fonte | — | código |
| Outrage | 120 | phys | 3 | 360, 600 | — | sim | — | código |
| Roar of Time | 150 | spec | 1 | — | — | não no catálogo-fonte | — | código |
| Spacial Rend | 100 | spec | 1 | — | — | não no catálogo-fonte | — | código |

## ELECTRIC — 13 golpes

| Nome | Poder(es) | Categoria | Variantes | Cooldown bruto | Flags de execução | Fonte Poké Arena 2D | Baseline Torre 2 | Evidência |
| --- | ---: | --- | ---: | ---: | --- | --- | --- | --- |
| Bolt Strike | 130 | phys | 1 | 480 | — | não no catálogo-fonte | — | código |
| Discharge | 80 | spec | 3 | 300 | — | sim | — | código |
| Electro Ball | 80 | spec | 1 | 150 | projectile? | sim | — | código |
| Fusion Bolt | 100 | phys | 1 | 300 | — | não no catálogo-fonte | — | código |
| Magnet Rise | 0 | status | 1 | — | utility? | não no catálogo-fonte | — | código |
| Shock Wave | 60 | spec | 1 | — | sureHit? | sim | — | código |
| Thunder | 110 | spec | 5 | 420 | — | sim | — | código |
| Thunder Fang | 65 | phys | 1 | — | contact? | sim | — | código |
| Thunder Punch | 75 | phys | 5 | 180 | contact?, melee?, windup | não no catálogo-fonte | — | código |
| Thunder Wave | 0 | status | 2 | 480, 600 | finisher?, utility? | não no catálogo-fonte | — | código |
| Thunderbolt | 90 | spec | 7 | — | — | sim | — | código |
| Volt Tackle | 120 | phys | 2 | 540 | — | sim | — | código |
| Wild Charge | 90 | phys | 4 | 300 | contact? | sim | — | código |

## FAIRY — 8 golpes

| Nome | Poder(es) | Categoria | Variantes | Cooldown bruto | Flags de execução | Fonte Poké Arena 2D | Baseline Torre 2 | Evidência |
| --- | ---: | --- | ---: | ---: | --- | --- | --- | --- |
| Dazzling Gleam | 80 | spec | 3 | — | — | não no catálogo-fonte | — | código |
| Draining Kiss | 50 | spec | 1 | — | — | não no catálogo-fonte | — | código |
| Floral Healing | 0 | stat | 1 | 360 | — | não no catálogo-fonte | — | código |
| Light of Ruin | 140 | spec | 1 | 540 | beam?, finisher? | não no catálogo-fonte | — | código |
| Moonblast | 95 | spec | 6 | 210 | — | não no catálogo-fonte | — | código |
| Moonlight | 0 | stat | 2 | 480 | — | não no catálogo-fonte | — | código |
| Play Rough | 90 | phys | 4 | 240 | contact?, melee? | sim | — | código |
| Spirit Break | 75 | phys | 1 | 310 | contact?, melee?, windup | não no catálogo-fonte | — | código |

## FIGHTING — 18 golpes

| Nome | Poder(es) | Categoria | Variantes | Cooldown bruto | Flags de execução | Fonte Poké Arena 2D | Baseline Torre 2 | Evidência |
| --- | ---: | --- | ---: | ---: | --- | --- | --- | --- |
| Aura Sphere | 80 | spec | 8 | 200, 220 | projectile?, sureHit? | sim | — | código |
| Body Press | 96 | phys | 2 | 300 | contact?, melee? | não no catálogo-fonte | — | código |
| Brick Break | 75 | phys | 2 | 300 | contact?, windup | não no catálogo-fonte | — | código |
| Close Combat | 120 | phys | 9 | 300, 480 | contact?, melee? | sim | — | código |
| Counter | 0 | status | 1 | 600 | utility? | não no catálogo-fonte | — | código |
| Double Kick | 60 | phys | 1 | — | contact?, melee? | não no catálogo-fonte | sim | código |
| Drain Punch | 75 | phys | 2 | — | — | sim | — | código |
| Dynamic Punch | 100 | phys | 1 | 420 | — | sim | — | código |
| Flying Press | 100 | phys | 2 | 360 | — | não no catálogo-fonte | — | código |
| Focus Blast | 120 | spec | 5 | 420 | projectile? | não no catálogo-fonte | — | código |
| Hammer Arm | 100 | phys | 1 | 360 | — | não no catálogo-fonte | — | código |
| High Jump Kick | 130 | phys | 4 | 420 | contact? | sim | — | código |
| Karate Chop | 50 | phys | 1 | 120 | highCrit? | sim | — | código |
| Low Kick | 60 | phys | 1 | 220 | contact?, melee? | sim | — | código |
| Mach Punch | 40 | phys | 2 | 150 | — | não no catálogo-fonte | — | código |
| Pump Up | 0 | status | 1 | — | — | não no catálogo-fonte | — | código |
| Sacred Sword | 90 | phys | 1 | — | — | não no catálogo-fonte | — | código |
| Superpower | 120 | phys | 1 | 480 | — | não no catálogo-fonte | — | código |

## FIRE — 21 golpes

| Nome | Poder(es) | Categoria | Variantes | Cooldown bruto | Flags de execução | Fonte Poké Arena 2D | Baseline Torre 2 | Evidência |
| --- | ---: | --- | ---: | ---: | --- | --- | --- | --- |
| Blast Burn | 150 | spec | 2 | 900 | finisher?, windup | sim | — | código |
| Blaze Kick | 85 | phys | 2 | 210 | contact?, highCrit?, melee? | não no catálogo-fonte | — | código |
| Blue Flare | 130 | spec | 1 | 480 | — | não no catálogo-fonte | — | código |
| Eruption | 150 | spec | 1 | 600 | — | sim | — | código |
| Fiery Dance | 80 | spec | 1 | 330 | windup | não no catálogo-fonte | — | código |
| Fire Blast | 110 | spec | 2 | 360 | — | sim | — | em sessão/menus |
| Fire Fang | 65 | phys | 2 | — | contact? | sim | — | código |
| Fire Punch | 75 | phys | 2 | 180 | contact?, melee? | não no catálogo-fonte | — | código |
| Flame Charge | 50 | phys | 1 | 200 | — | sim | — | código |
| Flame Wheel | 60 | phys | 1 | — | — | não no catálogo-fonte | — | código |
| Flamethrower | 90 | spec | 10 | 120, 150 | beam?, windup | sim | — | em sessão/menus |
| Flare Blitz | 120 | phys | 4 | 480 | contact?, melee? | sim | — | código |
| Fusion Flare | 100 | spec | 1 | 300 | — | não no catálogo-fonte | — | código |
| G-Max Wildfire | 140 | spec | 2 | 600 | beam? | não no catálogo-fonte | — | código |
| Heat Crash | 100 | phys | 2 | 330 | contact?, melee? | não no catálogo-fonte | — | código |
| Heat Wave | 95 | spec | 1 | 260 | windup | não no catálogo-fonte | — | código |
| Lava Plume | 80 | spec | 1 | — | — | sim | — | código |
| Mystical Fire | 75 | spec | 2 | — | — | não no catálogo-fonte | — | código |
| Overheat | 130 | spec | 4 | 480 | sureHit? | sim | — | código |
| Sunny Day | 0 | status | 1 | — | utility? | não no catálogo-fonte | — | código |
| Will-O-Wisp | 0 | status | 1 | 300 | utility? | não no catálogo-fonte | — | código |

## FLYING — 15 golpes

| Nome | Poder(es) | Categoria | Variantes | Cooldown bruto | Flags de execução | Fonte Poké Arena 2D | Baseline Torre 2 | Evidência |
| --- | ---: | --- | ---: | ---: | --- | --- | --- | --- |
| Acrobatics | 110 | phys | 4 | 200, 240 | contact?, melee? | sim | — | código |
| Aerial Ace | 60 | phys | 2 | 120 | contact?, sureHit? | não no catálogo-fonte | — | código |
| Air Slash | 75 | spec | 5 | 100, 180 | projectile?, windup | não no catálogo-fonte | — | em sessão/menus |
| Bounce | 85 | phys | 1 | 480 | — | sim | — | código |
| Brave Bird | 120 | phys | 5 | 360, 420, 480 | contact? | sim | — | em sessão/menus |
| Dragon Ascent | 120 | phys | 2 | 480, 520 | contact? | não no catálogo-fonte | — | código |
| Drill Peck | 80 | phys | 3 | — | contact? | sim | — | código |
| Dual Wingbeat | 40 | phys | 2 | 120 | contact? | não no catálogo-fonte | — | código |
| Fly | 90 | phys | 1 | 520 | contact? | sim | — | código |
| Hurricane | 110 | spec | 1 | 360 | — | não no catálogo-fonte | — | código |
| Mirror Move | 70 | spec | 1 | 300 | utility? | não no catálogo-fonte | — | código |
| Roost | 0 | status | 2 | 900 | utility? | sim | — | código |
| Sky Attack | 140 | phys | 2 | 600, 720 | contact?, highCrit?, windup | não no catálogo-fonte | — | código |
| Tailwind | 0 | status | 1 | — | utility? | não no catálogo-fonte | — | código |
| Wing Attack | 60 | phys | 1 | — | — | sim | — | código |

## GHOST — 10 golpes

| Nome | Poder(es) | Categoria | Variantes | Cooldown bruto | Flags de execução | Fonte Poké Arena 2D | Baseline Torre 2 | Evidência |
| --- | ---: | --- | ---: | ---: | --- | --- | --- | --- |
| Astral Barrage | 120 | spec | 1 | — | — | não no catálogo-fonte | — | código |
| Confuse Ray | 0 | status/stat | 2 | 300, 600 | utility? | não no catálogo-fonte | sim | código |
| Curse | 0 | status | 1 | 520 | utility? | não no catálogo-fonte | — | código |
| Hex | 65 | spec | 1 | 360 | — | sim | — | código |
| Lick | 30 | phys | 1 | — | — | sim | — | código |
| Phantom Force | 90 | phys | 1 | 420 | — | sim | — | código |
| Poltergeist | 110 | phys | 1 | 280 | — | não no catálogo-fonte | — | código |
| Shadow Ball | 80 | spec | 8 | — | projectile? | sim | sim | código |
| Shadow Punch | 60 | phys | 1 | — | sureHit? | não no catálogo-fonte | — | código |
| Shadow Sneak | 60 | phys | 1 | 240 | — | sim | — | código |

## GRASS — 17 golpes

| Nome | Poder(es) | Categoria | Variantes | Cooldown bruto | Flags de execução | Fonte Poké Arena 2D | Baseline Torre 2 | Evidência |
| --- | ---: | --- | ---: | ---: | --- | --- | --- | --- |
| Drum Beating | 80 | phys | 2 | 240 | — | não no catálogo-fonte | — | código |
| Energy Ball | 90 | spec | 1 | 210 | projectile? | não no catálogo-fonte | — | código |
| Frenzy Plant | 150 | spec | 1 | 600 | windup | não no catálogo-fonte | — | código |
| Giga Drain | 75 | spec | 3 | 420 | — | não no catálogo-fonte | — | código |
| Grassy Glide | 55 | phys | 1 | 150 | contact?, melee? | não no catálogo-fonte | — | código |
| Ingrain | 0 | status | 1 | 9999 | utility? | não no catálogo-fonte | — | código |
| Leaf Blade | 90 | phys | 1 | — | — | não no catálogo-fonte | — | código |
| Leaf Storm | 130 | spec | 4 | 480, 600 | beam? | não no catálogo-fonte | — | código |
| Leech Seed | 0 | status | 1 | 540 | — | sim | — | código |
| Petal Blizzard | 90 | phys | 2 | 210 | — | não no catálogo-fonte | — | código |
| Petal Dance | 120 | spec | 1 | 600 | — | não no catálogo-fonte | sim | código |
| Razor Leaf | 55 | phys | 1 | — | — | sim | — | código |
| Seed Bomb | 80 | phys | 2 | — | — | não no catálogo-fonte | sim | código |
| Sleep Powder | 0 | status | 2 | 720 | utility? | não no catálogo-fonte | — | código |
| Solar Beam | 120 | spec | 8 | 540, 600 | beam?, windup | sim | — | código |
| Synthesis | 0 | status | 1 | 900 | utility? | não no catálogo-fonte | — | código |
| Wood Hammer | 120 | phys | 3 | 420 | contact?, melee? | não no catálogo-fonte | — | código |

## GROUND — 9 golpes

| Nome | Poder(es) | Categoria | Variantes | Cooldown bruto | Flags de execução | Fonte Poké Arena 2D | Baseline Torre 2 | Evidência |
| --- | ---: | --- | ---: | ---: | --- | --- | --- | --- |
| Bone Rush | 90 | phys | 1 | 360 | — | sim | — | código |
| Dig | 80 | phys | 1 | 600 | — | sim | — | código |
| Drill Run | 80 | phys | 3 | 200 | — | não no catálogo-fonte | — | código |
| Earth Power | 90 | spec | 3 | — | — | não no catálogo-fonte | — | código |
| Earthquake | 100 | phys | 19 | 300, 420 | windup | sim | — | em sessão/menus |
| High Horsepower | 95 | phys | 2 | 240 | contact?, melee? | não no catálogo-fonte | — | código |
| Mud Bomb | 65 | spec | 1 | — | — | não no catálogo-fonte | — | código |
| Precipice Blades | 120 | phys | 2 | 540 | — | não no catálogo-fonte | — | código |
| Spikes | 0 | status | 1 | 600 | utility? | não no catálogo-fonte | — | código |

## ICE — 15 golpes

| Nome | Poder(es) | Categoria | Variantes | Cooldown bruto | Flags de execução | Fonte Poké Arena 2D | Baseline Torre 2 | Evidência |
| --- | ---: | --- | ---: | ---: | --- | --- | --- | --- |
| Aurora Veil | 0 | status | 1 | 900 | utility? | não no catálogo-fonte | — | código |
| Avalanche | 60 | phys | 1 | 360 | — | não no catálogo-fonte | — | código |
| Blizzard | 110 | spec | 3 | 240, 420 | freezes? | sim | — | código |
| Freeze-Dry | 70 | spec | 2 | 250, 260 | freezes?, windup | não no catálogo-fonte | — | código |
| Hail | 0 | status | 1 | — | utility? | não no catálogo-fonte | — | código |
| Ice Beam | 90 | spec | 8 | 140, 180 | beam?, freezes?, windup | sim | sim | código |
| Ice Breath | 60 | spec | 1 | — | — | não no catálogo-fonte | — | código |
| Ice Fang | 65 | phys | 5 | 240 | contact? | não no catálogo-fonte | — | código |
| Ice Punch | 75 | phys | 4 | 180 | contact?, melee? | não no catálogo-fonte | — | código |
| Ice Shard | 40 | phys | 1 | 110 | projectile?, windup | sim | — | código |
| Ice Spinner | 80 | phys | 1 | — | — | não no catálogo-fonte | — | código |
| Icicle Crash | 85 | phys | 1 | 220 | — | não no catálogo-fonte | — | código |
| Icy Wind | 55 | spec | 2 | — | — | não no catálogo-fonte | — | código |
| Subzero Slammer | 190 | spec | 1 | 9999 | sureHit? | não no catálogo-fonte | — | código |
| Triple Axel | 20 | phys | 1 | 300 | contact?, melee? | não no catálogo-fonte | — | código |

## NORMAL — 48 golpes

| Nome | Poder(es) | Categoria | Variantes | Cooldown bruto | Flags de execução | Fonte Poké Arena 2D | Baseline Torre 2 | Evidência |
| --- | ---: | --- | ---: | ---: | --- | --- | --- | --- |
| Bide | 1 | phys | 1 | 900 | finisher?, utility? | não no catálogo-fonte | — | código |
| Body Slam | 85 | phys | 2 | 150 | — | sim | — | em sessão/menus |
| Boomburst | 140 | spec | 1 | 420 | — | não no catálogo-fonte | — | código |
| Breakneck Blitz | 200 | phys | 1 | 9999 | sureHit? | não no catálogo-fonte | — | código |
| Crush Claw | 75 | phys | 1 | 180 | — | não no catálogo-fonte | — | código |
| Cut | 50 | phys | 1 | 120 | contact? | não no catálogo-fonte | — | código |
| Dizzy Punch | 70 | phys | 1 | — | — | sim | — | código |
| Double Team | 0 | status | 3 | 900 | utility? | sim | — | código |
| Double-Edge | 120 | phys | 2 | 420 | contact?, windup | não no catálogo-fonte | — | código |
| Egg Bomb | 100 | phys | 1 | 260 | — | sim | — | código |
| Endeavor | 1 | phys | 1 | 300 | utility? | não no catálogo-fonte | — | código |
| Extreme Speed | 80 | phys | 3 | 220, 240 | contact? | sim | — | código |
| Facade | 70 | phys | 1 | — | — | não no catálogo-fonte | — | código |
| Fake Out | 40 | phys | 3 | — | contact?, finisher?, windup | sim | — | código |
| Feint | 30 | phys | 1 | — | — | não no catálogo-fonte | — | código |
| Focus Energy | 0 | status | 1 | 600 | utility? | não no catálogo-fonte | — | código |
| Follow Me | 0 | status | 1 | — | utility? | não no catálogo-fonte | — | código |
| Giga Impact | 150 | phys | 1 | 900 | — | sim | — | código |
| Guillotine | 150 | phys | 1 | 600 | contact?, finisher?, windup | não no catálogo-fonte | sim | código |
| Hyper Beam | 150 | spec/phys | 5 | 660, 720, 900 | beam? | sim | — | código |
| Hyper Voice | 90 | spec | 3 | — | — | não no catálogo-fonte | — | código |
| Judgment | 100 | spec | 1 | — | — | sim | — | código |
| Metronome | 85 | spec | 2 | 240 | — | não no catálogo-fonte | sim | código |
| Morning Sun | 0 | status | 1 | 900 | utility? | não no catálogo-fonte | — | código |
| Multi-Attack | 120 | phys | 2 | 240 | — | não no catálogo-fonte | — | código |
| Pain Split | 0 | status | 1 | 900 | utility? | não no catálogo-fonte | — | código |
| Pay Day | 40 | phys | 1 | — | — | não no catálogo-fonte | sim | código |
| Protect | 0 | status | 4 | 600 | utility? | não no catálogo-fonte | — | código |
| Quick Attack | 40 | phys | 3 | — | — | sim | — | código |
| Raging Bull | 90 | phys | 1 | — | contact?, windup | não no catálogo-fonte | — | código |
| Rapid Spin | 60 | phys | 1 | — | — | sim | — | código |
| Razor Wind | 80 | spec | 1 | 300 | highCrit? | não no catálogo-fonte | — | código |
| Recover | 0 | status | 1 | 900 | utility? | sim | — | código |
| Retaliate | 70 | phys | 1 | — | — | não no catálogo-fonte | — | código |
| Rock Climb | 90 | phys | 1 | 240 | contact?, melee? | não no catálogo-fonte | — | código |
| Self-Destruct | 200 | phys | 1 | 9999 | utility? | não no catálogo-fonte | — | código |
| Shell Guard | 0 | status | 1 | — | — | não no catálogo-fonte | — | código |
| Shell Smash | 0 | status | 1 | — | utility? | não no catálogo-fonte | — | código |
| Shell Spin | 0 | status | 1 | — | — | não no catálogo-fonte | — | código |
| Sing | 0 | status | 1 | 720 | utility? | não no catálogo-fonte | sim | código |
| Skull Bash | 130 | phys | 1 | 420 | — | não no catálogo-fonte | — | código |
| Slash | 70 | phys | 1 | — | highCrit? | não no catálogo-fonte | — | código |
| Sonic Boom | 40 | spec | 1 | 150 | — | não no catálogo-fonte | — | código |
| Substitute | 0 | status | 2 | 900 | utility? | não no catálogo-fonte | — | código |
| Supersonic | 0 | status | 1 | 600 | utility? | sim | — | código |
| Swift | 60 | spec | 1 | — | sureHit? | não no catálogo-fonte | sim | código |
| Swords Dance | 0 | status/stat | 2 | 400 | utility? | não no catálogo-fonte | — | código |
| Tri Attack | 80 | spec | 2 | — | — | não no catálogo-fonte | sim | código |

## POISON — 8 golpes

| Nome | Poder(es) | Categoria | Variantes | Cooldown bruto | Flags de execução | Fonte Poké Arena 2D | Baseline Torre 2 | Evidência |
| --- | ---: | --- | ---: | ---: | --- | --- | --- | --- |
| Cross Poison | 70 | phys | 4 | 180, 200 | highCrit?, windup | sim | — | em sessão/menus |
| Gunk Shot | 120 | phys | 1 | 360 | — | não no catálogo-fonte | — | código |
| Poison Fang | 50 | phys | 1 | — | contact? | não no catálogo-fonte | — | código |
| Poison Jab | 80 | phys | 4 | 200 | contact?, melee?, windup | não no catálogo-fonte | — | código |
| Sludge Bomb | 90 | spec | 4 | 200, 210 | projectile?, windup | sim | — | código |
| Sludge Wave | 95 | spec | 2 | 420 | — | não no catálogo-fonte | — | código |
| Toxic | 0 | status | 1 | 600 | utility? | não no catálogo-fonte | — | em sessão/menus |
| Toxic Spikes | 0 | status | 1 | 900 | utility? | não no catálogo-fonte | — | código |

## PSYCHIC — 18 golpes

| Nome | Poder(es) | Categoria | Variantes | Cooldown bruto | Flags de execução | Fonte Poké Arena 2D | Baseline Torre 2 | Evidência |
| --- | ---: | --- | ---: | ---: | --- | --- | --- | --- |
| Agility | 0 | status | 1 | 900 | utility? | sim | — | código |
| Amnesia | 0 | status | 1 | 900 | utility? | não no catálogo-fonte | — | código |
| Calm Mind | 0 | status | 1 | — | utility? | não no catálogo-fonte | — | código |
| Cosmic Power | 0 | stat | 1 | 380 | — | não no catálogo-fonte | — | código |
| Extrasensory | 80 | spec | 2 | 200 | — | sim | — | código |
| Future Sight | 120 | spec | 1 | 900 | utility? | não no catálogo-fonte | — | código |
| Hypnosis | 0 | status | 1 | 540 | utility? | sim | — | código |
| Mirror Coat | 0 | status | 1 | 720 | utility? | sim | — | código |
| Prismatic Laser | 160 | spec | 1 | — | — | não no catálogo-fonte | — | código |
| Psychic | 90 | spec | 5 | — | — | sim | — | código |
| Psychic Fangs | 85 | phys | 3 | — | contact?, windup | não no catálogo-fonte | — | código |
| Psycho Cut | 70 | phys | 2 | — | — | não no catálogo-fonte | — | código |
| Psyshock | 80 | spec | 1 | 220 | — | não no catálogo-fonte | — | código |
| Psystrike | 100 | spec | 1 | — | sureHit? | sim | — | código |
| Reflect | 0 | status | 2 | 900 | utility? | não no catálogo-fonte | — | código |
| Rest | 0 | status | 2 | 1200 | utility? | sim | — | código |
| Trick Room | 0 | status | 1 | — | utility? | não no catálogo-fonte | — | código |
| Zen Headbutt | 80 | phys | 2 | — | contact?, windup | sim | — | código |

## ROCK — 8 golpes

| Nome | Poder(es) | Categoria | Variantes | Cooldown bruto | Flags de execução | Fonte Poké Arena 2D | Baseline Torre 2 | Evidência |
| --- | ---: | --- | ---: | ---: | --- | --- | --- | --- |
| Accelerock | 40 | phys | 2 | 150 | contact?, melee? | não no catálogo-fonte | — | código |
| Ancient Power | 60 | spec | 8 | 300, 360, 420 | — | não no catálogo-fonte | — | código |
| Head Smash | 150 | phys | 1 | 540 | — | não no catálogo-fonte | — | código |
| Power Gem | 80 | spec | 4 | — | windup | não no catálogo-fonte | — | código |
| Rock Slide | 75 | phys | 5 | 140 | windup | sim | — | código |
| Rock Wrecker | 150 | phys | 1 | 600 | windup | não no catálogo-fonte | — | código |
| Sandstorm | 0 | status | 1 | 1500 | utility?, windup | não no catálogo-fonte | — | código |
| Stone Edge | 100 | phys | 13 | 140, 190, 240, 270, 300 | highCrit?, windup | sim | — | em sessão/menus |

## STEEL — 17 golpes

| Nome | Poder(es) | Categoria | Variantes | Cooldown bruto | Flags de execução | Fonte Poké Arena 2D | Baseline Torre 2 | Evidência |
| --- | ---: | --- | ---: | ---: | --- | --- | --- | --- |
| Autotomize | 0 | status | 1 | 480 | utility? | não no catálogo-fonte | — | código |
| Bullet Punch | 40 | phys | 1 | 90 | contact?, melee? | sim | — | código |
| Doom Desire | 140 | spec | 1 | — | — | não no catálogo-fonte | — | código |
| Flash Cannon | 80 | spec | 6 | 200 | beam? | não no catálogo-fonte | sim | código |
| Gear Grind | 100 | phys | 1 | 240 | — | não no catálogo-fonte | — | código |
| Gyro Ball | 100 | phys | 1 | 300 | — | sim | — | código |
| Heavy Slam | 80, 100 | phys | 4 | 300, 420 | — | sim | — | código |
| Iron Defense | 0 | status | 1 | 600 | utility? | não no catálogo-fonte | — | código |
| Iron Head | 80 | phys | 6 | 190, 210 | contact?, melee?, windup | não no catálogo-fonte | — | código |
| Iron Tail | 100 | phys | 5 | 240 | contact?, melee? | sim | — | código |
| King's Shield | 0 | status | 1 | — | utility? | não no catálogo-fonte | — | código |
| Metal Burst | 60 | phys | 1 | 420 | utility? | não no catálogo-fonte | — | código |
| Metal Claw | 50 | phys | 1 | 70 | contact?, windup | não no catálogo-fonte | sim | código |
| Metal Sound | 0 | status | 1 | 600 | utility? | não no catálogo-fonte | — | código |
| Meteor Mash | 90 | phys | 2 | 110 | contact?, windup | não no catálogo-fonte | — | código |
| Shift Gear | 0 | status | 1 | — | utility? | não no catálogo-fonte | — | código |
| Steel Wing | 70 | phys | 3 | 90, 120 | contact?, windup | não no catálogo-fonte | — | código |

## WATER — 21 golpes

| Nome | Poder(es) | Categoria | Variantes | Cooldown bruto | Flags de execução | Fonte Poké Arena 2D | Baseline Torre 2 | Evidência |
| --- | ---: | --- | ---: | ---: | --- | --- | --- | --- |
| Aqua Cutter | 70 | phys | 1 | 240 | — | não no catálogo-fonte | — | código |
| Aqua Jet | 40 | phys | 1 | — | contact? | sim | — | código |
| Aqua Tail | 90 | phys | 2 | 360 | contact?, windup | sim | — | código |
| Crabhammer | 100 | phys | 1 | — | contact?, highCrit? | não no catálogo-fonte | sim | código |
| Flip Turn | 60 | phys | 1 | 170 | contact? | não no catálogo-fonte | — | código |
| G-Max Rapid Flow | 130 | phys | 1 | 600 | — | não no catálogo-fonte | — | código |
| Hydro Pump | 110 | spec | 7 | 230, 270 | beam? | sim | — | código |
| Liquidation | 85 | phys | 1 | — | contact? | não no catálogo-fonte | — | código |
| Muddy Water | 90 | spec | 1 | 360 | — | não no catálogo-fonte | — | código |
| Origin Pulse | 110 | spec | 2 | 540 | — | não no catálogo-fonte | — | código |
| Rain Dance | 0 | status | 1 | 600 | utility? | não no catálogo-fonte | — | código |
| Scald | 80 | spec | 1 | 220 | — | não no catálogo-fonte | — | código |
| Snipe Shot | 80 | spec | 1 | 150 | highCrit?, sureHit?, utility? | não no catálogo-fonte | — | código |
| Surf | 90 | spec | 5 | 420 | — | não no catálogo-fonte | — | código |
| Surging Strikes | 112 | phys | 1 | 240 | contact?, melee? | não no catálogo-fonte | — | código |
| Water Gun | 40 | spec | 1 | 110 | beam? | sim | — | código |
| Water Pulse | 60 | spec | 2 | — | — | sim | — | código |
| Water Shuriken | 70 | spec | 1 | 150 | projectile? | sim | — | código |
| Water Spout | 150 | spec | 2 | 600 | — | não no catálogo-fonte | — | código |
| Waterfall | 80 | phys | 2 | — | contact? | sim | — | código |
| Whirlpool | 35 | spec | 1 | 360 | — | não no catálogo-fonte | — | código |

## Referências

- [Metadados estruturados de todas as variantes](golpes-mecanicas-ast.json)
- [Resumo e distribuição por tipo](golpes-mecanicas-resumo.json)
- [Relatório de combate em navegador autenticado](AUDITORIA-COMBATE-AUTENTICADO-2026-10-31.md)
- [Nova coleta de golpes e candidatos](PESQUISA-COMPLEMENTAR-DE-GOLPES-2026-10-31.md)

## Restrições técnicas

1. Os golpes podem estar declarados para personagens não jogáveis, espécies ainda bloqueadas, versões ou modos distintos; presença no código **não prova disponibilidade**.
2. Dados de dinâmica como alcance, colisão, som e animação precisam de teste em batalha, pois podem estar em expressões calculadas e funções próprias.
3. Não é adequado substituir os VFX aprovados ou balanceamento oficial do Torre 2 a partir destes valores.
4. O material está em branch de pesquisa separada, não publicada no jogo.
