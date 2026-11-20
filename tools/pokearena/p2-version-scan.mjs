#!/usr/bin/env node
/* Daily scan of Poké Arena 2D's PUBLIC version.json (no capture, no download
 * of game files, never bypasses their protections). Prints a JSON verdict:
 * {changed, upstream, base, lastSeen}. The workflow opens a GitHub issue when
 * upstream differs from what we last saw, so the owner decides when to update.
 */
import fs from 'node:fs/promises';
const SEEN='tools/pokearena/p2-upstream-seen.json';
export function compareVersions(seen,upstream){
 const valid=upstream&&typeof upstream.version==='string'&&/^src-[0-9a-f]{6,20}$/.test(upstream.src||'');
 if(!valid)return {ok:false,reason:'version.json inválido'};
 const last=seen.lastSeen||seen.base;
 return {ok:true,changed:upstream.version!==last.version||upstream.src!==last.src,
  behindBase:upstream.version!==seen.base.version,upstream,base:seen.base,lastSeen:last};
}
if(import.meta.url===`file://${process.argv[1]}`){
 const seen=JSON.parse(await fs.readFile(SEEN,'utf8'));
 const res=await fetch('https://www.pokearena2d.com/version.json',{headers:{'user-agent':'torre2-version-scan'}});
 if(!res.ok){console.log(JSON.stringify({ok:false,reason:'HTTP '+res.status}));process.exit(0)}
 console.log(JSON.stringify(compareVersions(seen,await res.json())));
}
