/* Torre 2: 11 requested VFX refinements — Phaser Graphics/WebGL.
 * VISUAL-ONLY functions; collision, stats, hit chance and damage are owned
 * by batch24/runtime.js. Original approved moves are NOT imported or changed.
 * Reuses genuine Torre 2 approved effects: Pay Day's independent sequential
 * fan idea, native Poké Arena pixel sparkle mask, 12-frame animation phases,
 * and its Emerald Arena MIT fragment particle trail in pixels.js.
 * Zarza's copyrighted effects are NOT transplanted (source inspection only).
 */
import {PALETTES,stamp,pixel} from './pixels.js';
const PI=Math.PI,TAU=2*PI;
const wave=(t)=>Math.sin(t);
const N=(x)=>Math.round(x);
const phase=(f)=>f%12;
const clamp=(x,a=0,b=1)=>Math.min(b,Math.max(a,x));
const v=(a,forward,side=0)=>({x:Math.cos(a)*forward-Math.sin(a)*side,
 y:Math.sin(a)*forward+Math.cos(a)*side});
const dot=(g,x,y,c,size=2,alpha=1)=>pixel(g,x,y,c,size,alpha);
const S=(g,shape,x,y,p,size=1,angle=0,alpha=1,flip=false)=>
 stamp(g,shape,x,y,p,size,angle,alpha,flip);

// These are opt-in palettes for the revised moves only. No global recolor.
const ACID_JET=[0x192a26,0x376c51,0x69a949,0xc5e76d,0xf1ffba];
const ACID_MIST=[0x1f2d24,0x346840,0x59b837,0xa5f24b,0xf5ffc8];
const POISON_JAB=[0x21182c,0x542c74,0x9c4cca,0xe07dff,0xffdcfa];
const DARK_CORE=[0x090b15,0x2a103e,0x542073,0x9240b3,0xd786ff];
const ICE_GLASS=[0x12243f,0x285e8c,0x65c0e6,0xbbf3ff,0xffffff];
const TWISTER=[0x172b36,0x395668,0x6c91a1,0xb2d1d7,0xf0f7ed];
const ROCK_DUST=PALETTES.rock;
// Mint-green contour requested for Ancient Power, original rock fill intact.
const ANCIENT_MINT=[0xb5f8a1,...ROCK_DUST.slice(1)];
const SNOW=PALETTES.ice;

export const REWORKED_STYLES=Object.freeze([
 'mudshot','mudbomb','acid','spray','jab','shard',
 'darkpulse','ancient','icywind','silverwind','twister'
]);
const REWORKED=new Set(REWORKED_STYLES);

function darkPulse(g,x,y,f,a){
 // Faithful Pokémon Dark Pulse motif: a stream of BLACK/PURPLE ENERGY RINGS,
 // not a Shadow Ball, a cluster of crescents or a generic purple projectile.
 // The pixels for each circular pulse are a literal *mask adaptation* of
 // Poké Arena 2D's MAPAS['p-pulsoAgua'] via pixels.js#p2darkring.
 // This is the original P2 ring renderer's 8x8 silhouette, not claimed to
 // be a pre-existing native Dark Pulse attack in the captured P2 client.
 const t=f/12;
 for(let i=3;i>=0;i--){
  const d=i*(11+(f%3)*.6),sway=wave(f*.62+i*2.1)*1.5;
  const pos=v(a,-d,sway);
  const scale=(1.76-i*.22)+(f%4)*.06; // +~16%: visual size ONLY
  // Ink outlines and luminous violet rim, with hollow black centers.
  S(g,'p2darkring',x+pos.x,y+pos.y,DARK_CORE,
   scale,a+(i%2?-.11:.11),.98-i*.17);
  const mid=v(a,-d);
  dot(g,x+mid.x-1,y+mid.y-1,DARK_CORE[0],
   Math.max(2,3-i*.25),.8-i*.12);
 }
 // Ripple fragments shed sideways from each ring, not random circles.
 for(let j=0;j<9;j++){
  const back=8+j*6,side=(j%2?1:-1)*(8+j%3*3);
  const pos=v(a,-back,side+wave(f*.58+j*1.3)*2);
  S(g,j%3===0?'spark':'frostChip',x+pos.x,y+pos.y,DARK_CORE,
   j%3===0?.28:.35,(j%2?1:-1)*.3,
   .65-j*.042);
 }
}

