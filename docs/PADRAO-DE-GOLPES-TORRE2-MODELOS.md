# Padrão permanente de efeitos — Pokémon Torre 2

## Escopo ATUAL — terminar exclusivamente os golpes específicos (21/10/2026)

**Regra acima de qualquer sugestão anterior:** só modificar um golpe se ele **não possuir visual próprio no Poké Arena 2D**. Todas as animações já existentes no cliente original Poké Arena 2D são finais e devem permanecer **exatamente como estão**. O Pokémon Zarza serve para pesquisar conceitos e modelos, nunca como motivo para trocar golpes nativos por outros.

A prioridade agora é **finalizar a lista atual de golpes específicos do Torre 2**. Não iniciar sistemas gerais, não retrabalhar golpes nativos e não começar séries genéricas de ataques (Flamethrower, Thunderbolt, Earthquake, Hydro Pump etc. enquanto tiverem arte original).

**Postergação expressa pelo usuário:**
- Sistema global para posicionar golpes em mãos/bocas/corpos e sincronizar todos os Pokémon: **somente quando os 151 Pokémon de Kanto estiverem no jogo**.
- Iluminação dinâmica em todos os golpes: **mais adiante**, sem implementar agora.

**Status atualizado da biblioteca de 11 golpes específicos:**
- **Protegidos, aprovados:** Bonemerang, Bone Club, Tri Attack, Pay Day, Shadow Ball, Ice Beam V6, Rock Blast, Confuse Ray amarelo e Soft-Boiled.
- **Também aprovados:** Swift (sete estrelas, acerto/erro individual) e Lovely Kiss (cinco corações grandes, colisão e 75% sono ao acertar). Total: **11 golpes específicos concluídos e aprovados**.
- **Surf:** segue removido do catálogo dos novos golpes, conforme pedido do usuário. Não reinserir.
- Não confundir **Pokémon Torre 1** com Pokémon Torre 2.

Ao terminar Swift e Lovely Kiss e obter aprovação explícita, voltar à lista de golpes específicos **que estejam realmente sem efeito nativo** no Poké Arena 2D. Nunca reinventar um golpe que já está desenhado lá.



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
