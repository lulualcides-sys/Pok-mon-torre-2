/* Johto rework v3: genuine native Poké Arena 2D battle texture choreography.
 * Previous 24-frame hand-drawn shapes were rejected: do not display them.
 * 60fps Phaser Image layers, transform/opacity only (no rectangle drawings,
 * giant alpha blocks, Canvas 2D or CSS). Textures already loaded by original
 * game; references individually mapped in johto-lab-pixelart.js.
 * The 3 approved effects NEVER enter this module.
 */
export const JOHTO_FOUR_NATIVE_IDS=Object.freeze([
 "pursuit","vital-throw","hidden-power","beat-up"
]);
export const JOHTO_APPROVED_NATIVE_IDS=Object.freeze([
 "triple-kick","octazooka","thief","false-swipe","steel-wing","rock-smash",
 "return","present","frustration","magnitude","hidden-power",
 "pursuit","beat-up","vital-throw"]);
import {hiddenPowerGen3 as johtoHiddenPowerGen3} from "./torre2-johto-gen3-mechanics.js";
const clamp=v=>Math.max(0,Math.min(1,v));
const smooth=v=>{v=clamp(v);return v*v*(3-2*v)};
const mix=(a,b,v)=>a+(b-a)*v;
const round=Math.round,PI=Math.PI;
function fade(u,lo=.05,hi=.82){
 return smooth(u/lo)*(1-smooth((u-hi)/(1-hi)));
}
function part(scene,texture,tint=0xffffff,depth=1534){
 if(!scene.textures.exists(texture))return null;
 const img=scene.add.image(-999,-999,texture).setDepth(depth).setAlpha(0);
 img.setTint(tint);
 img.setBlendMode(Phaser.BlendModes.NORMAL);
 scene.textures.get(texture).setFilter(Phaser.Textures.FilterMode.NEAREST);
 return img;
}
function place(img,x,y,w,h,alpha=1,angle=0,flip=false){
 if(!img)return;
 const a=clamp(alpha);
 img.setVisible(a>.015);
 if(a<=.015)return;
 img.setPosition(round(x),round(y)).setDisplaySize(round(w),round(h));
 img.setAlpha(a).setAngle(angle).setFlipX(flip);
}
// Authentic P2 animated spritesheets (vfx.js#HOJAS), never an enlarged
// 1px icon disguised as an attack. Native frames, not procedural circles.
function framePlace(img,x,y,w,h,alpha,frame,angle=0,flip=false){
 if(!img)return;
 img.setFrame?.(Math.max(0,Math.floor(frame)));
 place(img,x,y,w,h,alpha,angle,flip);
}
function arcKey(scene,palette){
 const themed="vfx-arco-"+palette;
 return scene.textures.exists(themed)?themed:"vfx-arco";
}
function attackSheet(scene){
 return scene.textures.exists("vfx-acometida-golpe")?
  "vfx-acometida-golpe":"vfx-acometida";
}
function frameAt(age,seconds,frames=4){
 return Math.min(frames-1,Math.max(0,Math.floor(Math.max(0,age)/seconds*frames)));
}

