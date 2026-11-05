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
 return{sprites:[...kicks.flatMap(x=>Object.values(x)),...trails],update(t,a,b){
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
 const body=part(scene,"p-fantasma",0x8061bc,1534);
 const cut=part(scene,"p-cuchilla",0xd9b8ff,1536);
 const spark=part(scene,"p-estrella",0xfff0ae,1537);
 const copies=Array.from({length:5},()=>part(scene,"p-fantasma",0x5d428e,1532));
 const stolen=part(scene,"p-aura",0xf0dcae,1535);
 return {sprites:[body,cut,spark,stolen,...copies],update(t,a,b){
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
  const contact=fade((t-.34)/.23,.12,.74);
  place(cut,b.x,b.y-4,52,35,contact,-31);
  place(spark,b.x+8,b.y-7,23,23,contact*.82);
  const back=fade((t-.45)/.55,.12,.87);
  place(stolen,x+10,y-12,13,13,back,0);
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
 return {sprites:[ball,shine,...trail,...ink,ripple],update(t,a,b){
  const flight=clamp(t/.67),impact=clamp((t-.67)/.33),
  q=smooth(flight),x=mix(a.x+12,b.x,q),y=mix(a.y-9,b.y-9,q)-12*Math.sin(q*PI);
  const living=(1-smooth((t-.64)/.1));
  place(ball,x,y,37+4*Math.sin(t*PI*9),31+4*Math.sin(t*PI*9),
   living*.97,24*Math.sin(t*PI*4));
  place(shine,x-5,y-7,16,15,living*.88);
  trail.forEach((img,i)=>{
   const old=clamp(q-(i+1)*.13);
   const alpha=living*(.35-i*.045)*smooth((t-i*.02)/.1);
   place(img,mix(a.x+12,b.x,old),mix(a.y-9,b.y-9,old)-
    12*Math.sin(old*PI)+5*Math.sin(i*3),17-i,11-i,alpha,i*13);
  });
  const splash=impact>0?fade(impact,.12,.83):0;
  ink.forEach((img,i)=>{
   const angle=2.399963*i+Math.sin(i*2)*.15,
   outward=7+impact*(26+(i%4)*5),
   px=b.x+Math.cos(angle)*outward,
   py=b.y+Math.sin(angle)*outward*.75+impact*impact*18;
   place(img,px,py,15-(i%3)*2,11-(i%3)*2,splash*(.83-(i%4)*.08),i*29);
  });
  place(ripple,b.x,b.y,15+impact*62,12+impact*48,splash*.36);
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
  update(progress,caster,target){
   const t=clamp(progress);
   fx.update(t,caster,target);
  },
  destroy(){for(const sprite of sprites)if(sprite.active)sprite.destroy()}
 };
}
