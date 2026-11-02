# Pixel library v2 — work in progress

This directory contains 210 individually addressable **original procedural 32×32 SVG pixel assets**, not copied Pokémon/third-party game sprites. Files use only pixel-aligned <rect> elements and a deterministic palette. 20 ground biome families × 6 variants and 18 nature prop families × 5 variants.

**Status: unapproved candidates, not in production.** All images are independent SVGs and the manifest records their role and transparency. They are not a replacement for the high-quality Kanto concept illustrations; richer authored sprite sheets and an artist's review are still necessary. Avoid simply inserting many repetitive sprites.

- Terrain: grass, moss, dirt, sand, stone, cobble, slate, volcanic, snow, ice, marsh, mud, rock, flower_grass, shallow_water, deep_water, wood, brick, lava, forest_litter
- Props: oak, pine, broadleaf, sakura, shrub, fern, reed, mushroom, stump, boulder, coral, cactus, bamboo, berry_bush, beach_grass, cattails, flower, fallen_log
- Art direction: Kanto cities have distinct geometry/vegetation density; species and scenery scale must be coherent.
- Integration: use SVG only after visual acceptance; rasterize at nearest-neighbor/actual target resolution to avoid anti-aliased or blurred edges. Keep approved native HUD, effects, saves and campaign routes unchanged.
- This folder intentionally does not affect the build or game runtime. No claim of merged main, deployment, 60 FPS or visual approval.

### Concept-sheet archive
The 11 AI-generated concept sheets are curated separately in the conversation artifact `kanto_conceptos_originais_2026-11-01.zip` and are **not included as binary image files in this Git branch**. Concept sheets contain captions, backgrounds, multiple objects and should not be directly used as Phaser sprites. Their existence is not evidence of Github upload, whatever any AI-generated image text says.
