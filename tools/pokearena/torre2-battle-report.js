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
 try{return unique(listMoves(member).map(m=>String(m?.nombre||m?.name||m||'').trim()).filter(Boolean))}
 catch{return []} // Report must never prevent return to the campaign map.
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
  const known=new Set(safeList(old,listMoves).map(s=>s.toLowerCase()));
  for(const name of safeList(member,listMoves)){
   if(!known.has(name.toLowerCase()))moves.push({id:member.id,name});
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
 const extras=[
  ...report.evolutions.map(e=>display(e.from)+' → '+display(e.to)),
  ...report.moves.map(e=>'GOLPE: '+e.name.toUpperCase()),
  ...report.badges.map(e=>'INSÍGNIA: '+String(e).toUpperCase()),
  ...report.leagueHonors.map(e=>'LIGA: '+String(e).toUpperCase()),
  ...report.tms.map(e=>'TM: '+String(e).toUpperCase())
 ];
 const teaser=extras.slice(0,2).join('  ·  ')||
   (report.message||'RESULTADO SALVO, SEM ALTERAÇÃO DE PROGRESSO');
 label(320,280,teaser.length>94?teaser.slice(0,91)+'…':teaser,9,'#e4edfa',true);
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
