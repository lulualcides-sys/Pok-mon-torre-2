/* Optional single-player AUTO button backed by the native Poké Arena IA.
 * Kanto campaign starts ON; original Arena modes start OFF. No stat bonuses,
 * battle math, cooldown or approved VFX changes. */
// Campaign AUTO level 2: more proactive than the previous above-Hard
// profile. Native AI still owns attacks, dodges, energy and move cooldowns.
// NO native Maestro 35% hidden damage multiplier or player stat bonuses.
export const CAMPAIGN_AUTO_OFFENSIVE=Object.freeze({
 reaccion:.02,error:0,esquiva:.86,basicos:1,reflejo:.10,
 reflejoRival:.18,agresividad:1,juicio:1,umbralUlti:.60,ventaja:1
});
// These are actual native offensive decision thresholds in cerebros.js.
// Unlike the cfg.basicos field (projectile threat awareness), c.pBasico
// gates firing LMB; pConGanas/pSinGanas gate offensive RMB/Q decisions.
// Clone per-player brain, never mutate the source shared by enemy or Arena.
export function tuneCampaignAutoBrain(scene,brain){
 if(!scene?.datos?.torre2||!brain?.c||typeof brain.c!=='object')return brain;
 const c=brain.c;
 brain.c={...c,
  pBasico:Math.min(c.pBasico??.30,.14),
  pConGanas:Math.min(c.pConGanas??.30,.20),
  pSinGanas:Math.min(c.pSinGanas??.50,.34),
  pSeguro:Math.min(c.pSeguro??.85,.68),
  pAhorro:Math.min(c.pAhorro??.50,.08),
  reservaEnergia:Math.min(c.reservaEnergia??60,30),
  energiaTope:Math.min(c.energiaTope??95,72),
  pPlantarse:Math.min(c.pPlantarse??.50,.22),
  rodeo:Math.min(c.rodeo??.60,.36),
  lateral:Math.min(c.lateral??.25,.14),
  rangoBanda:Math.min(c.rangoBanda??25,18)
 };
 return brain;
}
// Native combat reuses one Phaser fighter instance when a new enemy is sent
// out. Prefer the active opposite-side fighter over a stale rival pointer;
// never aim at a defeated or allied member while a recall is underway.
export function livingCampaignOpponent(scene,actor){
 if(!actor)return null;
 const active=scene?.luchadores?.find(other=>
  other&&other!==actor&&Number(other.hp)>0&&!other.ko&&
  !(Number.isFinite(actor.lado)&&Number.isFinite(other.lado)&&
    actor.lado===other.lado));
 if(active)return active;
 const rival=actor.rival;
 return rival&&rival!==actor&&Number(rival.hp)>0&&!rival.ko?rival:null;
}
// Campaign AUTO only. Fill true native offensive gaps, never bypass move
// readiness, invent a skill, change damage, or override a chosen cast/dodge.
export function pressureCampaignAutoInput(scene,actor,input,brain=null){
 if(!scene?.datos?.torre2||scene.fase!=='lucha'||!actor||!input||
    typeof input!=='object'||input.esp||input.lmb||input.rmb||input.q||input.e||
    input.mega)return input;
 const foe=livingCampaignOpponent(scene,actor);
 if(!foe||foe.ko||!(Number(foe.hp)>0)||!(Number(actor.hp)>0)||
    !Number.isFinite(actor.x)||!Number.isFinite(actor.y)||
    !Number.isFinite(foe.x)||!Number.isFinite(foe.y))return input;
 const dx=foe.x-actor.x,dy=foe.y-actor.y,distance=Math.hypot(dx,dy);
 if(distance<1||distance>950)return input;
 const ux=dx/distance,uy=dy/distance;
 const basic=actor.kit?.lmb;
 const range=Number(basic?.alcance??basic?.largo??0);
 const basicReach=Number.isFinite(range)&&range>0?range:0;
 // No reckless pressure while badly hurt or the native AI is evading.
 const hpRatio=Number(actor.hpMax)>0?actor.hp/actor.hpMax:1;
 if(hpRatio<.32)return input;
 const danger=Array.isArray(scene.efectos)&&scene.efectos.some(effect=>
  effect?.vivo&&effect?.dueno&&effect.dueno!==actor&&
  Number.isFinite(effect.x)&&Number.isFinite(effect.y)&&
  Math.hypot(effect.x-actor.x,effect.y-actor.y)<85);
 let output=input;
 // Correct the old idle-only chase: native AI often circles sideways, so
 // the old check (movement magnitude < .12) was almost never reached.
 const approachAt=Math.max(55,Math.min(140,basicReach?basicReach*.76:75));
 if(hpRatio>=.43&&!danger&&distance>approachAt*1.15){
  const mx=Number(input.mx)||0,my=Number(input.my)||0;
  const magnitude=Math.hypot(mx,my);
  const forward=magnitude>.12?(mx*ux+my*uy)/magnitude:0;
  // Respect an intentional retreat, including defense against melee foes.
  if(magnitude<.12)output={...input,mx:ux,my:uy};
  else if(forward>=-.05&&forward<.60){
   const blend=.76,wx=blend*ux+(1-blend)*mx/magnitude;
   const wy=blend*uy+(1-blend)*my/magnitude;
   const norm=Math.hypot(wx,wy)||1;
   output={...input,mx:wx/norm,my:wy/norm};
  }
 }
 // ACTUAL basic attack opportunity: native cooldown, energy, heat,
 // invulnerability and animation locks all remain enforced.
 if(!basic||basic.pendiente||basicReach<=0||distance>basicReach*.86||
    !(Number(actor.cd?.lmb)<=0)||!(Number(actor.energia)>=(basic.coste??0))||
    !Number.isFinite(actor.energia)||
    Number(actor.calor??0)>=(brain?.c?.calorTope??80)||
    actor.dash||actor.accion?.bloquea||
    actor.est?.aturdido||actor.est?.dormido||actor.est?.congelado||
    actor.est?.recarga||foe.est?.contra||foe.est?.disfraz||
    (foe.est?.invul?.hasta??0)>(actor.t??0)||
    (foe.est?.vuelo?.hasta??0)>(actor.t??0))return output;
 // A pressured attack must face the live foe. Native IA may be holding a
 // pre-switch aim from the previous enemy. Only update aim when this helper
 // added LMB; never override a native skill, dash, dodge or manual controls.
 return {...output,lmb:true,ax:foe.x,ay:foe.y};
}
export const campaignAutoProfile=scene=>scene?.datos?.torre2?
 CAMPAIGN_AUTO_OFFENSIVE:'normal';