function createTriple(scene){
 const kicks=Array.from({length:3},()=>({
  main:part(scene,"p-cuchilla",0xffe8ad,1535),
  shine:part(scene,"p-estrella",0xfff4ca,1536),
  ring:part(scene,"p-aura",0xf1b764,1534)
 }));
 const trails=Array.from({length:4},()=>part(scene,"p-cuchilla",0xd99c4a,1533));
 return{sprites:[...kicks.flatMap(x=>Object.values(x)),...trails],update(t,a,b,state={}){
  // The original client resolves contact before emitting a hit effect.
  // Triple Kick has THREE separate hit windows and no effect on a miss.
  if(!Number.isInteger(state.hitIndex)||state.hitIndex<0||
     !Number.isFinite(state.hitAge)||state.hitAge<0||state.hitAge>=.19){
   for(const o of this.sprites)o.setVisible(false);
   return;
  }
  t=(Math.min(2,state.hitIndex)+Math.min(.96,state.hitAge/.19*.92))/3;
  const d=t*3,k=Math.min(2,Math.floor(d)),u=d-k;
  const impacts=[{dx:-18,dy:-18,angle:-42},{dx:17,dy:2,angle:35},{dx:-2,dy:17,angle:-12}];
  for(let n=0;n<3;n++){
   const hit=impacts[n],o=kicks[n],active=k===n?fade(u,.07,.77):0,
   scale=1+n*.29,px=b.x+hit.dx,py=b.y+hit.dy;
   place(o.main,px-12+smooth(u)*17,py+7-smooth(u)*9,28*scale,17*scale,
    active*.95,hit.angle);
   place(o.shine,px,py,17*scale+u*10,17*scale+u*10,
    active*(1-smooth((u-.5)/.3)),n*23);
   place(o.ring,px,py,19*scale+u*22,13*scale+u*13,
    active*.34,-hit.angle);
  }
  trails.forEach((img,i)=>{
   const progress=clamp((u-.06-i*.13)/.42),live=k<=2?fade(u-i*.05,.12,.68):0;
   const x=mix(a.x,b.x,progress)*.72+b.x*.28;
   const y=mix(a.y,b.y,progress)-Math.sin(progress*PI)*(13+i*3);
   place(img,x,y,20-i*2,11-i,live*.23,-25+i*8);
  });
 }};
}
function createThief(scene){
 // P2 original Quick Attack + palette-recolored Shadow arc. These are
 // source sprite-sheet FRAME sequences, not scaled-up MAPAS icons.
 const rush=part(scene,"vfx-quickattack",0xffffff,1534);
 const slashes=[
  part(scene,arcKey(scene,"sombra"),0xffffff,1541),
  part(scene,arcKey(scene,"sombra"),0xffffff,1542)
 ];
 const echo=Array.from({length:2},()=>part(scene,"vfx-astonish",0xffffff,1543));
 const dust=Array.from({length:3},()=>part(scene,"p-sombra",0x9680c5,1537));
 const glitter=Array.from({length:3},()=>part(scene,"p-estrella",0xd8b6ff,1544));
 return {sprites:[rush,...slashes,...echo,...dust,...glitter],
  update(t,a,b,state={}){
   const actor=state.actor||a,dir=state.dirX??1;
   const wind=t<.49?fade(t/.49,.055,.79):0;
   framePlace(rush,actor.x-dir*16,actor.y-6,57,28,wind*.78,
    frameAt(t,.29,2),0,dir<0);
   dust.forEach((img,i)=>{
    place(img,actor.x-dir*(8+i*7),actor.y+9+(i%2)*4,
     6+(i%2)*2,5+(i%2)*2,wind*(.36-i*.09),i*12);
   });
   const age=state.hitAge,hit=Number.isFinite(age)&&age>=0&&age<.31;
   const u=hit?clamp(age/.31):0,opacity=hit?fade(u,.04,.78):0;
   const target=state.hitPoint||b;
   slashes.forEach((img,i)=>{
    const phase=clamp((u-i*.19)/.78);
    const amp=opacity*(i===0?1:.82)*smooth((u-i*.14)/.13);
    framePlace(img,target.x+dir*(i?2:-5),target.y+(i?-5:2),
      57,43,amp,4+frameAt(phase,.95,4),
      i?28:-25,dir<0);
   });
   echo.forEach((img,i)=>{
    const p=clamp((u-i*.18)/.78);
    framePlace(img,target.x+(i?9:-8),target.y-3,
     21,21,opacity*(.56-i*.17),frameAt(p,1,5));
   });
   glitter.forEach((img,i)=>{
    const q=u*(18+i*4),ang=2.399963*i;
    place(img,target.x+Math.cos(ang)*q,target.y+Math.sin(ang)*q*.8,
     6,6,opacity*(.78-i*.16),i*35);
   });
 }};
}
function createSnore(scene){
 // P2 viento(sound)/Proyectil composition: a clearly visible SOUND wave
 // moves along the actual projectile hitbox; a target burst appears only if
 // recibir() confirmed impact. The sleep bubble is at the user, never enemy.
 const waves=Array.from({length:5},(_,i)=>part(scene,"p-hipnosis",
   i%2?0x83eaff:0xffffff,1537));
 const echoes=Array.from({length:4},()=>part(scene,"p-aura",0x50bbff,1534));
 const burst=Array.from({length:4},(_,i)=>part(scene,
   i%2?"p-estrella":"p-psiquico",i%2?0xffffff:0x84f4ff,1539));
 const bubble=part(scene,"p-espuma",0xc5fcff,1536);
 return {sprites:[...waves,...echoes,...burst,bubble],update(t,a,b,state={}){
  const projectile=state.projectile||{active:false,x:a.x,y:a.y},
    active=!!projectile.active,
    x=projectile.x,y=projectile.y;
  waves.forEach((img,i)=>{
   const pulse=(t*6+i*.25)%1;
   const wx=x-9-i*10,wy=y-8+Math.sin(i*1.7+t*14)*6;
   place(img,wx,wy,36+pulse*36,38+pulse*30,
    active*(.95-i*.12),i%2?14:-14,i%2===1);
  });
  echoes.forEach((img,i)=>{
   const wx=x-18-i*14,wy=y-5+Math.sin(t*12+i)*7;
   place(img,wx,wy,24+i*8,30+i*6,active*(.42-i*.085),0);
  });
  const age=state.hitAge,impact=Number.isFinite(age)&&age>=0&&age<.32?
   fade(age/.32,.05,.81):0,target=state.hitPoint||b;
  burst.forEach((img,i)=>{
   const p=clamp(age/.32),angle=i*PI/2+.15;
   place(img,target.x+Math.cos(angle)*(7+p*30),
    target.y+Math.sin(angle)*(6+p*21),
    35+i*8+p*19,32+i*6+p*17,
    impact*(1-i*.13),i*45);
  });
  const snorePuff=fade(t,.05,.86)*(.7+.22*Math.sin(t*PI*13));
  place(bubble,a.x+13,a.y-20,24+Math.sin(t*PI*12)*3,20,snorePuff);
 }};
}
function createOcta(scene){
 const ball=part(scene,"p-fantasma",0x38225a,1536);
 const shine=part(scene,"p-agua",0x8658ac,1537);
 const trail=Array.from({length:6},()=>part(scene,"p-agua",0x60407d,1534));
 const ink=Array.from({length:12},(_,i)=>part(scene,
  i%4===0?"p-agua":"p-fantasma",i%3===0?0x9e71b3:0x412655,1536));
 const ripple=part(scene,"p-aura",0x7c5d9c,1533);
 return {sprites:[ball,shine,...trail,...ink,ripple],update(t,a,b,state={}){
  // Projectile exists in flight; ink splashes ONLY after native recibir("golpe").
  const projectile=state.projectile||{active:false,x:a.x,y:a.y},
   x=projectile.x,y=projectile.y,living=projectile.active?1:0,
   flight=clamp(t/.7),q=smooth(flight),
   elapsed=state.hitAge,
   impact=Number.isFinite(elapsed)&&elapsed>=0&&elapsed<.26?clamp(elapsed/.26):0,
   target=state.hitPoint||b;
  place(ball,x,y,37+4*Math.sin(t*PI*9),31+4*Math.sin(t*PI*9),
   living*.97,24*Math.sin(t*PI*4));
  place(shine,x-5,y-7,16,15,living*.88);
  trail.forEach((img,i)=>{
   const old=clamp(q-(i+1)*.13);
   const alpha=living*(.35-i*.045)*smooth((t-i*.02)/.1);
   place(img,mix(a.x+12,x,old),mix(a.y-9,y,old)-
    12*Math.sin(old*PI)+5*Math.sin(i*3),17-i,11-i,alpha,i*13);
  });
  const splash=impact>0?fade(impact,.12,.85):0;
  ink.forEach((img,i)=>{
   const angle=2.399963*i+Math.sin(i*2)*.15,
   outward=7+impact*(26+(i%4)*5),
   px=target.x+Math.cos(angle)*outward,
   py=target.y+Math.sin(angle)*outward*.75+impact*impact*18;
   place(img,px,py,15-(i%3)*2,11-(i%3)*2,splash*(.83-(i%4)*.08),i*29);
  });
  place(ripple,target.x,target.y,15+impact*62,12+impact*48,splash*.36);
 }};
}
 // Next two offensives from the original 18; these never alter approved
