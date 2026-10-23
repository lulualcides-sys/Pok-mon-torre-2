/* Pokémon Torre 2 — reusable Phaser/WebGL Pokéball choreography.
 * Kinematic phases inspired by the MIT-licensed arena controller in
 * GBurgardt/pokemon-emerald-arena. Pixel-cell ball art is owned by Torre 2.
 * No canvas, video composites, DOM animation or original-game C code.
 * Source: https://github.com/GBurgardt/pokemon-emerald-arena
 * See credits and per-asset license conditions in docs.
 */
export const clamp01=v=>Math.max(0,Math.min(1,Number(v)||0));
export function ballArc(from,to,t,height=52){
 const p=clamp01(t);
 return {x:from.x+(to.x-from.x)*p,
  y:from.y+(to.y-from.y)*p-4*height*p*(1-p)};
}
export function captureImpact(aim,target,radius=24){
 return Number.isFinite(aim?.x)&&Number.isFinite(aim?.y)&&
  Number.isFinite(target?.x)&&Number.isFinite(target?.y)&&
  Math.hypot(aim.x-target.x,aim.y-target.y)<=radius;
}
export function drawCaptureReticle(g,x,y,valid=true){
 const color=valid?0x91ffe5:0xffaa75;
 g.lineStyle(2,0x091d33,.88);
 g.strokeCircle(Math.round(x),Math.round(y),19);
 g.lineStyle(2,color,.97);
 g.strokeCircle(Math.round(x),Math.round(y),16);
 g.lineBetween(x-25,y,x-8,y);
 g.lineBetween(x+8,y,x+25,y);
 g.lineBetween(x,y-25,x,y-8);
 g.lineBetween(x,y+8,x,y+25);
 g.fillStyle(0xfff2cc,1);g.fillRect(Math.round(x)-2,Math.round(y)-2,4,4);
}
export function drawRedBeam(g,origin,target,strength=1,width=6){
 const a=clamp01(strength);
 const dx=target.x-origin.x,dy=target.y-origin.y;
 const dist=Math.max(1,Math.hypot(dx,dy));
 const nx=-dy/dist,ny=dx/dist;
 const w=Math.max(3,Math.min(8,width));
 // Parallel pixel steps, never a widening triangle. Coordinates are world
 // coordinates, so Phaser applies the same camera as the actor sprite.
 for(const [size,color,opacity] of [[w+4,0x92183f,.24],[w,0xf73d67,.85],[2,0xffeef0,1]]){
  g.fillStyle(color,opacity*a);
  const steps=Math.ceil(dist/2);
  for(let i=0;i<=steps;i++){
   const t=i/steps;
   g.fillRect(Math.round(origin.x+dx*t-size/2),Math.round(origin.y+dy*t-size/2),size,size);
  }
 }
 for(let i=1;i<6;i++){
  const p=i/6;
  const x=origin.x+dx*p,y=origin.y+dy*p;
  g.fillStyle(i%2?0xffedb5:0xff4d78,.7*a);
  g.fillRect(Math.round(x+nx*((i%3)-1)*3)-2,Math.round(y+ny*((i%3)-1)*3)-1,4,3);
 }
}
export function drawReleaseBurst(g,x,y,progress=0){
 const t=clamp01(progress),radius=4+24*t,alpha=(1-t)*.95;
 g.lineStyle(3,0xffe4a7,alpha);g.strokeCircle(x,y,radius);
 g.lineStyle(2,0xff5279,alpha*.75);g.strokeCircle(x,y,radius*.55);
 for(let i=0;i<8;i++){
  const a=i*Math.PI/4+t*.2,r=radius*(.7+i%2*.2);
  g.fillStyle(i%2?0xffffff:0xffbb72,alpha);
  g.fillRect(Math.round(x+Math.cos(a)*r)-2,Math.round(y+Math.sin(a)*r)-2,4,4);
 }
}

