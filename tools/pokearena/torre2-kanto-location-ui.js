/* T93 — compact read-only location button for the clickable Kanto campaign.
 * This is NOT a movement controller or a GPS coordinate. It names the
 * current approved painting and the real trainer checkpoint from the save.
 * Only a trainer with a verified painted-map sprite receives a pin.
 */
import {approvedMap} from './torre2-approved-maps-atlas.js';
import {OPENING_NPC_PLANS} from './torre2-opening-npc-overlays.js';

const bounded=(n,a,b)=>Math.max(a,Math.min(b,n));
export function kantoLocationInfo(mapId,state={},stageNames=[],trainersPerGym=()=>0){
 const map=approvedMap(mapId);
 const stage=Number.isInteger(state?.stage)?state.stage:0;
 const trainer=Number.isInteger(state?.trainer)?state.trainer:0;
 const stageName=stageNames[stage]||'Campanha de Kanto';
 const max=Math.max(0,Number(trainersPerGym(stage))||0);
 const next=stage>=stageNames.length&&stageNames.length?'CAMPANHA CONCLUÍDA':
  trainer>=max?'LÍDER / DESAFIO FINAL':`TREINADOR ${trainer+1}/${max}`;
 const seen=map?.name||String(mapId||'Mapa indisponível');
 const actor=mapId==='viridian-forest'&&stage===0?
  OPENING_NPC_PLANS['viridian-forest']?.find(n=>n.index===trainer):null;
 return Object.freeze({
  mapId,place:seen,stageName,stage,stageCount:stageNames.length,
  trainer:bounded(trainer,0,max),checkpoint:next,
  // A pin is available ONLY when an actual on-map NPC is indexed.
  marker:actor?Object.freeze({x:actor.cx,y:actor.feetY,id:actor.id}):null
 });
}
export function showKantoLocation(scene,view,state,stageNames,trainersPerGym){
 const info=kantoLocationInfo(view.id,state,stageNames,trainersPerGym);
 const objects=[];
 const add=o=>{objects.push(o);return o};
 const text=(x,y,label,size=11,color='#f5f3e1',depth=124,origin=.5)=>{
  return add(scene.add.text(x,y,String(label),{
   fontFamily:'Pixelify Sans,monospace',fontSize:size+'px',fontStyle:'bold',
   color,stroke:'#071a2a',strokeThickness:3,align:'center'
  }).setOrigin(origin).setDepth(depth));
 };
 const close=()=>objects.forEach(o=>{if(o?.active)o.destroy()});
 add(scene.add.rectangle(320,180,640,360,0x040e1a,.89)
  .setDepth(119).setInteractive().setData('torre2-location-shade',true)
  .on('pointerdown',(_p,_x,_y,event)=>{event?.stopPropagation?.();close()}));
 add(scene.add.rectangle(320,179,558,316,0x102b43,.98)
  .setStrokeStyle(2,0xf2d681).setDepth(120));
 text(310,40,'LOCALIZAÇÃO · '+info.place.toUpperCase(),14,'#ffdf8a');
 text(320,61,info.stageName.toUpperCase()+'   ·   '+info.checkpoint,10,'#d6ebf5');
 const texture=view?.image?.texture?.key;
 if(texture&&scene.textures.exists(texture)){
  add(scene.add.rectangle(320,187,472,228,0x061521,1)
   .setStrokeStyle(1,0x8299ab).setDepth(121));
  add(scene.add.image(320,187,texture).setDisplaySize(468,224).setDepth(122));
  if(info.marker){
   const x=86+info.marker.x*468,y=75+info.marker.y*224;
   add(scene.add.circle(x,y-13,8,0xffca58,.92)
    .setStrokeStyle(2,0x23131b).setDepth(123)
    .setData('torre2-location-verified-marker',info.marker.id));
   text(bounded(x,148,492),bounded(y-31,95,276),'BATALHA ATUAL',9,'#fff2b8',124);
  }
 }
 text(320,317,'Mapa da campanha · consulta, sem deslocamento',9,'#b2d4e6');
 add(scene.add.rectangle(550,39,57,26,0x17435c,.96)
  .setStrokeStyle(1,0x9cb8c4).setDepth(126));
 text(550,39,'FECHAR',9,'#fff2dc',127);
 add(scene.add.zone(550,39,60,29).setDepth(128)
  .setInteractive({useHandCursor:true})
  .setData('torre2-location-close',true)
  .on('pointerdown',(_p,_x,_y,event)=>{event?.stopPropagation?.();close()}));
 return {info,close,objects};
}

/** Compact menu chip: one hit zone, works on every approved Kanto map.
 * No new navigation and no changes to the original battle scene.
 */
export function installKantoLocationChip(scene,view,state,stageNames,trainersPerGym){
 const bg=scene.add.rectangle(316,339,38,27,0x082034,.94)
  .setStrokeStyle(1,0xffdd83,.95).setDepth(81);
 const glyph=scene.add.text(316,339,'⌖',{
  fontFamily:'Pixelify Sans,monospace',fontSize:'18px',fontStyle:'bold',
  color:'#ffdf85',stroke:'#061320',strokeThickness:2
 }).setOrigin(.5).setDepth(82);
 const hit=scene.add.zone(316,339,40,31).setDepth(85)
  .setInteractive({useHandCursor:true})
  .setData('torre2-overworld-action','location')
  .on('pointerdown',(_p,_x,_y,event)=>{
   event?.stopPropagation?.();
   showKantoLocation(scene,view,state,stageNames,trainersPerGym);
  });
 return {bg,glyph,hit};
}
