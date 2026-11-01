/* T07/T08 pure selector of legal, installed, type-relevant Kanto ULT VFX.
 * Inject verified FRLG/HGSS/B2W2/Let's Go level-up tables from the caller.
 * No asset, attack, TM or learnset is invented by this selector.
 * Runs against both source Node tests and compiled Phaser modules.
 */
const canonical=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const excluded=new Set([
 'tackle','scratch','pound','peck','low-kick','string-shot','growl','tail-whip',
 'harden','splash','teleport','whirlwind','transform','struggle','surf',
 'fissure','guillotine','horn-drill','sheer-cold','explosion','self-destruct',
 'perish-song','destiny-bond','metronome','mimic','super-fang','seismic-toss',
 'night-shade','sonic-boom','dragon-rage','counter','mirror-coat','endeavor',
 'bide','reversal','memento','belly-drum','double-edge','giga-impact',
 'focus-punch','solar-blade'
]);
// Share canonical exclusions with the explicit preferredSignature path.
// Elemental/physical Punch moves and Flamethrower are HAB2/HAB3 techniques,
// never a charged E ultimate (including Lv8 signature previews).
export const isKantoNormalAbilityName=name=>{
 const key=canonical(name);
 return key==='flamethrower'||key.endsWith('-punch');
};
export const isKantoSignatureUltNameAllowed=name=>{
 const key=canonical(name);
 return !excluded.has(key)&&!isKantoNormalAbilityName(key);
};
export function verifiedLevelUpNames(species,{
 levelUp={},earlyLevels={},verifiedTables=[],verifiedParents={}
}={}){
 const names=new Set([...Object.keys(levelUp),...Object.keys(earlyLevels)]
  .map(canonical));
 const seen=new Set();let id=species;
 while(id&&!seen.has(id)){
  seen.add(id);
  for(const table of verifiedTables)for(const name of Object.keys(table?.[id]||{}))
   names.add(canonical(name));
  id=verifiedParents[id]?.[0];
 }
 return names;
}
export function chooseKantoSignatureUlt(species,library,context={}){
 if(species==='ditto')return null; // no installed Transform renderer
 const types=context.speciesTypes||[];
 const blocked=context.blockedName?canonical(context.blockedName):null;
 const byName=new Map((library||[]).filter(m=>m?.forma&&m?.nombre&&
  !m.pendiente&&!m.torre2Unavailable&&!m.torre2RequiresTM&&!m.torre2RequiresHM)
  .map(m=>[canonical(m.nombre),m]));
 const verified=verifiedLevelUpNames(species,context);
 const matches=[...verified].map(key=>byName.get(key)).filter(m=>m&&
  (m.source!=='new-phaser-fx'||m.approved===true)&&
  isKantoSignatureUltNameAllowed(m.nombre)&&
  canonical(m.nombre)!==blocked&&Number(m.dano)>=6);
 matches.sort((a,b)=>{
  const score=m=>Number(types.includes(m.tipo))*75+
   Math.min(36,Number(m.dano)||0)+
   (['torre2_xscissor','torre2_shadowball','torre2_bonemerang',
     'torre2_triattack'].includes(m.forma)?3:0);
  return score(b)-score(a)||a.nombre.localeCompare(b.nombre);
 });
 return matches[0]||null;
}
