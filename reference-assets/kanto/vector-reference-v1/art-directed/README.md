# Kanto — primeira coleção de arte guiada por geometria (v1)

**Seis arquivos SVG reais** são produzidos por `tools/pokearena/kanto-art-directed-v1.mjs`, cada um com formas e paleta determinísticas, pixels inteiros e sem assets externos ou interpolação. Eles representam uma proposta visual editável; **não** são capturas do jogo nem significam que foram integrados ao Phaser.

- Viridian: árvore de copa volumosa com folhagem em camadas, tronco e raiz
- Pewter: bloco de penhasco com facetas, degraus e minerais
- Cerulean: canal, margens de pedra e ponte
- Vermilion: cais de madeira sobre água, postes e caixas
- Celadon: canteiro ornamental com flores e pequeno chafariz
- Fuchsia: trecho alagado com juncos, lírios e troncos

A coleção separa `prop` de `scene-module`: canal, cais e brejo **não são autotiles** e não devem ser colocados repetidamente como pisos contínuos. A biblioteca anterior de 210 candidatos fica intacta. Estes SVGs não utilizam a engine de guias JSON literalmente; são uma camada de **direção artística geométrica complementar** ao motor da PR #456, com regras equivalentes de coordenadas inteiras, paleta, repetibilidade e auditoria.

**Gerar prova visual dos arquivos exatos com rasterização offline**:

```bash
python -m pip install pillow
python tools/pokearena/render-kanto-art-review.py
node --test tests/kanto-art-directed.test.js
```

Saída em `test-evidence/kanto-art-directed/`: seis PNGs transparentes e `kanto-art-directed-preview.png` em escala nearest-neighbor, identificada expressamente como preview de assets, não screenshot do jogo.

**Falta para publicação**: avaliação visual do usuário, ajuste do acabamento, produção de tiles de solo, teste de atlas e escala de personagem, performance WebGL em desktop/mobile, sistema de navegação, revisão de direitos e merge seguro. Preservar saves, IA, ataques, VFX, HUD e rotas aprovados.
