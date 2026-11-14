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

/* The original Alpha 0.71.3 title no longer lists TRAINING, so the
 * legacy button to insert the optional Mewtwo lab is intentionally absent.
 * Without seven buttons, fitting the legacy geometry would compress the
 * native menu unnecessarily and fail with a fake missing-button error.
 */
export function fitJohtoLabTitleMenu(source,alpha) {
 if(typeof source!=='string')throw TypeError('Invalid title scene source');
 const lab='{id:"johto-lab",txt:"MEWTWO TEST LAB"';
 if(!source.includes(lab)){
  if(alpha!=='0.71.3')throw Error('Missing Johto Lab entry for legacy menu');
  acceptRemovedTrainingTile(source,alpha);
  return {source,labIncluded:false};
 }
 const fitted='jugar:{y:104+BAJA,paso:26,alto:25}';
 const originals=['jugar:{y:110+BAJA,paso:PASO}',
  'jugar:{y:114+BAJA,paso:PASO}'];
 if(source.includes(fitted)){
  if(source.split(fitted).length!==2)throw Error('Ambiguous already-fitted Johto Lab layout');
  return {source,labIncluded:true};
 }
 const matches=originals.filter(x=>source.split(x).length===2);
 if(matches.length!==1)throw Error('Unrecognized legacy seven-button PLAY geometry');
 return {source:source.replace(matches[0],fitted),labIncluded:true};
}
