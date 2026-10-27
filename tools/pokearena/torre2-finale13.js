/* Pokémon Torre 2 — Kanto finish: 13 additive Phaser/WebGL moves.
 * Art: 8/12/16 discrete inked pixel poses, not Canvas2D/CSS/image overlays.
 * Original and player-approved FX must remain unchanged.
 * Every hit below is checked against the aimed physical target; no auto-hit.
 */
import {clashAt} from './clash-fx.js';
import {contactDash} from './early-route-fx.js';
// True native P2 five-row impact raster + MIT Emerald debris physics,
// reused via the already-approved batch24 shared helper.
import {impact as p2EmeraldImpact} from './batch24/pixels.js';
const PI=Math.PI,clamp=x=>Math.max(0,Math.min(1,x)),round=Math.round;
const C={
 psychic:[0x1c234d,0x513b8a,0x9462ca,0xdca9f7,0xffe8ff],
 leaf:[0x1d3b2b,0x49734c,0x85a760,0xb8d988,0xf3ffc5],
 sand:[0x463421,0x896039,0xc89c56,0xe5c77d,0xffefd0],
 water:[0x0e3455,0x176b9b,0x3ba8c9,0x8ddde6,0xf0ffff],
 fire:[0x421b2d,0xb53527,0xee762c,0xffce4b,0xffffb0],
 ice:[0x174268,0x307f9a,0x68c3d9,0xc3eaf0,0xffffff],
 electric:[0x27214d,0x6652ae,0xe0b944,0xf8e875,0xffffff],
 poison:[0x27122e,0x572365,0x9942b9,0xce7aec,0xffd5ff],
 steel:[0x202a3f,0x527b93,0x86b8ca,0xc5e6ea,0xffffff],
 light:[0x193d49,0x3996a6,0x6fe0d7,0xb9ffe6,0xffffff],
 protectGreen:[0x0d3021,0x1c713e,0x43bd64,0x82ed98,0xdfffe2],
 screenPurple:[0x291336,0x572478,0x9141c4,0xc37fe8,0xf2d8ff]
};
export {FINALE_13_MOVES,FINALE_13_NAMES} from './torre2-finale13-catalog.js';
const colors=type=>C[type]||C.light;
const dot=(g,x,y,w,h,c,a=1)=>g.fillStyle(c,a).fillRect(round(x),round(y),Math.max(1,round(w)),Math.max(1,round(h)));
function stamp(g,rows,x,y,palette,scale=2,angle=0,opacity=1){
 const ca=Math.cos(angle),sa=Math.sin(angle),w=Math.max(...rows.map(r=>r.length)),h=rows.length;
 for(let j=0;j<h;j++)for(let i=0;i<rows[j].length;i++){
  const key=rows[j][i],n=+key;if(key==='.'||!Number.isInteger(n)||n>4)continue;
  const dx=(i-(w-1)/2)*scale,dy=(j-(h-1)/2)*scale;
  dot(g,x+dx*ca-dy*sa,y+dx*sa+dy*ca,scale,scale,palette[n],opacity);
 }
}
const RUNE=[
 '..0...0..','.0123210.','012343210','123444321',
 '2344.4432','123444321','012343210','.0123210.','..0...0..'];
const LEAF=[
 '....0....','...010...','..01210..','.0123210.','012343210',
 '.0123210.','..01210..','...010...','....0....'];
const SAND=[
 '..0.....','.0120....','0123210..','.12343210','..123210.','...010...'];
const WAVE=[
 '.........................','......0111110...........',
 '....0123333210..........','..0123444443210.........',
 '01234444444443210.......','123444444444443210......',
 '12333333333333333210....','0122222222222222233210..',
 '..011111111111111233210.','.....00000000000122110.'];
const HAND=[
 '......000......','....0011100....','...01233210....',
 '..01234443210..','..123444443210.','..123444443210.',
 '.0123444443210.','.0123333333210.','..01111111110.',
 '...001111100..','.....0110.....'];
