# Original Cerulean environment atlas
Created for the authorized Pokémon Torre 2 redesign on 2026-10-31 with the built-in image generation tool. No uploaded third-party sprite sheet was embedded. Inspiration: the user's blue-roofed canal-city concept.

`cerulean-atlas-v1.webp`: 1536×1024 RGBA source atlas, WebP quality 94 / alpha 100; pixels retained at source dimensions. Six independent sprite rectangles and runtime sizes are defined in `tools/pokearena/torre2-city-atlas.js`. The game never displays the whole sheet. Cached once for Cerulean and removed when leaving its stage.

Prompt summary: six isolated sprites on transparency in a 3×2 atlas: red-roofed medical center, aquatic gym, blue-roofed item shop, decorative house, lush deciduous tree, stone flower planter; detailed crisp pixel clusters, cream stone/turquoise/blue/green palette, no ground, no text, no watermark, frontal three-quarter RPG perspective.

This records AI-generated provenance, not ownership of Pokémon trademarks or a license to third-party franchise IP. Existing character sprites remain under their existing provenance.

## Surface atlas v1
`cerulean-surfaces-v1.webp`: original built-in imagegen output, generated 2026-10-31 (São Paulo). Source 1254×1254 with four equal 627px quadrants. Each quadrant cropped individually and resized with nearest-neighbor to 256×256, then packed into one 512×512 WebP (173352 bytes). Runtime uses four named frames; no full-sheet backdrop. Water offsets animate on the existing owned timer; texture eviction follows the building atlas.

Prompt: “Production tile texture atlas for a layered top-down pixel-art RPG town. Four equal swatches in a strict 2×2 grid, no gutters, borders, labels, perspective or objects. Top left vivid turquoise water with cyan/white caustic ripples; top right pale ivory limestone pavement with fitted irregular rectangular stones; bottom left lush varied green meadow grass without flowers; bottom right cool gray retaining-wall masonry with shaded bevels and subtle moss. Finely crafted crisp 16-bit pixel clusters, no blur, no full scene, no buildings, no sprites, no watermark. Each swatch independently usable as a tiled surface.”
