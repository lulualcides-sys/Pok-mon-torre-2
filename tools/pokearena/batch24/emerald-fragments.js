/* Adapted from GBurgardt/pokemon-emerald-arena:
 * game/overlay/src/arena_physics.c — Fragment / ArenaPhysics_Update.
 * MIT, Copyright (c) 2026 German Burgardt. Full notice: EMERALD-LICENSE.txt.
 * Only debris integration, gravity, drag and ground bounces are ported.
 * No GBA renderer, third-party art, obstacle system or combat damage copied.
 * The short P2 impact compresses 48 simulation ticks into 12 visual poses.
 */
export function stepFragment(f){
 f.x+=f.vx;f.y+=f.vy;f.z+=f.vz;f.vz-=42;
 if(f.z<=0){
  f.z=0;
  if(f.vz < -100 && f.bounces<3){f.vz=Math.trunc(-f.vz*90/256);f.bounces++;}
  else f.vz=0;
  f.vx=Math.trunc(f.vx*180/256);f.vy=Math.trunc(f.vy*180/256);
 }else{f.vx=Math.trunc(f.vx*251/256);f.vy=Math.trunc(f.vy*251/256);}
 if(Math.abs(f.vx)<6)f.vx=0;
 if(Math.abs(f.vy)<6)f.vy=0;
 return f;
}
// Bounded precomputed offsets: no random gameplay calls or per-frame allocation.
export const FRAGMENT_POSES=Object.freeze(Array.from({length:7},(_,j)=>{
 const a=j*2.399,f={x:0,y:0,z:(2+j%4)*256,
  vx:Math.round(Math.cos(a)*400),vy:Math.round(Math.sin(a)*360),
  vz:512+j*63,bounces:0};
 return Object.freeze(Array.from({length:12},()=>{
  const pose=Object.freeze({x:f.x/256,y:(f.y-f.z)/256});
  for(let k=0;k<4;k++)stepFragment(f);
  return pose;
 }));
}));
