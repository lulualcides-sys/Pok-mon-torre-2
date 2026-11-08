# Referência de homologação — 08/11/2026

Estado atualizado: usuário autorizou publicação direta desta referência em 08/11/2026 ("Não, posta direto no jogo"); integração/publicação ainda aguardam CI. Expansão para o restante da campanha aguarda aprovação expressa. Base: `9efaa07fcc2bcfacd04646e086d594aade62846d`.

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

## Estado remoto após PR #602

PR: https://github.com/lulualcides-sys/Pok-mon-torre-2/pull/602 — draft, implementação `33c47487f73d3393e2f5e28fe7e74336d59a7a3f`.

A CI remota **não está integralmente aprovada**. Houve falhas em capture, center, native-shiny-ui, pages-native-vfx-preflight, t22-mobile-rematch e johto-training. As anotações indicam saída 1 e ausência de capturas; os logs detalhados do armazenamento Azure retornaram 403 nesta sessão. Não há evidência suficiente para atribuir essas falhas à infraestrutura ou ao patch. Checks estáticos e alguns testes Johto passaram; não utilizar isso como aprovação geral.

O link Githack de homologação retornou HTTP 403. A página foi validada localmente em `http://127.0.0.1:4175/homolog/` (servidor desta sessão), mas **não existe prévia externa verificada**. A tentativa de criar preview no projeto Vercel existente `pokemon-torre-2-homologacao-teste` foi bloqueada pela revisão automática por exigir autorização explícita para destino e envio do commit. Pergunta de autorização enviada; nenhum deployment criado por essa tentativa. Pages oficial e main permanecem intactos.

Próximo gate: autorização de preview Vercel → verificar URL navegável → avaliação visual humana. CI completa e build limpo continuam necessários antes de qualquer integração/publicação oficial; expansão da campanha aguarda aprovação do padrão.


## Atualização — publicação direta autorizada

A autorização de publicação oficial substitui a solicitação anterior de preview Vercel; não criar esse preview. T95 run 42476335435 passou build real, testes Node e smoke Chromium. Guardião visual run 42476335423 passou desktop/mobile. Quatro workflows antigos repetiram falha na aquisição direta do cliente, antes dos testes. Foram alinhados ao helper existente capture-resilient.sh, com actions:read para baixar o snapshot fixado e verificado; nenhuma assertiva foi removida. Aguardar CI completa e SHA servido para declarar publicação.

QA do Arsenal asset_report.py: PNG 128×32 RGBA, 17 cores, transparência presente, PASS.