const OFFLINE_MODES=new Set(['cpu','entreno','arena']);
const HUMAN_TYPES=new Set(['kbm','tactil','teclado2']);
const isHuman=c=>HUMAN_TYPES.has(c?.tipo)||/^pad[0-9]+$/.test(c?.tipo||'');
export function autoBattleAllowed(scene){
 const d=scene?.datos;
 if(!d||scene.sim||scene.enLinea||scene.red||d.online||d.ranked||d.registro||
    ['online','versus','demo','replay'].includes(d.modo))return false;
 return OFFLINE_MODES.has(d.modo)||Boolean(d.torre2);
}
export function manualFighterControl(scene){
 if(!Array.isArray(scene?.controles))return null;
 return scene.controles.find(c=>isHuman(c)&&c.l&&!c.l.remoto&&typeof c.leer==='function')||null;
}
export function installAutoBattle(scene,makeNativeAI){
 if(!autoBattleAllowed(scene)||scene.__torre2AutoMode||
    typeof makeNativeAI!=='function')return null;
 // AUTO is strictly single-player. Never commandeer a local multiplayer
 // participant or let one human's toggle affect another human's fighter.
 if((scene.controles||[]).filter(isHuman).length!==1)return null;
 const original=manualFighterControl(scene);
 if(!original)return null;
 // Original Arena stores an evolution FAMILY in def.id and the evolved form
 // in etapa. Both must be part of the key (e.g. Squirtle -> Wartortle).
 const fighterSpecies=actor=>String(actor?.def?.id||actor?.dex||'')+':'+String(actor?.etapa??0);
 const state={enabled:!!scene.datos?.torre2,control:original,read:original.leer,
  ai:tuneCampaignAutoBrain(scene,makeNativeAI(original.l)),
  autoActor:original.l,autoSpecies:fighterSpecies(original.l),
  autoOpponent:livingCampaignOpponent(scene,original.l),
  autoOpponentSpecies:fighterSpecies(livingCampaignOpponent(scene,original.l)),
  diagnostics:{reads:0,playerRebinds:0,foeRebinds:0,
   nativeNoInput:0,assistedBasicFrames:0,assistedChaseFrames:0},
  button:null, label:null, zone:null,cleaned:false};
 if(typeof state.ai?.leer!=='function')throw Error('Native Poké Arena IA missing');
 const safeRead=function(dt,...args){
  if(!state.enabled||state.cleaned||scene.pausado||scene.fase!=='lucha')
   return state.read.call(this,dt,...args);
  // The Kanto party uses reiniciar() on the SAME Luchador after each KO/switch.
  // Its native IA may retain decision state from the previous species even
  // though the actor reference is unchanged. Recreate the original native IA
  // only at a genuine new species/actor boundary, preserving normal inputs,
  // cooldowns, damage, energy and every approved move/VFX.
  const fighter=original.l;
  const foe=livingCampaignOpponent(scene,fighter);
  if(scene.datos?.torre2){
   const species=fighterSpecies(fighter),foeSpecies=fighterSpecies(foe);
   const playerChanged=fighter!==state.autoActor||species!==state.autoSpecies;
   const foeChanged=foe!==state.autoOpponent||foeSpecies!==state.autoOpponentSpecies;
   // Reset tactical memory after either *side* is recalled. Native fighters
   // may be reused in place; resetting only for player switches leaves stale
   // target/attack decisions after Brock sends out Onix or a rival switches.
   if(fighter&&(playerChanged||foeChanged)){
    const ai=makeNativeAI(fighter);
    if(typeof ai?.leer!=='function')throw Error('Native Poké Arena IA missing after party switch');
    state.ai=tuneCampaignAutoBrain(scene,ai);
    state.autoActor=fighter;state.autoSpecies=species;
    state.autoOpponent=foe;state.autoOpponentSpecies=foeSpecies;
    if(playerChanged)state.diagnostics.playerRebinds++;
    if(foeChanged)state.diagnostics.foeRebinds++;
   }
  }
  // Keep a bounded in-memory diagnostic for real browser failures. Frame
  // counts are NOT hit counts or proof of damage. No console spam/log arrays.
  const stats=state.diagnostics;stats.reads++;
  const step=Number(dt);
  const it=state.ai.leer(Number.isFinite(step)&&step>0?Math.max(.001,Math.min(.10,step)):1/60);
  if(!it||typeof it!=='object'){
   // Preserve the approved original Arena AUTO: native AI null falls back
   // to the human reader there. Only campaign AUTO neutralizes stale touch.
   if(!scene.datos?.torre2)return state.read.call(this,dt,...args);
   stats.nativeNoInput++;
   return {mx:0,my:0,ax:foe?.x??fighter?.x??0,
    ay:foe?.y??fighter?.y??0,lmb:false,rmb:false,q:false,
    e:false,esp:false,mega:false};
  }
  const pressured=pressureCampaignAutoInput(scene,fighter,it,state.ai);
  if(!it.lmb&&pressured.lmb)stats.assistedBasicFrames++;
  if(pressured.mx!==it.mx||pressured.my!==it.my)stats.assistedChaseFrames++;
  return {...pressured,mega:false};
 };
 original.leer=safeRead;
 scene.__torre2AutoMode=state;
 const bg=scene.add.rectangle(579,146,56,22,0x161f2d,.92)
  .setStrokeStyle(1,0x9eacbe,.95).setDepth(9850);
 const text=scene.add.text(579,146,'AUTO',{fontFamily:'monospace',fontSize:'10px',
  fontStyle:'bold',color:'#dce5ef',stroke:'#111827',strokeThickness:2})
  .setOrigin(.5).setDepth(9852);
 const hot=scene.add.zone(579,146,66,36).setDepth(9853).setInteractive({useHandCursor:true});
 state.button=bg;state.label=text;state.zone=hot;
 function refresh(){
  bg.setFillStyle(state.enabled?0x164b35:0x161f2d,.94);
  bg.setStrokeStyle(1,state.enabled?0x5af4a0:0x9eacbe,.95);
  text.setText(state.enabled?'AUTO ✓':'AUTO').setColor(state.enabled?'#baffd2':'#dce5ef');
 }
 refresh(); // Kanto starts ON; other offline modes remain manual by default.
 hot.on('pointerdown',(_p,_x,_y,event)=>{
  event?.stopPropagation?.();
  if(state.cleaned||scene.fase==='fin'||scene.sim)return;
  state.enabled=!state.enabled;
  refresh();
 });
 const keyboard=scene.input?.keyboard;
 const hotkey=event=>{
  if(event.repeat||event.ctrlKey||event.altKey||event.metaKey)return;
  if(scene.fase==='fin'||state.cleaned)return;
  state.enabled=!state.enabled;
  refresh();
 };
 keyboard?.on('keydown-KeyB',hotkey);
 const sync=()=>{
  if(state.cleaned)return;
  const visible=scene.fase!=='fin';
  bg.setVisible(visible);text.setVisible(visible);hot.setActive(visible);
  if(!visible)state.enabled=false;
  // UI objects use the 640×360 battle's LOGICAL coordinates.
  // Previous camera-based viewport shift could place the button outside
  // the scene (x=699 on 760px canvas), especially on wide/mobile screens.
  // ScaleManager/Chrome scales this logical anchor automatically.
  // Y=146 keeps the touch target clear of the battle Bag's upper-right
  // x=565/y=92 activation zone; the controls must never steal each tap.
  const px=579;
  bg.setX(px);text.setX(px);hot.setX(px);
 };
 scene.events?.on('postupdate',sync);
 const destroy=()=>{
  if(state.cleaned)return;
  state.cleaned=true;state.enabled=false;
  if(original.leer===safeRead)original.leer=state.read;
  keyboard?.off('keydown-KeyB',hotkey);
  scene.events?.off('postupdate',sync);
  scene.events?.off('shutdown',destroy);
  scene.events?.off('destroy',destroy);
  hot.removeAllListeners?.();
  hot.destroy();text.destroy();bg.destroy();
  if(scene.__torre2AutoMode===state)scene.__torre2AutoMode=null;
 };
 scene.events?.once('shutdown',destroy);
 scene.events?.once('destroy',destroy);
 sync();
 return state;
}
export function bindAutoBattleToScene(Scene,IA){
 if(typeof Scene?.prototype?.create!=='function'||typeof IA!=='function')
  throw Error('Original Phaser scene and Poké Arena IA required');
 if(Object.hasOwn(Scene.prototype,'__torre2AutoPatched'))return;
 const original=Scene.prototype.create;
 Scene.prototype.create=function(...args){
  const result=original.apply(this,args);
  // Campaign AUTO: stronger-than-Hard tactical parameters ONLY for the
  // player AUTO brain. No bonus damage, speed, energy, cooldown or VFX changes.
  // Manual control and the original Arena AUTO still use their old settings.
  const tactic=campaignAutoProfile(this);
  const install=()=>installAutoBattle(this,fighter=>new IA(fighter,tactic));
  if(!install()&&autoBattleAllowed(this)&&!this.__torre2AutoRetry){
   // Campaign/Phaser may create the player controller AFTER create().
   // Try again on later native game frames without replacing controllers,
   // bypassing move cooldowns or installing duplicate hit areas.
   const scene=this;let tries=0,active=true;
   const stop=()=>{
    if(!active)return;
    active=false;scene.game?.events?.off('step',retry);
    if(scene.__torre2AutoRetry===stop)scene.__torre2AutoRetry=null;
   };
   const retry=()=>{
    if(!active)return;
    if(++tries>120||!autoBattleAllowed(scene)||
       (scene.scene?.isActive&& !scene.scene.isActive()))return stop();
    if(install())stop();
   };
   if(scene.game?.events?.on){
    scene.__torre2AutoRetry=stop;
    scene.game.events.on('step',retry);
    scene.events?.once('shutdown',stop);
    scene.events?.once('destroy',stop);
   }
  }
  return result;
 };
 Object.defineProperty(Scene.prototype,'__torre2AutoPatched',{value:true,configurable:false});
}
