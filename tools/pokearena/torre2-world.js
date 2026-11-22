/* Pokémon Torre 2 — world touches (owner 2026-11-22, list items 18, 26, 28).
 * Campaign only:
 *  - Dia e noite (18): the device clock gives morning/afternoon/evening/night.
 *    At night some Pokémon only appear then (Gastly, Haunter) and others are
 *    twice as common (Zubat, Oddish, Meowth, Drowzee, Clefairy...); battle
 *    arenas get darker (evening: warm, night: blue) under the fighters.
 *  - Pokémon favorito (26): one Pokémon of the team stands beside the
 *    trainer on the Trainer Card, like a gym leader with his ace.
 *  - Formas raras (28): 0,01% of wild Pokémon appear in a rare colour form
 *    (Dourada, Cristal, Sombra). Torre 2's own WebGL colour filter over the
 *    ORIGINAL sprite; purely cosmetic (no stats), kept after capture.
 *    The native client's skins (account/store unlocks) are never used.
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
// --- 28. Formas raras --------------------------------------------------------
export const RARE_FORM_CHANCE=.0001; // 0,01%
export const RARE_FORMS=Object.freeze({
 dourada:{name:'Forma Dourada',color:'#ffd23f'},
 cristal:{name:'Forma Cristal',color:'#8ff0ff'},
 sombra:{name:'Forma Sombra',color:'#c9a0ff'}
});
export function rollRareForm(random=Math.random){
 const r=Number(random());
 if(!(Number.isFinite(r)&&r>=0&&r<RARE_FORM_CHANCE))return null;
 const keys=Object.keys(RARE_FORMS);
 return keys[Math.min(keys.length-1,Math.floor(Number(random())*keys.length)||0)];
}
export const rareFormOf=m=>RARE_FORMS[m?.form]?m.form:null;
// WebGL colour filter on an existing sprite (Phaser 3.60+ preFX).
export function applyRareForm(sprite,form){
 if(!sprite||!RARE_FORMS[form]||sprite.__torre2Form===form)return false;
 const fx=sprite.preFX;if(!fx?.addColorMatrix)return false;
 try{
  if(sprite.__torre2FormFx)fx.remove(sprite.__torre2FormFx);
  const cm=fx.addColorMatrix();
  // Gold: luminance mapped to warm gold tones (offsets are 0-255 in Phaser).
  if(form==='dourada'){const l=[.299,.587,.114];cm.set([...l.map(v=>v*1.2),0,28,...l.map(v=>v*.95),0,16,...l.map(v=>v*.28),0,0,0,0,0,1,0])}
  else if(form==='cristal'){cm.hue(170);cm.brightness(1.25,true);cm.saturate(.4,true)}
  else if(form==='sombra'){cm.night(.6);cm.hue(250,true);cm.contrast(.25,true)}
  sprite.__torre2FormFx=cm;sprite.__torre2Form=form;return true;
 }catch{return false}
}
