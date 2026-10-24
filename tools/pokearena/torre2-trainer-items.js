/* Explicit Torre 2 inventories: modest early leaders, bounded late healing.
 * Item HP values follow Gen III; quantities/timing are real-time adaptations.
 */
export const TRAINER_ITEM_RULES=Object.freeze({
 potion:{name:'POTION',heal:20},superpotion:{name:'SUPER POTION',heal:50},
 hyperpotion:{name:'HYPER POTION',heal:200},fullrestore:{name:'FULL RESTORE',heal:Infinity,cure:true}
});
export function trainerInventory(stage,leader,trainer=0,wild=false){
 if(wild)return {};
 if(!leader)return stage>0&&trainer%6===5?{potion:1}:{};
 if(stage===0)return {potion:1};
 if(stage<3)return {superpotion:stage===1?1:2};
 if(stage<8)return {hyperpotion:stage===3?1:2};
 return {fullrestore:stage===12?3:2};
}
export function createTrainerItems(inventory){return {inventory:{...inventory},nextAt:0,pending:null,uses:0};}
export function trainerItemStep(state,actor,identity,time){
 if(state.pending){
  const pending=state.pending;
  if(pending.identity!==identity||actor.hp<=0||actor.ko){state.pending=null;return {kind:'cancelled'};}
  if(time<pending.until)return null;
  const item=TRAINER_ITEM_RULES[pending.item];const before=actor.hp;
  actor.hp=Math.min(actor.hpMax,actor.hp+item.heal);
  if(item.cure){
   for(const key of ['dormido','congelado','paralizado','veneno','quema','quemado','confuso'])delete actor.est[key];
   actor.spr?.clearTint?.();actor.spr?.anims?.resume?.();
  }
  state.pending=null;
  return {kind:'healed',item:pending.item,hp:actor.hp-before};
 }
 if(time<state.nextAt||actor.hp<=0||actor.ko||!Number.isFinite(actor.hpMax)||actor.hp/actor.hpMax>.25||actor.accion||actor.dash)return null;
 const item=Object.keys(TRAINER_ITEM_RULES).find(key=>state.inventory[key]>0);
 if(!item)return null;
 state.inventory[item]--;state.uses++;state.nextAt=time+20;
 state.pending={item,identity,until:time+1.2};
 return {kind:'started',item};
}
