/* Pokémon Torre 2 — PATCH 1 + PATCH 2.
 * One persistent illustrated overworld per gym, instead of paginated routes.
 * Genuine user-supplied FireRed map sprites; native Phaser image frames and
 * original 16x32 character sprites. No pasted concept art or Canvas 2D.
 * This file only affects campaign presentation, never battle / moves / saves.
 */
import {getSourceMainBounds} from './frlg-location.js';
import {addFireRedNPC,addRedPlayer} from './frlg-npc.js';
import {trainerClass,drawTrainer} from './campaign-sprites.js';

// Every gym owns exactly one world. Stage 8 is Victory Road; the four Elite
// members and champion use the SAME Indigo world without changing maps.
const WORLDS=Object.freeze([
 {id:'pewter',title:'PEWTER · BROCK',short:'ROTA DE BROCK',theme:0xcdb783,
  leader:'BROCK',biome:'pewter',
  buildings:{gym:[151,113],center:[158,212],mart:[232,179],grass:[344,272]}},
 {id:'cerulean',title:'CERULEAN · MISTY',short:'ROTA DAS ÁGUAS',theme:0x7ecde8,
  leader:'MISTY',biome:'water-gym',
  buildings:{gym:[280,240],center:[169,183],mart:[265,185],grass:[70,264]}},
 {id:'vermilion',title:'VERMILION · LT. SURGE',short:'ROTA ELÉTRICA',theme:0xf0d675,
  leader:'LT. SURGE',biome:'electric-gym',
  buildings:{gym:[145,222],center:[144,104],mart:[258,187],grass:[341,262]}},
 {id:'celadon',title:'CELADON · ERIKA',short:'JARDINS DE CELADON',theme:0x8fdb91,
  leader:'ERIKA',biome:'grass-gym',
  buildings:{gym:[300,247],center:[323,133],mart:[120,125],grass:[60,248]}},
 {id:'fuchsia',title:'FUCHSIA · KOGA',short:'ROTA DO SAFARI',theme:0xb992d7,
  leader:'KOGA',biome:'poison-gym',
  buildings:{gym:[249,121],center:[229,264],mart:[111,157],grass:[334,265]}},
 {id:'saffron',title:'SAFFRON · SABRINA',short:'CIDADE PSÍQUICA',theme:0xd8a2df,
  leader:'SABRINA',biome:'psychic-gym',
  buildings:{gym:[332,108],center:[194,251],mart:[304,266],grass:[66,257]}},
 {id:'cinnabar',title:'CINNABAR · BLAINE',short:'ILHA DE CINNABAR',theme:0xf59f69,
  leader:'BLAINE',biome:'fire-gym',
  buildings:{gym:[160,155],center:[263,250],mart:[348,250],grass:[75,258]}},
 {id:'viridian',title:'VIRIDIAN · GIOVANNI',short:'ROTA DE VIRIDIAN',theme:0xc8a77b,
  leader:'GIOVANNI',biome:'ground-gym',
  buildings:{gym:[317,133],center:[234,205],mart:[233,169],grass:[85,258]}},
 {id:'victory',title:'VICTORY ROAD · LORELEI',short:'ESTRADA DA VITÓRIA',
  theme:0xaab6bf,leader:'LORELEI',biome:'victory',
  buildings:{gym:[308,111],center:[80,276],mart:[148,276],grass:[350,263]}},
 {id:'indigo',title:'INDIGO PLATEAU · ELITE FOUR',short:'DESAFIO DA ELITE',
  theme:0xe6c884,leader:'ELITE FOUR',biome:'league',
  buildings:{gym:[291,106],center:[88,278],mart:[157,278],grass:[341,273]}}
]);
// Deliberately manually staged positions so Brock's first 13 trainers have
// a fixed location that does not change when any prior fight is won.
const BROCK_POINTS=Object.freeze([
 // South entrance -> east road -> central plaza -> north gym. Every
 // trainer stands on open pavement rather than inside the southern trees.
 [172,256],[218,251],[264,240],[315,224],[344,198],[345,163],
 [293,154],[253,181],[211,196],[167,182],[115,178],[107,143],[186,131]
]);
// Same deterministic map coordinates across reloads and battles.
function checkpointsFor(total,stage){
 if(stage===0&&total===13)return BROCK_POINTS.map(([x,y])=>({x,y}));
 const points=[];
 const rows=Math.ceil(total/7);
 for(let i=0;i<total;i++){
  const row=Math.floor(i/7),col=i%7,reverse=row%2===1;
  const x=55+(reverse?6-col:col)*51;
  const y=286-row*(rows<=3?64:48)+(col%2?3:0);
  points.push({x,y});
 }
 return points;
}
export function getCampaignMapSpec(stage,trainerCount){
 const world=stage<0?WORLDS[0]:stage<9?WORLDS[stage]:WORLDS[9];
 const count=Math.max(0,Math.min(60,Math.floor(Number(trainerCount)||0)));
 return {id:world.id,title:world.title,short:world.short,
  theme:world.theme,leader:world.leader,biome:world.biome,
  buildings:world.buildings,points:checkpointsFor(count,stage),
  boss:stage>=9?'indigo':world.id,stage};
}
const font=(scene,x,y,label,size=9,color='#fff4d6',depth=12)=>{
 return scene.add.text(x,y,label,{fontFamily:'Pixelify Sans,monospace',
  fontSize:size+'px',fontStyle:'bold',color,stroke:'#092134',
  strokeThickness:3}).setDepth(depth).setOrigin(.5);
};
function box(g,x,y,w,h,fill,border){
 g.fillStyle(fill,1);g.fillRect(x,y,w,h);
 g.lineStyle(1,border,1);g.strokeRect(x+.5,y+.5,w-1,h-1);
}
function landmark(scene,g,label,x,y,accent,callback,locked=false){
 const width=Math.max(38,label.length*5.8+10),top=Math.max(83,y-37);
 box(g,x-width/2,top,width,14,0x08263c,locked?0x95a6b0:accent);
 font(scene,x,top+7,label,8,'#fff8dd',12);
 const focus=scene.add.graphics().setDepth(14);
 const zone=scene.add.zone(x,y,43,35).setDepth(15).setInteractive({useHandCursor:true});
 zone.setData('torre2-landmark',label);
 zone.on('pointerover',()=>{
  focus.clear();focus.lineStyle(2,0xffe5a6,.95);
  focus.strokeRect(x-24,y-20,48,39);
 }).on('pointerout',()=>focus.clear()).on('pointerdown',callback);
 return zone;
}
function realMap(scene,spec){
 const key='frlg-location-'+spec.id;
 if(!scene.textures.exists(key))return false;
 const texture=scene.textures.get(key),src=texture.source?.[0];
 if(!src)return false;
 // The source PNG contains adjacent interiors. Show only the outdoor world
 // on the left; interior panes must never be mistaken for overworld tiles.
 const bounds=getSourceMainBounds(spec.id,src.width,src.height);
 const x=Math.max(0,bounds.x),y=Math.max(0,bounds.y);
 const w=Math.min(src.width-x,bounds.w),h=Math.min(src.height-y,bounds.h);
 if(w<128||h<128)return false;
 const name='torre2_unified_'+spec.id;
 if(!texture.has(name))texture.add(name,0,x,y,w,h);
 if(typeof Phaser!=='undefined')
  texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
 // Preserve all of the gym facade below the fixed map title bar.
 // The image itself is the authentic outdoor region of the FireRed sheet.
 scene.add.image(20,85,key,name).setOrigin(0,0).setDepth(1)
  .setDisplaySize(372,211);
 return true;
}
function unavailableTexture(scene,spec){
 // Background fallback uses genuine existing CC0 tiles, never a
 // generated fake FireRed screenshot. The game's CC0 world stays intact.
 const key='torre2-cc0-world';
 if(scene.textures.exists(key)){
  const texture=scene.textures.get(key);
  if(typeof Phaser!=='undefined')
   texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
  scene.add.image(20,85,key).setOrigin(0,0).setDepth(1)
   .setDisplaySize(372,211);
 }
}
function badge(scene,g,index,x,y,condition,onClick){
 const active=condition==='current',completed=condition==='done';
 const color=active?0xffcd62:completed?0x77dba9:0x7c9caa;
 const y0=y-19,x0=x-8,w=index>=9?19:16;
 box(g,x0,y0,w,15,active?0x503815:0x09283a,color);
 font(scene,x0+w/2,y0+7,String(index+1),9,active?'#fff0ad':
  completed?'#c8ffe0':'#e6eef0',13);
 if(active){g.lineStyle(1,0xffffff,.92);g.strokeRect(x0-2,y0-2,w+4,19);}
 const hit=scene.add.zone(x,y,30,43).setDepth(22)
  .setInteractive({useHandCursor:true});
 hit.setData('torre2-checkpoint',index);
 const hover=scene.add.graphics().setDepth(23);
 hit.on('pointerover',()=>{
  hover.clear();hover.lineStyle(1,0xffe5a6,1);
  hover.strokeRect(x-15,y-25,30,45);
 }).on('pointerout',()=>hover.clear()).on('pointerdown',onClick);
 return hit;
}
export function renderUnifiedCampaignMap(scene,state,{limit,onTrainer,onGym,
 onCenter,onMart,onGrass,onLocked}={}){
 const spec=getCampaignMapSpec(state.stage,limit);
 const g=scene.add.graphics().setDepth(0);
 box(g,10,54,390,259,0x051827,0xd9bb7d);
 box(g,17,56,379,253,0x193a43,0xf2d59e);
 const ok=realMap(scene,spec);
 if(!ok)unavailableTexture(scene,spec);
 // A single map remains mounted after each battle, with only marker colors
 // reflecting state.trainer. There is NO scrolling / page switch / route line.
 const hud=scene.add.graphics().setDepth(9);
 hud.fillStyle(0x082538,.96);hud.fillRect(19,58,372,26);
 hud.lineStyle(1,0xffe2a0);hud.lineBetween(19,84,391,84);
 font(scene,122,71,spec.short,12,'#ffe7b3',12);
 const completed=Math.min(limit,state.trainer);
 font(scene,333,71,String(completed)+' / '+String(limit),11,'#aef6d4',12);
 const foot=scene.add.graphics().setDepth(10);
 foot.fillStyle(0x082538,.96);foot.fillRect(19,296,373,12);
 font(scene,191,301,'TOQUE NO PRÓXIMO TREINADOR • SEM TROCAR DE MAPA',8,'#d3f4ec',12);
 const under=scene.add.graphics().setDepth(6);
 const marker=scene.add.graphics().setDepth(11);
 // True FireRed NPC sprite frames, rather than procedural dummy trainers.
 spec.points.forEach((p,i)=>{
  const stateName=i<state.trainer?'done':i===state.trainer?'current':'locked';
  const type=state.stage===0?
   ['youngster','lass','bugcatcher','youngster','lass','bugcatcher',
    'hiker','youngster','bugcatcher','lass','hiker','youngster','hiker'][i%13]:
   ['youngster','lass','bugcatcher','hiker','ace','rocket'][i%6];
  if(!addFireRedNPC(scene,type,p.x,p.y+13,{scale:.70,depth:7}))
   drawTrainer(under,p.x,p.y+4,type,.70);
  badge(scene,marker,i,p.x,p.y,stateName,()=>{
   if(i===state.trainer)onTrainer?.(i);
   else onLocked?.(i<state.trainer?'TREINADOR JÁ VENCIDO':
    'VENÇA O TREINADOR '+(state.trainer+1)+' PRIMEIRO');
  });
 });
 const b=spec.buildings;
 const unlocked=state.trainer>=limit&&!state.champion;
 // Landmark hotspots align with the authentic building pixels in the
 // FireRed city PNG; the gym is visible but not bypassable.
 landmark(scene,marker,'GINÁSIO',...b.gym,spec.theme,
  ()=>onGym?.(),!unlocked);
 landmark(scene,marker,'CENTRO',...b.center,0xf4796d,()=>onCenter?.());
 landmark(scene,marker,'LOJA',...b.mart,0x72c8f7,()=>onMart?.());
 landmark(scene,marker,'GRAMA',...b.grass,0x8fe0a3,()=>onGrass?.());
 // Boss pin appears in front of the actual Pewter Gym facade.
 badge(scene,marker,limit,b.gym[0],b.gym[1]+9,
  unlocked?'current':'locked',()=>onGym?.());
 const npc=state.stage===0?'brock':
  ['misty','surge','erika','koga','sabrina','blaine','giovanni'][state.stage-1]||'lorelei';
 addFireRedNPC(scene,npc,b.gym[0]+18,b.gym[1]+17,{depth:13,scale:.76});
 // Show Red only beside the next challenge, not as a permanently walked
 // overworld avatar. Later patch can replace click navigation with movement.
 const here=spec.points[Math.min(state.trainer,limit-1)]||b.gym;
 const px=Array.isArray(here)?here[0]:here.x,py=Array.isArray(here)?here[1]:here.y;
 if(!addRedPlayer(scene,px-15,py+14,{scale:.70,depth:9}))
  drawTrainer(under,px-15,py+4,'rival',.70);
 return {spec,locations:spec.points.length,artLoaded:ok};
}
