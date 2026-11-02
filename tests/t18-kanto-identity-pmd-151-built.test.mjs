// T18 all 151: inspect the ACTUAL generated Phaser client and locally mirrored
// licensed PMD sprites, including evolved forms. Pure audit, not gameplay.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';

const root=path.resolve(process.env.PREVIEW_ROOT||'_site','arena2d');
const {modules}=JSON.parse(fs.readFileSync(path.join(root,'version.json'),'utf8'));
const load=relative=>import(pathToFileURL(path.join(root,modules,relative)).href);
const [{KANTO_151},{ROSTER,buscar,etapaDe}]=await Promise.all([
 load('torre2/all-kanto-species.js'),load('datos.js')
]);
const pmdRoot=path.join(root,'assets/pmd');
const manifest=JSON.parse(fs.readFileSync(path.join(pmdRoot,'manifest.json'),'utf8'));
const report={scope:'T18 full 151 stage/identity and local PMD Idle/Walk asset integrity',
 context:'built client metadata and local files; not 151 battle playthroughs',
 entries:[],native:0,added:0,portraits:0,errors:[]};

test('T18: 151 distinct species resolve to correct Kanto stages, sprites and form types',()=>{
 assert.equal(KANTO_151.length,151);
 assert.equal(new Set(KANTO_151.map(p=>p.id)).size,151);
 assert.deepEqual(KANTO_151.map(p=>p.num),Array.from({length:151},(_,i)=>i+1));
 const loaded=new Set(),rosterIds=new Set(ROSTER.map(p=>p.id));
 for(const p of KANTO_151){
  const dex=String(p.num).padStart(4,'0'),info=buscar(p.id);
  assert.ok(info?.def, p.id+' must resolve to a playable native Arena definition');
  assert.ok(Number.isInteger(info.etapa)&&info.etapa>=0,p.id+' stage must exist');
  const form=etapaDe(info.def,info.etapa);
  assert.equal(String(form.dex).padStart(4,'0'),dex,p.id+' must use its OWN form sprite, not parent');
  assert.ok(Array.isArray(form.tipos)&&form.tipos.length>0,p.id+' types missing');
  assert.ok(form.kit&&Object.values(form.kit).some(m=>m?.forma),
   p.id+' cannot have blank arena moveset');
  // Every form must be reachable from ONE concrete roster entry.
  assert.ok(rosterIds.has(info.def.id),p.id+' base roster entry missing');
  assert.ok(!loaded.has(dex),p.id+' repeated dex');
  loaded.add(dex);
  const sprites=manifest[dex];
  assert.ok(sprites?.anims?.Idle&&sprites?.anims?.Walk,
   p.id+' ('+dex+') needs official mirrored PMD Idle/Walk entries');
  for(const name of ['Idle','Walk']){
   const anim=sprites.anims[name];
   assert.ok(Number.isInteger(anim.fw)&&anim.fw>0&&Number.isInteger(anim.fh)&&anim.fh>0,
    p.id+' invalid '+name+' frame dimensions');
   assert.ok(Array.isArray(anim.durations)&&anim.durations.length>0,
    p.id+' missing '+name+' animation timing');
   assert.ok(typeof anim.file==='string'&&anim.file.startsWith(dex+'/')&&
    !anim.file.includes('..'),p.id+' bad '+name+' asset path');
   assert.ok(fs.statSync(path.join(pmdRoot,anim.file)).size>32,
    p.id+' missing '+name+' PNG in built client');
  }
  const png=path.join(pmdRoot,dex,'portrait.png');
  if(fs.existsSync(png)&&fs.statSync(png).size>32)report.portraits++;
  report[info.def.torre2ArenaAdded?'added':'native']++;
  report.entries.push({num:p.num,id:p.id,dex,root:info.def.id,stage:info.etapa,
   types:form.tipos,portrait:fs.existsSync(png)});
 }
 assert.equal(loaded.size,151);
 assert.equal(report.native+report.added,151);
 fs.mkdirSync('test-evidence',{recursive:true});
 fs.writeFileSync('test-evidence/t18-kanto-roster-151.json',
  JSON.stringify(report,null,2));
 console.log('T18 KANTO ROSTER / PMD 151 PASS',JSON.stringify({
  species:report.entries.length,rootRoster:rosterIds.size,native:report.native,
  added:report.added,portraitAssets:report.portraits,source:'local versioned Phaser build'
 }));
});
