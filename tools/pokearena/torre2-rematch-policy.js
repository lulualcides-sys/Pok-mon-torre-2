// VS Seeker adaptation: three completed non-rematch victories per charge.
export const REMATCH_ACTIVITIES=3;
export function rematchState(state){
 const r=state.rematches??={charge:0,sequence:0,wins:0,pending:null};
 r.charge=Math.max(0,Math.min(3,Math.floor(Number(r.charge)||0)));
 r.sequence=Math.max(0,Math.floor(Number(r.sequence)||0));return r;
}
export function rechargeRematches(state){const r=rematchState(state);r.charge=Math.min(REMATCH_ACTIVITIES,r.charge+1);}
export function reserveRematch(state,index){
 const r=rematchState(state);if(r.charge<REMATCH_ACTIVITIES)return null;
 r.charge=0;r.sequence++;r.pending={token:r.sequence,stage:state.stage,trainer:index,progress:state.trainer};return {...r.pending};
}
export function validRematchResult(state,ticket){
 const p=state.rematches?.pending;
 return !!p&&p.token===ticket?.token&&p.stage===ticket.stage&&p.trainer===ticket.trainer&&state.stage===p.stage&&state.trainer===p.progress;
}
export function consumeRematchResult(state,ticket){
 if(!validRematchResult(state,ticket))return false;
 state.rematches.pending=null;return true;
}
