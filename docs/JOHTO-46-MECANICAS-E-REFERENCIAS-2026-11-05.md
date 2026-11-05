# Auditoria Johto – 46 golpes e mecânicas Gen III (05/11/2026)

Fontes: https://pokemondb.net/move/generation/2 ; https://pokeapi.co/docs/v2 ; https://bulbapedia.bulbagarden.net/wiki/List_of_changed_moves .

O arquivo tools/pokearena/torre2-johto-gen3-research.js documenta os 46 golpes pelo nome, comportamento de FireRed/LeafGreen, etapa visual, alvo e URL específica. É referência auditável, não afirmação de 46 golpes totalmente jogáveis.

Preservar **Powder Snow, Whirlpool e Zap Cannon**. Os outros 43 ainda dependem de aprovação estética. Os 28 recém-adicionados seguem apenas visuais; não converter VFX em dano ou em suposta habilidade completa.

Distinções críticas: Triple Kick tem 3 chutes 10/20/30 e precisão individual; Magnitude tem pesos 5/10/20/30/20/10/5 e poderes 10/30/50/70/90/110/150; Beat Up depende de aliados saudáveis; Hidden Power depende de IVs (poder 30–70 em Gen III); os tipos Dark eram especiais em Gen III, e Sweet Kiss é Normal; Morning Sun cura 1/2, 2/3 no sol, 1/4 em outros climas; Attract falha com Mewtwo sem gênero.

Antes de novas artes, consultar também as quatro fontes exigidas pela política e a biblioteca reference-library/vfx-sources/ (na main). Usar PixelFX renderizado offline para spritesheets Phaser/WebGL; não alterar a campanha/saves. Regra do Test Lab: cooldown 1 segundo sem VFX sobrepostos.

## Motion review 43 moves

43 distinct Phaser/WebGL sprite paths added according to the Gen III individual behavior audit. Self-only moves display on the caster, traps and damage on foe/ground, exchanging moves between both, attacks in flight. No approved VFX modified, no campaign unlock.

## Correções da mecânica Gen III na arena de teste

Magnitude usa sorteio ponderado de níveis 4–10. Present tem 40% força 40, 30% força 80, 10% força 120 e 20% cura. Triple Kick evolui potência em três acertos separados. Beat Up não inventa cinco aliados quando o treino possui só Mewtwo. Golpes Dark usam categoria especial Gen III, e Sweet Kiss passa a Normal. Efeitos aprovados e campanha não alterados.
