/* T73 — Pure classification of completed Kanto battle markers.
 * No save mutation. Never reinterpret a stale wild or unknown event as
 * a story trainer win (and therefore never grant an unearned badge).
 */
export function classifyCampaignBattleResult(state,marker,{rematchValid=false}={}){
 if(!state||!marker||typeof marker!=='object')return null;
 if(!Number.isInteger(state.stage)||state.stage<0||
    !Number.isInteger(state.trainer)||state.trainer<0)return null;
 if(marker.kind==='rematch')
  return rematchValid===true&&marker.ticket&&typeof marker.ticket==='object'?
   'rematch':null;
 if(marker.stage!==state.stage||marker.trainer!==state.trainer)return null;
 if(marker.kind==='trainer')
  return state.champion===true?null:'trainer';
 if(marker.kind!=='wild')return null;
 const wild=state.pendingWild;
 // A new encounter can have the SAME species at the SAME trainer stage.
 // Reuse the already persisted encounter counter: no new save schema.
 // Refuse legacy/unknown counters rather than risking an unearned victory.
 return wild&&wild.stage===state.stage&&
  typeof marker.id==='string'&&marker.id.length>0&&
  marker.id===wild.id&&
  Number.isSafeInteger(marker.encounterCounter)&&
  marker.encounterCounter>0&&
  marker.encounterCounter===state.wildEncountersStage?
  'wild':null;
}
