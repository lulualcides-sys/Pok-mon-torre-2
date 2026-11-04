/* Pokémon Torre 2 — seleção cinematográfica da campanha via cards.
 * Somente apresentação Phaser; jamais altera progressão, time, saves
 * ou a interface aprovada da Arena. Sprites reais FRLG e PMD.
 */
import {STAGES,TRAINERS_PER_GYM,currentOpponent,rematchOpponent,trainerSpeciesForLevel,rivalChampionTeam,campaignStarter} from './campaign-core.js';
import {regionalTrainerPartySize,regionalTrainerParty} from './torre2-trainer-rosters.js';
import {trainerClass,drawTrainer} from './campaign-sprites.js';
import {addFireRedNPC} from './frlg-npc.js';
import {ball} from './campaign-art.js';

const PALETTE={
 navy:0x06172b,panel:0x0c2845,body:0x123755,edge:0x3b77a6,
 ocean:0x1e527a,light:0x8cc9ed,gold:0xf6c851,sun:0xffe6a2,
 cream:0xf7f4df,green:0x50cc84,lock:0x50677c,shadow:0x040d1d
};
const LEADERS=['brock','misty','surge','erika','koga','sabrina','blaine',
 'giovanni','lorelei','bruno','agatha','lance','rival'];
export const LEADER_DIALOGUE=Object.freeze([
 'As pedras não cedem facilmente. Mostre sua força!',
 'A água é minha aliada. Está pronto para o desafio?',
 'Minha eletricidade vai colocar sua equipe à prova!',
 'Vamos descobrir se você respeita a força da natureza.',
 'Um bom ninja vence antes mesmo de ser visto.',
 'A mente pode vencer a força. Vamos descobrir!',
 'Meu fogo não perdoa distrações. Está preparado?',
 'O verdadeiro poder exige estratégia e coragem.',
 'Não subestime o frio da Elite Four.',
 'A força precisa de disciplina. Venha me enfrentar.',
 'Os espíritos conhecem os segredos da batalha.',
 'Mostre que pode superar o poder dos dragões.',
 'Chegou até aqui? Agora enfrente o campeão!'
]);
const TX={fontFamily:'Pixelify Sans,monospace',fontStyle:'bold'};
function text(scene,layer,x,y,value,size=11,color='#f5f4e9',props={}){
 const t=scene.add.text(x,y,String(value),{...TX,fontSize:size+'px',
  color,stroke:'#05111e',strokeThickness:2,...props}).setOrigin(.5);
 layer.add(t);return t;
}
function box(scene,layer,x,y,w,h,{fill=PALETTE.panel,edge=PALETTE.edge,
 accent=PALETTE.light}={}){
 const g=scene.add.graphics();
 g.fillStyle(PALETTE.shadow,.9);g.fillRect(x+3,y+4,w,h);
 g.fillStyle(edge);g.fillRect(x,y,w,h);
 g.fillStyle(fill);g.fillRect(x+2,y+2,w-4,h-4);
 g.fillStyle(accent,.9);g.fillRect(x+3,y+3,w-6,2);
 g.fillStyle(0x031122,.35);g.fillRect(x+3,y+h-6,w-6,2);
 layer.add(g);return g;
}
function control(scene,layer,x,y,w,h,label,fn,{gold=false,muted=false,
 id='',size=10}={}){
 box(scene,layer,x,y,w,h,{fill:muted?0x172737:gold?0x9e6420:0x194d73,
  edge:muted?0x475568:gold?0xf7cf6b:0x6aafcf,
  accent:muted?0x606f7d:gold?0xffebac:0x9ed2e6});
 text(scene,layer,x+w/2,y+h/2,label,size,
  muted?'#8fa0ac':gold?'#fff5ca':'#ecf8ff');
 const zone=scene.add.zone(x+w/2,y+h/2,w,h)
  .setInteractive({useHandCursor:!muted}).setData('torre2-card-control',id||label);
 layer.add(zone);
 if(!muted)zone.on('pointerdown',(_p,_x,_y,event)=>{
  event?.stopPropagation?.();fn?.();
 });
 return zone;
}
function npc(scene,layer,kind,x,y,scale=2.3){
 const image=addFireRedNPC(scene,kind,x,y,{scale,depth:0});
 if(image){layer.add(image);return image;}
 const g=scene.add.graphics();drawTrainer(g,x,y-16,kind,1.3);layer.add(g);
 return g;
}
function npcKind(stage,index,leader=false){
 if(leader)return LEADERS[stage]||'rival';
 const n=STAGES[stage];
 if(!n)return 'youngster';
 const opponent=currentOpponent({stage,trainer:index,team:[],champion:false,starter:'bulbasaur'});
 if(opponent?.kind==='rival'||opponent?.kind==='rocket')return opponent.kind;
 return opponent?.spriteKind||trainerClass(stage,index,opponent?.kind||'trainer',stage===0?'forest':'route');
}
function portraitDex(scene,id){
 try{
  const item=scene.__torre2PathData?.buscar?.(id);
  if(!item)return null;
  return String((item.etapa>0?item.def.evoluciones?.[item.etapa-1]?.dex:
   item.def.dex)||'').padStart(4,'0');
 }catch{return null}
}
function portrait(scene,layer,id,x,y,size=43){
 const dex=portraitDex(scene,id);
 if(!dex)return null;
 const key='torre2-portrait-'+dex;
 const show=()=>{
  if(!layer.active||!scene.textures.exists(key))return;
  const image=scene.add.image(x,y,key).setDisplaySize(size,size);
  layer.add(image);
 };
 if(scene.textures.exists(key)){show();return key;}
 // Native PMD art is loaded on demand for only the selected trainer,
 // rather than allocating 151 GPU portraits while the map is shown.
 const req=scene.__torre2CardPortraitQueue??=new Set();
 if(!req.has(key)){
  req.add(key);scene.load.image(key,'assets/pmd/'+dex+'/portrait.png');
  scene.load.once('filecomplete-image-'+key,show);
  scene.load.once('loaderror',file=>{if(file?.key===key)req.delete(key)});
  if(!scene.load.isLoading())scene.load.start();
 }else{
  scene.load.once('filecomplete-image-'+key,show);
 }
 return key;
}
export function trainerCardEntries(state){
 const stage=state.stage,total=TRAINERS_PER_GYM(stage);
 const progress=Math.max(0,Math.min(total,state.trainer||0));
 return Array.from({length:total+1},(_,index)=>{
  const leader=index===total;
  // currentOpponent is a pure roster projection; it does not save or start.
  const foe=currentOpponent({...state,trainer:index,champion:false});
  const leaderSpecies=stage===12?rivalChampionTeam(campaignStarter(state)):
   (STAGES[stage]?.leaderTeam?.length?STAGES[stage].leaderTeam:[foe?.id]);
  const party=leader?leaderSpecies:
   regionalTrainerParty(stage,index,foe?.id,
    regionalTrainerPartySize(stage,index))
   .map(id=>trainerSpeciesForLevel(id,foe?.level));
  return {index,leader,foe,completed:index<progress,
   active:index===progress,locked:index>progress,
   species:party.filter(Boolean)};
 });
}
function status(entry){
 return entry.completed?'VENCIDO':entry.active?'DISPONÍVEL':'BLOQUEADO';
}
function spriteRoster(scene,layer,entry,x,y,compact=false){
 const species=entry.species.slice(0,6);
 const width=compact?34:Math.min(66,276/species.length);
 species.forEach((id,i)=>{
  const xx=x+(i-(species.length-1)/2)*width;
  if(!compact)box(scene,layer,xx-28,y-29,56,73,
   {fill:0x174065,edge:0x4b8cae,accent:0x81b9d0});
  const gp=scene.add.graphics();
  gp.fillStyle(0x0a1c31,.8);gp.fillRect(xx-14,y-16,28,28);
  ball(gp,xx,y-2,9);
  layer.add(gp);
  if(!compact){
   const key=portrait(scene,layer,id,xx,y-4,38);
   text(scene,layer,xx,y+22,id.toUpperCase().slice(0,9),8,'#e8f5ff');
   if(entry.leader){
    const levels=STAGES[scene.__torre2CardStage]?.leaderLevels;
    // Index is authoritative for levels when provided by the gym manifest.
    const level=STAGES[scene.__torre2CardStage]?.leaderLevels?.[i]??
     entry.foe?.level;
    text(scene,layer,xx,y+33,'NV.'+(level||'—'),8,'#ffe4a5');
   }
  }
 });
}
function cardsPage(scene,state,handlers){
 const all=trainerCardEntries(state);
 const current=all.find(e=>e.active)||all.at(-1);
 const maxPage=Math.max(0,Math.ceil(all.length/5)-1);
 const desired=Math.floor((state.trainer||0)/5);
 const page=Math.min(maxPage,Math.max(0,scene.__torre2CardPage??desired));
 scene.__torre2CardPage=page;
 const layer=scene.add.container(0,0).setDepth(200);
 layer.setData('torre2-trainer-cards-root',true);
 const bg=scene.add.graphics();
 bg.fillStyle(PALETTE.navy);bg.fillRect(0,0,640,360);
 bg.fillStyle(0x0b3555);bg.fillRect(0,0,640,55);
 bg.fillStyle(0x3388bb);bg.fillRect(0,52,640,2);
 bg.fillStyle(0x0b2b48);bg.fillRect(0,284,640,76);
 for(let i=0;i<10;i++){
  bg.fillStyle(i%2?0x29668a:0x164567,.16);
  bg.fillRect((i*97+31)%640,58+(i*29)%224,36,3);
 }
 layer.add(bg);
 const blocker=scene.add.zone(320,180,640,360).setInteractive();
 layer.add(blocker);
 const city=STAGES[state.stage]?.city||'KANTO';
 text(scene,layer,16,19,'POKÉMON TORRE 2',17,'#ffe2a2').setOrigin(0,.5);
 text(scene,layer,17,38,'KANTO  ·  '+city.toUpperCase(),10,'#a6dcf4').setOrigin(0,.5);
 text(scene,layer,408,18,'DESAFIOS',10,'#a9c9dd');
 text(scene,layer,408,36,(state.trainer||0)+' / '+(all.length-1),15,'#ffdf89');
 control(scene,layer,465,9,54,32,'MAPA',handlers.map,
  {id:'map',size:9});
 control(scene,layer,523,9,51,32,'CHEIA',()=>{
  if(scene.scale.isFullscreen)scene.scale.stopFullscreen();
  else scene.scale.startFullscreen({navigationUI:'hide'});
 },{id:'fullscreen',size:9});
 control(scene,layer,578,9,54,32,'MENU',handlers.menu,
  {id:'menu',size:9});
 const heading=page*5+1;
 text(scene,layer,320,68,
  'GINÁSIO DE '+city.toUpperCase()+'  ·  DESAFIOS '+heading+'–'+
  Math.min(all.length,(page+1)*5),11,'#f8f2d6');
 for(let c=0;c<5;c++){
  const entry=all[page*5+c];
  if(!entry)continue;
  const x=18+c*124,y=81,w=109,h=190;
  const edge=entry.active?PALETTE.gold:entry.completed?PALETTE.green:0x587790;
  box(scene,layer,x,y,w,h,{fill:entry.active?0x173e62:0x102d4a,
   edge,accent:entry.active?PALETTE.sun:entry.completed?0x7fe0a5:0x7bacc7});
  const glyph=entry.leader?'LÍDER':entry.foe?.kind==='rival'?'RIVAL':
   entry.foe?.kind==='rocket'?'ROCKET':'TREINADOR';
  text(scene,layer,x+w/2,y+15,
   String(entry.index+1).padStart(2,'0')+'  '+glyph,10,'#f6f3da');
  const podium=scene.add.graphics();
  podium.fillStyle(0x0b233b);podium.fillRect(x+10,y+37,w-20,94);
  podium.fillStyle(entry.active?0x365f7b:0x23435a);
  podium.fillRect(x+17,y+116,w-34,4);
  podium.fillStyle(0x112e45,.7);podium.fillRect(x+18,y+122,w-36,2);
  layer.add(podium);
  npc(scene,layer,npcKind(state.stage,entry.index,entry.leader),x+w/2,y+114,
   entry.leader?2.55:2.35);
  if(entry.leader)text(scene,layer,x+w/2,y+140,
   (entry.foe?.name||'LÍDER').toUpperCase(),10,'#ffe18f');
  else text(scene,layer,x+w/2,y+142,
   (entry.foe?.name||'TREINADOR').toUpperCase().slice(0,16),
   9,'#e5f4ff');
  const balls=scene.add.graphics();
  for(let j=0;j<Math.min(6,entry.species.length);j++)
   ball(balls,x+42+(j-(entry.species.length-1)/2)*17,y+157,7);
  layer.add(balls);
  // Render the actual opponent's PMD mini portrait on unlocked cards.
  // The Poké Ball remains as a placeholder only during first asset load.
  if(!entry.locked&&entry.species[0])
   portrait(scene,layer,entry.species[0],x+w/2+15,y+158,22);
  box(scene,layer,x+7,y+171,w-14,16,{fill:entry.active?0x86611e:
   entry.completed?0x205b42:0x263b52,edge,
   accent:entry.active?0xffe8a0:edge});
  text(scene,layer,x+w/2,y+179,status(entry),9,
   entry.active?'#fff3c5':entry.completed?'#c3f8d2':'#c1cbd5');
  const zone=scene.add.zone(x+w/2,y+96,w,189)
   .setInteractive({useHandCursor:true})
   .setData('torre2-trainer-card-index',entry.index);
  zone.on('pointerdown',(_p,_x,_y,event)=>{
   event?.stopPropagation?.();
   detailPage(scene,state,handlers,entry);
  });layer.add(zone);
 }
 const navY=278;
 control(scene,layer,16,navY,49,28,'◀',()=>{
  scene.__torre2CardPage=Math.max(0,page-1);
  layer.destroy(true);cardsPage(scene,state,handlers);
 },{muted:page===0,id:'cards-prev'});
 text(scene,layer,320,292,'PÁGINA '+(page+1)+' / '+(maxPage+1),
  10,'#e8dbb7');
 control(scene,layer,574,navY,49,28,'▶',()=>{
  scene.__torre2CardPage=Math.min(maxPage,page+1);
  layer.destroy(true);cardsPage(scene,state,handlers);
 },{muted:page===maxPage,id:'cards-next'});
 const bottom=[
  ['EQUIPE',handlers.pokemon],['BOLSA',handlers.bag],
  ['CENTRO',handlers.center],['LOJA',handlers.mart],
  ['CAPTURA',handlers.capture],['TREINO',handlers.training],
  ['VS SEEKER',handlers.rematchAtlas]
 ];
 for(let i=0;i<bottom.length;i++)
  control(scene,layer,6+i*79,317,76,29,bottom[i][0],bottom[i][1],
   {size:8,id:'cards-'+i});
 control(scene,layer,559,317,75,29,'VER ATUAL',()=>{
  detailPage(scene,state,handlers,current);
 },{gold:true,id:'cards-open-current',size:8});
 scene.__torre2CardUI={stage:state.stage,mode:'cards',total:all.length,
  page,active:current.index,visible:all.slice(page*5,(page+1)*5).map(e=>e.index)};
 return scene.__torre2CardUI;
}
function detailPage(scene,state,handlers,entry){
 const old=scene.children.list.find(o=>o.getData?.('torre2-trainer-cards-root')&&o.active);
 old?.destroy(true);
 const layer=scene.add.container(0,0).setDepth(200);
 layer.setData('torre2-trainer-cards-root',true);
 const g=scene.add.graphics();
 g.fillStyle(0x061625);g.fillRect(0,0,640,360);
 g.fillStyle(entry.leader?0x512335:0x123d62);g.fillRect(0,0,252,360);
 for(let i=0;i<8;i++){
  g.fillStyle(entry.leader?0xa84345:0x367dad,.2);
  g.fillRect(0,35+i*39,252,4);
 }
 g.fillStyle(0x0a243c);g.fillRect(252,0,388,360);
 g.fillStyle(PALETTE.gold);g.fillRect(250,0,3,360);
 layer.add(g);
 const shield=scene.add.zone(320,180,640,360).setInteractive();
 layer.add(shield);
 control(scene,layer,570,12,53,32,'X',()=>{
  layer.destroy(true);cardsPage(scene,state,handlers);
 },{id:'cards-close'});
 const leader=entry.leader,name=leader?(entry.foe?.name||'LÍDER'):
  (entry.foe?.name||'TREINADOR '+(entry.index+1));
 text(scene,layer,126,28,leader?'LÍDER DE GINÁSIO':'DESAFIO '+(entry.index+1),
  14,'#ffe29b');
 npc(scene,layer,npcKind(state.stage,entry.index,leader),126,206,
  leader?5.2:5.0);
 box(scene,layer,20,273,213,57,{fill:0x0b2949,edge:PALETTE.gold});
 text(scene,layer,126,285,name.toUpperCase(),14,'#ffe8ad');
 text(scene,layer,126,310,leader?'BATALHA PELA INSÍGNIA':
  (entry.foe?.kind||'TREINADOR').toUpperCase(),9,'#bde1ef');
 text(scene,layer,410,36,'TIME DO ADVERSÁRIO',17,'#ffe0a2');
 text(scene,layer,408,65,'DESAFIO '+(entry.index+1)+' / '+
  (TRAINERS_PER_GYM(state.stage)+1),10,'#b5d6ec');
 const species=entry.locked&&!leader?[]:entry.species;
 if(species.length){
  const full=species.length;
  for(let k=0;k<full;k++){
   const cx=full===1?445:full===2?388+k*112:full===3?335+k*110:306+(k%4)*80;
   const cy=full<=3?153:124+Math.floor(k/4)*90;
   box(scene,layer,cx-43,cy-47,86,99,
    {fill:0x103454,edge:0x4f8caf,accent:0x89c9dd});
   const ballLayer=scene.add.graphics();ball(ballLayer,cx,cy-11,14);layer.add(ballLayer);
   portrait(scene,layer,species[k],cx,cy-13,53);
   text(scene,layer,cx,cy+23,species[k].toUpperCase().slice(0,12),
    9,'#f5f8fb');
   const level=leader?STAGES[state.stage]?.leaderLevels?.[k]??entry.foe?.level:
    entry.foe?.level;
   text(scene,layer,cx,cy+38,'NV. '+(level??'?'),9,'#ffe6a8');
  }
 }else{
  text(scene,layer,445,144,'EQUIPE AINDA BLOQUEADA',12,'#a7bcd0');
 }
 if(leader){
  const sentence=LEADER_DIALOGUE[state.stage]||'Prepare-se para a batalha!';
  box(scene,layer,269,231,351,64,{fill:0x112c45,edge:0x6c9aba,
   accent:PALETTE.gold});
  text(scene,layer,444,245,name.toUpperCase()+' DIZ:',9,'#ffe0aa');
  text(scene,layer,445,266,sentence,10,'#eef4fb',
   {align:'center',wordWrap:{width:330}});
 }else{
  box(scene,layer,270,244,350,46,{fill:0x112c45,edge:0x426d90});
  text(scene,layer,445,262,entry.locked?'VENÇA OS DESAFIOS ANTERIORES':
   entry.completed?'TREINADOR DERROTADO':'PREPARE SUA EQUIPE PARA O COMBATE',
   10,'#d4ecf8');
 }
 control(scene,layer,270,309,115,38,'VOLTAR',()=>{
  layer.destroy(true);cardsPage(scene,state,handlers);
 },{id:'cards-detail-back'});
 let action='BATALHAR',fn=handlers.battle,disabled=entry.locked;
 if(entry.completed){
  const rematch=Boolean(rematchOpponent(state,entry.index));
  action=rematch?'REVANCHE':'VENCIDO';
  disabled=!rematch;fn=()=>handlers.rematch?.(entry.index);
 }else if(leader){action='INICIAR VS';}
 const fight=control(scene,layer,397,309,223,38,action,fn,
  {id:'cards-fight',gold:!disabled,muted:disabled,size:14});
 fight.setData('torre2-card-fight-index',entry.index);
 scene.__torre2CardUI={stage:state.stage,mode:'detail',total:TRAINERS_PER_GYM(state.stage)+1,
  active:state.trainer,selected:entry.index,leader,roster:species,
  canBattle:!disabled};
 return scene.__torre2CardUI;
}
export function renderTrainerCardHub(scene,state,handlers){
 if(!STAGES[state.stage]||state.champion)return null;
 if(scene.__torre2CardStage!==state.stage||
    scene.__torre2CardProgress!==state.trainer){
  scene.__torre2CardStage=state.stage;
  scene.__torre2CardProgress=state.trainer;
  scene.__torre2CardPage=Math.floor((state.trainer||0)/5);
 }
 return cardsPage(scene,state,handlers);
}
export function renderTrainerCardMapTab(scene,onClick){
 const layer=scene.add.container(0,0).setDepth(180);
 control(scene,layer,510,308,120,33,'TREINADORES',onClick,
  {gold:true,id:'cards-from-map'});
 return layer;
}
