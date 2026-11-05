/* Semantic 8-bit silhouettes drawn OVER genuine PixelFX frames at BUILD TIME.
 * No Canvas2D/WebGL runtime overdraw. Not one pixel of the 3 approved VFX
 * can pass through this function. Actual PixelFX remains the base of all 43.
 */
import {JOHTO_GEN3_SPEC} from "./torre2-johto-gen3-research.js";
const WIDTH=96,FRAMES=12,STRIP=WIDTH*FRAMES;
const COOL=[187,216,238],LIGHT=[237,247,255],DARK=[92,80,145];
const GOLD=[255,220,120],PINK=[245,137,188],INK=[53,40,82],ROCK=[173,145,96];
export function addJohtoPixelSignature(strip,id){
 const spec=JOHTO_GEN3_SPEC[id];
 if(!spec||spec.approved)throw Error("Unapproved Johto art only: "+id);
 if(!(strip instanceof Uint8Array)&&!(strip instanceof Uint8ClampedArray))
  throw TypeError("Expected pixel RGBA strip");
 if(strip.length!==STRIP*WIDTH*4)throw Error("Unexpected PixelFX strip resolution");
 const paint=(frame,x,y,color,size=2)=>{
  const xx=Math.round(x),yy=Math.round(y);
  for(let dy=0;dy<size;dy++)for(let dx=0;dx<size;dx++){
   const px=xx+dx,py=yy+dy;
   if(px<0||px>=WIDTH||py<0||py>=WIDTH)continue;
   const k=(py*STRIP+frame*WIDTH+px)*4;
   strip[k]=color[0];strip[k+1]=color[1];strip[k+2]=color[2];strip[k+3]=238;
  }
 };
 const stroke=(frame,x1,y1,x2,y2,color,w=2)=>{
  const steps=Math.max(1,Math.ceil(Math.max(Math.abs(x2-x1),Math.abs(y2-y1))));
  for(let i=0;i<=steps;i++)paint(frame,x1+(x2-x1)*i/steps,y1+(y2-y1)*i/steps,color,w);
 };
 const polygon=(f,coords,color,size=2)=>{for(let i=0;i<coords.length;i++){
  const a=coords[i],b=coords[(i+1)%coords.length];
  stroke(f,a[0],a[1],b[0],b[1],color,size);
 }};
 const rays=(f,n,r,color)=>{for(let k=0;k<n;k++){
  const a=k*2*Math.PI/n;
  stroke(f,48,48,48+Math.cos(a)*r,48+Math.sin(a)*r,color,2);
 }};
 const ring=(f,r,color,n=12)=>{
  const points=Array.from({length:n},(_,k)=>[48+Math.cos(k*2*Math.PI/n)*r,48+Math.sin(k*2*Math.PI/n)*r*.7]);
  polygon(f,points,color,2);
 };
 const glyph=(f,bitmap,x,y,color,scale=2)=>bitmap.forEach((line,j)=>
  [...line].forEach((c,i)=>{if(c!==" ")paint(f,x+i*scale,y+j*scale,color,scale)}));
 const heart=[" ██ ██ ","████████","████████"," ██████ ","  ████  ","   ██   "];
 const music=["  ██  ","  █   ","  █   ","  ███ ","  ███ "];
 const drawWeb=(f,t)=>{
  const radius=18+15*t;
  for(let spoke=0;spoke<8;spoke++){
   const a=spoke*Math.PI/4;
   stroke(f,48,48,48+Math.cos(a)*radius,48+Math.sin(a)*radius,Cool(),2);
  }
  for(const layer of [.35,.7,1]){
   const poly=Array.from({length:8},(_,k)=>[48+Math.cos(k*Math.PI/4)*radius*layer,
    48+Math.sin(k*Math.PI/4)*radius*layer]);
   polygon(f,poly,layer===1?LIGHT:COOL,2);
  }
 };
 function Cool(){return COOL}
 const drawSpikes=(f,t)=>{
  for(let k=0;k<5;k++){
   const x=17+k*14,h=(9+(k%3)*6)*Math.max(.3,t);
   polygon(f,[[x,69],[x+5,69-h],[x+10,69]],k%2?ROCK:LIGHT,2);
   stroke(f,x+2,70,x+10,70,INK,2);
  }
 };
 const drawRock=(f,t)=>{
  const r=15+t*12;
  polygon(f,[[48-r,50],[46-r*.3,47-r],[48+r*.6,48-r*.6],[48+r,56],
   [48+r*.25,60+r*.45],[48-r*.55,57+r*.3]],ROCK,3);
  stroke(f,44,44,50+t*9,51+t*8,INK,2);
  stroke(f,44,44,40-t*10,55+t*8,INK,2);
 };
 for(let frame=0;frame<FRAMES;frame++){
  const t=frame/(FRAMES-1),cx=48,cy=48;
  const flare=9+Math.sin(Math.PI*t)*15;
  switch(spec.motion){
   case "web-trap":drawWeb(frame,t);break;
   case "ground-spikes":drawSpikes(frame,t);break;
   case "shatter":case "seismic":drawRock(frame,t);if(spec.motion==="seismic"){
    for(let n=-2;n<=2;n++)stroke(frame,48+n*14,65,49+n*18,73-(n%2)*5,INK,2);
   }break;
   case "ink-projectile":{
    const radius=4+t*20;
    for(let n=0;n<9;n++){
     const a=n*2.4,drift=radius*(n%2?.5:1);
     paint(frame,cx+Math.cos(a)*drift,cy+Math.sin(a)*drift*.7,n%3?INK:DARK,4);
    }
    polygon(frame,[[43,43],[51,40],[58,45],[53,55],[44,54]],INK,3);break;
   }
   case "sound-wave":case "dream-voice":case "bell-waves":{
    ring(frame,10+t*19,COOL);
    if(spec.motion==="bell-waves"){
     polygon(frame,[[42,37],[54,37],[58,56],[38,56]],GOLD,2);
     paint(frame,46,59,GOLD,5);
    }else if(spec.motion==="dream-voice")glyph(frame,music,46,35,GOLD);
    break;
   }
   case "wing-sweep":{
    for(let feather=0;feather<5;feather++){
     const y=24+feather*7,x=24+(feather%2)*5+12*t;
     stroke(frame,x,y,x+37-feather*4,y+13,feather%2?COOL:LIGHT,4);
    }break;
   }
   case "arc-slash":case "triple-hit":case "party-hits":{
    if(spec.motion==="arc-slash")stroke(frame,25,66,69,24,LIGHT,4);
    else {
     const hit=spec.motion==="triple-hit"?Math.floor(t*3):Math.floor(t*5);
     const x=24+(hit%3)*13,y=33+((hit*2)%3)*11;
     polygon(frame,[[x,y],[x+12,y-6],[x+23,y+7],[x+10,y+17]],GOLD,3);
    }
    break;
   }
   case "copy-rune":case "type-shift":case "stats-copy":case "target-lock":
   case "ghost-reveal":case "conversion":{
    ring(frame,flare,COOL);rays(frame,4,8+t*8,GOLD);break;
   }
   case "confuse-hearts":case "attract-hearts":{
    glyph(frame,heart,29+Math.round(Math.sin(t*6)*7),30,PINK,2);
    ring(frame,7+t*10,DARK);break;
   }
   case "perish-notes":case "clap-notes":{
    glyph(frame,music,24,30,GOLD,3);glyph(frame,music,53,43,COOL,2);break;
   }
   case "sunrise-heal":{
    ring(frame,9+t*12,GOLD);rays(frame,8,17+t*12,GOLD);break;
   }
   case "milk-heal":case "avoid-shield":case "endure-guard":{
    if(spec.motion==="milk-heal"){
     polygon(frame,[[41,33],[53,33],[57,60],[38,60]],LIGHT,3);
     paint(frame,43,29,COOL,10);
    }else polygon(frame,[[48,21],[65,33],[58,60],[48,71],[38,60],[31,33]],
     spec.motion==="endure-guard"?GOLD:COOL,3);
    break;
   }
   case "gift-arc":{
    polygon(frame,[[30,35],[65,35],[65,63],[30,63]],PINK,3);
    stroke(frame,48,33,48,65,GOLD,3);stroke(frame,30,49,65,49,GOLD,3);break;
   }
   case "scent-cloud":case "spore-drift":case "curse-dual":{
    const color=spec.motion==="curse-dual"?DARK:spec.motion==="scent-cloud"?PINK:COOL;
    for(let k=0;k<11;k++){
     const a=k*2.399+t*5,r=12+(k%4)*5;
     paint(frame,48+Math.cos(a)*r,48+Math.sin(a)*r*.6,color,2+(k%3));
    }break;
   }
   case "gaze-lock":case "sleep-haunt":case "taunt-confuse":{
    polygon(frame,[[23,47],[38,35],[58,35],[73,47],[59,60],[38,60]],DARK,3);
    ring(frame,10,COOL);paint(frame,44,42,GOLD,8);break;
   }
   case "pp-drain":case "hp-balance":case "fate-link":{
    stroke(frame,18,48,77,48,PINK,2);
    for(const x of [19+40*t,75-40*t]){
     polygon(frame,[[x-7,42],[x,48],[x-7,54]],GOLD,2);
    }break;
   }
   case "return-dash":case "rage-dash":case "shadow-chase":case "steal-return":{
    const color=spec.motion==="rage-dash"?GOLD:spec.motion==="return-dash"?PINK:DARK;
    for(let n=0;n<5;n++)
     stroke(frame,18+n*5,34+n*4,50+20*t+n*2,34+n*4,color,2);
    break;
   }
   case "drum-burst":case "avoid-shield-drum":{
    ring(frame,15+10*Math.abs(Math.sin(t*Math.PI*3)),GOLD);
    stroke(frame,31,47,65,47,GOLD,3);break;
   }
   case "healing-bloom":case "relay-sprint":case "scent-bloom":case "scent-surge":{
    ring(frame,12+t*15,PINK);break;
   }
   case "curse-dual-shadow":case "hp-flow":{ring(frame,12+t*11,DARK);break;}
   case "steal-item":{polygon(frame,[[40,34],[60,34],[60,56],[40,56]],DARK);break;}
   case "lift-drop":{
    polygon(frame,[[28,38],[48,22],[68,38],[48,72]],GOLD,3);
    stroke(frame,48,22,48,65,ROCK,2);break;
   }
   case "iv-orbs":{
    for(let i=0;i<6;i++){
     const a=t*6+i*Math.PI/3;
     paint(frame,48+Math.cos(a)*24,48+Math.sin(a)*16,i%2?LIGHT:COOL,5);
    }break;
   }
   case "scent-mist":case "copy-aura":{rays(frame,8,18+t*6,COOL);break;}
   case "avoided":{ring(frame,12+t*10,COOL);break;}
   default:{
    // These moves still receive a distinct animated native PixelFX module
    // plus movement from johtoPose. A small glint improves 8-bit readability.
    stroke(frame,40,47,56,47,COOL,2);stroke(frame,48,40,48,56,GOLD,2);
   }
  }
 }
 return strip;
}
