'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const p=path.resolve('reference-library/pb-ranked/CONTRATOS-PUBLICOS-COMBATE-2026-11-01.json');
const x=JSON.parse(fs.readFileSync(p,'utf8'));
const byId=new Map(x.entries.map(r=>[r.id,r]));

test('30 creator-published mechanics remain reference-only, with provenance and no runtime claims',()=>{
 assert.equal(x.entries.length,30);
 assert.equal(byId.size,30);
 assert.match(x.officialPublicPage,/ranked\.pokemonbattlegrounds\.com/);
 assert.match(x.evidenceClass,/NOT_INDEPENDENT_RUNTIME_TEST/);
 assert.ok(x.entries.every(e=>!e.verifiedInPracticeVsBot));
 assert.ok(x.entries.every(e=>x.decisions[e.decision]));
 assert.ok(x.entries.every(e=>e.reference && Object.keys(e.reference).length));
});
test('explicit published numeric rules documented, not auto-ported',()=>{
 assert.equal(byId.get('manual_dash').reference.cooldownSeconds,1.5);
 assert.equal(byId.get('heal_limited').reference.healMaxHpFraction,0.3);
 assert.equal(byId.get('heal_limited').reference.usesPerPokemonPerBattle,2);
 assert.equal(byId.get('critical').reference.chance,0.05);
 assert.equal(byId.get('critical').reference.multiplier,1.5);
 assert.equal(byId.get('weather_duration').decision,'DO_NOT_IMPORT_NUMBERS');
 assert.equal(byId.get('weather_duration').reference.durationSeconds,15);
 assert.equal(byId.get('rain_sun_types').decision,'COMPARE_TYPES_ONLY');
 assert.equal(byId.get('timer_3v3').decision,'OUT_OF_SCOPE');
 assert.equal(byId.get('timer_6v6').decision,'OUT_OF_SCOPE');
 assert.equal(byId.get('paralysis').decision,'DO_NOT_IMPORT_NUMBERS');
 assert.equal(byId.get('sleep').reference.maxDurationSeconds,5);
});
