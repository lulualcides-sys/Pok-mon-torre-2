import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const src=readFileSync(new URL('../tools/pokearena/torre2-johto-100-species.js',import.meta.url),'utf8');
const body=src.match(/export function bridgeAddedScytherToScizor\(original,added\)\{([\s\S]*?)\n\}/)?.[1];
assert.ok(body,'The actual Johto builder must expose the additive Scyther bridge');
const link=new Function('original','added',body);
const parent=()=>({id:'scyther',dex:'0123',torre2Kanto151:true,torre2ArenaAdded:true,kit:{lmb:{nome:'Wing Attack',forma:'native'}},evoluciones:[]});
const child=()=>({id:'scizor',dex:'0212',nombre:'SCIZOR',tipos:['BUG','STEEL'],
 torre2ArenaAdded:true,torre2Johto100:true,hp:98,vel:113,atk:1.2,def:1.1,regen:4,
 kit:{lmb:{nombre:'Metal Claw',forma:'native-metal',dano:8},
 rmb:{nombre:'Fury Cutter',forma:'native-cutter',dano:5},
 q:{nombre:'Swords Dance',forma:'native-charge',dano:0},
 e:{nombre:'X-Scissor',forma:'native-bug',dano:18}}});
test('only added Scyther gets Scizor #0212, copied exactly from installed Johto kit',()=>{
 const a=parent(),b=child();
 assert.equal(link([a],[b]),true);
 assert.deepEqual(a.evoluciones.map(e=>[e.dex,e.nombre,e.tipos]),[['0212','SCIZOR',['BUG','STEEL']]]);
 assert.deepEqual(a.evoluciones[0].kit,b.kit);
 assert.notEqual(a.evoluciones[0].kit,b.kit,'Shared source kit must not be mutated');
 assert.equal(link([a],[b]),false,'Never add duplicate evolution stages');
 assert.equal(a.evoluciones.length,1);
});
test('native Poké Arena Scyther and other P2 forms remain immutable',()=>{
 const native=parent();native.torre2ArenaAdded=false;
 const b=child(),before=structuredClone(native);
 assert.equal(link([native],[b]),false);
 assert.deepEqual(native,before);
 for(const id of ['ho-oh','steelix','crobat']){
  const p={...parent(),id};
  assert.equal(link([p],[b]),false);
 }
});
test('incomplete move kit, missing Scizor or foreign lineage never generates a false evolution',()=>{
 const a=parent(),b=child();delete b.kit.e;
 assert.equal(link([a],[b]),false);
 assert.deepEqual(a.evoluciones,[]);
 b.kit=child().kit;b.torre2Johto100=false;
 assert.equal(link([a],[b]),false);
 assert.equal(link([a],[]),false);
 const changed=parent();changed.evoluciones=[{dex:'0123',nombre:'POWER UP'}];
 assert.equal(link([changed],[child()]),false,'Unknown earlier stage must be reviewed, not overwritten');
});
test('the actual addAllJohtoSpecies calls the bridge before returning its roster',()=>{
 assert.match(src,/bridgeAddedScytherToScizor\(original,result\);/);
 assert.match(src,/const nativeNames=new Set\(\),nativeDex=new Set\(\)/);
});
