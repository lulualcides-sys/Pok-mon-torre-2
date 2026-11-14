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

/* New title has no training tile, although the native selection scene
 * retains its training mode internally. Avoid adding an unapproved Johto lab
 * button to the public menu or removing the current LOCAL button.
 */
export function acceptRemovedTrainingTile(source,alpha){
 if(alpha!=='0.71.3')return false;
 if(typeof source!=='string'||
  !source.includes('jugar:[{id:"kanto",txt:"KANTO CAMPAIGN"')||
  !source.includes('{id:"cpu",txt:"LOCAL",escena:"seleccion"')||
  !source.includes('{id:"arena",txt:"ARENA"')||
  source.includes('{id:"entreno",txt:"TRAINING"')||
  source.includes('{id:"johto-lab",txt:"MEWTWO TEST LAB"'))
  throw Error('Unrecognized official Alpha 0.71.3 TRAINING tile removal');
 return true;
}
