/* Pokémon Torre 2 — battle-only consumables. Native Phaser UI, no CSS.
 * The persisted Kanto save remains the inventory authority; the active
 * fighter supplies live HP/status so heal items cannot erase combat damage.
 * Captures, TMs, revives, trainer-owned Pokémon and other modes are excluded.
 */
import {MART_ITEMS} from './route-data.js';
import {readCampaign,saveCampaign} from './campaign-core.js';
import {serializeGen3Status,MAIN_STATUS_KEYS} from './gen3-status.js';

export const BATTLE_BAG_ITEMS=Object.freeze([
 'potion','superpotion','antidote','paralyzeheal',
 'awakening','burnheal','iceheal','fullheal'
]);
const clamp=v=>Math.max(0,Math.min(100,Number(v)||0));
const format=id=>String(id||'').replace(/[-_]/g,' ').toUpperCase();
const catalog=new Map(MART_ITEMS.filter(i=>BATTLE_BAG_ITEMS.includes(i.id)).map(i=>[i.id,i]));
// Mutates state only on a VALID item use. Call saveCampaign after success;
// this pure transaction can be tested independently of Phaser.
export function applyBattleBagItem(state,party,itemId,target,live=null){
 const item=catalog.get(itemId),member=party?.friend?.[target],saved=state?.team?.[target];
 if(!item||!member||!saved||member.uid!==saved.uid||member.id!==saved.id)
  return {ok:false,reason:'Equipe alterada. Retorne ao mapa.'};
 if(!Number.isInteger(target)||target<0||target>=6)
  return {ok:false,reason:'Escolha um Pokémon da sua equipe.'};
 if(!Number.isInteger(state.inventory?.[itemId])||state.inventory[itemId]<=0)
  return {ok:false,reason:'Item esgotado.'};
 const active=target===party.playerIndex;
 const hp=clamp(active&&live?live.hp:member.hp);
 const status=active&&live?live.status??null:member.status??null;
 const confused=active&&live?!!live.confused:!!saved.confusion;
 if(!(hp>0))return {ok:false,reason:'Não é possível usar em Pokémon desmaiado.'};
 let after=hp,clearStatus=false,clearConfusion=false;
 if(item.kind==='heal'){
  if(hp>=100)return {ok:false,reason:'Este Pokémon já está saudável.'};
  after=Math.min(100,hp+item.heal);
 }else if(item.kind==='status'){
  clearStatus=!!status?.kind&&item.cures.includes(status.kind);
  clearConfusion=!!item.cureConfusion&&confused;
  if(!clearStatus&&!clearConfusion)
   return {ok:false,reason:'Este remédio não terá efeito.'};
 }else return {ok:false,reason:'Item indisponível em combate.'};
 state.inventory[itemId]--;
 member.hp=after;saved.hp=after;
 if(clearStatus){member.status=null;saved.status=null}
 if(clearConfusion)saved.confusion=null;
 state.lastMessage=item.name+' usado em '+member.id.toUpperCase()+'.';
 return {ok:true,item:itemId,name:item.name,target,fromHp:hp,toHp:after,
  clearStatus:clearStatus?status.kind:null,clearConfusion,remaining:state.inventory[itemId]};
}


// Validate a real use against detached state and party copies FIRST.
// The previous battle UI mutated both the party and inventory, then saved;
// a QuotaExceededError could consume medicine in memory and leave the save
// unchanged. Only publish in-memory effects after BOTH save writes succeed.
// Dependencies are injected in tests; the native UI uses saveCampaign.
export function commitBattleBagItem(state,party,itemId,target,live=null,
 persist=saveCampaign){
 if(!state||!Array.isArray(state.team)||!state.inventory||
    !party||!Array.isArray(party.friend)||!Number.isInteger(target)||
    target<0||target>=6||!state.team[target]||!party.friend[target])
  return {ok:false,reason:'Equipe inválida. Retorne ao mapa.'};
 const trialState={...state,
  team:state.team.map(member=>({...member})),
  inventory:{...state.inventory}};
 const trialParty={...party,friend:party.friend.map(member=>({...member}))};
 const result=applyBattleBagItem(trialState,trialParty,itemId,target,live);
 if(!result.ok)return result;
 // If either primary or backup save fails, this throws BEFORE mutating
 // the real party, inventory, counters or live Phaser fighter.
 persist(trialState);
 Object.assign(state.inventory,trialState.inventory);
 Object.assign(state.team[target],trialState.team[target]);
 Object.assign(party.friend[target],trialParty.friend[target]);
 state.lastMessage=trialState.lastMessage;
 return result;
}

