// Original Pokémon Torre 2 implementation of the public Alpha 0.69.5
// League-access policy. No upstream code/assets, no save writes, no PvP backend.
const rivals=(league,getRivals)=>Array.isArray(getRivals(league))?getRivals(league):[];
export function regularLeaguesCleared(leagues,getRivals,won){
  if(!Array.isArray(leagues)||!leagues.some(l=>!l.conConexion))return false;
  return leagues.filter(l=>!l.conConexion)
    .every(l=>rivals(l,getRivals).length>0&&rivals(l,getRivals).every(r=>won(r.id)));
}
export function endgameLeagueAvailable(leagues,getRivals,won,legacyOpen=false){
  return !!legacyOpen||regularLeaguesCleared(leagues,getRivals,won)||
    leagues.some(l=>l.conConexion&&rivals(l,getRivals).some(r=>won(r.id)));
}
export function leagueOpponentAvailable(league,leagues,getRivals,won,legacyOpen=false){
  return !!league&&(!league.conConexion||
    endgameLeagueAvailable(leagues,getRivals,won,legacyOpen));
}
export function challengeAvailable(leagues,getRivals,won,legacyOpen=false,records=[]){
  return endgameLeagueAvailable(leagues,getRivals,won,legacyOpen)||
    records.some(r=>!!r&&(r.hecho===true||Number(r.mejor)>0));
}
