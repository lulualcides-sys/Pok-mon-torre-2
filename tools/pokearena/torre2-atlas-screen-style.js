/* Atlas visual layer — premium native Phaser/WebGL presentation for Pokémon Torre 2.
 * The user's four PNGs are STYLE REFERENCES, never screenshots pasted into play.
 * All progress, item pricing, boss teams and badges come from the actual save.
 * No input zones, timers, mutable state, localStorage, battle or RNG here.
 */
export const ATLAS_UI_VERSION='kanto-atlas-premium-20261101-v1';
export const ATLAS_PALETTE=Object.freeze({
 ink:0x071426,navy:0x0c2948,panel:0x102d50,edge:0x82c9f0,
 light:0xeef6ff,gold:0xffd676,muted:0x92b3cf
});
export const ATLAS_LEAGUE_BIOMES=Object.freeze([
 Object.freeze({name:'LORELEI',theme:'ice',ground:0x74badd,wall:0xd4f7fd,accent:0x87e9ff}),
 Object.freeze({name:'BRUNO',theme:'rock',ground:0xb59c78,wall:0x6a5642,accent:0xecc77d}),
 Object.freeze({name:'AGATHA',theme:'ghost',ground:0x52446b,wall:0x27233e,accent:0xc59aff}),
 Object.freeze({name:'LANCE',theme:'dragon',ground:0x826163,wall:0x38354a,accent:0xffae69}),
 Object.freeze({name:'CHAMPION',theme:'champion',ground:0x83b8db,wall:0xece6d4,accent:0xffdc83})
]);
export const ATLAS_GYM_THEMES=Object.freeze([
 'rock','water','electric','grass','poison','psychic','fire','ground'
]);
export function atlasGymModel(state,stages,trainerLimit){
 const stageIndex=Number.isInteger(state?.stage)?state.stage:0;
 const stage=stages[stageIndex];
 if(!stage)return null;
 const remaining=Math.max(0,trainerLimit-Math.max(0,Number(state?.trainer)||0));
 const ready=!state?.champion&&remaining===0;
 const isLeague=stageIndex>=8;
 return Object.freeze({
  stageIndex,leader:stage.leader,city:stage.city,badge:!isLeague?stage.badge:null,
  boss:stage.boss,team:Object.freeze([...(stage.leaderTeam||[])]),
  remaining,ready,isLeague,theme:isLeague?
   ATLAS_LEAGUE_BIOMES[Math.min(4,stageIndex-8)].theme:
   ATLAS_GYM_THEMES[stageIndex]||'rock',
  rewardTitle:isLeague?'LIGA DE KANTO':'INSÍGNIA '+String(stage.badge||'').toUpperCase()
 });
}
export function atlasBadgeModel(state,gyms){
 const owned=new Set(Array.isArray(state?.badges)?state.badges:[]);
 return gyms.map((g,index)=>Object.freeze({
  index,leader:g.leader,city:g.city,badge:g.badge,
  earned:owned.has(g.badge),boss:g.boss
 }));
}
export function atlasShopModel(state,items,page=0,pageSize=6){
 const visible=items.filter(item=>item?.available!==false);
 const pages=Math.max(1,Math.ceil(visible.length/pageSize));
 const selected=Math.max(0,Math.min(pages-1,Math.floor(page)||0));
 return Object.freeze({
  page:selected,pages,
  money:Math.max(0,Number(state?.money)||0),
  rows:Object.freeze(visible.slice(selected*pageSize,(selected+1)*pageSize)
   .map(item=>Object.freeze({id:item.id,name:item.name,
    price:item.price,canAfford:Number(state?.money)>=item.price})))
 });
}
const pixel=(g,x,y,w,h,c,a=1)=>g.fillStyle(c,a)
 .fillRect(Math.round(x),Math.round(y),Math.max(1,Math.round(w)),Math.max(1,Math.round(h)));
