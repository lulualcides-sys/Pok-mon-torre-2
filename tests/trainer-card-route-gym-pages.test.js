/* Campaign card pages must not mislabel Rival/Rocket routes as GYMS.
 * Pure presentation: original encounter order, indexes and five-card grid.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const source=readFileSync('tools/pokearena/torre2-trainer-cards.js','utf8');
const body=source.match(/export function trainerCardSections\(stage,total\)\{([\s\S]*?)\n\}/)?.[1];
assert.ok(body,'Production trainerCardSections missing');
const pages=new Function('stage','total',body);

test('each Kanto gym page has exactly its 3/4 intermediates and leader',()=>{
 for(let stage=0;stage<8;stage++){
  const total=13+stage*2,sections=pages(stage,total);
  const gym=sections.at(-1),expected=stage===0?3:4;
  assert.equal(gym.kind,'gym');
  assert.deepEqual(gym.indices,Array.from({length:expected+1},(_,i)=>total-expected+i));
  assert.ok(sections.slice(0,-1).every(s=>s.kind==='route'));
  assert.ok(sections.slice(0,-1).every(s=>s.indices.length>=1&&s.indices.length<=5));
  assert.deepEqual(sections.flatMap(s=>s.indices),Array.from({length:total+1},(_,i)=>i));
  assert.equal(new Set(sections.flatMap(s=>s.indices)).size,total+1);
 }
});
test('Victory Road and all five League opponents have their own proper heading',()=>{
 const victory=pages(8,17);
 assert.equal(victory.at(-1).kind,'league');
 assert.deepEqual(victory.at(-1).indices,[17]);
 assert.ok(victory.slice(0,-1).every(s=>s.kind==='victory'));
 assert.deepEqual(victory.flatMap(s=>s.indices),Array.from({length:18},(_,i)=>i));
 for(let stage=9;stage<=12;stage++)
  assert.deepEqual(pages(stage,0),[{kind:'league',indices:[0]}]);
});
test('approved five-column card positions and save indices are unchanged',()=>{
 assert.match(source,/for\(let c=0;c<5;c\+\+\)/);
 assert.match(source,/const x=18\+c\*124,y=81,w=109,h=190;/);
 assert.match(source,/setData\('torre2-trainer-card-index',entry.index\)/);
 assert.match(source,/visible:visibleEntries\.map\(e=>e.index\)/);
 assert.match(source,/kind==='route'\?'CAMINHO PARA '/);
 assert.match(source,/kind==='victory'\?'ESTRADA DA VITÓRIA'/);
 assert.match(source,/kind==='league'\?'LIGA ÍNDIGO/);
 assert.doesNotMatch(source,/saveCampaign\(|resetCampaign\(/);
});
