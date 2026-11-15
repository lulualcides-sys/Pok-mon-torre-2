/* Kanto-only team preload for Alpha 0.71.3.
 * Preserve native grouped-team and Lake trio logic verbatim.
 * Do not replace the current client's team/equipment selection with an
 * obsolete 0.65.8 expression.
 */
const NATIVE="const dexs=formasDe(d.jugadores?d.jugadores.flatMap(j=>j.lista??[j.id]):d.equipos?d.equipos.flat():[d.p1,d.p2],d.jugadores?d.jugadores.flatMap(j=>j.listaAsp??(j.lista?j.lista.map(()=>null):[j.aspecto])):d.equipos?d.aspectosEq?.flat()??[]:d.aspectos);";
const BRIDGE='const dexs=d.torre2?.party?new Set([...d.torre2.party.friend,...d.torre2.party.foes].map(m=>m.id).map(id=>{const found=buscar(id);return found?.etapa?found.def.evoluciones[found.etapa-1]?.dex??found.def.dex:found?.def?.dex}).filter(Boolean)):'+NATIVE.slice('const dexs='.length);
export function adaptModernCombatPreload(source,alpha){
 if(alpha!=='0.71.3')return null;
 if(typeof source!=='string'||!source.includes('import{REGLAS,buscar,')||
  !source.includes('soltarPMD(this,m,dexs);const formas=soloFormas(m,dexs);'))
  throw Error('Unrecognized modern native combat module');
 if(source.includes(BRIDGE))return source;
 if(source.split(NATIVE).length!==2)throw Error('New native combat preload is absent or ambiguous');
 return source.replace(NATIVE,BRIDGE);
}
