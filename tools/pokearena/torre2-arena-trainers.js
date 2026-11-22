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
import {FUENTE} from '../config.js';
// FRLG overworld sheet (144x32): 0 front, 1 back, 2 side (facing left),
// 3-4 walk front, 5-6 walk back, 7-8 walk side.
export const FRAMES=Object.freeze({front:0,back:1,side:2,walkSide:[7,8]});
export const BUBBLE_MS=1300;
export const SPOKEN_SLOTS=Object.freeze(['rmb','q','e']);
// Where each trainer stands: the visible left/right edge of the arena view
// (screen coordinates, UI camera). The oval camera zooms on the fighters,
// so world-space tips of the oval are usually off screen.
export const SCREEN_W=640;
export const UI_DEPTH=2450;
export function standPoint(side){
 return side===0?{x:112,y:322}:{x:SCREEN_W-46,y:322};
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
  const stand=standPoint(side),from={x:side===0?-20:SCREEN_W+20,y:stand.y};
  const f0=frameKey(scene,texKey,FRAMES.walkSide[0]);if(!f0)return null;
  const spr=scene.add.image(from.x,from.y,texKey,f0).setOrigin(.5,1).setScale(1.5).setDepth(UI_DEPTH+1)
   .setFlipX(side===0).setData('torre2-arena-trainer',side);
  const shadow=scene.add.ellipse(from.x,from.y,18,5,0x000000,.4).setDepth(UI_DEPTH);
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
  hand(side){
   const t=trainers[side];if(!t)return null;
   const sx=t.stand.x+(side===0?8:-8),sy=t.stand.y-24,cam=scene.cameras?.main;
   return cam?.getWorldPoint?cam.getWorldPoint(sx,sy):{x:sx,y:sy};
  },
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
   const c=scene.add.container(Math.max(70,Math.min(SCREEN_W-70,t.stand.x+(t.side===0?26:-26))),t.stand.y-60).setDepth(UI_DEPTH+3).setData('torre2-trainer-speech',text);
   const label=scene.add.text(0,0,text,{fontFamily:FUENTE,fontSize:'12px',color:'#1b2333',resolution:2}).setOrigin(.5);
   const w=Math.max(40,label.width+12),h=label.height+8,g=scene.add.graphics();
   g.fillStyle(0x1b2333,1).fillRoundedRect(-w/2-1,-h/2-1,w+2,h+2,5);
   g.fillStyle(0xffffff,1).fillRoundedRect(-w/2,-h/2,w,h,4);
   const tip=t.side===0?-14:14;
   g.fillStyle(0x1b2333,1).fillTriangle(tip-4,h/2,tip+4,h/2,tip+(t.side===0?-8:8),h/2+8);
   g.fillStyle(0xffffff,1).fillTriangle(tip-3,h/2-1,tip+3,h/2-1,tip+(t.side===0?-7:7),h/2+6);
   c.add([g,label]);c.setScale(.2);
   scene.tweens.add({targets:c,scale:1,duration:140,ease:'Back.Out'});
   t.bubble=c;
   scene.time.delayedCall(BUBBLE_MS,()=>{if(t.bubble===c){scene.tweens.add({targets:c,alpha:0,duration:180,onComplete:()=>c.destroy()});t.bubble=null}});
   return c;
  }
 };
 scene.__torre2ArenaTrainers=api;
 // Native cast hook (habilidades.js presentar, patched in the published copy).
 const cast=(l,slot,h)=>{
  if(l?.escena!==scene||!scene.scene.isActive())return;
  const text=speechFor(slot,h);if(text)api.say(l.lado===0?0:1,text);
 };
 globalThis.__torre2Cast=cast;
 scene.events.once('shutdown',()=>{
  if(globalThis.__torre2Cast===cast)globalThis.__torre2Cast=null;
  scene.__torre2ArenaTrainers=null;
  for(const t of trainers.filter(Boolean)){t.bubble?.destroy();t.spr.destroy();t.shadow.destroy()}
 });
 return api;
}
