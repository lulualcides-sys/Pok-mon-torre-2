import {createTrainerStrategy,chooseTrainerSwitch} from './trainer-strategy.js';
import {gen3Effectiveness} from './gen3-types.js';
import {createWeather,setWeather,tickWeather,WEATHER_NAMES} from './weather.js';
import {serializeGen3Status,restoreGen3Status,statusLabel} from './gen3-status.js';
import {trainerInventory,createTrainerItems,trainerItemStep,TRAINER_ITEM_RULES} from './trainer-items.js';
import {clearDepartingCombat} from './combat-boundary.js';
/* Pokémon Torre 2 — party battles, campaign only.
 * The original Phaser combat/VFX remain untouched. Manual switching and
 * knockouts transition to the next Pokémon without advancing trainer progress.
 * The fight ends only when one entire party is defeated.
 */
import {STAGES,campaignStarter,rivalChampionTeam} from './campaign-core.js';
import {resolveLoadout,TEST_LIBRARY} from './move-pool.js';
import {SURGE_LEADER_LOADOUTS} from './surge3/catalog.js';
import {buscar,etapaDe} from '../datos.js';
import {drawCaptureBall} from './capture-arena.js';
import {animateBallActor} from './ball-choreography.js';

const clamp=v=>Math.max(0,Math.min(100,Number(v)||0));
const label=(scene,x,y,value,size=10,color='#fff3cd',depth=2482)=>{
 return scene.add.text(x,y,value,{fontFamily:'Pixelify Sans,monospace',
  fontSize:size+'px',fontStyle:'bold',color,stroke:'#031628',
  strokeThickness:3}).setDepth(depth).setOrigin(.5);
};
export function createPartyMatch(state,opponent,wild=false){
 const friend=state.team.slice(0,6).map(m=>({
  id:m.id,uid:m.uid,level:m.progression?.level||5,
  hp:clamp(m.hp??100),status:m.status??null,loadout:resolveLoadout(m)
 }));
 const gym=STAGES[state.stage];
 const pool=gym?.enemy||[opponent.id];
 const leaderTeam=opponent.leader&&Array.isArray(gym?.leaderTeam)?
  (state.stage===12?rivalChampionTeam(campaignStarter(state)):gym.leaderTeam):null;
 const count=wild?1:leaderTeam?leaderTeam.length:opponent.leader?
  Math.min(6,state.stage>=8?4:state.stage>=4?3:2):
  Math.min(4,1+Math.floor((state.trainer+(state.stage||0))/5));
 const foes=Array.from({length:count},(_,i)=>{
  const id=leaderTeam?leaderTeam[i]:i===0?opponent.id:
   pool[(state.trainer+i)%pool.length]||opponent.id;
  // The true gym ace is the LAST enemy, not the first. Preserves 15/17
  // trainer checkpoints and saved opponent indices for existing journeys.
  const level=leaderTeam&&Array.isArray(gym.leaderLevels)?
   gym.leaderLevels[i]:leaderTeam&&i<count-1?
   Math.max(7,opponent.level-(count-i)*2):opponent.level;
  const loadout=resolveLoadout({id,progression:{species:id,level}});
  if(leaderTeam&&state.stage===2&&SURGE_LEADER_LOADOUTS[id]){
   // Original FireRed leader team, not a generic Electric template:
   // Voltorb: Tackle / Sonic Boom / Screech / Shock Wave;
   // Pikachu & Raichu: Quick Attack / Thunder Wave / Double Team / Shock Wave.
   const role=['lmb','rmb','q','e'];
   SURGE_LEADER_LOADOUTS[id].forEach((name,index)=>{
    const move=TEST_LIBRARY.find(m=>m.nombre===name);
    if(!move)throw Error('Lt. Surge needs real VFX for '+name);
    loadout[role[index]]={...move,pendiente:false,
     ...(index===3?{ulti:true}:{})};
   });
  }
  return {id,level,hp:100,loadout};
 });
 let playerIndex=Number.isInteger(state.active)?state.active:0;
 if(!(friend[playerIndex]?.hp>0))
  playerIndex=friend.findIndex(m=>m.hp>0);
 if(playerIndex<0)playerIndex=0;
 return {friend,foes,playerIndex,enemyIndex:0,changes:0,strategic:!wild&&opponent.leader===true,trainerItems:trainerInventory(state.stage,opponent.leader,state.trainer,wild)};
}
export function applyPartyBattleResult(state,party){
 if(!party||!Array.isArray(party.friend))return;
 const byUid=new Map(party.friend.map(m=>[m.uid,m]));
 for(const m of state.team){
  const from=byUid.get(m.uid);
  if(from){m.hp=clamp(from.hp);m.status=from.status??null;}
 }
 if(Number.isInteger(party.playerIndex)&&party.playerIndex>=0&&
    party.playerIndex<state.team.length)
  state.active=party.playerIndex;
}
// Small Pokéballs show owned members under each HP HUD, filled for Pokémon
// still standing and hollow for fainted ones.
// FireRed pixel item art shared with the game's own inventory.
function drawPixelBall(g,x,y,alive,active){
 x=Math.round(x);y=Math.round(y);
 if(active){
  g.fillStyle(0x10283d);g.fillRect(x-10,y-10,20,20);
  g.lineStyle(1,0xffd475);g.strokeRect(x-10,y-10,20,20);
  g.fillStyle(0xffebae);g.fillRect(x-8,y-8,3,2);
 }
 drawCaptureBall(g,x,y,'pokeball',.68);
 if(!alive){
  g.fillStyle(0x071827,.78);g.fillRect(x-8,y-8,16,16);
  g.fillStyle(0x7c91a0);g.fillRect(x-3,y-1,6,2);
 }
}
export function installPartyBattle(scene){
 const payload=scene.datos?.torre2;
 const party=payload?.party;
 if(!party||scene.__torre2PartyInstalled||!scene.luchadores?.[1])return;
 scene.__torre2PartyInstalled=true;
 // Phaser reuses the same Scene instance on restart. Clear the switch lock
 // from the PREVIOUS Pokémon or the next KO becomes permanently frozen.
 scene.__torre2Changing=false;
 const actors=scene.luchadores;
 const weather=scene.__torre2Weather=createWeather();
 setWeather(weather,payload.weather||'none');
 const weatherHud=label(scene,320,105,'',8,'#d9e7ed',2302).setScrollFactor(0);
 scene.events.once('shutdown',()=>{weatherHud.destroy();scene.__torre2Weather=null;scene.__torre2Rain=null;});
 const levelLabels=actors.map(()=>label(scene,0,0,'',7,'#d5e9ef',2302));
 scene.events.once('shutdown',()=>levelLabels.forEach(o=>o.destroy()));
 const trainerItems=createTrainerItems(party.trainerItems||{});
 scene.__torre2TrainerItems=trainerItems;
 const strategy=scene.__torre2TrainerStrategy=createTrainerStrategy(party.strategic===true);
 const enemyControl=scene.controles?.[1],readControl=enemyControl?.leer;
 if(readControl)enemyControl.leer=function(dt){return trainerItems.pending?null:readControl.call(this,dt)};
 scene.events.once('shutdown',()=>{if(readControl)enemyControl.leer=readControl;scene.__torre2TrainerItems=null});
 // fase alone blocks input in P2, but its paso still advances projectiles,
 // status damage and regeneration. Suspend simulation, not the Phaser clock.
 const nativeStep=scene.paso;
 scene.paso=function(dt){
  if(this.__torre2Changing||this.__torre2BallTransitions||this.__torre2CaptureBusy||['torre2-sendout','capturando','torre2-aim'].includes(this.fase)){
   this.hud?.update();return;
  }
  const result=nativeStep.call(this,dt);
  if(this.fase==='lucha'&&!this.__torre2Changing){
   const fainted=tickWeather(weather,dt,actors);
   weatherHud.setText(weather.kind==='none'?'':WEATHER_NAMES[weather.kind]+' '+Math.ceil(weather.remaining)+'s');
   for(const actor of fainted)if(!this.__torre2Changing)this.alKO(actor);
   const event=trainerItemStep(trainerItems,actors[1],party.enemyIndex,this.t);
   if(event?.kind==='started')announce('RIVAL USA '+TRAINER_ITEM_RULES[event.item].name+'!');
   if(event?.kind==='healed')announce('+'+Math.round(event.hp)+' HP');
   const next=chooseTrainerSwitch(strategy,{time:this.t,activeIndex:party.enemyIndex,
    blocked:this.__torre2Changing||this.fase!=='lucha'||!!trainerItems.pending||!!actors[1].accion||!!actors[1].dash||actors.some(a=>a.hp<=0||a.ko),
    opponentTypes:actors[0].tipos||[],members:party.foes.map((m,i)=>{
     const {def,etapa}=buscar(m.id);return {...m,types:etapaDe(def,etapa).tipos||[],hp:i===party.enemyIndex?clamp(actors[1].hp/actors[1].hpMax*100):m.hp};
    })},gen3Effectiveness);
   if(next>=0){announce('RIVAL RECOLHE SEU POKÉMON!');recall(1,next);}
  }
  return result;
 };
 scene.events.once('shutdown',()=>{scene.paso=nativeStep});
 for(const [side,member]of [[0,party.friend[party.playerIndex]],
                            [1,party.foes[party.enemyIndex]]]){
  if(member&&member.hp>0)actors[side].hp=Math.max(1,
    Math.round(actors[side].hpMax*member.hp/100));
  restoreGen3Status(actors[side],member?.status);
 }
 // Emerald Arena inspired first sendout: Pokéballs travel in an arc,
 // burst open, and materialize the REAL PMD fighter. Wild opponents
 // already inhabit the arena, so only the player throws in wild battles.
 if(party.changes===0){
  const entryPhase=scene.fase;
  const sides=payload.kind==='wild'?[0]:[0,1];
  let remaining=sides.length;
  for(const side of sides)animateBallActor(scene,actors[side],{
   side,from:{x:side===0?52:590,y:side===0?281:126},drawBall:drawCaptureBall,
   onComplete:()=>{if(--remaining===0)scene.fase=entryPhase==='intro'?'intro':'lucha'}
  });
 }
 // Keep only individual pixel Pokéballs below each original HP bar.
 // No large black scoreboard tables or top-center text swap selector.
 const graphics=scene.add.graphics().setDepth(2480);
 const sharedBeam=scene.add.graphics().setDepth(2603);
 const sharedBall=scene.add.graphics().setDepth(2604);
 const memberDex=m=>{
  try{
   const {def,etapa}=buscar(m.id);
   return String((etapa>0?def.evoluciones?.[etapa-1]?.dex:def.dex)||'0150').padStart(4,'0');
  }catch{return '0150'}
 };
 const sidebar=scene.add.graphics().setDepth(2500);
 const icons=[],slotZones=[];
 const tooltip=label(scene,111,125,'',10,'#fff0cc',2606).setVisible(false);
 const slotX=34,slotStart=123,slotStep=33;
 // Preloaded Pokédex portraits guarantee visible sprites for ALL reserves;
 // where an Idle PMD frame is already cached, prefer the battle body sprite.
 for(let i=0;i<6;i++){
  const member=party.friend[i],y=slotStart+i*slotStep;
  let img=null;
  if(member){
   const dex=memberDex(member),idle='pmd-'+dex+'-Idle';
   const portrait='torre2-portrait-'+dex;
   const key=scene.textures.exists(idle)?idle:
    scene.textures.exists(portrait)?portrait:null;
   if(key){
    img=scene.add.image(slotX,y,key).setDepth(2503);
    const w=Math.max(1,img.frame?.width||32),h=Math.max(1,img.frame?.height||32);
    img.setScale(Math.min(25/w,25/h));
    img.setData('torre2-party-sprite',i);
   }
  }
  const zone=scene.add.zone(slotX,y,49,32).setDepth(2506)
   .setInteractive({useHandCursor:true}).setData('torre2-party-slot',i);
  zone.on('pointerover',()=>{
   if(!member)return;
   const hp=i===party.playerIndex&&actors[0]?.hpMax?
    clamp(actors[0].hp/actors[0].hpMax*100):clamp(member.hp);
   tooltip.setPosition(113,Math.max(116,Math.min(300,y)));
   tooltip.setText(member.id.toUpperCase()+' · '+Math.ceil(hp)+'% HP').setVisible(true);
  });
  zone.on('pointerout',()=>tooltip.setVisible(false));
  zone.on('pointerdown',()=>{
   tooltip.setVisible(false);
   if(!member||i===party.playerIndex||member.hp<=0||
      scene.__torre2Changing||scene.__torre2BallTransitions||scene.fase!=='lucha')return;
   recall(0,i);
  });
  icons.push(img);slotZones.push(zone);
 }
 scene.__torre2SideParty={x:slotX,start:slotStart,step:slotStep,
  slots:slotZones,icons};
 function redrawPartyHud(){
  graphics.clear();sidebar.clear();
  for(const [members,idx,start] of [
   [party.friend,party.playerIndex,31],[party.foes,party.enemyIndex,477]]){
   members.slice(0,6).forEach((m,i)=>
    drawPixelBall(graphics,start+i*21,64,m.hp>0,i===idx));
  }
  sidebar.fillStyle(0x061726,.88);
  sidebar.fillRoundedRect(6,103,55,222,7);
  sidebar.lineStyle(1,0x64879a,.72);
  sidebar.strokeRoundedRect(6,103,55,222,7);
  sidebar.fillStyle(0xdac27d);sidebar.fillRect(12,106,43,2);
  party.friend.slice(0,6).forEach((m,i)=>{
   const y=slotStart+i*slotStep,selected=i===party.playerIndex,alive=m.hp>0;
   const hp=selected&&actors[0]?.hpMax?
    clamp(actors[0].hp/actors[0].hpMax*100):clamp(m.hp);
   sidebar.fillStyle(selected?0x304956:0x122a3b,alive?1:.65);
   sidebar.fillRoundedRect(10,y-15,48,30,4);
   sidebar.lineStyle(selected?2:1,selected?0xffd477:alive?0x628b9e:0x536273,1);
   sidebar.strokeRoundedRect(10,y-15,48,30,4);
   sidebar.fillStyle(0x101a28);sidebar.fillRect(16,y+10,36,3);
   sidebar.fillStyle(!alive?0x657080:hp<25?0xf06f67:hp<50?0xeab95b:0x5bd69c);
   sidebar.fillRect(16,y+10,Math.max(0,Math.round(36*hp/100)),3);
   if(selected){
    sidebar.fillStyle(0xffe3a5);
    sidebar.fillTriangle(7,y-4,7,y+4,12,y);
   }
   const image=icons[i];
   if(image?.active){
    image.setAlpha(alive?(selected?1:.94):.32);
    if(alive)image.clearTint();else image.setTint(0x84909d);
   }
  });
  for(let i=party.friend.length;i<6;i++){
   const y=slotStart+i*slotStep;
   sidebar.lineStyle(1,0x365265,.7);
   sidebar.strokeRoundedRect(10,y-15,48,30,4);
   sidebar.fillStyle(0x43596a,.4);sidebar.fillCircle(slotX,y,4);
  }
 }
 redrawPartyHud();
 let sidebarTicks=0;
 const refreshSidebar=()=>{
  if(scene.scene.isActive()&&++sidebarTicks%14===0)redrawPartyHud();
 };
 scene.game.events.on('step',refreshSidebar);
 const announce=(textValue)=>{
  const txt=label(scene,320,141,textValue,13,'#ffe0a9',2600);
  scene.time.delayedCall(900,()=>txt.active&&txt.destroy());
 };
 function syncHp(){
  for(const [side,entries,idx]of [[0,party.friend,party.playerIndex],
                                   [1,party.foes,party.enemyIndex]]){
   const a=actors[side],m=entries[idx];
   if(a&&m){m.hp=clamp(a.hp/a.hpMax*100);m.status=serializeGen3Status(a);}
  }
 }
 function recall(side,next,kind='switch'){
  if(scene.__torre2Changing||!scene.scene.isActive())return;
  scene.__torre2Changing=true;
  levelLabels.forEach(o=>o.setVisible(false));
  clearDepartingCombat(scene);
  scene.fase='ko';
  syncHp();
  // The native damage/regen logic may tick briefly during KO animation.
  // Never overwrite a confirmed faint with a tiny HP fraction.
  if(kind==='faint'){
   const members=side===0?party.friend:party.foes;
   const outgoing=side===0?party.playerIndex:party.enemyIndex;
   if(members[outgoing])members[outgoing].hp=0;
  }
  const actor=actors[side];
  // Native faint logic may hide/alpha-fade sprites before this handler runs.
  // Restore a drawable PMD silhouette so the red recall ray visibly pulls it.
  if(actor.spr?.active)actor.spr.setVisible(true).setAlpha(1);
  // Combat is paused while the Pokéball acts. Remember the other fighter's
  // exact HP: stale native hit effects must not heal/damage it during recall.
  const peer=actors[1-side];
  const peerHpRatio=peer?.hpMax>0?peer.hp/peer.hpMax:null;
  // Put the actual ball near the outgoing fighter so the red beam begins
  // on-screen and ends exactly at the visible sprite, including on faint.
  const from={
   // Fixed hand at opposite battlefield edge makes return/release visibly
   // distinct from a tiny attack hit spark, even on mobile screens.
   x:side===0?70:570,y:286
  };
  const fx=sharedBeam;
  const ball=sharedBall;
  let restarted=false;
  const enterNext=()=>{
   if(restarted||!scene.scene.isActive())return;
   restarted=true;

   if(next<0){
    fx.clear();ball.clear();
    finish(side===1);
    return;
   }
   const member=side===0?party.friend[next]:party.foes[next];
   const actor=actors[side];
   let found;
   try{found=buscar(member.id)}catch(e){
    console.error('Torre 2: espécie não carregada',member.id,e);
    scene.__torre2Changing=false;scene.fase='lucha';return;
   }
   if(!found?.def){
    scene.__torre2Changing=false;scene.fase='lucha';return;
   }
   // Crucial: mutate the same Luchador used by HUD, AI and input controls.
   // Reloading Combate recreates the whole arena and starts FIGHT countdown.
   // The native reiniciar() can replace the PMD sprite without deleting
   // previously rendered ones; retain references for orphan cleanup.
   const previousSprite=actor.spr;
   const previousDex=String(actor.dex||'');
   const oldVisuals=scene.children.list.filter(obj=>
    obj.active&&obj.texture?.key?.startsWith('pmd-'+previousDex+'-')&&
    obj.type==='Sprite');
   if(side===0){
    party.playerIndex=next;scene.datos.p1=member.id;
    scene.datos.torre2Loadout=member.loadout;
    payload.playerLevel=member.level;
   }else{
    party.enemyIndex=next;scene.datos.p2=member.id;
    scene.datos.torre2OpponentLoadout=member.loadout;
    payload.enemyLevel=member.level;
   }
   party.changes++;
   const x=actor.x,y=actor.y;
   actor.def=found.def;actor.etapa=found.etapa??0;
   actor.aspecto=null;actor.jefe=null;
   // Native reiniciar() changes stats, but the previous PMD animation can
   // remain playing (Bulbasaur visible under Mewtwo's HUD). Refresh both.
   scene.tweens.killTweensOf(actor.spr);
   actor.reiniciar(x,y);
   const idleTexture='pmd-'+actor.dex+'-Idle';
   const idleAnimation=actor.dex+'-Idle-0';
   actor.spr.anims.stop();
   if(scene.textures.exists(idleTexture))actor.spr.setTexture(idleTexture);
   if(scene.anims.exists(idleAnimation))actor.spr.play(idleAnimation);
   actor.claveAnim=idleAnimation;
   // A stale fighter sprite may survive the native reiniciar() and continue
   // animating independently. Delete orphaned old-Pokémon visuals while
   // preserving the actual current fighter and the opponent's PMD sprite.
   let staleCleared=0;
   for(const visual of oldVisuals){
    if(visual!==actor.spr&&visual.active&&
       !actors.some(a=>a.spr===visual)){
     visual.destroy();staleCleared++;
    }
   }
   if(previousSprite&&previousSprite!==actor.spr&&previousSprite.active&&
      !actors.some(a=>a.spr===previousSprite)){
    previousSprite.destroy();staleCleared++;
   }
   scene.__torre2SwapDebug={
    previousDex,newDex:String(actor.dex||''),
    staleCleared,oldSpriteSame:previousSprite===actor.spr,
    activeTexture:actor.spr?.texture?.key,side
   };
   actor.spr.setVisible(true).setAlpha(1).setScale(actor.escala||1);
   actor.sombra?.setVisible(true);actor.anillo?.setVisible(true);
   actor.kit=actor.kitActual();
   actor.hp=Math.max(1,Math.round(actor.hpMax*member.hp/100));
   actor.ko=false;
   restoreGen3Status(actor,member.status);
   // Native HUD caches names, portraits, types and move captions. Refresh it
   // after the same fighter object has become the incoming party member.
   scene.hud?.alEvolucionar?.(actor);
   const hudSide=scene.hud?.lados?.[side];if(hudSide)hudSide.estela=actor.hp;
   fx.clear();ball.clear();
   animateBallActor(scene,actor,{side,from,drawBall:drawCaptureBall,onComplete:()=>{
    if(peer&&peerHpRatio!==null&&peer.hpMax>0){
     peer.hp=Math.max(0,Math.min(peer.hpMax,peerHpRatio*peer.hpMax));
    }
    scene.__torre2Changing=false;scene.fase='lucha';
   }});
   redrawPartyHud();
  };
  animateBallActor(scene,actor,{mode:'recall',side,from,drawBall:drawCaptureBall,onComplete:enterNext});
 }
 function finish(won){
  scene.fase='ko';
  syncHp();
  // One winner is enough for a Kanto trainer: the original client's
  // best-of-three round loop is excluded ONLY from Torre 2 party battles.
  scene.victorias=won?[1,0]:[0,1];
  announce(won?'EQUIPE RIVAL DERROTADA!':'TODOS OS POKÉMON DESMAIARAM!');
  // Native KO hitstop can suspend scene.time. A game-step fallback ensures
  // that the final knockout always reaches the campaign result screen.
  let finished=false,ticks=0;
  const resolve=()=>{
   if(finished||!scene.scene.isActive())return;
   finished=true;scene.game.events.off('step',watchResult);
   scene.resultado();
  };
  const watchResult=()=>{if(++ticks>=52)resolve();};
  scene.game.events.on('step',watchResult);
  scene.time.delayedCall(850,resolve);
  scene.events.once('shutdown',()=>scene.game.events.off('step',watchResult));
 }
 // Trigger directly on native knockout. Disabled for every other game mode.
 scene.alKO=caido=>{
  if(scene.fase!=='lucha')return;
  const side=caido.lado,arr=side===0?party.friend:party.foes;
  const pos=side===0?party.playerIndex:party.enemyIndex;
  scene.fase='ko';
  syncHp();arr[pos].hp=0;redrawPartyHud();
  const next=arr.findIndex((m,i)=>i!==pos&&m.hp>0);
  if(next<0){
   // Even the final defeated Pokémon must be drawn into its Pokéball
   // before the victory screen, rather than jumping to a white KO sprite.
   recall(side,-1,'faint');
   return;
  }
  announce(side===0?'POKÉMON DESMAIOU!':'RIVAL VAI TROCAR!');
  // KO pauses native fight ticks. Recollect through the same red beam as
  // manual switching; call synchronously so a paused scene clock cannot
  // leave the player's party stuck on a fainted Pokémon.
  recall(side,next,'faint');
 };
 // A click on the left Pokemon sprite now directly switches the party.
 // If the native engine sets 0 HP without invoking alKO (some move/status
 // paths do), the campaign still recalls the fainted fighter exactly once.
 const monitorKo=()=>{
  if(!scene.scene.isActive()||scene.__torre2Changing||
     scene.fase!=='lucha')return;
  const fainted=actors.find(a=>a&&!a.inmortal&&a.hp<=0);
  if(fainted)scene.alKO(fainted);
 };
 // Enforce species AFTER native animations update; no move/VFX textures touched.
 const syncRenderedSpecies=()=>{
  if(!scene.scene.isActive()||scene.__torre2Changing)return;
  for(const actor of actors){
   const member=actor.lado===0?party.friend[party.playerIndex]:party.foes[party.enemyIndex];
   levelLabels[actor.lado]?.setText('Nv.'+(member?.level||5)+' '+statusLabel(actor)).setPosition(actor.x,actor.y+9).setVisible(actor.spr?.visible&&!scene.__torre2BallTransitions&&!scene.__torre2CaptureBusy);
   const spr=actor?.spr;
   if(!spr?.active||!actor.dex)continue;
   const prefix='pmd-'+actor.dex+'-',current=String(spr.texture?.key||'');
   if(!current.startsWith('pmd-')||current.startsWith(prefix))continue;
   const idle=prefix+'Idle';
   if(!scene.textures.exists(idle))continue;
   spr.anims.stop();spr.setTexture(idle);actor.claveAnim=null;
   actor.__torre2RenderCorrections=(actor.__torre2RenderCorrections||0)+1;
   scene.__torre2LastSpeciesRepair={side:actor.lado,from:current,to:idle};
  }
 };
 scene.game.events.on('step',monitorKo);
 scene.game.events.on('poststep',syncRenderedSpecies);
 scene.events.once('shutdown',()=>{
  scene.game.events.off('step',monitorKo);
  scene.game.events.off('poststep',syncRenderedSpecies);
  scene.game.events.off('step',refreshSidebar);
  scene.__torre2PartyInstalled=false;
  scene.__torre2SideParty=null;
  tooltip.destroy();
  for(const zone of slotZones)zone.destroy();
  for(const img of icons)img?.destroy();
  sidebar.destroy();
  sharedBeam.destroy();sharedBall.destroy();graphics.destroy();
 });
}
