import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';

/**
 * Install only actually observed / SHA256-certified native packs into an
 * ISOLATED candidate client. Never writes game source or publicly deployed
 * _site/; does not invent missing artwork and never falls back to old JS.
 *
 * Expected inputs: site-capture/rea-lazy-pack-probe containing report.json
 * and observed/, plus site-capture/pokearena-client with independently
 * confirmed version.json and real upstream index.html#paq.
 */
const digest = b => createHash('sha256').update(b).digest('hex');
const hex = x => typeof x === 'string' && /^[a-f0-9]{20}$/.test(x);
const binPattern = /^assets\/p\/([a-f0-9]{20})\.bin$/;

function ensureQuarantine(root) {
  const p = path.resolve(root);
  const parts = p.split(path.sep);
  if (!parts.includes('site-capture') || parts.includes('_site') ||
      parts.includes('.git') || parts.includes('arena2d'))
    throw Error('Native pack staging must stay inside site-capture quarantine');
  return p;
}
function parseIndex(html) {
  const match = html.match(/<script[^>]*\bid=["']paq["'][^>]*>([\s\S]*?)<\/script>/);
  if (!match) throw Error('Official native pack index missing');
  const index = JSON.parse(match[1]);
  if (!hex(index.comun) || !index.formas || typeof index.formas !== 'object')
    throw Error('Invalid public pack manifest');
  if (Object.entries(index.formas).some(([dex,id]) =>
    !/^[0-9]{4}(?:-[a-z0-9]+)*$/.test(dex) || !hex(id)))
    throw Error('Invalid public pack identifiers');
  return index;
}
export async function stageObservedPacks(captureRoot, clientRoot) {
  const capture = ensureQuarantine(captureRoot);
  const client = ensureQuarantine(clientRoot);
  if (client === capture || client.startsWith(capture+path.sep) ||
      capture.startsWith(client+path.sep))
    throw Error('The capture and build client must be separate directories');
  const report = JSON.parse(await fs.readFile(path.join(capture,'report.json'),'utf8'));
  const version = JSON.parse(await fs.readFile(path.join(client,'version.json'),'utf8'));
  if (report.status !== 'PUBLIC_UI_OBSERVED' || report.errors?.length ||
      report.denied?.length || !/^0\.\d+(?:\.\d+)?$/.test(report.version||'') ||
      !/^src-[a-f0-9]{10}$/.test(report.src||''))
    throw Error('Observed capture incomplete or unverified');
  if (report.version !== version.officialAlpha || report.src !== (version.src||version.modules))
    throw Error('Captured Alpha/source fingerprint differs from isolated build');
  const html=await fs.readFile(path.join(client,'index.html'),'utf8');
  if (!html.includes(report.src+'/main.js'))
    throw Error('Candidate index does not select the captured public source');
  const index=parseIndex(html), declared=new Set([index.comun,...Object.values(index.formas)]);
  const staged=[], seen=new Set();
  for (const record of report.observed || []) {
    const match=binPattern.exec(record.asset||'');
    // Only original .bin packages are installable by this helper. Loose PNGs
    // need their own manifest animation coverage audit; do not fake it here.
    if (!match) continue;
    if (!declared.has(match[1])) throw Error('Pack not declared by exact public index');
    if (seen.has(record.asset)) throw Error('Duplicate captured pack');
    seen.add(record.asset);
    if (!/^[a-f0-9]{64}$/.test(record.sha256||'') ||
        record.provenance !== 'HTTP 200 emitted by public browser while using UI')
      throw Error('Unverified asset provenance/hash');
    const src=path.join(capture,'observed',record.asset);
    const dst=path.join(client,record.asset);
    const bytes=await fs.readFile(src);
    if (bytes.length < 64 || bytes.length !== record.bytes ||
        digest(bytes) !== record.sha256)
      throw Error('Captured source pack hash or size mismatch: '+record.asset);
    let existing=null;
    try { existing=await fs.readFile(dst); }
    catch(e) {if (e.code !== 'ENOENT') throw e;}
    if (existing && digest(existing)!==record.sha256)
      throw Error('Refusing to replace existing pack with different bytes: '+record.asset);
    staged.push({src,dst,id:match[1],sha256:record.sha256,bytes:record.bytes,
      alreadyInstalled:!!existing});
  }
  // All hash, version and collision checks complete before the first write.
  let installed=0;
  for (const file of staged) {
    if (file.alreadyInstalled) continue;
    await fs.mkdir(path.dirname(file.dst),{recursive:true});
    await fs.copyFile(file.src,file.dst,fs.constants?.COPYFILE_EXCL ?? 1);
    installed++;
  }
  const present=new Set();
  for (const id of declared) {
    try { await fs.access(path.join(client,'assets/p',id+'.bin')); present.add(id); }
    catch(e) {if(e.code!=='ENOENT') throw e;}
  }
  const uncovered=Object.entries(index.formas)
    .filter(([,id])=>!present.has(id)).map(([dex,id])=>({dex,pack:id}));
  const outcome={
    officialAlpha:report.version,sourceDir:report.src,declaredForms:Object.keys(index.formas).length,
    coveredFormsByPacks:Object.values(index.formas).filter(id=>present.has(id)).length,
    missingFormsByPacks:uncovered.length,missing:uncovered,installed,
    reusedVerified:staged.length-installed,
    provenance:'Only SHA256-confirmed original browser-observed packs were staged',
    complete:uncovered.length===0 && present.has(index.comun),
    rule:'Candidate build only. No release or functional integration without full QA.'
  };
  await fs.writeFile(path.join(client,'lazy-pack-integration-report.json'),
    JSON.stringify(outcome,null,2)+'\n');
  return outcome;
}
if (process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href) {
  stageObservedPacks(process.argv[2]||'site-capture/rea-lazy-pack-probe',
    process.argv[3]||'site-capture/pokearena-client').then(x=>{
      console.log('SAFE_LAZY_PACKS_STAGED',JSON.stringify({
        alpha:x.officialAlpha,installed:x.installed,covered:x.coveredFormsByPacks,
        total:x.declaredForms,complete:x.complete
      }));
      if (!x.complete) process.exitCode=2;
  }).catch(e=>{console.error('SAFE_LAZY_PACKS_STAGE_FAILED',e);process.exitCode=1});
}
