/* Gym-only presentation. Never mutate stage/trainer, save, team or RNG. */
import {gymRouteCount} from './route-data.js';
export {gymRouteCount};
export const ACE_ANCHORS={leader:[274,109],ace:[369,109]};
const POS=[[166,186],[474,186],[166,252],[474,252]];
const COLORS=[[0x6c5848,0xc1aa88,0x88745b,0xe9d19c],
 [0x1671a5,0xa5d1ce,0x4083a4,0xe5f8e9],
 [0x495e71,0xb3b9bc,0x6b8592,0xf5d888],
 [0x46805a,0xa6c4a4,0x68966a,0xe6e9b4],
 [0x514576,0xb2a7bd,0x8a79a2,0xe2d5f2],
 [0x4a477e,0xaaa5c4,0x8176ad,0xe5dfff],
 [0xa74d33,0xc9a089,0xb07553,0xffd99a],
 [0x60594b,0xbab09b,0x81745f,0xf2ddae]];
export function gymInteriorModel(s,gyms,trainerLimit,routeNode){
 const stage=s?.stage;if(!Number.isInteger(stage)||stage<0||stage>=8||!gyms[stage])return null;
 const limit=trainerLimit(stage),count=stage===0?3:4,routeCount=gymRouteCount(stage,trainerLimit);
 const progress=Math.max(0,Math.min(limit,Math.floor(Number(s.trainer)||0))),g=gyms[stage];
 return {stage,city:g.city,leader:g.leader,ace:g.boss,aceInTeam:g.leaderTeam.includes(g.boss),
  limit,routeCount,gymCount:count,progress,routeComplete:progress>=routeCount,
  leaderReady:progress>=limit&&!s.champion,
  trainers:Array.from({length:count},(_,slot)=>{
   const index=routeCount+slot,n=routeNode(stage,index,limit);
   return {index,slot,x:POS[slot][0],y:POS[slot][1],kind:n.type,identity:n.name,
    status:index<progress?'defeated':index===progress?'current':'locked'};
  })};
}
function box(g,x,y,w,h,c){g.fillStyle(c).fillRect(x,y,w,h)}
function platform(g,x,y,w,h,p){
 box(g,x+4,y+5,w,h,0x142332);box(g,x,y,w,h,p[2]);
 box(g,x+3,y+3,w-6,h-6,p[1]);box(g,x+3,y+3,w-6,4,p[3]);
}
export function renderGymInterior(scene,m,{addNpc,aceTexture,onTrainer,onLeader}={}){
 if(!m)return null;const p=COLORS[m.stage],g=scene.add.graphics().setDepth(0)
  .setData('torre2-gym-layer','terrain');
 box(g,0,0,640,360,0x102436);box(g,12,10,616,340,p[1]);
 box(g,22,24,596,262,p[2]);box(g,29,30,582,250,p[0]);
 for(let y=30;y<280;y+=12)for(let x=29;x<610;x+=16)
  g.lineStyle(1,p[3],.2).strokeRect(x+(y%24?7:0),y,16,12);
 platform(g,215,40,210,94,p);platform(g,286,125,68,158,p);
 for(const [x,y] of POS)platform(g,x-47,y-39,94,64,p);
 for(let y=129;y<270;y+=12)box(g,307,y,26,3,p[3]);
 const shadow=scene.add.graphics().setDepth(5);
 shadow.fillStyle(0x061a2c,.5).fillEllipse(ACE_ANCHORS.ace[0],ACE_ANCHORS.ace[1]+2,45,10);
 shadow.setData('torre2-gym-ace-shadow',m.ace);
 const kind=m.leader.toLowerCase().replace('lt. ','');
 const leader=addNpc?.(scene,kind,...ACE_ANCHORS.leader,{scale:1.5,depth:7});
 leader?.setData('torre2-gym-leader',m.leader);
 let ace=null;
 if(aceTexture&&scene.textures.exists(aceTexture)){
  const size=m.stage===0?61:52;
  ace=scene.add.image(...ACE_ANCHORS.ace,aceTexture).setOrigin(.5,1)
   .setDisplaySize(size,size).setDepth(7).setData('torre2-gym-ace',m.ace);
  if(typeof Phaser!=='undefined')
   scene.textures.get(aceTexture).setFilter(Phaser.Textures.FilterMode.NEAREST);
  if(scene.tweens?.add){
   scene.tweens.add({targets:ace,y:ace.y-2,duration:1300,yoyo:true,repeat:-1});
   ace.once('destroy',()=>scene.tweens.killTweensOf(ace));
  }
 }
 const label=(x,y,t,size=10)=>scene.add.text(x,y,t,{
  fontFamily:'Pixelify Sans,monospace',fontSize:size+'px',color:'#fff4df',
  stroke:'#142538',strokeThickness:3}).setOrigin(.5).setDepth(12);
 label(320,18,m.city.toUpperCase()+' · GINÁSIO',16);
 label(320,142,m.leader.toUpperCase()+' · '+m.ace.toUpperCase(),11);
 m.trainers.forEach(t=>{
  const kind=t.kind==='rival'?'rival':t.kind==='rocket'?'rocket':
   m.stage===0?'hiker':'lass';
  addNpc?.(scene,kind,t.x,t.y,{scale:1.1,depth:7})
   ?.setData('torre2-gym-trainer',t.index);
  label(t.x,t.y+11,(t.kind==='trainer'?'TREINADOR '+(t.index+1):t.identity)+
   (t.status==='defeated'?' ✓':''),9);
  if(t.status==='current'&&m.routeComplete)
   scene.add.zone(t.x,t.y-10,74,50).setDepth(13).setInteractive({useHandCursor:true})
    .setData('torre2-gym-trainer-action',t.index)
    .on('pointerdown',()=>onTrainer?.(t.index));
 });
 if(m.leaderReady)
  scene.add.zone(ACE_ANCHORS.leader[0],ACE_ANCHORS.leader[1]-13,54,48)
   .setDepth(13).setInteractive({useHandCursor:true})
   .setData('torre2-gym-leader-action',m.stage).on('pointerdown',()=>onLeader?.());
 scene.__torre2GymInterior={...m,aceRendered:!!ace,leaderRendered:!!leader};
 return scene.__torre2GymInterior;
}
