/* Pokémon Torre 2 — optional high-level STAB mastery for the installed TM catalogue.
 * This is a CUSTOM campaign level progression, NOT an official FireRed
 * level-up learnset. FireRed compatibility is a non-negotiable prerequisite.
 *
 * Do not borrow off-type TMs just because a species can technically learn
 * them (e.g. Rattata + Blizzard). No renderer, sprite, damage, cooldown,
 * saved TM, physical/special type chart, or Arena/VS CPU kit is modified.
 * The separately approved Fire Blast Lv50 rule remains in move-pool.js.
 * Surf's earlier visual rejection is respected: it is intentionally absent.
 */
import {KANTO_151} from './all-kanto-species.js';
import {frlgMachineCompatible} from './frlg-learnsets.js';

export const KANTO_STAB_TM_MASTERY_LEVELS=Object.freeze({
 'water-pulse':30,
 'shock-wave':31,
 'rock-tomb':30,
 'aerial-ace':34,
 'brick-break':35,
 'dig':34,
 'giga-drain':38,
 'ice-beam':40,
 'flamethrower':40,
 'thunderbolt':40,
 'psychic':42,
 'shadow-ball':43,
 'sludge-bomb':44,
 'dragon-claw':45,
 'solar-beam':48,
 'earthquake':47,
 'blizzard':50,
 'thunder':50,
 'overheat':50,
 'hyper-beam':50,
 'focus-punch':50
});
const typesBySpecies=new Map(KANTO_151.map(p=>[p.id,new Set(p.tipos)]));
const keyOf=name=>String(name||'').toLowerCase()
 .normalize('NFKD').replace(/[\u0300-\u036f]/g,'')
 .replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');

/** Null means the user-custom level mastery is inapplicable.
 * The move must also exist in the captured approved/native library.
 * Learned moves remain available through their original FRLG/Gen IV/V/VII
 * route and taught TMs remain intact; this is strictly an additive fallback.
 */
export function kantoStabTmMasteryLevel(species,moveId,moveType){
 const id=String(species||'').toLowerCase();
 const move=keyOf(moveId),at=KANTO_STAB_TM_MASTERY_LEVELS[move];
 if(!Number.isInteger(at))return null;
 if(!typesBySpecies.get(id)?.has(String(moveType||'').toUpperCase()))
  return null;
 return frlgMachineCompatible(id,move)?at:null;
}
