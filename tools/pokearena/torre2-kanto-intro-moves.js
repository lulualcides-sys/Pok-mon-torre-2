/* Campaign-only onboarding: three functional weak moves at Lv5, ULT at Lv8.
 * Practice abilities are now selectable campaign editor options with unique
 * IDs; they never masquerade as early full-power official FRLG moves.
 * Real FRLG unlocks/TM learnability and all original Arena 2D kits are intact.
 */

export const KANTO_INTRO=Object.freeze({
  start:5, ultAt:8, tutorialUntil:13, maxPreviewLearnLevel:16,
  maxStarterDamage:9, maxIntroUltDamage:12
});
const ATTACK_SLOTS=['lmb','rmb','q'];
const idOf=name=>String(name||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const lowPower=move=>Number.isFinite(move?.dano)&&move.dano>=0&&move.dano<=14&&
  Boolean(move?.forma)&&move.ulti!==true;
// A few Pokémon have only one genuine FireRed move at Lv5 (e.g. Magikarp,
// Ditto). They get a weak, generic Struggle-training fallback, NOT an
// incompatible elemental or evolved-species power.
function trainingMove(source,tag,slot,level,duplicate=false){
 const base=source||{};
 const nonnegative=Math.max(0,Number(base.dano)||0);
 const dmgCap=slot==='e'?KANTO_INTRO.maxIntroUltDamage:KANTO_INTRO.maxStarterDamage;
 const damage=Math.min(dmgCap,nonnegative);
 const move={...base,
  // Show the real installed move name. The temporary low damage is
  // a campaign-only balance property, not a separate attack named Treino.
  nombre:base.nombre,
  id:duplicate?String(base.id||idOf(base.nombre))+'-practice-'+slot:base.id||idOf(base.nombre),
  dano:damage,coste:Math.min(22,Math.max(4,Number(base.coste)||8)),
  cd:Math.min(9,Math.max(1.6,Number(base.cd)||4)),
  pendiente:false,torre2IntroPractice:true,
  torre2IntroSource:idOf(base.nombre),
  torre2PracticePreviewLevel:level};
 // Strong multi-hit, stat drain, OHKO, heal or charged-power side effects
 // from late game are never imported: only weak early FRLG entries feed here.
 if(slot==='e'){
  move.ulti=true;
  move.cd=Math.max(8,move.cd);
  move.coste=Math.min(30,Math.max(14,move.coste));
 }else delete move.ulti;
 delete move.torre2UnlockLevel;
 delete move.torre2UnlockEvolution;
 return move;
}
/** Campaign-only safety overlay. Respects player-equipped weak practice moves. */
export function resolveKantoIntro(member,installed,{library,canonical,earlyLevels={},levelUp={},unlockLevel}={}){
 const level=member?.progression?.level??5,id=member?.id;
 if(id==='mewtwo'||!id||level<KANTO_INTRO.start)return installed;
 // Ditto learns only Transform in FireRed. The temporary weak tutorial
 // manoeuvres solve Lv5 onboarding, never become invented endgame attacks.
 if(id==='ditto'&&level>KANTO_INTRO.tutorialUntil)return installed;
 const starterWindow=level<KANTO_INTRO.tutorialUntil;
 const complete=['lmb','rmb','q','e'].every(slot=>installed[slot]?.forma&&!installed[slot]?.pendiente);
 // Above level 12, respect every legitimate equipped attack verbatim.
 // Retain only the weak training placeholders in still-empty slots until a
 // real species move is learned, so level 13 never makes the ULT disappear.
 if(!starterWindow&&complete)return installed;
 const result={...installed};
 // ULT is not usable below level 8, even if an old save used E or an
 // accidentally equipped high-level finisher at Lv5.
 if(level<KANTO_INTRO.ultAt)delete result.e;
 const catalog=new Map();
 for(const move of library||[]){
  if(move?.nome||move?.nombre){
   const key=canonical?canonical(move.nombre||move.nome):idOf(move.nombre||move.nome);
   if(key&&!catalog.has(key))catalog.set(key,move);
  }
 }
 // Actual FireRed moves first, even when the renderer is from Poké Arena.
 // The very earliest not-yet-learned move can be briefly previewed at reduced
 // power ONLY in these tutorial battles. Learnset metadata stays authentic.
 // Lv5 starts must include meaningful species techniques: e.g. Ponyta
 // can train with a WEAK Ember preview, while authentic Ember still learns
 // at Lv14. Charmander never previews Metal Claw before its genuine Lv13.
 const previewLimit=id==='charmander'?10:KANTO_INTRO.maxPreviewLearnLevel;
 const official=Object.entries(levelUp)
  .filter(([key,at])=>at<=previewLimit)
  .sort((a,b)=>a[1]-b[1]||a[0].localeCompare(b[0]));
 const candidates=[];
 const push=(name,learned,priority=0)=>{
  const key=canonical?canonical(name):idOf(name);
  let move=catalog.get(key);
  // FireRed Charmander knows Scratch at Lv1. If the captured client lacks
  // its own Scratch renderer, reuse the already approved basic contact
  // animation at deliberately low power; never substitute Metal Claw.
  // This is only a campaign practice preview, not a new global move/VFX.
  if(!move&&id==='charmander'&&key==='scratch'&&catalog.has('tackle')){
   const base=catalog.get('tackle');
   move={...base,id:'scratch',nombre:'Scratch',tipo:'NORMAL',
    dano:Math.min(6,Number(base.dano)||5),torre2IntroFallbackFX:'tackle'};
  }
  if(!move||!lowPower(move)||candidates.some(x=>x.key===key))return;
  candidates.push({key,move,learned,priority});
 };
 for(const [name,at] of official)push(name,at,0);
 // Curated early-route adaptations are already in Torre 2; use their
 // species-specific Lv1–13 moves if official renderer is missing.
 for(const [name,at] of Object.entries(earlyLevels||{}))
  if(at<=previewLimit)push(name,at,1);
 // Already legitimately learned/equipped weaker moves remain candidates.
 for(const slot of ATTACK_SLOTS){
  const current=result[slot];
  if(current&&lowPower(current))push(current.nombre,(unlockLevel?.(id,current.nombre)??level),2);
 }
 candidates.sort((a,b)=>a.priority-b.priority||a.learned-b.learned||
  a.key.localeCompare(b.key));
 const picked=[];
 // Prefer three USABLE actions (damage before support) but retain Growl,
 // String Shot etc. where a species genuinely has fewer attacks.
 for(const c of [...candidates.filter(c=>c.move.dano>0),
                  ...candidates.filter(c=>!(c.move.dano>0))]){
  if(picked.length>=3)break;
  if(c.learned>previewLimit||picked.some(p=>p.key===c.key))continue;
  picked.push(c);
 }
 // Struggle is universal in Gen III when out of PP. Here, reuse an approved
 // non-elemental contact VFX for a deliberately weak practice manoeuvre.
 // Never make a Lv5 Magikarp use Hydro Pump, or Ditto a random Pokémon's move.
 const tackle=catalog.get('tackle');
 const first=picked.find(x=>x.move.dano>0)?.move||
   (tackle?{...tackle,nombre:'Struggle',tipo:'NORMAL',dano:4}:null)||
   picked[0]?.move;
 const fallback=first||[...catalog.values()].find(x=>lowPower(x)&&x.tipo==='NORMAL'&&x.dano>0);
 if(!fallback)return result; // fail closed instead of injecting an unrenderable ability
 // Evolved Pokémon at/after Lv13 often already have one or two legitimate
 // attacks in their slots. Reserve those names BEFORE filling blank slots:
 // otherwise the practice overlay may duplicate a real equipped move.
 const occupied=new Set();
 for(const slot of ATTACK_SLOTS){
  const actual=result[slot];
  if(actual?.forma&&!actual.pendiente&&
    (!starterWindow||actual.torre2IntroPractice||level>KANTO_INTRO.ultAt)){
   occupied.add(idOf(actual.torre2IntroSource||actual.nombre));
  }
 }
 const selected=[];
 for(let i=0;i<3;i++){
  const slot=ATTACK_SLOTS[i],actual=result[slot];
  // Player-equipped, power-capped practice is a real campaign option now:
  // don't replace it by an invisible, non-selectable tutorial projection.
  if(actual?.forma&&!actual.pendiente&&
     (!starterWindow||actual.torre2IntroPractice||level>KANTO_INTRO.ultAt)){
   selected.push(actual);
   continue;
  }
  const candidate=picked.find(c=>!occupied.has(idOf(c.move.nombre)));
  if(candidate){
   selected.push(trainingMove(candidate.move,candidate.key,slot,candidate.learned));
   occupied.add(idOf(candidate.move.nombre));
  }else{
   const copy={...fallback,nombre:'Struggle '+(i+1),tipo:'NORMAL',dano:Math.min(5,Number(fallback.dano)||4)};
   selected.push(trainingMove(copy,'struggle',slot,level,true));
   occupied.add(idOf(selected.at(-1).nombre));
  }
  result[slot]=selected.at(-1);
 }
 if(level>=KANTO_INTRO.ultAt){
  const ultCandidate=candidates.find(c=>!selected.some(x=>idOf(x.torre2IntroSource)===c.key)&&c.move.dano>0)
    ||candidates.find(c=>c.move.dano>0);
  const base=ultCandidate?.move||fallback;
  const finisher=trainingMove(base,idOf(base.nombre),'e',ultCandidate?.learned??level,true);
  finisher.nombre='ULT · '+String(base.nombre||'Struggle');
  if(!result.e?.forma||result.e?.pendiente||
     (starterWindow&&!result.e?.torre2IntroPractice))
   result.e=finisher;
 }
 return result;
}