const hashSeed=(x,y,n=1)=>((x*73856093)^(y*19349663)^(n*83492791))>>>0;
/* Decorative box at depth 1: interactive elements stay ABOVE it. */
export function atlasPanel(g,x,y,w,h,{accent=ATLAS_PALETTE.edge,fill=ATLAS_PALETTE.panel}={}){
 pixel(g,x+3,y+4,w,h,0x010a19,.7);
 pixel(g,x,y,w,h,0x091b32);
 pixel(g,x+2,y+2,w-4,h-4,accent);
 pixel(g,x+4,y+4,w-8,h-8,fill);
 pixel(g,x+8,y+8,w-16,2,0x6ab2d5,.42);
 pixel(g,x+8,y+h-10,w-16,2,0x19395a,.85);
 for(const [dx,dy] of [[0,0],[w-7,0],[0,h-7],[w-7,h-7]]){
  pixel(g,x+dx,y+dy,7,7,0x06172d);
  pixel(g,x+dx+2,y+dy+2,3,3,accent);
 }
}
function subtlePixels(g,x,y,w,h,light,dark,seed=1){
 for(let yy=0;yy<h;yy+=9)for(let xx=0;xx<w;xx+=9){
  const k=hashSeed(xx,yy,seed);
  if(k%5===0)pixel(g,x+xx+3,y+yy+3,2,2,light,.16);
  if(k%7===0)pixel(g,x+xx,y+yy+6,3,1,dark,.19);
 }
}
function themeColors(theme){
 switch(theme){
 case 'ice':case 'water':return{ground:0x3a8fb9,edge:0x91ddef,details:0xc3f6fd};
 case 'rock':case 'ground':return{ground:0x856f5d,edge:0xc8ab86,details:0xe6d3b2};
 case 'ghost':case 'poison':return{ground:0x51436d,edge:0xb894dd,details:0xdebcfa};
 case 'dragon':case 'fire':return{ground:0x7c4d53,edge:0xe09c72,details:0xffd17d};
 case 'champion':return{ground:0x679bbb,edge:0xe9d7a2,details:0xf3edcb};
 case 'grass':return{ground:0x4d825c,edge:0xa8d48d,details:0xdbefaa};
 case 'electric':return{ground:0x516b91,edge:0xe6cf6d,details:0xfef4b5};
 default:return{ground:0x617d93,edge:0xa0bbcc,details:0xeaf1f8};
 }
}
export function atlasGymBackdrop(scene,model){
 const g=scene.add.graphics().setDepth(1);
 const c=themeColors(model.theme);
 pixel(g,0,0,640,360,0x071427);
 // Distinct room composition, shared visual language and trim.
 atlasPanel(g,10,43,387,252,{fill:0x101e2d,accent:c.edge});
 pixel(g,16,50,375,237,c.ground);
 subtlePixels(g,16,50,375,237,c.details,0x142036,model.stageIndex+1);
 for(let i=0;i<8;i++)pixel(g,19+i*46,57,2,226,c.edge,.15);
 // Back wall and elevated leader platform, without changing battle gates.
 pixel(g,36,54,335,22,c.edge,.4);
 pixel(g,54,77,295,15,0x182c42,.64);
 pixel(g,115,94,168,65,0x09192d,.41);
 for(let i=0;i<5;i++){
  pixel(g,126+i*31,102,25,4,c.details,.3);
  pixel(g,126+i*31,148,23,3,c.edge,.25);
 }
 const floorColors=[c.ground,c.details,c.edge];
 for(let y=168;y<281;y+=20){
  for(let x=21;x<388;x+=20){
   const n=(x+y)%3;
   pixel(g,x,y,19,19,floorColors[n],n===0?.28:.08);
   pixel(g,x,y,19,1,c.details,.14);
  }
 }
 // Distinct architectural silhouette per Indigo League room. A palette swap
 // alone is explicitly REJECTED by the user (Opção C regional identity).
 if(model.theme==='ice'){
  // Frozen central approach, corner ice ponds and staggered crystals.
  for(const x of [54,82,310,336]){
   pixel(g,x,172,21,92,0x1f79af,.77);
   for(let yy=176;yy<263;yy+=15)pixel(g,x+5,yy,14,3,0xc1f7ff,.74);
  }
  for(const [x,y] of [[54,151],[90,242],[323,151],[338,255]])
   for(let i=0;i<3;i++)pixel(g,x+i*4,y-8-i*6,5,16+i*6,0xc1f5ff,.86);
  pixel(g,153,103,92,10,0xdbf8ff,.85);
 }else if(model.theme==='rock'){
  // Two-offset rocky chambers with boulders flanking a rugged staircase.
  for(const [x,y,w,h] of [[59,96,56,62],[290,108,56,49],[49,216,67,34],[283,225,73,34]]){
   pixel(g,x,y,w,h,0x4e443c,.8);pixel(g,x+4,y-4,w-8,h-4,0xa28b6f,.9);
   pixel(g,x+7,y-6,w-14,3,0xd5be98);
  }
  for(let i=0;i<4;i++)pixel(g,149,157+i*14,106-i*5,5,0xd3bc8d,.64);
 }else if(model.theme==='ghost'){
  // Asymmetric tombstones and purple flame columns framing haunted passage.
  for(const [x,y] of [[70,174],[95,208],[312,181],[330,226],[53,258]]){
   pixel(g,x,y,20,29,0x292742);pixel(g,x+3,y-4,15,8,0x9085ad,.9);
   pixel(g,x+5,y+10,11,3,0xc4afed,.7);
  }
  for(const [x,y] of [[71,110],[333,134],[99,260]]){
   pixel(g,x,y,8,24,0x28233a);pixel(g,x+2,y-9,5,13,0x8546cd);
   pixel(g,x+3,y-16,3,9,0xd5a4ff,.9);
  }
 }else if(model.theme==='dragon'){
  // Broad red championship carpet with banners and armored plinths.
  pixel(g,151,153,100,134,0x9f3545,.68);
  for(let y=159;y<279;y+=20){pixel(g,152,y,100,3,0xe4a05f,.72);pixel(g,155,y+3,3,15,0xf5dba6,.68);}
  for(const x of [64,314]){
   pixel(g,x,76,29,74,0x923c43);pixel(g,x+3,78,23,4,0xefbc60);
   pixel(g,x+12,99,5,22,0xf0ac65);
  }
 }else if(model.theme==='champion'){
  // Wide clean blue league court, symmetrical trees and final central emblem.
  pixel(g,92,91,220,193,0x4e91c7,.68);
  pixel(g,113,112,178,150,0x8bbfe2,.55);
  pixel(g,137,169,130,2,0xe9f2e6,.8);
  pixel(g,201,127,2,140,0xe9f2e6,.8);
  for(const x of [63,321]){
   pixel(g,x-13,107,27,19,0xc4c4a0,.9);
   pixel(g,x-10,97,21,15,0x32683d,.9);
   pixel(g,x-6,89,15,13,0x76aa64,.9);
  }
 }
 // Strong foreground foreground pillars, floor threshold, subtle torches/crystals.
 for(const x of [30,360]){
  pixel(g,x-7,83,16,174,0x213044);
  pixel(g,x-5,83,12,172,c.edge,.43);
  pixel(g,x-10,76,22,8,c.details,.67);
  pixel(g,x-8,260,18,6,c.edge,.8);
  if(['rock','fire','dragon'].includes(model.theme)){
   pixel(g,x-2,121,4,12,0xffcb69,.86);
   pixel(g,x,116,2,5,0xffe49e);
  }else if(['ice','ghost','poison'].includes(model.theme)){
   pixel(g,x-3,115,8,20,c.details,.8);
  }
 }
 atlasPanel(g,404,43,225,253,{accent:c.edge,fill:0x102b4a});
 pixel(g,413,84,207,2,c.edge,.7);
 pixel(g,413,148,207,1,c.edge,.48);
 pixel(g,413,202,207,1,c.edge,.48);
 pixel(g,413,260,207,1,c.edge,.48);
 atlasPanel(g,13,303,383,40,{accent:0x5d9bba,fill:0x0c2947});
 atlasPanel(g,404,303,225,42,{accent:ATLAS_PALETTE.gold,fill:0x7d342f});
 return g;
}
export function atlasBadgeBackdrop(scene,selected=0){
 const g=scene.add.graphics().setDepth(1);
 pixel(g,0,0,640,360,0x06192d);
 atlasPanel(g,13,12,614,41,{accent:0xb5deed});
 atlasPanel(g,13,64,383,243,{accent:0x8dc8e6});
 atlasPanel(g,406,64,221,243,{accent:0xe0bc73});
 for(let i=0;i<8;i++){
  const x=24+(i%4)*91,y=91+Math.floor(i/4)*102;
  atlasPanel(g,x,y,82,91,{accent:i===selected?0xffd875:0x5c88aa,fill:0x0d2643});
  pixel(g,x+8,y+6,66,2,i===selected?0xffdb86:0x5dadd4,.8);
 }
 return g;
}
export function atlasMartBackdrop(scene,stage){
 const g=scene.add.graphics().setDepth(1);
 pixel(g,0,0,640,360,0x061729);
 atlasPanel(g,10,10,620,45,{accent:0x9bcde3});
 atlasPanel(g,13,61,257,234,{accent:0x80c2e8});
 atlasPanel(g,277,61,350,234,{accent:0x89c4ee});
 const theme=stage===1?0x71b4d0:0x6da6bf;
 // Pixel-art Mart interior, behind all real list/text/actions.
 for(let y=82;y<267;y+=18)for(let x=21;x<262;x+=18){
  pixel(g,x,y,17,17,0x6699b7,.22);
  pixel(g,x,y,17,1,0xb9e0ed,.35);
 }
 pixel(g,28,88,210,47,0x294965);pixel(g,33,94,200,35,0x507a96);
 for(let i=0;i<5;i++){
  pixel(g,38+i*39,99,30,13,0x9cbed2);
  pixel(g,41+i*39,101,24,7,i%2?0xbdb0ac:theme);
 }
 pixel(g,36,198,204,43,0x153651);pixel(g,38,201,200,33,0x427593);
 pixel(g,40,204,196,5,0x8bd0e3);
 pixel(g,98,215,16,21,0x1b3d58);pixel(g,100,211,12,13,0xe5b88f);
 pixel(g,100,207,12,6,0x745b49);
 pixel(g,127,242,16,23,0x25567d);pixel(g,129,237,11,14,0xdcb39a);
 pixel(g,129,232,12,6,0xb34340);
 for(let i=0;i<6;i++){
  const y=78+i*34;
  pixel(g,286,y,331,32,i%2?0x123657:0x1b4267);
  pixel(g,288,y,3,31,0x7ac8e9);
  pixel(g,292,y+30,322,1,0x487c9f);
 }
 atlasPanel(g,13,302,614,43,{accent:0x8dcce5});
 return g;
}
export function atlasSummaryBackdrop(scene){
 const g=scene.add.graphics().setDepth(1);
 pixel(g,0,0,640,360,0x07182e);
 // Decorative only, the original 4-slot move editor retains all its controls.
 for(let y=0;y<360;y+=12)pixel(g,0,y,640,1,0x3a7294,.13);
 pixel(g,0,0,640,6,0x235d85);
 pixel(g,0,355,640,5,0x143e62);
 return g;
}
