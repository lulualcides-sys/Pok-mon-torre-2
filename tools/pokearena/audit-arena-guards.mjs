// Audit only: inspect existing native shield VFX before selecting a 50% visual-only change.
// Intentionally never edits existing client source.
import fs from 'node:fs/promises';
import path from 'node:path';
const base=path.resolve('_site/arena2d');
const rootDirs=(await fs.readdir(base,{withFileTypes:true})).filter(x=>x.isDirectory()&&/^src-[0-9a-f]{10}$/.test(x.name));
if(rootDirs.length!==1)throw Error('Expected one captured Phaser module directory; got '+rootDirs.length);
const root=path.join(base,rootDirs[0].name);
const needles=['light screen','lightscreen','light_screen','pantalla luz','pantalla de luz','protect','proteccion','protección','proteção','barrera','barreira'];
const summary=[];
async function scan(dir){
 for(const ent of await fs.readdir(dir,{withFileTypes:true})){
  const file=path.join(dir,ent.name);
  if(ent.isDirectory()){if(!ent.name.startsWith('assets'))await scan(file);continue;}
  if(!ent.name.endsWith('.js'))continue;
  const content=await fs.readFile(file,'utf8'),lower=content.toLowerCase();
  const spans=[];
  for(const term of needles){let offset=0,count=0;
   while((offset=lower.indexOf(term,offset))>=0&&count++<15){
    const prev=content.slice(Math.max(0,offset-370),offset);
    const after=content.slice(offset,Math.min(content.length,offset+640));
    spans.push({term,offset,excerpt:(prev+after).replace(/\s+/g,' ').slice(0,950)});
    offset+=term.length;
   }
  }
  if(spans.length)summary.push({path:path.relative(root,file),chars:content.length,hits:spans.slice(0,26)});
 }
}
await scan(root);
console.log('NATIVE_GUARD_AUDIT',JSON.stringify(summary).slice(0,56000));
