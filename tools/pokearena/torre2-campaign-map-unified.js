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
  buildings:{gym:[155,136],center:[153,275],mart:[240,222],grass:[290,279]},focusY:.37},
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
// Exact 13 trainer route drawn over the supplied Pallet -> Route 1 ->
// Viridian -> Route 2 -> Forest -> Pewter composite, not an arbitrary grid.
// Explicit coordinates stay stable and preserve original battle/save indices.
const BROCK_CUSTOM_POINTS=Object.freeze([
 // Fixed 13-step route on the supplied illustration. Steps are on OPEN
 // WALKWAYS (not roofs, water, cave walls or borders); battle indexes never
 // depend on whether the player has defeated another trainer.
 // Pallet Town (1) -> Route 1 (2-3) -> Viridian (4-5)
 // -> Route 2 (6-7) -> Viridian Forest (8-11) -> Pewter (12-13).
 [115,274],
 [112,241],[112,214],
 [111,189],[159,183],
 [185,151],[188,129],
 [221,178],[254,185],[280,227],[302,241],
 [316,210],[325,185]
]);
const BROCK_AREAS=Object.freeze([
 'PALLET TOWN','ROTA 1','ROTA 1','VIRIDIAN CITY',
 'VIRIDIAN CITY','ROTA 2','ROTA 2','VIRIDIAN FOREST',
 'VIRIDIAN FOREST','VIRIDIAN FOREST','VIRIDIAN FOREST',
 'PEWTER CITY','PEWTER CITY'
]);
const CUSTOM_BROCK_LOCATIONS=Object.freeze({
 gym:[320,128],center:[103,161],mart:[145,162],grass:[288,260]
});
const BROCK_POINTS=Object.freeze([
 // Clickable challenge route, staged on open streets rather than overlapping
 // Pokémon Center, Poké Mart, grass hotspot, or the Gym entrance.
 [61,280],[103,280],[220,280],[301,280],
 [354,249],[349,213],[347,178],[261,184],[201,157],
 [97,231],[97,195],[97,157],[231,150]
]);
// Same deterministic map coordinates across reloads and battles.
function checkpointsFor(total,stage,custom=false){
 if(custom&&stage===0&&total===13)
  return BROCK_CUSTOM_POINTS.map(([x,y])=>({x,y}));
 if(stage===0&&total===13)return BROCK_POINTS.map(([x,y])=>({x,y}));
 const points=[];
 const columns=total>20?7:5,rows=Math.ceil(total/columns);
 // Order is fixed: unlocked checkpoints are sequential but the whole city
 // remains visible. No scene pagination and no artificial route stroke.
 for(let i=0;i<total;i++){
  const row=Math.floor(i/columns),col=i%columns;
  const span=columns===7?47:70;
  const x=52+col*span+(row%2?7:0);
  const y=279-row*Math.min(41,Math.floor(159/Math.max(1,rows-1)));
  points.push({x,y});
 }
 // Keep every numbered trainer readable and away from functional
 // buildings. These positions are deterministic and stable across saves.
 const world=WORLDS[stage]||WORLDS[9];
 const landmarks=Object.values(world.buildings);
 const settled=[];
 const offsets=[[0,0],[34,0],[-34,0],[0,-30],[0,30],
  [35,-30],[-35,-30],[35,30],[-35,30],
  [64,0],[-64,0],[0,-60],[0,60],[70,-40],[-70,-40]];
 for(const point of points){
  let chosen=null;
  for(const [dx,dy] of offsets){
   const p={x:Math.max(43,Math.min(365,point.x+dx)),
    y:Math.max(121,Math.min(280,point.y+dy))};
   const clearBuildings=landmarks.every(([lx,ly])=>
    Math.abs(p.x-lx)>34||Math.abs(p.y-ly)>32);
   const clearTrainers=settled.every(q=>
    Math.abs(p.x-q.x)>28||Math.abs(p.y-q.y)>28);
   if(clearBuildings&&clearTrainers){chosen=p;break}
  }
  settled.push(chosen||point);
 }
 return settled;
}
export function getCampaignMapSpec(stage,trainerCount,customBrock=false){
 const world=stage<0?WORLDS[0]:stage<9?WORLDS[stage]:WORLDS[9];
 const count=Math.max(0,Math.min(60,Math.floor(Number(trainerCount)||0)));
 return {id:world.id,title:world.title,short:world.short,
  theme:world.theme,leader:world.leader,biome:world.biome,
  focusY:world.focusY,
  buildings:customBrock&&stage===0?
   CUSTOM_BROCK_LOCATIONS:world.buildings,
  points:checkpointsFor(count,stage,customBrock),
  customBrock:!!(customBrock&&stage===0),
  trainerAreas:customBrock&&stage===0?BROCK_AREAS:null,
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
function landmark(scene,g,label,x,y,accent,callback,locked=false,compact=false){
 // The custom map already contains buildings and city captions in its art.
 // Small unobtrusive signs identify click targets; never cover the roofs.
 const caption=compact?({
  'GINÁSIO':'GYM','CENTRO':'PC','LOJA':'MART','GRAMA':'GRAMA'
 }[label]||label):label;
 const w=compact?Math.max(20,Math.round(caption.length*5.4+9)):
  Math.max(38,Math.min(81,Math.round(label.length*5.4+11)));
 const height=compact?12:15;
 const yText=Math.min(283,Math.max(98,y-(compact?19:24)));
 box(g,x-w/2,yText-height/2,w,height,0x092438,locked?0x718692:accent);
 font(scene,x,yText,caption,compact?7:8,'#fff7df',15);
 const hover=scene.__torre2MapHover;
 const zone=scene.add.zone(x,y,compact?39:43,compact?30:30).setDepth(21)
  .setInteractive({useHandCursor:true}).setData('torre2-landmark',label);
 zone.on('pointerover',()=>{
  hover.clear();hover.lineStyle(1,0xffe3a0,.97);
  hover.strokeRect(x-20,y-16,40,33);
 }).on('pointerout',()=>hover.clear()).on('pointerdown',callback);
 return zone;
}
function realMap(scene,spec){
 if(spec.customBrock&&scene.textures.exists('torre2-brock-custom')){
  const tex=scene.textures.get('torre2-brock-custom');
  if(typeof Phaser!=='undefined')
   tex.setFilter(Phaser.Textures.FilterMode.NEAREST);
  scene.add.image(20,85,'torre2-brock-custom')
   .setOrigin(0,0).setDepth(1).setDisplaySize(372,211);
  // Replace the embedded FireRed watermark with a repeated native forest
  // tile from the SAME user-provided map. WebGL tile sprites; no CSS overlay,
  // screenshot of a screen, Canvas 2D drawing or replacement of route art.
  const scaleX=(tex.source?.[0]?.width||372)/372;
  const scaleY=(tex.source?.[0]?.height||211)/211;
  const patch='torre2-brock-forest';
  if(!tex.has(patch))tex.add(patch,0,
   Math.round(2*scaleX),Math.round(2*scaleY),
   Math.max(1,Math.round(12*scaleX)),
   Math.max(1,Math.round(12*scaleY)));
  scene.add.tileSprite(32,94,65,36,'torre2-brock-custom',patch)
   .setOrigin(0,0).setTileScale(1/scaleX,1/scaleY).setDepth(2);
  scene.__torre2WorldView={id:'brock-user-map',x:0,y:0,w:372,h:211};
  return true;
 }
 const key='frlg-location-'+spec.id;
 if(!scene.textures.exists(key))return false;
 const texture=scene.textures.get(key),source=texture.source?.[0];
 if(!source)return false;
 const main=getSourceMainBounds(spec.id,source.width,source.height);
 if(main.w<128||main.h<128)return false;
 // FireRed 16px tiles keep their aspect ratio; the old full-map stretch
 // made characters and buildings skinny. Crop one city viewport instead.
 const viewportWidth=372,viewportHeight=211,ratio=viewportWidth/viewportHeight;
 const w=Math.min(main.w,Math.floor(main.h*ratio));
 const h=Math.min(main.h,Math.round(w/ratio));
 const x=main.x+Math.round(Math.max(0,(main.w-w)*.5));
 const focus=spec.focusY??.48;
 const y=main.y+Math.max(0,Math.min(main.h-h,
  Math.round(main.h*focus-h/2)));
 const name='torre2_city_v3_'+spec.id;
 if(!texture.has(name))texture.add(name,0,x,y,w,h);
 if(typeof Phaser!=='undefined')
  texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
 scene.add.image(20,85,key,name).setOrigin(0,0).setDepth(1)
  .setDisplaySize(viewportWidth,viewportHeight);
 scene.__torre2WorldView={id:spec.id,x,y,w,h};
 return true;
}
function unavailableTexture(scene){
 const key='torre2-cc0-world';
 if(!scene.textures.exists(key))return;
 const texture=scene.textures.get(key);
 if(typeof Phaser!=='undefined')
  texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
 scene.add.image(20,85,key).setOrigin(0,0).setDepth(1)
  .setDisplaySize(372,211);
}
function badge(scene,g,index,x,y,condition,onClick,compact=false){
 const active=condition==='current',completed=condition==='done';
 // Brock: a small check on defeated NPCs, quiet numbers on future NPCs,
 // and ONE bright target for the current trainer. No floating placards.
 const w=compact?(completed?9:active?20:13):
  (completed?11:active?21:14);
 const h=compact?(completed?9:active?17:12):
  (completed?11:active?17:13);
 const bx=compact&&!active?Math.min(375,x+11):x;
 const ty=y-(compact?(active?31:19):(active?29:completed?22:24));
 const border=active?0xffd97a:completed?0x7ce3ad:0x5a7786;
 const bg=active?0x554022:completed?0x163d39:0x092739;
 box(g,bx-w/2,ty,w,h,bg,border);
 if(active){
  g.fillStyle(0xffe296,.9);
  g.fillRect(bx-w/2,ty+h,Math.round(w/3),2);
 }
 font(scene,bx,ty+h/2,completed?'✓':String(index+1),
  completed?7:active?10:compact?7:8,
  active?'#fff6c4':completed?'#baffd7':'#afc3cc',16);
 const zone=scene.add.zone(x,y-9,28,33).setDepth(24)
  .setInteractive({useHandCursor:true}).setData('torre2-checkpoint',index);
 const hover=scene.__torre2MapHover;
 zone.on('pointerover',()=>{
  hover.clear();hover.lineStyle(1,0xffe5a6,1);
  hover.strokeRect(x-15,y-28,30,39);
 }).on('pointerout',()=>hover.clear()).on('pointerdown',onClick);
 return zone;
}
export function renderUnifiedCampaignMap(scene,state,{limit,onTrainer,onGym,
 onCenter,onMart,onGrass,onLocked}={}){
 const spec=getCampaignMapSpec(state.stage,limit,
  state.stage===0&&scene.textures.exists('torre2-brock-custom'));
 scene.__torre2WorldView=null;
 const g=scene.add.graphics().setDepth(0);
 box(g,10,54,390,259,0x051827,0xd9bb7d);
 box(g,17,56,379,253,0x193a43,0xf2d59e);
 const ok=realMap(scene,spec);
 if(!ok)unavailableTexture(scene,spec);
 // A single map remains mounted after each battle, with only marker colors
 // reflecting state.trainer. There is NO scrolling / page switch / route line.
 const hud=scene.add.graphics().setDepth(9).setData('torre2-map-chrome',true);
 hud.fillStyle(0x082538,.97);hud.fillRect(19,59,372,25);
 hud.lineStyle(1,0xffe2a0);hud.lineBetween(19,84,391,84);
 font(scene,133,71,spec.short,11,'#ffe7b3',12).setData('torre2-map-chrome',true);
 const completed=Math.min(limit,state.trainer);
 font(scene,335,71,String(completed)+' / '+String(limit),11,'#b4f5cf',12).setData('torre2-map-chrome',true);
 const foot=scene.add.graphics().setDepth(10).setData('torre2-map-chrome',true);
 foot.fillStyle(0x082538,.96);foot.fillRect(19,296,373,12);
 font(scene,191,301,'TOQUE NO PRÓXIMO TREINADOR • SEM TROCAR DE MAPA',8,'#d3f4ec',12).setData('torre2-map-chrome',true);
 // One shared highlight, instead of 13-27 independent Graphics objects
 // and draw commands being retained by WebGL each time the map is opened.
 scene.__torre2MapHover=scene.add.graphics().setDepth(25);
 const under=scene.add.graphics().setDepth(6);
 const marker=scene.add.graphics().setDepth(11);
 // True FireRed NPC sprite frames, rather than procedural dummy trainers.
 spec.points.forEach((p,i)=>{
  const stateName=i<state.trainer?'done':i===state.trainer?'current':'locked';
  const type=state.stage===0?
   // Route 1: youngsters. Route 2 / Viridian Forest: Bug Catchers.
   // Pewter approach: Hikers. Always the actual 16×32 FireRed NPC sprites.
   ['youngster','youngster','youngster','lass','bugcatcher','bugcatcher',
    'bugcatcher','bugcatcher','bugcatcher','hiker','hiker','hiker','hiker'][i%13]:
   ['youngster','lass','bugcatcher','hiker','ace','rocket'][i%6];
  const npc=addFireRedNPC(scene,type,p.x,p.y+9,{scale:.70,depth:7});
  if(!npc)drawTrainer(under,p.x,p.y+4,type,.70);
  else if(spec.customBrock)npc.setAlpha(stateName==='done'?.72:
   stateName==='current'?1:.83);
  badge(scene,marker,i,p.x,p.y,stateName,()=>{
   if(i===state.trainer)onTrainer?.(i);
   else onLocked?.(i<state.trainer?'TREINADOR JÁ VENCIDO':
    'VENÇA O TREINADOR '+(state.trainer+1)+' PRIMEIRO');
  },spec.customBrock);
 });
 const b=spec.buildings;
 const unlocked=state.trainer>=limit&&!state.champion;
 // Landmark hotspots align with the authentic building pixels in the
 // FireRed city PNG; the gym is visible but not bypassable.
 landmark(scene,marker,'GINÁSIO',...b.gym,spec.theme,
  ()=>onGym?.(),!unlocked,spec.customBrock);
 landmark(scene,marker,'CENTRO',...b.center,0xf4796d,
  ()=>onCenter?.(),false,spec.customBrock);
 landmark(scene,marker,'LOJA',...b.mart,0x72c8f7,
  ()=>onMart?.(),false,spec.customBrock);
 landmark(scene,marker,'GRAMA',...b.grass,0x8fe0a3,
  ()=>onGrass?.(),false,spec.customBrock);
 // The gym itself IS checkpoint N+1; avoid a second number/bubble over the
 // entrance (the previous image looked like two trainers in the same spot).
 const bossText=unlocked?'LÍDER '+(limit+1)+' LIBERADO':
  'LÍDER '+(limit+1)+' BLOQUEADO';
 if(spec.customBrock){
  // The entrance itself is checkpoint 14. Keep its status above the door,
  // not in a long banner over the bottom of the user's illustration.
  font(scene,b.gym[0]-18,b.gym[1]+14,
   unlocked?'14 ✓':'14',8,
   unlocked?'#ffe9ab':'#c9d3d8',13);
 }else{
  marker.fillStyle(0x082538,.93);
  marker.fillRect(220,299,172,9);
  font(scene,305,302,bossText,8,
   unlocked?'#a5ffc7':'#d2dbe2',13);
 }
 const npc=state.stage===0?'brock':
  ['misty','surge','erika','koga','sabrina','blaine','giovanni'][state.stage-1]||'lorelei';
 addFireRedNPC(scene,npc,
  spec.customBrock?b.gym[0]:b.gym[0]+26,
  spec.customBrock?b.gym[1]+14:b.gym[1]+6,
  {depth:13,scale:.70});
 // Show Red only beside the next challenge, not as a permanently walked
 // overworld avatar. Later patch can replace click navigation with movement.
 const here=spec.points[Math.min(state.trainer,limit-1)]||b.gym;
 const px=Array.isArray(here)?here[0]:here.x,py=Array.isArray(here)?here[1]:here.y;
 const redX=spec.customBrock?
  Math.max(31,Math.min(376,px+(px>310?-21:21))):
  Math.max(30,px-23);
 if(!addRedPlayer(scene,redX,py+10,{scale:.70,depth:9}))
  drawTrainer(under,redX,py+4,'rival',.70);
 return {spec,locations:spec.points.length,artLoaded:ok};
}