function ancient(g,x,y,f,a){
 // Nine distinct faceted rocks: orbiting ring, rear/front occlusion,
 // variable depth / size, rubble and dusty motion. No Rock Blast copy.
 const t=f/12,orbit=9;
 for(let i=0;i<orbit;i++){
  const phi=i*TAU/orbit+.19*f;
  const near=wave(phi)>0;
  const r=(20+(i%3)*4)*1.2;
  const dx=wave(phi)*r,dy=Math.cos(phi)*r*.48;
  const size=(near?.7+(i%2)*.13:.45+(i%3)*.06)*1.2;
  S(g,'rock',x+dx,y+dy,ANCIENT_MINT,size,phi*.19,near?1:.57);
  if(near&&i%3===0){
   const o=v(phi,5);
   S(g,'shard',x+dx+o.x*.4,y+dy+o.y*.4,ANCIENT_MINT,.37*1.2,
    phi-PI/4,.9);
  }
 }
 S(g,'rock',x,y,ANCIENT_MINT,(.64+wave(f*.65)*.08)*1.2,a*.1,.84);
 for(let j=0;j<6;j++){
  const q=v(a,-10-j*7,wave(f*.7+j*2.1)*(8+j));
  dot(g,x+q.x,y+q.y,j%2?ROCK_DUST[1]:ROCK_DUST[3],
   j%3?2:3,.85-j*.08);
 }
}

function iceShard(g,x,y,f,a){
 // Visual-only upgrade: the already approved Pay Day-style seven-hit fan,
 // trajectories and timings are untouched. Sharper translucent-white ice
 // crystals with beveled blue facets and tiny frost fragments replace
 // generic blue needles. Twelve facing/spark phases.
 // Keep seven projectile trajectories and small ice crystal shapes, but
 // give EACH drawn crystal a 12-pose tumble and glint.
 const spin=(f%12)*PI/14,tip=wave(f*.82)*.19;
 S(g,'iceDagger',x,y,ICE_GLASS,.68,a-PI/4+spin+tip,.96);
 const pale=v(a,-3,2);
 S(g,'iceDagger',x+pale.x,y+pale.y,ICE_GLASS,.24,
  a-PI/4-spin*.8-tip,.62+.20*(.5+.5*wave(f*1.4)));
 for(let i=0;i<5;i++){
  const pos=v(a,-7-i*8,wave(f*.48+i*2.1)*(2+i*.8));
  S(g,i%2===0?'frostChip':'spark',
   x+pos.x,y+pos.y,ICE_GLASS,i<2?.30:.19,
   a+PI/4+i*.28+spin*(i%2?1:-1),(.72+.15*wave(f*.9+i))*(1-i*.13));
 }
 for(let i=0;i<4;i++){
  const pos=v(a,6+i*4,(i%2?1:-1)*(4+i*2));
  dot(g,x+pos.x,y+pos.y,i%2?ICE_GLASS[3]:ICE_GLASS[4],
   2,(.63+.20*wave(f*.85+i*1.6))*(1-i*.09));
 }
}

function icyWind(g,x,y,f,a){
 // Wide, unmistakable WEDGE of translucent blue air: 4 rolling
 // ribbons that widen toward the front + drifting broken snow flakes.
 const fan=Math.sin(f*.38)*2;
 for(let band=0;band<4;band++){
  const distance=8+band*12;
  const width=(band+1)*8;
  for(let wing=-1;wing<=1;wing++){
   const o=v(a,distance,wing*width+fan*(band%2?-1:1));
   S(g,'curl',x+o.x,y+o.y,SNOW,
    .28+.08*band,a+wing*.16,.40+.11*band);
  }
 }
 for(let i=0;i<10;i++){
  const dist=4+(i%5)*12,side=(((i*7)%11)-5)*(2+i%3);
  const o=v(a,dist,side+wave(f*.6+i*1.7)*3);
  S(g,i%4===0?'shard':'spark',x+o.x,y+o.y,SNOW,
   i%4===0?.48:.24,a+PI/4*i,.55+(i%3)*.12);
 }
 // White pixel edges at the wedge mouth, not a CSS gradient.
 for(const w of [-1,1]){
  const o=v(a,52,w*34);
  dot(g,x+o.x,y+o.y,SNOW[4],3,.84);
 }
}

