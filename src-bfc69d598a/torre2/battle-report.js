/* Pokémon Torre 2 — report-only battle summary.
 * Reads before/after snapshots AFTER the established campaign resolver commits.
 * Never grants EXP, money, TM, badges or writes to localStorage.
 * No approved move/VFX renderer or encounter state is modified.
 */
const num=value=>Number.isFinite(Number(value))?Number(value):0;
const unique=value=>Array.isArray(value)?[...new Set(value)]:[];
const display=id=>String(id||'').replace(/[-_]+/g,' ').toUpperCase();
const delta=(before,after)=>unique(after).filter(x=>!unique(before).includes(x));
const uid=(member,index)=>member?.uid||'index:'+index;
const safeList=(member,listMoves)=>{
 if(typeof listMoves!=='function'||!member)return [];
 try{
  // The Lv8 capped charged preview and its earned full-power native version
  // deliberately share a human-readable NAME but have DIFFERENT MOVE IDs.
  // Compare installed identity, not the label: otherwise the battle report
  // hides the player's genuine later level unlock (Hydro Pump, Fire Blast).
  const seen=new Set(),items=[];
  for(const move of listMoves(member)||[]){
   const name=String(move?.nombre||move?.name||move||'').trim();
   const key=String(move?.id||name.toLowerCase()).trim().toLowerCase();
   if(!name||!key||seen.has(key))continue;
   seen.add(key);
   items.push({key,name,practice:move?.torre2IntroPractice===true,
    preview:move?.torre2IntroPractice===true&&move?.torre2IntroSlot==='e'});
  }
  return items;
 }catch{return []} // A report failure must never trap the saved campaign.
};
export function makeBattleReport(before,after,outcome,{
 kind='trainer',listMoves=null,tmNames={}
}={}){
 if(!before||!after||!outcome||typeof outcome.won!=='boolean')return null;
 const previous=Array.isArray(before.team)?before.team:[];
 const now=Array.isArray(after.team)?after.team:[];
 const beforeByUid=new Map(previous.map((m,i)=>[uid(m,i),m]));
 const gains=outcome.sharedExp||outcome.shared?.gains||[];
 const byUid=new Map(gains.map(g=>[g.uid,g]));
 const evolutions=[],moves=[],team=[];
 now.forEach((member,index)=>{
  const old=beforeByUid.get(uid(member,index))||previous[index];
  if(!old)return;
  const levelBefore=num(old.progression?.level),levelAfter=num(member.progression?.level);
  const gain=byUid.get(uid(member,index))||gains.find(g=>g.index===index);
  const experience=Math.max(0,num(gain?.reward));
  team.push({id:member.id,from:old.id,levelBefore,levelAfter,
   experience,tester:Boolean(gain?.tester)});
  if(old.id!==member.id)evolutions.push({from:old.id,to:member.id});
  const previously=safeList(old,listMoves);
  const known=new Set(previously.map(move=>move.key));
  const previews=new Set(previously.filter(move=>move.practice)
   .map(move=>move.name.toLowerCase()));
  for(const move of safeList(member,listMoves)){
   if(known.has(move.key))continue;
   const learned={id:member.id,name:move.name};
   if(move.preview)learned.preview=true;
   else if(!move.practice&&previews.has(move.name.toLowerCase()))
    learned.fullPower=true;
   moves.push(learned);
  }
 });
 const gymBadges=delta(before.badges,after.badges);
 const leagueHonors=delta(before.leagueHonors,after.leagueHonors);
 const claims=delta(before.gymTMClaims,after.gymTMClaims);
 return {
  kind,won:outcome.won,title:outcome.won?'VITÓRIA!':'DERROTA',
  message:String(outcome.message||after.lastMessage||''),
  money:Math.max(0,num(after.money)-num(before.money)),
  team, evolutions, moves,
  badges:gymBadges,leagueHonors,
  tms:claims.map(id=>tmNames[id]||display(id)),
  winCount:num(after.wins)-num(before.wins),
  defeatCount:num(after.losses)-num(before.losses)
 };
}
/** Human-readable reward events; the recipient is always displayed FIRST.
 * The compact labels preserve both species and learned move on small screens.
 * Never recalculate unlocks or mutate the campaign snapshot here.
 */
export function battleReportDetailLines(report){
 if(!report)return [];
 return [
  ...report.evolutions.map(e=>display(e.from)+' → '+display(e.to)),
  ...report.moves.map(e=>display(e.id)+': '+
   (e.preview?'ULT INICIAL (REDUZIDA) · ':
    e.fullPower?'GOLPE COMPLETO · ':'NOVO GOLPE · ')+
   String(e.name||'').toUpperCase()),
  ...report.badges.map(e=>'INSÍGNIA: '+String(e).toUpperCase()),
  ...report.leagueHonors.map(e=>'LIGA: '+String(e).toUpperCase()),
  ...report.tms.map(e=>'TM: '+String(e).toUpperCase())
 ];
}
/* Low-cost native Phaser pixel UI; all input stays in the battle-path scene.
 * Interactive topmost backdrop prevents clicks passing through to trainers,
 * reset, shop, or another encounter while results are being read.
 */
