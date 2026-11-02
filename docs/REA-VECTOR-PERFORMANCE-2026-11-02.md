# Laboratório REA — auditoria de desempenho e integridade (02/11/2026)

## Contratos e escopo

O protótipo experimental permanece **somente no Laboratório** da PR [#459](https://github.com/lulualcides-sys/Pok-mon-torre-2/pull/459), sem merge ou publicação na `main`. Não modificar golpes, VFX aprovados, física/dano, IA, climas, captura, inventário ou saves.

**Metas de produto, não resultados:** 60 FPS (16,67 ms por quadro) em hardware capaz; 30 FPS estáveis (33,33 ms) em dispositivos mais fracos. Os testes abaixo usam Chromium headless 1280×720 com GPU emulada por **SwiftShader** (software, CPU), não medem o telefone do usuário.

## Histórico verificável por SHA

| SHA da branch | Mudança específica | GitHub Actions REA |
| --- | --- | --- |
| `9434f0dd86ed` | Separar fundo estático, limitar `setText` a transições | [#41421905558 — success](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/41421905558) |
| `9d86f1096533` | Verificação geométrica curva, sete janelas de FPS OFF/ON e testes de navegador | [#41429521468 — success](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/41429521468) |
| `4a431185b081` | Cache de alvo estático e rastros só ao mudar o modo | [#41445702510 — success](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/41445702510) |
| `297e62f37bb2` | **RenderTexture nativo** para fundo estático, mantendo fallback Graphics | [#41446938361 — success](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/41446938361) |

O efeito de colisão continua matematicamente isolado da mecânica de ataques reais. A nova textura usa 640×360 pixels lógicos, origem (0,0), uma chamada `draw`, seguida de descarte do `Graphics` temporário; `destroy` da cena libera a textura. Não há arte proprietária do PB Ranked incorporada.

## Medições reproduzidas do mesmo protocolo

**Protocolo:** mesma batalha (Bulbasaur vs Onix), navegador Chromium headless com SwiftShader, 1280×720, **sete amostras sequenciais curtas (~2,6 s cada)**, intercalando painel OFF/ON/OFF/ON/OFF/ON/OFF. Isso reduz um tipo de viés, mas ainda há aquecimento, cachê, ordem e ruído do runner; comparar SHAs **não é experimento controlado de GPU real**.

| SHA e condição | Amostras | FPS mediano | p95 de duração de quadros (mediana) |
| --- | ---: | ---: | ---: |
| `9d86f10` — OFF | 4 | 17,36 | 91,7 ms |
| `9d86f10` — ON | 3 | 12,67 | 116,6 ms |
| `4a43118` — OFF | 4 | 19,38 | 83,3 ms |
| `4a43118` — ON | 3 | 13,96 | 83,4 ms |
| `297e62f` — OFF | 4 | 24,84 | 58,4 ms |
| `297e62f` — ON | 3 | 19,49 | 66,7 ms |

Diferença descritiva de FPS OFF→ON: `−27,00%` em `9d86f10`, `−27,94%` em `4a43118` e `−21,54%` em `297e62f`. A variação de OFF de 19,38 para 24,84 FPS entre os dois últimos SHAs evidencia ruído e/ou mudança de custo global do renderizador; **não atribuir todo ganho ao RenderTexture**, não extrapolar para Android e não concluir que o alvo de 30/60 FPS foi alcançado.

### Comparação visual independente

Capturas do modo dash nas execuções `4a43118` e `297e62f` comparadas byte a byte **somente após decodificação em RGB nos mesmos retângulos** (imagem 1280×720):

- Cenário estático: retângulo `(46,277)-(715,342)` → 0 de 43.485 pixels distintos.
- Montanhas/arte: `(120,400)-(440,449)` → 0 de 15.680.
- Piso e vegetação: `(60,465)-(675,485)` → 0 de 12.300.
- Cabeçalho do laboratório: `(55,230)-(687,259)` → 0 de 18.328.

**Limitação:** os retângulos selecionados testam áreas específicas, não garantem equivalência total em cada instante animado. Fora do painel a batalha continua variando no tempo, portanto pixels externos não são comparáveis.

## Regressões realmente comprovadas no último SHA

O [CI #41446938361](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/41446938361) concluiu `math-and-isolation` e `phaser-browser` com **success**. Prova de Chromium inclui 1 colisão por modo (beam/dash/arc), reabertura, sobreposição de controle, viewport 960×540, saída para campanha, limpeza sem erro JavaScript, zero erros de fotograma reportados e **save byte a byte idêntico**.

Capturas reais e métricas: [artefato #13143126713](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/41446938361/artifacts/13143126713). O teste também exige `usesCachedBackdrop=true`, evitando declarar sucesso se o cliente novo não usar a textura.

## Bloqueios de publicação e próximo trabalho

1. **Desempenho**: o painel ainda mostra diferença descritiva de ~21,5% de FPS ON/OFF em SwiftShader. Fazer perfil GPU/CPU em dispositivo real antes de alterar demais o combate. Evitar congelar a IA ou renderização do jogo atrás do painel sem prova e autorização; isso afetaria o comportamento.
2. **Falhas não relacionadas ao novo cache no CI da branch:** Guardião Visual encontra item nativo `personalizar` inesperado no baseline de menu; varredura de 151 Pokémon aborta pela duplicação `Twister` nativo/custom. Não desativar esses testes, remover VFX aprovado ou atualizar baseline cegamente. Corrigir em escopo separado com política de golpes e prova de cliente upstream.
3. **Porta de publicação:** regressões integrais em campanha, Arena, captura, clima, HUD, saves, VS, controles mobile e screenshot aprovada por usuário; confirmar `main`/Pages no SHA correto apenas se autorizado e validado.

**Estado:** código isolado e navegador aprovados; benchmark e revisão visual documentados; publicação **não autorizada pelo resultado atual**.
