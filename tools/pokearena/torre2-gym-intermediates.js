import {gymWideLayout} from './torre2-gym-wide-layout.js';
/* T19 — existing genuine trainer indices in gyms, Rival/Rocket on routes.
 * Presentation only: preserve routeNode identities, saves and boss gating.
 */
export const GYM_INTERMEDIATE_VERSION='t19-gym-roster-v1';
const POSITIONS=Object.freeze([
 Object.freeze({x:157,y:139}),Object.freeze({x:483,y:139}),
 Object.freeze({x:157,y:192}),Object.freeze({x:483,y:192})
]);
export function gymIntermediateModel(state,gyms,trainersPerGym,routeNode){
 const stage=state?.stage;
 if(!Number.isInteger(stage)||stage<0||stage>=8||!gyms?.[stage])return null;
 const limit=trainersPerGym(stage);
 if(!Number.isInteger(limit)||limit<4)throw Error('Invalid trainer ladder');
 const gymCount=stage===0?3:4;
 // Keep every rival/Rocket at its ORIGINAL ladder index on the route.
 // Select the last genuine trainer encounters for the interior, even if
 // they interleave with a later route encounter. No save migration, RNG or
 // opponent identity changes; the route stays accessible between gym fights.
 const gymIndices=[];
 for(let index=limit-1;index>=0&&gymIndices.length<gymCount;index--){
  if(routeNode(stage,index,limit)?.type==='trainer')gymIndices.push(index);
 }
 if(gymIndices.length!==gymCount)throw Error('Insufficient genuine gym trainers');
 gymIndices.reverse();
 const gymSet=new Set(gymIndices);
 const routeIndices=Array.from({length:limit},(_,i)=>i).filter(i=>!gymSet.has(i));
 const routeCount=routeIndices.length;
 const progress=Math.max(0,Math.min(limit,Math.trunc(Number(state.trainer)||0)));
 const slots=gymIndices.map((index,i)=>{
  const node=routeNode(stage,index,limit);
  const p=gymWideLayout(stage)?.slots[i]||POSITIONS[i];
  return Object.freeze({index,slot:i,x:p.x,y:p.y,
   role:'gym-trainer',kind:'trainer',title:'TREINADOR '+(i+1),originalName:node.name,
   status:index<progress?'defeated':index===progress?'current':'locked'});
 });
 return Object.freeze({version:GYM_INTERMEDIATE_VERSION,stage,leader:gyms[stage].leader,
  limit,routeCount,gymCount,progress,
  routeIndices:Object.freeze(routeIndices),gymIndices:Object.freeze(gymIndices),
  routeProgress:routeIndices.filter(i=>i<progress).length,
  inGym:gymSet.has(progress),leaderReady:progress>=limit&&!state.champion,
  slots:Object.freeze(slots)});
}
export function drawGymIntermediates(scene,model,addNpc,onBattle){
 if(!model)return null;
 const colors={defeated:'#93cda2',current:'#ffe29b',locked:'#b3b9bd'};
 let currentZones=0;
 for(const t of model.slots){
  // No character or hitbox in the central bridge, ace, leader or CTA.
  scene.add.ellipse(t.x,t.y+1,24,6,0x101c30,.36).setDepth(13);
  const npcKind=t.kind==='rival'?'rival':t.kind==='rocket'?'rocket':
   model.stage===0?'hiker':'ace';
  addNpc(scene,npcKind,t.x,t.y,{scale:1.05,depth:16})
   ?.setData('torre2-gym-intermediate',t.index);
  scene.add.text(t.x,t.y+6,t.title+(t.status==='defeated'?' ✓':''),{
   fontFamily:'Pixelify Sans,monospace',fontSize:'9px',fontStyle:'bold',
   color:colors[t.status],stroke:'#132032',strokeThickness:2
  }).setOrigin(.5).setDepth(19);
  if(t.status==='current'&&model.inGym){
   scene.add.zone(t.x,t.y-17,53,40).setDepth(20)
    .setInteractive({useHandCursor:true})
    .setData('torre2-gym-intermediate-action',t.index)
    .on('pointerdown',()=>onBattle?.(t.index));
   currentZones++;
  }
 }
 const report=Object.freeze({...model,interactiveCount:currentZones,decorativeOnly:true});
 scene.__torre2GymRoster=report;
 return report;
}
