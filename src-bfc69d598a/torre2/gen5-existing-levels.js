/* Black/White Gen V Kanto level-up moves missing from Let's Go tables.
 * Only the two verified Ponyta line signatures are listed; all other
 * species retain FRLG + Gen VII Let's Go gating until independently audited.
 * Sources: https://pokemondb.net/pokedex/ponyta/moves/5
 *          https://pokemondb.net/pokedex/rapidash/moves/5
 * Metadata ONLY; does not create Flame Charge or Flare Blitz renderers.
 * Only approved/native installed attacks can be used by the move-pool.
 */
export const GEN5_KANTO_LEVEL_UP=Object.freeze({
 ponyta:Object.freeze({'flame-charge':21,'flare-blitz':49}),
 rapidash:Object.freeze({'flame-charge':21,'flare-blitz':49})
});
export function gen5KantoUnlockLevel(species,move){
 const id=String(species||'').toLowerCase();
 const key=String(move||'').toLowerCase().replace(/[^a-z0-9]+/g,'-');
 const at=GEN5_KANTO_LEVEL_UP[id]?.[key];
 return Number.isInteger(at)?at:null;
}
