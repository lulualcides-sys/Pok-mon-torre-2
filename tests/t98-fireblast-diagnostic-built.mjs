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
