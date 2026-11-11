/**
 * Kanto static-map interaction standard — art review branch only.
 * New scene artwork remains an independent approved image; this module paints
 * labels and implements invisible hit areas, NOT scenery, combat or saves.
 * Game integration is deliberately deferred until each map is approved.
 */
const box=(cx,cy,w,h)=>Object.freeze({cx,cy,w,h});
const hotspot=(id,kind,rect,options={})=>Object.freeze({
 id,kind,rect,...options
});
export const KANTO_MAP_PRESENTATION=Object.freeze({
 internalWidth:640, internalHeight:360, aspectRatio:'16:9',
 titleAnchor:Object.freeze({x:20,y:16}), titleColor:'#f7eed2',
 labelStyle:'Pixelify Sans,monospace', interactiveLayers:true,
 backgroundsAreImmutable:true, menuIsRealUI:true,
 noAnimatedCharacterMovement:true, gameIntegrationRequiresArtApproval:true
});
export const KANTO_VISUAL_MAPS=Object.freeze({
 pallet:Object.freeze({
  id:'pallet',title:'PALLET TOWN',class:'city',
  referenceArt:'approved-concept-pallet',artStatus:'approved-concept-only',
  hotspots:Object.freeze([
   hotspot('home','building',box(.315,.310,.17,.16),{label:'Sua casa',sign:box(.315,.213,.17,.045),handler:'home'}),
   hotspot('rivalHouse','building',box(.67,.310,.17,.16),{label:'Casa do rival',sign:box(.67,.213,.19,.045),handler:'rivalHouse'}),
   hotspot('oakLab','building',box(.50,.653,.26,.20),{label:'Laboratório',sign:box(.50,.522,.19,.045),handler:'oakLab'}),
   hotspot('to-route1','exit',box(.50,.03,.095,.06),{target:'route1'}),
   hotspot('to-route21','exit',box(.50,.96,.095,.07),{target:'route21',required:'surf'})
  ])
 }),
 route1:Object.freeze({
  id:'route1',title:'ROTA 1',class:'route',
  referenceArt:'approved-concept-route1',artStatus:'approved-concept-only',
  wildPool:'preMistyWithoutAbra',
  hotspots:Object.freeze([
   hotspot('tallgrass-west','grass',box(.268,.405,.25,.20),{handler:'wildEncounter'}),
   hotspot('tallgrass-east','grass',box(.69,.637,.25,.24),{handler:'wildEncounter'}),
   hotspot('tallgrass-north','grass',box(.592,.190,.17,.12),{handler:'wildEncounter'}),
   hotspot('to-viridian','exit',box(.51,.025,.12,.05),{target:'viridian'}),
   hotspot('to-pallet','exit',box(.50,.975,.12,.05),{target:'pallet'})
  ])
 }),
 viridian:Object.freeze({
  id:'viridian',title:'VIRIDIAN CITY',class:'city',
  referenceArt:'review-concept-viridian-labeled',artStatus:'concept-pending-approval',
  hotspots:Object.freeze([
   hotspot('center','building',box(.493,.716,.16,.18),{label:'PC',sign:box(.493,.583,.13,.055),handler:'center'}),
   hotspot('mart','building',box(.735,.691,.14,.18),{label:'Loja',sign:box(.735,.566,.12,.055),handler:'mart'}),
   hotspot('gym','building',box(.835,.230,.18,.20),{label:'Ginásio de Terra',sign:box(.835,.085,.20,.055),handler:'gym',required:'sevenBadges',gymType:'ground'}),
   hotspot('to-route2','exit',box(.50,.03,.10,.06),{target:'route2'}),
   hotspot('to-route1','exit',box(.50,.97,.12,.06),{target:'route1'})
  ])
 }),
 route2:Object.freeze({
  id:'route2',title:'ROTA 2',class:'route',
  referenceArt:'pending',artStatus:'pending-design',
  wildPool:'preMistyWithoutAbra',
  hotspots:Object.freeze([
   hotspot('tallgrass-west','grass',box(.23,.47,.21,.27),{handler:'wildEncounter'}),
   hotspot('tallgrass-east','grass',box(.74,.38,.15,.22),{handler:'wildEncounter'}),
   hotspot('to-forest','exit',box(.36,.05,.16,.08),{target:'viridianForest'}),
   hotspot('to-viridian','exit',box(.50,.96,.13,.07),{target:'viridian'}),
   hotspot('cut-shortcut','exit',box(.87,.15,.08,.09),{target:'route2East',required:'cut'})
  ])
 }),
 viridianForest:Object.freeze({
  id:'viridianForest',title:'VIRIDIAN FOREST',class:'forest',
  referenceArt:'pending',artStatus:'pending-design',
  wildPool:'preMistyWithoutAbra',
  hotspots:Object.freeze([
   hotspot('forest-grass-west','grass',box(.23,.50,.19,.23),{handler:'wildEncounter'}),
   hotspot('forest-grass-east','grass',box(.77,.48,.17,.27),{handler:'wildEncounter'}),
   hotspot('to-route2-south','exit',box(.51,.96,.12,.07),{target:'route2'}),
   hotspot('to-route2-north','exit',box(.50,.045,.12,.07),{target:'route2North'})
  ])
 }),
 pewter:Object.freeze({
  id:'pewter',title:'PEWTER CITY',class:'city',
  referenceArt:'pending',artStatus:'pending-design',
  hotspots:Object.freeze([
   hotspot('center','building',box(.26,.50,.18,.19),{label:'PC',sign:box(.26,.375,.12,.05),handler:'center'}),
   hotspot('mart','building',box(.55,.64,.16,.17),{label:'Loja',sign:box(.55,.515,.12,.05),handler:'mart'}),
   hotspot('gym','building',box(.82,.38,.21,.21),{label:'Ginásio de Pedra',sign:box(.82,.25,.24,.055),handler:'gym',gymType:'rock'}),
   hotspot('to-route2-north','exit',box(.50,.96,.12,.06),{target:'route2North'}),
   hotspot('to-route3','exit',box(.96,.5,.07,.12),{target:'route3',required:'boulderBadge'})
  ])
 }),
 cerulean:Object.freeze({
  id:'cerulean',title:'CERULEAN CITY',class:'city',
  referenceArt:'approved-composition-cerulean',artStatus:'approved-concept-only',
  wildPool:'ceruleanAbra',
  hotspots:Object.freeze([
   hotspot('center','building',box(.19,.40,.15,.20),{label:'PC',sign:box(.19,.27,.10,.055),handler:'center'}),
   hotspot('mart','building',box(.18,.74,.15,.17),{label:'Loja',sign:box(.18,.625,.10,.055),handler:'mart'}),
   hotspot('gym','building',box(.80,.34,.18,.20),{label:'Ginásio de Água',sign:box(.80,.20,.22,.055),handler:'gym',gymType:'water'}),
   hotspot('local-grass','grass',box(.41,.68,.12,.13),{handler:'wildEncounter'}),
   hotspot('to-route4','exit',box(.03,.51,.06,.14),{target:'route4'})
  ])
 })
});
export const KANTO_ENCOUNTER_GROUPS=Object.freeze({
 preMistyWithoutAbra:Object.freeze([
  'pidgey','rattata','spearow','mankey','nidoran-f','nidoran-m',
  'caterpie','weedle','pikachu','metapod','kakuna','zubat',
  'geodude','paras','sandshrew','ekans','jigglypuff','clefairy'
 ]),
 ceruleanAbra:Object.freeze(['abra'])
});
function isNormalizedBox(r){
 return r&&[r.cx,r.cy,r.w,r.h].every(v=>Number.isFinite(v))&&
 r.w>0&&r.h>0&&r.cx-r.w/2>=0&&r.cx+r.w/2<=1&&
 r.cy-r.h/2>=0&&r.cy+r.h/2<=1;
}
export function validateKantoVisualMaps(maps=KANTO_VISUAL_MAPS){
 const errors=[];
 for(const [id,map] of Object.entries(maps)){
  if(id!==map.id)errors.push(id+':mismatched-id');
  if(!map.title||map.title!==map.title.toUpperCase())errors.push(id+':title');
  if(!Array.isArray(map.hotspots))errors.push(id+':hotspots-missing');
  const seen=new Set();
  for(const spot of map.hotspots||[]){
   if(seen.has(spot.id))errors.push(id+':duplicate:'+spot.id);
   seen.add(spot.id);
   if(!isNormalizedBox(spot.rect))errors.push(id+':invalid-rect:'+spot.id);
   if(spot.sign&&!isNormalizedBox(spot.sign))errors.push(id+':invalid-sign:'+spot.id);
   if(spot.kind==='building'&&(!spot.label||!spot.sign))errors.push(id+':missing-label:'+spot.id);
   if(spot.kind==='grass'&&spot.handler!=='wildEncounter')errors.push(id+':unmapped-grass:'+spot.id);
   if(spot.kind==='exit'&&!spot.target)errors.push(id+':missing-exit:'+spot.id);
  }
  if(map.wildPool&&!KANTO_ENCOUNTER_GROUPS[map.wildPool])errors.push(id+':unknown-encounters');
 }
 if(KANTO_ENCOUNTER_GROUPS.preMistyWithoutAbra.includes('abra'))errors.push('abra-must-unlock-at-cerulean');
 if(!KANTO_ENCOUNTER_GROUPS.ceruleanAbra.includes('abra'))errors.push('abra-missing-from-cerulean');
 return {pass:errors.length===0,errors,mapCount:Object.keys(maps).length};
}
export function normalizedMapRect(rect,viewportWidth=640,viewportHeight=360){
 if(!isNormalizedBox(rect))throw Error('Invalid normalized Kanto hotspot');
 if(!Number.isFinite(viewportWidth)||!Number.isFinite(viewportHeight)||viewportWidth<=0||viewportHeight<=0)
  throw Error('Invalid Kanto viewport');
 return {x:rect.cx*viewportWidth,y:rect.cy*viewportHeight,
  width:rect.w*viewportWidth,height:rect.h*viewportHeight};
}
export function drawKantoMapLabels(scene,mapId,{onAction,canAccess=()=>true}={}){
 const map=KANTO_VISUAL_MAPS[mapId];
 if(!map)throw Error('Unknown Kanto map: '+mapId);
 if(typeof onAction!=='function')throw Error('Kanto onAction handler required');
 const w=640,h=360,created=[];
 const makeText=(x,y,label,size=10)=>scene.add.text(x,y,label,{
  fontFamily:KANTO_MAP_PRESENTATION.labelStyle,fontSize:size+'px',
  color:'#fff6df',stroke:'#0b2335',strokeThickness:3}).setOrigin(.5).setDepth(210);
 const name=makeText(106,16,map.title,15);created.push(name);
 for(const spot of map.hotspots){
  if(spot.label&&spot.sign){
   const r=normalizedMapRect(spot.sign,w,h);
   const label=makeText(r.x,r.y,spot.label,10);
   label.setData('torre2-map-label',spot.id);
   created.push(label);
  }
  const rect=normalizedMapRect(spot.rect,w,h);
  const z=scene.add.zone(rect.x,rect.y,rect.width,rect.height)
   .setDepth(205).setInteractive({useHandCursor:true});
  z.setData('torre2-map-hotspot',spot.id);
  z.on('pointerdown',(_pointer,_lx,_ly,event)=>{
   event?.stopPropagation?.();
   if(spot.required&&!canAccess(spot.required,spot,map))return onAction('locked',spot,map);
   return onAction(spot.handler||spot.kind,spot,map);
  });
  created.push(z);
 }
 return {mapId,hotspots:map.hotspots.length,objects:created,
  destroy:()=>{for(const child of created)if(child.active)child.destroy();}};
}
