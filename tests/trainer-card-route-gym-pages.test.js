import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

// Pure function extracted from the actual release module. This tests the
// same implementation copied into the approved Alpha 0.71.3 overlay.
const source=readFileSync('tools/pokearena/torre2-trainer-cards.js','utf8');
const body=source.match(/export function trainerCardSections\(stage,total\)\{([\s\S]*?)\n\}/)?.[1];
assert.ok(body,'Missing actual campaign section pagination implementation');
const sections=new Function('stage','total',body);

const allIndices=groups=>groups.flatMap(group=>group.indices);
const assertSafePages=(stage,total)=>{
 const p=sections(stage,total),indices=allIndices(p);
 assert.deepEqual(indices,Array.from({length:total+1},(_,i)=>i),
  'No encounter may be omitted or repeated; save indices remain canonical');
 assert.equal(new Set(indices).size,indices.length);
 assert.ok(p.every(x=>x.indices.length>=1&&x.indices.length<=4));
 return p;
};

test('all 8 Kanto stages isolate 3/4 intermediates + gym leader from route opponents',()=>{
 for(let stage=0;stage<8;stage++){
  const total=13+stage*2,groups=assertSafePages(stage,total);
  // 4 cards per page: the gym (intermediates + leader) may take two pages,
  // but those pages come last, are all 'gym' and hold exactly its encounters.
  const intermediates=stage===0?3:4;
  const firstGym=groups.findIndex(x=>x.kind==='gym');
  const gymPages=groups.slice(firstGym);
  assert.ok(firstGym>0&&gymPages.every(x=>x.kind==='gym'));
  assert.deepEqual(allIndices(gymPages),Array.from({length:intermediates+1},
   (_,i)=>total-intermediates+i));
  assert.ok(groups.slice(0,firstGym).every(x=>x.kind==='route'));
 }
});

test('Victory Road opponents are separate from first Indigo League challenge',()=>{
 const pages=assertSafePages(8,17);
 assert.equal(pages.at(-1).kind,'league');
 assert.deepEqual(pages.at(-1).indices,[17]);
 assert.ok(pages.slice(0,-1).every(x=>x.kind==='victory'));
});

test('final League and Champion keep stable indices, including unusually large pages',()=>{
 for(let stage=9;stage<=12;stage++){
  assert.deepEqual(sections(stage,0),[{kind:'league',indices:[0]}]);
  const pages=assertSafePages(stage,11);
  assert.ok(pages.every(x=>x.kind==='league'));
 }
});
test('small and malformed progress states cannot break card rendering',()=>{
 for(const stage of [0,1,7,8,9,12])for(const total of [0,1,2,4,5,6,11])
  assertSafePages(stage,total);
 for(const args of [[-1,3],[0,-1],[2.2,4],[1,1.4],['1',4],[null,3]])
  assert.throws(()=>sections(...args),/Invalid campaign stage/);
});

test('only card pagination and headings changed: original sprites, touch and save keys retained',()=>{
 assert.match(source,/const visibleEntries=sections\[page\]\.indices\.map\(index=>all\[index\]\)/);
 assert.match(source,/const entry=visibleEntries\[c\]/);
 assert.match(source,/const visible=visibleEntries\.length;/);
 assert.match(source,/section:sections\[page\]\.kind/);
 assert.match(source,/visible:visibleEntries\.map\(e=>e\.index\)/);
 assert.match(source,/setData\('torre2-trainer-card-index',entry\.index\)/);
 assert.match(source,/const CW=110,GAP=8,X0=166,CY=56,CH=244;/);
 assert.match(source,/scenicBackdrop\(scene,layer,state\.stage\)/);
 assert.match(source,/scenicDiorama\(scene,layer,x\+7,y\+22,w-14,92/);
 assert.match(source,/kind==='route'\?'CAMINHO PARA '/);
 assert.match(source,/kind==='victory'\?'ESTRADA DA VITÓRIA'/);
 assert.match(source,/kind==='league'\?/);
 assert.match(source,/scene\.__torre2CardProgressKey!==progressKey/);
 assert.doesNotMatch(body,/saveCampaign|resetCampaign|localStorage|fetch|Math\.random/);
});