export function showBattleReport(scene,report){
 if(!scene?.add||!report)return null;
 const depth=9000, objects=[];
 const track=item=>{objects.push(item);return item};
 const blocker=track(scene.add.zone(320,180,640,360).setDepth(depth).setInteractive());
 blocker.setData?.('torre2-report-blocker',true);
 const g=track(scene.add.graphics().setDepth(depth+1));
 g.fillStyle(0x050d1c,.94).fillRect(0,0,640,360);
 g.fillStyle(0x112940,.99).fillRoundedRect(30,17,580,324,9);
 g.lineStyle(2,report.won?0xd9ae59:0xd47273,1).strokeRoundedRect(30,17,580,324,9);
 g.fillStyle(report.won?0x224c3a:0x593038,.9).fillRoundedRect(51,36,538,62,5);
 g.fillStyle(0x213951).fillRoundedRect(51,111,538,147,4);
 g.fillStyle(0x1a334b).fillRoundedRect(51,264,538,33,4);
 const label=(x,y,value,size=11,color='#f4f4ee',center=false)=>{
  const t=track(scene.add.text(x,y,String(value),{
   fontFamily:'Pixelify Sans,monospace',fontSize:size+'px',
   color,stroke:'#061021',strokeThickness:2
  }).setDepth(depth+2));
  if(center)t.setOrigin(.5);return t;
 };
 label(320,54,report.title,22,report.won?'#b6f4c8':'#ffb4b4',true);
 const type={trainer:'TREINADOR',wild:'SELVAGEM',rematch:'REVANCHE'}[report.kind]||'BATALHA';
 label(320,80,type+'   +$'+report.money+'   '+report.badges.length+' INSÍGNIA(S)',10,'#f9de95',true);
 label(66,120,'EXPERIÊNCIA DA EQUIPE',11,'#f9de95');
 const listed=report.team.slice(0,6);
 listed.forEach((member,index)=>{
  const y=142+index*19;
  const level=member.levelAfter>member.levelBefore?
   'NV '+member.levelBefore+' → '+member.levelAfter:'NV '+member.levelAfter;
  label(66,y,display(member.id).slice(0,17),10,'#edf4f9');
  label(286,y,level,9,member.levelAfter>member.levelBefore?'#a7efac':'#a8c3d5');
  label(452,y,member.tester?'TESTE':('+'+member.experience+' XP'),9,'#d6e8ef');
 });
 if(!listed.length)label(66,157,'SEM ALTERAÇÕES NA EQUIPE',11,'#b3c4d3');
 const extras=battleReportDetailLines(report);
 // Every reward must remain inspectable, even after six evolutions or
 // several newly learned moves. Two readable lines per page (not a clipped
 // concatenation that silently hides later TMs and league honors).
 const pages=Math.max(1,Math.ceil(extras.length/2));
 let detailPage=0;
 const line1=label(305,274,'',9,'#e4edfa',true);
 const line2=label(305,286,'',9,'#e4edfa',true);
 const compact=value=>value.length>71?value.slice(0,68)+'…':value;
 const renderDetails=()=>{
  const block=extras.slice(detailPage*2,detailPage*2+2);
  line1.setText(compact(block[0]||report.message||'RESULTADO SALVO'));
  line2.setText(compact(block[1]||''));
 };
 renderDetails();
 if(pages>1){
  label(571,280,'▶',13,'#f9de95',true);
  const next=track(scene.add.zone(570,280,29,32)
   .setDepth(depth+5).setInteractive({useHandCursor:true}));
  next.setData?.('torre2-report-more',true);
  next.on('pointerdown',(_p,_x,_y,event)=>{
   event?.stopPropagation?.();
   detailPage=(detailPage+1)%pages;
   renderDetails();
  });
 }
 const caption=label(320,321,'CONTINUAR  ▶',13,'#201d16',true);
 const buttonBg=track(scene.add.graphics().setDepth(depth+3));
 buttonBg.fillStyle(0xf4c85e).fillRoundedRect(220,302,200,34,4);
 buttonBg.lineStyle(1,0xffedbd).strokeRoundedRect(220,302,200,34,4);
 caption.setDepth(depth+4);
 const click=track(scene.add.zone(320,319,200,34).setDepth(depth+5).setInteractive({useHandCursor:true}));
 click.setData?.('torre2-report-continue',true);
 let dismissed=false;
 const dismiss=()=>{
  if(dismissed)return;
  dismissed=true;
  for(const obj of objects)obj.destroy();
 };
 click.on('pointerdown',(_pointer,_x,_y,event)=>{event?.stopPropagation?.();dismiss()});
 scene.events?.once('shutdown',dismiss);
 scene.events?.once('destroy',dismiss);
 return {dismiss,report,button:click,blocker};
}
