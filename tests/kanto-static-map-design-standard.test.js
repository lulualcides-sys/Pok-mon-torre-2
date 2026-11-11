import test from 'node:test';
import assert from 'node:assert/strict';
import {KANTO_VISUAL_MAPS,KANTO_ENCOUNTER_GROUPS,KANTO_MAP_PRESENTATION,
 validateKantoVisualMaps,normalizedMapRect,drawKantoMapLabels
} from '../tools/pokearena/torre2-static-map-design-standard.js';
test('every reviewed/pending map has normalized, non-overlapping namespace with map title',()=>{
 const report=validateKantoVisualMaps();
 assert.equal(report.pass,true,report.errors.join(','));
 assert.equal(report.mapCount,7);
 for(const [name,map] of Object.entries(KANTO_VISUAL_MAPS)){
  assert.equal(map.id,name);
  assert.ok(map.title.length>3);
  for(const h of map.hotspots) {
   const px=normalizedMapRect(h.rect,640,360);
   assert.ok(px.x>=0&&px.x<=640&&px.y>=0&&px.y<=360);
   assert.ok(px.width>0&&px.height>0);
  }
 }
 assert.equal(KANTO_MAP_PRESENTATION.gameIntegrationRequiresArtApproval,true);
});
test('pre-Misty locations share encounters excluding Abra, which belongs only at Cerulean',()=>{
 for(const id of ['route1','route2','viridianForest'])
  assert.equal(KANTO_VISUAL_MAPS[id].wildPool,'preMistyWithoutAbra');
 assert.equal(KANTO_ENCOUNTER_GROUPS.preMistyWithoutAbra.includes('abra'),false);
 assert.deepEqual(KANTO_ENCOUNTER_GROUPS.ceruleanAbra,['abra']);
});
test('Viridian gym is locked Ground and Pewter is Brock Rock',()=>{
 const gym=id=>KANTO_VISUAL_MAPS[id].hotspots.find(h=>h.id==='gym');
 assert.equal(gym('viridian').label,'Ginásio de Terra');
 assert.equal(gym('viridian').required,'sevenBadges');
 assert.equal(gym('viridian').gymType,'ground');
 assert.equal(gym('pewter').label,'Ginásio de Pedra');
 assert.equal(gym('pewter').gymType,'rock');
 for(const id of ['viridian','pewter','cerulean']){
  const map=KANTO_VISUAL_MAPS[id];
  assert.equal(map.hotspots.find(s=>s.id==='center').label,'PC');
  assert.equal(map.hotspots.find(s=>s.id==='mart').label,'Loja');
 }
});
test('labels and hotspots are live Phaser objects, not pixels baked into art',()=>{
 const calls=[],created=[];
 const node=(kind)=>{
  const v={active:true,on:(event,fn)=>{if(event==='pointerdown')v.press=fn;return v;},
   setDepth:()=>v,setInteractive:()=>v,setOrigin:()=>v,setData:(k,x)=>{v[k]=x;return v;},
   destroy:()=>{v.active=false;}};
  created.push({kind,node:v});return v;
 };
 const scene={add:{text:(x,y,label)=>{calls.push(label);return node('text');},
  zone:()=>node('zone')}};
 const actions=[];
 const h=drawKantoMapLabels(scene,'viridian',{
  onAction:(action,spot)=>actions.push({action,id:spot.id}),
  canAccess:()=>false
 });
 assert.ok(calls.includes('VIRIDIAN CITY'));
 for(const name of ['PC','Loja','Ginásio de Terra'])assert.ok(calls.includes(name));
 const gym=created.find(t=>t.node['torre2-map-hotspot']==='gym').node;
 gym.press(null,null,null,{stopPropagation:()=>{}});
 assert.deepEqual(actions,[{action:'locked',id:'gym'}]);
 h.destroy();assert.ok(created.every(x=>x.node.active===false));
});
test('no map definition can accidentally mutate the actual campaign',()=>{
 const fs=KANTO_VISUAL_MAPS;
 for(const map of Object.values(fs))
  assert.notEqual(map.artStatus,'integrated');
 assert.throws(()=>normalizedMapRect({cx:2,cy:.5,w:.2,h:.2}),/Invalid/);
});
