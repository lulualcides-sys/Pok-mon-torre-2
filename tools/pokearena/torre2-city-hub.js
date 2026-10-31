import {renderCityScenery} from './city-scenery.js';
import {cityViewModel,CERULEAN_LANDMARKS} from './city-layout.js';
import {addFireRedNPC} from './frlg-npc.js';
import {drawTrainer} from './campaign-sprites.js';
import {drawBadgeIcon} from './campaign-art.js';
const FONT='Pixelify Sans,monospace';
const ink=0x0a2034;
function text(scene,x,y,value,size=10,color='#f2f5de',depth=101){
 return scene.add.text(x,y,String(value),{fontFamily:FONT,fontSize:size+'px',fontStyle:'bold',
  color,stroke:'#142d40',strokeThickness:2}).setOrigin(0,.5).setDepth(depth);
}
function panel(g,x,y,w,h,selected=false){
 g.fillStyle(0x031523,.85).fillRect(x+2,y+3,w,h);
 g.fillStyle(selected?0x88d7e4:0x678e9f).fillRect(x,y,w,h);
 g.fillStyle(ink,.97).fillRect(x+1,y+1,w-2,h-2);
 g.fillStyle(selected?0x245e78:0x17374b).fillRect(x+3,y+3,w-6,h-6);
 g.fillStyle(selected?0xa4e8ee:0x426475).fillRect(x+3,y+3,w-6,1);
}
function button(scene,x,y,w,h,label,fn,{key=label,selected=false}={}){
 const g=scene.add.graphics().setDepth(100),caption=text(scene,x,y,label,9).setOrigin(.5);
 const paint=hover=>{g.clear();panel(g,x-w/2,y-h/2,w,h,hover||selected)};
 const z=scene.add.zone(x,y,w,h).setDepth(103).setInteractive({useHandCursor:true})
  .setData('torre2-city-action',key);
 z.on('pointerover',()=>paint(true)).on('pointerout',()=>paint(false));
 z.on('pointerdown',(_p,_x,_y,e)=>{e?.stopPropagation?.();fn()});
 paint(false);return z;
}
function landmark(scene,p,fn){
 // Door itself and its readable plaque share ONE hit area; no misplaced overlay.
 const g=scene.add.graphics().setDepth(60);
 panel(g,p.x-39,p.y+2,78,13);
 text(scene,p.x,p.y+8,p.label,8,'#fff0ba',61).setOrigin(.5);
 const top=p.doorY-12,bottom=p.y+15;
 const z=scene.add.zone(p.x,(top+bottom)/2,82,bottom-top).setDepth(70).setInteractive({useHandCursor:true})
  .setData('torre2-city-landmark',p.id);
 z.on('pointerdown',(_p,_x,_y,e)=>{e?.stopPropagation?.();fn()});
 z.on('pointerover',()=>g.setAlpha(.78)).on('pointerout',()=>g.setAlpha(1));
}
function memberCard(scene,g,state,m,i,x,y,w,handler){
 panel(g,x,y,w,31,i===state.active);
 let dex;try{const v=scene.__torre2PathData.buscar(m.id);dex=String((v.etapa>0?v.def.evoluciones?.[v.etapa-1]?.dex:v.def.dex)||'').padStart(4,'0')}catch{}
 const key='torre2-portrait-'+dex;
 if(dex&&scene.textures.exists(key))scene.add.image(x+16,y+15,key).setDisplaySize(26,26).setDepth(101);
 text(scene,x+33,y+9,m.id.toUpperCase().slice(0,10),8);
 text(scene,x+33,y+20,'Nv. '+(m.progression?.level||5),8,'#b6dfdf');
 const hp=Math.max(0,Math.min(100,Number(m.hp)||0));
 g.fillStyle(0x091d2a).fillRect(x+61,y+21,w-67,3);
 g.fillStyle(hp>50?0x72d6a0:hp>25?0xf4cb7b:0xe78583).fillRect(x+61,y+21,(w-67)*hp/100,3);
 scene.add.zone(x+w/2,y+15,w,31).setDepth(104).setInteractive({useHandCursor:true})
  .setData('torre2-city-member',i).on('pointerdown',()=>handler(i));
}
export function renderCityHub(scene,state,{trainerCount,badgeDefinitions=[],...handlers}){
 const model=cityViewModel(state,trainerCount),art=renderCityScenery(scene);
 const frame=scene.add.graphics().setDepth(99);
 panel(frame,6,5,318,36);panel(frame,405,5,229,36);
 text(scene,17,18,'CERULEAN CITY',18);
 text(scene,18,33,'TREINADORES '+model.done+'/'+model.count+'  ·  '+
  (model.gymReady?'OBJETIVO: MISTY':'PRÓXIMO: TREINADOR '+(model.done+1)),8,'#c6e4df');
 badgeDefinitions.slice(0,8).forEach((b,i)=>{
  const earned=(state.badges||[]).includes(b.badge);
  drawBadgeIcon(scene,i,418+i*23,22,earned,1).setDepth(101);
 });
 // Native badge-case action overlays only the compact badge strip.
 scene.add.zone(516,22,218,34).setDepth(105).setInteractive({useHandCursor:true})
  .setData('torre2-city-action','INSÍGNIAS').on('pointerdown',handlers.badges);
 for(const p of CERULEAN_LANDMARKS)landmark(scene,p,handlers[p.id]);
 for(const t of model.trainers){
  const types=['lass','youngster','ace','hiker','bugcatcher'];
  const kind=types[t.index%types.length];
  const sprite=addFireRedNPC(scene,kind,t.x,t.y,{scale:.7,depth:30+t.y/1000});
  if(!sprite){const g=scene.add.graphics().setDepth(30+t.y/1000);drawTrainer(g,t.x,t.y-12,kind,.7)}
  if(t.status==='current'){
   text(scene,t.x,t.y-27,'!',13,'#ffe39a',65).setOrigin(.5);
   const ring=scene.add.graphics().setDepth(28);ring.lineStyle(1,0xffe1a1).strokeEllipse(t.x,t.y,18,6);
  }
  if(t.status==='defeated')text(scene,t.x+7,t.y-12,'✓',9,'#94e6a2',65);
  const zone=scene.add.zone(t.x,t.y-9,24,28).setDepth(69).setInteractive({useHandCursor:true})
   .setData('torre2-city-trainer',t.index);
  zone.on('pointerdown',()=>handlers.trainer(t.index,t.status));
 }
 addFireRedNPC(scene,'misty',545,190,{scale:.8,depth:31});
 // All six party members remain available; overflow does not disappear.
 panel(frame,6,308,628,46);
 const members=(state.team||[]).slice(0,6),visible=members.length>3?3:members.length;
 const offset=scene.__torre2CityTeamPage===1&&members.length>3?3:0;
 for(let i=0;i<visible;i++)if(members[offset+i])memberCard(scene,frame,state,members[offset+i],offset+i,11+i*103,316,99,handlers.pokemon);
 if(members.length>3)button(scene,308,298,24,18,offset?'◀':'▶',()=>{
  scene.__torre2CityTeamPage=offset?0:1;handlers.refresh();
 },{key:'MAIS EQUIPE'});
 const actions=[['EQUIPE',()=>handlers.pokemon(state.active||0)],['BOLSA',handlers.bag],['POKÉDEX',handlers.dex],['ROTAS',handlers.route],['CAPTURA',handlers.capture]];
 actions.forEach(([label,fn],i)=>button(scene,347+i*62,332,59,32,label,fn));
 const meta={...art,stage:state.stage,trainer:state.trainer,hotspots:CERULEAN_LANDMARKS.map(p=>({...p})),
  trainerCount:model.count,walking:false};
 scene.__torre2CityHub=meta;
 return meta;
}
