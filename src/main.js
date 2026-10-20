import {WORLD,MOVES,GYMS,createBattle,consumeEvents,cast,dodge,movePlayer,tick,vector,clamp} from './combat-core.js';
import {makeArena} from './arena-stadium-v06.js';
import {buildAtlases,buildImpactAtlases,createImpact,renderImpact} from './effects-v08.js';
import {installSpriteCollab} from './spritecollab-v02.js';
import {buildBrockAtlas,spawnDust,stepDust} from './brock-v04.js';
import {stickVector,keyboardOrStick} from './joystick.js';
const P=window.PIXI;
const status=document.getElementById('status');
const canvasHost=document.getElementById('game');
const overlay=document.getElementById('end-screen');
const log=document.getElementById('battle-log');
const scoreboard=document.getElementById('scoreboard');
const buttons=[...document.querySelectorAll('[data-move]')];
let app,battle,stage,atlases,impactAtlases,brockAtlas,attackVisuals=new Map(),enemyVisuals=new Map(),impacts=[],stoneDust=[],pointTarget=null;
let previousActors={player:null,enemy:null},screenShake=0;
const mobileView=typeof window.matchMedia==='function'&&window.matchMedia('(max-width:710px)').matches;
const viewport=mobileView?{width:660,height:660,zoom:1.1}:{width:WORLD.width,height:WORLD.height,zoom:1};
let camera={x:0,y:0};
const held=new Set();
const stickState={x:0,y:0,pointerId:null,active:false};
let joystickElement=null,joystickThumb=null;
const logLines=[];
let metrics={renderedEffectFrames:0,createdEffectSprites:0,impactVfx:0};
let actorArt=[];
let activeBank='fire';
const MOVE_BANKS={fire:['ember','flamethrower','firespin','fireblast'],nature:['watergun','bubblebeam','vinewhip','thunderbolt']};
function message(t){
 logLines.unshift(t);logLines.length=Math.min(logLines.length,4);
 log.textContent=logLines.join(' · ');
}
function createEngine(){
 if(!P||!P.Application)throw new Error('PixiJS indisponível. Verifique a conexão.');
 app=new P.Application({width:viewport.width,height:viewport.height,backgroundColor:0x315f3c,
  resolution:Math.min(2,window.devicePixelRatio||1),autoDensity:true,
  antialias:false,powerPreference:'high-performance',autoStart:true});
 if(!app.renderer?.gl)throw new Error('Pokémon Torre 2 requer WebGL neste navegador.');
 P.settings.SCALE_MODE=P.SCALE_MODES.NEAREST;
 canvasHost.appendChild(app.view);
 app.view.setAttribute('aria-label','Arena de Pewter, batalha Pokémon Torre 2');
 app.view.style.width='100%';app.view.style.height='100%';
 battle=createBattle();
 stage=makeArena(P);app.stage.addChild(stage.root);
 stage.root.scale.set(viewport.zoom);
 installSpriteCollab(P,stage,states=>{actorArt=states;}).catch(err=>console.warn('Optional SpriteCollab actors unavailable:',err.message));
 atlases=buildAtlases(P,app);
 impactAtlases=buildImpactAtlases(P,app);
 brockAtlas=buildBrockAtlas(P,app);
 app.stage.eventMode='static';
 app.stage.hitArea=new P.Rectangle(0,0,viewport.width,viewport.height);
 const mapPoint=(event)=>{
  if(event.global?.x==null)return;
  const pos=stage.root.toLocal(event.global);
  pointTarget={x:clamp(pos.x,0,WORLD.width),y:clamp(pos.y,0,WORLD.height)};
 };
 app.stage.on('pointermove',mapPoint);
 app.stage.on('pointerdown',mapPoint);
 createUI();
 app.ticker.add(()=>step(app.ticker.deltaMS/1000));
 status.textContent='WebGL ativo · Estádio de Pewter';
 window.PokemonTorre2={
  version:'0.8.0-battle-laboratory',
  snapshot:()=>({status:battle.status,gym:battle.gym,player:{...battle.player},enemy:{...battle.enemy},
    castCount:battle.castCount,kills:battle.kills,badges:battle.badges,
    effectsActive:attackVisuals.size,enemyEffectsActive:enemyVisuals.size,
    shotsAgainstPlayer:battle.enemyShots.length,metrics:{...metrics},actorArt:actorArt.slice(),
    viewport:{...viewport,cameraX:camera.x,cameraY:camera.y},
    joystick:{active:stickState.active,x:stickState.x,y:stickState.y,pointerId:stickState.pointerId},
    arenaStyle:stage.arenaStyle,moveBank:activeBank,availableMoves:Object.keys(MOVES), 
    animations:{player:stage.player.__pmd?.state?.mode||'fallback',enemy:(battle.enemy.id==='geodude'?stage.enemyRock:stage.enemyOnix).__pmd?.state?.mode||'fallback'},
    renderer:app.renderer.gl?'webgl':'unavailable'}),
  cast:(id)=>tryMove(id),selectBank:(bank)=>selectBank(bank),restart:()=>restart(),
  proof:{originalProjectUntouched:true,moveSource:'original PixiJS pixel art',sourceGame:'none'}
 };
 message('Brock aguarda! Joystick analógico · Fogo ou laboratório de golpes · Esquiva');
}
function createUI(){
 for(const tab of document.querySelectorAll('[data-bank]')){
  tab.addEventListener('click',()=>selectBank(tab.dataset.bank));
 }
 const full=document.getElementById('fullscreen');
 full?.addEventListener('click',async()=>{
  try{
   if(document.fullscreenElement){await document.exitFullscreen();return;}
   await document.querySelector('.app-shell').requestFullscreen();
   if(screen.orientation?.lock){try{await screen.orientation.lock('landscape')}catch(_){}}
  }catch(error){message('O navegador não permitiu tela cheia: '+error.message)}
 });
 for(const button of buttons){
  button.addEventListener('click',event=>{
   event.preventDefault();tryMove(button.dataset.move);
  });
 }
 document.getElementById('restart').addEventListener('click',restart);
 document.getElementById('reset').addEventListener('click',restart);
 // Pointer capture keeps movement responsive even if a finger drifts off the ring.
 joystickElement=document.getElementById('movement-stick');
 joystickThumb=document.getElementById('movement-thumb');
 const showStick=()=>{
  joystickThumb.style.transform='translate3d('+stickState.offsetX+'px,'+stickState.offsetY+'px,0px)';
  joystickElement.classList.toggle('is-active',stickState.active);
 };
 const updateStick=event=>{
  const v=stickVector(event.clientX,event.clientY,joystickElement.getBoundingClientRect());
  Object.assign(stickState,v);
  showStick();
 };
 const resetStick=()=>{
  stickState.x=0;stickState.y=0;stickState.offsetX=0;stickState.offsetY=0;
  stickState.active=false;stickState.pointerId=null;
  showStick();
 };
 joystickElement.addEventListener('pointerdown',event=>{
  if(stickState.pointerId!==null)return;
  if(event.pointerType==='mouse'&&event.button!==0)return;
  event.preventDefault();
  stickState.pointerId=event.pointerId;
  stickState.active=true;
  try{joystickElement.setPointerCapture(event.pointerId)}catch(_){}
  updateStick(event);
 });
 joystickElement.addEventListener('pointermove',event=>{
  if(stickState.pointerId!==event.pointerId)return;
  event.preventDefault();updateStick(event);
 });
 for(const name of ['pointerup','pointercancel','lostpointercapture']){
  joystickElement.addEventListener(name,event=>{
   if(event.pointerId!==stickState.pointerId)return;
   resetStick();
  });
 }
 joystickElement.addEventListener('keydown',event=>{
  // Accessible joystick for users without touch: arrows/WASD remain supported.
  if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(event.key))
   event.preventDefault();
 });
 const dodgeBtn=document.getElementById('dodge');
 dodgeBtn.addEventListener('click',()=>{const d=movement();dodge(battle,Math.hypot(d.x,d.y)>0?d:vector(battle.player,battle.enemy))});
 window.addEventListener('keydown',event=>{
  const key=event.key.toLowerCase();
  if([' ','arrowup','arrowdown','arrowleft','arrowright'].includes(key))event.preventDefault();
  held.add(key);
  if(event.repeat)return;
  if(['1','2','3','4'].includes(key))tryMove(MOVE_BANKS[activeBank][Number(key)-1]);
  if(key===' '){const m=movement();dodge(battle,Math.hypot(m.x,m.y)>0?m:vector(battle.player,battle.enemy));}
 });
 window.addEventListener('keyup',e=>held.delete(e.key.toLowerCase()));
 window.addEventListener('blur',()=>{held.clear();resetStick();});
 document.addEventListener('visibilitychange',()=>{if(document.hidden){held.clear();resetStick();}});
}
function movement(){
 return keyboardOrStick(held,stickState);
}
function selectBank(bank){
 if(!MOVE_BANKS[bank])return false;
 activeBank=bank;
 for(const panel of document.querySelectorAll('[data-bank-panel]')){
  panel.hidden=panel.dataset.bankPanel!==bank;
 }
 for(const tab of document.querySelectorAll('[data-bank]')){
  const pressed=tab.dataset.bank===bank;
  tab.classList.toggle('selected',pressed);
  tab.setAttribute('aria-pressed',String(pressed));
 }
 message(bank==='fire'?'Golpes de fogo prontos':'Laboratório elemental ativo: 4 golpes originais em teste');
 return true;
}
function tryMove(id){
 const aim=pointTarget&&Math.hypot(pointTarget.x-battle.player.x,pointTarget.y-battle.player.y)>40
   ?pointTarget:battle.enemy;
 const castResult=cast(battle,id,aim);
 if(!castResult.ok){
  if(castResult.reason==='cooldown')message('Aguarde a recarga de '+MOVES[id].name);
  if(castResult.reason==='energy')message('Energia insuficiente');
 }
 return castResult;
}
function renderModels(){
 const p=battle.player,e=battle.enemy;
 stage.player.position.set(Math.round(p.x),Math.round(p.y-13+Math.sin(battle.t*6)*1.5));
 stage.player.alpha=p.invulnerable>0&&Math.floor(battle.t*15)%2===0?.65:1;
 stage.enemyRock.visible=e.id==='geodude';
 stage.enemyOnix.visible=e.id==='onix';
 const sprite=e.id==='geodude'?stage.enemyRock:stage.enemyOnix;
 sprite.position.set(Math.round(e.x),Math.round(e.y-5+Math.sin(battle.t*4)*1));
 stage.shadow.position.set(Math.round(p.x),Math.round(p.y+21));
 stage.shadow.zIndex=p.y-1;
 stage.player.zIndex=p.y;
 stage.enemyRock.zIndex=e.y;
 stage.enemyOnix.zIndex=e.y;
 const playerDelta=previousActors.player?{x:p.x-previousActors.player.x,y:p.y-previousActors.player.y}:{x:0,y:0};
 const enemyDelta=previousActors.enemy?{x:e.x-previousActors.enemy.x,y:e.y-previousActors.enemy.y}:{x:0,y:0};
 stage.player.__pmd?.update(battle.t,playerDelta.x,playerDelta.y,e.x-p.x,e.y-p.y);
 sprite.__pmd?.update(battle.t,enemyDelta.x,enemyDelta.y,p.x-e.x,p.y-e.y);
 previousActors={player:{x:p.x,y:p.y},enemy:{x:e.x,y:e.y}};
}
function addImpact(x,y,id){
 metrics.impactVfx++;
 const effect=createImpact(P,id,impactAtlases);
 effect.graphics.position.set(x,y);
 stage.vfx.addChild(effect.graphics);
 impacts.push(effect);
 screenShake=id==='fireblast'?4.2:id==='flamethrower'?1.4:.9;
}
function handleEvents(){
 for(const e of consumeEvents(battle)){
  if(e.type==='cast'){
   message('Charizard usou '+MOVES[e.move].name+'!');
   stage.player.__pmd?.action('Shoot',e.move==='fireblast'?.58:.38,battle.t);
  }
  if(e.type==='impact'){
   message(MOVES[e.move].name+' acertou: '+e.damage+' de dano'+(e.effective<1?' (não muito eficaz)':''));
   addImpact(e.x,e.y,e.move);
   const enemySprite=battle.enemy.id==='geodude'?stage.enemyRock:stage.enemyOnix;
   enemySprite.__pmd?.action('Hurt',.22,battle.t);
  }
  if(e.type==='miss')message(MOVES[e.move].name+' errou o alvo!');
  if(e.type==='clash'){
   const effect=createImpact(P,e.move,impactAtlases);
   effect.graphics.position.set(e.x,e.y);
   stage.vfx.addChild(effect.graphics);impacts.push(effect);
   screenShake=Math.max(screenShake,3.2);
   metrics.clashes=(metrics.clashes||0)+1;
   message('CHOQUE DE GOLPES! '+MOVES[e.move].name+' × Rock Throw');
  }
  if(e.type==='enemy-cast'){
   const enemySprite=e.enemy==='geodude'?stage.enemyRock:stage.enemyOnix;
   enemySprite.__pmd?.action('Shoot',.34,battle.t);
   message((e.enemy==='geodude'?'Geodude':'Onix')+' usou Rock Throw!');
  }
  if(e.type==='enemy-impact'){
   const puff=spawnDust(P,brockAtlas,e.x,e.y);
   stage.vfx.addChild(puff.sprite);stoneDust.push(puff);
   screenShake=Math.max(screenShake,2.2);
  }
  if(e.type==='enemy-defeated')message(e.enemy+' foi derrotado!');
  if(e.type==='next-enemy')message('Brock enviou '+e.enemy.toUpperCase()+'!');
  if(e.type==='player-hit'){
   message('Brock acertou '+e.damage+' de dano!');
   stage.player.__pmd?.action('Hurt',.30,battle.t);
  }
  if(e.type==='badge')endGame('Vitória!','Você ganhou a Insígnia Rocha de Brock.');
  if(e.type==='defeat')endGame('Fim da batalha','Seus Pokémon foram derrotados. Tente novamente!');
 }
}
function animateAttacks(delta){
 const current=new Set();
 for(const shot of battle.projectiles){
  current.add(shot.castId);
  let gfx=attackVisuals.get(shot.castId);
  if(!gfx){
   gfx=new P.Sprite(atlases[shot.id][0]);
   const beam=['flamethrower','watergun','vinewhip','thunderbolt'].includes(shot.id);
   gfx.anchor.set(beam?0:.5,.5);
   gfx.roundPixels=true;
   stage.vfx.addChild(gfx);attackVisuals.set(shot.castId,gfx);metrics.createdEffectSprites++;
  }
  const arr=atlases[shot.id];
  gfx.texture=arr[Math.floor(shot.age*(shot.id==='fireblast'?10:14))%arr.length];
  const angle=Math.atan2(shot.direction.y,shot.direction.x);
  if(['flamethrower','watergun','vinewhip','thunderbolt'].includes(shot.id)){
   // ONE continuous forward-growing stream, not detached generic fire balls.
   gfx.position.set(shot.origin.x,shot.origin.y);
   gfx.width=Math.max(14,shot.progress*shot.travel+18);
   gfx.height=shot.id==='thunderbolt'?91:shot.id==='vinewhip'?78:shot.id==='watergun'?51:65;
   gfx.rotation=angle;
  }else{
   gfx.position.set(shot.x,shot.y);
   gfx.rotation=shot.id==='fireblast'?0:(angle+(shot.id==='firespin'?shot.age*3:0));
   const size=shot.id==='fireblast'?96:shot.id==='firespin'?108:shot.id==='bubblebeam'?79:43;
   gfx.width=size;gfx.height=size;
  }
 }
 metrics.renderedEffectFrames+=current.size;
 for(const [id,gfx] of attackVisuals){
  if(!current.has(id)){gfx.parent?.removeChild(gfx);gfx.destroy();attackVisuals.delete(id);}
 }
 for(let i=impacts.length-1;i>=0;i--){
  const imp=impacts[i];
  if(!renderImpact(imp,delta)){
   imp.graphics.parent?.removeChild(imp.graphics);
   imp.graphics.destroy();impacts.splice(i,1);
  }
 }
 animateBrockRocks(delta);
 stage.updateLighting?.(battle.t,battle.projectiles);
 // Very short camera kick only at physical contact.
 screenShake=Math.max(0,screenShake-delta*24);
 // Smartphone: square combat viewport crops empty outer floor, tracks the
 // midpoint between active opponents, and keeps native pixel proportions.
 // Desktop remains the original fixed wide stadium.
 if(mobileView){
  const center=(battle.player.x+battle.enemy.x)/2;
  const targetX=clamp(viewport.width/2-center*viewport.zoom,
    viewport.width-WORLD.width*viewport.zoom,0);
  const targetY=(viewport.height-WORLD.height*viewport.zoom)/2;
  camera.x+=(targetX-camera.x)*Math.min(1,delta*7.5);
  camera.y+=(targetY-camera.y)*Math.min(1,delta*7.5);
 }else{camera.x=0;camera.y=0;}
 stage.root.position.set(camera.x+(screenShake?Math.sin(battle.t*75)*screenShake:0),
   camera.y+(screenShake?Math.cos(battle.t*91)*screenShake*.65:0));
}
function animateBrockRocks(dt){
 const active=new Set();
 for(const shot of battle.enemyShots){
  active.add(shot.id);
  let gfx=enemyVisuals.get(shot.id);
  if(!gfx){
   gfx=new P.Sprite(brockAtlas[shot.owner][0]);
   gfx.anchor.set(.5,.5);gfx.roundPixels=true;
   gfx.width=shot.owner==='onix'?51:38;
   gfx.height=shot.owner==='onix'?51:38;
   stage.vfx.addChild(gfx);enemyVisuals.set(shot.id,gfx);
   metrics.enemyProjectileSprites=(metrics.enemyProjectileSprites||0)+1;
  }
  gfx.position.set(Math.round(shot.x),Math.round(shot.y));
  gfx.texture=brockAtlas[shot.owner][Math.floor(shot.age*15)%8];
  gfx.rotation=shot.age*4;
  const lift=Math.sin(Math.PI*shot.progress);
  gfx.scale.set((shot.owner==='onix'?.56:.44)*(1+.14*lift));
 }
 for(const [id,gfx] of enemyVisuals)if(!active.has(id)){
  gfx.parent?.removeChild(gfx);gfx.destroy();enemyVisuals.delete(id);
 }
 for(let i=stoneDust.length-1;i>=0;i--){
  const d=stoneDust[i];
  if(!stepDust(d,dt,brockAtlas)){
   d.sprite.parent?.removeChild(d.sprite);d.sprite.destroy();stoneDust.splice(i,1);
  }
 }
}
let uiTimer=0;
function paintUI(){
 const p=battle.player,e=battle.enemy;
 document.getElementById('p-name').textContent=p.name+' · Nv.'+p.level;
 document.getElementById('e-name').textContent=e.name+' · Nv.'+e.level;
 document.getElementById('p-hp').style.width=(p.hp/p.maxHp*100).toFixed(1)+'%';
 document.getElementById('e-hp').style.width=(e.hp/e.maxHp*100).toFixed(1)+'%';
 document.getElementById('hp-text').textContent=Math.ceil(p.hp)+'/'+p.maxHp;
 document.getElementById('e-hp-text').textContent=Math.ceil(e.hp)+'/'+e.maxHp;
 document.getElementById('energy-bar').style.width=p.energy+'%';
 document.getElementById('energy-text').textContent=Math.floor(p.energy)+' / 100';
 scoreboard.textContent='Ginásio de Pewter · Brock · '+battle.kills+'/2 Pokémon';
 for(const button of buttons){
  const move=MOVES[button.dataset.move],cd=p.cooldowns[move.id];
  button.classList.toggle('cooldown',cd>0||p.energy<move.cost);
  button.querySelector('.cd').textContent=cd>0?cd.toFixed(1)+'s':move.cost+' EN';
 }
}
function step(dt){
 if(!battle)return;
 const m=movement();if(m.x||m.y)movePlayer(battle,m.x,m.y,dt);
 tick(battle,dt);renderModels();handleEvents();animateAttacks(dt);
 uiTimer+=dt;if(uiTimer>.085){paintUI();uiTimer=0;}
}
function endGame(title,subtitle){
 document.getElementById('end-title').textContent=title;
 document.getElementById('end-desc').textContent=subtitle;
 overlay.hidden=false;paintUI();
}
function restart(){
 for(const [,g] of attackVisuals){g.parent?.removeChild(g);g.destroy();}
 for(const [,g] of enemyVisuals){g.parent?.removeChild(g);g.destroy();}
 enemyVisuals.clear();
 for(const d of stoneDust){d.sprite.parent?.removeChild(d.sprite);d.sprite.destroy();}
 stoneDust=[];
 attackVisuals.clear();
 for(const imp of impacts){imp.graphics.parent?.removeChild(imp.graphics);imp.graphics.destroy();}
 impacts=[];
 battle=createBattle();pointTarget=null;overlay.hidden=true;
 stickState.x=0;stickState.y=0;stickState.offsetX=0;stickState.offsetY=0;
 stickState.pointerId=null;stickState.active=false;
 if(joystickThumb)joystickThumb.style.transform='translate3d(0,0,0)';
 joystickElement?.classList.remove('is-active');
 previousActors={player:null,enemy:null};screenShake=0;
 camera={x:0,y:0};stage.root.position.set(0,0);
 metrics={renderedEffectFrames:0,createdEffectSprites:0,impactVfx:0,enemyProjectileSprites:0,clashes:0};
 logLines.length=0;message('Batalha reiniciada no Ginásio de Pewter');paintUI();
}
try{createEngine();paintUI();}catch(error){
 status.textContent='Falha de WebGL: '+error.message;status.classList.add('error');
 console.error(error);
}
