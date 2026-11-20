#!/usr/bin/env node
/* Pokémon Torre 2 — rebuild an authorized Poké Arena 2D source capture from its pin.
 * Usage: node tools/pokearena/archive-upstream-capture.mjs <pin.json> <outDir>
 * Downloads every pinned module with ordinary public GETs (same helper as the
 * rest of the project: no cookies, no login, no retry after 403) and requires
 * each SHA-256 to match the pin. Any mismatch or failure stops the archive
 * (fail closed). Downloaded JavaScript is only written to disk, never executed.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {getPublicClientResource} from './public-client-http.mjs';

const [pinFile,outArg]=process.argv.slice(2);
if(!pinFile||!outArg)throw Error('usage: archive-upstream-capture.mjs <pin.json> <outDir>');
const pin=JSON.parse(await fs.readFile(pinFile,'utf8'));
const out=path.resolve(outArg);
const ORIGIN='https://www.pokearena2d.com';
const sha=b=>createHash('sha256').update(b).digest('hex');
const fail=m=>{throw Error('UPSTREAM_ARCHIVE: '+m)};
if(!/^src-[a-z0-9]{6,20}$/.test(pin.src||''))fail('invalid src');
if(!pin.authorization?.date)fail('pin has no authorization record');
const modules=Object.entries(pin.modules||{});
if(!modules.length)fail('pin has no modules');

await fs.rm(out,{recursive:true,force:true});
let bytes=0;
for(const [rel,expected] of modules){
 if(rel.split('/').includes('..')||!/^[\w/.-]+\.js$/.test(rel))fail('bad module path '+rel);
 const {data}=await getPublicClientResource(`${ORIGIN}/${pin.src}/${rel}`);
 if(sha(data)!==expected)fail('module changed upstream (re-pin required): '+rel);
 const file=path.join(out,'source',pin.src,rel);
 await fs.mkdir(path.dirname(file),{recursive:true});
 await fs.writeFile(file,data);bytes+=data.length;
}
const index=(await getPublicClientResource(ORIGIN+'/',2*1024*1024)).data;
const live=index.toString('utf8');
const indexState=live.includes(`${pin.src}/main.js`)?'same-src':'site-moved-on';
await fs.writeFile(path.join(out,'source','index.html'),index);
await fs.copyFile(pinFile,path.join(out,path.basename(pinFile)));
await fs.writeFile(path.join(out,'MANIFEST.txt'),[
 'alpha='+pin.alpha,'src='+pin.src,'origin='+ORIGIN+'/','readAt='+pin.readAt,
 'archivedAt='+new Date().toISOString(),'authorization='+pin.authorization.date+' '+pin.authorization.note,
 'modules='+modules.length,'bytes='+bytes,'indexHtml='+indexState,'indexHtmlSha256='+sha(index),
 'blockedAssets='+(pin.blockedAssets?.status||'none')+' (nao contornado)',''].join('\n'));
console.log('UPSTREAM_ARCHIVE_OK',JSON.stringify({alpha:pin.alpha,src:pin.src,modules:modules.length,bytes,indexState}));