// Snapshot the full-size body's center ONCE. PMD frames contain transparent
// padding; manifest head/feet describe the actual body, not the image bounds.
export function snapshotBody(actor){
 const sprite=actor.spr||actor.sprite;
 const sx=sprite.scaleX||1,sy=sprite.scaleY||1;
 const offset=((actor.manif?.head??-16)+(actor.manif?.feet??5))/2;
 const center={x:sprite.x,y:sprite.y+offset*sy};
 return {sprite,x:sprite.x,y:sprite.y,sx,sy,center,offset,
  alpha:sprite.alpha,visible:sprite.visible,
  ground:[actor.sombra,actor.anillo].filter(Boolean).map(o=>({o,visible:o.visible,alpha:o.alpha})),
  width:Math.max(3,Math.min(8,(actor.manif?.width||18)*Math.abs(sx)*.18))};
}
export function poseBody(body,center,scale,alpha){
 const s=body.sprite;if(!s?.active)return;
 s.setScale(body.sx*scale,body.sy*scale)
  .setPosition(center.x,center.y-body.offset*body.sy*scale)
  .setAlpha(alpha).setVisible(alpha>0);
 body.ground.forEach(({o})=>{if(o.active)o.setVisible(false)});
}
export function restoreBody(body){
 const s=body.sprite;
 if(s?.active)s.setPosition(body.x,body.y).setScale(body.sx,body.sy)
  .setAlpha(body.alpha).setVisible(body.visible);
 body.ground.forEach(({o,visible,alpha})=>{if(o.active)o.setVisible(visible).setAlpha(alpha)});
}
// One lifecycle for first entry, manual/KO replacement and recall. Run after
// the native renderer has positioned its sprites, before WebGL draws them.
export function animateBallActor(scene,actor,{mode='release',from,drawBall,onComplete=()=>{},side=0}){
 actor.actualizarGraficos?.(0);
 const body=snapshotBody(actor),g=scene.add.graphics().setDepth(2605);
 const landing={x:body.center.x+(side===0?-42:42),y:body.center.y-22};
 const origin=mode==='recall'?from:landing;
 let elapsed=0,done=false;
 scene.__torre2BallTransitions=(scene.__torre2BallTransitions||0)+1;
 const phase=mode==='recall'?'ko':'torre2-sendout';
 const hold=()=>{scene.fase=phase};hold();
 const clean=()=>{if(done)return;done=true;
  scene.__torre2BallTransitions=Math.max(0,(scene.__torre2BallTransitions||1)-1);
  scene.game.events.off('poststep',step);scene.events.off('preupdate',hold);
  scene.events.off('shutdown',clean);g.destroy();};
 const step=(_time,delta)=>{
  if(done||!scene.scene.isActive())return clean();
  elapsed+=Math.min(64,Math.max(1,Number(delta)||16.667));hold();g.clear();
  let state,center=body.center;
  if(mode==='release'&&elapsed<360){
   state='THROW';poseBody(body,center,.01,0);
   const p=ballArc(from,landing,elapsed/360,48);
   drawBall(g,p.x,p.y,'pokeball',1.15,elapsed/60);
  }else{
   const t=clamp01((elapsed-(mode==='release'?360:80))/420);
   state=t===0?'OPEN':mode==='recall'?'ABSORB':'RELEASE';
   if(mode==='recall'){
    const u=t*t;center={x:body.center.x+(origin.x-body.center.x)*u,y:body.center.y+(origin.y-body.center.y)*u};
    poseBody(body,center,1-.98*t,1-t);
   }else poseBody(body,center,.04+.96*t,t);
   drawRedBeam(g,origin,center,Math.min(1,(1-t)*4),body.width);
   drawReleaseBurst(g,center.x,center.y,t);
   drawBall(g,origin.x,origin.y,'pokeball',1.15,0,true);
   if(t>=1){
    if(mode==='release')restoreBody(body);else poseBody(body,origin,.01,0);
    clean();onComplete();return;
   }
  }
  scene.__torre2BeamDebug={phase:state.toLowerCase(),side,from:{...origin},to:{...center},currentBody:{...center},visible:body.sprite.visible};
  scene.__torre2IntroDebug={side,phase:state.toLowerCase(),elapsed};
 };
 poseBody(body,body.center,mode==='release'?.01:1,mode==='release'?0:1);
 scene.events.on('preupdate',hold);scene.game.events.on('poststep',step);scene.events.once('shutdown',clean);
 return clean;
}