const SLASH=[
 '..................0','...............0010','............001230',
 '.........00123340','......001233440.','...001233440...',
 '0012334440......','.00123440........','...0010..........'];
const FIRE_RING=[
 '......00000......','....001222100....','..0012333332100..',
 '.012344...443210.','01234.......43210','1234.........4321',
 '1234.........4321','01234.......43210','.012344...443210.',
 '..0012333332100..','....001222100....','......00000......'];
const WHEEL_FLAME=[
 '...00...', '..0120..','.012320.','01234320','12344432',
 '.1234432','..123320','...0120.','....00..'];
const WHEEL_EMBER=[
 '..0...','0120..','12320.','.12320','..0120','...00.'];
const CROSS=[
 '000........000','01210......01210','0123210..0123210',
 '..0123210123210','....012343210','.....012443210',
 '....012343210','..0123210123210','0123210..0123210',
 '01210......01210','000........000'];
const SPARK=['....0....','...010...','000123000','012343210','000123000','...010...','....0....'];
const POSES=Object.freeze([0,1,2,3,4,5,6,7,8,9,10,11]);
const mid=l=>l.y-(l.alto||36)*.52;
function aim(l){
 const a=Math.atan2((l.ay??l.y)-l.y,(l.ax??l.x+120)-l.x);
 return{a,c:Math.cos(a),s:Math.sin(a),x:l.x,y:mid(l)};
}
function setup(l,name,duration){
 const o=aim(l);l.animar?.(name,duration,.13);
 l.accion={hasta:l.t+duration*.82,lento:.55,angulo:o.a};
 return o;
}
function fxLoop(e,shapes,render,onFinish){
 let ended=false;
 const clean=()=>{if(ended)return;ended=true;for(const g of shapes)g.destroy?.();onFinish?.();};
 const effect={update(dt){if(ended)return false;
  if(!render(Math.min(.052,Math.max(0,dt||0)))){clean();return false;}
  return true;},destroy:clean};
 e.efectos.push(effect);return effect;
}
function segment(a,b,r,radius){
 if(!r||r.ko)return false;
 const cx=r.x,cy=mid(r),dx=b.x-a.x,dy=b.y-a.y;
 const t=clamp(((cx-a.x)*dx+(cy-a.y)*dy)/(dx*dx+dy*dy||1));
 return Math.hypot(a.x+dx*t-cx,a.y+dy*t-cy)<=Math.max(radius,(r.alto||36)*.36);
}
function damage(l,h,extra,push=12){
 const r=l.rival;if(!r||r.ko)return false;
 const dx=r.x-l.x,dy=r.y-l.y,d=Math.hypot(dx,dy)||1;
 return r.recibir(l,{dano:h.dano,tipo:h.tipo,categoria:h.categoria,
  slot:extra?.slot,surge:extra?.surge,empuje:push,
  dirX:dx/d,dirY:dy/d})==='golpe';
}
function star(g,x,y,palette,step,fade=1){
 stamp(g,SPARK,x,y,palette,Math.max(1.2,2.3-step*.08),step*.7,fade);
 p2EmeraldImpact(g,x,y,palette,step/30,1);
}
// Minimal Gen-III-like protection: ONE green wall for Protect, ONE
// purple wall for Light Screen, no old octagons or layered ornate panes.
function simpleBarrier(g,l,o,kind,age,fade){
 const protect=kind==='protect',pal=protect?C.protectGreen:C.screenPurple;
 const frame=Math.floor(age*16)%12;
 // Retain the approved 70% campaign art. In original Arena modes,
 // the user requested Protect / Light Screen visual barriers HALF as large
 // as currently rendered: 35% of the unscaled art (0.70 * 0.50).
 // This changes the pixels only, never the status, duration or hitboxes.
 const shieldScale=l.escena?.datos?.torre2?.70:.35;
 const q=n=>Math.max(1,Math.round(n*shieldScale));
 const w=q(protect?56:66),h=q(protect?62:72);
 const x=Math.round(l.x+o.c*q(protect?28:33))-Math.floor(w/2);
 const y=Math.round(mid(l)+o.s*q(protect?12:17))-Math.floor(h/2);
 const a=fade*(.82+Math.sin(frame*PI/6)*.055);
 const rim=q(4),inner=q(5),border=q(8),line=q(4);
 dot(g,x-rim,y-rim,w+rim*2,h+rim*2,pal[0],a*.90);
 dot(g,x,y,w,h,pal[2],a*.82);
 dot(g,x+inner,y+line,w-inner*2,h-line*2,pal[1],a*.21);
 dot(g,x+line,y+line,w-line*2,line,pal[4],a*.98);
 dot(g,x+line,y+h-border,w-line*2,line,pal[3],a*.91);
 dot(g,x+line,y+border,line,h-border*2,pal[3],a*.92);
 dot(g,x+w-border,y+border,line,h-border*2,pal[4],a*.92);
 const shineX=x+q(10)+((frame*q(4))%Math.max(1,w-q(22)));
 dot(g,shineX,y+q(10),q(3),h-q(20),pal[4],a*.26);
}
// Spell and field effects use exact, finite durations, no passive auto-damage.
function selfStatus(l,h,key){
 const e=l.escena,g=e.add.graphics().setDepth(key==='rain'?1800:1514);
 const pal=key==='rain'?C.water:key==='protect'?C.protectGreen:C.screenPurple;
 if(key==='rain')g.setScrollFactor?.(0); // Covers full camera, not a local aura.
 const o=setup(l,'Charge',.42);let age=0;
 if(key==='protect')l.ponerEstado?.('bloqueo',.72);
 if(key==='screen')l.ponerEstado?.('torre2LightScreen',7.5);
 if(key==='rain')e.__torre2Rain={until:e.t+8,owner:l};
 const duration=key==='rain'?8:key==='screen'?7.5:.72;
 return fxLoop(e,[g],dt=>{
  age+=dt;g.clear();if(age>=duration||l.ko)return false;
  const fade=clamp(Math.min(1,age*7,(duration-age)*7));
  if(key==='rain'){
   // Full Phaser camera viewport, including mobile/16:9; rain is screen
   // anchored and cannot stay behind when the camera pans during battle.
   const cam=e.cameras?.main;
   const width=Math.max(320,e.scale?.gameSize?.width||e.scale?.width||cam?.width||640);
   const height=Math.max(240,e.scale?.gameSize?.height||e.scale?.height||cam?.height||360);
   const phase=Math.floor(age*16)%12;
   const columns=Math.max(80,Math.min(152,Math.ceil(width/5.2)));
   for(let i=0;i<columns;i++){
    const x=((i*79+Math.floor(age*44)*2)%(width+40))-20;
    const y=((i*113+Math.floor(age*260))%(height+28))-18;
    const streak=8+(i%4)*2;
    dot(g,x,y,2,streak,pal[i%4===0?4:3],fade*(i%3?.59:.90));
    dot(g,x-2,y+streak,4,2,pal[1],fade*.45);
    if((i+phase)%9===0&&y>height*.68){
     dot(g,x-5,y+streak+2,12,2,pal[2],fade*.27);
     dot(g,x-2,y+streak,4,2,pal[4],fade*.62);
    }
   }
   // Sparse foreground raindrops over the ENTIRE visible arena.
   for(let i=0;i<24;i++){
    const x=((i*167+Math.floor(age*75))%(width+10))-5;
    const y=((i*139+Math.floor(age*315))%(height+10))-5;
    dot(g,x,y,2,11,pal[4],fade*.66);
   }
  }else{
   simpleBarrier(g,l,o,key,age,fade);
  }
  return true;
 });
}
// Nonhoming spells: every collision is resolved by the visual's actual position.
function projectile(l,h,extra,kind){
 const e=l.escena,r=l.rival,g=e.add.graphics().setDepth(1515),trail=e.add.graphics().setDepth(1514);
 const o=setup(l,kind==='surf'?'Charge':kind==='sand'?'Throw':'Shoot',.46);
 const theme=kind==='psychic'?C.psychic:kind==='sleep'?C.leaf:kind==='sand'?C.sand:C.water;
 const count=kind==='sleep'?9:kind==='sand'?7:1;
 const length=Math.min(h.alcance||225,270),speed=kind==='surf'?270:kind==='psychic'?345:kind==='sleep'?230:320;
 const lanes=[0,8,-7,15,-13,3,-3,21,-19];
 const done=new Set();let age=0,impactAt=-1,hit=false;
 const points=lanes.map(()=>({x:o.x+o.c*10,y:o.y+o.s*10}));
 const effect=fxLoop(e,[g,trail],dt=>{
  age+=dt;g.clear();trail.clear();
  if(l.ko||l.est?.aturdido||age>1.65)return false;
  if(impactAt>=0){
   const t=(age-impactAt)/(kind==='psychic'?.46:.28);
   if(t<1&&hit){
    if(kind==='psychic'){
     // Heavy crush then 3 successive broad shock fronts; 12 hit poses.
     const frame=Math.min(11,Math.floor(t*12)),cx=r.x,cy=mid(r),fade=1-t;
     stamp(g,RUNE,cx,cy,C.psychic,3.7+frame*.16,frame*PI/12,fade*.92);
     stamp(trail,RUNE,cx,cy,C.psychic,2.4+frame*.31,-frame*PI/14,fade*.55);
     for(let ring=0;ring<3;ring++){
      const radius=17+ring*17+t*(36+ring*17),count=24+ring*8;
      for(let n=0;n<count;n++){
       const a=n*2*PI/count+frame*.025*(ring%2?1:-1);
       dot(g,cx+Math.cos(a)*radius,cy+Math.sin(a)*radius*.79,
        ring===0?5:4,ring===0?5:4,
        C.psychic[ring===0?4:ring===1?3:1],fade*(ring===2?.60:.93));
      }
     }
     for(let n=0;n<8;n++){
      const a=n*PI/4+PI/8,reach=21+(1-t)*20+n%2*8;
      const x=cx+Math.cos(a)*reach,y=cy+Math.sin(a)*reach;
      dot(trail,x-3,y-3,6,6,C.psychic[n%2?3:4],fade);
      dot(trail,x+Math.cos(a)*6,y+Math.sin(a)*6,3,3,C.psychic[0],fade*.8);
     }
     for(let k=0;k<4;k++)
      dot(trail,cx-27-frame*2,cy-15+k*10,54+frame*4,3,
       C.psychic[k%2?2:4],fade*.45);
    }else for(let n=0;n<5;n++)
     star(g,r.x+Math.cos(n*PI*2/5)*t*15,mid(r)+Math.sin(n*PI*2/5)*t*15,theme,t,1-t);
   }
   return t<1;
  }
  for(let i=0;i<count;i++){
   if(done.has(i))continue;
   const elapsed=age-i*(kind==='sleep'?.065:kind==='sand'?.04:0);
   if(elapsed<=0)continue;
   const d=elapsed*speed;
   if(d>length){done.add(i);continue;}
   const side=(lanes[i]||0)*(kind==='surf'?0:1+elapsed*.9);
   const wav=Math.sin(elapsed*15+i)*4;
   const pos={x:o.x+o.c*(12+d)-o.s*(side+wav),
    y:o.y+o.s*(12+d)+o.c*(side+wav)};
   const prev=points[i];points[i]=pos;
   const radius=kind==='surf'?34:kind==='psychic'?24:kind==='sleep'?11:9;
   if(clashAt(e,effect,l,pos,radius,h.tipo)){done.add(i);continue;}
   if(segment(prev,pos,r,radius)){
    done.add(i);
    if(kind==='sleep'){
     if(!r.invulnerable&&Math.random()<.75){
      r.ponerEstado?.('aturdido',2.3,{torre2Sleep:true});hit=true;
     }
    }else if(kind==='sand'){
     if(!r.invulnerable){
      r.ponerEstado?.('torre2SandAccuracy',6,{chance:.28});hit=true;
     }
    }else{
     hit=damage(l,h,extra,kind==='surf'?25:kind==='psychic'?24:15);
     if(kind==='psychic'&&hit)e.cameras?.main?.shake?.(155,.0065);
     if(kind==='psychic'&&hit&&Math.random()<.1)
      r.ponerEstado?.('confuso',2,{fonte:l});
    }
    impactAt=age;break;
   }
   const frame=Math.floor(elapsed*16)%12;
   if(kind==='psychic'){
    stamp(g,RUNE,pos.x,pos.y,theme,2.6+frame*.17,o.a+frame*.31,1-frame*.018);
    for(let k=1;k<=5;k++){
     dot(trail,pos.x-o.c*k*11,pos.y-o.s*k*11,3+k%2,3+k%2,theme[(k+frame)%5],.62);
     const a=k*PI*2/5+elapsed*8;
     dot(g,pos.x+Math.cos(a)*19,pos.y+Math.sin(a)*19,3,3,theme[3],.75);
    }
   }else if(kind==='surf'){
    // A coherent pixel-wave crest (not a sphere/beam), foaming edge leads.
    stamp(g,WAVE,pos.x,pos.y,theme,2.1+frame*.05,o.a,1);
    for(let k=0;k<7;k++){
     const lateral=(k-3)*9;
     dot(trail,pos.x-o.c*(14+k%2*6)-o.s*lateral,
      pos.y-o.s*(14+k%2*6)+o.c*lateral,4,2,theme[k%2?3:4],.65);
    }
   }else{
    const shape=kind==='sleep'?LEAF:SAND;
    stamp(g,shape,pos.x,pos.y,theme,kind==='sleep'?.83:1.25,frame*PI/6,.85);
    if(frame%3===0)dot(trail,pos.x-o.c*8,pos.y-o.s*8,2,2,theme[3],.6);
   }
  }
  return done.size<count;
 });
 return effect;
}
function melee(l,h,extra,kind){
 const e=l.escena,r=l.rival,g=e.add.graphics().setDepth(1515),impact=e.add.graphics().setDepth(1516);
 const fire=kind==='firepunch'||kind==='wheel',ice=kind==='icepunch',electric=kind==='thunderpunch';
 const pal=kind==='poisonpunch'?C.poison:fire?C.fire:ice?C.ice:electric?C.electric:kind==='cross'?C.fire:C.water;
 const o=setup(l,kind==='wheel'?'Charge':'Swing',.87);
 const reach=kind==='aerial'?82:kind==='wheel'?80:72;
 const dash=contactDash(l,o,reach,.22,.48,.82);
 let age=0,hitAt=-1,resolved=false;
 return fxLoop(e,[g,impact],dt=>{
  age+=dt;g.clear();impact.clear();
  if(l.ko||l.est?.aturdido||age>.87)return false;
  dash.step(age);
  const x=l.x+o.c*12,y=mid(l)+o.s*12;
  const frame=Math.floor(age*16)%12,alpha=clamp((.77-age)/.13);
  const art=kind==='wheel'?FIRE_RING:kind==='cross'?CROSS:kind==='aerial'?SLASH:HAND;
  stamp(g,art,x,y,pal,kind==='wheel'?2.2:kind==='aerial'?1.6:1.75,
   kind==='wheel'?age*9:kind==='cross'?o.a:o.a+Math.sin(age*17)*.07,alpha);
  if(fire||ice||electric){
   for(let n=0;n<5;n++){
    const a=n*PI*2/5+age*(fire?11:ice?5:18);
    dot(g,x+Math.cos(a)*(12+n%2*3),y+Math.sin(a)*(12+n%2*3),
     n%2+2,2,pal[(n+frame)%5],alpha*.8);
   }
  }
  if(kind==='aerial'&&age<.37)for(let n=0;n<4;n++)
   dot(g,x-o.c*n*10,y-o.s*n*10,3,3,pal[3],.78);
  if(!resolved&&age>=.29){
   resolved=true;
   const prev={x:l.x-o.c*10,y:mid(l)-o.s*10},now={x:x+o.c*18,y:y+o.s*18};
   if(segment(prev,now,r,kind==='wheel'?19:15)){
    if(damage(l,h,extra,kind==='cross'?26:14)){
     hitAt=age;
     if(kind==='icepunch'&&Math.random()<.1)r.ponerEstado?.('congelado',1.3);
     if(kind==='thunderpunch'&&Math.random()<.1)r.ponerEstado?.('paralizado',2.3);
     if(kind==='poisonpunch'&&Math.random()<.3)
      r.ponerEstado?.('veneno',4,{dps:1.3,fuente:l});
     if((kind==='firepunch'||kind==='wheel')&&Math.random()<.1)
      r.ponerEstado?.('quema',3,{dps:1.2,fuente:l});
    }
   }
  }
  if(hitAt>=0&&age-hitAt<.21){
   const fade=1-(age-hitAt)/.21;
   if(kind==='cross'){
    stamp(impact,CROSS,r.x,mid(r),pal,1.6,o.a,fade);
   }else star(impact,r.x,mid(r),pal,Math.floor((age-hitAt)*16),fade);
  }
  return true;
 },()=>dash.release());
}
// Rebuilt Flame Wheel after checking original FireRed: the WHOLE actor
// wraps in a crown of fire and charges physically (not a detached ring).
// Twelve hand-pixelled poses, one collision, a possible burn and retreat.
function flameWheel(l,h,extra){
 const e=l.escena,r=l.rival,g=e.add.graphics().setDepth(1515);
 const impact=e.add.graphics().setDepth(1516);
 const o=setup(l,'Charge',.87);
 const dash=contactDash(l,o,80,.22,.48,.82);
 let age=0,hitAt=-1,resolved=false;
 return fxLoop(e,[g,impact],dt=>{
  age+=dt;g.clear();impact.clear();
  if(l.ko||l.est?.aturdido||age>.87)return false;
  dash.step(age);
  const x=l.x,y=mid(l),frame=Math.floor(age*16)%12;
  const opacity=clamp((.77-age)/.13);
  // Three staggered flame contours closely encircle the visible Pokémon,
  // with taller upper tongues and backward-flowing heat as it charges.
  for(let k=0;k<10;k++){
   const a=k*PI/5,flutter=((frame+k*3)%5)-2;
   const ring=19+flutter*1.1;
   const px=x+Math.cos(a)*ring,py=y+Math.sin(a)*(ring*.86);
   stamp(g,WHEEL_FLAME,px,py,C.fire,1.10+(k%3)*.13,
    a-PI*.5+.14*Math.sin(frame+k),opacity);
   if(k%2===0)stamp(g,WHEEL_EMBER,px+o.c*4,py+o.s*4,C.fire,.8,
    a-PI/2,opacity*.83);
  }
  stamp(g,WHEEL_FLAME,x-o.c*7,y+9,C.fire,1.85,-PI/2,opacity*.76);
  for(let n=0;n<6;n++){
   const retreat=n*7+frame%3*2;
   dot(g,x-o.c*(13+retreat),y-o.s*(13+retreat)+(n%3-1)*9,
    4-(n%3),3,C.fire[(n+frame)%4+1],opacity*(.85-n*.085));
  }
  if(!resolved&&age>=.29){
   resolved=true;
   const from={x:l.x-o.c*10,y:mid(l)-o.s*10};
   const to={x:l.x+o.c*30,y:mid(l)+o.s*30};
   if(segment(from,to,r,19)&&damage(l,h,extra,17)){
    hitAt=age;
    if(Math.random()<.1)r.ponerEstado?.('quema',3,{dps:1.2,fuente:l});
   }
  }
  if(hitAt>=0&&age-hitAt<.28){
   const t=(age-hitAt)/.28;
   stamp(impact,WHEEL_FLAME,r.x,mid(r),C.fire,2.6+t*1.5,0,1-t);
   for(let n=0;n<6;n++){
    const a=n*PI/3;
    const d=t*31+8;
    dot(impact,r.x+Math.cos(a)*d,mid(r)+Math.sin(a)*d,4,4,
     C.fire[n%3+2],1-t);
   }
  }
  return true;
 },()=>dash.release());
}


