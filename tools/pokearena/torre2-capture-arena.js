/* Pokémon Torre 2 — animated FireRed-style single-ball capture.
 * One ball = one throw, one red recall beam and up to three shakes.
 * Four internal RNG checks determine the outcome, never four attempts.
 * Separate from approved Arena 2D Pokémon sprites and move effects.
 */
import {captureChance} from './capture-mechanics.js';
import {drawBallSprite} from './ball-sprites.js';
import {readCampaign,attemptCapture,saveCampaign} from './campaign-core.js';
import {ballArc,captureImpact,drawCaptureReticle,drawRedBeam,drawReleaseBurst,snapshotBody,poseBody,restoreBody} from './ball-choreography.js';
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
export function installWildCapture(scene){
 if(scene.__torre2WildCapture||scene.datos?.torre2?.kind!=='wild')return;
 const enemy=scene.luchadores?.[1];
 if(!enemy?.hpMax)return;
 scene.__torre2WildCapture=true;
 const hud=frame(scene,458,41,169,42);
 txt(scene,467,47,'BOLSA  /  POKÉBOLA',11,'#fff0b9');
 const hpLine=txt(scene,469,65,'HP 100% · ENFRAQUEÇA',10,'#a9ead3');
 hit(scene,539,61,171,42,showChoices);
 let menu=[],busy=false,activeVisuals=[],aim={x:440,y:200},aimModified=false;
 const portraitCenter=()=>{
  const sprite=enemyPortrait(enemy),body=sprite?snapshotBody(enemy):null;
  const bounds=body?{centerX:body.center.x,centerY:body.center.y}:null;
  return {x:Math.max(145,Math.min(570,Number.isFinite(bounds?.centerX)?
     bounds.centerX:Number(enemy.x)||444)),
    y:Math.max(112,Math.min(311,Number.isFinite(bounds?.centerY)?
     bounds.centerY:Number(enemy.y)||221))};
 };
 const targetRadius=()=>{
  const bounds=enemyPortrait(enemy)?.getBounds?.();
  return Math.max(23,Math.min(39,Math.max(bounds?.width||0,bounds?.height||0)*.30));
 };
 const drawAimMarker=g=>{
  g.clear();drawCaptureReticle(g,aim.x,aim.y,captureImpact(aim,portraitCenter(),targetRadius()));
 };
 const onAimKey=event=>{
  if(scene.fase!=='torre2-aim')return;
  const dir={ArrowUp:[0,-8],ArrowDown:[0,8],ArrowLeft:[-8,0],ArrowRight:[8,0]}[event.key];
  if(!dir)return;
  event.preventDefault?.();
  aim.x=Math.max(145,Math.min(570,aim.x+dir[0]));
  aim.y=Math.max(112,Math.min(311,aim.y+dir[1]));
  aimModified=true;
  for(const visual of menu)if(visual.__torre2Reticle)drawAimMarker(visual);
 };
 scene.input.keyboard?.on('keydown',onAimKey);
 const cleanup=()=>{
  scene.events.off('update',refresh);
  scene.input.keyboard?.off('keydown',onAimKey);
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
 function close(){for(const item of menu)item.destroy?.();menu=[];
  if(scene.fase==='torre2-aim')scene.fase='lucha';}
 function showChoices(){
  if(busy||enemy.hp<=0||scene.__torre2Changing||!['lucha','torre2-aim'].includes(scene.fase))return;
  close();
  const state=readCampaign();if(!state?.pendingWild)return;
  if(!aimModified)aim=portraitCenter();
  scene.fase='torre2-aim';
  const reticle=add(scene.add.graphics().setDepth(1221));
  reticle.__torre2Reticle=true;drawAimMarker(reticle);
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
  add(txt(scene,498,113,'MIRA',12,'#ffefa4'));
  add(txt(scene,486,128,'AJUSTE O ALVO',8,'#e1e9cd'));
  for(const [dx,dy,x,y,glyph] of [
   [0,-12,554,154,'▲'],[-12,0,522,184,'◀'],
   [12,0,586,184,'▶'],[0,12,554,213,'▼']
  ]){
   add(txt(scene,x,y,glyph,17,'#a5fbea').setOrigin(.5));
   add(hit(scene,x,y,29,29,()=>{
    aim.x=Math.max(145,Math.min(570,aim.x+dx));
    aim.y=Math.max(112,Math.min(311,aim.y+dy));
    aimModified=true;drawAimMarker(reticle);
   }));
  }
  add(txt(scene,470,248,'FORA DO ALVO = ERRO',8,'#ffcab3'));
  add(txt(scene,225,265,'TOQUE NA MARGEM PARA VOLTAR',8,'#9bd9dc'));
  add(hit(scene,324,290,250,17,close));
 }
 function throwBall(kind){
  if(busy||enemy.hp<=0||!enemy.hpMax)return;
  const save=readCampaign();if(!save?.pendingWild||(save.inventory?.[kind]??0)<1)return;
  const aimed={...aim};
  busy=true;close();
  const hp=Math.max(1,Math.ceil(enemy.hp/enemy.hpMax*100));
  // Exactly one inventory decrement, one capture roll and one projectile.
  const oldPhase=scene.fase;scene.fase='capturando';
  // Award only when projectile actually touches the enemy.
  let result=null;
  const gfx=scene.add.graphics().setDepth(1208);
  const caption=txt(scene,320,100,'POKÉBOLA, VAI!',13,'#ffe5aa').setOrigin(.5);
  activeVisuals.push(gfx,caption);
  const obj=enemyPortrait(enemy);
  const body=obj?snapshotBody(enemy):null;
  let pose=null;
  const applyPose=()=>{if(body&&pose)poseBody(body,pose.center,pose.scale,pose.alpha)};
  const holdCapture=()=>{if(busy)scene.fase='capturando'};
  scene.game.events.on('poststep',applyPose);
  scene.events.on('preupdate',holdCapture);
  const detachPose=()=>{scene.game.events.off('poststep',applyPose);scene.events.off('preupdate',holdCapture)};
  scene.events.once('shutdown',detachPose);
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
  const focus=portraitCenter();
  const enemyX=focus.x,enemyY=focus.y;
  const shot={x:116,y:281},end={x:aimed.x,y:aimed.y-18};
  const ballPos={t:0,angle:0};
  scene.__torre2CaptureDebug={state:'THROW',aim:{...aimed},target:{...focus},hits:false};
  const drawBall=(x,y,angle=0)=>{
   gfx.clear();
   px(gfx,x-15,y+22,31,3,0x061e27,.65);
   drawCaptureBall(gfx,x,y,kind,2,angle);
  };
  const restore=()=>{
   absorbed=false;pose=null;detachPose();
   scene.events.off('poststep',hideGround);
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
    const pt=ballArc(shot,end,t,83);
    drawBall(pt.x,pt.y,t*7);
   },onComplete:()=>{
    const hitTarget=captureImpact(aimed,portraitCenter(),targetRadius());
    scene.__torre2CaptureDebug.hits=hitTarget;
    if(!hitTarget){
     save.inventory[kind]--;
     save.lastMessage='Pokébola errou o alvo selvagem.';
     saveCampaign(save);
     scene.__torre2CaptureDebug.state='MISS';
     caption.setText('A POKÉBOLA ERROU!').setColor('#ffcfaa');
     const fall={t:0};
     scene.tweens.add({targets:fall,t:1,duration:350,ease:'Bounce.easeOut',
      onUpdate:()=>drawBall(end.x+fall.t*22,end.y+fall.t*36,fall.t*6),
      onComplete:()=>{
       scene.time.delayedCall(430,()=>{
        if(!scene.scene.isActive())return;
        restore();gfx.destroy();caption.destroy();busy=false;
        scene.fase=oldPhase;scene.__torre2CaptureDebug.state='RESUME';
       });
      }
     });
     return;
    }
    result=attemptCapture(save,scene.__torre2CaptureRandom||Math.random,kind,
      {duringBattle:true,hpPercent:hp,status:statusName(enemy)});
    scene.__torre2CaptureDebug.state='ABSORB';
    caption.setText('O RAIO VERMELHO ENVOLVEU O POKÉMON!');
    const beam={t:0},focus={x:enemyX,y:enemyY};
    scene.tweens.add({targets:beam,t:1,duration:400,
     onUpdate:()=>{
      const t=beam.t,u=t*t;
      const center={x:focus.x+(end.x-focus.x)*u,y:focus.y+(end.y-focus.y)*u};
      pose={center,scale:1-.98*t,alpha:1-t};applyPose();
      scene.__torre2CaptureDebug.beam={from:{...end},to:{...center}};
      gfx.clear();drawRedBeam(gfx,end,center,1-beam.t*.5,body?.width);
      drawReleaseBurst(gfx,focus.x,focus.y,beam.t);
      drawCaptureBall(gfx,end.x,end.y,kind,2,0,true);
     },onComplete:()=>{
      absorbed=true;
      scene.__torre2CaptureDebug.state='DROP';
      hideGround();
      caption.setText('A POKÉBOLA CAIU...');
      const floorY=Math.min(315,enemyY+37),drop={t:0};
      scene.tweens.add({targets:drop,t:1,duration:350,ease:'Bounce.easeOut',
       onUpdate:()=>drawBall(end.x,end.y+(floorY-end.y)*drop.t),
       onComplete:()=>{
        scene.__torre2CaptureDebug.state='SHAKE';
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
            scene.__torre2CaptureDebug.state='CAUGHT';
            caption.setText('CAPTURA CONCLUÍDA!').setColor('#a4ffc1');
            scene.time.delayedCall(1150,()=>scene.scene.start('campanha'));
           }else{
            scene.__torre2CaptureDebug.state='BREAK';
            caption.setText('O POKÉMON ESCAPOU!').setColor('#ffdeae');
            absorbed=false;
            const emerge={t:0},origin={x:end.x,y:floorY};
            scene.tweens.add({targets:emerge,t:1,duration:440,
             onUpdate:()=>{
              const t=emerge.t;
              const center={x:origin.x+(focus.x-origin.x)*t,y:origin.y+(focus.y-origin.y)*t};
              pose={center,scale:.02+.98*t,alpha:t};applyPose();
              gfx.clear();drawRedBeam(gfx,origin,center,1-t*.7,body?.width);
              drawReleaseBurst(gfx,center.x,center.y,t);
              drawCaptureBall(gfx,origin.x,origin.y,kind,2,0,true);
             },onComplete:()=>{
              restore();gfx.destroy();caption.destroy();busy=false;
              scene.fase=oldPhase;scene.__torre2CaptureDebug.state='RESUME';refresh();
             }});
           }
          });
          return;
         }
         completed++;
         const wob={t:0};
         scene.tweens.add({targets:wob,t:1,duration:430,
          onUpdate:()=>drawBall(end.x+Math.sin(wob.t*Math.PI*2)*6,
           floorY-Math.sin(wob.t*Math.PI)*2,Math.sin(wob.t*Math.PI*2)*.45),
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
