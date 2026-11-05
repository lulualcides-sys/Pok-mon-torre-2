/* Johto rework v3: genuine native Poké Arena 2D battle texture choreography.
 * Previous 24-frame hand-drawn shapes were rejected: do not display them.
 * 60fps Phaser Image layers, transform/opacity only (no rectangle drawings,
 * giant alpha blocks, Canvas 2D or CSS). Textures already loaded by original
 * game; references individually mapped in johto-lab-pixelart.js.
 * The 3 approved effects NEVER enter this module.
 */
export const JOHTO_FOUR_NATIVE_IDS=Object.freeze([
 "triple-kick","thief","snore","octazooka"
]);
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
 const body=part(scene,"p-fantasma",0xb6a0fb,1534);
 const cut=part(scene,"p-cuchilla",0xd9b8ff,1536);
 const spark=part(scene,"p-estrella",0xfff0ae,1537);
 const copies=Array.from({length:5},()=>part(scene,"p-fantasma",0x5d428e,1532));
 const stolen=part(scene,"p-aura",0xf0dcae,1535);
 return {sprites:[body,cut,spark,stolen,...copies],update(t,a,b,state={}){
  // Teleport forward, steal on contact, retreat with a small golden glint.
  const outbound=t<.46,phase=outbound?clamp(t/.46):clamp((t-.46)/.54);
  const q=outbound?smooth(phase):1-smooth(phase);
  const x=mix(a.x,b.x,q),y=mix(a.y,b.y,q)-21*Math.sin(q*PI);
  const active=fade(t,.07,.9);
  place(body,x,y,37,31,active*.85,18*Math.sin(t*PI*3));
  copies.forEach((img,i)=>{
   const old=clamp(outbound?q-(i+1)*.14:q+(i+1)*.13);
   place(img,mix(a.x,b.x,old),mix(a.y,b.y,old)-19*Math.sin(old*PI),31-i*2,24-i,
    active*(.23-i*.03),0,i%2===0);
  });
  const elapsed=state.hitAge;
  const contact=Number.isFinite(elapsed)&&elapsed>=0&&elapsed<.22?
   fade(elapsed/.22,.07,.81):0;
  const hit=state.hitPoint||b;
  place(cut,hit.x,hit.y-4,58,38,contact,-31);
  place(spark,hit.x+8,hit.y-7,27,27,contact);
  const back=Number.isFinite(elapsed)&&elapsed>=0&&elapsed<.36?
   fade(elapsed/.36,.09,.87):0;
  place(stolen,x+10,y-12,17,17,back,0);
 }};
}
function createSnore(scene){
 // No attack while awake: existing battle logic keeps this restriction.
 const waves=Array.from({length:5},()=>part(scene,"p-hipnosis",0x9feeff,1533));
 const echoes=Array.from({length:5},()=>part(scene,"p-aura",0x59cad8,1532));
 const nose=part(scene,"p-espuma",0xd7fbff,1534);
 return {sprites:[...waves,...echoes,nose],update(t,a,b){
  for(let i=0;i<5;i++){
   const q=(t*1.65-i*.23);
   const p=clamp(q),alive=q>=0&&q<=1?fade(p,.14,.79):0;
   const x=mix(a.x+14,b.x-6,p),y=mix(a.y-17,b.y-8,p)+Math.sin(PI*3*p+i)*4;
   place(waves[i],x,y,18+p*28,24+p*20,alive*.83,
    9*Math.sin(i+q*3),i%2===1);
   place(echoes[i],x-7,y-4,20+p*13,16+p*19,alive*.28);
  }
  const puff=.4+.28*Math.sin(t*PI*12);
  place(nose,a.x+16,a.y-14,18,13,(1-smooth((t-.75)/.25))*puff);
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
const FACTORIES=Object.freeze({
 "triple-kick":createTriple,thief:createThief,snore:createSnore,octazooka:createOcta
});
export function makeJohtoFourNative(scene,id){
 if(!scene?.textures||!FACTORIES[id])return null;
 // Check actual source textures: no fallback to the rejected blocky spritesheets.
 const required={
  "triple-kick":["p-cuchilla","p-estrella","p-aura"],
  thief:["p-fantasma","p-cuchilla","p-estrella","p-aura"],
  snore:["p-hipnosis","p-aura","p-espuma"],
  octazooka:["p-fantasma","p-agua","p-aura"]
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
  melee=id==="triple-kick"||id==="thief",
  duration=id==="triple-kick"?.77:id==="thief"?.71:id==="snore"?.91:.9,
  rise=.13,projectileSpeed=id==="snore"?260:350,
  maxRange=Math.max(1,h.alcance||180),
  // Native golpe/patada close into the target's actual standing hitbox.
  // The 70px Triple Kick melee reach includes a 25px physical approach.
  advance=Math.min(maxRange+(id==="triple-kick"?25:0),
   Math.max(0,distance-17)),
  startProjectile={x:source.x+ux*17,y:source.y+uy*17},
  srcVisual={x:source.x,y:source.y-l.alto*.5},
  aimedVisual={x:source.x+ux*maxRange,y:source.y+uy*maxRange-l.alto*.5},
  hitWindows=id==="triple-kick"?[.24,.40,.56]:id==="thief"?[.32]:[];
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
  const result=r.recibir(l,{dano:h.dano*mult,tipo:h.tipo,
   slot:extra?.slot,surge:extra?.surge,empuje:melee?14:10,
   dirX:dx/d,dirY:dy/d,proyectil:!melee,tick:index>0});
  if(result!=="golpe")return false;
  hitIndex=index;hitAt=age;hitPoint={x:r.x,y:r.y-r.alto*.5};
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
    if(!johtoP2BodyContact(r,l.x,l.y,id==="triple-kick"?16:20,0,nativeRadio)){
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
    {hitAge,hitPoint});
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