// Triple Kick or Octazooka and never create false remote damage.
function createFalseSwipe(scene){
 // One deliberate blade, a precise P2 Acometida, and tiny glints on
 // confirmed contact. Not multiple gigantic colored knife triangles.
 const thrust=part(scene,attackSheet(scene),0xffffff,1538);
 const arc=part(scene,arcKey(scene,"golpe"),0xffffff,1540);
 const slicing=part(scene,"vfx-cuchilla",0xffffff,1541);
 const glints=Array.from({length:6},(_,i)=>part(scene,"p-estrella",
  i%2?0xc8f5ff:0xf8fff1,1542));
 return {sprites:[thrust,arc,slicing,...glints],update(t,a,b,state={}){
  const target=state.hitPoint||b,actor=state.actor||a,dir=state.dirX??1;
  const wind=t<.52?fade(t/.52,.05,.82):0;
  framePlace(thrust,actor.x+dir*15,actor.y-3,
   63,30,wind*.7,frameAt(t,.25,3),0,dir<0);
  const age=state.hitAge,hit=Number.isFinite(age)&&age>=0&&age<.26;
  const u=hit?clamp(age/.26):0,opacity=hit?fade(u,.045,.82):0;
  framePlace(arc,target.x-dir*6,target.y,49,36,opacity,
    frameAt(u,1,4),dir<0?-12:12,dir<0);
  framePlace(slicing,target.x+dir*3,target.y-4,34,25,
   opacity*(.54+u*.16),3+frameAt(u,.95,3),dir<0?-12:12);
  glints.forEach((img,i)=>{
   const ang=2.399963*i,dist=5+u*(14+i*2);
   place(img,target.x+Math.cos(ang)*dist,
    target.y+Math.sin(ang)*dist*.72,
    4+i%2,4+i%2,opacity*(.68-i*.07));
  });
 }};
}
function createSteelWing(scene){
 // Native P2 Fly (animated wing wind-up) + real metallic ARC frames,
 // recolored via P2 vfx.hay('arco-acero') at cast time.
 const wing=part(scene,"vfx-fly",0xffffff,1537);
 const arcs=[
  part(scene,arcKey(scene,"acero"),0xffffff,1541),
  part(scene,arcKey(scene,"acero"),0xffffff,1542)
 ];
 const feathers=Array.from({length:5},()=>part(scene,"vfx-aeroblast",0xd5efff,1539));
 const sparks=Array.from({length:3},()=>part(scene,"p-estrella",0xf4fbff,1544));
 return {sprites:[wing,...arcs,...feathers,...sparks],update(t,a,b,state={}){
  const actor=state.actor||a,target=state.hitPoint||b,dir=state.dirX??1;
  const wind=t<.54?fade(t/.54,.04,.81):0;
  framePlace(wing,actor.x-dir*8,actor.y-15,76,49,wind*.85,
   frameAt(t,.38,3),0,dir<0);
  feathers.forEach((img,i)=>{
   const drift=t*43+i*5;
   framePlace(img,actor.x-dir*(4+i*7+drift*.3),
    actor.y-9+(i-2)*5,15,11,wind*(.39-i*.035),
    (i+frameAt(t,.38,3))%6,dir<0?180:0);
  });
  const age=state.hitAge,hit=Number.isFinite(age)&&age>=0&&age<.32;
  const u=hit?clamp(age/.32):0,opacity=hit?fade(u,.04,.82):0;
  arcs.forEach((img,i)=>{
   const q=clamp((u-i*.17)/.83);
   framePlace(img,target.x+dir*(i?-5:6),target.y+(i?8:-6),
    64,44,opacity*(i===0?1:.73)*smooth((u-i*.12)/.12),
    4+frameAt(q,1,4),i===0?22:-27,dir<0);
  });
  sparks.forEach((img,i)=>{
   const theta=i*2.4,q=9+u*23;
   place(img,target.x+Math.cos(theta)*q,
    target.y+Math.sin(theta)*q*.74,6,6,
    opacity*(.81-i*.17),i*33);
  });
 }};
}
function createRockSmash(scene){
 // A rock visibly SHATTERS only if the native P2 recibir confirms contact.
 // Original animated P2 rock-fin frames 8..11 plus small flying stone shards.
 const strike=part(scene,attackSheet(scene),0xffffff,1538);
 const rock=part(scene,"vfx-roca",0xffffff,1540);
 const shards=Array.from({length:5},()=>part(scene,"vfx-roca",0xffffff,1541));
 const crumbs=Array.from({length:4},()=>part(scene,"p-guijarro",0xd7ba91,1542));
 return {sprites:[strike,rock,...shards,...crumbs],update(t,a,b,state={}){
  const actor=state.actor||a,target=state.hitPoint||b,dir=state.dirX??1;
  const wind=t<.49?fade(t/.49,.045,.78):0;
  framePlace(strike,actor.x+dir*15,actor.y,60,29,
   wind*.78,frameAt(t,.29,3),dir<0?180:0);
  const age=state.hitAge,hit=Number.isFinite(age)&&age>=0&&age<.36;
  const u=hit?clamp(age/.36):0,opacity=hit?fade(u,.025,.86):0;
  framePlace(rock,target.x,target.y,40+u*5,39+u*5,opacity,
   8+frameAt(u,1,4));
  shards.forEach((img,i)=>{
   const theta=(i*.8-.9)*Math.PI,dist=6+u*(21+i*2);
   const xx=target.x+Math.cos(theta)*dist;
   const yy=target.y+Math.sin(theta)*dist*.7+u*u*12;
   framePlace(img,xx,yy,12+i%2*3,11+i%2*3,
    opacity*(.8-i*.08),8+frameAt(clamp(u+i*.12),1,4),i*42);
  });
  crumbs.forEach((img,i)=>{
   const theta=i*PI*.5+.4,dist=4+u*(10+i*3);
   place(img,target.x+Math.cos(theta)*dist,
    target.y+Math.sin(theta)*dist*.75+u*u*8,
    4,4,opacity*(.68-i*.11),i*45);
  });
 }};
}
// Wave 3: user-approved prior VFX are FROZEN. Four independent source-sheet
// animations, contact-bound native HP, no large stretched MAPAS glyphs.
export function johtoBatch3Roll(id,random=Math.random){
 const u=Math.max(0,Math.min(.999999,Number(random())));
 if(id==="present"){
  if(u<.4)return {power:40,heal:false};
  if(u<.7)return {power:80,heal:false};
  if(u<.8)return {power:120,heal:false};
  return {power:0,heal:true};
 }
 if(id==="magnitude"){
  const thresholds=[.05,.15,.35,.65,.85,.95,1],
   powers=[10,30,50,70,90,110,150];
  let i=thresholds.findIndex(t=>u<t);if(i<0)i=6;
  return {level:4+i,power:powers[i],heal:false};
 }
 return null;
}
function createReturn(scene){
 const drive=part(scene,"vfx-quickattack",0xffffff,1536);
 const arcs=[part(scene,arcKey(scene,"golpe"),0xffffff,1540),
  part(scene,"vfx-acometida",0xffffff,1541)];
 const hearts=Array.from({length:5},()=>part(scene,"p-corazon",0xffe8c5,1542));
 return {sprites:[drive,...arcs,...hearts],update(t,a,b,state={}){
  const actor=state.actor||a,dir=state.dirX??1,
   wind=t<.53?fade(t/.53,.05,.84):0,target=state.hitPoint||b,
   age=state.hitAge,hit=Number.isFinite(age)&&age>=0&&age<.27;
  framePlace(drive,actor.x-dir*16,actor.y-10,61,30,wind*.9,
   frameAt(t,.45,2),0,dir<0);
  const u=hit?clamp(age/.27):0,alpha=hit?fade(u,.045,.83):0;
  framePlace(arcs[0],target.x,target.y,55,40,alpha,
   4+frameAt(u,1,4),dir<0?18:-18,dir<0);
  framePlace(arcs[1],target.x-dir*10,target.y,65,34,alpha*.6,
   frameAt(u,1,3),0,dir<0);
  hearts.forEach((o,i)=>{const k=u*(9+i*4),phi=i*2.3999;
   place(o,target.x+Math.cos(phi)*k,target.y+Math.sin(phi)*k*.7,
    6,7,alpha*(.57-i*.07),0);
  });
 }};
}
function createFrustration(scene){
 const dash=part(scene,"vfx-quickattack",0xf8a39d,1536);
 const slash=[part(scene,arcKey(scene,"sombra"),0xff846d,1540),
  part(scene,"vfx-astonish",0xe88a72,1541)];
 const sparks=Array.from({length:8},()=>part(scene,"p-brasa",0xf17b55,1542));
 return {sprites:[dash,...slash,...sparks],update(t,a,b,state={}){
  const actor=state.actor||a,dir=state.dirX??1,
   wind=t<.55?fade(t/.55,.05,.85):0,target=state.hitPoint||b,
   age=state.hitAge,hit=Number.isFinite(age)&&age>=0&&age<.32;
  framePlace(dash,actor.x-dir*15,actor.y-10,62,34,wind*.87,
   frameAt(t,.42,2),0,dir<0);
  const u=hit?clamp(age/.32):0,alpha=hit?fade(u,.055,.81):0;
  framePlace(slash[0],target.x,target.y,64,45,alpha,
   4+frameAt(u,1,4),dir<0?-22:22,dir<0);
  framePlace(slash[1],target.x-3,target.y-7,30,28,alpha*.7,
   frameAt(u,1,5));
  sparks.forEach((o,i)=>{const angle=i*2.3999,dist=7+u*(13+i);
   place(o,target.x+Math.cos(angle)*dist,
    target.y+Math.sin(angle)*dist*.75+u*u*4,
    5+i%2*2,5+i%2*2,alpha*(.8-i*.055),i*17);
  });
 }};
}
function createPresent(scene){
 const gift=part(scene,"vfx-huevo",0xffffff,1540);
 const glint=part(scene,"p-estrella",0xfde6a6,1541);
 const wrapping=Array.from({length:3},()=>part(scene,"p-corazon",0xffa9bb,1539));
 const blast=[part(scene,"vfx-hiper_impacto",0xffffff,1541),
  part(scene,"vfx-huevo",0xffffff,1542)];
 const heal=Array.from({length:6},()=>part(scene,"p-corazon",0x8affd3,1543));
 return {sprites:[gift,glint,...wrapping,...blast,...heal],update(t,a,b,state={}){
  const p=state.projectile||{x:a.x,y:a.y,active:false},dir=state.dirX??1,
   moving=!!p.active;
  framePlace(gift,p.x,p.y-7,28,27,moving*.98,
   Math.floor(t*17)%4,0,dir<0);
  place(glint,p.x-6,p.y-15,7,7,moving*.72);
  wrapping.forEach((o,i)=>{
   const k=(t*8+i/3)%1;
   place(o,p.x-8-dir*i*6,p.y-2+Math.sin(k*Math.PI*2+i)*8,
     5,5,moving*(.38-i*.08),i*20);
  });
  const age=state.hitAge,target=state.hitPoint||b,
   hit=Number.isFinite(age)&&age>=0&&age<.32,
   u=hit?clamp(age/.32):0,alpha=hit?fade(u,.045,.83):0,
   recovered=state.heal===true;
  framePlace(blast[0],target.x,target.y,59,51,
   recovered?0:alpha,frameAt(u,1,4));
  framePlace(blast[1],target.x,target.y,34,32,
   recovered?0:alpha*.66,8+frameAt(u,1,4));
  heal.forEach((o,i)=>{
   const theta=i*2.3999,dist=8+u*(9+i*3);
   place(o,target.x+Math.cos(theta)*dist,
    target.y+Math.sin(theta)*dist*.74-u*10,
    7,7,recovered?alpha*(.9-i*.08):0,i*35);
  });
 }};
}
function createMagnitude(scene){
 const fractures=Array.from({length:7},()=>part(scene,"vfx-roca",0xffffff,1540));
 const rubble=Array.from({length:12},()=>part(scene,"p-guijarro",0xcfb584,1541));
 const dust=Array.from({length:5},()=>part(scene,"p-roca",0x927255,1539));
 return {sprites:[...fractures,...rubble,...dust],update(t,a,b,state={}){
  const age=state.hitAge,target=state.hitPoint||b,
   hit=Number.isFinite(age)&&age>=0&&age<.44,
   u=hit?clamp(age/.44):0,opacity=hit?fade(u,.04,.86):0,
   power=state.power??70,scale=.75+Math.min(1,power/150);
  fractures.forEach((o,i)=>{const phi=i*Math.PI*2/7,dist=10+u*(17+i%3*5)*scale;
   framePlace(o,target.x+Math.cos(phi)*dist,
    target.y+12+Math.sin(phi)*dist*.44,
    20+scale*8,17+scale*8,opacity*(.85-i*.07),
    8+frameAt(clamp(u+i*.08),1,4),i*22);
  });
  rubble.forEach((o,i)=>{const angle=i*2.3999,dist=6+u*(15+i%4*6)*scale;
   place(o,target.x+Math.cos(angle)*dist,
    target.y+10+Math.sin(angle)*dist*.37-u*10+u*u*13,
    5+i%3,4+i%2,opacity*(.77-i*.045),i*21);
  });
  dust.forEach((o,i)=>{const x=target.x+(i-2)*21*scale;
   place(o,x,target.y+17+u*8,12+i%2*6,7,opacity*.3,0);
  });
 }};
}

