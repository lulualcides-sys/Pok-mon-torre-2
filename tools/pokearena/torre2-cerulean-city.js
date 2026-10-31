/* T32: first real Cerulean campaign city. Native Phaser, no battle HUD changes.
 * Uses the already-cached FireRed city sheet; no generated mockup pasted in. */
import {getSourceMainBounds} from './frlg-location.js';
import {buildingInteractions} from './kanto-hotspots.js';
const FONT='Pixelify Sans,monospace';
const VIEW=Object.freeze({x:18,y:43,w:604,h:246});
function title(scene,x,y,message,size=9,color='#e7faff',depth=22){
 return scene.add.text(x,y,String(message),{fontFamily:FONT,fontStyle:'bold',
  fontSize:size+'px',color,stroke:'#08182b',strokeThickness:2})
  .setDepth(depth).setOrigin(0,.5);
}
function box(g,x,y,w,h,color,border){
 g.fillStyle(color,1);g.fillRoundedRect(x,y,w,h,4);
 g.lineStyle(1,border,1);g.strokeRoundedRect(x+.5,y+.5,w-1,h-1,4);
}
export function ceruleanCityProjection(main){
 const w=Math.min(VIEW.w,Math.max(1,main.w));
 const h=Math.min(VIEW.h,Math.max(1,main.h));
 return {x:main.x+Math.round(Math.max(0,main.w-w)*.48),
  y:main.y+Math.round(Math.max(0,main.h-h)*.56),w,h};
}
function originalCityArt(scene){
 const key='frlg-location-cerulean';
 if(!scene.textures.exists(key))return null;
 const texture=scene.textures.get(key),src=texture.source?.[0];
 if(!src)return null;
 const main=getSourceMainBounds('cerulean',src.width,src.height);
 if(main.w<250||main.h<240)return null;
 const crop=ceruleanCityProjection(main);
 const name='torre2-t32-cerulean-'+[crop.x,crop.y,crop.w,crop.h].join('-');
 if(!texture.has(name))texture.add(name,0,crop.x,crop.y,crop.w,crop.h);
 if(typeof Phaser!=='undefined')texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
 scene.add.image(VIEW.x,VIEW.y,key,name).setOrigin(0,0).setDepth(4)
  .setDisplaySize(VIEW.w,VIEW.h).setData('torre2-city-real-art',true);
 return {main,crop,key,name};
}
function action(scene,x,y,w,label,fn,highlight=false){
 const g=scene.add.graphics().setDepth(31);
 const paint=hover=>{
  g.clear();box(g,x-w/2,y-15,w,30,highlight?
   (hover?0xffe7a0:0xe9c272):(hover?0x2e719b:0x173e62),
   highlight?0xfff4bb:0x74bddd);
 };
 title(scene,x,y,label,8,highlight?'#1b2931':'#eafbff',32).setOrigin(.5);
 const z=scene.add.zone(x,y,w,32).setInteractive({useHandCursor:true})
  .setDepth(33).setData('torre2-city-action',label);
 z.on('pointerover',()=>paint(true)).on('pointerout',()=>paint(false));
 z.on('pointerdown',(_p,_lx,_ly,e)=>{e?.stopPropagation?.();fn?.()});
 paint(false);return z;
}
function cityHotspot(scene,sceneView,hotspot,label,fn,locked=false){
 const {main,crop}=sceneView;
 const mx=main.x+main.w*hotspot.cx,my=main.y+main.h*hotspot.cy;
 const x=VIEW.x+(mx-crop.x)*VIEW.w/crop.w;
 const y=VIEW.y+(my-crop.y)*VIEW.h/crop.h;
 if(x<VIEW.x+30||x>VIEW.x+VIEW.w-30||
    y<VIEW.y+34||y>VIEW.y+VIEW.h-8)return null;
 const g=scene.add.graphics().setDepth(27);
 const paint=hover=>{
  g.clear();box(g,x-35,y-34,70,17,0x092a42,
   hover?0xffffff:locked?0x8499b2:0xffdd97);
 };
 title(scene,x,y-25,label,8,locked?'#b5c3d0':'#fff0bc',28).setOrigin(.5);
 const z=scene.add.zone(x,y,50,31).setInteractive({useHandCursor:true})
  .setDepth(29).setData('torre2-city-landmark',label);
 z.on('pointerover',()=>paint(true)).on('pointerout',()=>paint(false));
 z.on('pointerdown',(_p,_lx,_ly,e)=>{e?.stopPropagation?.();fn?.()});
 paint(false);
 return {id:hotspot.id,x:Math.round(x),y:Math.round(y)};
}
function teamCard(scene,g,m,i){
 const x=14+i*99,y=313;
 box(g,x,y,94,37,0x15384c,i===0?0xf2d68f:0x477c9f);
 if(!m)return;
 let dex=null;
 try{
  const v=scene.__torre2PathData?.buscar?.(m.id);
  const d=v?.etapa>0?v?.def?.evoluciones?.[v.etapa-1]?.dex:v?.def?.dex;
  if(d!==undefined&&d!==null)dex=String(d).padStart(4,'0');
 }catch{}
 const key='torre2-portrait-'+dex;
 if(dex&&scene.textures.exists(key))
  scene.add.image(x+16,y+19,key).setDisplaySize(29,29).setDepth(22);
 else title(scene,x+9,y+18,'◉',15,'#ffe7a0');
 title(scene,x+35,y+10,m.id.toUpperCase().slice(0,8),7,'#fff7e9');
 title(scene,x+35,y+23,'NV.'+(m.progression?.level||5),7,'#b2dcf4');
 const hp=Math.min(100,Math.max(0,Number(m.hp)||0));
 g.fillStyle(0x071728);g.fillRect(x+35,y+31,53,3);
 g.fillStyle(hp>50?0x65dda0:hp>25?0xf0c96a:0xe87776);
 g.fillRect(x+35,y+31,Math.round(hp*53/100),3);
}
export function renderCeruleanCity(scene,state,handlers={}){
 const panel=scene.add.graphics().setDepth(1)
  .setData('torre2-cerulean-prototype',true);
 panel.fillStyle(0x081c31);panel.fillRect(0,0,640,360);
 box(panel,11,39,618,254,0x0e3c57,0x79c8ed);
 const art=originalCityArt(scene);
 if(!art){
  title(scene,66,170,'MAPA ORIGINAL INDISPONÍVEL',14,'#ffcebd');
 }
 panel.fillStyle(0x0d2844);panel.fillRect(0,0,640,39);
 panel.fillStyle(0x76c8e9);panel.fillRect(0,37,640,2);
 title(scene,18,13,'CERULEAN CITY',17,'#f1fcff');
 title(scene,19,30,'CIDADE DAS ÁGUAS · KANTO',8,'#9cddfa');
 const done=Math.min(15,Math.max(0,state.trainer||0));
 title(scene,293,13,'TREINADORES',8,'#b2e0f2');
 title(scene,304,29,done+' / 15',14,'#ffe1a0');
 action(scene,530,20,185,done>=15?'DESAFIAR MISTY':'PRÓXIMO DESAFIO',
  ()=>done>=15?handlers.gym?.():handlers.battle?.(),true);
 const links={center:handlers.center,mart:handlers.mart,
  gym:handlers.gym,bike:handlers.info};
 const captions={center:'CENTRO',mart:'LOJA',
  gym:'GINÁSIO',bike:'BICICLETAS'};
 const hotspots=[];
 if(art)for(const h of buildingInteractions('cerulean')){
  const point=cityHotspot(scene,art,h,captions[h.id],links[h.id],
   h.id==='gym'&&done<15);
  if(point)hotspots.push(point);
 }
 const trim=scene.add.graphics().setDepth(11);
 trim.fillStyle(0x082c47,.92);trim.fillRect(19,273,603,16);
 title(scene,26,281,'CANAIS DE CERULEAN · OBJETIVO: MISTY',8,'#e5f8ff',23);
 panel.fillStyle(0x081e35);panel.fillRect(0,296,640,64);
 title(scene,14,306,'EQUIPE ATUAL',8,'#bbecf9');
 for(let i=0;i<3;i++)teamCard(scene,panel,state.team[i],i);
 const buttons=[
  ['DESAFIOS',handlers.back],['EQUIPE',()=>handlers.pokemon?.(state.active||0)],
  ['BOLSA',handlers.bag],['CAPTURA',handlers.capture],['CENTRO',handlers.center]
 ];
 buttons.forEach(([label,callback],i)=>action(scene,324+62*i,331,59,label,callback));
 scene.__torre2CeruleanCity={stage:state.stage,trainer:state.trainer,
  realArt:!!art,hotspots,battleHudUnchanged:true};
 return scene.__torre2CeruleanCity;
}
