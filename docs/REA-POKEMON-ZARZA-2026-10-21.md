# REA — Pokémon Zarza: Poké Arena e Arena Lab
**Data:** 21/10/2026
**Fonte original:** https://pokemonzarza.com/poke-arena.html?lang=en&city=encinacorba&mode=exhibition&entry=welcome
**Laboratório público:** https://pokemonzarza.com/poke-arena-lab.html
**Auditoria automática / capturas:** https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/39578778490
**Registro da auditoria:** `tools/research/zarza-public-rea.cjs` (Chrome em modo somente leitura)

## Resumo técnico confirmado
A arena respondeu HTTP 200 em navegação pública não autenticada e possui um elemento `canvas` de 1240×711, 90 scripts solicitados e 157 solicitações de imagem. O laboratório respondeu HTTP 200, com `canvas` de 1080×640, 55 scripts e 75 solicitações de imagem. Esses números são observações de uma carga normal de página; não constituem uma contagem total de golpes ou sprites.

Não foram encontrados objetos globais `window.Phaser`, `window.PIXI`, `window.THREE`, `window.gsap` ou `window.BABYLON` após cinco segundos. As funções públicas observadas em `poke-arena-vfx.js` e `poke-arena-art.js` incluem numerosas operações `fillRect` e `drawImage`, compatíveis com desenho procedural/pixel em Canvas 2D. Isso **sugere** motor de renderização próprio, mas ainda precisa de verificação direta do contexto 2D/WebGL antes de ser afirmado categoricamente.

Foi possível localizar identificadores textuais de golpes, entre eles Ice Beam, Hyper Beam, Confuse Ray, Shadow Ball, Flamethrower, Fire Blast, Thunderbolt, Hydro Pump, Solar Beam, Swift, Blizzard, Rock Blast e Surf. É detecção de nomes no código público, não confirmação de que todos estão desbloqueados e exibidos na sessão de teste.

## Módulos de maior valor para engenharia de conceitos
| Script público | Funções observadas | O que estudar / adaptação ao Torre 2 |
|---|---|---|
| `poke-arena-vfx.js` (53 KB) | `beginArenaVfx`, `paintArenaCharge`, `paintArenaShot`, `paintArenaEffect`, `waterStream`, `pixelCloud`, `shockwave`, `impactBloom`, `fractures` | Biblioteca de efeitos por fase: carga → deslocamento → contato → impacto, com formas de pixel |
| `poke-arena-beams.js` (12,7 KB) | `beamContact`, `startArenaBeam`, `stepArenaBeams`, `beamContest`, `cancelArenaBeam` | Canalização, confronto de feixes, rastreamento do contato durante o movimento |
| `poke-arena-atlases.js` (4,9 KB) | `requestArenaAtlas`, `preloadArenaAtlases`, `paintArenaAtlas`, `paintArenaAtlasFit` | Pré-carregamento e cache das animações/spritesheets, para evitar travadas |
| `poke-arena-lighting.js` (2,8 KB) | `paintSpriteShadow`, `paintBattleLight` | Luz e sombra contextual durante o ataque sem encobrir sprites |
| `poke-arena-surface-reactions.js` (4,2 KB) | `reactArenaSurface`, `paintSurfaceReaction`, `paintImpactSmoke` | Poeira/rachaduras/efeitos no chão sincronizados com impacto |
| `poke-arena-animation.js` (10,4 KB) | `createFighterMotion`, `sampleFighterMotion`, `arenaEmission`, `arenaTrailPoint` | Transição de poses do Pokémon e origem de lançamento seguindo o corpo |
| `poke-arena-visual-profiles.js` (2,8 KB) | `arenaVisualProfile` | Estilo/paleta parametrizados, em vez de animações duplicadas por tipo |
| `poke-arena-move-art-data.js` (6,5 KB) | Dados públicos de arte com nomes de golpes | Separar dados visuais do código da mecânica e do motor |

## Diretriz de uso para o Pokémon Torre 2
**Não copiar cegamente scripts, imagens ou atlases do Zarza.** Não foi identificada licença pública autorizando redistribuição de recursos. A REA feita aqui examinou metadados, nomes de funções, operações de desenho, bibliotecas detectáveis e capturas da página pública, sem copiar código-fonte nem efeitos para o jogo.

**Portabilidade:** o Torre 2 usa Phaser/WebGL; rotinas gráficas `CanvasRenderingContext2D` não entram diretamente. É melhor implementar conceitos equivalentes em `Phaser.Graphics`, `Image` com atlases próprios, emissor de partículas e texturas WebGL. No Torre 2, **Canvas 2D continua proibido**.

**Ordem recomendada:**
1. Prototipar módulo de **impacto/reação ao cenário** (novos golpes não aprovados apenas): impacto sincronizado, fumaça, fissuras, sem atingir automaticamente o inimigo.
2. Implantar **atlas/cache de VFX** e verificar o FPS em Android; adaptar amostras de animação a 8–16 quadros, conforme complexidade.
3. Aplicar **movimento e origem do golpe seguindo a pose** do Pokémon; evita efeitos saindo do centro genérico.
4. Refinar **canais e feixes controláveis** para golpes ainda não aprovados; preservar o Ice Beam V6 aprovado e todos os outros aprovados.
5. Só então escolher golpes para port visual novo, comparar jogo de referência e uma versão de teste em batalha, e validar cada novo efeito antes de substituir o ativo.

## Limitações
A auditoria abriu páginas públicas e analisou módulos carregados em uma sessão, mas **não reproduziu cada golpe específico quadro a quadro**. Para afirmar uma correspondência fiel de qualquer animação, registrar o movimento durante um combate de teste e confirmar o timing de colisão.