/* Surf — faithful remaster of Pokémon Torre 1's OWN pixel water crest.
 * Source: effects/moves/_runtime/semantic-vfx.js (styleName==='wave'):
 * 7-point hooked profile, swell 43+37*sin(pi*t), backward rolling mass
 * and nine detached foam droplets. Converted to Phaser WEBGL tile/pixel
 * raster, with a larger blue body and 12 distinct foam poses. No detached
 * ball, no CSS, no 2D Canvas, no native/approved spell overwritten.
 * Physics: visual water face actually crosses the target before damage.
 */
const TORRE1_SURF_SILHOUETTE=Object.freeze([
 [-1,32],[-.85,-18],[-.56,-1],[-.33,-.73],[-.16,-.88],[0,-12],[.115,20]
]);
const surfEase=t=>{const u=clamp(t);return u*u*(3-2*u);};
function surfRemastered(l,h,extra){
 const e=l.escena,r=l.rival,body=e.add.graphics().setDepth(1515);
 const foam=e.add.graphics().setDepth(1516);
 const o=setup(l,'Charge',.62);
 let age=0,hasHit=false,impactAt=-1;
 const length=Math.min(h.alcance||225,260);
 const palette=C.water;
 let former={x:l.x+o.c*10,y:mid(l)+o.s*10};
 return fxLoop(e,[body,foam],dt=>{
  age+=dt;body.clear();foam.clear();
  if(l.ko||l.est?.aturdido||age>1.23)return false;
  const growing=surfEase(age/.31);
  const travel=surfEase((age-.08)/.76);
  const frame=Math.floor(age*16)%12;
  // Real Torre 1 swell equation and seven-point hooked wave front.
  const height=(43+37*Math.sin(PI*clamp(age/1.08)))*growing;
  const width=(92+51*growing+12*Math.sin(PI*travel));
  const tip=10+length*travel;
  const x=o.x+o.c*tip,y=o.y+o.s*tip;
  const fade=clamp((1.23-age)/.18);
  // Seven-point outline sampled from Torre 1; each band is 7px pixel art,
  // and curved crest animates rather than travelling as a rigid static PNG.
  const hull=TORRE1_SURF_SILHOUETTE.map(([u,v],i)=>[
   u<0?u*width:u*width,
   i===2?-height:i===3?-height*.73:i===4?-height*.88:v
  ]);
  const pixel=7;
  for(let xi=-width;xi<=width*.115;xi+=pixel){
   let upper=-12;
   for(let k=1;k<hull.length;k++){
    if(xi<hull[k-1][0]||xi>hull[k][0])continue;
    const t=(xi-hull[k-1][0])/(hull[k][0]-hull[k-1][0]||1);
    upper=hull[k-1][1]+(hull[k][1]-hull[k-1][1])*t;
    break;
   }
   const curl=Math.sin(frame*PI/6+xi*.078)*3.5*growing;
   const top=upper+curl;
   const base=26+Math.sin(xi*.034+frame*.27)*2;
   for(let yi=top;yi<base;yi+=pixel){
    const r=(yi-top)/(base-top||1);
    const darkRim=yi+pixel>=base;
    const foamEdge=r<.085;
    const color=foamEdge?palette[4]:r<.23?palette[3]:
     r<.61?palette[2]:darkRim?palette[0]:palette[1];
    const flicker=((Math.floor(xi/pixel)+Math.floor(yi/pixel)+frame)%9===0);
    const col=flicker&&r>.23&&r<.75?palette[3]:color;
    const px=x+o.c*xi-o.s*yi,py=y+o.s*xi+o.c*yi;
    dot(body,px,py,pixel+1,pixel+1,col,fade*(foamEdge?1:.91));
   }
   // Hooked bright crest and strong ink contour (both pixel stepped).
   const cx=x+o.c*xi-o.s*top,cy=y+o.s*xi+o.c*top;
   if(xi<-width*.10&&xi>-width*.74)
    dot(foam,cx,cy,8,5,palette[4],fade);
   if(xi<-width*.12&&xi>-width*.92)
    dot(foam,cx-o.s*7,cy+o.c*7,6,3,palette[0],fade*.80);
  }
  // Torre 1 had nine independent foams along the travelling water, now
  // 12 hand-timed poses / detached beads with changing crest curvature.
  for(let k=0;k<9;k++){
   const back=-width*(k+.6)/10;
   const spray=10+Math.sin(k*3.2+frame*PI/6)*12;
   const px=x+o.c*back-o.s*(-spray),py=y+o.s*back+o.c*(-spray);
   const sz=3+(k%3)*2;
   dot(foam,px,py,sz+2,sz,palette[k%2?3:4],fade*.9);
   if(k%2===0)dot(foam,px-5,py-4,3,3,palette[4],fade*.68);
  }
  // One exact collision at the moving FACE, not when the attack begins.
  // The whole hooked silhouette travels along the aiming direction.
  const current={x:x+o.c*width*.1,y:y+o.s*width*.1};
  if(!hasHit&&r&&!r.ko&&segment(former,current,r,31)){
   hasHit=true;
   if(damage(l,h,extra,23))impactAt=age;
  }
  former=current;
  if(impactAt>=0){
   const t=(age-impactAt)/.39;
   if(t<1){
    // Wave CRASH: twelve independent foam shards, synchronized to damage.
    for(let i=0;i<12;i++){
     const a=(i*PI/6),radius=7+t*(24+(i%3)*7);
     const cx=r.x+Math.cos(a)*radius,cy=mid(r)+Math.sin(a)*radius;
     dot(foam,cx,cy,5+(i%3)*2,5+(i%2)*2,palette[i%4?4:3],1-t);
    }
    stamp(foam,SPARK,r.x,mid(r),palette,1.8+t*1.2,t*PI,1-t);
   }
  }
  return true;
 });
}

