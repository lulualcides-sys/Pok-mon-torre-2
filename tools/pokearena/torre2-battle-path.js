/* Pokémon Torre 2 — Kanto Battle Path hub, replaces the cluttered city map.
 * Phaser/WebGL native scene objects only. No pasted mockup, HTML overlay,
 * CSS-made combat or changes to the approved Poké Arena 2D move runtime.
 * Trainer numbers and stages map directly onto existing campaign save IDs.
 */
import {routeNode} from './route-data.js';
import {getCampaignMapSpec} from './campaign-map-unified.js';
import {trainerClass,drawTrainer} from './campaign-sprites.js';
import {addFireRedNPC} from './frlg-npc.js';
import {ball} from './campaign-art.js';
import {TRAINERS_PER_GYM,STAGES,currentOpponent} from './campaign-core.js';

export const BATTLE_PATH_BACKDROP=Object.freeze([
 'forest','mtmoon','vermilion','celadon','safari',
 'saffron','cinnabar','viridian','victory','indigo',
 'indigo','indigo','indigo'
]);
const COLORS={ink:0x071729,navy:0x0a223a,edge:0x508cb4,gold:0xffd573,
 green:0x43d881,blue:0x5ba9dc,muted:0x768ca0};
const ROWS=Object.freeze([
 [65,157,249,342,437],
 [437,342,249,157,65],
 [70,175,282,419]
]);
const TX={fontFamily:'Pixelify Sans,monospace',fontStyle:'bold'};
function txt(scene,x,y,value,size=10,color='#f5f8fc',depth=26){
 return scene.add.text(x,y,String(value),{...TX,fontSize:size+'px',
  color,stroke:'#07121f',strokeThickness:2}).setOrigin(.5).setDepth(depth)
}
function frame(g,x,y,w,h,{fill=COLORS.navy,border=COLORS.edge,radius=4}={}){
 g.fillStyle(0x020816,.88);g.fillRoundedRect(x+2,y+3,w,h,radius);
 g.fillStyle(fill,.96);g.fillRoundedRect(x,y,w,h,radius);
 g.lineStyle(1,border,1);g.strokeRoundedRect(x+.5,y+.5,w-1,h-1,radius);
}
function button(scene,x,y,w,h,title,action,{gold=false,enabled=true,depth=40,small=false}={}){
 const g=scene.add.graphics().setDepth(depth),label=txt(scene,x,y,title,small?8:gold?13:9,
  enabled?(gold?'#262114':'#f7f8ff'):'#9facb9',depth+1);
 let hover=false;
 const paint=()=>{
  g.clear();frame(g,x-w/2,y-h/2,w,h,{fill:gold?
   hover?0xffe392:0xf4be4e:hover?0x22588a:0x164674,
   border:gold?0xffe7a0:0x6fb7e3,radius:3});
  g.fillStyle(gold?0xffe99e:0x92d5fa,.9);g.fillRect(x-w/2+4,y-h/2+3,w-8,2);
 };
 const zone=scene.add.zone(x,y,w,Math.max(h,23)).setDepth(depth+2)
  .setInteractive({useHandCursor:true}).setData('torre2-path-action',title);
 zone.on('pointerover',()=>{hover=true;paint()});
 zone.on('pointerout',()=>{hover=false;paint()});
 zone.on('pointerdown',()=>{if(enabled)action()});
 paint();return zone;
}
function connector(g,ax,ay,bx,by,lit){
 const dx=bx-ax,dy=by-ay,length=Math.hypot(dx,dy);
 const steps=Math.ceil(length/10);
 for(let n=1;n<steps;n++){
  const t=n/steps,x=ax+dx*t,y=ay+dy*t;
  g.fillStyle(lit?0xffe9b3:0xe0ebd9,lit?.95:.64);
  g.fillCircle(x,y,lit?1.6:1.1);
 }
}
function trainerKind(stage,node){
 if(node.type==='leader')return STAGES[stage]?.leader?.toLowerCase().replace(/[^a-z]+/g,'')||'brock';
 return trainerClass(stage,node.index,node.type,stage===0?'forest':'route');
}
function titleFor(stage,i,count){
 const n=routeNode(stage,i,count);
 if(i>=count)return (STAGES[stage]?.leader||'LÍDER').toUpperCase();
 if(n.type==='rocket')return 'ROCKET';
 if(n.type==='rival')return 'RIVAL';
 return 'TREINADOR';
}
function hudSprite(scene,member,x,y,depth=34){
 if(!member)return;
 // Textures already loaded for the party summary and Pokédex.
 const {buscar}=scene.__torre2PathData;
 let dex='0150';
 try{const v=buscar(member.id);dex=String((v.etapa>0?
  v.def.evoluciones?.[v.etapa-1]?.dex:v.def.dex)||dex).padStart(4,'0')}
 catch{}
 const key='torre2-portrait-'+dex;
 if(!scene.textures.exists(key))return;
 scene.add.image(x,y,key).setDisplaySize(23,23).setDepth(depth);
}
function renderBackdrop(scene,stage){
 const bg=scene.add.graphics().setDepth(5);
 frame(bg,10,54,478,255,{fill:0x0b2130,border:0xd9ae67,radius:3});
 const imageKey='frlg-location-'+(BATTLE_PATH_BACKDROP[stage]||'indigo');
 if(scene.textures.exists(imageKey)){
  const tex=scene.textures.get(imageKey),source=tex.source?.[0];
  const img=scene.add.image(249,182,imageKey).setDepth(6).setAlpha(.96);
  const w=source?.width||img.width,h=source?.height||img.height;
  img.setScale(Math.max(470/w,247/h));
  // Crop by WebGL geometry mask: image aspect ratio always remains original.
  const crop=scene.make.graphics({x:0,y:0,add:false});
  crop.fillStyle(0xffffff);crop.fillRect(14,58,470,247);
  img.setMask(crop.createGeometryMask());
  scene.events.once('shutdown',()=>{img.clearMask();crop.destroy()});
 }else{
  bg.fillStyle(0x275445);bg.fillRect(14,58,470,247);
 }
 // Dark glass improves readability over the FireRed environment tiles.
 const veil=scene.add.graphics().setDepth(7);
 veil.fillStyle(0x061f29,.19);veil.fillRect(14,58,470,247);
 veil.fillStyle(0x061827,.88);veil.fillRoundedRect(18,62,267,36,5);
 veil.lineStyle(1,0x3c7084,.85);veil.strokeRoundedRect(18,62,267,36,5);
 return {imageKey};
}
export function renderBattlePath(scene,state,handlers){
 const stage=state.stage,finished=state.champion||!STAGES[stage],
  total=finished?0:TRAINERS_PER_GYM(stage),
  progress=Math.min(total,Math.max(0,state.trainer||0)),
  leader=STAGES[stage]?.leader||'CAMPEÃO',
  city=STAGES[stage]?.city||'KANTO';
 const sc=scene.add.graphics().setDepth(1);
 sc.fillStyle(COLORS.ink);sc.fillRect(0,0,640,360);
 sc.fillStyle(0x071d34);sc.fillRect(0,0,640,51);
 sc.fillStyle(0x4b90bb);sc.fillRect(0,49,640,1);
 sc.fillStyle(0x0d2b43);sc.fillRect(0,313,640,47);
 ball(sc,22,25,13);
 txt(scene,115,14,'POKÉMON TORRE 2',15,'#f7cc5f',22).setOrigin(0,.5);
 txt(scene,116,31,'KANTO · '+city.toUpperCase(),9,'#e8f3fd',22).setOrigin(0,.5);
 txt(scene,322,13,'GINÁSIO DE '+city.toUpperCase(),9,'#e9e4cb');
 txt(scene,324,32,leader.toUpperCase(),14,'#ffd37b');
 txt(scene,431,12,'PROGRESSO',8,'#a9d9e9');
 txt(scene,433,30,progress+' / '+total,14,'#ffffff');
 const progressG=scene.add.graphics().setDepth(10);
 progressG.fillStyle(0x173d49);progressG.fillRoundedRect(400,42,66,4,2);
 progressG.fillStyle(0x40d48c);progressG.fillRoundedRect(400,42,
  Math.max(1,66*progress/Math.max(1,total)),4,2);
 button(scene,517,23,69,29,'TELA CHEIA',()=>{}, {depth:41,small:true})
  .on('pointerup',()=>scene.scale.isFullscreen?
   scene.scale.stopFullscreen():scene.scale.startFullscreen({navigationUI:'hide'}));
 button(scene,599,23,65,29,'MENU',handlers.menu,{depth:41});
 renderBackdrop(scene,stage);
 const mapTitle=txt(scene,25,69,'ROTA DE '+city.toUpperCase(),13,'#fff5d8',28);
 mapTitle.setOrigin(0,.5);
 txt(scene,28,89,'VENÇA OS DESAFIOS ATÉ '+leader.toUpperCase(),8,'#cdeaf4',28)
  .setOrigin(0,.5);
 const offset=Math.floor(progress/13)*13;
 const length=Math.min(14,Math.max(0,total+1-offset));
 const spots=[];
 for(let i=0;i<length;i++){
  const row=Math.floor(i/5),column=i%5;
  const px=ROWS[Math.min(2,row)][column]??ROWS[2][ROWS[2].length-1];
  const y=[151,219,282][Math.min(row,2)];
  spots.push({x:px,y,global:offset+i});
 }
 const pathGraphics=scene.add.graphics().setDepth(14);
 for(let i=1;i<spots.length;i++){
  const a=spots[i-1],b=spots[i];
  connector(pathGraphics,a.x,a.y,b.x,b.y,a.global<progress);
 }
 // The next checkpoint receives the gold border. Completed checkpoints
 // retain their own pass/fail mark, and future ones remain visible.
 const hitZones=[];
 for(const p of spots){
  const i=p.global,done=i<progress,active=i===progress;
  const node=routeNode(stage,i,total),boss=node.type==='leader';
  // Capture is an OPTIONAL encounter accessible at checkpoints 3 and 9;
  // it never silently increments the original trainer save counter.
  const capture=!boss&&(i%13===2||i%13===8);
  const available=done||active;
  const g=scene.add.graphics().setDepth(18);
  const width=boss?74:67,top=p.y-23;
  if(active){
   g.fillStyle(0xffd374,.17);g.fillCircle(p.x,p.y-5,boss?36:29);
  }
  g.fillStyle(0x061a2e,.97);g.fillRoundedRect(p.x-width/2,top+10,width,37,5);
  g.lineStyle(active?2:1,active?0xffd15f:done?0x54d99a:0x768a95,1);
  g.strokeRoundedRect(p.x-width/2,top+10,width,37,5);
  g.fillStyle(active?0x7c5521:done?0x255b4b:0x304755,.95);
  g.fillEllipse(p.x,top+8,boss?50:42,18);
  g.lineStyle(2,active?0xffe9aa:done?0x66d5a6:0x778f9c);
  g.strokeEllipse(p.x,top+8,boss?50:42,18);
  if(capture){
   // A real ball icon in grass, with a direct encounter interaction.
   g.fillStyle(0x2d8a47);g.fillTriangle(p.x-14,top+1,p.x-8,top-11,p.x-1,top+1);
   g.fillTriangle(p.x,top+1,p.x+6,top-14,p.x+14,top+1);
   ball(g,p.x,top-2,9);
  }else{
   const kind=trainerKind(stage,node);
   const npc=addFireRedNPC(scene,kind,p.x,top+12,{scale:boss?1.02:.82,depth:21});
   if(!npc)drawTrainer(g,p.x,top-1,kind,.9);
   if(!available&&npc)npc.setTint(0x8594a4).setAlpha(.75);
  }
  txt(scene,p.x,p.y+8,boss?leader.toUpperCase():capture?'CAPTURA':
   node.type==='rocket'?'EQUIPE ROCKET':node.type==='rival'?'RIVAL':'TREINADOR',
   boss?8:node.type==='rocket'?7:8,
   active?'#ffe29a':available?'#f1f8f3':'#afbdc8',23);
  txt(scene,p.x,p.y+22,String(i+1),8,'#a9cbd3',24);
  if(done){
   g.fillStyle(0x28c868);g.fillCircle(p.x+width/2-8,p.y-17,7);
   g.lineStyle(2,0xffffff);g.lineBetween(p.x+width/2-11,p.y-17,p.x+width/2-9,p.y-14);
   g.lineBetween(p.x+width/2-9,p.y-14,p.x+width/2-5,p.y-21);
  }else if(active){
   g.fillStyle(0xffdd85);g.fillTriangle(p.x-4,top-17,p.x+4,top-17,p.x,top-8);
  }
  const zone=scene.add.zone(p.x,p.y-1,width,63).setDepth(31)
   .setInteractive({useHandCursor:true}).setData('torre2-path-node',i)
   .setData('torre2-path-type',capture?'capture':node.type);
  zone.on('pointerdown',()=>{
   if(capture&&available)return handlers.capture();
   if(active)return boss?handlers.gym():handlers.battle();
   if(!done)handlers.locked();
  });
  hitZones.push(zone);
 }
 // Stable page navigation for Misty and later routes with >13 battles.
 if(offset>0)button(scene,37,296,43,18,'◀',()=>handlers.page(-1),{small:true});
 if(offset+length<total+1)button(scene,460,296,43,18,'▶',()=>handlers.page(1),{small:true});
 // Right-hand side: portraits with compact HP, no giant cards or map overlays.
 const side=scene.add.graphics().setDepth(12);
 frame(side,496,54,136,255,{fill:0x081d31,border:0x5a91b6,radius:4});
 frame(side,502,60,124,30,{fill:0x19476d,border:0x578db0,radius:3});
 txt(scene,561,74,'SUA EQUIPE  '+state.team.length+'/6',11,'#fff1c7',24);
 txt(scene,538,102,Math.min(8,state.badges.length)+'/8 INSÍGNIAS',8,'#c4e6e9',24);
 txt(scene,596,102,'$'+(state.money||0),9,'#ffda74',24);
 for(let i=0;i<6;i++){
  const m=state.team[i],y=119+i*22;
  side.fillStyle(i===state.active?0x28475a:0x102c43);
  side.fillRoundedRect(502,y-9,124,21,3);
  side.lineStyle(1,i===state.active?0xf2c267:0x345d76,1);
  side.strokeRoundedRect(502,y-9,124,21,3);
  if(!m)continue;
  hudSprite(scene,m,514,y+1,23);
  txt(scene,530,y-4,m.id.toUpperCase().slice(0,12),8,'#fff5e3',24).setOrigin(0,.5);
  txt(scene,531,y+5,'NV.'+(m.progression?.level||5),7,'#b7dfea',24).setOrigin(0,.5);
  const hp=Math.max(0,Math.min(100,Number(m.hp)||0));
  side.fillStyle(0x091c2c);side.fillRect(576,y+5,45,4);
  side.fillStyle(hp>50?0x3ee18f:hp>22?0xf0ce61:0xe9716e);
  side.fillRect(576,y+5,Math.round(45*hp/100),4);
  scene.add.zone(564,y+1,124,22).setDepth(35).setInteractive({useHandCursor:true})
   .on('pointerdown',()=>handlers.pokemon(i));
 }
 [['BOLSA',handlers.bag],['POKÉMON',()=>handlers.pokemon(state.active)],
  ['CENTRO',handlers.center],['LOJA',handlers.mart],
  ['GINÁSIO',handlers.gym],['CAPTURA',handlers.capture]
 ].forEach(([label,action],i)=>button(scene,533+(i%2)*64,261+Math.floor(i/2)*19,
  60,17,label,action,{depth:39,small:true}));
 // Bottom action bar: the only primary gameplay action, directly starts battle.
 const current=finished?null:currentOpponent(state);
 txt(scene,24,323,'DESAFIO ATUAL',8,'#a9d6e8',30).setOrigin(0,.5);
 txt(scene,24,342,finished?'CAMPEÃO DE KANTO':current?.name||leader,
  12,'#fff2d2',30).setOrigin(0,.5);
 const label=finished?'CAMPEÃO DE KANTO':progress>=total?
  'ENFRENTAR '+leader.toUpperCase():'ENTRAR NA BATALHA';
 const cta=button(scene,359,335,217,32,label,()=>{
  if(finished)return;
  if(progress>=total)return handlers.gym();
  handlers.battle();
 },{gold:true,enabled:!finished,depth:70});
 cta.setData('torre2-central-cta',true);
 button(scene,568,336,113,27,'DETALHES',handlers.details,{depth:70,small:true});
 scene.__torre2BattlePath={stage,total,progress,offset,locations:spots.length,
  nodes:hitZones,imageKey:'frlg-location-'+(BATTLE_PATH_BACKDROP[stage]||'indigo')};
 return scene.__torre2BattlePath;
}
