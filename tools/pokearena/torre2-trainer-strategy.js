/* Torre 2 real-time adaptation, not a claim of original FRLG trainer AI.
 * Decisions use the visible opponent's types, our own HP and known moves.
 * No input queue, future commands, HP edits or extra attacks are consulted.
 */
export function createTrainerStrategy(enabled=false){
 return {enabled,nextCheck:8,nextSwitch:8,switches:0};
}
export function chooseTrainerSwitch(state,{time,activeIndex,members,opponentTypes,blocked=false},effectiveness){
 if(!state.enabled||blocked||!Number.isFinite(time)||time<state.nextCheck||time<state.nextSwitch||state.switches>=3)return -1;
 state.nextCheck=time+4;
 const active=members[activeIndex];
 if(!active||active.hp<=0)return -1;
 const rating=m=>{
  const offense=Math.max(0,...Object.values(m.loadout||{}).filter(h=>h&&!h.pendiente&&h.dano>0).map(h=>effectiveness(h.tipo,opponentTypes)));
  const threat=Math.max(1,...opponentTypes.map(t=>effectiveness(t,m.types)));
  return {offense,threat,score:offense/threat+Math.min(1,m.hp/100)*.35};
 };
 const current=rating(active);
 if(active.hp>25&&current.threat<2&&current.offense>.5)return -1;
 let best=-1,bestScore=current.score;
 for(let i=0;i<members.length;i++){
  const candidate=members[i];if(i===activeIndex||!candidate||candidate.hp<=25)continue;
  const r=rating(candidate);
  const safer=r.threat<current.threat&&r.offense>=1;
  const useful=current.offense<=.5&&r.offense>=1&&r.threat<=current.threat;
  const preserve=active.hp<=25&&candidate.hp>=50&&r.threat<=current.threat&&r.offense>=1;
  if((safer||useful||preserve)&&r.score>bestScore+.25){best=i;bestScore=r.score;}
 }
 if(best>=0){state.switches++;state.nextSwitch=time+20;state.nextCheck=time+20;}
 return best;
}