const finale13={
 torre2_finale_psychic:(l,h,x)=>projectile(l,h,x,'psychic'),
 torre2_finale_sleeppowder:(l,h,x)=>projectile(l,h,x,'sleep'),
 torre2_finale_protect:(l,h)=>selfStatus(l,h,'protect'),
 torre2_finale_surf:(l,h,x)=>surfRemastered(l,h,x),
 torre2_finale_icepunch:(l,h,x)=>melee(l,h,x,'icepunch'),
 torre2_finale_thunderpunch:(l,h,x)=>melee(l,h,x,'thunderpunch'),
 torre2_finale_firepunch:(l,h,x)=>melee(l,h,x,'firepunch'),
 torre2_finale_crosschop:(l,h,x)=>melee(l,h,x,'cross'),
 torre2_finale_aerialace:(l,h,x)=>melee(l,h,x,'aerial'),
 torre2_finale_flamewheel:(l,h,x)=>flameWheel(l,h,x),
 torre2_finale_lightscreen:(l,h)=>selfStatus(l,h,'screen'),
 torre2_finale_raindance:(l,h)=>selfStatus(l,h,'rain'),
 torre2_finale_sandattack:(l,h,x)=>projectile(l,h,x,'sand'),
 torre2_finale_poisonpunch:(l,h,x)=>melee(l,h,x,'poisonpunch')
};
export const TORRE2_FINALE_13_FORMS=Object.freeze(finale13);
