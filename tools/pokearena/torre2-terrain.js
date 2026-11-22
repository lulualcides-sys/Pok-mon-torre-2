/* Pokémon Torre 2 — battle terrains (owner 2026-11-22, README item 8:
 * "golpes que modificam o cenário"). Campaign battles only.
 * No new moves are invented (FRLG has no terrain moves): a real ULT cast of
 * an Electric, Grass, Water or Psychic move turns the arena floor into that
 * terrain for a few seconds, with a 25% chance per ULT (not every ULT),
 * covering the whole arena.
 *  - Campo Elétrico: Electric moves +30%.
 *  - Campo Gramado: Grass moves +30% and both fighters recover 1/16 HP every
 *    4 s.
 *  - Campo Aquático: Water moves +30% and Fire moves -30%.
 *  - Campo Psíquico: Psychic moves +30%.
 * Visual: a pixel layer on the arena floor (Phaser Graphics, no Canvas2D),
 * under the fighters, plus a small HUD label like the weather one.
 */
import {LIENZO} from '../arena.js';
export const TERRAIN_SECONDS=12;
// Not every ULT: a chance per real ULT cast of the type (owner 2026-11-22).
export const TERRAIN_CHANCE=.25;
export const TERRAINS=Object.freeze({
 eletrico:{name:'CAMPO ELÉTRICO',type:'ELECTRIC',color:0xffe14a,accent:0xfff7b0},
 gramado:{name:'CAMPO GRAMADO',type:'GRASS',color:0x5cc84a,accent:0x2f8f3a},
 aquatico:{name:'CAMPO AQUÁTICO',type:'WATER',color:0x4aa8ff,accent:0xc8ecff},
 psiquico:{name:'CAMPO PSÍQUICO',type:'PSYCHIC',color:0xff7ad9,accent:0xffd6f4}
});
const BY_TYPE=Object.freeze(Object.fromEntries(Object.entries(TERRAINS).map(([k,t])=>[t.type,k])));
export const TERRAIN_BOOST=1.3;
export function terrainFromCast(slot,move,random=Math.random){
 if(slot!=='e')return null;
 const kind=BY_TYPE[String(move?.tipo||'').toUpperCase()]||null;
 if(!kind)return null;
 const r=Number(random());
 return Number.isFinite(r)&&r>=0&&r<TERRAIN_CHANCE?kind:null;
}
export function terrainDamage(kind,moveType){
 const t=TERRAINS[kind];if(!t)return 1;const type=String(moveType||'').toUpperCase();
 if(type===t.type)return TERRAIN_BOOST;
 if(kind==='aquatico'&&type==='FIRE')return .7;
 return 1;
}
export function terrainHeal(kind,hpMax,dt){return kind==='gramado'?(Number(hpMax)||0)/64*Math.max(0,Math.min(.25,Number(dt)||0)):0}
// Deterministic pattern over the WHOLE arena (rect x,y,w,h). phase: frames.
const hash=i=>{let h=(i+1)*2654435761>>>0;h^=h>>>13;h=Math.imul(h,1274126177)>>>0;return (h>>>0)/4294967296};
export function terrainPattern(kind,phase,rect){
 const out=[];if(!TERRAINS[kind])return out;
 const n=kind==='gramado'?150:kind==='aquatico'?24:kind==='eletrico'?56:60;
 for(let i=0;i<n;i++){
  let x=rect.x+hash(i)*rect.w,y=rect.y+hash(i+97)*rect.h;
  if(kind==='psiquico'){y-=((phase*1.2+i*13)%40);}
  out.push({x:Math.round(x),y:Math.round(y),i,on:kind==='eletrico'?((phase+i*5)%14)<5:true,
   grow:kind==='aquatico'?((phase*.9+i*9)%36)/36:0,alpha:kind==='psiquico'?.35+.45*Math.abs(Math.sin((phase+i*7)/9)):1});
 }
 return out;
}
function drawPattern(g,kind,items,fade){
 const t=TERRAINS[kind];
 for(const p of items){
  if(kind==='eletrico'){if(!p.on)continue;g.fillStyle(t.accent,.9*fade);
   // pixel zigzag spark
   for(const [dx,dy] of [[0,0],[3,3],[0,6],[3,9],[0,12]])g.fillRect(p.x+dx,p.y+dy-6,3,3);
   g.fillStyle(t.color,.8*fade).fillRect(p.x-3,p.y-2,3,3);g.fillRect(p.x+5,p.y+2,3,3);}
  else if(kind==='gramado'){g.fillStyle(p.i%3?t.accent:t.color,.85*fade);
   g.fillRect(p.x,p.y-1,2,6);g.fillRect(p.x-3,p.y+1,2,4);g.fillRect(p.x+3,p.y+1,2,4);}
  else if(kind==='aquatico'){const rx=4+p.grow*22,ry=rx*.42;g.lineStyle(2,t.accent,(1-p.grow)*.8*fade).strokeEllipse(p.x,p.y,rx*2,ry*2);}
  else if(kind==='psiquico'){g.fillStyle(t.accent,p.alpha*fade);g.fillRect(p.x,p.y-2,2,6);g.fillRect(p.x-2,p.y,6,2);}
 }
}
// --- Phaser install (party-battle.js, campaign only) --------------------------
export function installTerrain(scene,{rect,hud,random=Math.random}={}){
 if(!scene?.datos?.torre2?.party||scene.__torre2Terrain)return null;
 const area=rect||{x:LIENZO.x,y:LIENZO.y,w:LIENZO.w,h:LIENZO.h};
 const layer=scene.add.graphics().setDepth(2);
 const state={kind:'none',remaining:0,phase:0,acc:0,fade:0,casts:0};
 const api={state,area,
  set(kind){if(!TERRAINS[kind])return;state.kind=kind;state.remaining=TERRAIN_SECONDS;state.casts++;hud?.announce?.(TERRAINS[kind].name+'!')},
  damage(src,dst,g){return state.kind==='none'?1:terrainDamage(state.kind,g?.tipo)},
  heal(f,dt){return state.kind==='none'?0:terrainHeal(state.kind,typeof f?.hpMax==='function'?f.hpMax():f?.hpMax,dt)}};
 const update=(_t,delta)=>{
  const dt=Math.max(0,Math.min(.2,(Number(delta)||16)/1000));
  if(state.kind!=='none'&&scene.fase==='lucha'){state.remaining-=dt;
   for(const f of scene.luchadores||[]){if(f&&!f.ko&&f.hp>0){const h=api.heal(f,dt);if(h>0)f.hp=Math.min(typeof f.hpMax==='function'?f.hpMax():f.hpMax,f.hp+h)}}
   if(state.remaining<=0)state.kind='ending';}
  state.fade=state.kind==='none'?0:state.kind==='ending'?Math.max(0,state.fade-dt*2.5):Math.min(1,state.fade+dt*2.5);
  if(state.kind==='ending'&&state.fade<=0){state.kind='none';state.last=null}
  if(state.kind!=='ending'&&state.kind!=='none')state.last=state.kind;
  hud?.label?.((state.kind!=='none'&&state.kind!=='ending')?TERRAINS[state.kind].name+' '+Math.ceil(state.remaining)+'s':'');
  state.acc+=dt*1000;if(state.acc<90)return;state.acc=0;state.phase++;
  layer.clear();const kind=state.kind==='ending'?state.last:state.kind;
  if(!kind||state.fade<=0)return;
  const t=TERRAINS[kind];
  // The whole arena changes, not only the fighting oval.
  layer.fillStyle(t.color,.2*state.fade).fillRect(area.x,area.y,area.w,area.h);
  drawPattern(layer,kind,terrainPattern(kind,state.phase,area),state.fade);
 };
 scene.events.on('update',update);
 // Native cast hook chain (arena-trainers.js installed the first listener).
 const previous=globalThis.__torre2Cast;
 const cast=(l,slot,h)=>{try{previous?.(l,slot,h)}catch{}if(l?.escena===scene){const k=terrainFromCast(slot,h,random);if(k)api.set(k)}};
 globalThis.__torre2Cast=cast;globalThis.__torre2Terrain=api;scene.__torre2Terrain=api;
 scene.events.once('shutdown',()=>{scene.events.off('update',update);layer.destroy();
  if(globalThis.__torre2Cast===cast)globalThis.__torre2Cast=previous||null;
  if(globalThis.__torre2Terrain===api)globalThis.__torre2Terrain=null;scene.__torre2Terrain=null});
 return api;
}
