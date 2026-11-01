/* Presentation-only data. Never mutate campaign state or award progress. */
export const CERULEAN_LANDMARKS=Object.freeze([
 Object.freeze({id:'center',label:'CENTRO POKÉMON',x:123,y:155,doorY:128}),
 Object.freeze({id:'mart',label:'POKÉ MART',x:103,y:257,doorY:230}),
 Object.freeze({id:'gym',label:'GINÁSIO DA MISTY',x:515,y:173,doorY:134})
]);
// Cerulean is a civilian hub: the existing 11 route encounters and 4 gym
// intermediates are displayed in their own scenes, never duplicated here.
export const CERULEAN_CIVILIANS=Object.freeze([
 Object.freeze({kind:'lass',x:166,y:238}),
 Object.freeze({kind:'youngster',x:485,y:258})
]);
const GYM_INTERMEDIATES=4;
export function cityViewModel(state,trainerCount){
 const count=Math.max(0,Math.floor(Number(trainerCount)||0));
 const done=Math.max(0,Math.min(count,Math.floor(Number(state.trainer)||0)));
 const routeCount=Math.max(0,count-GYM_INTERMEDIATES);
 const routeDone=Math.min(done,routeCount),gymDone=done-routeDone;
 return {done,count,remaining:count-done,gymReady:done===count&&!state.champion,
  routeCount,routeDone,routeRemaining:routeCount-routeDone,
  gymCount:count-routeCount,gymDone,gymRemaining:count-routeCount-gymDone,
  trainers:[]};
}