export function installBattleBag(scene,party,actor,redrawPartyHud,announce){
 if(!scene?.add||!party||!actor)return null;
 const depth=7400;
 let opened=false,target=party.playerIndex,lastUse=-Infinity,objects=[];
 let potionUses=0,committing=false;
 scene.__torre2BattleBagSaveError=false;
 // Native Phaser can pan AND zoom while the party fights. The Bag uses
 // fixed 640x360 HUD coordinates, so both scroll and zoom must be canceled
 // for graphics, labels and INPUT hitzones together. Scale compensation is
 // inverse to the live camera zoom, not an extra CSS/canvas overlay.
 const pinHud=o=>{
  o.setScrollFactor(0);
  const baseX=o.x,baseY=o.y,scaleX=o.scaleX,scaleY=o.scaleY;
  // Keep the original 640×360 HUD coordinates available for accessible
  // browser hit testing and for Phaser UI clients that read these zones.
  o.setData('torre2-bag-hud-x',baseX);
  o.setData('torre2-bag-hud-y',baseY);
  const sync=()=>{
   if(!o.active)return;
   const cam=scene.cameras.main,z=Math.max(.01,cam.zoom||1);
   const cx=cam.width/2,cy=cam.height/2;
   const sx=cam.width/640,sy=cam.height/360;
   o.setPosition(cx+(baseX*sx-cx)/z,cy+(baseY*sy-cy)/z);
   o.setScale(scaleX*sx/z,scaleY*sy/z);
  };
  scene.events.on('update',sync);
  o.once('destroy',()=>scene.events.off('update',sync));
  sync();return o;
 };
 const track=o=>{objects.push(o);return pinHud(o)};
 const clear=()=>{for(const o of objects)o.destroy();objects=[];};
 const label=(x,y,txt,size=10,color='#ebf5fa')=>
  track(scene.add.text(x,y,String(txt),{fontFamily:'Pixelify Sans,monospace',
   fontSize:size+'px',color,stroke:'#040e1e',strokeThickness:2})
   .setOrigin(.5).setDepth(depth+3));
 const button=(x,y,w,h,caption,cb,enabled=true)=>{
  const g=track(scene.add.graphics().setDepth(depth+2));
  g.fillStyle(enabled?0x21485a:0x142c3b,1);
  g.fillRoundedRect(x-w/2,y-h/2,w,h,4);
  g.lineStyle(1,enabled?0xc59f55:0x405969);
  g.strokeRoundedRect(x-w/2,y-h/2,w,h,4);
  label(x,y,caption,9,enabled?'#ffe5ac':'#8698a9');
  if(enabled){
   const zone=track(scene.add.zone(x,y,w,h).setDepth(depth+5)
    .setInteractive({useHandCursor:true}));
   zone.on('pointerdown',(_p,_x,_y,event)=>{event?.stopPropagation?.();cb()});
   return zone;
  }
  return null;
 };
 const close=()=>{
  scene.__torre2BattleBagSaveError=false;
  opened=false;
  scene.__torre2BattleBagOpen=false;
  clear();
 };
 const open=()=>{
  if(opened||scene.fase!=='lucha'||scene.__torre2Changing||
   scene.__torre2CaptureBusy||scene.__torre2BallTransitions||
   scene.t<lastUse+3)return false;
  opened=true;target=party.playerIndex;
  scene.__torre2BattleBagSaveError=false;
  scene.__torre2BattleBagOpen=true;draw();
  return true;
 };
 function draw(message=''){
  if(!opened)return;
  clear();
  track(scene.add.zone(320,180,640,360).setDepth(depth).setInteractive());
  const bg=track(scene.add.graphics().setDepth(depth+1));
  bg.fillStyle(0x061325,.95).fillRect(0,0,640,360);
  bg.fillStyle(0x142e43).fillRoundedRect(56,36,528,289,8);
  bg.lineStyle(2,0xd9b660).strokeRoundedRect(56,36,528,289,8);
  label(320,56,'BOLSA DE BATALHA',17,'#ffe2a2');
  label(320,79,'POÇÕES '+potionUses+'/3 · ESCOLHA O ITEM',10,'#d1e6f4');
  party.friend.slice(0,6).forEach((m,i)=>{
   const x=112+i*82,y=111;
   const selected=i===target,hp=clamp(i===party.playerIndex?
    actor.hp/Math.max(1,actor.hpMax)*100:m.hp);
   const tag=format(m.id).slice(0,9);
   const z=button(x,y,78,34,tag+' '+Math.round(hp)+'%',()=>{
    target=i;draw();
   },hp>0);
   z?.setData('torre2-battle-bag-target',i);
   if(selected)label(x,y-22,'▼',11,'#ffe2a2');
  });
  const state=readCampaign();
  BATTLE_BAG_ITEMS.forEach((id,index)=>{
   const item=catalog.get(id);
   const qty=state?.inventory?.[id]||0;
   const x=index%2===0?210:433,y=155+Math.floor(index/2)*34;
   const enabled=qty>0&&(item?.kind!=='heal'||potionUses<3);
   const z=button(x,y,210,29,(item?.name||format(id))+'  x'+qty,()=>use(id),enabled);
   z?.setData('torre2-battle-bag-item',id);
  });
  label(320,293,message||'AÇÕES EM TEMPO REAL PAUSADAS ENQUANTO A BOLSA ESTÁ ABERTA',
   8,message?'#ffd2ad':'#a9c4d4');
  const back=button(320,315,160,27,'◀ VOLTAR À LUTA',close);
  back?.setData('torre2-battle-bag-back',true);
 }
 function use(itemId){
  if(!opened||committing)return;
  // An encounter may have completed while input was queued. Reject stale
  // UI without consuming inventory or changing the fighter.
  if(scene.fase!=='lucha'||scene.__torre2Changing||
   scene.__torre2CaptureBusy||scene.__torre2BallTransitions){
   close();return;
  }
  if(catalog.get(itemId)?.kind==='heal'&&potionUses>=3){draw('LIMITE DE 3 POÇÕES');return}
  const save=readCampaign();
  if(!save||save.stage!==scene.datos?.torre2?.stage||
   save.trainer!==scene.datos?.torre2?.trainer){close();return;}
  const active=target===party.playerIndex;
  const live=active?{hp:clamp(actor.hp/Math.max(1,actor.hpMax)*100),
   status:serializeGen3Status(actor),confused:!!actor.est?.confuso}:null;
  committing=true;
  let result;
  try{
   result=commitBattleBagItem(save,party,itemId,target,live);
  }catch(error){
   // A refused save must not use the item or close the frozen battle UI.
   // Make the failure visible without leaking raw browser/storage details.
   scene.__torre2BattleBagSaveError=true;
   draw('FALHA AO SALVAR · ITEM PRESERVADO · TENTE NOVAMENTE');
   return;
  }finally{committing=false}
  if(!result.ok){draw(result.reason);return}
  scene.__torre2BattleBagSaveError=false;
  if(catalog.get(itemId)?.kind==='heal')potionUses++;
  if(active){
   actor.hp=Math.min(actor.hpMax,Math.max(1,actor.hpMax*result.toHp/100));
   if(result.clearStatus)delete actor.est?.[result.clearStatus];
   if(result.clearConfusion)delete actor.est?.confuso;
   scene.hud?.update?.();
  }
  redrawPartyHud?.();
  lastUse=Number(scene.t)||0;
  announce?.(result.name+' · '+format(party.friend[target].id));
  close();
 }
 // A single non-invasive button; never touches approved Arena moves.
 const handle=pinHud(scene.add.graphics().setDepth(3600));
 handle.fillStyle(0x153449,.91).fillRoundedRect(509,80,113,24,4);
 handle.lineStyle(1,0xe0bb64).strokeRoundedRect(509,80,113,24,4);
 const title=scene.add.text(565,92,'BOLSA',{
  fontFamily:'Pixelify Sans,monospace',fontSize:'11px',
  color:'#ffe2a2',stroke:'#020b17',strokeThickness:2
 }).setDepth(3602).setOrigin(.5);
 pinHud(title);
 const trigger=pinHud(scene.add.zone(565,92,113,24).setDepth(3603))
  .setInteractive({useHandCursor:true}).setData('torre2-battle-bag-open',true);
 trigger.on('pointerdown',(_p,_x,_y,event)=>{event?.stopPropagation?.();if(opened)close();else open()});
 scene.events.once('shutdown',()=>{close();handle.destroy();title.destroy();trigger.destroy()});
 return {open,close,use,draw,isOpen:()=>opened,trigger};
}
