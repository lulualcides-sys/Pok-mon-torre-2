// VS Seeker adaptation: three completed non-rematch victories per charge.
export const REMATCH_ACTIVITIES=3;
export function rematchState(state){
 const r=state.rematches??={charge:0,sequence:0,wins:0,pending:null};
 r.charge=Math.max(0,Math.min(3,Math.floor(Number(r.charge)||0)));
 r.sequence=Math.max(0,Math.floor(Number(r.sequence)||0));return r;
}
export function rechargeRematches(state){const r=rematchState(state);r.charge=Math.min(REMATCH_ACTIVITIES,r.charge+1);}
export function reserveRematch(state,index,mapStage=state.stage){
 const r=rematchState(state);
 // An interrupted battle keeps its durable ticket. Winning three other
 // fights can refill the VS Seeker, but must not silently replace the
 // pending rematch and invalidate the original battle's result.
 if(r.pending||r.charge<REMATCH_ACTIVITIES)return null;
 r.charge=0;r.sequence++;
 // mapStage identifies the defeated trainer's area. progressStage/progress
 // identify the live journey; the ticket cannot advance the main campaign.
 r.pending={token:r.sequence,stage:mapStage,trainer:index,
  progressStage:state.stage,progress:state.trainer};
 return {...r.pending};
}
export function validRematchResult(state,ticket){
 const p=state.rematches?.pending;
 return !!p&&p.token===ticket?.token&&p.stage===ticket.stage&&p.trainer===ticket.trainer&&state.stage===(p.progressStage??p.stage)&&state.trainer===p.progress;
}
export function consumeRematchResult(state,ticket){
 if(!validRematchResult(state,ticket))return false;
 state.rematches.pending=null;return true;
}
