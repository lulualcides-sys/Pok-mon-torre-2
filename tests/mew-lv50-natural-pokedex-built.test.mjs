/* Regression: Mew's FireRed Lv50 Ancient Power is a real species move,
 * not an optional off-type punch default. Never overwrite manual saved kits.
 * Uses the actual generated Phaser client and real installed renderers.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';

const base=path.resolve(process.env.PREVIEW_ROOT||'_site','arena2d');
const {modules}=JSON.parse(fs.readFileSync(path.join(base,'version.json'),'utf8'));
const {availableMoves,defaultLoadout,resolveLoadout,selectedMoves}=
 await import(pathToFileURL(path.join(base,modules,'torre2/move-pool.js')).href);
const member=(level)=>({id:'mew',progression:{species:'mew',level},tmMoves:[]});
const at50=member(50);
const natural=availableMoves(at50).find(move=>move.id==='ancient-power');
assert.ok(natural?.forma,'Approved native Ancient Power VFX missing');
assert.equal(defaultLoadout(at50)[1],'ancient-power',
 'Automatic Mew must prefer FRLG Lv50 Ancient Power to bonus Fire Punch');
const kit=resolveLoadout(at50);
assert.deepEqual(['lmb','rmb','q','e'].map(slot=>kit[slot]?.nombre),
 ['Pound','Ancient Power','Mega Punch','Psychic'],
 'Real battle Mew Lv50 internal kit should use the exact native move names');
assert.equal(kit.e.ulti,true,'Psychic remains the charged ULT in real battle');
assert.equal(kit.rmb.pendiente,false,'Mew learned Ancient Power at Lv50');

const manual=member(50);
const valid=availableMoves(manual);
assert.ok(valid.some(x=>x.id==='fire-punch'),
 'Previously approved Fire Punch should remain a manually equipable option');
manual.moves=['pound','fire-punch','mega-punch',defaultLoadout(manual)[3]];
manual.movePlanSpecies='mew';
const before=JSON.stringify(manual.moves);
assert.equal(selectedMoves(manual)[1],'fire-punch',
 'Respect prior user-selected Fire Punch equipment');
assert.equal(JSON.stringify(manual.moves),before,
 'Reading the loadout must not change the saved choices');

const at49=member(49);
assert.ok(!availableMoves(at49).some(m=>m.id==='ancient-power'),
 'Do not grant Lv50 Ancient Power early');
console.log('MEW FRLG LV50 DEFAULT + MANUAL SAVE REGRESSION PASS',JSON.stringify({
 release:modules,default:kit.rmb.nombre,manual:manual.moves[1]
}));
