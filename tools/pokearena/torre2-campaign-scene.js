/* Pokémon Torre 2 — offline campaign frontend inside original Phaser game.
 * No login, network API or online match dependency.
 */
import {ANCHO,ALTO} from '../config.js';
import {ROSTER,buscar} from '../datos.js';
import {availableMoves,selectedMoves,equipMove,resolveLoadout,pokemonStats} from './move-pool.js';
import {readCampaign,createCampaign,saveCampaign,resetCampaign,
 GYMS,STAGES,TRAINERS_PER_GYM,STARTERS,currentOpponent,startBattle,
 resolveBattle,attemptCapture,selectTeamMember,healTeam,KANTO_DEX,
 storePokemon,withdrawPokemon,swapPokemon} from './campaign-core.js';

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
    const summary=resolveBattle(state,!!this.result.won);
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
  const limit=state.stage<GYMS.length?TRAINERS_PER_GYM(state.stage):0;
  const progress=complete?'CAMPEÃO DE KANTO':state.stage<GYMS.length?
   gym.city.toUpperCase()+' · '+gym.leader.toUpperCase():
   'ELITE FOUR · '+gym.leader.toUpperCase();
  text(this,18,62,progress,{fontSize:'16px',color:C.gold});
  text(this,18,85,'INSÍGNIAS '+state.badges.length+' / 12   ·   VITÓRIAS '+state.wins+
   '   ·   DERROTAS '+state.losses+'   ·   POKÉDEX '+(state.dexCaught?.length??0)+'/151',
   {fontSize:'10px',color:C.muted});
  const progressFraction=complete?1:state.stage<GYMS.length?Math.min(1,state.trainer/limit):1;
  this.add.rectangle(320,107,604,5,0x0c1929);
  this.add.rectangle(18+600*progressFraction/2,107,600*progressFraction,5,0x4bb6ff);
  text(this,18,120,'EQUIPE  '+state.team.length+'/6  ·  PC '+state.box.length+
   '    ·    TOQUE EM UM POKÉMON PARA VER O SUMÁRIO E TROCAR GOLPES',
   {fontSize:'10px',color:C.blue});
  state.team.slice(0,6).forEach((member,i)=>{
   const x=18+(i%3)*205,y=146+Math.floor(i/3)*58;
   const active=i===state.active;
   this.card(x,y,198,50,active?0xf5ca5d:0x345879);
   const stats=pokemonStats(member);
   text(this,x+12,y+8,(active?'◆ ':'')+stats.name,{fontSize:'13px',color:active?C.gold:C.white});
   text(this,x+12,y+28,'NV.'+stats.level+'  '+stats.types.join('/')+(member.id==='mewtwo'?' · TESTE':''),{fontSize:'10px',color:C.muted});
   const hit=this.add.zone(x+100,y+25,198,50).setInteractive({useHandCursor:true});
   hit.on('pointerdown',()=>this.showSummary(state,i));
  });
  const enemy=currentOpponent(state);
  if(enemy){
   text(this,18,271,'PRÓXIMO: '+enemy.name.toUpperCase()+'  ·  '+enemy.id.toUpperCase()+
    ' NV.'+enemy.level,{fontSize:'11px',color:C.gold});
  }
  this.button(106,310,174,35,complete?'CAMPEÃO!':'INICIAR BATALHA',()=>{
   if(complete)return;
   const match=startBattle(state);
   match.torre2Loadout=resolveLoadout(state.team[state.active]);
   const touch='ontouchstart' in window||navigator.maxTouchPoints>0;
   match.mandos=[touch?'tactil':'kbm','cpu'];
   this.scene.start('combate',match);
  },true);
  this.button(291,310,176,35,'CURAR EQUIPE',()=>{healTeam(state);this.scene.restart()});
  if(state.pendingCapture){
   this.button(501,310,185,35,'CAPTURAR '+state.pendingCapture.chance+'%',()=>{
    attemptCapture(state);this.scene.restart();
   },true);
  }else this.button(501,310,185,35,'POKÉDEX '+KANTO_DEX.length,()=>this.dexScreen(state));
  this.button(599,23,53,24,'RESET',()=>{
   if(window.confirm('Apagar o progresso da campanha Kanto?')){
    resetCampaign();this.scene.restart();
   }
  });
  const notice=state.lastMessage||'Batalhe, capture e evolua por nível.';
  text(this,320,350,notice,{fontSize:'10px',color:C.muted,wordWrap:{width:550}}).setOrigin(.5,1);
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
