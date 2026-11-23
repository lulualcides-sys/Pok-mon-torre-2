// Comparador estático de capturas do cliente-base: módulos e espécies nativas,
// com conflito para espécies Dex 1–251 que o Torre 2 já adicionou.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const load=()=>import('../tools/pokearena/compare-upstream-captures.mjs');

async function capture(src,files){
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'cmp-'));
 for(const [rel,text] of Object.entries(files)){
  const f=path.join(root,'source',src,rel);
  await fs.mkdir(path.dirname(f),{recursive:true});
  await fs.writeFile(f,text);
 }
 return root;
}
const datos=list=>'const X=1;const TODOS=['+list.join(',')+'];export{TODOS};';
const PIKA='{id:"pikachu",dex:"0025",nombre:"PIKACHU",tipos:["ELECTRIC"],evoluciones:[{dex:"0026",nombre:"RAICHU",hp:9,kit:{lmb:{dano:2}}}]}';
const HOOPA='{id:"hoopa",dex:"0720",nombre:"HOOPA",tipos:["PSYCHIC"],kit:{lmb:{estado:"CONFUSION",txt:"a}b"}}}';
const HOOPA2='{id:"hoopa",dex:"0720",nombre:"HOOPA",tipos:["PSYCHIC"],kit:{lmb:{txt:"a}b"}}}';
const GRIMER='{id:"grimer",dex:"0088",nombre:"GRIMER",tipos:["POISON"],evoluciones:[{dex:"0089",nombre:"MUK",hp:1}]}';

test('detecta módulos, espécies novas/alteradas e conflitos Dex 1–251',async()=>{
 const {compare,report}=await load();
 const a=await capture('src-aaaaaaaaaa',{'datos.js':datos([PIKA,HOOPA]),'x.js':'1','old.js':'1'});
 const b=await capture('src-bbbbbbbbbb',{'datos.js':datos([PIKA,HOOPA2,GRIMER]),'x.js':'1','novo.js':'2'});
 const r=await compare(a,b);
 assert.deepEqual(r.added,['novo.js']);
 assert.deepEqual(r.removed,['old.js']);
 assert.deepEqual(r.changed,['datos.js']);
 assert.deepEqual(r.newSpecies.map(s=>s.id),['grimer']);
 assert.deepEqual(r.changedSpecies.map(s=>s.id),['hoopa']);
 assert.deepEqual(r.conflicts,[{id:'grimer',dex:88},{id:'grimer',dex:89}]);
 assert.deepEqual(r.newSpecies[0].nombres,['GRIMER','MUK']);
 assert.match(report(r),/Conflitos com espécies do Torre 2/);
});

test('chaves dentro de strings não quebram o fatiamento de TODOS',async()=>{
 const {speciesBlocks}=await load();
 const s=speciesBlocks(datos([HOOPA,PIKA]));
 assert.deepEqual(s.map(x=>x.id),['hoopa','pikachu']);
 assert.deepEqual(s[1].dex,[25,26]);
});
