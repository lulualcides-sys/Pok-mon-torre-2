# Referência de homologação — 08/11/2026

Estado: primeira implementação para revisão; **não aprovada, não mesclada, não publicada no Pages oficial**. Expansão para o restante da campanha aguarda aprovação expressa. Base: `9efaa07fcc2bcfacd04646e086d594aade62846d`.

## Entrega
- Cards de Cerulean: diorama original, pedestal, vegetação e jardineiras; grid, NPCs, rosters e estados preservados. Outras etapas mantêm o cenário anterior.
- Cerulean em QA: bancos, jardineiras e margens do canal. Planta, NPCs, hotspots e timer originais preservados. O modo público atual continua baseado em cards; não reativamos mapas.
- PC: seis slots visíveis, retratos nativos, gutter de legenda, hitboxes originais e carregamento sob demanda restrito ao PC. Nenhuma lógica de transferência/save alterada.
- Spritesheet original RGBA 128×32, quatro células 32×32, PNG e tileset TSJ para edição posterior. Texturas próprias NEAREST, sem timers novos.
- Página `homolog/index.html`: três referências navegáveis em iframe efêmero e comparações reais antes/depois. Recursos nativos vêm do build publicado `src-cbbd42f778`; módulos visuais são substituídos por import map. Não é build autossuficiente.

## Verificações executadas
- `npm test`: **487/487 PASS** após ajustes.
- `npm run check`: PASS.
- `approved-visual-guard.mjs`: três referências protegidas PASS.
- `check-premium-boundary.mjs`: 235 arquivos de código/dados/arte existentes idênticos à base; conteúdo de campaign-scene fora de pcScreen idêntico, descontados os imports de apresentação.
- Guardião Chromium existente via transporte local: PASS, incluindo título, mapa QA, detalhes de cards, Cinnabar, grama e primeira batalha.
- T99 menus/equipe/TM via transporte local: PASS.
- T25 PC mobile via transporte local + parâmetro QA legado: PASS; troca de equipe cheia, depósito, retirada, reload, oito UIDs preservados e economia inalterada.
- Capturas reais antes/depois em 1280×720, 768×1024 e 390×844: WebGL, zero pageerror e save inalterado nas telas preparadas. Em retrato preserva-se o enquadramento nativo; orientação horizontal recomendada.
- Teste específico PC: PASS_PREMIUM_PC_PORTRAIT_TOUCH_AND_PAGE3; toque nos dois retratos e retirada do UID correto. Teste usa projeção real da câmera (o cálculo inicial de coordenadas 640×360 não era válido sob zoom nativo).
- Navegação da página de revisão local: cards/cidade/PC abriram; texturas premium presentes.

## Limites e tentativas que falharam
- Captura original e download do artefato fixado retornaram HTTP 403. Portanto **build limpo, CI completa de release e suíte integral de batalhas não foram validados**. Não substituímos o cliente-base por implementação falsa.
- Primeira execução de memoria-contexto falhou no sandbox; reexecução com subprocessos permitidos passou e a suíte completa ficou verde.
- Teste legado T25 inicialmente aguardava um mapa desativado no fluxo público; foi executado com `qa-legacy-map=1`, mantendo suas assertivas. Houve uma tentativa concorrente com porta ocupada e outra durante servidor parado; não contam como PASS.
- Revisão independente identificou hitboxes estreitadas e retratos ausentes após 12 itens. Corrigidos preservando hitboxes e usando o carregador existente. O teste específico de toque/retrato posterior tem registro separado.
- A comparação de bytes e o smoke de uma batalha não comprovam todas as combinações de Arena, Training, ginásios e Elite Four. Android físico, FPS/memória prolongados e jornada natural não foram testados.
- A prévia depende da disponibilidade dos recursos públicos fixados. O Pages pode remover a versão antiga; nesse caso é necessário regenerar e rever a homologação.

## Arsenal utilizado
- Kit `toolkits/pokemon-campanha-design` consultado no Arsenal.
- Awesome GameDev Agent Skills `create-game-assets` e `game-ui-ux`: direção, escala, proveniência e revisão em contexto.
- Phaser/WebGL existente: renderização real, texturas exclusivas e filtragem nearest.
- Playwright 1.56.1/Chromium: capturas e navegação real; emulação móvel, não aparelho Android.
- Superpowers: planejamento, execução, diagnóstico, revisão independente e verificação; Spec Kit: spec/plan/tasks nesta pasta.
- Pixelorama e LibreSprite: catalogados, **não executados**; PNG editável disponível. Tiled: formato TSJ produzido, **editor não executado**. SVG.js não necessário. Nenhuma engine nova nem dependência de runtime.

## Arquivos
Runtime: `torre2-trainer-cards.js`, `torre2-city-scenery.js`, somente PC/imports de `torre2-campaign-scene.js`, novo `torre2-premium-art.js`; build-preview acrescenta somente a cópia do novo módulo.

Apoio: `tools/dev/*premium*`, teste `tests/premium-pc-portrait-browser.cjs`, `reference-assets/premium-campaign`, `homolog` e esta especificação. Nenhum merge de PR antiga; #600 permanece separada.
