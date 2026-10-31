'use strict';
// Diagnose public UI semantics. Only prints short source-adjacent excerpts to CI logs.
// Does not store or redistribute full external source or session data in repository.
async function main(){
 const r=await fetch('https://ranked.pokemonbattlegrounds.com/app.js',{signal:AbortSignal.timeout(25000)});
 if(!r.ok)throw Error('HTTP '+r.status);
 const s=await r.text();
 const expressions=['pracLevels','Find unranked battle','The server is full right now','queueCount','queueInfo','practice','Unranked','botLevel'];
 for(const k of expressions){
  let n=0,idx=-1;
  while((idx=s.toLowerCase().indexOf(k.toLowerCase(),idx+1))>=0&&n<5){
    const excerpt=s.slice(Math.max(0,idx-150),Math.min(s.length,idx+k.length+220)).replace(/https?:\/\/[^\s"']+/g,'<url>').replace(/\s+/g,' ');
    console.log('CONTEXT',JSON.stringify({key:k,index:idx,excerpt}));
    n++;
  }
  if(!n)console.log('ABSENT',k);
 }
}
main().catch(e=>{console.error(e.stack||e);process.exitCode=1});
