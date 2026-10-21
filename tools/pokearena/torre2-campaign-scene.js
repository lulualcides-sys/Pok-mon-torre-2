/* Pokémon Torre 2 — offline campaign frontend inside original Phaser game.
 * No login, network API or online match dependency.
 */
import {ANCHO,ALTO} from '../config.js';
import {ROSTER,buscar} from '../datos.js';
import {availableMoves,selectedMoves,equipMove,resolveLoadout,pokemonStats} from './move-pool.js';
import {readCampaign,createCampaign,saveCampaign,resetCampaign,
 GYMS,STAGES,TRAINERS_PER_GYM,STARTERS,currentOpponent,startBattle,
 resolveBattle,attemptCapture,selectTeamMember,healTeam,KANTO_DEX,
 storePokemon,withdrawPokemon,swapPokemon,wildAvailability,startWildEncounter,
 startWildBattle,resolveWildBattle,purchaseItem,usePotion,teachTM} from './campaign-core.js';
import {routeNode,MART_ITEMS} from './route-data.js';

const C={gold:'#f8c448',blue:'#6bc4ff',ink:'#090d1c',panel:'#15233a',muted:'#9cb4cd',white:'#f0f5ff'};
const titleStyle={fontFamily:'Pixelify Sans, monospace',fontSize:'23px',fontStyle:'bold',color:C.gold,stroke:'#000',strokeThickness:3};
const textStyle={fontFamily:'Pixelify Sans, monospace',fontSize:'13px',color:C.white};
const statusStyle={fontFamily:'Pixelify Sans, monospace',fontSize:'12px',color:C.muted};
function text(scene,x,y,content,style={}){return scene.add.text(x,y,content,{...textStyle,...style})}
class Campanha extends Phaser.Scene{
 constructor(){super('campanha')}
 init(input){this.result=input?.finished?input:null}
 create(){
  this.cameras.main.setBackgroundColor(C.ink);
  this.summaryIndex=null;this.movePage=0;this.editSlot=0;
  this.add.rectangle(ANCHO/2,ALTO/2,ANCHO,ALTO,0x090d1c);
  const g=this.add.graphics();
  g.lineStyle(2,0x36475f,1);
  g.strokeRect(10,7,ANCHO-20,ALTO-14);
  g.fillStyle(0x142037,.95);g.fillRect(11,8,ANCHO-22,43);
  this.add.text(20,13,'POKÉMON TORRE 2 · KANTO',{...titleStyle,fontSize:'20px'});
  this.button(440,23,77,24,'ABRIR PC',()=>{const state=readCampaign();if(state)this.pcScreen(state)});
  this.button(526,23,62,24,'MENU',()=>this.scene.start('titulo',{menu:'principal'}));
  let state=readCampaign();
  if(this.result&&state){
   const marker=this.result.marker||{};
   if(marker.stage===state.stage&&marker.trainer===state.trainer){
    const summary=marker.kind==='wild'&&state.pendingWild?.id===marker.id?
     resolveWildBattle(state,!!this.result.won):resolveBattle(state,!!this.result.won);
    state.lastMessage=summary.message;
    saveCampaign(state);
   }else state.lastMessage='Resultado antigo ignorado. Progresso preservado.';
  }
  if(!state)return this.starterSelection();
  this.renderCampaign(state);
 }
 button(x,y,w,h,label,callback,emphasis=false){
  const color=emphasis?0x3677a8:0x253b5a;
  const bg=this.add.rectangle(x,y,w,h,color,.98).setStrokeStyle(1,0x6ba9cc);
  bg.setInteractive({useHandCursor:true});
  bg.on('pointerdown',()=>{bg.setFillStyle(0x385f8b);callback()});
  bg.on('pointerover',()=>bg.setFillStyle(0x38648b));
  bg.on('pointerout',()=>bg.setFillStyle(color));
  text(this,x,y,label,{fontSize:'12px',color:emphasis?C.white:C.gold}).setOrigin(.5);
  return bg;
 }
 starterSelection(){
  text(this,ANCHO/2,73,'ESCOLHA SEU PRIMEIRO POKÉMON',{color:C.gold,fontSize:'19px'}).setOrigin(.5);
  text(this,ANCHO/2,111,'Campanha Kanto: 13 treinadores antes do primeiro ginásio.',statusStyle).setOrigin(.5);
  STARTERS.forEach((id,i)=>{
   const x=135+i*185;
   this.button(x,180,166,58,id.toUpperCase(),()=>{
    saveCampaign(createCampaign(id));this.scene.restart();
   },true);
  });
  text(this,ANCHO/2,270,'Movimentação e golpes: combate original Phaser · progressão: Torre 1',statusStyle).setOrigin(.5);
  text(this,ANCHO/2,294,'Sem conta, login, ranking, compras ou multiplayer.',statusStyle).setOrigin(.5);
 }
 backdrop(){
  const g=this.add.graphics().setDepth(0);
  g.fillGradientStyle(0x101f3a,0x101f3a,0x070b1b,0x070b1b,1);
  g.fillRect(0,51,ANCHO,ALTO-51);
  for(let i=0;i<12;i++){
   g.lineStyle(1,i%3===0?0x2b456c:0x192940,.25);
   g.lineBetween(0,60+i*23,ANCHO,60+i*23);
  }
 }
 card(x,y,w,h,accent=0x4b789b){
  const bg=this.add.rectangle(x+w/2,y+h/2,w,h,0x13253e,.98).setStrokeStyle(1,accent);
  const line=this.add.rectangle(x+2,y+2,4,h-4,accent,.9).setOrigin(0,0);
  return bg;
 }
 renderCampaign(state){
  this.backdrop();
  const gym=STAGES[state.stage],complete=state.champion||!gym;
  const gymStage=state.stage<GYMS.length,limit=TRAINERS_PER_GYM(state.stage);
  const pageSize=9,lastPage=Math.floor(limit/pageSize);
  const here=Math.min(lastPage,Math.floor(state.trainer/pageSize));
  const page=this.mapPage==null?here:Math.min(lastPage,Math.max(0,this.mapPage));
  this.mapPage=page;
  const route=wildAvailability(state.stage);
  const next=currentOpponent(state);
  // Two-column campaign: colorful traversable path left, party/shop on right.
  const g=this.add.graphics().setDepth(2);
  g.fillStyle(0x376f47);g.fillRoundedRect(12,55,379,277,10);
  g.fillStyle(0x6baf64);g.fillRoundedRect(17,79,368,224,6);
  g.fillStyle(0x9ed274);g.fillRect(25,93,353,204);
  g.lineStyle(2,0x294f41);g.strokeRoundedRect(12,55,379,277,10);
  // Pixel grass and stylized trees: inexpensive static Phaser/WebGL shapes.
  for(let i=0;i<33;i++){
   const x=29+(i*67)%338,y=91+(i*37)%194;
   const green=i%2?0x4c994f:0x79ba5b;
   g.fillStyle(0x2c593d);g.fillRect(x+3,y+6,4,7);
   g.fillStyle(green);g.fillRect(x,y,10,10);
   g.fillStyle(0xb1db77,.75);g.fillRect(x+2,y,3,3);
  }
  for(let i=0;i<22;i++){
   const x=27+(i*83)%336,y=93+(i*49)%190;
   g.fillStyle(0x397b39);g.fillRect(x,y,13,3);g.fillRect(x+2,y-3,3,4);g.fillRect(x+9,y-2,2,4);
  }
  this.add.rectangle(201,68,344,21,0x183452,.98).setStrokeStyle(1,0xe1ce87);
  text(this,202,59,complete?'KANTO CHAMPION':gym.city.toUpperCase()+
   '  ·  '+gym.leader.toUpperCase(),{fontSize:'13px',color:'#fce39b'}).setOrigin(.5,0);
  const first=page*pageSize,count=Math.min(pageSize,Math.max(0,limit-first)+1);
  const spots=Array.from({length:count},(_,i)=>{
   const index=first+i;
   const horizontal=[195,125,235,165,270,165,95,185,245][i%9];
   const vertical=289-(i*(190/Math.max(1,count-1)));
   return {index,x:horizontal,y:vertical,node:routeNode(state.stage,index,limit)};
  });
  for(let i=0;i<spots.length-1;i++){
   const a=spots[i],b=spots[i+1];
   g.lineStyle(12,0x8d7c4e);g.lineBetween(a.x,a.y,b.x,b.y);
   g.lineStyle(7,0xe9ce8d);g.lineBetween(a.x,a.y,b.x,b.y);
  }
  for(const p of spots){
   const unlocked=p.index<=state.trainer,selected=p.index===state.trainer,
    boss=p.node.type==='leader';
   const colors={leader:0xe89c47,rocket:0x3d3e59,rival:0x678bd5,trainer:0xb2c4bc};
   const base=colors[p.node.type]??0x95b0bf;
   g.fillStyle(0x304733,.9);g.fillCircle(p.x+2,p.y+3,boss?13:10);
   g.fillStyle(unlocked?base:0x536e65);g.fillCircle(p.x,p.y,boss?12:9);
   g.lineStyle(selected?3:1,selected?0xffe66c:unlocked?0xf6f4da:0x4c756b,1);
   g.strokeCircle(p.x,p.y,boss?12:9);
   text(this,p.x,p.y-5,boss?'G':p.node.type==='rocket'?'R':
    p.node.type==='rival'?'!':String(p.index+1),
     {fontSize:boss?'12px':'9px',color:unlocked?'#ffffff':'#acc8af'}).setOrigin(.5,0);
   if(p.index<state.trainer)text(this,p.x+11,p.y-14,'✓',{fontSize:'10px',color:'#fdf0a9'});
   if(selected){
    g.lineStyle(1,0xffffa4);g.strokeCircle(p.x,p.y,boss?16:13);
    const click=this.add.zone(p.x,p.y,boss?35:29,boss?35:29).setInteractive({useHandCursor:true});
    click.on('pointerdown',()=>this.enterBattle(state));
   }
  }
  // Explicit side-branches; the main path advances ONLY by winning battles.
  const markSide=(x,y,color,symbol,callback)=>{
   const bg=this.add.rectangle(x,y,38,28,color).setStrokeStyle(2,0xffffff)
    .setInteractive({useHandCursor:true});
   bg.on('pointerdown',callback);
   text(this,x,y,symbol,{fontSize:'12px',color:'#ffffff'}).setOrigin(.5);
  };
  if(gymStage){
   markSide(351,111,0x277a48,'GR',()=>this.grassScreen(state));
   markSide(351,185,0xc8454d,'HP',()=>this.centerScreen(state));
   markSide(351,257,0x326bc3,'M',()=>this.martScreen(state));
  }
  this.button(92,315,100,24,'◀ MAPA',()=>{this.mapPage=(page-1+lastPage+1)%(lastPage+1);this.scene.restart()});
  text(this,202,310,'ETAPA '+(page+1)+'/'+(lastPage+1)+' · NÓ '+(state.trainer+1)+'/'+(limit+1),
   {fontSize:'9px',color:'#fff5ca'}).setOrigin(.5);
  this.button(322,315,110,24,'MAPA ▶',()=>{this.mapPage=(page+1)%(lastPage+1);this.scene.restart()});
  // Right-side reference panel with progress, Pokémon and useful shops.
  g.fillStyle(0x14263c);g.fillRoundedRect(400,55,229,278,8);
  g.lineStyle(2,0x537a9a);g.strokeRoundedRect(400,55,229,278,8);
  g.fillStyle(0xa74837);g.fillRoundedRect(405,60,219,29,5);
  text(this,514,66,complete?'CAMPEÃO!':gymStage?'GINÁSIO DE '+gym.city.toUpperCase():
   'ELITE FOUR · '+gym.leader.toUpperCase(),{fontSize:'12px',color:'#fff8d8'}).setOrigin(.5,0);
  const info=complete?'CAMPANHA CONCLUÍDA':next?next.name.toUpperCase()+' · NV.'+next.level:'';
  text(this,410,95,'INSÍGNIAS '+state.badges.length+'/12  ·  $'+(state.money||0),{
   fontSize:'10px',color:C.gold});
  text(this,410,114,'PRÓXIMO: '+info,{fontSize:'10px',color:C.white,
   wordWrap:{width:207}});
  text(this,410,133,'POKÉBALL '+(state.inventory?.pokeball||0)+' · GRAMA '+(state.wildEncountersStage||0)+'/5',
   {fontSize:'9px',color:C.muted});
  text(this,410,150,'EQUIPE ('+state.team.length+'/6) · TOQUE PARA SUMÁRIO',
   {fontSize:'9px',color:C.blue});
  const team=state.team.slice(0,4);
  team.forEach((p,i)=>{
   const y=173+i*23,isActive=i===state.active;
   const b=this.add.rectangle(513,y,214,21,isActive?0x36536a:0x22364f)
    .setStrokeStyle(1,isActive?0xffdd74:0x48617b).setInteractive({useHandCursor:true});
   b.on('pointerdown',()=>this.showSummary(state,i));
   text(this,414,y-7,(isActive?'◆ ':'')+p.id.toUpperCase()+
    ' NV.'+(p.progression?.level??'?')+'  HP '+(p.hp??100)+'%',{
    fontSize:'10px',color:isActive?'#fff1a8':'#d7eafb'});
  });
  if(state.pendingCapture){
   text(this,514,266,'CAPTURAR '+state.pendingCapture.id.toUpperCase(),{
    fontSize:'10px',color:C.gold}).setOrigin(.5);
   this.button(439,292,66,27,'PB '+state.inventory.pokeball,()=>{
    attemptCapture(state,Math.random,'pokeball');this.scene.restart()},true);
   this.button(514,292,70,27,'GB '+state.inventory.greatball,()=>{
    attemptCapture(state,Math.random,'greatball');this.scene.restart()},true);
   this.button(588,292,69,27,'UB '+state.inventory.ultraball,()=>{
    attemptCapture(state,Math.random,'ultraball');this.scene.restart()},true);
  }else{
   this.button(460,293,111,33,complete?'VITÓRIA!':'BATALHAR',()=>{if(!complete)this.enterBattle(state)},true);
   this.button(573,293,102,33,'BOLSA / TM',()=>this.bagScreen(state));
  }
  text(this,319,344,state.lastMessage||'Escolha o próximo caminho.',{
   fontSize:'10px',color:C.muted,wordWrap:{width:601}}).setOrigin(.5,0);
  this.button(602,23,55,24,'RESET',()=>{
   if(window.confirm('Apagar o progresso da campanha Kanto?')){resetCampaign();this.scene.restart()}
  });
 }
 enterBattle(state,wild=false){
  if(state.pendingCapture){state.lastMessage='Resolva a captura antes de continuar.';saveCampaign(state);return this.scene.restart()}
  const match=wild?startWildBattle(state):startBattle(state);
  match.torre2Loadout=resolveLoadout(state.team[state.active]);
  const touch='ontouchstart' in window||navigator.maxTouchPoints>0;
  match.mandos=[touch?'tactil':'kbm','cpu'];
  this.scene.start('combate',match);
 }
 grassScreen(state){
  this.children.removeAll(true);this.backdrop();
  const area=wildAvailability(state.stage);
  text(this,320,23,'GRAMA ALTA · '+area.label,{
   ...titleStyle,fontSize:'18px'}).setOrigin(.5);
  text(this,320,63,area.area.toUpperCase(),{fontSize:'15px',color:C.gold}).setOrigin(.5);
  text(this,320,95,'ENCONTROS REGIONAIS (REFERÊNCIA FIRE RED):',{
   fontSize:'12px',color:C.blue}).setOrigin(.5);
  area.wild.forEach((id,i)=>{
   const x=66+(i%4)*153,y=132+Math.floor(i/4)*32;
   const ok=area.available.includes(id);
   this.add.rectangle(x+62,y+11,140,26,ok?0x24553f:0x233243)
    .setStrokeStyle(1,ok?0x7dd597:0x445468);
   text(this,x+5,y+3,id.toUpperCase()+(ok?' ✓':' · FUTURO'),{
    fontSize:'9px',color:ok?'#d7ffda':'#8ca9bb'});
  });
  text(this,320,227,'Encontros explorados nesta área: '+(state.wildEncountersStage||0)+'/5',
   {fontSize:'12px',color:C.gold}).setOrigin(.5);
  text(this,320,253,'Espécies sem batalha integrada ainda não surgem. Nunca trocamos por Pokémon de outra rota.',
   {fontSize:'10px',color:C.muted,wordWrap:{width:550},align:'center'}).setOrigin(.5);
  this.button(192,315,230,34,'◀ VOLTAR AO MAPA',()=>this.scene.restart());
  this.button(447,315,235,34,'PROCURAR POKÉMON',()=>{
   const found=startWildEncounter(state);
   if(found.ok)this.enterBattle(state,true);
   else this.scene.restart();
  },true);
 }
 centerScreen(state){
  this.children.removeAll(true);this.backdrop();
  text(this,320,41,'CENTRO POKÉMON',{...titleStyle,fontSize:'24px'}).setOrigin(.5);
  text(this,320,96,'CURAR TODA A EQUIPE · SEM CUSTO',{
   fontSize:'16px',color:'#a4f6dc'}).setOrigin(.5);
  this.button(320,154,275,46,'CURAR POKÉMON',()=>{
   healTeam(state);this.scene.restart()},true);
  this.button(320,219,275,40,'ABRIR PC',()=>this.pcScreen(state));
  this.button(320,298,275,32,'◀ VOLTAR AO MAPA',()=>this.scene.restart());
 }
 martScreen(state,page=0){
  this.children.removeAll(true);this.backdrop();
  text(this,320,23,'POKÉ MART · $'+state.money,{
   ...titleStyle,fontSize:'19px'}).setOrigin(.5);
  const items=MART_ITEMS.filter(i=>state.stage>=(i.minStage||0));
  const count=Math.max(1,Math.ceil(items.length/6));
  const pageNum=Math.min(count-1,Math.max(0,page));
  items.slice(pageNum*6,(pageNum+1)*6).forEach((item,i)=>{
   const x=168+(i%2)*301,y=95+Math.floor(i/2)*66;
   this.card(x-141,y-20,283,57,state.money>=item.price?0x568fbb:0x6b5669);
   text(this,x-125,y-9,item.name,{fontSize:'12px',color:C.white});
   text(this,x-125,y+9,'$'+item.price+(item.kind==='tm'?' · TM':' · '+item.kind.toUpperCase()),{
    fontSize:'10px',color:C.muted});
   this.button(x+100,y+6,70,30,'COMPRAR',()=>{
    purchaseItem(state,item.id);this.martScreen(state,pageNum);
   },state.money>=item.price);
  });
  this.button(140,315,177,33,'◀ MAPA',()=>this.scene.restart());
  this.button(346,315,205,33,'ITENS '+(pageNum+1)+'/'+count,()=>this.martScreen(state,(pageNum+1)%count),true);
  this.button(543,315,176,33,'BOLSA / TM',()=>this.bagScreen(state));
  text(this,320,281,state.lastMessage||'Compre Pokébolas, poções e TM',{
   fontSize:'10px',color:C.gold,wordWrap:{width:560}}).setOrigin(.5);
 }
 bagScreen(state){
  this.children.removeAll(true);this.backdrop();
  text(this,320,27,'BOLSA · $'+state.money,{...titleStyle,fontSize:'20px'}).setOrigin(.5);
  const inv=state.inventory||{};
  text(this,320,63,'PB '+(inv.pokeball||0)+' · GB '+(inv.greatball||0)+
   ' · UB '+(inv.ultraball||0)+' · POÇÃO '+(inv.potion||0)+' · SUPER '+(inv.superpotion||0),
   {fontSize:'11px',color:C.gold}).setOrigin(.5);
  text(this,320,92,'POKÉMON ATIVO · Clique para selecionar e equipar a TM',{
   fontSize:'11px',color:C.blue}).setOrigin(.5);
  state.team.slice(0,6).forEach((member,i)=>{
   const x=161+(i%3)*160,y=127+Math.floor(i/3)*40;
   this.button(x,y,149,33,(i===state.active?'◆ ':'')+member.id.toUpperCase(),()=>{
    selectTeamMember(state,i);this.bagScreen(state)},i===state.active);
  });
  this.button(157,231,170,37,'POÇÃO +25 HP',()=>{usePotion(state,'potion');this.bagScreen(state)},true);
  this.button(340,231,170,37,'SUPER +60 HP',()=>{usePotion(state,'superpotion');this.bagScreen(state)},true);
  this.button(517,231,166,37,'SUMÁRIO',()=>this.showSummary(state,state.active));
  const tms=inv.tms||[];
  if(tms.length)text(this,320,270,'ENSINAR TM AO POKÉMON ATIVO:',{
   fontSize:'11px',color:C.gold}).setOrigin(.5);
  else text(this,320,270,'Nenhuma TM na bolsa. Compre no Mart.',{
   fontSize:'11px',color:C.muted}).setOrigin(.5);
  tms.slice(0,3).forEach((id,i)=>{
   const item=MART_ITEMS.find(x=>x.id===id);
   if(item)this.button(144+i*181,302,173,27,item.name.replace('TM','TM '),()=>{
    teachTM(state,id);this.bagScreen(state)},true);
  });
  this.button(320,343,220,23,'◀ VOLTAR AO MAPA',()=>this.scene.restart());
 }
 showSummary(state,index,slot=0,page=0){
  // Game-native Phaser UI: clear hierarchy, 4 visible attack slots, large
  // touch targets, instant type filtering and search for Mewtwo's large pool.
  this.children.removeAll(true);
  this.cameras.main.setBackgroundColor(C.ink);
  this.backdrop();
  const member=state.team[index];
  if(!member)return this.scene.restart();
  const stats=pokemonStats(member),pool=availableMoves(member);
  const chosen=selectedMoves(member),activeSlot=Math.min(3,Math.max(0,slot));
  this.summaryFilter??='ALL';this.summarySearch??='';
  const slotCodes=['LMB','RMB','Q','E / ULT'];
  const slotNames=['ATAQUE 1','ATAQUE 2','ESPECIAL','FINALIZADOR'];
  const types={NORMAL:0xb9c4d2,FIRE:0xf0804d,WATER:0x6fb7f0,ELECTRIC:0xeec95d,
    GRASS:0x83d18a,ICE:0x9bdcee,FIGHTING:0xdb8e77,POISON:0xb98cd9,
    GROUND:0xc3aa77,FLYING:0x98c6e3,PSYCHIC:0xe997bf,BUG:0xaacb70,
    ROCK:0xbaa981,GHOST:0x9b8ec5,DRAGON:0x9da9ef,DARK:0x969cac,
    STEEL:0xa4bbc6,FAIRY:0xe5a8d6};
  const hex=(type)=>'#'+(types[type]??0x9db1c7).toString(16).padStart(6,'0');
  const ncol=type=>types[type]??0x9db1c7;
  const box=(x,y,w,h,fill=0x14243b,stroke=0x375371)=>{
   const rect=this.add.rectangle(x+w/2,y+h/2,w,h,fill,.98).setStrokeStyle(1,stroke);
   return rect;
  };
  const label=(x,y,caption,color='#dceaff',size=11)=>text(this,x,y,caption,{
   fontSize:size+'px',color});
  const button=(x,y,w,h,caption,click,selected=false)=>{
   const bg=box(x,y,w,h,selected?0x28465f:0x1b314a,selected?0xe7c56a:0x52718f);
   bg.setInteractive({useHandCursor:true});
   bg.on('pointerover',()=>bg.setFillStyle(selected?0x385b79:0x2d506f));
   bg.on('pointerout',()=>bg.setFillStyle(selected?0x28465f:0x1b314a));
   bg.on('pointerdown',click);
   const name=label(x+w/2,y+h/2,caption,selected?'#ffe09a':'#e1eeff',11);
   name.setOrigin(.5);
   return bg;
  };
  // Distinct header and unified back navigation.
  box(10,8,620,36,0x10243d,0x456b91);
  label(23,15,'POKÉMON / SUMÁRIO',C.gold,16);
  button(521,13,98,27,'◀ EQUIPE',()=>{this.summaryFilter='ALL';this.summarySearch='';this.scene.restart()});
  // Left: species identity and visible stats.
  box(13,52,197,296,0x13233b,0x4a789f);
  label(24,61,stats.name.toUpperCase(),C.gold,15);
  const typesCaption=stats.types.join('  /  ');
  label(25,82,'NV. '+stats.level+'    '+typesCaption,hex(stats.types[0]),11);
  const {def,etapa}=buscar(member.id);
  const dex=(etapa>0?def.evoluciones[etapa-1]?.dex:def.dex)||'0150';
  const key='torre2-portrait-'+dex;
  box(25,103,82,81,0x091726,0x365b78);
  const portrait=()=>{
   if(!this.scene.isActive()||!this.textures.exists(key))return;
   this.add.image(66,143,key).setDisplaySize(74,74).setDepth(2);
  };
  if(this.textures.exists(key))portrait();
  else{
   this.load.image(key,'assets/pmd/'+dex+'/portrait.png');
   this.load.once('complete',portrait);
   if(!this.load.isLoading())this.load.start();
  }
  label(119,114,'TIPO',C.muted,10);
  label(119,131,stats.types[0],hex(stats.types[0]),12);
  label(119,151,'NV. '+stats.level,C.white,11);
  const statRows=[['HP',stats.hp,180,0x64cb9c],['ATK',stats.attack,160,0xf6a268],
                  ['DEF',stats.defense,165,0x7ab3f5],['SPD',stats.speed,200,0x9cd4d7]];
  statRows.forEach(([name,value,max,color],i)=>{
   const y=194+i*23;
   label(25,y,name,C.muted,10);label(179,y,String(value),C.white,10).setOrigin(1,0);
   box(60,y+3,100,7,0x0c1725,0x1d3046);
   const width=Math.max(3,96*Math.min(1,Math.max(0,value/max)));
   this.add.rectangle(62+width/2,y+6.5,width,4,color,1);
  });
  label(25,289,member.id==='mewtwo'?'TESTE · GOLPES LIBERADOS':'ESCOLHA SEU POKÉMON',
    member.id==='mewtwo'?'#ffcd7b':C.blue,10);
  button(24,311,174,29,index===state.active?'◆ EM BATALHA':'USAR NA BATALHA',()=>{
   selectTeamMember(state,index);this.summaryFilter='ALL';this.summarySearch='';this.scene.restart();
  },index===state.active);
  // Right: four prominent touch-friendly equipped slots, 2×2.
  box(218,52,409,296,0x12243a,0x496b86);
  label(231,59,'GOLPES EQUIPADOS',C.gold,14);
  label(231,78,'TOQUE NO SLOT QUE DESEJA ALTERAR',C.muted,10);
  chosen.forEach((id,i)=>{
   const move=pool.find(m=>m.id===id);
   const x=229+(i%2)*194,y=93+Math.floor(i/2)*43;
   const current=activeSlot===i;
   const bg=box(x,y,189,39,current?0x294765:0x172d43,current?0xf0cb6d:0x385772);
   bg.setInteractive({useHandCursor:true});
   bg.on('pointerdown',()=>this.showSummary(state,index,i,0));
   bg.on('pointerover',()=>bg.setFillStyle(0x335977));
   bg.on('pointerout',()=>bg.setFillStyle(current?0x294765:0x172d43));
   label(x+8,y+4,slotCodes[i]+' · '+slotNames[i],
     current?'#ffe6a7':'#96b2ce',9);
   label(x+8,y+18,move?.nombre??'—',C.white,12);
   label(x+180,y+4,move?.tipo??'',hex(move?.tipo),9).setOrigin(1,0);
   label(x+180,y+21,'CD '+(move?.cd??0)+'s',C.muted,9).setOrigin(1,0);
  });
  // Separated library with filters and paging: can navigate 137 Mewtwo moves.
  this.add.rectangle(424,183,384,1,0x446580);
  label(230,192,'BIBLIOTECA · '+pool.length+' GOLPES',C.gold,12);
  button(445,187,91,25,'TIPO ▾',()=>this.showMoveTypePicker(state,index,activeSlot),false);
  button(541,187,75,25,'BUSCAR',()=>{
   const query=window.prompt('Buscar golpe por nome (vazio para limpar):',this.summarySearch||'');
   if(query===null)return;
   this.summarySearch=query.trim().slice(0,35);
   this.showSummary(state,index,activeSlot,0);
  });
  const filtered=pool.filter(move=>
   (this.summaryFilter==='ALL'||move.tipo===this.summaryFilter)&&
   (!this.summarySearch||move.nombre.toLowerCase().includes(this.summarySearch.toLowerCase())));
  const pageSize=6,pages=Math.max(1,Math.ceil(filtered.length/pageSize));
  const safePage=Math.min(pages-1,Math.max(0,page));
  if(this.summaryFilter!=='ALL'||this.summarySearch)
   label(230,213,'FILTRO: '+this.summaryFilter+
    (this.summarySearch?'  ·  '+this.summarySearch.toUpperCase():''),
    '#95ceef',9);
  const rowsY=223;
  filtered.slice(safePage*pageSize,(safePage+1)*pageSize).forEach((move,i)=>{
   const x=230+(i%2)*193,y=rowsY+Math.floor(i/2)*30;
   const equipped=chosen.includes(move.id);
   const current=chosen[activeSlot]===move.id;
   const bg=box(x,y,188,27,current?0x275749:equipped?0x1e434c:0x1a344d,
    current?0x73d8b0:equipped?0x658e96:0x3c6283);
   bg.setInteractive({useHandCursor:true});
   bg.on('pointerdown',()=>{
    if(equipMove(member,activeSlot,move.id)){
     saveCampaign(state);this.showSummary(state,index,activeSlot,safePage);
    }else{
     this.summaryWarning=equipped?'ESSE GOLPE JÁ ESTÁ EM OUTRO SLOT.':'GOLPE NÃO DISPONÍVEL.';
     this.showSummary(state,index,activeSlot,safePage);
    }
   });
   bg.on('pointerover',()=>bg.setFillStyle(0x305c70));
   bg.on('pointerout',()=>bg.setFillStyle(current?0x275749:equipped?0x1e434c:0x1a344d));
   label(x+6,y+3,(current?'✓ ':equipped?'◆ ':'+ ')+move.nombre+(move.approved?' ✓':''),
    current?'#bcffe3':'#ebf5ff',10);
   label(x+6,y+16,move.tipo,C.muted,8);
   label(x+181,y+16,'CD '+move.cd+'s',C.muted,8).setOrigin(1,0);
  });
  if(filtered.length===0)label(242,255,'NENHUM GOLPE ENCONTRADO',C.muted,11);
  button(233,317,68,25,'◀ ANTES',()=>this.showSummary(state,index,activeSlot,(safePage+pages-1)%pages));
  button(306,317,125,25,(safePage+1)+' / '+pages+' PÁGINAS',()=>this.showSummary(state,index,activeSlot,0),true);
  button(437,317,73,25,'PRÓXIMO ▶',()=>this.showSummary(state,index,activeSlot,(safePage+1)%pages));
  button(515,317,101,25,'LIMPAR',()=>{
   this.summaryFilter='ALL';this.summarySearch='';this.summaryWarning=null;
   this.showSummary(state,index,activeSlot,0);
  });
  if(this.summaryWarning)label(242,211,this.summaryWarning,'#f6bc86',9);
  this.summaryWarning=null;
 }
 showMoveTypePicker(state,index,slot){
  // In-game type chooser, not a browser form or tiny cycle control.
  const all=availableMoves(state.team[index]);
  const types=['ALL',...new Set(all.map(m=>m.tipo))].sort((a,b)=>
   a==='ALL'?-1:b==='ALL'?1:a.localeCompare(b));
  const overlay=this.add.rectangle(320,180,640,360,0x050e19,.9)
   .setDepth(2000).setInteractive();
  const panel=this.add.rectangle(320,178,550,268,0x152a45,.99)
   .setStrokeStyle(2,0x7da5c1).setDepth(2001);
  const title=text(this,75,66,'FILTRAR MOVIMENTOS POR TIPO',
   {fontSize:'17px',color:C.gold}).setDepth(2002);
  const close=text(this,548,69,'FECHAR ✕',{fontSize:'11px',color:C.white})
   .setInteractive({useHandCursor:true}).setDepth(2003);
  close.on('pointerdown',()=>this.showSummary(state,index,slot,0));
  types.forEach((type,i)=>{
   const x=79+(i%5)*99,y=109+Math.floor(i/5)*49;
   const rect=this.add.rectangle(x+43,y+14,91,35,
     this.summaryFilter===type?0x365d74:0x233f59).setStrokeStyle(1,
      this.summaryFilter===type?0xecc76d:0x5e809d)
    .setInteractive({useHandCursor:true}).setDepth(2002);
   const labelType=text(this,x+43,y+14,type,{fontSize:'11px',color:'#f2f6fb'})
     .setOrigin(.5).setDepth(2003);
   rect.on('pointerdown',()=>{
    this.summaryFilter=type;this.summaryWarning=null;
    this.showSummary(state,index,slot,0);
   });
  });
 }
 pcScreen(state,page=0){
  // Native Phaser PC, storing and swapping caught Pokémon, fully persistent.
  this.children.removeAll(true);this.cameras.main.setBackgroundColor(C.ink);
  this.backdrop();
  text(this,20,13,'CENTRO POKÉMON · PC',{...titleStyle,fontSize:'19px'});
  this.button(549,21,155,28,'◀ CAMPANHA',()=>{this.pcSelected=null;this.scene.restart()});
  text(this,22,52,'EQUIPE '+state.team.length+'/6',{color:C.gold,fontSize:'14px'});
  text(this,330,52,'ARMAZENAMENTO '+state.box.length,{color:C.gold,fontSize:'14px'});
  const totalPages=Math.max(1,Math.ceil(state.box.length/6));
  const safePage=Math.max(0,Math.min(totalPages-1,page));
  state.team.forEach((m,i)=>{
   const y=79+i*34,selected=this.pcSelected===i,isActive=i===state.active;
   this.button(164,y,281,29,(isActive?'◆ ':'')+m.id.toUpperCase()+
    ' NV.'+(m.progression?.level??'?')+(selected?' [SELECIONADO]':''),()=>{
     this.pcSelected=i===this.pcSelected?null:i;this.pcScreen(state,safePage);
    },selected);
  });
  const boxPage=state.box.slice(safePage*6,(safePage+1)*6);
  boxPage.forEach((m,i)=>{
   const actual=safePage*6+i,y=79+i*34;
   this.button(466,y,277,29,m.id.toUpperCase()+' · NV.'+(m.progression?.level??'?'),()=>{
    let changed=false;
    if(state.team.length<6)changed=withdrawPokemon(state,actual);
    else if(Number.isInteger(this.pcSelected))changed=swapPokemon(state,this.pcSelected,actual);
    if(changed)this.pcSelected=null;
    else state.lastMessage='Selecione um Pokémon da equipe para trocar.';
    this.pcScreen(state,Math.min(safePage,Math.max(0,Math.ceil(state.box.length/6)-1)));
   });
  });
  if(!boxPage.length)text(this,342,94,'PC VAZIO · CAPTURE POKÉMON',statusStyle);
  this.button(121,310,195,29,'GUARDAR SELECIONADO',()=>{
   if(!storePokemon(state,this.pcSelected))
    state.lastMessage='Selecione um Pokémon; mantenha pelo menos um na equipe.';
   this.pcSelected=null;this.pcScreen(state,safePage);
  });
  this.button(337,310,111,29,'◀ ANTERIOR',()=>this.pcScreen(state,(safePage-1+totalPages)%totalPages));
  this.button(451,310,104,29,(safePage+1)+' / '+totalPages,()=>this.pcScreen(state,0));
  this.button(568,310,119,29,'PRÓXIMA ▶',()=>this.pcScreen(state,(safePage+1)%totalPages));
  text(this,20,345,'Equipe cheia? Selecione alguém à esquerda e clique no PC para trocar.',{
   fontSize:'10px',color:C.muted});
 }
 dexScreen(state){
  this.children.removeAll(true);
  this.cameras.main.setBackgroundColor(C.ink);
  text(this,ANCHO/2,18,'POKÉDEX DE KANTO · '+KANTO_DEX.length+' ESPÉCIES',
    {...titleStyle,fontSize:'18px'}).setOrigin(.5,0);
  const supported=new Set(ROSTER.flatMap(p=>[p.id,...(p.evoluciones||[]).map(x=>x.nombre.toLowerCase())]));
  text(this,ANCHO/2,47,'VISTOS '+(state.dexSeen?.length??0)+'  ·  CAPTURADOS '+(state.dexCaught?.length??0)+
   '  ·  Somente espécies integradas entram em batalha.',statusStyle).setOrigin(.5);
  const page=Math.min(this.dexPage||0,6);
  for(let i=0;i<22;i++){
   const index=page*22+i;if(index>=KANTO_DEX.length)break;
   const raw=KANTO_DEX[index],slug=raw.toLowerCase();
   const ready=supported.has(slug),caught=(state.dexCaught||[]).includes(slug);
   const seen=caught||(state.dexSeen||[]).includes(slug);
   const x=35+(i>=11?295:0),y=75+(i%11)*21;
   const marker=caught?' ★':seen?' ◦':ready?' ✓':'';
   text(this,x,y,String(index+1).padStart(3,'0')+'. '+raw+marker,{
    fontSize:'11px',color:caught?C.gold:seen?C.blue:C.muted});
  }
  this.button(91,329,140,31,'◀ VOLTAR',()=>this.scene.restart());
  this.button(360,329,160,31,'PÁGINA '+(page+1)+'/7',()=>{
   this.dexPage=(page+1)%7;this.dexScreen(state);
  });
 }
}
export {Campanha};
