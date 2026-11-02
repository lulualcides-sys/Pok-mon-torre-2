/* Kanto painted hub V1. One approved illustration per town and real,
 * responsive Phaser input zones; no tree/road/stone drawing loops.
 * This module is VISUAL ONLY: no campaign mutation, battles or save writes.
 * The manifest is extensible to Pewter, Vermilion and subsequent towns.
 */
export const PAINTED_HUB_VERSION='kanto-painted-hub-v1';
export const PAINTED_HUB_MAPS=Object.freeze({
 1:Object.freeze({
  id:'cerulean',name:'CERULEAN CITY',
  textureKey:'torre2-painted-cerulean-v1',
  assetPath:'assets/ui/kanto-painted/cerulean-v1.webp',
  width:640,height:360,
  // Coordinates are documented in virtual 640x360 game units; image aspect 16:9.
  landmarks:Object.freeze([
   Object.freeze({id:'center',label:'CENTRO POKÉMON',x:116,y:116,width:116,height:116}),
   Object.freeze({id:'mart',label:'POKÉ MART',x:100,y:218,width:104,height:99}),
   Object.freeze({id:'gym',label:'GINÁSIO DA MISTY',x:510,y:105,width:122,height:120})
  ]),
  actions:Object.freeze([
   Object.freeze({id:'EQUIPE',x:348,y:332,width:57,height:32}),
   Object.freeze({id:'BOLSA',x:406,y:332,width:56,height:32}),
   Object.freeze({id:'POKÉDEX',x:466,y:332,width:58,height:32}),
   Object.freeze({id:'ROTAS',x:526,y:332,width:57,height:32}),
   Object.freeze({id:'CAPTURA',x:588,y:332,width:59,height:32}),
   Object.freeze({id:'INSÍGNIAS',x:518,y:24,width:206,height:33}),
   Object.freeze({id:'MENU',x:304,y:26,width:26,height:28}),
   Object.freeze({id:'PC',x:170,y:164,width:23,height:24})
  ])
 })
});
export function paintedMapSpec(stage){return PAINTED_HUB_MAPS[stage]||null;}
export function verifyPaintedMapSpec(spec){
 if(!spec||!Number.isInteger(spec.width)||spec.width!==640||spec.height!==360)return false;
 const ids=new Set(),all=[...spec.landmarks,...spec.actions];
 for(const area of all){
  if(ids.has(area.id)||!Number.isFinite(area.x)||!Number.isFinite(area.y)||
   !Number.isFinite(area.width)||!Number.isFinite(area.height)||area.width<20||area.height<20||
   area.x-area.width/2<0||area.x+area.width/2>640||
   area.y-area.height/2<0||area.y+area.height/2>360)return false;
  ids.add(area.id);
 }
 return spec.landmarks.map(x=>x.id).join(',')==='center,mart,gym';
}
function text(scene,x,y,word,size=9,originX=0){
 return scene.add.text(x,y,String(word),{fontFamily:'Pixelify Sans,monospace',
  fontSize:size+'px',fontStyle:'bold',color:'#ecf4e3',
  stroke:'#16334e',strokeThickness:2}).setOrigin(originX,.5).setDepth(111);
}
function panel(scene,x,y,w,h){
 const g=scene.add.graphics().setDepth(103);
 g.fillStyle(0x0b2437,.98).fillRect(x,y,w,h);
 g.lineStyle(1,0x6f99a7).strokeRect(x+.5,y+.5,w-1,h-1);
 return g;
}
function hotspot(scene,area,handler,keyType){
 const [x,y,w,h]=[area.x,area.y,area.width,area.height];
 const highlight=scene.add.graphics().setDepth(95);
 const zone=scene.add.zone(x,y,w,h).setDepth(120).setInteractive({useHandCursor:true})
  .setData(keyType,area.id)
  .setData('torre2-painted-hotspot',area.id);
 zone.on('pointerover',()=>{
  highlight.clear().lineStyle(2,0xe1e6bf,.9)
   .strokeRoundedRect(x-w/2+2,y-h/2+2,w-4,h-4,5);
 }).on('pointerout',()=>highlight.clear());
 zone.on('pointerdown',(_p,_lx,_ly,event)=>{
  event?.stopPropagation?.();
  if(typeof handler==='function')handler();
 });
 return zone;
}
function makeTeamCard(scene,state,i,m,handler){
 const left=11+i*103,top=317,w=99;
 panel(scene,left,top,w,32);
 if(!m)return;
 // Live text/HP replaces the fixed example portraits and levels baked into
 // the approved illustration; never display stale save data as current state.
 const id=String(m.id||'?').toUpperCase();
 text(scene,left+5,top+11,id.slice(0,13),8);
 text(scene,left+5,top+23,'Nv. '+(m.progression?.level||5),8);
 const hp=Math.max(0,Math.min(100,Number(m.hp)||0));
 const g=scene.add.graphics().setDepth(112);
 g.fillStyle(0x223746).fillRect(left+60,top+22,31,4);
 g.fillStyle(hp>50?0x68c995:hp>25?0xf2c56e:0xdf7373).fillRect(left+60,top+22,31*hp/100,4);
 hotspot(scene,{id:'MEMBER-'+i,x:left+49,y:top+16,width:97,height:30},
  ()=>handler(i),'torre2-painted-member');
}
export function renderPaintedCityHub(scene,state,{trainerCount=0,badgeDefinitions=[],...handlers}={}){
 const spec=paintedMapSpec(state?.stage);
 if(!spec||!verifyPaintedMapSpec(spec)||!scene.textures.exists(spec.textureKey))return null;
 const image=scene.add.image(320,180,spec.textureKey).setDisplaySize(640,360)
  .setDepth(0).setData('torre2-city-layer','terrain')
  .setData('torre2-painted-map',spec.id);
 // Repaint only the DYNAMIC value of the first info banner, not the city art.
 const complete=Math.max(0,Math.min(trainerCount,Math.floor(Number(state.trainer)||0)));
 const live=scene.add.graphics().setDepth(105);
 live.fillStyle(0x17374b,.98).fillRect(18,29,284,9);
 text(scene,19,34,'TREINADORES '+complete+'/'+trainerCount+
  ' · '+(complete===trainerCount?'GINÁSIO LIBERADO':'PRÓXIMO: '+(complete+1)),7);
 const navigation={EQUIPE:()=>handlers.pokemon?.(state.active||0),
  BOLSA:handlers.bag,'POKÉDEX':handlers.dex,ROTAS:handlers.route,
  CAPTURA:handlers.capture,'INSÍGNIAS':handlers.badges,
  MENU:handlers.menu||handlers.route,PC:handlers.center};
 for(const l of spec.landmarks)hotspot(scene,l,handlers[l.id],'torre2-city-landmark');
 for(const action of spec.actions)hotspot(scene,action,navigation[action.id],'torre2-city-action');
 // This native party layer is deliberately live and does not modify saves.
 const members=(state.team||[]).slice(0,6),page=scene.__torre2CityTeamPage===1?3:0;
 for(let i=0;i<3;i++)makeTeamCard(scene,state,i,members[i+page],index=>handlers.pokemon?.(index+page));
 if(members.length>3){
  panel(scene,300,309,17,13);
  text(scene,308,316,page?'◀':'▶',9,.5);
  hotspot(scene,{id:'MAIS EQUIPE',x:309,y:315,width:22,height:22},()=>{
   scene.__torre2CityTeamPage=page?0:1;handlers.refresh?.();
  },'torre2-city-action');
 }
 // Actual earned badges and interactions are sourced from campaign state,
 // rather than using static icons from the image.
 const earned=state.badges||[];
 const badgeLine=badgeDefinitions.slice(0,8).map(g=>earned.includes(g.badge)?'●':'○').join(' ');
 panel(scene,445,13,172,16);text(scene,450,21,badgeLine,12);
 const meta={version:PAINTED_HUB_VERSION,stage:state.stage,trainer:state.trainer,
  landmarks:spec.landmarks.length,hotspots:spec.landmarks.map(p=>({...p})),
  trainerCount,walking:false,staticBackground:true,
  mapAsset:spec.assetPath,image:image.texture.key};
 scene.__torre2CityHub=meta;
 return meta;
}
