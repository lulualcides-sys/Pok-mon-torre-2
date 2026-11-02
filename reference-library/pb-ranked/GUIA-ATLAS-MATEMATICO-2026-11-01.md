# Atlas matemático de referências — REA × Pokémon Battlegrounds × Torre 2

**Natureza:** extração matemática derivada dos metadados públicos já catalogados. **Não é** cópia de sprites, efeitos, frames de vídeo, código de origem ou reprodução exata do jogo de terceiros. Sem edição da campanha, Arena, saves, HUD ou golpes aprovados.

## Cobertura e origem

- 237 IDs de sprites animados e **3.815 pares (sprite, estado)** indexados individualmente.
- 283 nomes distintos de golpes classificados por família estrutural hipotética; 246 associados ao elenco atual do site na última leitura pública bem-sucedida; 70 com algum relato de uso em partidas; **176 ainda sem relato de uso**.
- 45 nomes coincidentes com a proteção aprovada no baseline de pesquisa: não substituir efeito existente.
- Dados de origem: `animacoes-marcadores-estados.json`, `FAMILIAS-ESTRUTURAIS-283-GOLPES.json`, `PROGRESSO-GOLPES-283-2026-10-31.json` e `DELTA-REAL-2026-11-01.json`.
- Código reprodutível: [pb-ranked-math-atlas.cjs](../../tools/research/pb-ranked-math-atlas.cjs); testes: [pb-ranked-math-atlas.test.cjs](../../tests/pb-ranked-math-atlas.test.cjs); saída matemática: [ATLAS-MATEMATICO-REA-2026-11-01.json](ATLAS-MATEMATICO-REA-2026-11-01.json).

## Fórmulas explícitas e significado físico

Se uma animação declara `n` quadros e duração total `D` em unidades desconhecidas:

`mediaUnidadesPorQuadro = D/n`

Para um marcador de impacto de índice `k` (assumido como base zero), a **posição ordinal** na sequência é:

`q = k/(n-1)` para `n > 1`, ou zero para um quadro.

**q não é a fração real do tempo**: faltam as durações individuais dos quadros e a conversão real para segundos. Um cálculo opcional, claramente **hipotético**, com duração igual por quadro é `D*(k+0.5)/n`, em unidades da origem — nunca milissegundos inventados.

### Referências estatísticas reais, não sincronismo de hit testado

| Estado | Registros | Mediana quadros | Mediana duração origem | Mediana ordinal de impacto |
| --- | ---: | ---: | ---: | ---: |
| Attack | 236 | 12 | 25 | 0,3333 |
| Strike | 163 | 11 | 24 | 0,3333 |
| Shoot | 229 | 12 | 27 | 0,1818 |
| Swing | 232 | 9 | 16 | 0,6250 |
| Charge | 235 | 10 | 20 | 0,5556 |
| Hop | 234 | 10 | 24 | 1,0000 |
| SpAttack | 51 | 13 | 30 | 0,2778 |

Essas medianas não significam que todos os golpes usem esses estados, nem provam qual é o instante da colisão no jogo real. Por exemplo, `Hop` frequentemente marca impacto no último quadro; a colisão ainda depende da lógica do motor e da posição do alvo.

### Movimento 2D e interpolação próprios

Com `u = clamp(t/T,0,1)`, posições em pixels e `h` a altura da parábola:

- **Trajetória de Pokébola própria**: `x(u) = x0 + (x1-x0)u`, `y(u) = y0 + (y1-y0)u - 4h*u*(1-u)`. A esfera parte/chega nos pontos de origem/alvo, e o arco fica `h` acima da linha reta no meio.
- **Curva de ataque/projétil**: Bézier cúbica `B(u) = (1-u)^3P0 + 3(1-u)^2uP1 + 3(1-u)u²P2 + u³P3`.
- **Esquiva / avanço suavizado**: `s(u)=3u²-2u³`, `P(u)=P0+(P1-P0)*s(u)`.
- **Colisão contínua (anti-tunneling)**: `r(u)=(A0-B0)+u[(A1-A0)-(B1-B0)]`; `u*=clamp(-dot(r0,v)/dot(v,v),0,1)`; colisão se `||r(u*)|| <= raioA+raioB`. O solver também resolve a raiz quadrática do primeiro contato para alinhar efeitos e dano com a chegada ao alvo.

Estas são **implementações originais propostas** para testar no Phaser/WebGL, não valores extraídos do Battlegrounds. A equação de colisão vale para centros lineares em um segmento; ataques curvos exigem subdivisão temporal adaptativa antes de aplicar o solver.

## Sinais do catálogo de golpes

O atlas registra, para cada um dos 283 nomes: tipo, família estrutural **hipotética**, número de variantes, associação ao elenco, uso relatado, exclusividade de VFX aprovado e prioridade de investigação. A pontuação é heurística, não probabilidade de lucro/êxito ou similaridade visual medida:

`score = 100*(0.45*semRelatoElegível + 0.25*equipadoPadrão + 0.20*nãoProtegido + 0.10*min(variantes/5,1))`

A nova associação de **Grassy Glide** no elenco é mantida sem inventar a espécie portadora ou o slot; portanto, `defaultReady = null`. A auditoria não altera o plano histórico de 175 golpes nem afirma que a nova cobertura de 176 foi executada.

## Gate de implementação

1. Comparar antes com os golpes/efeitos aprovados do Torre 2. **Não recriar uma animação existente**.
2. Para cada golpe que for realmente selecionado: testar uma execução do próprio jogador com vídeo/frames, cenário, distância, direção, recarga e efeito no alvo. Não elevar observação estática a prova visual.
3. Somente então gerar **VFX/pixel art próprios**, com matemática de movimento/colisão parametrizável; prototipar em módulo isolado e medir desempenho.
4. Rodar os testes e a navegação de Arena/campanha, preservar o cooldown, clima, IA, ULT, captura Gen III, VS e saves previamente aprovados.
5. Integrar na `main` após confirmação de testes de navegador e revisão de licença dos recursos efetivamente usados.

O REA original analisou JS público; as partidas autenticadas foram feitas em ferramenta separada. Nenhuma sessão de combate autenticada ou extração de frame quadro a quadro foi realizada nesta etapa.
