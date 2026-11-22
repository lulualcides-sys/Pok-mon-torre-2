/* Pokémon Torre 2 — world touches (owner 2026-11-22, list items 18 and 26; rare forms dropped by the owner).
 * Campaign only:
 *  - Dia e noite (18): the device clock gives morning/afternoon/evening/night.
 *    At night some Pokémon only appear then (Gastly, Haunter) and others are
 *    twice as common (Zubat, Oddish, Meowth, Drowzee, Clefairy...); battle
 *    arenas get darker (evening: warm, night: blue) under the fighters.
 *  - Pokémon favorito (26): one Pokémon of the team stands beside the
 *    trainer on the Trainer Card, like a gym leader with his ace.
 */
const list=v=>Array.isArray(v)?v:[];
// --- 18. Dia e noite ---------------------------------------------------------
export function timeOfDay(date=new Date()){
 const h=date.getHours();
 return h>=6&&h<17?'dia':h>=17&&h<19?'entardecer':'noite';
}
export const TIME_NAMES=Object.freeze({dia:'DIA',entardecer:'ENTARDECER',noite:'NOITE'});
export const NIGHT_ONLY=Object.freeze(['gastly','haunter']);
export const NIGHT_BOOST=Object.freeze(['zubat','golbat','oddish','gloom','meowth','persian','drowzee','hypno','clefairy','jigglypuff','venonat','venomoth','rattata','raticate']);
export function timeWeight(id,phase){
 if(phase==='noite')return NIGHT_BOOST.includes(id)?2:1;
 return NIGHT_ONLY.includes(id)?0:1;
}
// Applies the time weights to a species list; never leaves an area empty.
export function filterByTime(ids,phase){
 const w=list(ids).map(id=>timeWeight(id,phase));
 return w.some(x=>x>0)?w:list(ids).map(()=>1);
}
export const ARENA_SHADE=Object.freeze({dia:null,entardecer:{color:0xff8a3a,alpha:.22},noite:{color:0x0a1840,alpha:.5}});
// --- 26. Pokémon favorito ----------------------------------------------------
export function favoriteMember(s){
 const uid=s?.favoriteUid;if(!uid)return null;
 return [...list(s?.team),...list(s?.box)].find(m=>m?.uid===uid)||null;
}
export function toggleFavorite(s,uid){return {...s,favoriteUid:s?.favoriteUid===uid?null:uid}}
