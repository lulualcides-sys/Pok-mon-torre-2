/* Pokémon Torre 2 — shared Clash and pixel dissipation for NEW attacks.
 * The native Poké Arena 2D Proyectil/Proyectil and beam/beam Clash already
 * works; NEVER override, replace or duplicate that approved implementation.
 * This adapter bridges new authored projectile spells with either other new
 * spells or opposing native projectiles, only at real hitbox intersections.
 * All graphics are Phaser/WebGL Graphics. No Canvas2D or CSS decorations.
 */
const clamp=n=>Math.max(0,Math.min(1,n));
const shades=Object.freeze({
 GROUND:[0x292332,0x73513b,0xb9926a,0xe2bf87],
 GRASS:[0x233329,0x446b38,0x98bf5e,0xe4eea4],
 WATER:[0x1c314d,0x3b84bf,0x95d7f5,0xffffff],
 FIRE:[0x43252b,0xbc4c32,0xfeb76a,0xffe9ae],
 ELECTRIC:[0x4b4122,0xd1a43b,0xffe679,0xffffff],
 NORMAL:[0x222b38,0x708096,0xe6ded0,0xffffff]
});
function pick(type){return shades[type]??shades.NORMAL}
function px(g,x,y,w,h,c,a=1){g.fillStyle(c,a).fillRect(
 Math.round(x),Math.round(y),Math.max(1,Math.round(w)),Math.max(1,Math.round(h)))}
/** 10 frames: hand-pixel crossing X + two directional dissolving fragments.
 * Independently updating Phaser Graphics so the approved spell sprite never
 * changes shape, transparency, damage or timing when it is NOT clashing.
 */
export function clashBurst(scene,x,y,types=['NORMAL','NORMAL']){
 const top=scene.add.graphics().setDepth(1517),p=pick(types[0]),q=pick(types[1]);
 let elapsed=0,closed=false;
 const stop=()=>{if(closed)return;closed=true;top.destroy()};
 const fx={update(dt){
  if(closed)return false;
  elapsed+=dt;top.clear();const frame=Math.floor(elapsed/.033);
  if(frame>=10){stop();return false}
  const fade=clamp((10-frame)/8),size=frame<3?2:1;
  // Compact crossing strike: four stepped 1-2px pixels per diagonal.
  if(frame<=4)for(let n=-3;n<=3;n++){
   px(top,x+n*3-1,y+n*3-1,size+1,size+1,n%2?p[2]:q[3],fade);
   px(top,x+n*3-1,y-n*3-1,size+1,size+1,n%2?q[2]:p[3],fade);
  }
  // Dissipation — asymmetric staggered fragments, moving away from
  // impact (two palette families), no damage and no lingering particles.
  for(let j=0;j<8;j++){
   const a=j*Math.PI/4+(j%2?.2:0);
   const d=2+frame*(1.4+j%3*.65);
   const xx=x+Math.cos(a)*d,yy=y+Math.sin(a)*d*.72;
   px(top,xx,yy,j%3===0?3:2,2,j%2?p[1]:q[2],fade*(.9-j*.045));
  }
  return true;
 },destroy:stop};
 scene.efectos.push(fx);
 return fx;
}
function candidate(item,self,attacker){
 if(!item||item===self)return null;
 const body=item.clashBody;
 if(body){
  if(!body.live||body.owner!==attacker.rival)return null;
  return{x:body.x,y:body.y,radius:body.radius??11,
   type:body.type||'NORMAL',cancel:()=>item.destroy?.()};
 }
 // Native Poké Arena Proyectil fields: vivo, dueno, x/y, h.radio.
 // Avoid instanceof so nothing in the approved original is imported/changed.
 if(item.vivo!==true||item.dueno!==attacker.rival||
    !item.h||item.h.noChoca||item.h.revienta||item.fantasma)return null;
 return{x:item.x,y:item.y-(item.alt||0)*.35,
  radius:Math.max(4,item.h.radio??9),type:item.h.tipo||'NORMAL',
  cancel:()=>item.terminar?.(false,true)};
}
/** Return true only when the *new* spell was physically cancelled by
 * an opposing projectile. The native pairwise Clash algorithm is untouched.
 */
export function clashAt(scene,self,attacker,tip,radius=11,type='NORMAL'){
 if(!attacker?.rival||!scene?.efectos)return false;
 for(const item of scene.efectos){
  const b=candidate(item,self,attacker);
  if(!b)continue;
  if(Math.hypot(b.x-tip.x,b.y-tip.y)>radius+b.radius+2)continue;
  // Opponents cannot clash if one is only a status aura or ghost pass-through.
  b.cancel();
  clashBurst(scene,(tip.x+b.x)*.5,(tip.y+b.y)*.5,[type,b.type]);
  return true;
 }
 return false;
}
