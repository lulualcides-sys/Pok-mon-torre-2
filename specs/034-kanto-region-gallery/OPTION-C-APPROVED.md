# T34 — padrão visual OPÇÃO C aprovado (01/11/2026)

**Decisão do usuário:** manter o visual da **Opção C** como linguagem artística de toda a exploração de Kanto, sem transformar cada região numa cópia da outra. A imagem aprovada é **conceitual**, não screenshot do Phaser, nem asset licenciado/importado.

## Contrato de arte
- Mistura de legibilidade clássica 16×16 com riqueza de cenários modernos: silhuetas nítidas, escala de pixel consistente, amostragem nearest-neighbor, contornos e sombras proporcionais. **Não misturar atlas 16×16 e 32×32 sem escala e tratamento comuns.**
- Cidade, rota, floresta, caverna e interior de ginásio partilham qualidade de acabamento, **não a mesma composição**. Cada local tem paleta, vegetação, material de caminho, topografia, arquitetura e marco visual próprios. Evitar árvores repetidas em grade e corredores retangulares.
- Trilhas curvas e legíveis, bordas e transições de solo, bosques agrupados, grama alta e pequenos props; respeitar entradas, pontes, travessias, NPCs, subchefes, acessibilidade touch e hotspots. **Não adicionar treinadores ou grind**.
- Ordem de implementação: protótipo Cerulean/Misty separado em cidade/rotas/ginásio; Rota 1 como prova do padrão; depois Pallet→Viridian→Floresta→Pewter→Mt. Moon→Cerulean→restante Kanto. Mt. Moon permanece subárea do sistema de rotas/cavernas.
- A arte de referência não autoriza copiar sprites/tilesets comerciais. Conferir licença/proveniência e créditos de cada atlas antes de importar para repositório público.
- HUD Arena, golpes, VFX aprovados, IA, cooldowns, RNG, captura, recompensas, progressão, saves e identidade de líderes intocados.

## Mapeamento de identidade regional
| Região | Identidade exclusiva |
|---|---|
| Pallet | vila tranquila, casas e Laboratório Oak, sem Mart/ginásio inventados |
| Rota 1 | campina ensolarada, trilha sinuosa, flores, grama alta |
| Viridian | cidade arborizada, ginásio fechado, serviços canônicos |
| Rota 2 / Floresta | bosque denso, trilhas sombreadas, cogumelos e portões |
| Pewter | pedra cinza, relevo seco, museu e ginásio de rocha |
| Rota 3 | encostas, pedras, vegetação esparsa |
| Mt. Moon | cavernas com cristais, rocha e iluminação própria |
| Rota 4 | aproximação ribeirinha a Cerulean, juncos e água |
| Cerulean | canais azul-turquesa, pontes e telhados azuis; ginásio aquático é outra tela |

## Implementação e prova
- `torre2-option-c-art-direction.js` define parâmetros visuais determinísticos por região e pintura de caminhos/acessórios na **galeria isolada**. Não é tileset final nem campanha integrada.
- Testes Node verificam identidade dos oito biomas, trajetos variados e decoração fora da faixa central. Necessários antes de merge: npm test, npm run check, check:reuse, build, Chromium desktop/mobile, screenshots REAIS antes/depois e revisão de FPS/overlaps. PR permanece DRAFT até CI e aprovação visual.
- Próxima etapa artística real: substituir os primitivos de Graphics por atlas/tiles aprovados (Tiled/Phaser Tilemap), conservando IDs e mecânicas. **Não afirmar que o mockup Opção C já é reproduzido fielmente.**