function acidJet(g,x,y,f,a){
 // Focused corrosive liquid jet, staggered streaks, atomized green flecks.
 // Narrow thrust clearly distinct from Acid Spray's spreading cloud.
 S(g,'drop',x+v(a,11).x,y+v(a,11).y,ACID_JET,1.08,a-PI/4);
 for(let i=0;i<5;i++){
  const o=v(a,2-i*11,wave(i*1.73+f*.7)*(2.2+i*.6));
  S(g,'drop',x+o.x,y+o.y,ACID_JET,.48+i%2*.08,
   a-PI/4+(i%2?.28:-.28),.92-i*.1);
 }
 for(let i=0;i<9;i++){
  const o=v(a,-i*7,wave(f*.52+i*2)*((i%3)+2)*2);
  dot(g,x+o.x,y+o.y,i%4===0?ACID_JET[4]:ACID_JET[2],
   i%3===0?3:2,.85-i*.07);
 }
}

function acidSpray(g,x,y,f,a){
 // A wide fan of droplets, mixing tiny pellets and narrow streams.
 // 11 independently positioned pieces with frame-shifted trajectories.
 for(let i=0;i<11;i++){
  const wing=(i-5)/5;
  const progress=(i%4)*7+8+f%3;
  const o=v(a,progress,wing*(19+progress*.32)+wave(f*.6+i)*3);
  S(g,i%3===0?'drop':'pellet',x+o.x,y+o.y,ACID_MIST,
   i%3===0?.6:.34,a-PI/4+wing*.42,.75+i%4*.055);
 }
 for(let j=0;j<6;j++){
  const o=v(a,-j*9,(j%2?1:-1)*((j+2)*1.9));
  dot(g,x+o.x,y+o.y,ACID_MIST[3],j%3?2:3,.6+j*.035);
 }
}

function poisonJab(g,x,y,f,a){
 // Plain SHORT-RANGE jab: one small contact stroke, not a purple projectile
 // or a trail of toxic needles. Contact / damage remain in runtime.melee.
 const advance=Math.round(3+5*Math.sin(PI*clamp(f/11)));
 const pos=v(a,advance);
 S(g,'needle',x+pos.x,y+pos.y,POISON_JAB,.65,a-PI/4,.80);
 // A tiny, muted violet glint on the attacking hand only.
 if(f>=3&&f<=7){
  const tip=v(a,advance+5);
  dot(g,x+tip.x,y+tip.y,POISON_JAB[2],2,.40);
 }
}

function silverWind(g,x,y,f,a){
 // Glittery wing-scale airstream rather than recolored Icy Wind.
 // Silver leaves mimic small airborne scales and phosphor flecks.
 const p=PALETTES.silver;
 for(let i=0;i<9;i++){
  const t=(i*13+f*4)%75;
  const side=(i%2?1:-1)*(5+(i%5)*7)+wave(f*.46+i*1.2)*7;
  const o=v(a,t-22,side);
  S(g,i%3===0?'leaf':'spark',x+o.x,y+o.y,p,
   i%3===0?.68:.40,
   a+(i%2?1:-1)*(PI/6+f*.14),.44+(i%4)*.11);
 }
 for(let i=0;i<4;i++){
  const o=v(a,12+i*13,wave(f*.4+i*2)*12);
  S(g,'curl',x+o.x,y+o.y,p,.35,a+i*.23,.45);
 }
}

function twister(g,x,y,f,a){
 // Tapered spiral column with 5 distinct winding bands, dust and
 // silhouette, not a horizontal bullet of 4 identical crescents.
 const p=TWISTER;
 for(let row=0;row<5;row++){
  const level=4-row;
  const width=5+level*3.5;
  const oscill=wave(f*.48+row*1.4);
  const yy=y+19-row*12;
  const xx=x+oscill*width*.7;
  S(g,'curl',xx,yy,p,.32+level*.065,
   (row%2?PI:0)+f*.22,.65+row*.06);
  const side=width*oscill;
  S(g,'crescent',x+side,yy-1,p,.5+level*.07,
   f*.33+row*1.6,.64);
 }
 for(let i=0;i<7;i++){
  const yy=y+21-i*8,xx=x+wave(f*.5+i*1.75)*(6+i%3*5);
  dot(g,xx,yy,i%2?p[3]:p[2],2+i%3,.73-i*.045);
 }
}

function mudShot(g,x,y,f,a){
 // A moving compact clod with four DIFFERENT splashes and angled wake.
 const p=PALETTES.mud;
 S(g,'pellet',x,y,p,.91+wave(f*.75)*.045,a*.15);
 for(let j=0;j<4;j++){
  const o=v(a,-10-j*9,wave(f*.66+j*1.8)*(3+j*2));
  S(g,j%2?'drop':'pellet',x+o.x,y+o.y,p,
   .48-j*.035,a-PI/4+j*.22,.82-j*.15);
 }
 for(let j=0;j<5;j++){
  const o=v(a,-j*11,(j%2?1:-1)*(7+j));
  dot(g,x+o.x,y+o.y,j%2?p[1]:p[3],j%3?2:3,.79-j*.09);
 }
}

