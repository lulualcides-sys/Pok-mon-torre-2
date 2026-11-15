import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const source=readFileSync(new URL('../tools/pokearena/torre2-campaign-core.js',import.meta.url),'utf8');
const begin=source.indexOf('export function campaignTrainerTitle(');
const end=source.indexOf('export function currentOpponent(',begin);
assert.ok(begin>0&&end>begin,'Campaign functions must remain part of the playable core');
const pure=source.slice(begin,end).replaceAll('export function','function');
const {campaignTrainerTitle,campaignDifficultyTier}=vm.runInNewContext(
 pure+'\n({campaignTrainerTitle,campaignDifficultyTier})',Object.create(null));

test('trainer labels vary by route without touching rival/Rocket identity',()=>{
 assert.equal(campaignTrainerTitle(0,0,'trainer'),'Montanhista 1');
 assert.equal(campaignTrainerTitle(0,1,'trainer'),'Escoteiro 2');
 assert.equal(campaignTrainerTitle(1,0,'trainer'),'Pescador 1');
 assert.equal(campaignTrainerTitle(6,0,'trainer'),'Aventureiro 1');
 assert.equal(campaignTrainerTitle(0,2,'rival'),'Rival');
 assert.equal(campaignTrainerTitle(5,3,'rocket'),'Equipe Rocket');
});
test('CPU progression is smooth for ordinary route opponents',()=>{
 assert.equal(campaignDifficultyTier(0,false,'trainer'),'facil');
 assert.equal(campaignDifficultyTier(2,false,'rival'),'normal');
 assert.equal(campaignDifficultyTier(3,false,'trainer'),'normal');
 assert.equal(campaignDifficultyTier(6,false,'trainer'),'dificil');
 assert.equal(campaignDifficultyTier(8,false,'trainer'),'dificil');
});
test('gym and Elite Four keep their approved native tiers',()=>{
 assert.equal(campaignDifficultyTier(0,true),'normal');
 assert.equal(campaignDifficultyTier(4,true),'dificil');
 assert.equal(campaignDifficultyTier(8,true),'maestro');
 assert.equal(campaignDifficultyTier(12,true),'maestro');
});
test('core uses the new actual routing, preserving canonical rosters and save keys',()=>{
 assert.match(source,/name:leader\?gym\.leader:campaignTrainerTitle\(s\.stage,s\.trainer,role\)/);
 assert.match(source,/const tier=campaignDifficultyTier\(s\.stage,opponent\.leader,opponent\.kind\)/);
 assert.match(source,/export const SAVE_KEY='pokemon-torre-2-kanto-campaign-v1'/);
 assert.match(source,/leaderTeam:\['geodude','onix'\]/);
});
