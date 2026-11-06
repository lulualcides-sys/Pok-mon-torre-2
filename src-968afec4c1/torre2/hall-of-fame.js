/* Pokémon Torre 2 — read-only Hall of Fame view model.
 * A title screen is earned only through the existing Kanto campaign resolver.
 * Never invent badges, awards or species; never changes save/inventory.
 */
export const KANTO_CHAMPION_STAGE=13;
export const HALL_GYM_BADGES=Object.freeze([
 'Rocha','Cascata','Trovao','Arco-Iris','Alma','Pantano','Vulcao','Terra'
]);
export const HALL_LEAGUE_AWARDS=Object.freeze([
 'Elite 1','Elite 2','Elite 3','Elite 4','Campeão'
]);
const safeArray=v=>Array.isArray(v)?v:[];
const safeNumber=v=>Number.isFinite(Number(v))?Math.max(0,Math.floor(Number(v))):0;
export function hallOfFameModel(state){
 if(!state?.champion||safeNumber(state.stage)<KANTO_CHAMPION_STAGE)return null;
 const team=safeArray(state.team).slice(0,6).filter(p=>p&&typeof p.id==='string'&&p.id);
 const badges=HALL_GYM_BADGES.filter(name=>safeArray(state.badges).includes(name));
 const honors=HALL_LEAGUE_AWARDS.filter(name=>safeArray(state.leagueHonors).includes(name));
 return Object.freeze({
  title:'SALÃO DA FAMA',stage:safeNumber(state.stage),champion:true,
  team:team.map(p=>Object.freeze({id:p.id,uid:p.uid||'',
   level:safeNumber(p.progression?.level),hp:Math.min(100,safeNumber(p.hp))})),
  badgeCount:badges.length,honorCount:honors.length,
  badges,honors,wins:safeNumber(state.wins),losses:safeNumber(state.losses),
  money:safeNumber(state.money),
  complete:badges.length===8&&honors.length===5
 });
}
