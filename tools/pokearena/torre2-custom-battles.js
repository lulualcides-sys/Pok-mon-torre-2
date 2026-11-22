/* Pokémon Torre 2 — custom battles (owner 2026-11-22, README items 6 and 11).
 * Pure rules, no Phaser:
 *  - Luta personalizada (6): the player picks a level limit, an allowed type,
 *    how many Pokémon per side and the difficulty. A friendly match: the
 *    team enters with full HP and the campaign team is never changed.
 *  - Desafio personalizado (11): a series of 3/5/10 custom fights in a row
 *    with the same rules. HP carries over INSIDE the series only (kept in the
 *    run, never in the campaign team). Finishing the series gives money and
 *    items scaled by the difficulty and the rules chosen.
 * Moves, kits and VFX are the normal ones; nothing native changes.
 */
const list=v=>Array.isArray(v)?v:[];
export const CUSTOM_LEVELS=Object.freeze([null,10,20,30,50]);
export const CUSTOM_TYPES=Object.freeze([null,'NORMAL','FIRE','WATER','GRASS','ELECTRIC','ICE','FIGHTING','POISON',
 'GROUND','FLYING','PSYCHIC','BUG','ROCK','GHOST','DRAGON']);
export const TYPE_NAMES=Object.freeze({NORMAL:'Normal',FIRE:'Fogo',WATER:'Água',GRASS:'Planta',ELECTRIC:'Elétrico',ICE:'Gelo',
 FIGHTING:'Lutador',POISON:'Veneno',GROUND:'Terra',FLYING:'Voador',PSYCHIC:'Psíquico',BUG:'Inseto',ROCK:'Pedra',GHOST:'Fantasma',DRAGON:'Dragão'});
export const CUSTOM_SIZES=Object.freeze([1,2,3]);
export const CUSTOM_DIFFICULTY=Object.freeze({
 facil:{name:'Fácil',ai:'facil',levels:-3,reward:1},
 normal:{name:'Normal',ai:'normal',levels:0,reward:1.5},
 dificil:{name:'Difícil',ai:'dificil',levels:3,reward:2.2}
});
export const DIFFICULTY_KEYS=Object.freeze(Object.keys(CUSTOM_DIFFICULTY));
export const SERIES_LENGTHS=Object.freeze([3,5,10]);
// Legendary and one-of-a-kind species never appear as random opponents.
export const EXCLUDED=Object.freeze(['articuno','zapdos','moltres','mewtwo','mew','lugia','ho-oh','ditto']);
export function defaultRules(){return {level:null,type:null,size:3,difficulty:'normal',series:3}}
export function cleanRules(r={}){
 const d=defaultRules();
 return {level:CUSTOM_LEVELS.includes(r.level)?r.level:d.level,type:CUSTOM_TYPES.includes(r.type)?r.type:d.type,
  size:CUSTOM_SIZES.includes(r.size)?r.size:d.size,difficulty:CUSTOM_DIFFICULTY[r.difficulty]?r.difficulty:d.difficulty,
  series:SERIES_LENGTHS.includes(r.series)?r.series:d.series};
}
const OPTIONS={level:CUSTOM_LEVELS,type:CUSTOM_TYPES,size:CUSTOM_SIZES,difficulty:DIFFICULTY_KEYS,series:SERIES_LENGTHS};
export function cycleRule(rules,key,dir=1){
 const r=cleanRules(rules),opts=OPTIONS[key];if(!opts)return r;
 const i=opts.indexOf(r[key]);r[key]=opts[(i+(dir<0?-1:1)+opts.length)%opts.length];return r;
}
export function ruleLabel(rules,key){
 const r=cleanRules(rules);
 if(key==='level')return r.level?'Até Nv '+r.level:'Sem limite';
 if(key==='type')return r.type?TYPE_NAMES[r.type]:'Todos os tipos';
 if(key==='size')return r.size+' contra '+r.size;
 if(key==='difficulty')return CUSTOM_DIFFICULTY[r.difficulty].name;
 if(key==='series')return r.series+' lutas';
 return '';
}
// The player's Pokémon allowed by the rules: alive in the campaign (a
// fainted one cannot fight) and, if a type is chosen, having that type.
export function eligibleIndices(team,rules,typesOf){
 const r=cleanRules(rules);
 return list(team).map((m,i)=>({m,i})).filter(({m})=>m&&Number(m.hp??100)>0&&
  (!r.type||list(typesOf(m.id)).map(String).includes(r.type))).map(x=>x.i);
}
export function playerLevelFor(level,rules){const r=cleanRules(rules);return r.level?Math.min(Number(level)||5,r.level):Number(level)||5}
// Opponents: random species of the allowed type at the player's average
// (capped) level, shifted by the difficulty.
export function buildOpponents(rules,pool,playerLevels,random=Math.random){
 const r=cleanRules(rules);
 const candidates=list(pool).filter(p=>p&&!EXCLUDED.includes(p.id)&&(!r.type||list(p.types).includes(r.type)));
 if(!candidates.length)return [];
 const levels=list(playerLevels).filter(Number.isFinite);
 const avg=levels.length?Math.round(levels.reduce((a,b)=>a+b,0)/levels.length):10;
 const level=Math.max(3,Math.min(r.level||100,avg+CUSTOM_DIFFICULTY[r.difficulty].levels));
 const picked=[],used=new Set();
 for(let k=0;k<r.size;k++){
  let tries=0,c;
  do{c=candidates[Math.min(candidates.length-1,Math.floor(Math.max(0,Number(random())||0)*candidates.length))];tries++}
  while(used.has(c.id)&&tries<12&&used.size<candidates.length);
  used.add(c.id);picked.push({id:c.id,level});
 }
 return picked;
}
// Series reward: grows with length and difficulty; a type rule or a low level
// limit makes the series harder and pays a little more.
export function seriesReward(rules){
 const r=cleanRules(rules);
 const strict=1+(r.type?.15:0)+(r.level&&r.level<=20?.1:0);
 const money=Math.round(500*r.series*CUSTOM_DIFFICULTY[r.difficulty].reward*strict/50)*50;
 const items=r.series>=10?{ultraball:3,fullheal:2}:r.series>=5?{greatball:3,superpotion:2}:{potion:3};
 return {money,items};
}
// --- State (campaign save field "custom") -----------------------------------
export function customState(s){const c=s?.custom||{};return {rules:cleanRules(c.rules),fights:Number(c.fights)||0,wins:Number(c.wins)||0,
 seriesWon:Number(c.seriesWon)||0,bestSeries:Number(c.bestSeries)||0,run:c.run||null}}
