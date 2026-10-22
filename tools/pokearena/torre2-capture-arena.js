/* Pokémon Torre 2 — animated FireRed-style single-ball capture.
 * One ball = one throw, one red recall beam and up to three shakes.
 * Four internal RNG checks determine the outcome, never four attempts.
 * Separate from approved Arena 2D Pokémon sprites and move effects.
 */
import {captureChance} from './capture-mechanics.js';
import {drawBallSprite} from './ball-sprites.js';
import {readCampaign,attemptCapture} from './campaign-core.js';
const FONT='Pixelify Sans,monospace';
function px(g,x,y,w,h,c,a=1){g.fillStyle(c,a);g.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));}
// One ball atlas drives captures, party switch, and Pokéball HUD.
export function drawCaptureBall(g,cx,cy,kind='pokeball',scale=2,rotation=0,opened=false){
 return drawBallSprite(g,cx,cy,kind,scale,rotation,opened);
}
function txt(scene,x,y,value,size=11,color='#f5f4e5'){
 return scene.add.text(x,y,value,{fontFamily:FONT,fontSize:size+'px',
  fontStyle:'bold',color,stroke:'#0a233b',strokeThickness:3}).setDepth(1206);
}
function frame(scene,x,y,w,h){
 const g=scene.add.graphics().setDepth(1203);
 px(g,x+2,y+3,w,h,0x061120);
 px(g,x,y,w,h,0x091b2c);px(g,x+1,y+1,w-2,h-2,0xf0d07d);
 px(g,x+3,y+3,w-6,h-6,0x113952);px(g,x+5,y+4,w-10,2,0x67b8a2);
 return g;
}
function hit(scene,x,y,w,h,onClick){
 return scene.add.zone(x,y,w,h).setDepth(1215).setInteractive({useHandCursor:true})
 .on('pointerdown',onClick);
}
function statusName(enemy){
 const raw=enemy?.status?.nombre??enemy?.estado?.nombre??enemy?.estado??
  enemy?.est?.estado??enemy?.statuses?.map(x=>x?.name||x?.tipo).join(' ')??'';
 return typeof raw==='string'?raw:'';
}
function enemyPortrait(enemy){
 const s=enemy?.spr||enemy?.sprite;
 if(s?.setAlpha&&s?.setScale)return s;
 return null;
}
function artBeam(g,ballX,ballY,enemyX,enemyY,t){
 // Narrow red cone from the opened ball TO the enemy; growing brighter
 // and contracting as the Pokémon is recalled.
 const spread=18*(1-t*.8),a=1-t*.65;
 g.fillStyle(0xf33152,.24*a);
 g.fillTriangle(ballX,ballY,enemyX-spread,enemyY-spread,enemyX+spread,enemyY+spread);
 g.lineStyle(5,0xff5267,.38*a);g.lineBetween(ballX,ballY,enemyX,enemyY);
 g.lineStyle(2,0xffb0aa,.92*a);g.lineBetween(ballX,ballY,enemyX,enemyY);
 for(let i=0;i<10;i++){
  const f=(i*.19+t*.41)%1.0,jitter=Math.sin(i*6.3+t*11)*spread*.6;
  const x=ballX+(enemyX-ballX)*f,y=ballY+(enemyY-ballY)*f+jitter;
  px(g,x,y,i%3===0?4:2,2,i%3?0xff6b76:0xffe4b7,Math.max(.15,a));
 }
}
export function installWildCapture(scene){
 if(scene.__torre2WildCapture||scene.datos?.torre2?.kind!=='wild')return;
 const enemy=scene.luchadores?.[1];
 if(!enemy?.hpMax)return;
 scene.__torre2WildCapture=true;
 const hud=frame(scene,458,41,169,42);
 txt(scene,467,47,'BOLSA  /  POKÉBOLA',11,'#fff0b9');
 const hpLine=txt(scene,469,65,'HP 100% · ENFRAQUEÇA',10,'#a9ead3');
 hit(scene,539,61,171,42,showChoices);
 let menu=[],busy=false,activeVisuals=[];
 const cleanup=()=>{
  scene.events.off('update',refresh);
  scene.__torre2WildCapture=false;
  for(const item of activeVisuals)item.destroy?.();
  activeVisuals=[];
 };
 scene.events.once('shutdown',cleanup);
 function refresh(){
  if(!scene.scene.isActive()||!enemy.hpMax)return;
  const percent=Math.max(0,Math.ceil(100*enemy.hp/enemy.hpMax));
  hpLine.setText('HP '+percent+'% · '+(percent<=25?'BOA CHANCE':
   percent<=50?'ENFRAQUECIDO':'ENFRAQUEÇA'));
 }
 scene.events.on('update',refresh);refresh();
 function add(item){menu.push(item);return item}
 function close(){for(const item of menu)item.destroy?.();menu=[]}
 function showChoices(){
  if(busy||enemy.hp<=0)return;
  close();
  const state=readCampaign();if(!state?.pendingWild)return;
  add(frame(scene,173,109,299,169));
  add(txt(scene,188,119,'LANÇAR POKÉBOLA',15,'#ffe5a4'));
  const hp=Math.max(1,Math.ceil(enemy.hp/enemy.hpMax*100));
  add(txt(scene,187,142,state.pendingWild.id.toUpperCase()+
   ' · HP '+hp+'%',11,'#d2f5e5'));
  const labels={pokeball:'POKÉ BALL',greatball:'GREAT BALL',ultraball:'ULTRA BALL'};
  for(const [i,kind]of ['pokeball','greatball','ultraball'].entries()){
   const y=178+i*27,owned=state.inventory[kind]||0;
   const draw=add(scene.add.graphics().setDepth(1208));
   drawCaptureBall(draw,200,y+4,kind,1);
   const chance=captureChance({...state.pendingWild,wild:true,hpPercent:hp,
    status:statusName(enemy)},kind);
   add(txt(scene,220,y-5,labels[kind]+'  x'+owned+
    '  '+Math.round(chance*100)+'%',10,owned?'#f9f6e9':'#a88c9b'));
   if(owned)add(hit(scene,316,y+8,275,25,()=>throwBall(kind)));
  }
  add(txt(scene,225,265,'TOQUE NA MARGEM PARA VOLTAR',8,'#9bd9dc'));
  add(hit(scene,324,290,250,17,close));
 }
 function throwBall(kind){
  if(busy||enemy.hp<=0||!enemy.hpMax)return;
  const save=readCampaign();if(!save?.pendingWild||(save.inventory?.[kind]??0)<1)return;
  busy=true;close();
  const hp=Math.max(1,Math.ceil(enemy.hp/enemy.hpMax*100));
  // Exactly one inventory decrement, one capture roll and one projectile.
  const oldPhase=scene.fase;scene.fase='capturando';
  const result=attemptCapture(save,Math.random,kind,
   {duringBattle:true,hpPercent:hp,status:statusName(enemy)});
  const gfx=scene.add.graphics().setDepth(1208);
  const caption=txt(scene,320,100,'POKÉBOLA, VAI!',13,'#ffe5aa').setOrigin(.5);
  activeVisuals.push(gfx,caption);
  const obj=enemyPortrait(enemy);
  // The native Arena 2D fighter also owns a ground ring/shadow. The ball
  // must absorb those visuals too, or a red oval remains under an empty tile.
  const ground=[enemy.sombra,enemy.anillo].filter(x=>x?.active!==false&&x);
  const groundVisible=ground.map(x=>x.visible);
  const groundAlpha=ground.map(x=>x.alpha);
  // The native fighter can redraw its ring on each animation frame. Hide it
  // AFTER the combat renderer runs, until we either restore a breakout or
  // transition to the saved captured result.
  let absorbed=false;
  const hideGround=()=>{
   if(!absorbed||!scene.scene.isActive())return;
   if(obj?.active!==false&&obj){
    obj.setAlpha(0).setVisible(false);
   }
   ground.forEach(effect=>{
    if(effect.active!==false)effect.setVisible(false).setAlpha(0);
   });
  };
  scene.game.events.on('poststep',hideGround);
  scene.events.once('shutdown',()=>scene.game.events.off('poststep',hideGround));
  const before=obj?{x:obj.x,y:obj.y,sx:obj.scaleX,sy:obj.scaleY,
   alpha:obj.alpha,visible:obj.visible}:null;
  // The sprite can be offset from its logical fighter spawn: aim at the
  // visible Pokémon, not the (possibly stale) combat coordinates.
  const bounds=obj?.getBounds?.();
  const enemyX=Math.max(165,Math.min(555,
   Number.isFinite(bounds?.centerX)?bounds.centerX:Number(enemy.x)||444)),
   enemyY=Math.max(130,Math.min(291,
   Number.isFinite(bounds?.centerY)?bounds.centerY:Number(enemy.y)||221));
  const shot={x:116,y:281},end={x:enemyX-18,y:enemyY-23};
  const ballPos={t:0,angle:0},shake={phase:0};
  const drawBall=(x,y,angle=0)=>{
   gfx.clear();
   px(gfx,x-15,y+22,31,3,0x061e27,.65);
   drawCaptureBall(gfx,x,y,kind,2,angle);
  };
  const restore=()=>{
   absorbed=false;
   scene.game.events.off('poststep',hideGround);
   ground.forEach((effect,i)=>{
    if(effect.active!==false)
     effect.setAlpha(groundAlpha[i]).setVisible(groundVisible[i]);
   });
   if(obj&&obj.active!==false){
    obj.setAlpha(before.alpha);
    obj.setScale(before.sx,before.sy);
    obj.setPosition(before.x,before.y);
    obj.setVisible(before.visible);
   }
  };
  scene.tweens.add({targets:ballPos,t:1,duration:650,ease:'Sine.easeInOut',
   onUpdate:()=>{
    const t=ballPos.t;
    drawBall(shot.x+(end.x-shot.x)*t,
     shot.y+(end.y-shot.y)*t-83*Math.sin(Math.PI*t),t*7);
   },onComplete:()=>{
    caption.setText('O RAIO VERMELHO ENVOLVEU O POKÉMON!');
    const beam={t:0},focus={x:enemyX,y:enemyY};
    if(obj){
     scene.tweens.add({targets:obj,x:end.x,y:end.y,
      scaleX:Math.max(.03,before.sx*.05),scaleY:Math.max(.03,before.sy*.05),
      alpha:.12,duration:370,ease:'Cubic.easeIn'});
    }
    scene.tweens.add({targets:beam,t:1,duration:400,
     onUpdate:()=>{
      gfx.clear();artBeam(gfx,end.x,end.y,focus.x,focus.y,beam.t);
      drawCaptureBall(gfx,end.x,end.y,kind,2,0,true);
     },onComplete:()=>{
      absorbed=true;
      hideGround();
      caption.setText('A POKÉBOLA CAIU...');
      const floorY=Math.min(315,enemyY+37),drop={t:0};
      scene.tweens.add({targets:drop,t:1,duration:350,ease:'Bounce.easeOut',
       onUpdate:()=>drawBall(end.x,end.y+(floorY-end.y)*drop.t),
       onComplete:()=>{
        let completed=0;
        const wobble=()=>{
         if(!scene.scene.isActive())return;
         // FRLG: 0, 1, 2 or 3 wobble(s) before opening; success
         // always shows all three. There is no 'second round'.
         const limit=result.ok?3:result.shakes;
         if(completed>=limit){
          scene.time.delayedCall(250,()=>{
           if(!scene.scene.isActive())return;
           gfx.clear();
           if(result.ok){
            drawCaptureBall(gfx,end.x,floorY,kind,2);
            for(let i=0;i<10;i++){
             const angle=i*Math.PI/5;
             px(gfx,end.x+Math.cos(angle)*26,floorY+Math.sin(angle)*25,
              3,3,i%2?0xfff2b8:0xffd04d);
            }
            // A brief clear success panel matches the moment shown in the user's
            // capture reference, without changing original Arena 2D effects.
            const panel=frame(scene,156,133,328,68);
            const heading=txt(scene,320,148,'GOTCHA!',24,'#ffda6a').setOrigin(.5);
            const destination=save.team.some(p=>p.uid===result.pokemon?.uid)?'EQUIPE':'PC';
            const info=txt(scene,320,181,(result.pokemon?.id||'POKÉMON').toUpperCase()+
             ' CAPTURADO · '+destination,12,'#ddf8e6').setOrigin(.5);
            activeVisuals.push(panel,heading,info);
            caption.setText('CAPTURA CONCLUÍDA!').setColor('#a4ffc1');
            scene.time.delayedCall(1150,()=>scene.scene.start('campanha'));
           }else{
            caption.setText('O POKÉMON ESCAPOU!').setColor('#ffdeae');
            gfx.fillStyle(0xfff8e1,.8);gfx.fillCircle(end.x,floorY,12);
            drawCaptureBall(gfx,end.x,floorY,kind,2,0,true);
            restore();scene.fase=oldPhase;
            scene.time.delayedCall(850,()=>{
             if(scene.scene.isActive()){
              gfx.destroy();caption.destroy();busy=false;refresh();
             }
            });
           }
          });
          return;
         }
         completed++;
         const wob={t:0};
         scene.tweens.add({targets:wob,t:1,duration:430,
          onUpdate:()=>drawBall(end.x+Math.sin(wob.t*Math.PI*2)*6,
           floorY+Math.sin(wob.t*Math.PI)*2,wob.t*Math.PI*2),
          onComplete:()=>{
           caption.setText('...');
           scene.time.delayedCall(130,wobble);
          }});
        };
        wobble();
       }});
     }});
   }});
 }
}
