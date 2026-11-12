// Backport only the League 0.69.5 access rule to an ALREADY approved
// original native client. Unknown source layouts fail closed.
const normalize=(s)=>String(s||'');
function replaceOne(source,pattern,replacement,label){
 const occurrences=[...source.matchAll(new RegExp(pattern.source,pattern.flags.includes('g')?pattern.flags:pattern.flags+'g'))];
 if(occurrences.length!==1)throw Error('Unrecognized native '+label+' ('+occurrences.length+' matches)');
 return source.replace(pattern,replacement);
}
function addImport(source,from,identifiers){
 const target=new RegExp('import\\{([^}]+)\\}from"'+from.replace(/[.*+?^${}()|[\\]\\]/g,'\\$&')+'";');
 // Import strings have a fixed, audited relative path.
 const found=source.match(target);
 if(!found)throw Error('Missing expected League import '+from);
 const names=found[1].split(',').map(x=>x.trim());
 for(const name of identifiers)if(!names.includes(name))names.push(name);
 return source.replace(found[0],'import{'+names.join(',')+'}from"'+from+'";');
}
export function backportLeague0695({league,scene,challenges}){
 for(const [name,source] of Object.entries({league,scene,challenges}))
  if(typeof source!=='string'||source.length<150)throw Error('Missing native '+name+' source');
 if(league.includes('import{leagueOpponentAvailable}from"./torre2/league-0695.js";'))
  throw Error('League 0.69.5 compatibility already installed; refusing double patch');
 if(!league.includes('function estadoRival(id)')||!scene.includes('copaCerrada(k)')||
    !challenges.includes('const retosAbiertos='))
  throw Error('Native League structure changed; refusing implicit update');
 const nextLeague=replaceOne(league,
  /function estadoRival\(id\)\{[\s\S]*?\}(?=function vencer\(id,)/,
  'function estadoRival(id){if(vencido(id))return"vencido";const liga=LIGA.ligas.find(l=>rivalesDe(l).some(r=>r.id===id));if(!liga)return"cerrado";return leagueOpponentAvailable(liga,LIGA.ligas,rivalesDe,vencido,!!progreso().abierta)?"abierto":"cerrado"}',
  'estadoRival');
 const nextScene=replaceOne(scene,
  /copaCerrada\(k\)\{[\s\S]*?\}(?=cuentaCopa\(k\))/,
  'copaCerrada(k){if(k===KR)return!retosAbiertos();const l=LIGA.ligas[k];return!l||!!l.conConexion&&!endgameLeagueAvailable(LIGA.ligas,rivalesDe,vencido,!!progreso().abierta)}',
  'copaCerrada');
 const nextChallenges=replaceOne(challenges,
  /const retosAbiertos=\(\)=>vencido\(RIVAL_LLAVE\);/,
  'const retosAbiertos=()=>challengeAvailable(LIGA.ligas,rivalesDe,vencido,!!progreso().abierta,RETOS.map(r=>record(r.id)));',
  'retosAbiertos');
 return {
  league:'import{leagueOpponentAvailable}from"./torre2/league-0695.js";'+nextLeague,
  scene:'import{endgameLeagueAvailable}from"../torre2/league-0695.js";'+nextScene
   .replaceAll('LOCKED · BEAT MEWTWO IN CERULEAN CAVE TO UNLOCK THE CHALLENGES',
               'LOCKED · CLEAR ALL LEAGUES TO UNLOCK THE CHALLENGES')
   .replaceAll('LOCKED · CLEAR THE PREVIOUS LEAGUE FIRST',
               'LOCKED · CLEAR ALL LEAGUES TO UNLOCK HELL LEAGUE'),
  challenges:'import{challengeAvailable}from"./torre2/league-0695.js";'+
   addImport(nextChallenges,'./liga.js',['progreso'])
 };
}
