/* Torre 2 real-time adaptation, not a claim of original FRLG trainer AI.
 * Decisions use the visible opponent's types, our own HP and known moves.
 * No input queue, future commands, HP edits or extra attacks are consulted.
 */
export function createTrainerStrategy(enabled=false,{gymLeader=false}={}){
 const gym=Boolean(enabled&&gymLeader);
 return {enabled,gymLeader:gym,nextCheck:gym?5:8,nextSwitch:gym?5:8,switches:0};
}
export function chooseTrainerSwitch(state,{time,activeIndex,members,opponentTypes,blocked=false},effectiveness){
 if(!state.enabled||blocked||!Number.isFinite(time)||time<state.nextCheck||time<state.nextSwitch||state.switches>=3)return -1;
 state.nextCheck=time+(state.gymLeader?3:4);
 const active=members[activeIndex];
 if(!active||active.hp<=0)return -1;
 const rating=m=>{
  const offense=Math.max(0,...Object.values(m.loadout||{}).filter(h=>h&&!h.pendiente&&h.dano>0).map(h=>effectiveness(h.tipo,opponentTypes)));
  const threat=Math.max(1,...opponentTypes.map(t=>effectiveness(t,m.types)));
  return {offense,threat,score:offense/threat+Math.min(1,m.hp/100)*.35};
 };
 const current=rating(active);
 if(active.hp>25&&current.threat<(state.gymLeader?1.5:2)&&
    current.offense>(state.gymLeader?.8:.5))return -1;
 let best=-1,bestScore=current.score;
 for(let i=0;i<members.length;i++){
  const candidate=members[i];if(i===activeIndex||!candidate||candidate.hp<=25)continue;
  const r=rating(candidate);
  const safer=r.threat<current.threat&&r.offense>=1;
  const useful=current.offense<=.5&&r.offense>=1&&r.threat<=current.threat;
  const preserve=active.hp<=25&&candidate.hp>=50&&r.threat<=current.threat&&r.offense>=1;
  if((safer||useful||preserve)&&r.score>bestScore+(state.gymLeader?.16:.25)){best=i;bestScore=r.score;}
 }
 if(best>=0){state.switches++;
  const cooldown=state.gymLeader?16:20;
  state.nextSwitch=time+cooldown;state.nextCheck=time+cooldown;
 }
 return best;
}


// Only eight Kanto Gym bosses: fill *ready* native basic attack gaps. No
// extra hit, damage/HP bonus, cooldown bypass or interference with dodges.
export function pressureGymLeaderInput(scene,actor,foe,input,state){
 if(!scene?.datos?.torre2?.party?.gymLeader||scene.fase!=='lucha'||
    !actor||!foe||!input||typeof input!=='object'||actor.hp<=0||foe.hp<=0||
    input.lmb||input.rmb||input.q||input.e||input.esp||input.mega||
    actor.ko||foe.ko||actor.accion||actor.dash||actor.est?.aturdido||
    actor.est?.dormido||actor.est?.congelado||actor.est?.recarga)return input;
 const dx=foe.x-actor.x,dy=foe.y-actor.y,d=Math.hypot(dx,dy);
 const move=actor.kit?.lmb,reach=Number(move?.alcance??move?.largo??0);
 if(!Number.isFinite(d)||d<1||!Number.isFinite(reach)||reach<=0)return input;
 const life=actor.hpMax>0?actor.hp/actor.hpMax:1;
 if(life<.4)return input;
 if(Array.isArray(scene.efectos)&&scene.efectos.some(f=>f?.vivo&&
   f?.dueno===foe&&Number.isFinite(f.x)&&Number.isFinite(f.y)&&
   Math.hypot(f.x-actor.x,f.y-actor.y)<95))return input;
 let result=input;
 const ux=dx/d,uy=dy/d,mx=Number(input.mx)||0,my=Number(input.my)||0;
 const mag=Math.hypot(mx,my);
 if(life>=.6&&d>Math.max(90,Math.min(185,reach*.85))){
  const forward=mag>.1?(mx*ux+my*uy)/mag:0;
  if(mag<.1)result={...input,mx:ux*.70,my:uy*.70};
  else if(forward>=-.05&&forward<.35){
   const x=.55*ux+.45*mx/mag,y=.55*uy+.45*my/mag,n=Math.hypot(x,y)||1;
   result={...input,mx:x/n,my:y/n};
  }
 }
 if(d>reach*.82||move?.pendiente||!(Number(actor.cd?.lmb)<=0)||
   !Number.isFinite(actor.energia)||actor.energia<Number(move.coste||0)||
   Number(actor.calor||0)>=75||
   (Number.isFinite(scene.t)&&scene.t<(state?.nextBasicAt??0))||
   foe.est?.contra||foe.est?.disfraz||
   (foe.est?.invul?.hasta??0)>(actor.t??0))return result;
 if(state&&Number.isFinite(scene.t))state.nextBasicAt=scene.t+1.2;
 return {...result,lmb:true,ax:foe.x,ay:foe.y};
}
