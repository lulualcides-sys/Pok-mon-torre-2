# Padrão permanente de efeitos — Pokémon Torre 2

Aprovado em 21/10/2026.

Quando for pedido um golpe, examinar os modelos de animação disponíveis e escolher aquele que melhor representa **o golpe original**, mas preservar sempre a **identidade visual, escala e fluidez do Poké Arena 2D**. A referência Pokémon Zarza é uma biblioteca de ideias e técnicas, não substitui o estilo do jogo.

Ordem de preferência:
1. **Poké Arena 2D original:** se já houver um movimento visual equivalente, usar diretamente seu sistema de animação no Phaser/WebGL, ajustando paleta e partículas. Foi assim que Ice Beam V6 finalmente foi aprovado usando o mesmo motor Chorro de Hyper Beam/Aura Storm.
2. **Pokémon Zarza:** estudar seus conceitos de fluxo de raios, preparação, feixe, golpe de contato, animação de lutadores, atlases de sprites, reação do chão e luz. Adaptar esses princípios ao motor e ao estilo Poké Arena 2D.
3. **VFX custom Phaser/WebGL:** apenas se nenhum motor original for adequado. Manter pixel art proporcional, silhuetas legíveis, timing de colisão, partículas econômicas, desempenho mobile e quadros animados conforme a complexidade. Não usar Canvas 2D.

## Catálogo de referência por família

- Feixes canalizados (Ice Beam, Hyper Beam, Solar Beam, Hydro Pump): motor Chorro de Hyper Beam/Aura Storm; conceitos de beamContact/stepArenaBeams do Zarza.
- Fogo contínuo (Flamethrower, Fire Spin): motor nativo de feixes ou fogo do Arena 2D; sequência de carga, fluxo e impacto vista no Zarza.
- Orbes (Shadow Ball, Aura Sphere, Water Pulse): disparos do Arena 2D com trilha e impacto; evitar círculos genéricos.
- Status (Confuse Ray, Lovely Kiss, Sleep Powder): movimento, colisão e status sincronizados, seguindo os VFX nativos ou aprovados.
- Múltiplos (Swift, Pay Day, Rock Blast): várias peças com trajetórias, colisões e danos individuais, sem acerto automático.
- Terra e área (Earthquake, Rock Slide): efeito do Arena 2D com reação e marcas no chão quando necessário.
- Gelo/vento/água: partículas proporcionais, harmonizadas com as sombras/iluminação do palco, mantendo o mesmo pixel art.

## Preservação
Ice Beam V6, Confuse Ray (três luzes amarelas), Rock Blast e Soft-Boiled estão aprovados. Nunca mudar golpe aprovado sem pedido explícito. Respeitar aprovações adicionais do projeto e marcar ✓ no sumário.

## Arquivos e fontes para consulta
- Relatório: docs/REA-POKEMON-ZARZA-2026-10-21.md
- Auditoria verificável: https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/39578778490
- Motor Phaser: ferramentas em tools/pokearena; módulo nativo Chorro compartilhado por Hyper Beam/Aura Storm.
- O Zarza possui scripts públicos identificados como poke-arena-vfx.js, poke-arena-beams.js, poke-arena-atlases.js, poke-arena-lighting.js, poke-arena-surface-reactions.js, poke-arena-animation.js, poke-arena-move-art-data.js.

## Protocolo para cada novo golpe
Consultar funcionamento original; comparar pelo menos os modelos Arena 2D e Zarza; selecionar motor mais fiel sem romper o estilo Arena 2D; implementar no Phaser/WebGL; verificar acerto, erro, status, dano no momento certo, desempenho e animação visual em batalha; só então publicar e solicitar aprovação.

A autorização informada pelo usuário para estudar o Pokémon Zarza não deve ser confundida com autorização pública e irrestrita de redistribuição. Antes de incorporar recursos visuais originais num repositório público, confirmar os termos específicos de uso. Estudo de páginas e módulos públicos permanece separado do jogo.
