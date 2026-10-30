/* T08: upcoming levels in the actual campaign summary are derived from
 * compiled Phaser battle availability, not fictional FRLG placeholders.
 * These tests use member fixtures, not natural earned XP.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const root=path.resolve(process.env.PREVIEW_ROOT||'_site','arena2d');
const {modules}=JSON.parse(fs.readFileSync(path.join(root,'version.json'),'utf8'));
const load=name=>import(pathToFileURL(path.join(root,modules,name)).href);
const [moves,{KANTO_151}]=await Promise.all([
 load('torre2/move-pool.js'),load('torre2/all-kanto-species.js')
]);
const {upcomingCampaignMoves,availableMoves,moveUnlockLevel,canonicalMoveKey}=moves;
const member=(id,level)=>({id,progression:{species:id,level},tmMoves:[]});
const rowsFor=(id,level)=>upcomingCampaignMoves(member(id,level));
assert.equal(KANTO_151.length,151);
const summary={checkedSpecies:0,checkedLevels:0,upcomingRows:0,battleChecks:0};
for(const {id} of KANTO_151){
 if(id==='mewtwo')continue;
 summary.checkedSpecies++;
 for(const level of [5,7,8,13,26,40,49,50]){
  summary.checkedLevels++;
  const pokemon=member(id,level),before=JSON.stringify(pokemon);
  const rows=upcomingCampaignMoves(pokemon);
  assert.equal(JSON.stringify(pokemon),before,'The summary mutated '+id);
  assert.ok(rows.every(r=>r.method==='LEVEL'&&r.level>level&&r.level<=50),
   'Unlearned TM, prior level or impossible level listed at '+id+' Lv'+level);
  const keys=new Set(rows.map(r=>(r.ultimatePreview?'E:':'N:')+
   canonicalMoveKey(r.name)));
  assert.equal(keys.size,rows.length,'Repeated future name '+id+' Lv'+level);
  assert.ok(rows.every(r=>canonicalMoveKey(r.name)!=='surf'&&
   canonicalMoveKey(r.name)!=='scratch'),'Rejected/deferred move advertised');
  for(const row of rows){
   summary.upcomingRows++;
   const at=availableMoves(member(id,row.level));
   const prior=availableMoves(member(id,row.level-1));
   assert.ok(at.some(m=>m.id===row.id),'Not available in real fight at advertised level '+id+' '+row.id+' '+row.level);
   assert.ok(!prior.some(m=>m.id===row.id),'Future move already learned in previous level '+id+' '+row.id);
   if(row.ultimatePreview){
    assert.equal(row.level,8);
    assert.ok(row.practice&&row.slot==='e');
   }else{
    assert.equal(row.practice,false);
    assert.equal(moveUnlockLevel(member(id,level),row.id),row.level,
     'Summary and Pokédex disagree on the exact unlock level '+id+' '+row.id);
   }
   summary.battleChecks++;
  }
 }
}
const squirtle=rowsFor('squirtle',5);
assert.ok(squirtle.some(r=>r.ultimatePreview&&r.level===8&&canonicalMoveKey(r.name)==='hydro-pump'),
 'Squirtle should display Lv8 capped E preview');
assert.ok(squirtle.some(r=>!r.ultimatePreview&&r.level===47&&r.id==='hydro-pump'),
 'Squirtle must display late native full Hydro Pump separately');
assert.ok(rowsFor('vulpix',23).some(r=>r.id==='fire-blast'&&r.level===50),
 'Vulpix must show Fire Blast at the real late campaign unlock');
assert.ok(rowsFor('ivysaur',26).some(r=>r.id==='solar-beam'&&r.level<=50),
 'Ivysaur needs late native Solar Beam listed');
assert.ok(rowsFor('beedrill',28).some(r=>r.id==='x-scissor'&&r.level===30),
 'Beedrill missing legal approved X-Scissor next at Lv30');
assert.deepEqual(rowsFor('squirtle',50),[],'Level cap must not show phantom Lv51–100 rewards');
assert.deepEqual(rowsFor('mewtwo',50),[],'Unrestricted lab has no fake upcoming campaign unlock');
assert.deepEqual(rowsFor('ditto',13),[],'Ditto Transform postponed; do not invent learn levels');
console.log('PASS_T08_UPCOMING_SUMMARY_151',JSON.stringify(summary));
