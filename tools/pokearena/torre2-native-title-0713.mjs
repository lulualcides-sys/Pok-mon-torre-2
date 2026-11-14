/* Alpha 0.71.3 removed the "2 PLAYERS" entry and retains LOCAL
 * with id "cpu". Never delete or alter LOCAL to satisfy a stale patch.
 * Fail closed on unknown menus or accidentally still-active versus.
 */
export function acceptRemovedVersusEntry(source,alpha){
 if(alpha!=='0.71.3')return false;
 if(typeof source!=='string' ||
    !source.includes('jugar:[{id:"liga",txt:"LEAGUE"') ||
    !source.includes('{id:"cpu",txt:"LOCAL",escena:"seleccion"') ||
    !source.includes('{id:"arena",txt:"ARENA"') ||
    source.includes('{id:"versus",') ||
    source.includes('txt:"2 PLAYERS"'))
  throw Error('Unrecognized official Alpha 0.71.3 local menu');
 return true;
}
