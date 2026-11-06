/* Kanto gym-only earned move selection. No VFX, metadata, save or TM edits.
 * Give leaders up to two more effective ALREADY-AVAILABLE attacks; keep
 * base LMB, native Dodge, authored Surge lineup and all level/ULT locks.
 */
const name=x=>String(x?.torre2IntroSource||x?.nombre||'').replace(/^ULT · /,'').toLowerCase();
const score=(m,types,slot)=>{
 if(!m?.forma||m.pendiente||m.torre2Unavailable)return -Infinity;
 const dmg=Number(m.dano)||0,reach=Math.max(0,Number(m.alcance??m.largo??0));
 const cd=Math.max(2,Number(m.cd)||6);
 return (dmg*(types.includes(m.tipo)?1.25:1)*(slot==='e'?2:1))*
    Math.max(.6,Math.min(1.2,6/cd))+Math.min(2,reach/170)+
    (slot==='q'&&dmg===0?3:0)-(m.torre2IntroPractice?4:0);
};
export function improveGymLeaderLoadout({id,level,loadout,available,slotReason,types=[]}={}){
 if(!id||!Number.isFinite(level)||!loadout||
    !Array.isArray(available)||typeof slotReason!=='function')return loadout;
 const member={id,progression:{species:id,level}};
 const out={...loadout},used=new Set(Object.values(out).map(name));
 let changes=0;
 for(const [slot,index] of [['rmb',1],['q',2],['e',3]]){
  if(changes>=2)break;
  const current=out[slot],base=score(current,types,slot);
  const candidates=available.filter(m=>m?.forma&&!m.pendiente&&
   !m.torre2Unavailable&&!m.torre2RequiresTM&&!m.torre2RequiresHM&&
   Number(m.dano)>0&&m.id!==current?.id&&!used.has(name(m))&&
   !slotReason(member,index,m));
  candidates.sort((a,b)=>score(b,types,slot)-score(a,types,slot));
  const best=candidates[0];
  if(!best||score(best,types,slot)<base+(slot==='e'?2.6:3.4))continue;
  if(current)used.delete(name(current));
  out[slot]={...best,pendiente:false,ulti:slot==='e'};
  used.add(name(best));changes++;
 }
 return out;
}
