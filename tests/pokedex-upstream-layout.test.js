import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizePokedexNameColumn,selectPokedexArenaMove} from '../tools/pokearena/torre2-pokedex-pages.mjs';
test('Pokédex accepts fixed and measured upstream name columns without removing name clipping',()=>{
 const legacy='const nx=TX+(esTactil()?52:38);';
 assert.equal(normalizePokedexNameColumn(legacy),'const nx=TX+72;');
 const measured='const nx=Math.max(TX+(esTactil()?52:38),TX+6+Math.max(...etiquetas.map(t=>t.width))+8);';
 const clip='c.add(estrechar(texto(this,nx,y+3,h.nombre,{tam:8}),PX+PW-14-tw-nx));';
 const result=normalizePokedexNameColumn(measured+clip);
 assert.ok(result.includes('Math.max(TX+72,TX+6+Math.max(...etiquetas.map(t=>t.width))+8)'));
 assert.ok(result.endsWith(clip));
 assert.throws(()=>normalizePokedexNameColumn('const nx=UNRECOGNIZED;'),/unexpectedly changed/);
});

test('Pokédex prioritizes actual native Poké Arena stage kit without borrowing campaign endgame moves',()=>{
 const canonical=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]/g,'');
 const native={nombre:'Thunderbolt',forma:'chorro',dano:14,tipo:'ELECTRIC'};
 const campaign={nombre:'Tackle',forma:'golpe',dano:5,tipo:'NORMAL'};
 assert.equal(selectPokedexArenaMove(native,campaign,'Tackle',canonical),native);
 // Original native stage leaves this skill unimplemented; a campaign
 // fallback may only appear if it really matches the expected role.
 assert.equal(selectPokedexArenaMove({nombre:'LOCKED',pendiente:true},campaign,'Tackle',canonical),campaign);
 assert.equal(selectPokedexArenaMove(null,campaign,'Psychic',canonical),null);
 assert.equal(selectPokedexArenaMove({nombre:'Psychic',forma:'chorro',torre2Unavailable:true},
  campaign,'Psychic',canonical),null);
 assert.equal(selectPokedexArenaMove({nombre:'Surf',forma:'chorro',pendiente:true},
  {nombre:'Surf',forma:'chorro',pendiente:true},'Surf',canonical),null);
});
