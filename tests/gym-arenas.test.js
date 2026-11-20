import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
const dir=new URL('../tools/pokearena/alpha0773-arenas/',import.meta.url);
const prov=JSON.parse(fs.readFileSync(new URL('PROVENANCE.json',dir),'utf8'));
const core=fs.readFileSync(new URL('../tools/pokearena/torre2-campaign-core.js',import.meta.url),'utf8');
test('the 8 gym arenas and 8 Cinnabar fire sheets match their recorded SHA-256',()=>{
 const files=Object.entries(prov.files);
 assert.deepEqual(files.filter(([f])=>f.endsWith('-amplia.jpg')).map(([f])=>f.split('/')[1].replace('-amplia.jpg','')).sort(),
  ['blackthorn','celadon','cerulean','cinnabar','fuchsia','pewter','saffron','vermilion']);
 assert.equal(files.filter(([f])=>f.startsWith('gimnasios/vivas/')).length,8);
 for(const [f,sha] of files)assert.equal(createHash('sha256').update(fs.readFileSync(new URL(f,dir))).digest('hex'),sha,f);
});
test('leader battles use their own gym arena; others keep theirs',()=>{
 const m=core.match(/LEADER_ARENAS=Object\.freeze\((\{[^)]*\})\)/);assert.ok(m);
 const map=Function('return '+m[1])();
 assert.deepEqual(map,{0:'pewter',1:'cerulean',2:'vermilion',3:'celadon',4:'fuchsia',5:'saffron',6:'cinnabar',
  7:'t2-viridian',8:'t2-lorelei',9:'t2-bruno',10:'t2-agatha',11:'blackthorn',12:'t2-champion'});
 assert.ok(core.includes('arena:leader&&LEADER_ARENAS[s.stage]||gym.arena'));
 const t2=JSON.parse(fs.readFileSync(new URL('../tools/pokearena/torre2-arenas/PROVENANCE.json',import.meta.url),'utf8'));
 for(const id of Object.values(map)){
  if(id.startsWith('t2-'))assert.ok(t2.files[id.slice(3)+'.jpg']&&t2.arenas[id.slice(3)],'art for '+id);
  else assert.ok(prov.files['gimnasios/'+id+'-amplia.jpg'],'art for '+id);
 }
});
test('Cinnabar live arena (fire/lava) is switched on in the published copy only (owner authorization)',()=>{
 const pub=fs.readFileSync(new URL('../tools/pokearena/publish-alpha0762.mjs',import.meta.url),'utf8');
 assert.ok(pub.includes("const vivaFile=path.join(dest,'arena_viva.js');"),'patch the new module tree, never the rollback tree');
 assert.ok(pub.includes("exactly(viva,'cinnabar:{activa:false,','Cinnabar live-arena flag');"));
 assert.ok(pub.includes("viva.replace('cinnabar:{activa:false,','cinnabar:{activa:true,')"));
});

test('owner arenas for Giovanni, Elite Four and Champion: hashes and ovals',()=>{
 const t2dir=new URL('../tools/pokearena/torre2-arenas/',import.meta.url);
 const t2=JSON.parse(fs.readFileSync(new URL('PROVENANCE.json',t2dir),'utf8'));
 assert.deepEqual(Object.keys(t2.arenas).sort(),['agatha','bruno','champion','lorelei','viridian']);
 for(const [f,sha] of Object.entries(t2.files))assert.equal(createHash('sha256').update(fs.readFileSync(new URL(f,t2dir))).digest('hex'),sha,f);
 for(const a of Object.values(t2.arenas)){
  assert.deepEqual([a.ovalo.cx,a.ovalo.cy,a.ovalo.rx],[480,222,455],'same field position/width as native gyms');
  assert.ok(a.ovalo.ry>=120&&a.ovalo.ry<=170,'field height '+a.ovalo.ry);
  assert.ok(a.stretchY<=1.25,'at most 25% vertical stretch');
 }
 const pub=fs.readFileSync(new URL('../tools/pokearena/publish-alpha0762.mjs',import.meta.url),'utf8');
 assert.ok(pub.includes(".concat('+JSON.stringify(extra)+');"),'appended after the native gym list');
});
