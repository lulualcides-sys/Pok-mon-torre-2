'use strict';
async function main(){
 const root='https://ranked.pokemonbattlegrounds.com';
 for(const path of ['/app.js','/bundles/03413a73844b301c.js']){
  const r=await fetch(root+path,{signal:AbortSignal.timeout(55000)});
  if(!r.ok)throw Error('HTTP '+r.status);
  const code=await r.text();
  console.log('PUBLIC_SCRIPT',path,'BYTES',code.length);
  const patterns=['move1','move2','move3','move4','switch1','switch2','switch3','steerFromKeys','keydown','keyCode','Digit1','Digit2','Digit3','Digit4','KeyQ','KeyW','KeyE','KeyR','WASD','Space','askSwitch','useMove','castMove'];
  for(const pattern of patterns){
   let i=-1,c=0,contexts=[];
   while((i=code.indexOf(pattern,i+1))!==-1){
    c++;
    if(contexts.length<4){
     let s=code.slice(Math.max(0,i-130),Math.min(code.length,i+pattern.length+190)).replace(/\s+/g,' ');
     contexts.push({offset:i,excerpt:s});
    }
   }
   if(c)console.log('KEY_CONTEXT',JSON.stringify({script:path,pattern,count:c,contexts}));
  }
 }
}
main().catch(e=>{console.error(e.stack||e);process.exitCode=1});