// Fourth visual review: native Poké Arena 2D sprite sheets for the last
// four offensive Johto identities. Never import unapproved rectangle strips.
function createPursuit(scene){
 // PURSUIT: chase, not a spell. Short 2-frame P2 Quick Attack and three
 // restrained trailing silhouettes track the *actual* attacker. Only real
 // body contact produces a small dark physical hit; no teleport/HEX pillar.
 const dash=part(scene,"vfx-quickattack",0xd4b9f2,1537);
 const traces=Array.from({length:4},()=>part(scene,"vfx-astonish",0x9979bd,1536));
 const hits=Array.from({length:3},()=>part(scene,"vfx-astonish",0xc59fe6,1542));
 const dust=Array.from({length:4},()=>part(scene,"p-sombra",0x8b6cad,1543));
 return {sprites:[dash,...traces,...hits,...dust],update(t,a,b,state={}){
  const actor=state.actor||a,dir=state.dirX??1,
   wind=t<.58?fade(t/.58,.035,.9):0;
  framePlace(dash,actor.x-dir*16,actor.y-8,51,26,wind*.85,
    Math.floor(t*22)%2,0,dir<0);
  traces.forEach((o,i)=>{
   const delay=.035+i*.048,alpha=wind*(.59-i*.09)*
    smooth((t-delay)/.12);
   framePlace(o,actor.x-dir*(12+i*9),
    actor.y-5+Math.sin(i*1.7)*4,
    17+i%2*2,17+i%2*2,alpha,(Math.floor(t*21)+i)%8);
  });
  const age=state.hitAge,hit=Number.isFinite(age)&&age>=0&&age<.23,
   u=hit?clamp(age/.23):0,alpha=hit?fade(u,.045,.79):0,
   target=state.hitPoint||b;
  // One restrained dark burst precisely at the collision, NOT a tall
  // ray, large magic ring or borrowed Beat Up physical combo.
  hits.forEach((o,i)=>{
   const phase=clamp((u-i*.12)/.85);
   framePlace(o,target.x+(i-1)*7,target.y+(i%2?6:-5),
    21+i*2,20+i*2,alpha*(.86-i*.24),
    (Math.floor(phase*7)+i)%8);
  });
  dust.forEach((o,i)=>{
   const dx=(i%2?-1:1)*(5+u*(6+i*2));
   place(o,target.x+dx,target.y+(i-1.5)*5-u*3,
     4+i%2,4+i%2,alpha*(.43-i*.075));
  });
 }};
}
function createVitalThrow(_scene){
 // Deliberately NO supplementary VFX. The P2 fighter advances and the
 // real opponent jumps at the actual collision tick, nothing else.
 return {sprites:[],update(){}};
}
function createHiddenPower(scene){
 const core=part(scene,"vfx-psico",0xffffff,1539);
 const aura=part(scene,"vfx-psywave",0xffffff,1540);
 const tails=Array.from({length:5},()=>part(scene,"vfx-psywave",0xc9b1ff,1538));
 const shards=Array.from({length:5},()=>part(scene,"p-psiquico",0xd3bcff,1542));
 return {sprites:[core,aura,...tails,...shards],update(t,a,b,state={}){
  const p=state.projectile||{active:false,x:a.x,y:a.y},on=p.active?1:0;
  framePlace(core,p.x,p.y,34,34,on*.95,Math.floor(t*22)%8);
  framePlace(aura,p.x,p.y,45,43,on*.69,Math.floor(t*19)%6);
  tails.forEach((o,i)=>{
   framePlace(o,p.x-(i+1)*(state.dirX??1)*8,p.y-4+(i%2)*8,
    17+i%2*4,18+i%2*4,on*(.47-i*.07),(i+Math.floor(t*18))%6);
  });
  const age=state.hitAge,valid=Number.isFinite(age)&&age>=0&&age<.34,
    u=valid?clamp(age/.34):0,alpha=valid?fade(u,.045,.85):0,
    target=state.hitPoint||b;
  shards.forEach((o,i)=>{
   const phi=i*2.3999,d=8+u*(14+i*2);
   place(o,target.x+Math.cos(phi)*d,target.y+Math.sin(phi)*d*.8,
    7+i%2*2,7+i%2*2,alpha*(.79-i*.08),i*34);
  });
 }};
}
function createBeatUp(scene){
 // BEAT UP: a per-party-member short physical flurry. Each confirmed
 // P2 contact gets THREE tiny rhythmic contact animations, but only ONE
 // real damage event per valid member. No darkness, pursuit, spin or magic.
 const punches=Array.from({length:3},()=>part(scene,attackSheet(scene),0xffffff,1540));
 const impacts=Array.from({length:3},()=>part(scene,"vfx-hiper_impacto",0xffedd0,1542));
 const glints=Array.from({length:4},()=>part(scene,"p-estrella",0xffddb0,1543));
 return {sprites:[...punches,...impacts,...glints],update(t,a,b,state={}){
  const target=state.hitPoint||b,age=state.hitAge,
    connected=Number.isFinite(age)&&age>=0&&age<.28,
    hitNo=Number.isInteger(state.hitIndex)?state.hitIndex:0,
    dir=state.dirX??1;
  punches.forEach((o,i)=>{
   const local=connected?(age-i*.066)/.094:-1,
    active=local>=0&&local<1,phase=active?clamp(local):0,
    amp=active?fade(phase,.07,.82):0,
    side=(hitNo+i)%2?-1:1;
   framePlace(o,target.x-side*dir*(15-phase*13),
    target.y+(i-1)*8,30,18,amp*.9,
    Math.min(2,Math.floor(phase*3)),0,side<0);
   framePlace(impacts[i],target.x+side*4,target.y+(i-1)*8,
    25,23,amp*.71,Math.min(5,Math.floor(phase*6)));
  });
  glints.forEach((o,i)=>{
   const j=i%3,local=connected?(age-j*.066)/.094:-1,
     ok=local>=0&&local<1,u=ok?clamp(local):0,
     side=(hitNo+j)%2?-1:1;
   place(o,target.x+side*(7+u*(4+i%2*3)),
     target.y+(j-1)*8+(i%2?5:-5),
     5,5,ok?fade(u,.08,.8)*(.53-i*.08):0);
  });
 }};
}
const FACTORIES=Object.freeze({
 "triple-kick":createTriple,thief:createThief,snore:createSnore,
 octazooka:createOcta,"false-swipe":createFalseSwipe,"steel-wing":createSteelWing,
 "rock-smash":createRockSmash,
 return:createReturn,present:createPresent,frustration:createFrustration,magnitude:createMagnitude,
 pursuit:createPursuit,"vital-throw":createVitalThrow,
 "hidden-power":createHiddenPower,"beat-up":createBeatUp
});
export function makeJohtoFourNative(scene,id){
 if(!scene?.textures||!FACTORIES[id])return null;
 // Check actual source textures: no fallback to the rejected blocky spritesheets.
 const required={
  "triple-kick":["p-cuchilla","p-estrella","p-aura"],
  thief:["vfx-quickattack","vfx-arco","vfx-astonish","p-sombra","p-estrella"],
  snore:["p-hipnosis","p-aura","p-estrella","p-psiquico","p-espuma"],
  octazooka:["p-fantasma","p-agua","p-aura"],
  "false-swipe":["vfx-acometida","vfx-arco","vfx-cuchilla","p-estrella"],
  "steel-wing":["vfx-fly","vfx-arco","vfx-aeroblast","p-estrella"],
  "rock-smash":["vfx-acometida","vfx-roca","p-guijarro"],
  return:["vfx-quickattack","vfx-arco","vfx-acometida","p-corazon"],
  frustration:["vfx-quickattack","vfx-arco","vfx-astonish","p-brasa"],
  present:["vfx-huevo","p-estrella","p-corazon","vfx-hiper_impacto"],
  magnitude:["vfx-roca","p-guijarro","p-roca"],
  pursuit:["vfx-quickattack","vfx-astonish","p-sombra"],
  "vital-throw":[], // Body-only fighter advance and enemy salto
  "hidden-power":["vfx-psico","vfx-psywave","p-psiquico"],
  "beat-up":["vfx-acometida","vfx-hiper_impacto","p-estrella"]
 }[id];
 if(!required.every(t=>scene.textures.exists(t)))return null;
 const fx=FACTORIES[id](scene),sprites=fx.sprites.filter(Boolean);
 if(!sprites.length&&id!=="vital-throw")
  throw Error("Native Johto move unexpectedly missing animation layers: "+id);
 return {source:id==="vital-throw"?"pokearena2d-native-body-motion":"pokearena2d-native-textures",id,sprites,
  update(progress,caster,target,state={}){
   const t=clamp(progress);
   fx.update(t,caster,target,state);
  },
  destroy(){for(const sprite of sprites)if(sprite.active)sprite.destroy()}
 };
}

