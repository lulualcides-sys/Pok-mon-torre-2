import {gymWideLayout} from './torre2-gym-wide-layout.js';
/* T19 — existing genuine trainer indices in gyms, Rival/Rocket on routes.
 * Presentation only: preserve routeNode identities, saves and boss gating.
 */
export const GYM_INTERMEDIATE_VERSION='t19-gym-roster-v1';
 // Only visual classes selected from existing original FRLG overworld sprites.
 // The actual opponent's original name, kind, index and battle team stay intact.
 export const GYM_NPC_VISUALS=Object.freeze([
  Object.freeze(['hiker','youngster','hiker']),
  Object.freeze(['swimmer','lass','swimmer','ace']),
  Object.freeze(['sailor','gentleman','rocker','ace']),
  Object.freeze(['lass','picnicker','lass','ace']),
  Object.freeze(['biker','rocket','ace','biker']),
  Object.freeze(['psychic','scientist','ace','channeler']),
  Object.freeze(['scientist','ace','gentleman','scientist']),
  Object.freeze(['rocket','rocker','ace','rocket'])
 ]);
 export function gymNpcVisualKinds(stage){return GYM_NPC_VISUALS[stage]||Object.freeze([])}

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
  // Existing authentic FRLG overworld sprites, not newly fabricated art.
  // Class affects appearance only: battle opponent IDs/names remain intact.
  const npcKind=t.kind==='rival'?'rival':t.kind==='rocket'?'rocket':
   gymNpcVisualKinds(model.stage)[t.slot]||'ace';
  // The decomp source may omit an optional class on one capture. Always
  // prefer its original FRLG sprite; otherwise a legitimate existing
  // FireRed ace/youngster is better than an invisible gym challenger.
  let npc=null,usedKind=null;
  for(const kind of new Set([npcKind,'ace','youngster'])){
   npc=addNpc(scene,kind,t.x,t.y,{scale:1.05,depth:16});
   if(npc){usedKind=kind;break}
  }
  npc?.setData('torre2-gym-intermediate',t.index);
  npc?.setData('torre2-gym-original-sprite',usedKind);
  // Original NPC sprite stays prominent: the former repeated TREINADOR
  // label over every platform made the room look like a menu diagram.
  // Only the active challenger gets a caption; other actors keep tiny cues.
  const label=t.status==='current'?t.title:
   t.status==='defeated'?'✓':String(t.slot+1);
  scene.add.text(t.x,t.y+10,label,{
   fontFamily:'Pixelify Sans,monospace',
   fontSize:t.status==='current'?'9px':'8px',fontStyle:'bold',
   color:colors[t.status],stroke:'#132032',strokeThickness:2
  }).setOrigin(.5).setDepth(19);
  if(t.status==='current'){
   scene.add.text(t.x,t.y-32,'▼',{
    fontFamily:'Pixelify Sans,monospace',fontSize:'11px',
    fontStyle:'bold',color:'#ffe49d',stroke:'#102a32',strokeThickness:2
   }).setOrigin(.5).setDepth(18);
  }
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
