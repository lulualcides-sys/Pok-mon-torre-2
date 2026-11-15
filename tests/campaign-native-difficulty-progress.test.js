import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const source=readFileSync(new URL('../tools/pokearena/torre2-campaign-core.js',import.meta.url),'utf8');
const start=source.indexOf('export function campaignDifficultyTier(');
const end=source.indexOf('export function currentOpponent(',start);
assert.ok(start>0&&end>start,'Campaign native CPU tier selector missing');
const difficulty=vm.runInNewContext(source.slice(start,end)
 .replace('export function','function')+'\ncampaignDifficultyTier',Object.create(null));
test('regional regular trainers progress smoothly into Master League',()=>{
 assert.equal(difficulty(0,false,'trainer'),'facil');
 assert.equal(difficulty(3,false,'trainer'),'normal');
 assert.equal(difficulty(5,false,'trainer'),'normal');
 assert.equal(difficulty(6,false,'trainer'),'dificil');
 assert.equal(difficulty(7,false,'rocket'),'dificil');
 assert.equal(difficulty(8,false,'trainer'),'maestro');
});
test('early rival is a meaningful challenge; approved boss tiers are stable',()=>{
 assert.equal(difficulty(1,false,'rival'),'normal');
 assert.equal(difficulty(0,true),'normal');
 assert.equal(difficulty(4,true),'dificil');
 assert.equal(difficulty(8,true),'maestro');
});
test('stage and save structure and full regional trainer teams survive unchanged',()=>{
 assert.match(source,/const encounter=regionalTrainer\(s\.stage,s\.trainer\)/);
 assert.match(source,/role==='rocket'\?regionalRocket\(s\.stage,s\.trainer\)/);
 assert.match(source,/const tier=campaignDifficultyTier\(s\.stage,opponent\.leader,opponent\.kind\)/);
 assert.match(source,/export const SAVE_KEY='pokemon-torre-2-kanto-campaign-v1'/);
 assert.match(source,/leaderTeam:\['geodude','onix'\]/);
});
