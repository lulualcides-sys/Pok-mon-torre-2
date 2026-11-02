# Original Cerulean environment atlas
Created for the authorized Pokémon Torre 2 redesign on 2026-10-31 with the built-in image generation tool. No uploaded third-party sprite sheet was embedded. Inspiration: the user's blue-roofed canal-city concept.

`cerulean-atlas-v1.webp`: 1536×1024 RGBA source atlas, WebP quality 94 / alpha 100; pixels retained at source dimensions. Six independent sprite rectangles and runtime sizes are defined in `tools/pokearena/torre2-city-atlas.js`. The game never displays the whole sheet. Shared across Kanto city views and removed after the League.

Prompt summary: six isolated sprites on transparency in a 3×2 atlas: red-roofed medical center, aquatic gym, blue-roofed item shop, decorative house, lush deciduous tree, stone flower planter; detailed crisp pixel clusters, cream stone/turquoise/blue/green palette, no ground, no text, no watermark, frontal three-quarter RPG perspective.

This records AI-generated provenance, not ownership of Pokémon trademarks or a license to third-party franchise IP. Existing character sprites remain under their existing provenance.

## Surface atlas v1
`cerulean-surfaces-v1.webp`: original built-in imagegen output, generated 2026-10-31 (São Paulo). Source 1254×1254 with four equal 627px quadrants. Each quadrant cropped individually and resized with nearest-neighbor to 256×256, then packed into one 512×512 WebP (173352 bytes). Runtime uses four named frames; no full-sheet backdrop. Water offsets animate on the existing owned timer; texture eviction follows the building atlas.

Prompt: “Production tile texture atlas for a layered top-down pixel-art RPG town. Four equal swatches in a strict 2×2 grid, no gutters, borders, labels, perspective or objects. Top left vivid turquoise water with cyan/white caustic ripples; top right pale ivory limestone pavement with fitted irregular rectangular stones; bottom left lush varied green meadow grass without flowers; bottom right cool gray retaining-wall masonry with shaded bevels and subtle moss. Finely crafted crisp 16-bit pixel clusters, no blur, no full scene, no buildings, no sprites, no watermark. Each swatch independently usable as a tiled surface.”

## Regional atlas and boat v2 (2026-11-01)
Original imagegen sprites matching the established art: eight separate stone, electric, garden, poison, psychic, volcanic, forest and League buildings, plus a white/blue moored launch with cabin, wooden deck and life ring. No complete map or external sprite sheet is used.

`regional-gyms-v1.webp`: 1280×640 transparent atlas, eight 320×320 frames, each source building contained within 304×304 using nearest-neighbor, WebP quality94/alpha100. Rendered separately at 114px (League137px). `boat-v2.webp`: cropped transparent boat, 256px high, rendered at 58–78px. Both share the city texture lifecycle. NPCs remain stationary and decorative; native route/gym actions own combat.

Source imagegen output 1254×1254; crops for gyms: [0,0,420,400], [420,0,420,385], [840,0,414,400], [0,400,420,393], [420,388,420,405], [840,400,414,394], [0,799,420,455], [420,794,420,460]. Packed in that order. Boat source region [840,800,414,454], resized nearest to256 high, then isolated horizontally to remove neighboring transparent gutter artifacts.
