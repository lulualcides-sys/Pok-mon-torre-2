/* Alpha 0.71.3 already uses a responsive Pokédex and shows alternate-form
 * moves. Preserve that official implementation; never inject the old grid.
 */
export function preserveModernPokedex(source,alpha){
 if(alpha!=='0.71.3')return false;
 const nativeGrid=typeof source==='string'&&
   source.includes('const COLS=(()=>{for(let c=5;c<12;c++)');
 const approvedPaged=typeof source==='string'&&
   source.includes('const COLS=5;const CEL=44;const PAGE_SIZE=COLS*5;')&&
   source.includes('this.actualizarPaginaDex();this.controlesPaginaDex();')&&
   source.includes('c.zone.disableInteractive()')&&
   source.includes('casilla(p,x,y,i){const {g,img}=casillaRetrato');
 if(!(nativeGrid||approvedPaged)||
   !source.includes('trioMenu')||
   !source.includes('const out=slot==="e"?["ULT"]:[];'))
  throw Error('Unrecognized modern Pokedex; refusing unsafe legacy patch');
 return true;
}
