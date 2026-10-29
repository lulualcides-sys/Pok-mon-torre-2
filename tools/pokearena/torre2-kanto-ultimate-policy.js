/* Torre 2 T07/T08: species-specific preview ULTs from real INSTALLED VFX.
 * FireRed is the canonical learnset; HGSS, B2W2 and Let's Go offer verified
 * supplementary level-up moves (NEVER machines/tutors/eggs/events).
 * Preview does NOT teach the late move nor weaken/modify the source VFX.
 */
import {KANTO_151} from './all-kanto-species.js';
import {FRLG_LEVEL_UP,KANTO_LEVEL_EVOLUTIONS} from './frlg-learnsets.js';
import {GEN4_HGSS_KANTO_LEVEL_UP,GEN5_B2W2_KANTO_LEVEL_UP}
 from './gen45-kanto-learnsets.js';
import {GEN7_LETSGO_LEVEL_UP} from './gen7-letsgo-learnsets.js';
import {EARLY_KANTO_LEARNSETS} from './early-kanto-species.js';

const speciesTypes=new Map(KANTO_151.map(p=>[p.id,p.tipos]));
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
const verifiedTables=[FRLG_LEVEL_UP,GEN4_HGSS_KANTO_LEVEL_UP,
 GEN5_B2W2_KANTO_LEVEL_UP,GEN7_LETSGO_LEVEL_UP,EARLY_KANTO_LEARNSETS];
// The parent carries naturally learned moves into its evolved stage. This
// never grants a future evolution's move to a lower stage.
export function verifiedLevelUpNames(species){
 const names=new Set(),seen=new Set();let id=species;
 while(id&&!seen.has(id)){
  seen.add(id);
  for(const table of verifiedTables)for(const name of Object.keys(table[id]||{}))
   names.add(canonical(name));
  id=KANTO_LEVEL_EVOLUTIONS[id]?.[0];
 }
 return names;
}
export function chooseKantoSignatureUlt(species,library){
 if(species==='ditto')return null; // no installed Transform renderer
 const types=speciesTypes.get(species)||[];
 const byName=new Map((library||[]).filter(m=>m?.forma&&m?.nombre)
  .map(m=>[canonical(m.nombre),m]));
 const verified=verifiedLevelUpNames(species);
 // A signature is learned naturally in FRLG or an explicitly verified
 // supplementary generation, not merely because the species has a type.
 const matches=[...verified].map(key=>byName.get(key)).filter(m=>m&&
  (m.source!=='new-phaser-fx'||m.approved===true)&&
  !excluded.has(canonical(m.nombre))&&Number(m.dano)>=6);
 // Prefer actual same-type attacks and visibly meaningful effects;
 // raw damage alone would give unrelated Hyper Beam to every species.
 matches.sort((a,b)=>{
  const score=m=>Number(types.includes(m.tipo))*75+
   Math.min(36,Number(m.dano)||0)+
   (['torre2_xscissor','torre2_shadowball','torre2_bonemerang',
     'torre2_triattack'].includes(m.forma)?3:0);
  return score(b)-score(a)||a.nombre.localeCompare(b.nombre);
 });
 return matches[0]||null;
}