/* Native Poké Arena 2D source: habilidades.js#tocaCuerpo and
 * luchador.js#recibir. This is a scoped adaptation of the client contact
 * geometry and movement into an isolated Johto lab, not a substitute
 * fake target-centered damage function. */
export function johtoP2BodyContact(r,x,y,rad,alt=0,radio=18){
 if(!r||r.ko||r.est?.vuelo||!Number.isFinite(x)||!Number.isFinite(y))
  return false;
 const height=Math.max(r.alto??24,2*radio),ys=y-alt;
 const cx=Math.max(r.x-radio,Math.min(r.x+radio,x));
 const cy=Math.max(r.y-height,Math.min(r.y,ys));
 return Math.hypot(x-cx,ys-cy)<=rad;
}
export function johtoP2Advance(from,angle,distance,progress){
 const u=smooth(progress),d=Math.max(0,distance)*u;
 return {x:from.x+Math.cos(angle)*d,y:from.y+Math.sin(angle)*d};
}
export function castJohtoFourNative(l,h,extra,nativeRadio=18){
 const e=l?.escena,r=l?.rival,id=h?.id;
 if(!e?.datos?.johtoLab||!r||r.ko||!FACTORIES[id])return false;
 if(id==="snore"&&!l.est?.dormido)return false;
 const visual=makeJohtoFourNative(e,id);
 if(!visual)return false;
 const source={x:l.x,y:l.y},aimX=Number.isFinite(l.ax)?l.ax:r.x,
  aimY=Number.isFinite(l.ay)?l.ay:r.y;
 const angle=Math.atan2(aimY-source.y,aimX-source.x),
  ux=Math.cos(angle),uy=Math.sin(angle),
  distance=Math.hypot(aimX-source.x,aimY-source.y),
  melee=!["snore","octazooka","present","magnitude","hidden-power"].includes(id),
  seismic=id==="magnitude",
  duration=id==="triple-kick"?.77:id==="thief"?.71:
   id==="false-swipe"?.74:id==="steel-wing"?.78:
   id==="rock-smash"?.73:id==="return"?.68:id==="frustration"?.76:
   id==="present"?.89:id==="magnitude"?.88:id==="snore"?.91:
   id==="pursuit"?.73:id==="vital-throw"?.58:
   id==="hidden-power"?.94:id==="beat-up"?.99:.9,
  rise=.13,projectileSpeed=id==="snore"?260:
   id==="present"?265:id==="hidden-power"?315:350,
  maxRange=Math.max(1,h.alcance||180),
  // Native golpe/patada close into the target's actual standing hitbox.
  // The 70px Triple Kick melee reach includes a 25px physical approach.
  advance=Math.min(maxRange+(id==="triple-kick"?25:
   id==="false-swipe"||id==="steel-wing"||id==="rock-smash"||
   id==="return"||id==="frustration"||id==="pursuit"||
   id==="vital-throw"||id==="beat-up"?22:0),
   Math.max(0,distance-17)),
  startProjectile={x:source.x+ux*17,y:source.y+uy*17},
  srcVisual={x:source.x,y:source.y-l.alto*.5},
  aimedVisual={x:source.x+ux*maxRange,y:source.y+uy*maxRange-l.alto*.5},
  hitWindows=id==="triple-kick"?[.24,.40,.56]:
   id==="thief"?[.32]:id==="false-swipe"?[.34]:
   id==="steel-wing"?[.36]:id==="rock-smash"?[.34]:
   id==="return"?[.32]:id==="frustration"?[.35]:
   id==="magnitude"?[.38]:id==="pursuit"?[.35]:
   id==="vital-throw"?[]:id==="beat-up"?[.31]:[];
 const roll=id==="present"||id==="magnitude"?johtoBatch3Roll(id):null;
 // The isolated training uses a single Mewtwo unless an actual party
 // array exists. No invented teammates or non-existent extra strikes.
 const party=e.datos.johtoLab.party;
 const members=id==="beat-up"&&Array.isArray(party)&&party.length?
  party.filter(p=>p&&p.hp>0&&!p.est?.dormido&&!p.est?.veneno&&
   !p.est?.quemado&&!p.est?.paralizado&&!p.est?.congelado).slice(0,6):
  id==="beat-up"?[{baseAtk:l.def?.formas?.[0]?.atk??l.def?.atk??110}]:[];
 const beatWindows=id==="beat-up"?
  members.map((_,i)=>.31+i*.11):hitWindows;
 // Real Gen III IV formula, never quietly substitute fixed Normal power.
 // A deterministic lab Mewtwo fixture is explicit when saved IVs are absent.
 const ivs=l.ivs||e.datos.johtoLab.ivs||
  {hp:31,attack:31,defense:31,speed:31,spAttack:31,spDefense:31};
 const hidden=id==="hidden-power"?johtoHiddenPowerGen3(ivs):null;
 if(id==="hidden-power"&&!hidden){visual.destroy();return false;}
 const friendship=Number.isFinite(l.amizade)?Math.max(0,Math.min(255,l.amizade)):
  id==="return"?255:id==="frustration"?0:128;
 // No friendship engine in this isolated lab: max-power fixture only.
 const friendshipPower=id==="return"?Math.floor(friendship*10/25):
  id==="frustration"?Math.floor((255-friendship)*10/25):0;
 let age=0,nextHit=0,stop=false,hitIndex=-1,hitAt=-Infinity,
  vitalLiftBaseline=null,vitalLiftApplied=null,
  hitPoint=null,projectileAlive=!melee,previousDistance=0,done=false;
 const action={hasta:l.t+duration,bloquea:true,lento:0,angulo:angle};
 l.accion=action;
 l.animar(h.anim||(melee?"Attack":"Shoot"),duration,.14);
 const contact=(index,px,py)=>{
  if(stop||r.ko||l.ko||r.est?.vuelo)return false;
  if(id!=="vital-throw"&&Math.random()>h.precisao/100){
   if(id==="triple-kick")stop=true;return false;
  }
  const dx=r.x-l.x,dy=r.y-l.y,d=Math.hypot(dx,dy)||1;
  const mult=id==="triple-kick"?index+1:1;
  if(id==="present"&&roll?.heal){
   // Present heals the opponent by 25% max HP (Gen III).
   const before=r.hp,amount=Math.max(1,Math.floor(r.hpMax*.25));
   if(typeof r.curar==="function")r.curar(amount);
   else r.hp=Math.min(r.hpMax,r.hp+amount);
   hitIndex=index;hitAt=age;hitPoint={x:r.x,y:r.y-r.alto*.5};
   return r.hp>=before;
  }
  const powerMultiplier=id==="present"?(roll.power/40):
   id==="magnitude"?(roll.power/70):
   id==="return"||id==="frustration"?friendshipPower/102:
   id==="hidden-power"?hidden.power/60:
   id==="beat-up"?Math.max(.4,Math.min(1,
    (Number(members[index]?.baseAtk??members[index]?.atk??110)/110)*.58)):1;
  // Pursuit's switch interception only triggers if the target genuinely
  // enters a switch/recall action; isolated Mewtwo lab has no switching.
  const pursuitSwitch=id==="pursuit"&&
   (r.est?.retirada||r.accion?.tipo==="cambio"||r.accion?.tipo==="retirada");
  const pursued=id==="pursuit"&&pursuitSwitch?2:1;
  // Use the original fighter damage pipeline: defenses, typing, shields,
  // training ledger, knockback and HP all remain in native recibir().
  // False Swipe is a non-KO technique (at least 1 HP). Native recibir
  // already implements this through the existing inmortal HP floor.
  const keepAlive=id==="false-swipe",wasImmortal=r.inmortal;
  if(keepAlive)r.inmortal=true;
  let result;
  try{
   result=r.recibir(l,{dano:h.dano*mult*powerMultiplier*pursued,
    tipo:id==="hidden-power"?hidden.type:h.tipo,
    slot:extra?.slot,surge:extra?.surge,
    empuje:id==="vital-throw"?0:melee?14:10,
    dirX:dx/d,dirY:dy/d,proyectil:!melee,tick:index>0});
  }finally{if(keepAlive)r.inmortal=wasImmortal}
  if(result!=="golpe")return false;
  hitIndex=index;hitAt=age;hitPoint={x:r.x,y:r.y-r.alto*.5};
  if(id==="vital-throw"&&vitalLiftBaseline==null){
   // P2 renderer uses salto for visual elevation, without moving r.y,
   // collision box, team slot, stat data or save records.
   vitalLiftBaseline=Number(r.salto)||0;
   vitalLiftApplied=vitalLiftBaseline+6;
   // Same tick as confirmed P2 recibir, no arbitrary timed impact.
   r.salto=vitalLiftApplied;
  }
  // Gen III Snore: can flinch on a successful hit; in the real-time P2
  // client this is the native brief aturdido action interruption.
  if(id==="snore"&&Math.random()<.3)r.ponerEstado?.("aturdido",.24);
  // P2-native Armor Break is the closest real-time semantic analogue to
  // Gen III Rock Smash's 50% chance of one Defense stage down.
  // No direct mutation of the permanent Pokemon base DEF value.
  if(id==="rock-smash"&&Math.random()<.5)r.ponerEstado?.("armaduraRota",3);
  return true;
 };
 const obj={update(dt){
  age+=Math.max(0,Math.min(.05,Number(dt)||0));
  if(age>=duration||l.ko||!e.scene.isActive()){
   obj.destroy();return false;
  }
  if(seismic){
   if(nextHit===0&&age>=hitWindows[0]){
    nextHit++;
    // Earth tremor reaches nearby grounded rivals; never strike airborne
    // targets or create a fake hit before the shock wave.
    if(Math.hypot(l.x-r.x,l.y-r.y)<=Math.max(150,maxRange)&&
       !r.est?.vuelo)contact(0,r.x,r.y);
   }
  }else if(melee){
   // Native golpe()/patada() move the fighter before validating body
   // contact, never make impact sprites appear at remote targets.
   const next=johtoP2Advance(source,angle,advance,age/.19);
   l.x=next.x;l.y=next.y;
   l.limitar?.();
   // Vital Throw hits at the FIRST true P2 body overlap while advancing.
   // It does not wait for an impact timestamp after contact.
   if(id==="vital-throw"&&nextHit===0&&
      johtoP2BodyContact(r,l.x,l.y,24,0,nativeRadio)){
    nextHit=1;
    contact(0,l.x,l.y);
   }
   while(nextHit<beatWindows.length&&age>=beatWindows[nextHit]){
    const index=nextHit++;
    if(stop)break;
    if(!johtoP2BodyContact(r,l.x,l.y,
      id==="triple-kick"?16:id==="thief"?20:24,0,nativeRadio)){
     if(id==="triple-kick")stop=true;
     continue;
    }
    contact(index,l.x,l.y);
   }
  }else{
   // Native Proyectil checks the path every update and calls recibir only
   // when its body volume actually intersects the opponent. Do not grant
   // damage because an effect merely reached a precomputed time window.
   if(projectileAlive&&age>=rise){
    const distanceNow=Math.min(maxRange,(age-rise)*projectileSpeed);
    const start=Math.max(0,previousDistance);
    const segments=Math.max(1,Math.ceil((distanceNow-start)/6));
    for(let i=1;i<=segments;i++){
     const dist=start+(distanceNow-start)*i/segments;
     const x=startProjectile.x+ux*dist,y=startProjectile.y+uy*dist;
     if(johtoP2BodyContact(r,x,y,id==="octazooka"?11:id==="present"?12:18,
       l.alto*.5,nativeRadio)){
      projectileAlive=false;
      contact(0,x,y);
      break;
     }
    }
    previousDistance=distanceNow;
    if(distanceNow>=maxRange)projectileAlive=false;
   }
  }
  const hitAge=age-hitAt;
  if(id==="vital-throw"&&vitalLiftBaseline!=null&&!r.ko){
   const u=clamp((hitAge+.024)/.32);
   vitalLiftApplied=vitalLiftBaseline+Math.round(Math.sin(u*Math.PI)*28);
   r.salto=vitalLiftApplied;
  }
  const livePoint={
   x:startProjectile.x+ux*previousDistance,
   y:startProjectile.y+uy*previousDistance-l.alto*.5,
   active:projectileAlive&&age>=rise
  };
  if(id==="triple-kick")
   visual.update(age/duration,srcVisual,hitPoint||aimedVisual,
    {hitIndex,hitAge,hitPoint});
  else if(id==="thief"||id==="false-swipe"||
   id==="steel-wing"||id==="rock-smash"||id==="return"||
   id==="frustration"||id==="pursuit"||id==="vital-throw"||id==="beat-up")
   visual.update(age/duration,srcVisual,hitPoint||aimedVisual,
    {hitAge,hitPoint,hitIndex,actor:{x:l.x,y:l.y-l.alto*.5},dirX:ux,dirY:uy});
  else if(id==="magnitude")
   visual.update(age/duration,srcVisual,hitPoint||aimedVisual,
    {hitAge,hitPoint,power:roll?.power,level:roll?.level});
  else if(id==="snore")
   visual.update(age/duration,srcVisual,aimedVisual,{hitAge,hitPoint,projectile:livePoint});
  else
   visual.update(age/duration,srcVisual,hitPoint||aimedVisual,
    {hitAge,hitPoint,projectile:livePoint,heal:roll?.heal,dirX:ux,
     type:hidden?.type});
  return true;
 },destroy(){
  if(done)return;
  done=true;visual.destroy();
  // Restore only elevation owned by this one isolated throw.
  if(id==="vital-throw"&&vitalLiftBaseline!=null&&r.salto===vitalLiftApplied)
   r.salto=vitalLiftBaseline;
  if(l.accion===action)l.accion=null;
 }};
 e.efectos.push(obj);
 return true;
}
