import fs from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve('_site/arena2d');
const version=JSON.parse(await fs.readFile(path.join(root,'version.json'),'utf8')).modules;
for(const name of ['escenas/combate.js','escenas/batalla.js','ia.js','controles.js','tactil.js']){
 try{
 const s=await fs.readFile(path.join(root,version,name),'utf8');
 const terms=['create(){','update(dt','update(t','controles[0]','controles[1]','luchadores[0]','new IA','new Cpu','new CPU','this.ia','IA(','leer(','class Combate','class Batalla','fase===','fase==','init('];
 const found=[];
 for(const term of terms){let i=0,n=0;while((i=s.indexOf(term,i))>=0&&n++<6){found.push({term,offset:i,preview:s.slice(Math.max(0,i-250),i+750)});i+=term.length;}}
 found.sort((a,b)=>a.offset-b.offset);
 const small=found.slice(0,35).map(({term,offset,preview})=>({term,offset,preview}));
 console.log('CLIENT_BATTLE_AUDIT',JSON.stringify({name,length:s.length,head:s.slice(0,2600),hits:small}).slice(0,35500));
 }catch(e){console.log('CLIENT_BATTLE_MISSING',name,String(e))}
}
