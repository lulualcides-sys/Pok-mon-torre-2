# Motivos originais — campanha premium

Fonte: `tools/pokearena/torre2-premium-art.js`, autoria procedural nesta implementação, sem reutilização de sprites externos. Quatro células RGBA 32×32, atlas 128×32, 17 cores opacas + transparente. Árvores, jardineira, banco e terminal. Reexportar: `node tools/dev/export-premium-art.mjs`.

Runtime: Phaser Graphics → texturas próprias `torre2-premium-*`, filtro NEAREST, sem mipmaps, sem timers nem interações. Não modificar texturas nativas. Arte restrita a cards, cidade QA e PC.

`motifs.tsj` permite importar o atlas no Tiled; PNG pode ser aberto no Pixelorama/LibreSprite. Esses editores NÃO foram executados nesta sessão. Fonte editável determinística e PNG reais, não alegar projeto PXO/ASE produzido.

Estado: referência para revisão, não aprovada para publicação. Cerulean preserva o mapa e os hotspots existentes. Quatro texturas RGBA de 32×32 = 16 KiB de pixels, fora overhead da engine.
