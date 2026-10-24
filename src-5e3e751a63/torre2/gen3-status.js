/* Torre 2 action window = 4 simulated seconds; paused transitions do not tick.
 * Native est is the single source of truth and still drives approved visuals.
 * Gen III poison/burn residual = 1/8 max HP; Toxic starts at 1/16.
 */
export const STATUS_WINDOW=4;
const aliases={veneno:'veneno',toxic:'veneno',quema:'quemado',quemado:'quemado',dormido:'dormido',paralizado:'paralizado',congelado:'congelado',confuso:'confuso'};
export const MAIN_STATUS_KEYS=Object.freeze(['veneno','quemado','dormido','paralizado','congelado']);
export function statusLabel(actor){
 const map={veneno:'PSN',quemado:'BRN',dormido:'SLP',paralizado:'PAR',congelado:'FRZ'};
 return MAIN_STATUS_KEYS.map(k=>actor.est?.[k]?map[k]:'').filter(Boolean).join(' ');
}
export function applyGen3Status(actor,name,data={},random=Math.random){
 const key=aliases[name];if(!key)return false;
 const est=actor.est??={};const types=actor.tipos||[];
 if(actor.ko||actor.hp<=0)return true;
 if(key!=='confuso'&&MAIN_STATUS_KEYS.some(k=>est[k]))return true;
 if(est[key])return true;
 if(key==='veneno'&&types.some(t=>t==='POISON'||t==='STEEL'))return true;
 if(key==='quemado'&&types.includes('FIRE'))return true;
 if(key==='congelado'&&(types.includes('ICE')||actor.escena?.__torre2Weather?.kind==='sun'))return true;
 const bounded=()=>Math.min(.999999,Math.max(0,random()));
 est[key]={torre2Status:true,hasta:Infinity,elapsed:0,actionAt:-Infinity,blocked:false,
  toxic:name==='toxic'||data.toxic===true,toxicStage:1,
  turns:key==='dormido'?2+Math.floor(bounded()*4):key==='confuso'?2+Math.floor(bounded()*4):null,
  cura:0,dps:0,fuente:data.fuente};
 if(key==='dormido'||key==='congelado'){actor.cortarAccion?.();actor.accion=null;actor.dash=null;}
 return true;
}
function residual(actor,amount){
 if(!(amount>0)||actor.hp<=0||actor.ko)return;
 actor.hp=Math.max(actor.inmortal?1:0,actor.hp-Math.max(1,Math.floor(amount)));
 if(actor.hp<=0){actor.ko=true;actor.escena?.alKO?.(actor);}
}
export function tickGen3Status(actor,dt,random=Math.random){
 if(actor.ko||actor.hp<=0)return;
 for(const key of MAIN_STATUS_KEYS){
  const s=actor.est?.[key];if(!s?.torre2Status)continue;
  s.elapsed+=Math.max(0,Number(dt)||0);
  while(s.elapsed>=STATUS_WINDOW&&actor.hp>0){
   s.elapsed-=STATUS_WINDOW;
   if(key==='veneno')residual(actor,actor.hpMax*(s.toxic?s.toxicStage++/16:1/8));
   if(key==='quemado')residual(actor,actor.hpMax/8);
   if(key==='dormido'&&--s.turns<=0){delete actor.est[key];break;}
   if(key==='congelado'&&random()<.2){delete actor.est[key];break;}
  }
 }
}
export function gen3StatusInput(actor,input,random=Math.random){
 if(!input)return input;
 const est=actor.est||{},now=actor.t||0;
 if(est.dormido?.torre2Status||est.congelado?.torre2Status)return null;
 const requested=['lmb','rmb','q','e'].some(k=>input[k]&&(actor.cd?.[k]||0)<=0);
 let blocked=false;
 for(const key of ['paralizado','confuso']){
  const s=est[key];if(!s?.torre2Status||!requested)continue;
  if(now>=s.actionAt){
   s.actionAt=now+STATUS_WINDOW;
   if(key==='confuso'&&--s.turns<=0){delete est.confuso;continue;}
   s.blocked=random()<(key==='paralizado'?.25:.5);
   if(s.blocked&&key==='confuso'){
    const level=actor.escena?.datos?.torre2?.[actor.lado===0?'playerLevel':'enemyLevel']||30;
    residual(actor,Math.floor((Math.floor(2*level/5)+2)*40*(actor.atk||1)/Math.max(.01,actor.defensa||1)/50)+2);
   }
  }
  blocked ||= s.blocked;
 }
 const result={...input};
 if(est.paralizado?.torre2Status){result.mx=(result.mx||0)*.25;result.my=(result.my||0)*.25;}
 if(blocked||actor.ko)for(const k of ['lmb','rmb','q','e'])result[k]=false;
 return result;
}
export function serializeGen3Status(actor){
 for(const key of MAIN_STATUS_KEYS){const s=actor.est?.[key];if(s?.torre2Status)return {kind:key,toxic:s.toxic,turns:s.turns,elapsed:s.elapsed};}
 return null;
}
export function restoreGen3Status(actor,saved){
 if(!saved?.kind||!MAIN_STATUS_KEYS.includes(saved.kind)||actor.hp<=0)return;
 applyGen3Status(actor,saved.toxic?'toxic':saved.kind);
 const s=actor.est[saved.kind];if(!s)return;
 if(Number.isFinite(saved.turns))s.turns=Math.max(1,saved.turns);
 s.elapsed=Math.max(0,Math.min(STATUS_WINDOW,Number(saved.elapsed)||0));
}
