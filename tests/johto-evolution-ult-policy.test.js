import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {JOHTO_100_ROWS} from '../tools/pokearena/torre2-johto-100-data.js';
const root=new URL('../tools/pokearena/',import.meta.url);
let src=readFileSync(new URL('torre2-johto-100-species.js',root),'utf8');
// This data-URL test isolates move policy from the Magmortar roster hook.
src=src.replace('import {attachMagmortarEvolution} from "./magmar-family.js";',
 'const attachMagmortarEvolution=()=>false;');
for(const [from,to] of [
 ['johto-100-data.js','torre2-johto-100-data.js'],
 ['early-kanto-species.js','torre2-early-kanto-species.js'],
 ['johto-lab-catalog.js','torre2-johto-lab-catalog.js'],
 ['wobbuffet-native.js','torre2-wobbuffet-native.js'],
 ['gen45-johto-learnsets.js','torre2-gen45-johto-learnsets.js']
])src=src.replace('from "./'+from+'"','from '+JSON.stringify(new URL(to,root).href));
const {selectJohto100Moves,JOHTO_EVOLUTION_KIT_PLAN}=await import(
 'data:text/javascript;base64,'+Buffer.from(src).toString('base64')
);
const mk=(name,type='NORMAL',dmg=7)=>({id:name,nombre:name.split('-').map(w=>w[0].toUpperCase()+w.slice(1)).join(' '),
 forma:'native-executable',tipo:type,dano:dmg});
const entries=[
 ['tackle','NORMAL',3],['ember','FIRE',5],['smokescreen','NORMAL',0],
 ['flame-wheel','FIRE',11],['flamethrower','FIRE',16],['lava-plume','FIRE',15],
 ['overheat','FIRE',21],['fire-punch','FIRE',13],['fire-spin','FIRE',9],
 ['smog','POISON',5],['fire-fang','FIRE',13],['crunch','DARK',18],
 ['earthquake','GROUND',19],['rock-slide','ROCK',15],['stone-edge','ROCK',20],
 ['bite','DARK',7],['thrash','NORMAL',11],['sandstorm','ROCK',0],
 ['quick-attack','NORMAL',6],['hidden-power','PSYCHIC',9],['fire-blast','FIRE',19]
];
const library=new Map(entries.map(([id,type,damage])=>[id,mk(id,type,damage)]));
const row=id=>JOHTO_100_ROWS.find(p=>p[1]===id);
const names=id=>selectJohto100Moves(row(id),library).map(x=>x.id);
test('Tyranitar Stone Edge is the only ULT; Crunch is not ULT',()=>{
 const roles=names('tyranitar');
 assert.equal(roles.length,4);
 assert.equal(roles[3],'stone-edge');
 assert.equal(roles.includes('crunch'),true);
 assert.notEqual(roles[3],'crunch');
 assert.equal(new Set(roles).size,4);
});
test('Johto starter third evolution gets a genuinely stronger set than baby',()=>{
 const baby=names('cyndaquil'),mid=names('quilava'),final=names('typhlosion');
 assert.equal(baby[3],'flame-wheel');
 assert.equal(mid[3],'flamethrower');
 assert.equal(final[3],'overheat');
 assert.ok(final.includes('lava-plume'),'Final form must gain installed Lava Plume');
 assert.notDeepEqual(final,baby);
});
test('Larvitar and Pupitar do not get the strongest final-evolution ULT',()=>{
 assert.equal(names('larvitar')[3],'thrash');
 assert.equal(names('pupitar')[3],'earthquake');
 assert.equal(names('tyranitar')[3],'stone-edge');
});
test('Magby has real baby moves instead of evolved Overheat ULT',()=>{
 const moves=names('magby');
 assert.equal(moves[3],'fire-punch');
 assert.ok(!moves.includes('overheat'));
 assert.ok(!moves.includes('fire-blast'));
});
test('Unown officially has only Hidden Power: never fabricate illegal moves',()=>{
 assert.deepEqual(names('unown'),['hidden-power']);
 assert.ok(JOHTO_EVOLUTION_KIT_PLAN.tyranitar);
});
