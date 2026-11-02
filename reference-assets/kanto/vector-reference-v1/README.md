# Motor vetorial de referência — Kanto (protótipo v1)

**Estado:** ferramenta de desenvolvimento, em branch separada; nenhum novo mapa, save, efeito, combate ou HUD foi alterado. **Não é um sistema que aprende automaticamente uma imagem.**

## Problema enfrentado

Quando a arte é pedida apenas por prompt, árvores, casas, pedras e ruas tendem a mudar de proporção e repetir uma mesma composição. Este motor usa **guias geométricos explícitos** para fixar silhueta, volumes, localização do foco, paleta e escala antes de rasterizar em uma grade de pixels.

Fluxo: **referência visual autorizada → identificar manualmente formas/contornos e paleta → guia JSON vetorial normalizado (0..1) → SVG com pixels inteiros, sem anti-alias → análise de geometria, contraste e costuras → revisão humana → integração futura no Phaser**.

Não infere contornos de fotografias sozinho, não converte qualquer imagem em uma sprite pronta, não copia sprites de terceiros, não substitui direção artística. Uma imagem de referência deve ser tratada como inspiração de composição, não licença para copiar material protegido.

## Arquivos e pipeline

- `tools/pokearena/torre2-vector-reference.mjs`: valida guias, rasteriza retângulos/elipses/polígonos normalizados e analisa distribuição geométrica (cobertura, centro de massa, limites, mudanças entre pixels, cores e costuras).
- `tools/pokearena/build-vector-reference.mjs`: gera os SVGs e um manifesto reproduzível, sem serviços externos.
- `guides/*.json`: três guias iniciais, feitos para **Cerulean (canal e ponte)**, **Pewter (rochedos e degraus)** e **Viridian (árvore de copa irregular)**.
- `rendered/*.svg`: três candidatos derivados deterministicamente dos guias, não aprovação artística.
- `generated-manifest.json`: métricas do resultado, não um indicador subjetivo de qualidade.
- `tests/kanto-vector-reference.test.js`: segurança, limites geométricos, geração reproduzível, verificação de costuras e leitura diagnóstica dos 210 SVGs da biblioteca anterior.

Execute na raiz do repositório, com Node.js 24:

```bash
node tools/pokearena/build-vector-reference.mjs --check
node --test tests/kanto-vector-reference.test.js
```

Para **regerar** as três provas de conceito após editar os guias:

```bash
node tools/pokearena/build-vector-reference.mjs
```

## Como aplicar referências aprovadas

Cada guia descreve `size` (16–128, múltiplo de 8), `kind` (terrain/prop), `background`, paleta nomeada e formas na ordem de camadas. As coordenadas são frações entre 0 e 1; o motor calcula se cada centro de pixel pertence à figura, sem criar semitons ou bordas borradas. `tileable:true` exige costuras iguais no topo/baixo e esquerda/direita, caso contrário gera um aviso e o build reprova.

Padrão de revisão futuro: (1) proporção em 32px e zoom 4×; (2) escala junto ao sprite do protagonista; (3) composição diferente por cidade; (4) legibilidade no celular; (5) transição entre tiles; (6) teste real WebGL antes de qualquer merge.

**Limitação atual:** imagens complexas e ilustrações não são autovetorizadas; os SVGs da biblioteca v2 também foram originalmente desenhados por processo procedural simples, não equivalem ao acabamento dos conceitos. O ganho da v1 é **controle geométrico verificável**, não qualidade gráfica garantida. O mapa em produção não usa este motor.
