/* Pokémon Torre 2 — Pokédex filters (owner list 2026-11-20, item 22).
 * Pure: takes the full Kanto Pokédex model rows (collection-ui) and keeps the
 * ones that match: caught / seen / missing, one type, and one route (the
 * campaign stage whose tall grass has the species). Page size unchanged.
 */
export const DEX_SHOW=Object.freeze(['all','caught','seen','missing']);
export const DEX_SHOW_LABEL=Object.freeze({all:'Todos',caught:'Capturados',seen:'Vistos',missing:'Faltando'});
export const DEX_TYPES=Object.freeze(['NORMAL','FIRE','WATER','GRASS','ELECTRIC','ICE','FIGHTING','POISON','GROUND',
 'FLYING','PSYCHIC','BUG','ROCK','GHOST','DRAGON','STEEL','FAIRY']);
export const TYPE_LABEL=Object.freeze({NORMAL:'Normal',FIRE:'Fogo',WATER:'Água',GRASS:'Planta',ELECTRIC:'Elétrico',ICE:'Gelo',
 FIGHTING:'Lutador',POISON:'Veneno',GROUND:'Terra',FLYING:'Voador',PSYCHIC:'Psíquico',BUG:'Inseto',ROCK:'Pedra',
 GHOST:'Fantasma',DRAGON:'Dragão',STEEL:'Aço',FAIRY:'Fada'});
export function cycle(listOfValues,current,step=1){
 const i=listOfValues.indexOf(current);
 return listOfValues[((i<0?0:i)+step+listOfValues.length)%listOfValues.length];
}
// rows: every Pokédex row ({id,seen,caught,...}); typesOf(id) → types;
// routesOf(id) → stages where it lives in tall grass.
export function filterDexRows(rows,{show='all',type=null,route=null}={},typesOf=()=>[],routesOf=()=>[]){
 return (Array.isArray(rows)?rows:[]).filter(r=>
  (show==='all'||show==='caught'&&r.caught||show==='seen'&&r.seen&&!r.caught||show==='missing'&&!r.caught)&&
  (!type||(typesOf(r.id)||[]).includes(type))&&
  (route===null||route===undefined||(routesOf(r.id)||[]).includes(route)));
}
export function paginate(rows,page,size){
 const pages=Math.max(1,Math.ceil(rows.length/size));
 const p=Math.max(0,Math.min(pages-1,Math.floor(Number(page)||0)));
 return {page:p,pages,rows:rows.slice(p*size,(p+1)*size)};
}