export function startSeries(s,rules){
 const c=customState(s),r=cleanRules(rules);
 return {...s,custom:{...c,rules:r,run:{rules:r,fight:1,won:0,hp:{},id:Date.now().toString(36)}}};
}
export function abandonSeries(s){const c=customState(s);return {...s,custom:{...c,run:null}}}
export function customToken(s,mode){const c=customState(s);return 'custom-'+mode+'-'+c.fights+'-'+(c.run?.fight||0)+'-'+(c.run?.id||'x')}
// Result of one custom fight. hpAfter: {uid: hp%} of the player's fighters.
export function resolveCustomResult(s,mode,won,hpAfter={}){
 const c=customState(s),next={...s,custom:{...c,fights:c.fights+1,wins:c.wins+(won?1:0)}};
 if(mode!=='series'||!c.run)return {state:next,message:won?'Vitória na luta personalizada!':'Derrota na luta personalizada.',done:false,reward:null};
 const run={...c.run,hp:{...c.run.hp,...hpAfter}};
 if(!won){next.custom.run=null;
  return {state:next,done:true,reward:null,message:'Desafio encerrado na luta '+run.fight+' de '+run.rules.series+'. Tente de novo!'}}
 run.won++;
 if(run.won>=run.rules.series){
  const reward=seriesReward(run.rules);
  next.custom.run=null;next.custom.seriesWon=c.seriesWon+1;next.custom.bestSeries=Math.max(c.bestSeries,run.rules.series);
  next.money=(Number(s.money)||0)+reward.money;
  next.inventory={...(s.inventory||{})};
  for(const [k,v] of Object.entries(reward.items))next.inventory[k]=(Number(next.inventory[k])||0)+v;
  return {state:next,done:true,reward,message:'Desafio personalizado completo! +$'+reward.money+' e itens.'};
 }
 run.fight++;next.custom.run=run;
 return {state:next,done:false,reward:null,message:'Vitória! Próxima luta: '+run.fight+' de '+run.rules.series+'.'};
}
