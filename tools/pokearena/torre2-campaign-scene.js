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
// Portraits come from the captured Poké Arena 2D PMD asset library.
// Preload all six team members so the map does not show empty squares.
function portraitId(member){
 const {def,etapa}=buscar(member.id);
 return (etapa>0?def.evoluciones?.[etapa-1]?.dex:def.dex)||'0150';
}
function portraitKey(member){return 'torre2-portrait-'+portraitId(member)}
class Campanha extends Phaser.Scene{
 constructor(){super('campanha')}
 init(input){this.result=input?.finished?input:null}
 preload(){
  const state=readCampaign();
  const toLoad=new Set(state?.team?.map(p=>portraitId(p))||[]);
  if(state?.box)for(const p of state.box.slice(0,12))toLoad.add(portraitId(p));
  for(const dex of toLoad){
   const key='torre2-portrait-'+dex;
   if(!this.textures.exists(key))this.load.image(key,'assets/pmd/'+dex+'/portrait.png');
  }
 }
 create(){
  this.cameras.main.setBackgroundColor(C.ink);
  this.summaryIndex=null;this.movePage=0;this.editSlot=0;
  this.add.rectangle(ANCHO/2,ALTO/2,ANCHO,ALTO,0x090d1c);
  const g=this.add.graphics();
  g.lineStyle(2,0x36475f,1);
  g.strokeRect(10,7,ANCHO-20,ALTO-14);
  g.fillStyle(0x142037,.95);g.fillRect(11,8,ANCHO-22,43);
  this.add.text(20,12,'POKÉMON TORRE 2  /  KANTO',{...titleStyle,fontSize:'18px'});
  this.button(447,24,100,29,'CENTRO / PC',()=>{const state=readCampaign();if(state)this.centerScreen(state)});
  this.button(537,24,76,29,'MENU',()=>this.scene.start('titulo',{menu:'principal'}));
  let state=readCampaign();
  if(this.result&&state){
   this.mapPage=null; // Follow the newly unlocked route node after battle.
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
  text(this,ANCHO/2,294,'Sem conta e sem multiplayer. Itens são comprados com Poké Dollars do jogo.',statusStyle).setOrigin(.5);
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
  const stage=STAGES[state.stage],finished=state.champion||!stage;
  const gymStage=state.stage<GYMS.length;
  const limit=finished?0:TRAINERS_PER_GYM(state.stage);
  // Five large, clearly spaced path nodes per panel; the active page follows progress.
  const perPage=5,totalPages=Math.max(1,Math.ceil((limit+1)/perPage));
  const activePage=Math.min(totalPages-1,Math.floor(state.trainer/perPage));
  const page=this.mapPage==null?activePage:Math.max(0,Math.min(totalPages-1,this.mapPage));
  this.mapPage=page;
  const next=currentOpponent(state),area=wildAvailability(state.stage);
  const art=this.add.graphics();
  const rect=(x,y,w,h,color)=>{art.fillStyle(color);art.fillRect(x,y,w,h)};
  const border=(x,y,w,h,color=0x456a58)=>{art.lineStyle(2,color);art.strokeRect(x,y,w,h)};
  // Minimal four-tone pixel meadow, with all decoration kept well away from labels.
  rect(12,57,386,292,0x142f28);
  rect(17,62,376,282,0x8aba73);
  rect(23,93,364,171,0xa1d47e);
  rect(23,94,364,3,0xbedb8c);
  border(17,62,376,282,0x345b43);
  // Frame-like canopy on the edges rather than 50 random overlapping objects.
  for(let i=0;i<6;i++){
   const y=105+i*28;
   for(const x of [27,362]){
    rect(x+3,y+11,4,10,0x5a753d);
    rect(x,y+1,13,13,0x337946);
    rect(x+2,y,10,7,0x438f4d);
    rect(x+4,y+2,4,3,0x71ba6a);
   }
  }
  // Small pixel grass clusters, never on the center road.
  for(let i=0;i<14;i++){
   const x=48+(i*59)%292,y=107+(i*47)%147;
   rect(x,y,3,4,0x6ca85a);rect(x+5,y-2,3,6,0x6ca85a);
   rect(x+10,y+1,3,3,0x6ca85a);
  }
  // Two quiet landmarks echo the reference's Pokémon Center and Mart.
  // They live outside the path and share the restrained pixel palette.
  const shop=(x,y,roof,word)=>{
   rect(x,y+9,43,25,0x795d43);
   rect(x+3,y+11,37,22,0xfff0cd);
   rect(x-3,y+3,49,10,0x3c4e57);
   rect(x-1,y+1,45,10,roof);
   rect(x+4,y+15,9,10,0x86b9cd);
   rect(x+30,y+15,9,10,0x86b9cd);
   rect(x+18,y+21,8,12,0x63544a);
   rect(x+20,y+24,2,3,0xffd37a);
   text(this,x+21,y+1,word,{fontSize:'8px',color:'#ffffff',fontStyle:'bold'})
    .setOrigin(.5,0);
  };
  shop(52,203,0xc65e55,'PC');
  shop(301,118,0x397ba9,'MART');
  for(const [x,y] of [[76,132],[85,138],[300,214],[312,222]]){
   rect(x,y,15,3,0x347b46);
   rect(x+2,y-4,4,7,0x438c4c);
   rect(x+10,y-5,3,8,0x5b9d54);
  }
  rect(22,65,368,25,0x244b4b);
  rect(22,87,368,2,0xe7cb83);
  text(this,34,68,finished?'KANTO · CAMPEÃO':
   'ROTA '+(state.stage+1)+'  /  '+(gymStage?area.label:stage.city.toUpperCase()),{
   fontSize:'14px',color:'#fff3ce',fontStyle:'bold'});
  text(this,376,71,gymStage?stage.city.toUpperCase()+' · '+stage.leader.toUpperCase():'ELITE FOUR',{
   fontSize:'10px',color:'#d9edc4'}).setOrigin(1,0);
  // Gentle climb, like Summit Run: intentional zigzag and uncluttered nodes.
  const first=page*perPage;
  const count=Math.min(perPage,limit+1-first);
  const xs=[189,136,234,149,233];
  const points=Array.from({length:count},(_,i)=>({
   index:first+i,x:xs[i],y:244-i*34,
   kind:routeNode(state.stage,first+i,limit).type
  }));
  // Every segment is constructed in the graphics layer, below interactive symbols.
  for(let i=1;i<points.length;i++){
   const p=points[i-1],q=points[i];
   art.lineStyle(17,0x8d784e);art.lineBetween(p.x,p.y,q.x,q.y);
   art.lineStyle(13,0xf0ce90);art.lineBetween(p.x,p.y,q.x,q.y);
   art.lineStyle(2,0xffe9af,.48);art.lineBetween(p.x+2,p.y-2,q.x+2,q.y-2);
  }
  const shape={trainer:0x5077a7,rocket:0x42454f,rival:0xc26056,leader:0xa6703e};
  for(const p of points){
   const current=p.index===state.trainer,won=p.index<state.trainer,
     locked=p.index>state.trainer,boss=p.kind==='leader';
   // Cartridges and mini Pokéball controls, not a carpet of numeric labels.
   art.fillStyle(0x3a573b,.65);art.fillCircle(p.x+2,p.y+4,boss?16:14);
   art.fillStyle(locked?0x839186:shape[p.kind]||0x537b9e);
   art.fillCircle(p.x,p.y,boss?15:13);
   art.lineStyle(current?3:2,current?0xffe681:0xfaf3cd,1);
   art.strokeCircle(p.x,p.y,boss?15:13);
   if(won){
    art.fillStyle(0x2b6844);art.fillCircle(p.x,p.y,8);
    text(this,p.x,p.y,'✓',{fontSize:'13px',color:'#ffffff'}).setOrigin(.5);
   }else if(current){
    text(this,p.x,p.y-1,boss?'G':p.kind==='rocket'?'R':p.kind==='rival'?'!':'▶',{
     fontSize:'12px',color:'#fffbe0',fontStyle:'bold'}).setOrigin(.5);
    // A single high-contrast "YOU" marker pinpoints current location.
    const click=this.add.zone(p.x,p.y,42,42).setInteractive({useHandCursor:true});
    click.on('pointerdown',()=>this.enterBattle(state));
   }else{
    text(this,p.x,p.y,boss?'G':p.kind==='rocket'?'R':
     p.kind==='rival'?'!':String(p.index+1),{
     fontSize:'12px',color:'#ffffff',fontStyle:'bold'}).setOrigin(.5);
   }
  }
  const currentKind=next?.kind==='leader'?'LÍDER DO GINÁSIO':
   next?.kind==='rocket'?'EQUIPE ROCKET':next?.kind==='rival'?'SEU RIVAL':'TREINADOR';
  rect(23,270,364,30,0x285a48);
  text(this,204,274,finished?'TODOS OS DESAFIOS CONCLUÍDOS':
   'PRÓXIMO: '+currentKind+'  ·  '+(next?.id||'').toUpperCase(),{
   fontSize:'11px',color:'#ffffff'}).setOrigin(.5,0);
  // Clean page controls. Gray when only one page.
  this.button(72,315,84,27,'◀ VOLTAR',()=>{
   this.mapPage=Math.max(0,page-1);this.scene.restart();
  });
  text(this,202,307,'TRILHA '+(page+1)+'/'+totalPages+' · '+(state.trainer+1)+'/'+(limit+1),{
   fontSize:'10px',color:'#143e35',fontStyle:'bold'}).setOrigin(.5,0);
  this.button(325,315,93,27,'AVANÇAR ▶',()=>{
   this.mapPage=Math.min(totalPages-1,page+1);this.scene.restart();
  });
  // Facilities must be discoverable by their names, not cryptic GR / HP / M.
  if(gymStage){
   // 3 mini buildings along path edge; clearly labeled actions in the footer.
   this.button(75,341,108,27,'GRAMA ALTA',()=>this.grassScreen(state));
   this.button(203,341,113,27,'CENTRO POK.',()=>this.centerScreen(state));
   this.button(325,341,110,27,'POKÉ MART',()=>this.martScreen(state));
  }
  // Right side: dedicated team panel, inventory, and unmistakable BATTLE CTA.
  const panel=this.add.graphics();
  panel.fillStyle(0x142c47);panel.fillRoundedRect(409,58,221,235,7);
  panel.lineStyle(2,0x5c83a2);panel.strokeRoundedRect(409,58,221,235,7);
  panel.fillStyle(0xc95b44);panel.fillRoundedRect(414,63,211,31,5);
  text(this,423,68,'MINHA EQUIPE',{fontSize:'15px',color:'#fff4dc',fontStyle:'bold'});
  text(this,421,101,'INSÍGNIAS '+state.badges.length+'/12',{fontSize:'10px',color:'#ebd69d'});
  text(this,617,101,'$ '+(state.money||0),{fontSize:'11px',color:'#f7e5a5'}).setOrigin(1,0);
  text(this,421,119,'TOQUE NO POKÉMON PARA O SUMÁRIO',{
   fontSize:'9px',color:'#a9d4e8'});
  // Actual PMD portraits, in two columns. Empty cards visibly marked.
  for(let i=0;i<6;i++){
   const x=416+(i%2)*106,y=141+Math.floor(i/2)*48;
   const member=state.team[i],selected=i===state.active;
   const bg=this.add.rectangle(x+50,y+21,101,43,
     member?(selected?0x34536a:0x203b54):0x1a3044)
    .setStrokeStyle(1,selected?0xffd77e:member?0x527b92:0x345169);
   if(member){
    this.drawPortrait(member,x+18,y+21,32);
    const display=member.id.toUpperCase().slice(0,10);
    text(this,x+36,y+6,display,{fontSize:display.length>=9?'9px':'10px',
     color:selected?'#ffe8a5':'#e8f5ff',fontStyle:'bold'});
    text(this,x+36,y+23,'NV.'+(member.progression?.level??'—')+
     ' HP '+(member.hp??100)+'%',{fontSize:'8px',color:'#acd2d4'});
    bg.setInteractive({useHandCursor:true});
    bg.on('pointerdown',()=>this.showSummary(state,i));
   }else{
    text(this,x+50,y+13,'—  VAZIO  —',{fontSize:'9px',color:'#7794ab'}).setOrigin(.5);
   }
  }
  // Small bag silhouette is a real touch target, not decorative emoji.
  const bagBg=this.add.rectangle(584,79,78,28,0x20465d)
   .setStrokeStyle(1,0xf6d68d).setInteractive({useHandCursor:true});
  bagBg.on('pointerdown',()=>this.bagScreen(state));
  const bagIcon=this.add.graphics();
  bagIcon.lineStyle(2,0xffd99a);bagIcon.strokeRect(556,72,9,10);
  bagIcon.fillStyle(0xffd99a);bagIcon.fillRect(554,78,14,12);
  bagIcon.fillStyle(0x9c683a);bagIcon.fillRect(560,81,3,3);
  text(this,575,74,'BOLSA',{fontSize:'10px',color:'#ffffff',fontStyle:'bold'});
  // Action is always in exactly the same predictable bottom-right position.
  if(state.pendingCapture){
   this.button(519,322,217,45,'▶ CAPTURAR POKÉMON',()=>this.captureScreen(state),true);
  }else{
   const caption=finished?'★ CAMPEÃO DE KANTO':'▶ INICIAR BATALHA';
   this.battleButton(519,322,217,45,caption,()=>{
    if(!finished)this.enterBattle(state);
   },!finished);
  }
  // 3 simple actions always accessible in top menu/places; keep footer clean.
  this.button(606,24,56,28,'RESET',()=>{
   if(window.confirm('Apagar o progresso da campanha Kanto?')){
    resetCampaign();this.scene.restart();
   }
  });
 }
 drawPortrait(member,x,y,size=34){
  const key=portraitKey(member);
  if(this.textures.exists(key)){
   const img=this.add.image(x,y,key).setDisplaySize(size,size).setDepth(5);
   return img;
  }
  // A missing captured portrait must not hide the name or block input.
  const g=this.add.graphics().setDepth(5);
  g.fillStyle(0x34556b);g.fillRect(x-size/2,y-size/2,size,size);
  g.lineStyle(1,0x7baabb);g.strokeRect(x-size/2,y-size/2,size,size);
  text(this,x,y,member.id.slice(0,2).toUpperCase(),{
   fontSize:'11px',color:'#ffffff'}).setOrigin(.5).setDepth(6);
 }
 battleButton(x,y,w,h,label,callback,active=true){
  const fill=active?0xdf803c:0x4e6c78;
  const shadow=this.add.rectangle(x+2,y+3,w,h,0x6b402a,.9);
  const button=this.add.rectangle(x,y,w,h,fill)
   .setStrokeStyle(3,active?0xffe29a:0x8ca6b1).setInteractive({useHandCursor:true});
  button.on('pointerdown',callback);
  button.on('pointerover',()=>button.setFillStyle(active?0xf39b4e:0x5a7b87));
  button.on('pointerout',()=>button.setFillStyle(fill));
  text(this,x,y,label,{fontSize:'17px',color:active?'#1c2940':'#ffffff',
   fontStyle:'bold'}).setOrigin(.5);
  return button;
 }
 captureScreen(state){
  this.children.removeAll(true);this.backdrop();
  const victim=state.pendingCapture;
  if(!victim)return this.scene.restart();
  text(this,320,37,'CAPTURAR '+victim.id.toUpperCase(),{
   ...titleStyle,fontSize:'21px'}).setOrigin(.5);
  text(this,320,82,'ESCOLHA A POKÉBOLA',{fontSize:'15px',color:C.white}).setOrigin(.5);
  for(const [i,key,label] of [
   [0,'pokeball','POKÉ BALL'],[1,'greatball','GREAT BALL'],[2,'ultraball','ULTRA BALL']]){
   const x=134+i*187,n=state.inventory?.[key]||0;
   this.button(x,176,173,72,label+'  x'+n,()=>{
    if(!n){state.lastMessage='Sem '+label+'. Compre no Poké Mart.';this.captureScreen(state);return}
    attemptCapture(state,Math.random,key);this.scene.restart();
   },n>0);
  }
  text(this,320,258,'Chance base '+victim.chance+'% · bolas melhores aumentam a chance',{
   fontSize:'12px',color:C.muted}).setOrigin(.5);
  this.button(320,319,225,37,'◀ VOLTAR AO MAPA',()=>this.scene.restart());
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
   const chosen=i===state.active;
   const hit=this.add.rectangle(x,y,149,33,chosen?0x35566e:0x213950)
    .setStrokeStyle(2,chosen?0xffd479:0x567994)
    .setInteractive({useHandCursor:true});
   hit.on('pointerdown',()=>{selectTeamMember(state,i);this.bagScreen(state)});
   this.drawPortrait(member,x-55,y,27);
   text(this,x-34,y-12,(chosen?'◆ ':'')+member.id.toUpperCase().slice(0,12),{
    fontSize:'10px',color:chosen?'#ffe4a1':'#e4f2ff'});
   text(this,x-33,y+3,'NV.'+(member.progression?.level??'?')+' · HP '+(member.hp??100)+'%',{
    fontSize:'9px',color:C.muted});
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
  // Campaign preload also loads this PMD portrait; keep the summary image visible.
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
