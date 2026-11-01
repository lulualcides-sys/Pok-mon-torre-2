/* Isolated Phaser build compatibility for a missing optional source asset.
 * Never change original source files, gameplay, inputs or active sprite keys.
 */
import fs from 'node:fs/promises';
import path from 'node:path';

const PRELOAD=/this\.load\.spritesheet\(\s*(["'])ui-balls\1\s*,\s*(["'])assets\/ui\/balls20\.png\2\s*,\s*(\{[^{}]{1,240}\})\s*\)\s*;?/g;

export function stripUnusedUiBallsPreload(source, consumers=[]) {
 if(typeof source!=='string')throw TypeError('Native preload source must be text');
 const matches=[...source.matchAll(PRELOAD)];
 if(matches.length!==1){
  const pos=source.indexOf('ui-balls');
  throw Error('Unknown/ambiguous native ui-balls preload ('+matches.length+'): '+
   source.slice(Math.max(0,pos-55),Math.max(0,pos)+180));
 }
 const [statement,, ,config]=matches[0];
 if(!/\bframeWidth\s*:\s*[1-9]\d*\b/.test(config)||
    !/\bframeHeight\s*:\s*[1-9]\d*\b/.test(config))
  throw Error('Native ui-balls frame metadata changed');
 const remaining=source.slice(0,matches[0].index)+source.slice(matches[0].index+statement.length);
 if(remaining.includes('ui-balls')||consumers.length)
  throw Error('Native ui-balls is referenced outside its optional preload: '+
   consumers.map(c=>c.path||c).slice(0,5).join(', '));
 return remaining;
}

export async function findNativeUiBallsConsumers(clientRoot){
 const stack=[clientRoot], consumers=[];
 const excluded=new Set(['assets','lib','torre2','node_modules','.git']);
 while(stack.length){
  const dir=stack.pop();
  for(const entry of await fs.readdir(dir,{withFileTypes:true})){
   const filename=path.join(dir,entry.name);
   if(entry.isDirectory()&&!excluded.has(entry.name)){stack.push(filename);continue}
   if(!entry.isFile()||!/\.m?js$/.test(entry.name)||
      entry.name==='carga.js'||entry.name==='phaser.min.js')continue;
   const content=await fs.readFile(filename,'utf8');
   if(content.includes('ui-balls'))
    consumers.push({path:path.relative(clientRoot,filename)});
  }
 }
 return consumers;
}
