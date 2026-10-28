/* Gen IV Platinum level-up adaptation: metadata ONLY, for existing renderers.
 * FireRed/LeafGreen remains the default for every other species.
 * Sources: https://pokemondb.net/pokedex/ponyta/moves/4
 *          https://pokemondb.net/pokedex/rapidash/moves/4
 * No new VFX, move entry, animation or TM is introduced.
 * In particular Flare Blitz is ABSENT until an already approved renderer
 * exists and its source licensing/reuse has been validated separately.
 */
export const PLATINUM_EXISTING_LEVELS=Object.freeze({
 ponyta:Object.freeze({
  'tackle':1,'growl':1,'tail-whip':6,'ember':10,
  'flame-wheel':15,'stomp':19,'fire-spin':24,'take-down':28,
  'agility':33,'fire-blast':37,'bounce':42
 }),
 rapidash:Object.freeze({
  'growl':1,'tail-whip':6,'ember':10,'flame-wheel':15,
  'stomp':19,'fire-spin':24,'take-down':28,'agility':33,
  'fire-blast':37,'fury-attack':40,'bounce':47
 })
});
/** Fail closed: a canonical move and an installed renderer are both required.
 * Rapidash cannot receive an inherited move before actually evolving.
 * TM-only / breeding-only moves are intentionally absent from this table.
 */
export function platinumInstalledUnlockLevel(species,canonicalMove,{
 installed=false,evolutionLevel=1
}={}){
 if(!installed)return null;
 const at=PLATINUM_EXISTING_LEVELS[species]?.[canonicalMove];
 if(!Number.isInteger(at))return null;
 return Math.max(at,Math.max(1,Number(evolutionLevel)||1));
}
