/* Numerical matchup data: pret/pokefirered src/battle_main.c gTypeEffectiveness.
 * Gen III has 17 types. Native later-generation moves remain installed;
 * Fairy-only legacy moves are explicitly mapped to Normal in Kanto.
 */
export const GEN3_TYPES=Object.freeze(['NORMAL','FIGHTING','FLYING','POISON','GROUND','ROCK','BUG','GHOST','STEEL','FIRE','WATER','GRASS','ELECTRIC','PSYCHIC','ICE','DRAGON','DARK']);
export const GEN3_CHART=Object.freeze({"NORMAL":{"ROCK":0.5,"STEEL":0.5,"GHOST":0},"FIRE":{"FIRE":0.5,"WATER":0.5,"GRASS":2,"ICE":2,"BUG":2,"ROCK":0.5,"DRAGON":0.5,"STEEL":2},"WATER":{"FIRE":2,"WATER":0.5,"GRASS":0.5,"GROUND":2,"ROCK":2,"DRAGON":0.5},"ELECTRIC":{"WATER":2,"ELECTRIC":0.5,"GRASS":0.5,"GROUND":0,"FLYING":2,"DRAGON":0.5},"GRASS":{"FIRE":0.5,"WATER":2,"GRASS":0.5,"POISON":0.5,"GROUND":2,"FLYING":0.5,"BUG":0.5,"ROCK":2,"DRAGON":0.5,"STEEL":0.5},"ICE":{"WATER":0.5,"GRASS":2,"ICE":0.5,"GROUND":2,"FLYING":2,"DRAGON":2,"STEEL":0.5,"FIRE":0.5},"FIGHTING":{"NORMAL":2,"ICE":2,"POISON":0.5,"FLYING":0.5,"PSYCHIC":0.5,"BUG":0.5,"ROCK":2,"DARK":2,"STEEL":2,"GHOST":0},"POISON":{"GRASS":2,"POISON":0.5,"GROUND":0.5,"ROCK":0.5,"GHOST":0.5,"STEEL":0},"GROUND":{"FIRE":2,"ELECTRIC":2,"GRASS":0.5,"POISON":2,"FLYING":0,"BUG":0.5,"ROCK":2,"STEEL":2},"FLYING":{"ELECTRIC":0.5,"GRASS":2,"FIGHTING":2,"BUG":2,"ROCK":0.5,"STEEL":0.5},"PSYCHIC":{"FIGHTING":2,"POISON":2,"PSYCHIC":0.5,"DARK":0,"STEEL":0.5},"BUG":{"FIRE":0.5,"GRASS":2,"FIGHTING":0.5,"POISON":0.5,"FLYING":0.5,"PSYCHIC":2,"GHOST":0.5,"DARK":2,"STEEL":0.5},"ROCK":{"FIRE":2,"ICE":2,"FIGHTING":0.5,"GROUND":0.5,"FLYING":2,"BUG":2,"STEEL":0.5},"GHOST":{"NORMAL":0,"PSYCHIC":2,"DARK":0.5,"STEEL":0.5,"GHOST":2},"DRAGON":{"DRAGON":2,"STEEL":0.5},"DARK":{"FIGHTING":0.5,"PSYCHIC":2,"GHOST":2,"DARK":0.5,"STEEL":0.5},"STEEL":{"FIRE":0.5,"WATER":0.5,"ELECTRIC":0.5,"ICE":2,"ROCK":2,"STEEL":0.5}});
export const PHYSICAL_TYPES=Object.freeze(GEN3_TYPES.slice(0,9));
export function gen3MoveType(type){return type==='FAIRY'?'NORMAL':type;}
export function gen3Types(types){
 const values=[...new Set((types||[]).filter(t=>t!=='FAIRY'))];
 return values.length?values:['NORMAL'];
}
export function gen3Category(type){return PHYSICAL_TYPES.includes(gen3MoveType(type))?'PHYSICAL':'SPECIAL';}
export function gen3Effectiveness(type,defenderTypes){
 const row=GEN3_CHART[gen3MoveType(type)]||{};
 return gen3Types(defenderTypes).reduce((value,t)=>value*(row[t]??1),1);
}
export function gen3Stab(type,attackerTypes){
 return (attackerTypes?.length&&gen3Types(attackerTypes).includes(gen3MoveType(type)))?1.5:1;
}
export function gen3BurnModifier(type,status){
 return gen3Category(type)==='PHYSICAL'&&(status?.quema||status?.quemado)?0.5:1;
}
