/* Pokémon Torre 2 — party battles, campaign only.
 * The original Phaser combat/VFX remain untouched. Manual switching and
 * knockouts transition to the next Pokémon without advancing trainer progress.
 * The fight ends only when one entire party is defeated.
 */
import {GYMS} from './campaign-core.js';
import {resolveLoadout} from './move-pool.js';

const clamp=v=>Math.max(0,Math.min(100,Number(v)||0));
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
function dot(scene,x,y,alive,isActive,depth=2480){
 const g=scene.add.graphics().setDepth(depth);
 const ring=alive?0xe7f6ed:0x597183;
 g.lineStyle(1,ring,1);g.strokeCircle(x,y,5);
 g.fillStyle(alive?0xe85558:0x36424e,alive?1:.85);
 g.fillRect(x-4,y-3,8,3);
 g.fillStyle(alive?0xf5fcf3:0x72818d,.94);g.fillRect(x-4,y,8,3);
 g.fillStyle(0x192838);g.fillRect(x-5,y-1,10,2);
 g.fillStyle(isActive?0xffe790:0xe4e9e8);g.fillRect(x-1,y-2,3,4);
 return g;
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
  const tx=actor.x,ty=actor.y-actor.alto*.5;
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
 graphics.fillStyle(0x082339,.91);
 graphics.fillRoundedRect(12,74,177,37,4);
 graphics.fillRoundedRect(448,74,180,37,4);
 label(scene,85,82,'SUA EQUIPE',9,'#d1f6eb');
 label(scene,551,82,payload.kind==='wild'?'SELVAGEM':'EQUIPE RIVAL',9,'#ffe4d5');
 const drawIcons=(arr,active,x)=>{
  for(let i=0;i<arr.length;i++)dot(scene,x+i*17,101,arr[i].hp>0,i===active);
 };
 drawIcons(party.friend,party.playerIndex,30);
 drawIcons(party.foes,party.enemyIndex,470);
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
  const actor=actors[side],from={x:side===0?72:567,y:288};
  const fx=scene.add.graphics().setDepth(2603);
  const px=actor.x,py=actor.y-Math.max(18,actor.alto*.6);
  const ball=scene.add.graphics().setDepth(2604);
  const drawBall=()=>{
   ball.clear();ball.fillStyle(0x101d2e);
   ball.fillCircle(from.x,from.y,8);
   ball.fillStyle(0xe95359);ball.fillRect(from.x-6,from.y-6,12,6);
   ball.fillStyle(0xffffff);ball.fillRect(from.x-6,from.y,12,6);
   ball.lineStyle(2,0x192c39);ball.strokeCircle(from.x,from.y,8);
   ball.fillStyle(0xfff4d2);ball.fillCircle(from.x,from.y,2);
  };
  drawBall();
  let frames=0,restarted=false;
  const enterNext=()=>{
   if(restarted||!scene.scene.isActive())return;
   restarted=true;
   scene.game.events.off('step',step);
   if(side===0)party.playerIndex=next;
   else party.enemyIndex=next;
   party.changes++;
   const left=party.friend[party.playerIndex],right=party.foes[party.enemyIndex];
   scene.scene.restart({...scene.datos,p1:left.id,p2:right.id,
    torre2:{...payload,party,lastSwitchedSide:side,
     playerLevel:left.level,enemyLevel:right.level},
    torre2Loadout:left.loadout,torre2OpponentLoadout:right.loadout});
  };
  // A global frame-step remains live during native KO hitstop. The original
  // combat scene's local clock/tween may be suspended for animations, which
  // previously left battles frozen for good at the replacement moment.
  const step=()=>{
   if(!scene.scene.isActive()){scene.game.events.off('step',step);return}
   scene.fase='ko';
   const t=Math.min(1,++frames/36);
   fx.clear();
   fx.lineStyle(2+3*(1-t),0xff525f,.9);
   fx.lineBetween(from.x,from.y,px,py);
   fx.lineStyle(1,0xffe2cb,1);
   fx.lineBetween(from.x,from.y,px,py);
   fx.fillStyle(0xff4e63,.35*(1-t));
   fx.fillTriangle(from.x,from.y,px-16*(1-t),py,px+16*(1-t),py);
   if(actor.spr?.active){
    actor.spr.setAlpha(Math.max(.05,1-t));
    actor.spr.setScale(Math.max(.06,1-t*.85));
   }
   if(frames>=40)enterNext();
  };
  if(kind==='faint'){
   // Native KO may suspend both scene timers and global render callbacks.
   // Dispatch the replacement immediately instead of risking a frozen game;
   // the following scene paints the Pokéball release / red beam.
   fx.clear();
   fx.lineStyle(5,0xff5166,1);
   fx.lineBetween(from.x,from.y,px,py);
   if(actor.spr?.active)actor.spr.setAlpha(.05);
   enterNext();
   return;
  }
  scene.game.events.on('step',step);
  scene.events.once('shutdown',()=>scene.game.events.off('step',step));
 }
 function finish(won){
  scene.fase='ko';
  syncHp();
  // One winner is enough for a Kanto trainer: the original client's
  // best-of-three round loop is excluded ONLY from Torre 2 party battles.
  scene.victorias=won?[1,0]:[0,1];
  announce(won?'EQUIPE RIVAL DERROTADA!':'TODOS OS POKÉMON DESMAIARAM!');
  scene.time.delayedCall(850,()=>scene.scene.isActive()&&scene.resultado());
 }
 // Trigger directly on native knockout. Disabled for every other game mode.
 scene.alKO=caido=>{
  if(scene.fase!=='lucha')return;
  const side=caido.lado,arr=side===0?party.friend:party.foes;
  const pos=side===0?party.playerIndex:party.enemyIndex;
  scene.fase='ko';
  syncHp();arr[pos].hp=0;
  const next=arr.findIndex((m,i)=>i!==pos&&m.hp>0);
  if(next<0){finish(side===1);return}
  announce(side===0?'POKÉMON DESMAIOU!':'RIVAL VAI TROCAR!');
  scene.time.delayedCall(450,()=>recall(side,next,'faint'));
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
  menu.fillRoundedRect(118,88,396,204,8);
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
 const switchText=label(scene,322,89,'TROCAR POKÉMON ▾',10,'#ffe7a3',2482);
 const switchHit=scene.add.zone(320,88,177,30).setDepth(2500)
  .setInteractive({useHandCursor:true}).on('pointerdown',showParty);
 scene.events.once('shutdown',()=>{
  close();scene.__torre2PartyInstalled=false;
 });
}
