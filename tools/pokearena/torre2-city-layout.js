/* Presentation-only data. Never mutate campaign state or award progress. */
export const CERULEAN_LANDMARKS=Object.freeze([
 Object.freeze({id:'center',label:'CENTRO POKÉMON',x:123,y:155,doorY:128}),
 Object.freeze({id:'mart',label:'POKÉ MART',x:103,y:257,doorY:230}),
 Object.freeze({id:'gym',label:'GINÁSIO DA MISTY',x:515,y:173,doorY:134})
]);
const PLACES=[[193,164],[277,153],[280,200],[242,229],[132,278],
 [63,178],[435,202],[577,210],[606,251],[467,249],
 [216,109],[300,88],[449,104],[575,106],[365,137]];
export function cityViewModel(state,trainerCount){
 const count=Math.max(0,Math.floor(Number(trainerCount)||0));
 const done=Math.max(0,Math.min(count,Math.floor(Number(state.trainer)||0)));
 return {done,count,remaining:count-done,gymReady:done===count&&!state.champion,
  trainers:Array.from({length:count},(_,i)=>({index:i,
   x:PLACES[i%PLACES.length][0],y:PLACES[i%PLACES.length][1],
   status:i<done?'defeated':i===done?'current':'locked'}))};
}
