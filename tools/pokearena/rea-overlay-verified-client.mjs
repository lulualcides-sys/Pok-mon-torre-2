#!/usr/bin/env node
/* Fail-closed REA current-client overlay onto previously SHA-verified,
 * user-authorized original P2 snapshot. Do not mix OLD JS with new JS:
 * retain only shared static files and copy the complete new module graph.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';

const root=path.resolve(process.argv[2]||'site-capture/pokearena-client');
const staged=path.resolve(process.argv[3]||'site-capture/rea-public-0658');
const manifestPath=path.join(staged,'rea-capture-summary.json');
const configuredAlpha=process.env.POKEARENA_EXPECTED_ALPHA||'0.65.8';
const digest=b=>createHash('sha256').update(b).digest('hex');
const json=async p=>JSON.parse(await fs.readFile(p,'utf8'));
function safePath(p){
 if(typeof p!=='string'||p.length>260||p.startsWith('/')||
    p.includes('\\')||p.split('/').includes('..'))throw Error('Unsafe source path');
 return p;
}
const report=await json(manifestPath);
const oldReport=await json(path.resolve('site-capture/CAPTURE-REPORT.json'));
const expected=configuredAlpha==='auto'?report.observedAlpha:configuredAlpha;
assert.match(expected,/^0\.\d+(?:\.\d+)?$/,'Official Alpha missing or malformed');
assert.equal(report.observedAlpha,expected,'Official Alpha not verified via REA');
assert.equal(report.selectedFromOfficialConfig,true,'Unverified release config');
assert.ok(report.loadedScripts>=50&&report.fileCount>=75,'Incomplete REA capture');
assert.equal(report.blocked.length,0,'Public resources blocked; stop, do not bypass');
assert.equal(report.errors.length,0,'Browser capture errors');
const mod=report.sourceDir;
assert.match(mod,/^src-[0-9a-f]{10}$/);
assert.notEqual(mod,oldReport.sourceVersions?.selected,'New client cannot be old snapshot');
assert.ok(oldReport.retrieved?.length>=3300,'Pinned fallback missing SHA256 provenance');
assert.ok(oldReport.sourceVersions?.selected,'Old original source version missing');

const changed=[],stagedHashes=new Map();
for(const item of report.saved){
 const p=safePath(item.path);
 assert.match(item.sha256,/^[0-9a-f]{64}$/);
 assert.ok(!stagedHashes.has(p),'Duplicate staged resource: '+p);
 const full=path.resolve(staged,'pokearena-client',p);
 assert.ok(full.startsWith(path.resolve(staged,'pokearena-client')+path.sep));
 const b=await fs.readFile(full);
 assert.equal(digest(b),item.sha256,'REA staged SHA mismatch: '+p);
 stagedHashes.set(p,{data:b,hash:item.sha256,bytes:b.length});
}
const html=stagedHashes.get('index.html')?.data.toString('utf8')||'';
assert.ok(html.includes('src="'+mod+'/main.js"'),'Live index does not refer to verified source modules');
const source=stagedHashes.get(mod+'/config.js')?.data.toString('utf8')||'';
const escaped=expected.replace(/\./g,'\\.');
assert.match(source,new RegExp('\\b(?:let|const)\\s+VERSION\\s*=\\s*["\\\']'+escaped+'["\\\']'),
 'Cannot prove Alpha '+expected+' using native config.js');
const required=['main.js','config.js','notas.js','datos.js','sprites.js',
 'habilidades.js','luchador.js','escenas/titulo.js','escenas/seleccion.js',
 'escenas/carga.js','escenas/combate.js','escenas/pokedex.js','escenas/jefe.js'];
for(const p of required)assert.ok(stagedHashes.has(mod+'/'+p),'Missing latest source: '+p);

// Every literal relative ESM import in the new source must be captured from
// the same public revision. NEVER fall back to an old JS module silently.
const missing=[];
for(const [p,{data}] of stagedHashes){
 if(!p.startsWith(mod+'/')||!p.endsWith('.js'))continue;
 const src=data.toString('utf8');
 for(const match of src.matchAll(/(?:^|[;\n\s])(?:import|export)\s*(?:[^'";\n]*?\s+from\s*)?["'](\.[^"']+)["']/gm)){
  const rel=match[1];
  const resolved=path.posix.normalize(path.posix.join(path.posix.dirname(p),rel));
  if(resolved.startsWith(mod+'/')&&resolved.endsWith('.js')&&!stagedHashes.has(resolved))
   missing.push({importer:p,missing:resolved});
 }
}
assert.deepEqual(missing,[],'Missing native ESM dependencies in public REA capture');

// Overlay selected resources, never change unrelated approved Kanto assets.
for(const [p,{data,hash}] of stagedHashes){
 if(/^src-[0-9a-f]{10}\//.test(p)&&!p.startsWith(mod+'/'))continue;
 const full=path.resolve(root,p);
 assert.ok(full.startsWith(root+path.sep));
 await fs.mkdir(path.dirname(full),{recursive:true});
 await fs.writeFile(full,data);
 changed.push({path:p,sha256:hash,bytes:data.length});
}
const oldSrc=oldReport.sourceVersions.selected;
assert.notEqual(oldSrc,mod);
const version={src:mod,modules:mod,pixelFXVersion:mod,localMirror:true,
 officialAlpha:expected,verifiedBy:'public-REA-CDP'};
await fs.writeFile(path.join(root,'version.json'),JSON.stringify(version));

// The FULL public-capture report honestly records retained older static assets
// as a fallback, never treats them as evidence of newly downloaded assets.
const retained=oldReport.retrieved.filter(x=>!stagedHashes.has(x.path));
const merged=[...retained,...changed.map(x=>({
 ...x,source:'official-public-browser-REA-'+expected
}))];
const out={...oldReport,
 sourceVersions:{...oldReport.sourceVersions,selected:mod,discovered:[mod]},
 originalFallback:{sourceDir:oldSrc,files:oldReport.retrieved.length,
  verifiedBy:'verify-pinned-capture.mjs'},
 reaUpgrade:{alpha:expected,sourceDir:mod,reaEvidenceId:report.reaEvidenceId,
  updated:changed.length,retainedStaticFiles:retained.length,
  note:'Only code successfully observed on the public site with REA is upgraded; shared approved assets retained unchanged.'},
 retrieved:merged,totalFiles:merged.length,
 totalBytes:merged.reduce((n,x)=>n+(x.bytes||0),0)
};
await fs.writeFile('site-capture/CAPTURE-REPORT.json',JSON.stringify(out,null,2)+'\n');
console.log('REA_NATIVE_SOURCE_OVERLAY_VERIFIED',JSON.stringify({
 alpha:expected,modules:mod,newFiles:changed.length,oldStaticRetained:retained.length,
 esModulesChecked:true,missingImports:0
}));
