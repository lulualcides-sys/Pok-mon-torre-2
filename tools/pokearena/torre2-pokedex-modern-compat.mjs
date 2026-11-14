/* Alpha 0.71.3 already uses a responsive Pokédex and shows alternate-form
 * moves. Preserve that official implementation; never inject the old grid.
 */
export function preserveModernPokedex(source,alpha){
 if(alpha!=='0.71.3')return false;
 if(typeof source!=='string'||
   !source.includes('const COLS=(()=>{for(let c=5;c<12;c++)')||
   !source.includes('trioMenu')||
   !source.includes('const out=slot==="e"?["ULT"]:[];'))
  throw Error('Unrecognized modern Pokedex; refusing unsafe legacy patch');
 return true;
}
