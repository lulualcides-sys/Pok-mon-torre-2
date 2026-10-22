/* Pokémon Torre 2 — party battles, campaign only.
 * The original Phaser combat/VFX remain untouched. Manual switching and
 * knockouts transition to the next Pokémon without advancing trainer progress.
 * The fight ends only when one entire party is defeated.
 */
import {GYMS} from './campaign-core.js';
import {resolveLoadout} from './move-pool.js';
import {buscar} from '../datos.js';
import {drawCaptureBall} from './capture-arena.js';

const clamp=v=>Math.max(0,Math.min(100,Number(v)||0));
// The fighter's logical simulation location can differ from the PMD sprite.
// Use actual displayed sprite bounds so the Pokéball beam never points at an
// old spawn position, especially after a KO or a teammate swap.
function visibleActorCenter(actor){
 const visual=actor?.spr||actor?.sprite;
 if(visual?.getBounds&&visual.active!==false){
  const b=visual.getBounds();
  // Bounds are calculated from the actual PMD texture, including animation
  // frame origin and scale. Never use a saved spawn position for the beam.
  if(Number.isFinite(b.centerX)&&Number.isFinite(b.centerY)&&
     b.width>0&&b.height>0)return {x:b.centerX,y:b.centerY};
 }
 return {x:Number(actor?.x)||320,
  y:(Number(actor?.y)||180)-Math.max(18,Number(actor?.alto||36)*.5)};
}
function drawRecallBeam(g,from,target,strength=1){
 const a=Math.max(0,Math.min(1,strength));
 const x=Math.round(target.x),y=Math.round(target.y);
 g.clear();
 g.lineStyle(8,0xba2347,a*.60);
 g.lineBetween(from.x,from.y,x,y);
 g.lineStyle(4,0xff496b,a);
 g.lineBetween(from.x,from.y,x,y);
 g.lineStyle(2,0xffcbd0,a);
 g.lineBetween(from.x,from.y,x,y);
 g.fillStyle(0xff6381,a*.65);
 g.fillCircle(x,y,Math.max(2,Math.round(7*a)));
 g.fillStyle(0xffffff,a);
 g.fillRect(x-2,y-2,4,4);
}
const label=(scene,x,y,value,size=10,color='#fff3cd',depth=2482)=>{
 return scene.add.text(x,y,value,{fontFamily:'Pixelify Sans,monospace',
  fontSize:size+'px',fontStyle:'bold',color,stroke:'#031628',
  strokeThickness:3}).setDepth(depth).setOrigin(.5);
};
export function createPartyMatch(state,opponent,wild=false){
 const friend=state.team.slice(0,6).map(m=>({
  id:m.id,uid:m.uid,level:m.progression?.level||5,
  hp:clamp(m.hp??100),loadout:resolveLoadout(m)
 }));
 const pool=GYMS[state.stage]?.enemy||[opponent.id];
 const count=wild?1:opponent.leader?
  Math.min(6,state.stage>=8?4:state.stage>=4?3:2):
  Math.min(4,1+Math.floor((state.trainer+(state.stage||0))/5));
 const foes=Array.from({length:count},(_,i)=>({
  id:i===0?opponent.id:pool[(state.trainer+i)%pool.length]||opponent.id,
  level:opponent.level,hp:100,
  loadout:resolveLoadout({id:i===0?opponent.id:
   pool[(state.trainer+i)%pool.length]||opponent.id,
   progression:{species:i===0?opponent.id:pool[(state.trainer+i)%pool.length]||opponent.id,
    level:opponent.level}})
 }));
 let playerIndex=Number.isInteger(state.active)?state.active:0;
 if(!(friend[playerIndex]?.hp>0))
  playerIndex=friend.findIndex(m=>m.hp>0);
 if(playerIndex<0)playerIndex=0;
 return {friend,foes,playerIndex,enemyIndex:0,changes:0};
}
export function applyPartyBattleResult(state,party){
 if(!party||!Array.isArray(party.friend))return;
 const byUid=new Map(party.friend.map(m=>[m.uid,m]));
 for(const m of state.team){
  const from=byUid.get(m.uid);
  if(from)m.hp=clamp(from.hp);
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
 for(const [side,member]of [[0,party.friend[party.playerIndex]],
                            [1,party.foes[party.enemyIndex]]]){
  if(member&&member.hp>0)actors[side].hp=Math.max(1,
    Math.round(actors[side].hpMax*member.hp/100));
 }
 // Arrival flash after a recall/switch: red Pokéball beam releases the
 // replacement Pokémon before regular combat resumes.
 if(party.changes>0){
  const release=scene.add.graphics().setDepth(2604);
  const actor=actors[scene.datos?.torre2?.lastSwitchedSide===1?1:0];
  const bx=actor.lado===1?567:72,by=288;
  const initialTarget=visibleActorCenter(actor);
  const tx=initialTarget.x,ty=initialTarget.y;
  let frame=0;
  if(actor.spr?.active)actor.spr.setAlpha(.05);
  const sparkle=()=>{
   if(!scene.scene.isActive()||!release.active){
    scene.game.events.off('step',sparkle);return
   }
   const t=Math.min(1,++frame/26);
   release.clear();
   release.lineStyle(4,0xff465a,.8*(1-t));
   release.lineBetween(bx,by,tx,ty);
   release.lineStyle(1,0xffe8df,.98*(1-t));
   release.lineBetween(bx,by,tx,ty);
   release.fillStyle(0xff9f9f,(1-t)*.38);
   release.fillCircle(tx,ty,22*(1-t)+2);
   if(actor.spr?.active)actor.spr.setAlpha(Math.min(1,.05+t*.95));
   if(frame>=26){
    if(actor.spr?.active)actor.spr.setAlpha(1);
    scene.game.events.off('step',sparkle);
    release.destroy();
   }
  };
  scene.game.events.on('step',sparkle);
  scene.events.once('shutdown',()=>scene.game.events.off('step',sparkle));
 }
 const graphics=scene.add.graphics().setDepth(2480);
 const sharedBeam=scene.add.graphics().setDepth(2603);
 const sharedBall=scene.add.graphics().setDepth(2604);
 const playerLabel=label(scene,96,53,'',9,'#c1efe3');
 const enemyLabel=label(scene,539,53,'',9,'#ffe0d1');
 const switchText=label(scene,322,89,'',10,'#ffe7a3',2482);
 function redrawPartyHud(){
  graphics.clear();
  for(const xx of [12,448]){
   graphics.fillStyle(0x071d2e,.95);graphics.fillRect(xx,44,178,46);
   graphics.lineStyle(2,0x77969f,1);
   graphics.strokeRect(xx+1,45,176,44);
   graphics.fillStyle(0x143a4c);graphics.fillRect(xx+3,47,172,13);
   graphics.lineStyle(1,0xd9be77,1);
   graphics.lineBetween(xx+4,61,xx+174,61);
  }
  for(const [members,active,start] of [
   [party.friend,party.playerIndex,30],[party.foes,party.enemyIndex,468]]){
   members.forEach((m,i)=>
    drawPixelBall(graphics,start+i*20,76,m.hp>0,i===active));
  }
  playerLabel.setText('SEUS POKÉMON · '+party.friend.filter(m=>m.hp>0).length+'/'+party.friend.length);
  enemyLabel.setText((payload.kind==='wild'?'SELVAGEM':'RIVAL')+' · '+
   party.foes.filter(m=>m.hp>0).length+'/'+party.foes.length);
  switchText.setText('TROCAR POKÉMON ('+party.friend.filter(m=>m.hp>0).length+'/'+party.friend.length+') ▾');
 }
 redrawPartyHud();
 const available=()=>party.friend.map((m,i)=>({m,i}))
  .filter(({m,i})=>i!==party.playerIndex&&m.hp>0);
 const announce=(textValue)=>{
  const txt=label(scene,320,141,textValue,13,'#ffe0a9',2600);
  scene.time.delayedCall(900,()=>txt.active&&txt.destroy());
 };
 function syncHp(){
  for(const [side,entries,idx]of [[0,party.friend,party.playerIndex],
                                   [1,party.foes,party.enemyIndex]]){
   const a=actors[side],m=entries[idx];
   if(a&&m)m.hp=clamp(a.hp/a.hpMax*100);
  }
 }
 function recall(side,next,kind='switch'){
  if(scene.__torre2Changing||!scene.scene.isActive())return;
  scene.__torre2Changing=true;
  scene.fase='ko';
  syncHp();
  // The native damage/regen logic may tick briefly during the 450ms KO
  // animation. Never overwrite a confirmed faint with a tiny HP fraction.
  if(kind==='faint'){
   const members=side===0?party.friend:party.foes;
   const outgoing=side===0?party.playerIndex:party.enemyIndex;
   if(members[outgoing])members[outgoing].hp=0;
  }
  const actor=actors[side];
  const target=visibleActorCenter(actor);
  // Combat is paused while the Pokéball acts. Remember the other fighter's
  // exact HP: stale native hit effects must not heal/damage it during recall.
  const peer=actors[1-side];
  const peerHpRatio=peer?.hpMax>0?peer.hp/peer.hpMax:null;
  // Put the actual ball near the outgoing fighter so the red beam begins
  // on-screen and ends exactly at the visible sprite, including on faint.
  const from={
   x:Math.max(24,Math.min(616,target.x+(side===0?-76:76))),
   y:Math.max(90,Math.min(322,target.y+42))
  };
  const fx=sharedBeam;
  const ball=sharedBall;
  // Exact same crisp FireRed pixel-ball art as inventory/team HUD.
  // Draw into an existing Phaser Graphics surface; never generate circles
  // or allocate a new PNG/canvas for every swap.
  const drawBall=()=>{
   ball.clear();
   drawCaptureBall(ball,Math.round(from.x),Math.round(from.y),'pokeball',1.15,0,frames<12);
  };
  drawBall();
  let frames=0,restarted=false;
  // Keep the rendered target synchronized with the actual moving PMD sprite
  // while the laser is travelling. Capture a copy at the end of recollection
  // only, when the outgoing Pokémon is fully inside the ball.
  const recallTarget={x:target.x,y:target.y};
  const detachRecall=()=>scene.game.events.off('step',step);
  const enterNext=()=>{
   if(restarted||!scene.scene.isActive())return;
   restarted=true;
   detachRecall();
   scene.events.off('shutdown',detachRecall);
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
   actor.kit=actor.kitActual();
   actor.hp=Math.max(1,Math.round(actor.hpMax*member.hp/100));
   actor.ko=false;
   const replacementScale=actor.escala||actor.spr.scaleX||1;
   actor.spr.setAlpha(.1).setScale(.15*replacementScale).setVisible(true);
   actor.sombra?.setVisible(true);
   actor.anillo?.setVisible(true);
   fx.clear();ball.clear();
   let comingFrame=0;
   const release=()=>{
    if(!scene.scene.isActive()){
     scene.game.events.off('step',release);return;
    }
    const t=Math.min(1,++comingFrame/12);
    fx.clear();
    // During materialization, aim at the real visible PMD sprite frame,
    // not the pre-shrink cached center or the Luchador's logical position.
    const live=visibleActorCenter(actor);
    const targetX=live.x,targetY=live.y;
    drawRecallBeam(fx,from,live,1-t*.55);
    ball.clear();
    drawCaptureBall(ball,from.x,from.y,'pokeball',1.15,0,true);
    fx.fillStyle(0xffe0bb,(1-t)*.9);
    const flash=Math.max(1,Math.round(9*(1-t)));
    fx.fillRect(Math.round(targetX)-flash,Math.round(targetY)-1,flash*2,2);
    fx.fillRect(Math.round(targetX)-1,Math.round(targetY)-flash,2,flash*2);
    if(actor.spr?.active)
     actor.spr.setAlpha(.1+.9*t).setScale(replacementScale*(.15+.85*t));
    if(comingFrame>=12){
     if(peer&&peerHpRatio!==null&&peer.hpMax>0){
      peer.hp=Math.max(0,Math.min(peer.hpMax,peerHpRatio*peer.hpMax));
      const teammates=side===0?party.foes:party.friend;
      const index=side===0?party.enemyIndex:party.playerIndex;
      if(teammates[index])teammates[index].hp=clamp(100*peerHpRatio);
     }
     fx.clear();scene.game.events.off('step',release);
     scene.events.off('shutdown',detachRelease);
     scene.__torre2Changing=false;scene.fase='lucha';
    }
   };
   const detachRelease=()=>scene.game.events.off('step',release);
   scene.game.events.on('step',release);
   scene.events.once('shutdown',detachRelease);
   redrawPartyHud();
  };
  // A global frame-step remains live during native KO hitstop. The original
  // combat scene's local clock/tween may be suspended for animations, which
  // previously left battles frozen for good at the replacement moment.
  const step=()=>{
   if(!scene.scene.isActive()){scene.game.events.off('step',step);return}
   scene.fase='ko';
   const t=Math.min(1,++frames/30);
   // The PMD sprite moves while in combat; read its current on-screen bounds
   // BEFORE shrinking. This keeps the red ray touching the Pokémon itself.
   const live=visibleActorCenter(actor);
   if(frames<=24){recallTarget.x=live.x;recallTarget.y=live.y;}
   const fade=1-t*.48;
   drawRecallBeam(fx,from,recallTarget,fade);
   ball.clear();
   drawCaptureBall(ball,Math.round(from.x),Math.round(from.y),
    'pokeball',1.15,0,frames<=24);
   if(actor.spr?.active){
    actor.spr.setAlpha(Math.max(.02,1-t));
    actor.spr.setScale(Math.max(.035,(actor.escala||1)*(1-t*.95)));
   }
   if(frames>=32)enterNext();
  };
  // Always show the red recollection beam and shrinking Pokémon (including
  // K.O.) before sending the replacement. A scene clock can be paused by
  // native hitstop, so game-level frames and a guarded fallback are used.
  scene.game.events.on('step',step);
  // The game-wide frame callback is the primary completion mechanism:
  // battle-scene timers may pause during the engine's native KO hitstop.
  // DelayedCall only acts as a fallback when the local clock is running.
  scene.time.delayedCall(1100,enterNext);
  scene.events.once('shutdown',detachRecall);
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
 const menu=scene.add.graphics().setDepth(2600);
 let entries=[];
 let open=false;
 const close=()=>{
  for(const obj of entries)obj.destroy?.();
  entries=[];menu.clear();open=false;
  if(scene.fase==='torre2-select')scene.fase='lucha';
 };
 function showParty(){
  if(scene.__torre2Changing||scene.fase!=='lucha')return;
  if(open){close();return}
  open=true;scene.fase='torre2-select';
  menu.fillStyle(0x061726,.97);
  menu.fillRect(118,88,396,204);
  menu.lineStyle(2,0xf1ca7b);menu.strokeRoundedRect(118,88,396,204,8);
  entries.push(label(scene,316,111,'ESCOLHA UM POKÉMON',15,'#fff0bf',2602));
  party.friend.forEach((m,i)=>{
   const col=i%2,row=Math.floor(i/2),x=220+col*199,y=148+row*40;
   const selected=i===party.playerIndex,dead=m.hp<=0;
   const c=label(scene,x,y,(selected?'▶ ':'')+m.id.toUpperCase()+
     (dead?' · K.O.':' · '+Math.ceil(m.hp)+'%'),10,
      dead?'#9ca9b3':selected?'#ffdb85':'#ddf8f0',2602);
   entries.push(c);
   if(!selected&&!dead){
    entries.push(scene.add.zone(x,y,189,30).setDepth(2605)
     .setInteractive({useHandCursor:true}).on('pointerdown',()=>{
      close();recall(0,i);
     }));
   }
  });
  const exit=label(scene,320,277,'✕ VOLTAR',11,'#ffc7b3',2602);
  entries.push(exit,scene.add.zone(320,275,100,28).setDepth(2605)
   .setInteractive({useHandCursor:true}).on('pointerdown',close));
 }
 // A native clickable Pokémon switch (mouse and touch) independent of
 // the Arena 2D ability buttons. Only available with living reserves.
 const switchHit=scene.add.zone(320,88,177,30).setDepth(2500)
  .setInteractive({useHandCursor:true}).on('pointerdown',showParty);
 // If the native engine sets 0 HP without invoking alKO (some move/status
 // paths do), the campaign still recalls the fainted fighter exactly once.
 const monitorKo=()=>{
  if(!scene.scene.isActive()||scene.__torre2Changing||
     scene.fase!=='lucha')return;
  const fainted=actors.find(a=>a&&!a.inmortal&&a.hp<=0);
  if(fainted)scene.alKO(fainted);
 };
 scene.game.events.on('step',monitorKo);
 scene.events.once('shutdown',()=>{
  scene.game.events.off('step',monitorKo);
  close();scene.__torre2PartyInstalled=false;
  sharedBeam.destroy();sharedBall.destroy();graphics.destroy();
 });
}
