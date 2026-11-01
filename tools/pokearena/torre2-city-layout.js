/* Presentation-only data. Never mutate campaign state or award progress. */
export const CERULEAN_LANDMARKS=Object.freeze([
 Object.freeze({id:'center',label:'CENTRO POKÉMON',x:123,y:155,doorY:128}),
 Object.freeze({id:'mart',label:'POKÉ MART',x:103,y:257,doorY:230}),
 Object.freeze({id:'gym',label:'GINÁSIO DA MISTY',x:515,y:173,doorY:134})
]);
export function cityViewModel(state,trainerCount){
 const count=Math.max(0,Math.floor(Number(trainerCount)||0));
 const done=Math.max(0,Math.min(count,Math.floor(Number(state.trainer)||0)));
 // The city shows progress in its HUD, never combatant sprites/hitboxes.
 // Route/gym owners retain the exact existing encounter count and identities.
 return {done,count,remaining:count-done,gymReady:done===count&&!state.champion,
  trainers:[]};
}
