/* Pokémon Torre 2 — trainers standing in the arena (owner 2026-11-22:
 * "os sprites do treinador na arena jogando a pokébola ... ficam na arena
 * vendo e quando usa o golpe aparece ele falando nome do golpe", option A).
 * Campaign battles only. Cosmetic layer:
 *  - the player (Red/Leaf) and the opposing trainer (its FRLG NPC sprite)
 *    walk in at the two tips of the arena oval with the ORIGINAL FireRed
 *    overworld walking frames, then stay there watching;
 *  - each Poké Ball send-out starts from the trainer's hand with a small
 *    throw motion (the overworld sheet has no throw pose);
 *  - when a fighter really casts HAB 2 / HAB 3 / ULT (native presentar()),
 *    its trainer shows a speech bubble with the move name.
 * Never touches hitboxes, damage, move data, VFX or other modes.
 */
import {CAMPO,FUENTE} from '../config.js';
// FRLG overworld sheet (144x32): 0 front, 1 back, 2 side (facing left),
// 3-4 walk front, 5-6 walk back, 7-8 walk side.
export const FRAMES=Object.freeze({front:0,back:1,side:2,walkSide:[7,8]});
export const BUBBLE_MS=1300;
export const SPOKEN_SLOTS=Object.freeze(['rmb','q','e']);
export const SCREEN_W=640,SCREEN_H=360;
export const UI_DEPTH=2450,WORLD_DEPTH=6;
// On the floor, a little behind and below the trainer's own Pokémon at the
// start of the fight (the oval tips are outside the zoomed camera), clamped
// inside the oval. They move WITH the floor when the camera pans/zooms.
export function standPoint(side,field=CAMPO,fighter=null){
 const base=fighter&&Number.isFinite(fighter.x)?fighter:{x:side===0?field.x+field.w*.3:field.x+field.w*.7,y:field.y+field.h*.5};
 // Beside the arena's middle height, a bit above the fighters' line.
 const x=base.x+(side===0?-58:92),y=base.y+28;
 return {x:Math.max(field.x+12,Math.min(field.x+field.w-12,x)),y:Math.max(field.y+20,Math.min(field.y+field.h-4,y))};
}
// World point → UI-camera point (the HUD camera has its own zoom), clamped
// inside the visible UI area; offscreen tells the bubble to show its arrow.
export function bubbleScreen(world,cam,ui,halfW=40){
 const v=cam?.worldView,z=Number(cam?.zoom)||1;
 const sx=v?(world.x-v.x)*z+(cam.x||0):world.x,sy=v?(world.y-v.y)*z+(cam.y||0):world.y;
 const offscreen=!!cam&&(sx<0||sx>cam.width||sy<0||sy>cam.height);
 const p=ui?.getWorldPoint?ui.getWorldPoint(sx,sy):{x:sx,y:sy};
 const uv=ui?.worldView||{x:0,y:0,width:SCREEN_W,height:SCREEN_H};
 const left=uv.x+uv.width*.11+halfW+14,right=uv.x+uv.width-halfW-24;
 let y=Math.max(uv.y+uv.height*.17,Math.min(uv.y+uv.height*.84,p.y));
 // Keep clear of the AUTO / VEL buttons on the right (UI 550-610, 132-188).
 const busy=y>uv.y+uv.height*.36&&y<uv.y+uv.height*.53;
 const r=busy?Math.min(right,uv.x+uv.width*.84-halfW-8):right;
 return {x:Math.max(left,Math.min(r,p.x)),y,offscreen};
}
export function speechFor(slot,move){
 const name=String(move?.nombre||'').replace(/^ULT\s*[·:-]\s*/i,'').trim();
 // Empty-slot placeholders are shown as "Struggle 2/3" on the native buttons.
 if(/^struggle\s*\d+$/i.test(name))return SPOKEN_SLOTS.includes(slot)?'Struggle!':null;
 if(!name||!SPOKEN_SLOTS.includes(slot))return null;
 return slot==='e'?name.toUpperCase()+'!!':name+'!';
}
function frameKey(scene,texKey,index){
 const tex=scene.textures.get(texKey),src=tex?.source?.[0];
 if(!src||src.width<16)return null;
 const cell=src.width===320&&src.height===32?32:16,name='torre2-arena-f'+index;
 if(!tex.has(name)){
  if((index+1)*cell>src.width)return frameKey(scene,texKey,0);
  tex.add(name,0,index*cell,0,cell,Math.min(32,src.height));
 }
 return name;
}
export function installArenaTrainers(scene,{playerTexture,foeTexture}={}){
 const payload=scene?.datos?.torre2;
 if(!payload?.party||scene.__torre2ArenaTrainers)return null;
 const trainers=[];
 const make=(side,texKey)=>{
  if(!texKey||!scene.textures.exists(texKey))return null;
  const stand=standPoint(side,CAMPO,scene.luchadores?.[side]),from={x:stand.x+(side===0?-60:60),y:stand.y};
  const f0=frameKey(scene,texKey,FRAMES.walkSide[0]);if(!f0)return null;
  const spr=scene.add.image(from.x,from.y,texKey,f0).setOrigin(.5,1).setScale(1.5).setDepth(WORLD_DEPTH+1)
   .setFlipX(side===0).setData('torre2-arena-trainer',side);
  const shadow=scene.add.ellipse(from.x,from.y,18,5,0x000000,.4).setDepth(WORLD_DEPTH);
  const t={side,texKey,spr,shadow,stand,walking:true,bubble:null,walkT:0};
  trainers[side]=t;return t;
 };
 make(0,playerTexture);
 if(payload.kind!=='wild')make(1,foeTexture);
 // Walk in (about 0.7 s), then face the field and watch.
 for(const t of trainers.filter(Boolean)){
  scene.tweens.add({targets:[t.spr,t.shadow],x:t.stand.x,duration:700,ease:'Sine.Out',
   onUpdate:()=>{t.walkT++;t.spr.setFrame(frameKey(scene,t.texKey,FRAMES.walkSide[(t.walkT>>3)%2]));t.shadow.setPosition(t.spr.x,t.spr.y)},
   onComplete:()=>{t.walking=false;t.spr.setFrame(frameKey(scene,t.texKey,FRAMES.side))}});
 }
 const api={
  trainers,
  // Hand position for the Poké Ball (world coordinates).
  hand(side){const t=trainers[side];return t?{x:t.stand.x+(side===0?9:-9),y:t.stand.y-27}:null},
  // Small throw motion: lean forward, step, back.
  throwBall(side){
   const t=trainers[side];if(!t)return;
   scene.tweens.add({targets:t.spr,x:t.stand.x+(side===0?5:-5),y:t.stand.y-3,duration:110,yoyo:true,ease:'Quad.Out',
    onStart:()=>t.spr.setFrame(frameKey(scene,t.texKey,FRAMES.walkSide[0])),
    onComplete:()=>{t.spr.setPosition(t.stand.x,t.stand.y).setFrame(frameKey(scene,t.texKey,FRAMES.side))}});
  },
  say(side,text){
   const t=trainers[side];if(!t||!text)return null;
   t.bubble?.destroy();
   // Bubble on the UI camera, following the trainer's screen position.
   const c=scene.add.container(0,0).setDepth(UI_DEPTH+3).setData('torre2-trainer-speech',text);
   c.__torre2Follow=()=>{const p=bubbleScreen({x:t.spr.x,y:t.spr.y-50},scene.cameras.main,scene.camUI,c.__torre2HalfW||40);c.setPosition(p.x+(p.offscreen?0:(t.side===0?20:-20)),p.y);c.setData('offscreen',p.offscreen)};
   c.__torre2Follow();
   const label=scene.add.text(0,0,text,{fontFamily:FUENTE,fontSize:'12px',color:'#1b2333',resolution:2}).setOrigin(.5);
   const w=Math.max(40,label.width+12),h=label.height+8,g=scene.add.graphics();
   g.fillStyle(0x1b2333,1).fillRoundedRect(-w/2-1,-h/2-1,w+2,h+2,5);
   g.fillStyle(0xffffff,1).fillRoundedRect(-w/2,-h/2,w,h,4);
   const tip=t.side===0?-14:14;
   g.fillStyle(0x1b2333,1).fillTriangle(tip-4,h/2,tip+4,h/2,tip+(t.side===0?-8:8),h/2+8);
   g.fillStyle(0xffffff,1).fillTriangle(tip-3,h/2-1,tip+3,h/2-1,tip+(t.side===0?-7:7),h/2+6);
   // Edge arrow (drawn, the pixel font has no arrow glyph): where the trainer is.
   const arrow=scene.add.graphics().setVisible(false),ax=t.side===0?-w/2-4:w/2+4,dir=t.side===0?-1:1;
   arrow.fillStyle(0x1b2333,1).fillTriangle(ax,-7,ax,7,ax+dir*10,0);
   arrow.fillStyle(0xffd23f,1).fillTriangle(ax+dir*1,-5,ax+dir*1,5,ax+dir*8,0);
   c.add([g,label,arrow]);c.setScale(.2);c.__torre2Arrow=arrow;c.__torre2HalfW=w/2;c.__torre2Follow();
   scene.tweens.add({targets:c,scale:1,duration:140,ease:'Back.Out'});
   t.bubble=c;
   scene.time.delayedCall(BUBBLE_MS,()=>{if(t.bubble===c){scene.tweens.add({targets:c,alpha:0,duration:180,onComplete:()=>c.destroy()});t.bubble=null}});
   return c;
  }
 };
 // End of battle (owner 2026-11-22, item 24): the winner celebrates with
 // hops, the loser turns around sad. Once per battle, cosmetic only.
 let ended=false;
 const ending=()=>{
  if(ended||scene.fase!=='fin')return;ended=true;
  const lost=side=>{const f=scene.luchadores?.[side];return !f||f.ko||!(f.hp>0)};
  const winner=lost(1)&&!lost(0)?0:lost(0)&&!lost(1)?1:null;
  for(const t of trainers.filter(Boolean)){
   if(t.walking)continue;
   if(t.side===winner){
    t.spr.setFrame(frameKey(scene,t.texKey,FRAMES.front));
    scene.tweens.add({targets:t.spr,y:t.stand.y-10,duration:170,yoyo:true,repeat:3,ease:'Quad.Out'});
    api.say(t.side,t.side===0?'Isso aí!':'Hahaha! Ganhei!');
   }else if(winner!==null){
    t.spr.setFrame(frameKey(scene,t.texKey,FRAMES.back));
    scene.tweens.add({targets:t.spr,y:t.stand.y+2,duration:500,ease:'Sine.InOut'});
    api.say(t.side,t.side===0?'Ah, não...':'Não acredito...');
   }
  }
  scene.__torre2TrainersEnding=winner;
 };
 scene.events.on('update',ending);
 scene.events.once('shutdown',()=>scene.events.off('update',ending));
 // Keep bubbles over their trainer (or on the screen edge) every frame.
 const follow=()=>{for(const t of trainers.filter(Boolean)){const b=t.bubble;if(b?.active){b.__torre2Follow();b.__torre2Arrow?.setVisible(!!b.getData('offscreen'))}}};
 scene.events.on('postupdate',follow);
 scene.__torre2ArenaTrainers=api;
 // Native cast hook (habilidades.js presentar, patched in the published copy).
 // Chained: other campaign listeners (terrain.js) keep receiving casts.
 const previous=globalThis.__torre2Cast;
 const cast=(l,slot,h)=>{
  try{previous?.(l,slot,h)}catch{}
  if(l?.escena!==scene||!scene.scene.isActive())return;
  const text=speechFor(slot,h);if(text)api.say(l.lado===0?0:1,text);
 };
 globalThis.__torre2Cast=cast;
 scene.events.once('shutdown',()=>{
  if(globalThis.__torre2Cast===cast)globalThis.__torre2Cast=previous||null;
  scene.events.off('postupdate',follow);
  scene.__torre2ArenaTrainers=null;
  for(const t of trainers.filter(Boolean)){t.bubble?.destroy();t.spr.destroy();t.shadow.destroy()}
 });
 return api;
}
