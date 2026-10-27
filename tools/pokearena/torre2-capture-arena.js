import {serializeGen3Status} from './gen3-status.js';
/* Pokémon Torre 2 — animated FireRed-style single-ball capture.
 * One ball = one throw, one red recall beam and up to three shakes.
 * Four internal RNG checks determine the outcome, never four attempts.
 * Separate from approved Arena 2D Pokémon sprites and move effects.
 */
import {captureChance,fighterCaptureStatus} from './capture-mechanics.js';
import {drawBallSprite} from './ball-sprites.js';
import {readCampaign,saveCampaign,attemptCapture} from './campaign-core.js';
import {ballArc,drawRedBeam,drawReleaseBurst,snapshotBody,poseBody,restoreBody} from './ball-choreography.js';
const FONT='Pixelify Sans,monospace';
function px(g,x,y,w,h,c,a=1){g.fillStyle(c,a);g.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));}
// One ball atlas drives captures, party switch, and Pokéball HUD.
export function drawCaptureBall(g,cx,cy,kind='pokeball',scale=2,rotation=0,opened=false){
 return drawBallSprite(g,cx,cy,kind,scale,rotation,opened);
}
function txt(scene,x,y,value,size=11,color='#f5f4e5'){
 return scene.add.text(x,y,value,{fontFamily:FONT,fontSize:size+'px',
  fontStyle:'bold',color,stroke:'#0a233b',strokeThickness:3}).setDepth(2706);
}
function frame(scene,x,y,w,h){
 const g=scene.add.graphics().setDepth(2703);
 px(g,x+2,y+3,w,h,0x061120);
 px(g,x,y,w,h,0x091b2c);px(g,x+1,y+1,w-2,h-2,0xf0d07d);
 px(g,x+3,y+3,w-6,h-6,0x113952);px(g,x+5,y+4,w-10,2,0x67b8a2);
 return g;
}
function hit(scene,x,y,w,h,onClick){
 return scene.add.zone(x,y,w,h).setDepth(2715).setInteractive({useHandCursor:true})
 .on('pointerdown',onClick);
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
 const hud=frame(scene,390,41,160,42);
 const icon=scene.add.graphics().setDepth(2705);drawCaptureBall(icon,405,53,'pokeball',1);
 txt(scene,422,47,'CAPTURAR',11,'#fff0b9');
 const hpLine=txt(scene,401,65,'HP 100% · ENFRAQUEÇA',10,'#a9ead3');
 hit(scene,470,61,160,42,showChoices);
 // FireRed-style RUN is valid only for a wild encounter. The trainer and
 // original Arena battles never install this overlay. Unlike a KO, fleeing
 // has no win, loss, XP, badge or capture roll. Preserve live party HP/status
 // (including any reserve already switched in) instead of healing via reload.
 // The native battle HUD has interactive zones over the top-right corner.
 // The original capture hit depth (2715) is not high enough at x=590, y=60.
 // Keep RUN below the battle Bag modal (depth 7400) but above the native HUD.
 const runFrame=frame(scene,553,43,75,34).setDepth(7200);
 const runLabel=txt(scene,590,59,'RUN',13,'#ffe2a2').setOrigin(.5).setDepth(7202);
 const runZone=hit(scene,590,60,75,34,(_p,_x,_y,event)=>{
  // Trace only the currently active encounter while validating native UI.
  scene.__torre2RunPointerSeen=(scene.__torre2RunPointerSeen||0)+1;
  event?.stopPropagation?.();
  if(busy||scene.__torre2CaptureBusy||scene.__torre2Changing||
     scene.__torre2BallTransitions||scene.__torre2BattleBagOpen||
     scene.fase!=='lucha'||!scene.scene.isActive())return;
  const save=readCampaign(),payload=scene.datos?.torre2,party=payload?.party;
  if(payload?.kind!=='wild'||!save?.pendingWild||!party||
     save.stage!==payload.stage||save.trainer!==payload.trainer||
     save.pendingWild.id!==payload.id)return;
  const live=scene.luchadores?.[0];
  if(!live?.hpMax||live.hp<=0)return;
  const current=party.friend[party.playerIndex];
  if(!current||current.uid!==save.team[party.playerIndex]?.uid)return;
  // Reuse each saved member's immutable UID: switching must never swap HP
  // between species or change the player's selected active Pokémon.
  for(const member of save.team){
   const from=party.friend.find(m=>m.uid===member.uid);
   if(from){member.hp=Math.max(0,Math.min(100,from.hp));member.status=from.status??null;}
  }
  save.team[party.playerIndex].hp=Math.max(0,Math.min(100,live.hp/live.hpMax*100));
  save.team[party.playerIndex].status=serializeGen3Status(live);
  save.active=party.playerIndex;
  save.lastMessage='Você fugiu do encontro selvagem com '+save.pendingWild.id+'.';
  save.pendingWild=null;
  saveCampaign(save);
  scene.fase='torre2-escape';
  scene.scene.start('campanha');
 }).setDepth(7206).setData('torre2-wild-run',true);
 let menu=[],busy=false,activeVisuals=[];
 const portraitCenter=()=>{
  const sprite=enemyPortrait(enemy);
  return sprite?snapshotBody(enemy).center:{x:Number(enemy.x)||444,y:Number(enemy.y)||221};
 };
 const cleanup=()=>{
  scene.events.off('update',refresh);
  scene.__torre2WildCapture=false;scene.__torre2CaptureBusy=false;
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
  if(busy||enemy.hp<=0||scene.__torre2Changing||scene.__torre2BallTransitions||!['lucha','torre2-aim'].includes(scene.fase))return;
  close();
  const state=readCampaign();if(!state?.pendingWild)return;
  scene.fase='torre2-aim';
  add(frame(scene,173,109,299,169));
  add(txt(scene,188,119,'LANÇAR POKÉBOLA',15,'#ffe5a4'));
  const hp=Math.max(1,Math.ceil(enemy.hp/enemy.hpMax*100));
  add(txt(scene,187,142,state.pendingWild.id.toUpperCase()+
   ' · HP '+hp+'%',11,'#d2f5e5'));
  const labels={pokeball:'POKÉ BALL',greatball:'GREAT BALL',ultraball:'ULTRA BALL'};
  for(const [i,kind]of ['pokeball','greatball','ultraball'].entries()){
   const y=178+i*27,owned=state.inventory[kind]||0;
   const draw=add(scene.add.graphics().setDepth(2708));
   drawCaptureBall(draw,200,y+4,kind,1);
   const chance=captureChance({...state.pendingWild,wild:true,hpPercent:hp,hp:enemy.hp,hpMax:enemy.hpMax,
    status:fighterCaptureStatus(enemy)},kind);
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
  // Capture returns directly to the campaign: preserve the current party HP
  // instead of restoring the pre-battle save when awarding the wild Pokémon.
  const party=scene.datos?.torre2?.party;
  if(party){
   const active=scene.luchadores?.[0];
   if(active?.hpMax&&party.friend[party.playerIndex])
    party.friend[party.playerIndex].hp=Math.max(0,active.hp/active.hpMax*100);
   for(const member of save.team){const live=party.friend.find(p=>p.uid===member.uid);if(live)member.hp=live.hp;}
   save.active=party.playerIndex;
  }
  const aimed=portraitCenter();
  busy=true;scene.__torre2CaptureBusy=true;close();
  const hp=Math.max(1,Math.ceil(enemy.hp/enemy.hpMax*100));
  // Exactly one inventory decrement, one capture roll and one projectile.
  const oldPhase=scene.fase;scene.fase='capturando';
  // Award only when projectile actually touches the enemy.
  let result=null;
  const gfx=scene.add.graphics().setDepth(2308);
  gfx.__torre2BallWorld=true;
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
  const detachGround=()=>scene.game.events.off('poststep',hideGround);
  scene.events.once('shutdown',detachGround);
  const before=obj?{x:obj.x,y:obj.y,sx:obj.scaleX,sy:obj.scaleY,
   alpha:obj.alpha,visible:obj.visible}:null;
  // The sprite can be offset from its logical fighter spawn: aim at the
  // visible Pokémon, not the (possibly stale) combat coordinates.
  const focus=portraitCenter();
  const enemyX=focus.x,enemyY=focus.y;
  const player=scene.luchadores?.[0];
  const shot=player?.spr?snapshotBody(player).center:{x:116,y:281};
  const end={x:aimed.x,y:aimed.y-18};
  const ballPos={t:0,angle:0};
  scene.__torre2CaptureDebug={state:'THROW',aim:{...aimed},target:{...focus},hits:false};
  const drawBall=(x,y,angle=0)=>{
   gfx.clear();
   px(gfx,x-15,y+22,31,3,0x061e27,.65);
   drawCaptureBall(gfx,x,y,kind,2,angle);
  };
  const restore=()=>{
   absorbed=false;pose=null;detachPose();
   scene.events.off('shutdown',detachPose);scene.events.off('shutdown',detachGround);
   detachGround();
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
    scene.__torre2CaptureDebug.hits=true;
    result=attemptCapture(save,scene.__torre2CaptureRandom||Math.random,kind,
      {duringBattle:true,hpPercent:hp,hp:enemy.hp,hpMax:enemy.hpMax,status:fighterCaptureStatus(enemy),persistentStatus:serializeGen3Status(enemy)});
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
      const floorY=enemyY+37,drop={t:0};
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
              restore();gfx.destroy();caption.destroy();busy=false;scene.__torre2CaptureBusy=false;
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
