#!/usr/bin/env node
// Verify a complete, previously published Phaser build before restoring it.
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const critical=[
 'config.js','main.js','datos.js','liga.js','retos.js',
 'escenas/carga.js','escenas/titulo.js','escenas/combate.js',
 'escenas/liga.js','torre2/campanha.js','torre2/move-pool.js',
 'torre2/auto-battle.js','torre2/next-specific-fx.js'
];
async function needed(root,rel,min=100){
 let s;
 try{s=await fs.stat(path.join(root,rel));}
 catch(error){if(error?.code==='ENOENT')throw Error('Missing/truncated release asset: '+rel);throw error;}
 if(!s.isFile()||s.size<min)throw Error('Missing/truncated release asset: '+rel);
}
const read=(root,rel)=>fs.readFile(path.join(root,rel),'utf8');
export async function verifyPublishedFallback(root){
 if(typeof root!=='string'||!root)throw Error('Fallback directory is required');
 root=path.resolve(root);
 const approved=JSON.parse(await fs.readFile('data/pokearena-approved-alpha.json','utf8'));
 if(!/^0\.\d+\.\d+$/.test(approved.approvedAlpha||''))
  throw Error('Approved native Alpha is unknown');
 const core=['index.html','lab.html','arena2d/index.html','arena2d/version.json',
   'arena2d/lib/phaser.min.js','arena2d/assets/pmd/manifest.json'];
 for(const file of core)await needed(root,file,file.endsWith('.json')?30:100);
 const version=JSON.parse(await read(root,'arena2d/version.json'));
 if(!/^src-[a-f0-9]{10}$/.test(version.src)||!/^src-[a-f0-9]{10}$/.test(version.modules))
  throw Error('Cached Pages module hash is invalid');
 const native='arena2d/'+version.modules;
 for(const file of critical)await needed(root,native+'/'+file,200);
 await needed(root,'arena2d/lib/phaser.min.js',100000);
 const config=await read(root,native+'/config.js');
 const alpha=config.match(/\b(?:let|const)\s+VERSION\s*=\s*["'](0\.\d+(?:\.\d+)?)["']/)?.[1];
 if(alpha!==approved.approvedAlpha)
  throw Error('Cached native Alpha '+(alpha||'unverified')+
    ' does not match approved release '+approved.approvedAlpha);
 const html=await read(root,'arena2d/index.html');
 if(!html.includes(version.modules+'/main.js')||!html.includes('juego'))
  throw Error('Cached native Phaser entrypoint mismatches version');
 const pmd=JSON.parse(await read(root,'arena2d/assets/pmd/manifest.json'));
 if(!pmd||typeof pmd!=='object'||Object.keys(pmd).length<10)
  throw Error('Incomplete real PMD Pokémon sprite manifest');
 const home=await read(root,'index.html');
 if(!home.includes('arena2d/index.html'))
  throw Error('Cached Pages root does not link to Phaser');
 return {alpha,source:version.src,modules:version.modules,
   essentialFiles:critical.length+core.length,pmdForms:Object.keys(pmd).length,prebuilt:true};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 verifyPublishedFallback(process.argv[2]).then(
  x=>console.log('VERIFIED_PUBLISHED_PAGES_FALLBACK',JSON.stringify(x))
 ).catch(e=>{console.error('REFUSING_PAGES_FALLBACK',String(e.message||e));process.exitCode=1});
}
