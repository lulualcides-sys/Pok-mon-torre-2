import {WORLD,MOVES,GYMS,createBattle,consumeEvents,cast,dodge,movePlayer,tick,vector,clamp} from './combat-core.js';
import {makeArena} from './arena-v03.js';
import {buildAtlases,buildImpactAtlases,createImpact,renderImpact} from './effects-v03.js';
import {installSpriteCollab} from './spritecollab-v02.js';
const P=window.PIXI;
const status=document.getElementById('status');
const canvasHost=document.getElementById('game');
const overlay=document.getElementById('end-screen');
const log=document.getElementById('battle-log');
const scoreboard=document.getElementById('scoreboard');
const buttons=[...document.querySelectorAll('[data-move]')];
let app,battle,stage,atlases,impactAtlases,attackVisuals=new Map(),impacts=[],pointTarget=null;
let previousActors={player:null,enemy:null},screenShake=0;
const held=new Set(),fingerDirs=new Set();
const input={x:0,y:0};
const logLines=[];
let metrics={renderedEffectFrames:0,createdEffectSprites:0,impactVfx:0};
let actorArt=[];
function message(t){
 logLines.unshift(t);logLines.length=Math.min(logLines.length,4);
 log.textContent=logLines.join(' · ');
}
function createEngine(){
 if(!P||!P.Application)throw new Error('PixiJS indisponível. Verifique a conexão.');
 app=new P.Application({width:WORLD.width,height:WORLD.height,backgroundColor:0x14232b,
  resolution:Math.min(2,window.devicePixelRatio||1),autoDensity:true,
  antialias:false,powerPreference:'high-performance',autoStart:true});
 if(!app.renderer?.gl)throw new Error('Pokémon Torre 2 requer WebGL neste navegador.');
 P.settings.SCALE_MODE=P.SCALE_MODES.NEAREST;
 canvasHost.appendChild(app.view);
 app.view.setAttribute('aria-label','Arena de Pewter, batalha Pokémon Torre 2');
 app.view.style.width='100%';app.view.style.height='100%';
 battle=createBattle();
 stage=makeArena(P);app.stage.addChild(stage.root);
 installSpriteCollab(P,stage,states=>{actorArt=states;}).catch(err=>console.warn('Optional SpriteCollab actors unavailable:',err.message));
 atlases=buildAtlases(P,app);
 impactAtlases=buildImpactAtlases(P,app);
 app.stage.eventMode='static';
 app.stage.hitArea=new P.Rectangle(0,0,WORLD.width,WORLD.height);
 app.stage.on('pointermove',event=>{if(event.global?.x!=null)pointTarget={x:event.global.x,y:event.global.y};});
 app.stage.on('pointerdown',event=>{if(event.global?.x!=null)pointTarget={x:event.global.x,y:event.global.y};});
 createUI();
 app.ticker.add(()=>step(app.ticker.deltaMS/1000));
 status.textContent='WebGL ativo · Ginásio de Pewter';
 window.PokemonTorre2={
  version:'0.3.0-fidelity',
  snapshot:()=>({status:battle.status,gym:battle.gym,player:{...battle.player},enemy:{...battle.enemy},
    castCount:battle.castCount,kills:battle.kills,badges:battle.badges,
    effectsActive:attackVisuals.size,metrics:{...metrics},actorArt:actorArt.slice(),
    animations:{player:stage.player.__pmd?.state?.mode||'fallback',enemy:(battle.enemy.id==='geodude'?stage.enemyRock:stage.enemyOnix).__pmd?.state?.mode||'fallback'},
    renderer:app.renderer.gl?'webgl':'unavailable'}),
  cast:(id)=>tryMove(id),restart:()=>restart(),
  proof:{originalProjectUntouched:true,moveSource:'original PixiJS pixel art',sourceGame:'none'}
 };
 message('Brock aguarda! Controles WASD · 1–4 golpes · Espaço esquiva');
}
function createUI(){
 for(const button of buttons){
  button.addEventListener('click',event=>{
   event.preventDefault();tryMove(button.dataset.move);
  });
 }
 document.getElementById('restart').addEventListener('click',restart);
 document.getElementById('reset').addEventListener('click',restart);
 for(const btn of document.querySelectorAll('[data-dir]')){
  const dir=btn.dataset.dir;
  btn.addEventListener('pointerdown',event=>{event.preventDefault();btn.setPointerCapture?.(event.pointerId);fingerDirs.add(dir);});
  for(const evt of ['pointerup','pointercancel','lostpointercapture'])
   btn.addEventListener(evt,()=>fingerDirs.delete(dir));
 }
 const dodgeBtn=document.getElementById('dodge');
 dodgeBtn.addEventListener('click',()=>{const d=movement();dodge(battle,Math.hypot(d.x,d.y)>0?d:vector(battle.player,battle.enemy))});
 window.addEventListener('keydown',event=>{
  const key=event.key.toLowerCase();
  if([' ','arrowup','arrowdown','arrowleft','arrowright'].includes(key))event.preventDefault();
  held.add(key);
  if(event.repeat)return;
  if(key==='1')tryMove('ember');
  if(key==='2')tryMove('flamethrower');
  if(key==='3')tryMove('firespin');
  if(key==='4')tryMove('fireblast');
  if(key===' '){const m=movement();dodge(battle,Math.hypot(m.x,m.y)>0?m:vector(battle.player,battle.enemy));}
 });
 window.addEventListener('keyup',e=>held.delete(e.key.toLowerCase()));
 window.addEventListener('blur',()=>{held.clear();fingerDirs.clear();});
}
function movement(){
 const has=k=>held.has(k)||fingerDirs.has(k);
 return {x:Number(has('d')||has('arrowright')||has('right'))-
           Number(has('a')||has('arrowleft')||has('left')),
  y:Number(has('s')||has('arrowdown')||has('down'))-
    Number(has('w')||has('arrowup')||has('up'))};
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
   gfx.anchor.set(shot.id==='flamethrower'?0:.5,.5);
   gfx.roundPixels=true;
   stage.vfx.addChild(gfx);attackVisuals.set(shot.castId,gfx);metrics.createdEffectSprites++;
  }
  const arr=atlases[shot.id];
  gfx.texture=arr[Math.floor(shot.age*(shot.id==='fireblast'?10:14))%arr.length];
  const angle=Math.atan2(shot.direction.y,shot.direction.x);
  if(shot.id==='flamethrower'){
   // ONE continuous forward-growing stream, not detached generic fire balls.
   gfx.position.set(shot.origin.x,shot.origin.y);
   gfx.width=Math.max(14,shot.progress*shot.travel+18);
   gfx.height=41;
   gfx.rotation=angle;
  }else{
   gfx.position.set(shot.x,shot.y);
   gfx.rotation=shot.id==='fireblast'?0:(angle+(shot.id==='firespin'?shot.age*3:0));
   const size=shot.id==='fireblast'?96:shot.id==='firespin'?108:43;
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
 stage.updateLighting?.(battle.t,battle.projectiles);
 // Very short camera kick only at physical contact.
 screenShake=Math.max(0,screenShake-delta*24);
 stage.root.position.set(screenShake?Math.sin(battle.t*75)*screenShake:0,
    screenShake?Math.cos(battle.t*91)*screenShake*.65:0);
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
 attackVisuals.clear();
 for(const imp of impacts){imp.graphics.parent?.removeChild(imp.graphics);imp.graphics.destroy();}
 impacts=[];
 battle=createBattle();pointTarget=null;overlay.hidden=true;
 previousActors={player:null,enemy:null};screenShake=0;
 stage.root.position.set(0,0);
 metrics={renderedEffectFrames:0,createdEffectSprites:0,impactVfx:0};
 logLines.length=0;message('Batalha reiniciada no Ginásio de Pewter');paintUI();
}
try{createEngine();paintUI();}catch(error){
 status.textContent='Falha de WebGL: '+error.message;status.classList.add('error');
 console.error(error);
}
