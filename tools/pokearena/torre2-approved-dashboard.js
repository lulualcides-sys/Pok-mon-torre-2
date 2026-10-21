/* Kanto approved screen — reference-image artwork plus actual Phaser game state.
 * Static asset is DECORATIVE ONLY; all input, badges, HP, team, captures,
 * pagination and trainer progression are live, not a video or fake webpage.
 */
import {STAGES,GYMS,TRAINERS_PER_GYM,currentOpponent,wildAvailability,resetCampaign} from './campaign-core.js';
import {routeNode} from './route-data.js';
const TYPE='Pixelify Sans, monospace';
function txt(s,x,y,str,size=11,color='#fff8df',bold=false){
 return s.add.text(x,y,str,{fontFamily:TYPE,fontSize:size+'px',fontStyle:bold?'bold':'normal',
  color,stroke:'#092137',strokeThickness:bold?2:1}).setDepth(16);
}
function zone(s,x,y,w,h,cb){
 return s.add.zone(x,y,w,h).setDepth(22).setInteractive({useHandCursor:true})
  .on('pointerdown',cb);
}
function buttonLabel(s,x,y,str){
 return txt(s,x,y,str,11,'#fff5d4',true);
}
function card(s,g,state,member,index,x,y,w,h){
 const selected=member&&index===state.active;
 const accent=selected?0xffd66b:member?(index%2?0xc795ed:0x54d6a0):0x456a97;
 g.fillStyle(0x06132b);g.fillRoundedRect(x,y,w,h,2);
 g.lineStyle(selected?2:2,accent);g.strokeRoundedRect(x,y,w,h,2);
 g.fillStyle(member?(index%2?0x232a57:0x0b4339):0x162946);
 g.fillRoundedRect(x+3,y+3,w-6,h-6,2);
 g.fillStyle(accent,.8);g.fillRect(x+4,y+4,w-8,2);
 if(!member){
  g.fillStyle(0x294568);g.fillCircle(x+w/2,y+23,12);
  g.fillStyle(0x0d2544);g.fillRect(x+w/2-12,y+22,24,3);
  g.fillStyle(0x0d2544);g.fillCircle(x+w/2,y+23,5);
  txt(s,x+w/2,y+h-18,'- VAZIO -',9,'#8bb4d8').setOrigin(.5,0);
  return;
 }
 const portrait=s.drawPortrait(member,x+21,y+24,39,14);
 if(portrait?.texture?.setFilter)portrait.texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
 const name=member.id.toUpperCase().slice(0,12),hp=Math.max(0,Math.min(100,Number(member.hp??100)));
 txt(s,x+43,y+10,name,name.length>9?9:11,selected?'#ffe6a3':'#f5fcff',true);
 txt(s,x+43,y+25,'NV.'+(member.progression?.level??5),9,'#aedcf0');
 txt(s,x+43,y+38,'HP '+hp+'%',9,'#cbfbe0');
 g.fillStyle(0x08172b);g.fillRect(x+42,y+52,w-48,5);
 g.fillStyle(hp>50?0x63e58b:hp>20?0xf1d463:0xf47967);g.fillRect(x+43,y+53,(w-50)*hp/100,3);
 zone(s,x+w/2,y+h/2,w,h,()=>s.showSummary(state,index));
}
function node(s,g,p,won,active){
 const {x,y,index,kind}=p;
 g.fillStyle(0x122a3b);g.fillCircle(x+1,y+2,17);
 g.fillStyle(0xf4deb6);g.fillCircle(x,y,16);
 g.fillStyle(0x263849);g.fillCircle(x,y,13);
 g.fillStyle(won?0x277b50:active?0x267bc0:0x888e92);g.fillCircle(x,y,12);
 g.lineStyle(active?3:2,active?0xffdb6a:0xefe4d7);g.strokeCircle(x,y,active?15:13);
 txt(s,x,y-8,won?'✓':active?'▶':kind==='leader'?'G':
  kind==='rocket'?'R':kind==='rival'?'!':String(index+1),13,'#ffffff',true).setOrigin(.5);
}
export function drawApprovedDashboard(s,state){
 s.backdrop();
 // Keep the approved art crisp at the game's fixed internal resolution.
 const bg=s.add.image(320,180,'torre2-approved-kanto').setDisplaySize(640,360).setDepth(10);
 const texture=s.textures.get('torre2-approved-kanto');
 if(texture?.setFilter&&typeof Phaser!=='undefined')
  texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
 bg.setScrollFactor(0);
 const g=s.add.graphics().setDepth(12);
 const rect=(x,y,w,h,c)=>{g.fillStyle(c);g.fillRect(x,y,w,h)};
 const stage=STAGES[state.stage],finished=!!state.champion||!stage,gym=state.stage<GYMS.length;
 const limit=finished?0:TRAINERS_PER_GYM(state.stage),perPage=5;
 const totalPages=Math.max(1,Math.ceil((limit+1)/perPage));
 const page=s.mapPage==null?Math.min(totalPages-1,Math.floor(state.trainer/perPage)):
  Math.max(0,Math.min(totalPages-1,s.mapPage));
 s.mapPage=page;
 const next=currentOpponent(state),area=wildAvailability(state.stage),first=page*perPage;
 const movePage=d=>{s.mapPage=Math.max(0,Math.min(totalPages-1,page+d));s.scene.restart()};
 // The image is artwork, never a snapshot of progress. Opaque areas below
 // replace ALL sample data, so saves and the Brock route stay truthful.
 // Artwork highlights the early-Kanto area; later regions keep their own labels.
 
 rect(50,59,220,22,0x073c50);rect(301,59,80,22,0x073c50);
 txt(s,52,64,finished?'KANTO / CAMPEÃO':
  (state.stage===0?'ROTA 1 / PEWTER · BROCK': 'ROTA '+(state.stage+1)+' / '+(gym?area.label:stage.city.toUpperCase())),
  12,'#fff5d7',true);
 txt(s,381,66,gym?stage.city.toUpperCase()+' · '+stage.leader.toUpperCase():
  'ELITE FOUR',9,'#baedf6').setOrigin(1,0);
 const coords=[[212,240],[159,210],[244,176],[148,141],[245,105]];
 coords.forEach(([x,y],i)=>{
  const index=first+i,kind=routeNode(state.stage,index,limit).type;
  const active=!finished&&index===state.trainer,won=index<state.trainer;
  if(index<=limit)node(s,g,{x,y,index,kind},won,active);
  if(active&&index<=limit)zone(s,x,y,38,38,()=>s.enterBattle(state));
 });
 // Dynamic next challenge, badges, currency and trainer/page progress.
 const kind=next?.kind==='leader'?'LÍDER':next?.kind==='rocket'?'ROCKET':
  next?.kind==='rival'?'RIVAL':'TREINADOR';
 rect(126,263,243,20,0x043c38);
 txt(s,128,268,finished?'★ TODOS OS DESAFIOS CONCLUÍDOS':
  'PRÓXIMO: '+kind+' · '+(next?.id||'').toUpperCase(),11,'#fff0c9',true);
 rect(221,283,158,18,0x063a35);
 txt(s,364,286,'TRILHA '+(page+1)+'/'+totalPages+' · '+(state.trainer+1)+'/'+(limit+1),
  9,'#bfeade').setOrigin(1,0);
 rect(103,287,116,14,0x083c39);
 for(let i=0;i<5;i++){
  const x=111+i*21,y=294;
  g.fillStyle(0x14324f);g.fillCircle(x,y,5);
  g.lineStyle(1,0xbad6e6);g.strokeCircle(x,y,5);
  g.fillStyle(first+i<state.trainer?0x51cb9c:first+i===state.trainer?0xffdc70:0x315c82);
  g.fillCircle(x,y,3.5);
 }
 // Full-size interactive map and menu controls at precise reference positions.
 zone(s,442,25,89,34,()=>s.centerScreen(state));
 zone(s,521,25,64,34,()=>s.scene.start('titulo',{menu:'principal'}));
 zone(s,590,25,65,34,()=>{
  if(window.confirm('Apagar o progresso da campanha Kanto?')){
   resetCampaign();s.scene.restart();
  }
 });
 zone(s,55,330,80,32,()=>movePage(-1));
 zone(s,147,330,93,32,()=>s.grassScreen(state));
 zone(s,246,330,103,32,()=>s.centerScreen(state));
 zone(s,343,330,94,32,()=>s.martScreen(state));
 zone(s,72,209,55,53,()=>s.centerScreen(state));
 zone(s,320,142,56,45,()=>s.martScreen(state));
 zone(s,343,292,39,19,()=>movePage(1));
 zone(s,93,294,16,15,()=>movePage(-1));
 zone(s,579,72,82,32,()=>s.bagScreen(state));
 // Render the party dynamically over sample Pokémon pictured on the source
 // artwork. 2×2 slots match approved composition; fifth/sixth remain reachable.
 rect(404,94,214,18,0x071b35);
 txt(s,406,96,'INSÍGNIAS '+state.badges.length+'/12',10,'#fff1cf',true);
 txt(s,616,95,'$ '+(state.money||0),11,'#ffdb69',true).setOrigin(1,0);
 const pageTeam=state.team.length>4?Math.max(0,Math.min(1,s.teamPage||0)):0;
 s.teamPage=pageTeam;
 const slots=[[401,130,108,64],[515,130,104,64],[401,198,108,76],[515,198,104,76]];
 slots.forEach(([x,y,w,h],i)=>{
  const index=pageTeam*4+i;
  card(s,g,state,state.team[index],index,x,y,w,h);
 });
 if(state.team.length>4){
  rect(551,113,70,17,0x0b2849);
  txt(s,585,115,'EQUIPE '+(pageTeam+1)+'/2 ›',8,'#e4faff').setOrigin(.5,0);
  zone(s,584,120,74,20,()=>{s.teamPage=pageTeam===0?1:0;s.scene.restart()});
 }
 // Reference-art golden CTA has a real game action, not a mockup hotzone:
 // after a defeat it opens the capture flow; otherwise it starts tall grass.
 zone(s,514,313,225,55,()=>state.pendingCapture?
  s.captureScreen(state):finished?s.centerScreen(state):s.grassScreen(state));
 if(finished){
  rect(453,302,144,23,0xffcd55);
  txt(s,522,304,'★ CAMPEÃO DE KANTO',12,'#40290d',true).setOrigin(.5,0);
 }

}
