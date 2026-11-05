/* Johto rework v3: genuine native Poké Arena 2D battle texture choreography.
 * Previous 24-frame hand-drawn shapes were rejected: do not display them.
 * 60fps Phaser Image layers, transform/opacity only (no rectangle drawings,
 * giant alpha blocks, Canvas 2D or CSS). Textures already loaded by original
 * game; references individually mapped in johto-lab-pixelart.js.
 * The 3 approved effects NEVER enter this module.
 */
export const JOHTO_FOUR_NATIVE_IDS=Object.freeze([
 "thief","snore","false-swipe","steel-wing"
]);
export const JOHTO_APPROVED_NATIVE_IDS=Object.freeze(["triple-kick","octazooka"]);
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
 // P2 golpe() rhythm: stealth approach near the caster, two conspicuous
 // criss-cross slashes ONLY after recibir("golpe"), and a stolen-item glint
 // returning to the caster. No animated remote slash before real collision.
 const shadow=Array.from({length:5},()=>part(scene,"p-sombra",0x563688,1532));
 const cuts=[
  part(scene,"p-cuchilla",0xe5caff,1538),
  part(scene,"p-cuchilla",0xffffff,1539),
  part(scene,"p-cuchilla",0xa379ed,1537)
 ];
 const sparks=Array.from({length:5},(_,i)=>part(scene,"p-estrella",
  i%2?0xf8e5ff:0xfdeaa0,1540));
 const stolen=part(scene,"p-aura",0xffd56d,1536);
 return {sprites:[...shadow,...cuts,...sparks,stolen],update(t,a,b,state={}){
  const actor=state.actor||a,target=state.hitPoint||b;
  const stealth=fade(t,.07,.79);
  shadow.forEach((img,i)=>{
   const wobble=Math.sin(t*PI*9+i*1.6)*5,
    xx=actor.x-10-i*7,yy=actor.y-8+wobble;
   place(img,xx,yy,21-i*2,28-i,stealth*(.52-i*.075),i%2?-16:12);
  });
  const age=state.hitAge,hit=Number.isFinite(age)&&age>=0&&age<.31;
  const impact=hit?fade(age/.31,.035,.8):0;
  cuts.forEach((img,i)=>{
   const p=clamp(age/.31),shift=i===0?-1:i===1?1:0;
   place(img,target.x+shift*12,target.y+shift*7,
    62+i*11,38+i*7,impact*(i===1?1:.85),
    [39,-46,6][i]);
  });
  sparks.forEach((img,i)=>{
   const x=target.x+Math.cos(i*2.4)*(9+clamp(age/.31)*28),
    y=target.y+Math.sin(i*2.4)*(9+clamp(age/.31)*20);
   place(img,x,y,15+i%3*4,15+i%3*4,impact*(.92-i*.09),i*25);
  });
  const retreat=hit?fade(age/.31,.05,.93):0;
  const back=hit?smooth(clamp(age/.31)):0;
  place(stolen,mix(target.x,actor.x,back),mix(target.y-13,actor.y-17,back),
   21,21,retreat,0);
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
 const blades=Array.from({length:4},(_,i)=>part(scene,"p-cuchilla",
   i%2?0xd8fff7:0x79facf,1538+i));
 const glints=Array.from({length:5},()=>part(scene,"p-estrella",0xe8fffa,1541));
 const aura=part(scene,"p-aura",0x72f2b7,1535);
 return {sprites:[...blades,...glints,aura],update(t,a,b,state={}){
  const age=state.hitAge,target=state.hitPoint||b,
   hit=Number.isFinite(age)&&age>=0&&age<.36,
   q=hit?clamp(age/.36):0,alpha=hit?fade(q,.045,.83):0;
  blades.forEach((img,i)=>{
   const swap=i%2===0?-1:1,stage=clamp(q*1.3);
   place(img,target.x+swap*(18-stage*12),target.y+(i<2?-17:17),
    38+stage*30,24+stage*14,alpha*(1-i*.13),
    swap*(i<2?39:-44));
  });
  glints.forEach((img,i)=>{
   const theta=i*2.39996,dist=8+q*30;
   place(img,target.x+Math.cos(theta)*dist,
    target.y+Math.sin(theta)*dist*.75,
    16+i%2*5,16+i%2*5,alpha*(.82-i*.09),i*21);
  });
  place(aura,target.x,target.y,24+q*54,16+q*37,alpha*.34,0);
 }};
}
function createSteelWing(scene){
 const wings=Array.from({length:5},(_,i)=>part(scene,"p-cuchilla",
   i%2?0xefffff:0x8cb7d4,1536+i));
 const edges=Array.from({length:5},(_,i)=>part(scene,
   i%2?"p-estrella":"p-mira",0xd4faff,1541));
 const shock=part(scene,"p-aura",0xaed5e6,1535);
 return {sprites:[...wings,...edges,shock],update(t,a,b,state={}){
  const age=state.hitAge,target=state.hitPoint||b,
   hit=Number.isFinite(age)&&age>=0&&age<.33,
   q=hit?clamp(age/.33):0,alpha=hit?fade(q,.04,.85):0;
  wings.forEach((img,i)=>{
   const side=i%2?-1:1,spread=14+q*(17+i*2);
   place(img,target.x+side*spread*.54,target.y+(i-2)*8,
    44+i*5,17+i*4,alpha*(.92-i*.10),
    side*(48+i*7));
  });
  edges.forEach((img,i)=>{
   const angle=i*2.4+.5,dist=10+q*34;
   place(img,target.x+Math.cos(angle)*dist,
    target.y+Math.sin(angle)*dist*.68,
    15+i%3*3,15+i%3*3,alpha*(.9-i*.1),i*36);
  });
  place(shock,target.x,target.y,30+q*55,18+q*35,alpha*.38,0);
 }};
}

const FACTORIES=Object.freeze({
 "triple-kick":createTriple,thief:createThief,snore:createSnore,
 octazooka:createOcta,"false-swipe":createFalseSwipe,"steel-wing":createSteelWing
});
export function makeJohtoFourNative(scene,id){
 if(!scene?.textures||!FACTORIES[id])return null;
 // Check actual source textures: no fallback to the rejected blocky spritesheets.
 const required={
  "triple-kick":["p-cuchilla","p-estrella","p-aura"],
  thief:["p-sombra","p-cuchilla","p-estrella","p-aura"],
  snore:["p-hipnosis","p-aura","p-estrella","p-psiquico","p-espuma"],
  octazooka:["p-fantasma","p-agua","p-aura"],
  "false-swipe":["p-cuchilla","p-estrella","p-aura"],
  "steel-wing":["p-cuchilla","p-estrella","p-mira","p-aura"]
 }[id];
 if(!required.every(t=>scene.textures.exists(t)))return null;
 const fx=FACTORIES[id](scene),sprites=fx.sprites.filter(Boolean);
 if(!sprites.length)throw Error("Native Johto four effect unexpectedly empty: "+id);
 return {source:"pokearena2d-native-textures",id,sprites,
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
  melee=!["snore","octazooka"].includes(id),
  duration=id==="triple-kick"?.77:id==="thief"?.71:
   id==="false-swipe"?.74:id==="steel-wing"?.78:id==="snore"?.91:.9,
  rise=.13,projectileSpeed=id==="snore"?260:350,
  maxRange=Math.max(1,h.alcance||180),
  // Native golpe/patada close into the target's actual standing hitbox.
  // The 70px Triple Kick melee reach includes a 25px physical approach.
  advance=Math.min(maxRange+(id==="triple-kick"?25:
   id==="false-swipe"||id==="steel-wing"?18:0),
   Math.max(0,distance-17)),
  startProjectile={x:source.x+ux*17,y:source.y+uy*17},
  srcVisual={x:source.x,y:source.y-l.alto*.5},
  aimedVisual={x:source.x+ux*maxRange,y:source.y+uy*maxRange-l.alto*.5},
  hitWindows=id==="triple-kick"?[.24,.40,.56]:
   id==="thief"?[.32]:id==="false-swipe"?[.34]:id==="steel-wing"?[.36]:[];
 let age=0,nextHit=0,stop=false,hitIndex=-1,hitAt=-Infinity,
  hitPoint=null,projectileAlive=!melee,previousDistance=0,done=false;
 const action={hasta:l.t+duration,bloquea:true,lento:0,angulo:angle};
 l.accion=action;
 l.animar(h.anim||(melee?"Attack":"Shoot"),duration,.14);
 const contact=(index,px,py)=>{
  if(stop||r.ko||l.ko||r.est?.vuelo)return false;
  if(Math.random()>h.precisao/100){if(id==="triple-kick")stop=true;return false;}
  const dx=r.x-l.x,dy=r.y-l.y,d=Math.hypot(dx,dy)||1;
  const mult=id==="triple-kick"?index+1:1;
  // Use the original fighter damage pipeline: defenses, typing, shields,
  // training ledger, knockback and HP all remain in native recibir().
  // False Swipe is a non-KO technique (at least 1 HP). Native recibir
  // already implements this through the existing inmortal HP floor.
  const keepAlive=id==="false-swipe",wasImmortal=r.inmortal;
  if(keepAlive)r.inmortal=true;
  let result;
  try{
   result=r.recibir(l,{dano:h.dano*mult,tipo:h.tipo,
    slot:extra?.slot,surge:extra?.surge,empuje:melee?14:10,
    dirX:dx/d,dirY:dy/d,proyectil:!melee,tick:index>0});
  }finally{if(keepAlive)r.inmortal=wasImmortal}
  if(result!=="golpe")return false;
  hitIndex=index;hitAt=age;hitPoint={x:r.x,y:r.y-r.alto*.5};
  // Gen III Snore: can flinch on a successful hit; in the real-time P2
  // client this is the native brief aturdido action interruption.
  if(id==="snore"&&Math.random()<.3)r.ponerEstado?.("aturdido",.24);
  return true;
 };
 const obj={update(dt){
  age+=Math.max(0,Math.min(.05,Number(dt)||0));
  if(age>=duration||l.ko||!e.scene.isActive()){
   obj.destroy();return false;
  }
  if(melee){
   // Native golpe()/patada() move the fighter before validating body
   // contact, never make impact sprites appear at remote targets.
   const next=johtoP2Advance(source,angle,advance,age/.19);
   l.x=next.x;l.y=next.y;
   l.limitar?.();
   while(nextHit<hitWindows.length&&age>=hitWindows[nextHit]){
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
     if(johtoP2BodyContact(r,x,y,id==="octazooka"?11:18,
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
  const livePoint={
   x:startProjectile.x+ux*previousDistance,
   y:startProjectile.y+uy*previousDistance-l.alto*.5,
   active:projectileAlive&&age>=rise
  };
  if(id==="triple-kick")
   visual.update(age/duration,srcVisual,hitPoint||aimedVisual,
    {hitIndex,hitAge,hitPoint});
  else if(id==="thief")
   visual.update(age/duration,srcVisual,hitPoint||aimedVisual,
    {hitAge,hitPoint,actor:{x:l.x,y:l.y-l.alto*.5}});
  else if(id==="snore")
   visual.update(age/duration,srcVisual,aimedVisual,{hitAge,hitPoint,projectile:livePoint});
  else
   visual.update(age/duration,srcVisual,hitPoint||aimedVisual,
    {hitAge,hitPoint,projectile:livePoint});
  return true;
 },destroy(){
  if(done)return;
  done=true;visual.destroy();
  if(l.accion===action)l.accion=null;
 }};
 e.efectos.push(obj);
 return true;
}
