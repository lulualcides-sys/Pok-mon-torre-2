import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const root=path.resolve(process.env.PREVIEW_ROOT||'_site','arena2d');
const modules=JSON.parse(fs.readFileSync(path.join(root,'version.json'),'utf8')).modules;
const source=path.join(root,modules,'torre2/move-pool.js');
const {TEST_LIBRARY}=await import(pathToFileURL(source));
const move=TEST_LIBRARY.find(x=>x.id==='fire-blast');
if(!move)throw Error('Fire Blast absent from approved library');
console.log('FIRE_BLAST_NATIVE_PARAMETERS',JSON.stringify(move));
const bundle=path.join(root,modules,'efectos.js');
if(fs.existsSync(bundle)){
 const text=fs.readFileSync(bundle,'utf8');
 console.log('FIRE_BLAST_RENDERER_MATCH',JSON.stringify({forma:move.forma,
  occurrences:(text.match(new RegExp(move.forma.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'g'))||[]).length,
  rendererContext:text.slice(Math.max(0,text.indexOf(move.forma)-150),
   text.indexOf(move.forma)+500)}));
}

// Confirm how the captured Phaser projectile renderer uses the cosmetic
// fields before reducing echo/linger cost; no asset bytes are modified.
const roots=[path.join(root,modules),path.join(root,'src'),
 path.resolve('site-capture/pokearena-client'),root];
let examined=0,found=0;
for(const base of roots){
 if(!fs.existsSync(base))continue;
 const stack=[base];
 while(stack.length&&examined<500){
  const dir=stack.pop();
  for(const ent of fs.readdirSync(dir,{withFileTypes:true})){
   const p=path.join(dir,ent.name);
   if(ent.isDirectory()){if(stack.length<80)stack.push(p);continue;}
   if(!ent.name.endsWith('.js'))continue;
   if(fs.statSync(p).size>1_500_000)continue;
   examined++;
   const code=fs.readFileSync(p,'utf8');
   for(const key of ['.ecos','.arde']){
    let i=code.indexOf(key);if(i<0||found++>=12)continue;
    console.log('FIRE_BLAST_NATIVE_RENDER_USAGE',JSON.stringify({file:path.relative(root,p),key,
     around:code.slice(Math.max(0,i-250),i+500)}));
   }
  }
 }
}