function mudBomb(g,x,y,f,a){
 // Lumpy *heavy* mud mass, orbiting chips and a deep silt trail.
 const p=PALETTES.mud,roll=f*.18;
 S(g,'glob',x,y,p,1.20,roll);
 for(let j=0;j<5;j++){
  const spin=roll+j*TAU/5;
  const o=v(spin,12+(j%2)*5);
  S(g,j%2?'drop':'pellet',x+o.x,y+o.y,p,
   .49+(j%3)*.07,roll*.4,.9);
 }
 for(let j=0;j<6;j++){
  const o=v(a,-9-j*11,(j%2?1:-1)*(2+j%3)*3);
  S(g,'drop',x+o.x,y+o.y,p,.36,a-PI/4+j*.18,.81-j*.105);
 }
}

export function paintReworkedMove(g,h,x,y,frame,angle=0){
 const style=h.style;if(!REWORKED.has(style))return false;
 const f=phase(frame);
 if(style==='darkpulse')darkPulse(g,x,y,f,angle);
 else if(style==='ancient')ancient(g,x,y,f,angle);
 else if(style==='shard')iceShard(g,x,y,f,angle);
 else if(style==='icywind')icyWind(g,x,y,f,angle);
 else if(style==='acid')acidJet(g,x,y,f,angle);
 else if(style==='spray')acidSpray(g,x,y,f,angle);
 else if(style==='jab')poisonJab(g,x,y,f,angle);
 else if(style==='silverwind')silverWind(g,x,y,f,angle);
 else if(style==='twister')twister(g,x,y,f,angle);
 else if(style==='mudshot')mudShot(g,x,y,f,angle);
 else if(style==='mudbomb')mudBomb(g,x,y,f,angle);
 return true;
}
export function paintReworkedImpact(g,h,x,y,elapsed){
 if(!REWORKED.has(h.style)||elapsed<0||elapsed>.42)return false;
 // Standard projectiles still use native P2 sparkle and MIT debris.
 // These 11 use distinct *extra* miniature impact fragments. Damage is
 // never applied from this function, and every particle has fixed lifetime.
 const p=h.palette&&PALETTES[h.palette]||SNOW;
 const k=clamp(elapsed/.42),style=h.style;
 if(style==='jab'){
  // Subtle purple TOUCH, not an explosion: approximately 0.19 seconds and
  // just one miniature translucent spark. Rendered only after strike() says
  // a real contact landed. No ambient poison aura while traveling.
  if(elapsed>.19)return false;
  const fade=1-elapsed/.19;
  const violet=[0x281a34,0x543265,0x86539a,0xb08abe,0xd2b2de];
  S(g,'spark',x,y,violet,.38+elapsed*.45,0,.44*fade);
  dot(g,x-3,y+2,violet[3],2,.34*fade);
  dot(g,x+3,y-1,violet[2],2,.25*fade);
  return true;
 }
 const liquid=style==='acid'||style==='spray'||style==='mudshot'||style==='mudbomb';
 const pp=style==='acid'?ACID_JET:style==='spray'?ACID_MIST:
  style==='jab'?POISON_JAB:style==='darkpulse'?DARK_CORE:p;
 const count=style==='ancient'?10:liquid?9:style==='darkpulse'?7:5;
 const shape=liquid?'drop':style==='ancient'?'rock':
  style==='darkpulse'?'p2darkring':style==='jab'?'needle':'spark';
 for(let i=0;i<count;i++){
  const ang=i*TAU/count+(i%2)*.27;
  const radius=(4+20*k)*(i%3===0?1.32:.77);
  const o=v(ang,radius);
  S(g,shape,x+o.x,y+o.y,pp,
   (1-k)*(style==='ancient'?.62:style==='darkpulse'?.72:.35)+.18,
   ang+(style==='darkpulse'?k*PI:0),
   (1-k)*.85);
 }
 if(style==='darkpulse'){
  for(let i=0;i<3;i++)
   S(g,'p2darkring',x,y,DARK_CORE,
    .9+k*(1.5+i*.52),i*.2,(1-k)*(.93-i*.16));
 }
 return true;
}
