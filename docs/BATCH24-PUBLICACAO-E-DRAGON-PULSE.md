# Patch dos 24 golpes — correção de duplicação e publicação
Data: 2026-10-23

O lote autorizado em outro chat consiste em 24 nomes de golpes. Destes, **23 devem ser novos** e **Dragon Pulse deve ser reutilizado do Poké Arena 2D original**. Nunca substituir nem redesenhar o Dragon Pulse original.

Golpes novos: Mud Shot, Mud Bomb, Acid, Acid Spray, Sludge, Poison Jab, Mega Drain, Giga Drain, Pin Missile, Icicle Spear, Ice Shard, Poison Fang, Ice Fang, Fury Cutter, Leaf Blade, Night Slash, Icy Wind, Silver Wind, Twister, Energy Ball, Dark Pulse, Ancient Power, Earth Power.

Golpe original nº 24: **Dragon Pulse** (forma e sprites originais; sem duplicação, mesmo nome no catálogo).

## Causa identificada e correção
O GitHub Pages run https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/39926080203 falhou no guardião `DUPLICATE_MOVE_BLOCKED` por `Dragon Pulse` native vs custom. A versão publica não foi atualizada por essa execução.

Este patch remove Dragon Pulse do catálogo personalizado, deixa intacta a versão nativa do Poké Arena 2D, mantém os outros 23 movimentos novos, e reforça os testes de contagem, Mewtwo, filtro NEW, integridade, colisões, não duplicação e gameplay WebGL.

Os efeitos já aprovados continuam protegidos. Os 23 novos não estão automaticamente aprovados visualmente.

## Proveniência das quatro fontes
T2 e Poké Arena 2D: módulos e pipeline Phaser/WebGL reais do projeto. Emerald Arena: física do `arena_physics.c` portada com licença MIT e aviso em `tools/pokearena/batch24/EMERALD-LICENSE.txt`. Zarza: inspecionado, sem cópia de código/arte (exceção específica autorizada no outro chat). O arquivo `data/move-reuse-policy.json` distingue reuso efetivo, estudo e exceções.

**Verificar o run de publicação e o endereço público após o commit.**
