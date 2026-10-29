/* Arena 2D evasions for Torre 2-added Pokémon only.
 * Reuse literal ORIGINAL Poké Arena 2D ESP moves (including their Phaser
 * renderers, animations and hitboxes); NO invented pixel art or native edits.
 * A Pokémon gets an existing native move in ESP, not a generic CSS tween.
 */
export const ARENA_NATIVE_EVASION_PRESETS=Object.freeze({
 'Thread Swing':'caterpie metapod weedle kakuna paras parasect venonat tangela oddish gloom vileplume bellsprout weepinbell victreebel',
 'Fly':'butterfree beedrill pidgeotto pidgeot spearow fearow venomoth farfetchd aerodactyl moltres dragonite',
 'Acrobatics':'pidgey pidgeotto pidgeot fearow beedrill butterfree venomoth scyther farfetchd doduo dodrio hitmonlee primeape',
 'Rollout':'sandshrew sandslash geodude graveler golem voltorb electrode shellder cloyster omanyte omastar kabuto kabutops',
 'Dig':'diglett dugtrio nidoqueen nidoking cubone marowak rhyhorn rhydon sandslash sandshrew',
 'Teleport':'clefairy clefable abra kadabra alakazam drowzee hypno mr-mime jynx porygon mew',
 'Dive':'psyduck golduck poliwag poliwhirl poliwrath tentacool tentacruel slowpoke slowbro seel dewgong krabby kingler horsea seadra goldeen seaking lapras vaporeon',
 'Rapid Spin':'staryu starmie shellder cloyster kabuto kabutops omanyte omastar',
 'Flame Charge':'vulpix ninetales growlithe arcanine flareon magmar moltres',
 'Bullet Punch':'mankey primeape hitmonlee hitmonchan',
 'Feint Attack':'ekans arbok grimer muk koffing weezing lickitung kangaskhan pinsir',
 'Agility':'magnemite magneton voltorb electrode scyther electabuzz jolteon dratini dragonair dragonite aerodactyl tauros pinsir porygon mew',
 'Quick Attack':'rattata raticate nidoran-f nidorina nidoran-m nidorino meowth persian mankey primeape eevee jolteon doduo dodrio tauros kangaskhan electabuzz',
 'Volt Tackle':'jolteon electabuzz magneton magnemite',
 'Vine Whip':'oddish gloom vileplume bellsprout weepinbell victreebel tangela'
});
const idOf=s=>String(s||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
export const ARENA_NATIVE_DODGE_FORMS=Object.freeze(['dash','vuelo']);
export function dodgeOptionsForSpecies(species){
 const id=idOf(species),result=[];
 for(const [name,group] of Object.entries(ARENA_NATIVE_EVASION_PRESETS))
  if(group.split(/\s+/).includes(id))result.push(name);
 // Keep a real physical fallback; never build a fake sprite or edit a
 // source-client move just to make a novelty animation.
 result.push('Quick Attack','Agility','Acrobatics','Tackle','Teleport');
 return [...new Set(result)];
}
export function selectNativeDodge(species,moveNames,templates,original){
 const selected=new Set(moveNames.map(idOf));
 for(const name of dodgeOptionsForSpecies(species)){
  const native=templates.get(idOf(name));
  if(!native?.nombre||!ARENA_NATIVE_DODGE_FORMS.includes(native.forma))continue;
  if(selected.has(idOf(native.nombre)))continue;
  // Copy only: freeze the native client and approved effects.
  return {...native,pendiente:false,torre2ArenaNativeEvasion:true};
 }
 return original;
}
