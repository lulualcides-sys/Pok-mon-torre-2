# Pixel Art / UI Workbench — plano executável para Pokémon Torre 2

**Estado:** piloto em PR *draft*. NÃO mesclar/publicar o redesenho visual sem verificação humana.
**Arsenal das 7 ferramentas:** https://github.com/lulualcides-sys/Arsenal/blob/main/ferramentas/PIXELART-UI-PHASER-7-FERRAMENTAS-2026-11-04.md

## Ferramentas e responsabilidades

- **Pixelorama**: criação dos quadros editáveis dos VFX; CLI headless para exportar spritesheet PNG. [CLI oficial](https://pixelorama.org/user_manual/cli/).
- **LibreSprite**: editor alternativo de sprites se o Pixelorama não atender.
- **Gridvana**: piloto isolado de edição de pixels por agente MCP; não autorizar cópia de código GPL para o runtime.
- **PixelDust**: prototipagem de partículas com referências, sem reutilizar código/ativos de licença incerta.
- **Tiled**: layout de Cinnabar, rotas e ginásios em camadas com saída JSON. [Workflow Tiled + Phaser](https://docs.phaser.io/phaser-editor/scene-editor/game-objects/tilemap-object).
- **Phaser Editor v5**: opção paga para posicionamento visual; testar somente após o pipeline gratuito.
- **Playwright**: screenshot real, detecção de regressões e relatório de revisão, sem aprovar automaticamente imagem gerada.

## Fluxo e padrões de pixel art

1. Localizar screenshots reais da tela reprovada; **agora também capturar Cinnabar/Blaine, stage 6** com o arquivo `tests/visual-guard-browser.cjs`. O teste preserva o save externo: usa apenas a instância local do navegador CI.
2. Criar arquivo **.pxo editável** para **Zap Cannon**, **Powder Snow** e **Whirlpool**. Não partir de um círculo vetorial com partículas genéricas. Trajetória, silhueta, timing e impacto individualizados; palette curta e nearest-neighbor, nunca suavização bilinear.
3. Exportar 12 quadros (valor inicial, não imposição artística) como PNG spritesheet; manter fonte `.pxo` versionada, e documentar largura/altura por frame, origem/licença e período de hit.
4. Montar cenário em Tiled por camadas `ground`, `buildings`, `decorations`, `npcs`, `hitZones`, `overlay`. O botão VS Seeker não pode cobrir casas ou treinadores.
5. Integrar **somente no laboratório de Mewtwo**, sem alterar o modo Arena aprovado nem saves da campanha.
6. Comparar fotos do navegador com baselines aprovados em `data/visual-review/review-manifest.json`. O check verde do Chromium não autoriza declarar o visual bonito.
7. Abrir PR com screenshots reais e **aguardar aprovação visual do usuário**; o estado `pending_visual_review` impede o release no modo estrito.

## Comandos já integrados (sem programa externo adicional)

Após executar o build Phaser original e `node tests/visual-guard-browser.cjs`:

```bash
node --test tests/visual-review-gate.test.mjs
node tools/dev/visual-review-gate.mjs --mode evidence
node tools/dev/visual-review-gate.mjs --mode release
```

**`evidence`** verifica presença/dimensões de PNG e grava `test-evidence/visual-guard/manual-review-report.json`. Arte sem revisão fica `pending_visual_review`, mas a geração de evidências não falha.  
**`release`** exige baseline PNG, SHA-256, reviewer + data e comparação real de pixels em Chromium. Até existir uma referência aprovada, **retorna erro e não libera publicação**. Não há geração automática de baseline aprovado.

## Exportação Pixelorama a instalar/configurar posteriormente

A CLI desktop é documentada oficialmente, mas o executável não está instalado neste repositório ou no aparelho do usuário. Exemplo depois de instalar no ambiente de arte:

```bash
Pixelorama.x86_64 --headless --quit -- \
  --export --spritesheet \
  --output reference-assets/visual-workbench/exports/zap-cannon.png \
  reference-assets/visual-workbench/moves/zap-cannon.pxo
```

**Os arquivos `.pxo` e PNG ainda não foram desenhados.** Por isso os três alvos do manifesto estão marcados `not_drawn` e `approved:false`. Não usar placeholder como definitivo.

## Bloqueios reais

- Falta baseline visual aprovado por uma pessoa para Cinnabar e para os três primeiros golpes.
- Cinnabar ainda precisa de correção de composição em Tiled/Phaser e nova aprovação.
- Ferramentas externas não instaladas; scripts e documentos em PR são o início da integração, **não resultado final de sprite/UI**.
- Aprovação visual e legal de referências externas é separada de tests funcionais.
