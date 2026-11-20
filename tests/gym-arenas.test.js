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
 assert.deepEqual(map,{0:'pewter',1:'cerulean',2:'vermilion',3:'celadon',4:'fuchsia',5:'saffron',6:'cinnabar',11:'blackthorn'});
 assert.ok(core.includes('arena:leader&&LEADER_ARENAS[s.stage]||gym.arena'));
 for(const id of Object.values(map))assert.ok(prov.files['gimnasios/'+id+'-amplia.jpg'],'art for '+id);
});
test('Cinnabar live arena (fire/lava) is switched on in the published copy only (owner authorization)',()=>{
 const pub=fs.readFileSync(new URL('../tools/pokearena/publish-alpha0762.mjs',import.meta.url),'utf8');
 assert.ok(pub.includes("const vivaFile=path.join(dest,'arena_viva.js');"),'patch the new module tree, never the rollback tree');
 assert.ok(pub.includes("exactly(viva,'cinnabar:{activa:false,','Cinnabar live-arena flag');"));
 assert.ok(pub.includes("viva.replace('cinnabar:{activa:false,','cinnabar:{activa:true,')"));
});
