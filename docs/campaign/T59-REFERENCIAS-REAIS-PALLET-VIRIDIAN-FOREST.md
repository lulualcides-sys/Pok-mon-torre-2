# T59 — referências reais do início de Kanto recuperadas no GitHub

As seguintes imagens **já estavam no repositório principal**, com arquivos e SHA-256 originais registrados em `reference-assets/kanto/manifest.json`. São folhas enviadas anteriormente pelo usuário, com mapas visuais de FireRed. **Não estão homologadas como fundos 16:9 atuais** nem são assets automáticos do jogo.

| Cena | Arquivo original (GitHub) | Dimensão da folha | Área do mapa externo (x, y, w, h) | Situação |
|---|---|---:|---|---|
| Pallet Town | [pallet-town.png](../../reference-assets/kanto/maps/cities/pallet-town.png) | 1032×376 | 5, 24, 387, 329 | Referência de exterior; interiores à direita |
| Viridian City | [viridian-city.png](../../reference-assets/kanto/maps/cities/viridian-city.png) | 1360×672 | 6, 24, 770, 640 | Referência de cidade; interiores à direita |
| Viridian Forest | [viridian-forest.png](../../reference-assets/kanto/maps/locations/viridian-forest.png) | 880×1136 | 6, 24, 868, 1104 | Referência vertical; preservar saídas |
| Rota 1 | Não localizada nesta biblioteca | — | — | Sem folha individual |

### Como isso ajuda o Phaser

O catálogo `tools/pokearena/torre2-prologue-reference-sheets.js` contém a origem exata, hashes e retângulos de corte dos três exteriores. Serve para localizar marcos e desenhar hotspots sem confundir interiores com cidades. Não modifica nem copia pixels dos arquivos originais, nem altera os 60 fundos WebP do pacote aprovado.

**Não usar essas folhas diretamente como fundo**: as proporções são diferentes de 16:9, a floresta é vertical, e a qualidade visual difere do padrão detalhado de Cerulean City. A próxima fase de arte precisa criar quatro fundos individuais 1280×720 coerentes, sem HUD/NPC pintados, e submetê-los à aprovação antes de ligar o catálogo adicional do estágio zero.

A sequência obrigatória continua Pallet → Rota 1 → Viridian → Rota 2 → Floresta → Rota 2 norte → Pewter. Rota 22 é opcional.

### Atenção aos direitos

Estas folhas foram fornecidas como referências, não como licença para republicação de sprites. Não converter automaticamente imagens de referência em assets de distribuição. Ver `reference-assets/kanto/README.md`.

### Testes
`node --test tests/t59-original-prologue-references.test.mjs` audita bytes, dimensões PNG, hashes, origem no manifesto, áreas de recorte, distinção entre referência e arte aprovada e ausência de Rota 1.
