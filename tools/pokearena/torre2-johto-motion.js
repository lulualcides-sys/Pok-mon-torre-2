/* Distinct pixel-sprite choreography for Johto Mewtwo Training.
 * All 43 unapproved effects retain genuine PixelFX spritesheets.
 * Pure numerical paths, no Canvas/CSS, no gameplay or campaign changes.
 * Three user-approved VFX are expressly forbidden from this module.
 */
import {JOHTO_GEN3_SPEC} from "./torre2-johto-gen3-research.js";
const clamp=x=>Math.max(0,Math.min(1,Number(x)||0));
const mix=(a,b,t)=>a+(b-a)*t;
const wobble=(t,n=1)=>Math.sin(t*Math.PI*2*n);
const PI=Math.PI;
const snap=x=>Math.round(x);
const approved=new Set(["powder-snow","whirlpool","zap-cannon"]);
export function johtoPose(id,progress,caster,target,groundY=target?.y??0,partyCount=1){
 if(approved.has(id))throw Error("Approved Johto animation cannot be overridden: "+id);
 const spec=JOHTO_GEN3_SPEC[id];
 if(!spec)throw Error("Unknown Johto motion: "+id);
 const t=clamp(progress),phase=t*PI*2;
 const sx=Number(caster.x),sy=Number(caster.y),tx=Number(target.x),ty=Number(target.y);
 if(![sx,sy,tx,ty,groundY].every(Number.isFinite))throw Error("Nonfinite Johto coordinates");
 const fly=q=>({x:mix(sx,tx,clamp(q)),y:mix(sy,ty,clamp(q))});
 const orbit=(x,y,r,a)=>({x:x+r*Math.cos(a),y:y+r*.66*Math.sin(a)});
 let x=tx,y=ty,scale=.8,angle=0,alpha=1,frame=Math.min(11,Math.floor(t*12));
 switch(spec.motion){
  case "triple-hit":{
   const i=Math.min(2,Math.floor(t*3)),hit=[[-18,-13],[15,-5],[-2,14]][i];
   x=tx+hit[0];y=ty+hit[1];scale=.56+i*.19;
   frame=Math.min(11,Math.floor((t*3%1)*12));angle=[-25,30,-8][i];break;
  }
  case "steal-return":{
   const q=t<.42?t/.42:1-(t-.42)/.58;
   ({x,y}=fly(q));y-=12*wobble(t,.5);scale=.7+Math.sin(PI*t)*.18;
   angle=t<.42?-25:25;break;
  }
  case "sound-wave":{
   ({x,y}=fly(Math.min(1,t*1.28)));
   x+=wobble(t,3)*6;y+=wobble(t,2)*5;scale=.46+t*.65;alpha=1-t*.45;break;
  }
  case "ink-projectile":{
   ({x,y}=fly(Math.min(1,t/.7)));
   if(t>.7){x=tx+wobble((t-.7)/.3,3)*9;y=ty+wobble((t-.7)/.3,2)*7;scale=.72+(t-.7)*2;}
   else scale=.56+t*.3;
   break;
  }
  case "arc-slash":{
   x=tx-21+42*t;y=ty-24+48*(t*t);angle=-55+100*t;scale=.68;break;
  }
  case "wing-sweep":{
   x=tx+Math.cos(PI*(t+.3))*30;y=ty+Math.sin(PI*t)*-27;angle=-80+160*t;
   scale=.86+Math.sin(PI*t)*.3;break;
  }
  case "return-dash":
  case "rage-dash":{
   const fast=spec.motion==="rage-dash";
   const q=t<.7?(t/.7)**(fast?.6:1.7):1-(t-.7)/.3;
   ({x,y}=fly(q));
   y-=Math.sin(PI*t)*(fast?8:21);x+=fast?wobble(t,7)*4:0;
   angle=fast?12*wobble(t,3):0;scale=fast?1:.82;break;
  }
  case "gift-arc":{
   ({x,y}=fly(t));y-=Math.sin(PI*t)*38;angle=t*170;scale=t>.83?1.2:.69;break;
  }
  case "seismic":{
   x=tx+wobble(t,4)*7;y=groundY-5-Math.sin(PI*t)*11;scale=.7+Math.sin(PI*t)*.55;break;
  }
  case "shadow-chase":{
   ({x,y}=fly(Math.min(1,t**.6)));y+=wobble(t,3)*11;
   scale=.58+t*.46;angle=wobble(t,2)*24;break;
  }
  case "lift-drop":{
   x=tx;y=ty-40*Math.sin(PI*t);scale=.7+Math.sin(PI*t)*.36;
   angle=t<.6?-30:25;break;
  }
  case "iv-orbs":{
   if(t<.37){({x,y}=orbit(sx,sy,27,t/.37*PI*2));scale=.55;}
   else{({x,y}=fly((t-.37)/.63));x+=wobble(t,3)*12;scale=.8;}
   break;
  }
  case "shatter":{
   x=tx+wobble(t,5)*6;y=ty+Math.sin(PI*t)*12;
   scale=.57+t*.65;angle=t*115;alpha=t>.82?(1-t)/.18:1;break;
  }
  case "party-hits":{
   const n=Math.max(1,Math.min(6,Math.round(Number(partyCount)||1)));
   const i=Math.min(n-1,Math.floor(t*n));
   x=tx+Math.cos(i*2.4)*20;y=ty+Math.sin(i*2.4)*18;
   frame=Math.min(11,Math.floor((t*n%1)*12));angle=25*wobble(t*n,1);scale=.65+i*.06;break;
  }
  case "copy-rune":({x,y}=orbit(sx,sy,21,phase));angle=t*360;scale=.78;break;
  case "web-trap":x=tx;y=ty;angle=wobble(t,1)*9;scale=.42+.95*t;break;
  case "target-lock":({x,y}=fly(Math.min(1,t*1.5)));scale=.6+Math.sin(PI*t)*.32;break;
  case "sleep-haunt":x=tx+wobble(t,3)*7;y=ty+16-18*t;alpha=.5+.5*Math.sin(PI*t);break;
  case "curse-dual":x=sx;y=sy;scale=.6+Math.sin(PI*t)*.55;angle=wobble(t,3)*10;break;
  case "type-shift":({x,y}=orbit(sx,sy,15,phase));angle=t*270;scale=.8;break;
  case "spore-drift":({x,y}=fly(t**.65));x+=wobble(t,3)*13;y+=wobble(t,2)*11;scale=.62;break;
  case "pp-drain":({x,y}=fly(1-t));y-=Math.sin(PI*t)*17;scale=.55+t*.24;break;
  case "confuse-hearts":
  case "attract-hearts":({x,y}=orbit(tx,ty,20+5*t,phase*1.4));angle=14*wobble(t,2);scale=.65;break;
  case "drum-burst":x=sx+wobble(t,3)*4;y=sy;frame=Math.min(11,Math.floor((t*3%1)*12));scale=.58+.34*Math.abs(wobble(t,3));break;
  case "ground-spikes":x=tx;y=groundY-2;scale=.5+t*.6;angle=0;break;
  case "ghost-reveal":({x,y}=orbit(tx,ty,11,phase));scale=.62+.24*t;break;
  case "fate-link":
  case "hp-balance":({x,y}=fly(.5+.45*wobble(t,1)));scale=.6+.25*Math.sin(PI*t);break;
  case "perish-notes":({x,y}=fly(.5));x+=wobble(t,3)*17;y-=Math.sin(t*PI)*29;scale=.78;break;
  case "avoid-shield":x=sx+14*wobble(t,1);y=sy-7;scale=.4+Math.sin(PI*t)*.6;alpha=t>.82?(1-t)/.18:1;break;
  case "endure-guard":x=sx;y=sy;scale=.7+Math.sin(PI*t)*.2;break;
  case "taunt-confuse":({x,y}=orbit(tx,ty,18,phase*2));angle=t*75;scale=.62;break;
  case "milk-heal":x=sx+wobble(t,3)*7;y=sy+22-42*t;scale=.68;break;
  case "gaze-lock":x=tx;y=ty-6;scale=.45+Math.sin(PI*t)*.65;break;
  case "dream-voice":({x,y}=orbit(sx,sy-17,12,phase));scale=.6;break;
  case "bell-waves":x=sx;y=sy;scale=.42+1.1*t;alpha=1-.55*t;break;
  case "relay-sprint":x=sx+42*t;y=sy-Math.sin(PI*t)*16;scale=.68;alpha=1-.3*t;break;
  case "clap-notes":({x,y}=orbit(tx,ty-8,13,phase*2));frame=Math.min(11,Math.floor((t*3%1)*12));scale=.66;break;
  case "scent-cloud":({x,y}=fly(t**.8));x+=wobble(t,3)*15;y-=Math.sin(PI*t)*15;scale=.68;break;
  case "sunrise-heal":x=sx+wobble(t,2)*5;y=sy+30-54*t;scale=.56+.5*t;break;
  case "stats-copy":({x,y}=fly(1-t));x+=wobble(t,2)*8;y-=Math.sin(PI*t)*21;scale=.7;break;
  default:throw Error("Unimplemented Johto motion: "+spec.motion);
 }
 return Object.freeze({x:snap(x),y:snap(y),frame,
  scale:Math.max(.22,scale),angle,alpha:Math.max(0,Math.min(1,alpha)),
  anchor:spec.anchor,motion:spec.motion});
}
