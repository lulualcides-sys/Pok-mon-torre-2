/** Native 0.71.3 Pokédex uses the same five read-only role captions
 * approved for Torre 2: do not alter Pokémon kits or battle controls.
 */
export function labelModernPokedexRoles(source,alpha){
 if(alpha!=='0.71.3')return source;
 if(typeof source!=='string'||!source.includes('movimientos(c,p,et,tam){')||
    !source.includes('const COLS=5;const CEL=44;const PAGE_SIZE=COLS*5;'))
  throw Error('Unknown paginated Alpha 0.71.3 Pokedex role renderer');
 for(const [from,to] of [
  ['const BOTON_TACTIL={lmb:"BASIC",rmb:"SKILL",esp:"DASH",q:"Q",e:"ULT"};',
   'const BOTON_TACTIL={lmb:"ATK",rmb:"HAB 2",esp:"ESQUIVA",q:"HAB 3",e:"ULT"};'],
  ['esTactil()?BOTON_TACTIL[slot]:tecla','BOTON_TACTIL[slot]']
 ]){
  if(source.split(from).length!==2)throw Error('Unrecognized native Pokedex role label: '+from.slice(0,48));
  source=source.replace(from,to);
 }
 return source;
}
