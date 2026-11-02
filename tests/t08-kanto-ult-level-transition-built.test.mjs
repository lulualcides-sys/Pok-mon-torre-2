/* T08: level 7→8→9 ULT transition across all Kanto species.
 * Exercises actual versioned battle kits, not fabricated attacks.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const base=path.resolve(process.env.PREVIEW_ROOT||'_site','arena2d');
const {modules}=JSON.parse(fs.readFileSync(path.join(base,'version.json'),'utf8'));
const load=name=>import(pathToFileURL(path.join(base,modules,name)).href);
const [{KANTO_151},{resolveLoadout,availableMoves}, {KANTO_INTRO}]
 =await Promise.all([load('torre2/all-kanto-species.js'),
 load('torre2/move-pool.js'),load('torre2/kanto-intro-moves.js')]);
let checked=0;
for(const {id} of KANTO_151){
 if(id==='mewtwo')continue; // special Lv50 QA species.
 const member={id,progression:{species:id,level:7},tmMoves:[]};
 const before=availableMoves(member).map(x=>x.id);
 const l7=resolveLoadout(member);
 assert.equal(l7.e,undefined,id+' Lv7 ULT must be locked');
 const active7=['lmb','rmb','q'].map(slot=>l7[slot]?.id);
 assert.equal(new Set(active7).size,3,id+' Lv7 requires three distinct controls');
 member.progression.level=8;
 const l8=resolveLoadout(member);
 assert.ok(l8.e?.ulti===true&&!l8.e?.pendiente,id+' Lv8 ULT missing');
 assert.ok(l8.e.torre2IntroPractice===true,id+' Lv8 ULT must remain balanced');
 assert.ok(l8.e.dano<=KANTO_INTRO.maxIntroUltDamage,id+' Lv8 ULT damage ceiling');
 assert.equal(new Set(['lmb','rmb','q','e'].map(slot=>l8[slot]?.id)).size,4,
  id+' Lv8 needs four independent moves');
 member.progression.level=9;
 const l9=resolveLoadout(member);
 assert.ok(l9.e?.ulti===true&&!l9.e?.pendiente,id+' Lv9 ULT lost');
 assert.ok(l9.e?.forma,id+' Lv9 ULT renderer missing');
 assert.ok(l9.e.dano<=KANTO_INTRO.maxIntroUltDamage,id+' Lv9 early ULT too strong');
 assert.ok(availableMoves(member).length>=before.length,id+' leveling must not forget learned moves');
 member.progression.level=7;
 assert.equal(resolveLoadout(member).e,undefined,id+' level downgrade must relock ULT');
 checked++;
}
assert.equal(checked,150);
console.log('T08 150 KANTO ULT LEVEL TRANSITIONS PASS',JSON.stringify({checked,levels:[7,8,9,7]}));
