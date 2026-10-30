// Focused regression: Misty's leader team must never replace a wild encounter.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';

const root=path.resolve(process.env.PREVIEW_ROOT||'_site','arena2d');
const modules=JSON.parse(fs.readFileSync(path.join(root,'version.json'),'utf8')).modules;
const base=path.join(root,modules,'torre2');
const core=await import(pathToFileURL(path.join(base,'campaign-core.js')).href);
const party=await import(pathToFileURL(path.join(base,'party-battle.js')).href);
const capture=await import(pathToFileURL(path.join(base,'capture-arena.js')).href);
const records=new Map();
globalThis.localStorage={
 getItem:key=>records.get(key)??null,
 setItem:(key,value)=>records.set(key,String(value)),
 removeItem:key=>records.delete(key)
};

test("Misty's grass uses the actual random wild species, not leader Staryu",()=>{
 const state=core.createCampaign('squirtle');
 state.stage=1;
 state.trainer=core.TRAINERS_PER_GYM(1);
 core.saveCampaign(state);
 const found=core.startWildEncounter(state,()=>0); // Route's first species: Zubat
 assert.equal(found.ok,true,found.reason);
 assert.equal(found.encounter.id,'zubat');
 const match=core.startWildBattle(state);
 const opponent={id:match.p2,level:match.torre2.enemyLevel,
  leader:state.trainer>=core.TRAINERS_PER_GYM(state.stage)};
 // Deliberately pass the leader flag to assert defense in depth.
 const lineup=party.createPartyMatch(state,opponent,true);
 assert.equal(lineup.foes.length,1);
 assert.equal(lineup.foes[0].id,found.encounter.id);
 assert.equal(match.p2,found.encounter.id);
 const caught=core.attemptCapture(state,()=>0,'pokeball',{
  duringBattle:true,hpPercent:1,hp:1,hpMax:100,status:'sleep'
 });
 assert.equal(caught.ok,true);
 assert.equal(caught.pokemon.id,found.encounter.id);
 assert.ok(state.dexCaught.includes(found.encounter.id));
 assert.ok(core.readCampaign().dexCaught.includes(found.encounter.id));
 assert.equal(state.pendingWild,null);
});

test('A real Staryu encounter awards Staryu, not Zubat, after a successful throw',()=>{
 const state=core.createCampaign('squirtle');
 state.stage=1;state.trainer=core.TRAINERS_PER_GYM(1);
 state.pendingWild={id:'staryu',stage:1,trainer:state.trainer,level:18,hpPercent:17};
 core.saveCampaign(state);
 const match=core.startWildBattle(state);
 const opponent={id:match.p2,level:match.torre2.enemyLevel,leader:true};
 const battle=party.createPartyMatch(state,opponent,true);
 assert.deepEqual(battle.foes.map(p=>p.id),['staryu']);
 assert.equal(match.p2,'staryu');
 const result=core.attemptCapture(state,()=>0,'pokeball',{
  duringBattle:true,hpPercent:17,hp:17,hpMax:100,status:'sleep'
 });
 assert.equal(result.ok,true);
 assert.equal(result.pokemon.id,'staryu');
 assert.ok(state.dexCaught.includes('staryu'));
 assert.equal(core.readCampaign().team.at(-1).id,'staryu');
 assert.equal(core.readCampaign().pendingWild,null);
});
test('The shown enemy identity must match the pending species before throwing',()=>{
 const source=fs.readFileSync(new URL('../tools/pokearena/torre2-capture-arena.js',import.meta.url),'utf8');
 assert.match(source,/scene\.datos\?\.p2!==save\.pendingWild\.id/);
});

test('Wild grass is always separate from Misty team (including Staryu itself)',()=>{
 const state=core.createCampaign('squirtle');
 state.stage=1;state.trainer=core.TRAINERS_PER_GYM(1);
 state.pendingWild={id:'staryu',stage:1,trainer:state.trainer,level:18,hpPercent:100};
 const match=core.startWildBattle(state);
 const lineup=party.createPartyMatch(state,{id:match.p2,level:18,leader:true},true);
 assert.deepEqual(lineup.foes.map(x=>x.id),['staryu']);
});

test('The grass UI only highlights recorded captures, with no positive marker',()=>{
 const source=fs.readFileSync(new URL('../tools/pokearena/torre2-campaign-scene.js',import.meta.url),'utf8');
 assert.match(source,/const caught=new Set\(state\.dexCaught\|\|\[\]\)/);
 assert.match(source,/const owned=caught\.has\(id\)/);
 assert.match(source,/owned\?0x24553f:0x223345/);
 assert.doesNotMatch(source,/id\.toUpperCase\(\)\+\(ok\?' ✓'/);
});

test('Campaign HUD, capture ball and party all use the same pixel atlas',()=>{
 const art=fs.readFileSync(new URL('../tools/pokearena/torre2-campaign-art.js',import.meta.url),'utf8');
 const capture=fs.readFileSync(new URL('../tools/pokearena/torre2-capture-arena.js',import.meta.url),'utf8');
 const lineup=fs.readFileSync(new URL('../tools/pokearena/torre2-party-battle.js',import.meta.url),'utf8');
 assert.match(art,/import \{drawBallSprite\} from '\.\/ball-sprites\.js'/);
 assert.match(art,/return drawBallSprite\(g,x,y,'pokeball'/);
 assert.match(capture,/const ballSprite=originalBallSprite\(scene,end\.x,end\.y,kind,16,2309\)/);
 assert.match(lineup,/const hudBalls=Array\.from\(/);
 assert.match(lineup,/originalBallSprite\(scene,0,0,'pokeball',16,2481\)/);
});

test('One Pokéball touch chooses common first, then Great/Ultra without wasting rarer balls',()=>{
 assert.equal(capture.selectCaptureBall({pokeball:3,greatball:5,ultraball:5}),'pokeball');
 assert.equal(capture.selectCaptureBall({pokeball:0,greatball:2,ultraball:8}),'greatball');
 assert.equal(capture.selectCaptureBall({pokeball:0,greatball:0,ultraball:1}),'ultraball');
 assert.equal(capture.selectCaptureBall({pokeball:0,greatball:0,ultraball:0}),null);
 const source=fs.readFileSync(new URL('../tools/pokearena/torre2-capture-arena.js',import.meta.url),'utf8');
 assert.match(source,/torre2-single-capture/);
 assert.match(source,/function captureOnce\(/);
 assert.doesNotMatch(source,/function showChoices\(/,'Single button replaces three-row modal');
 assert.doesNotMatch(source,/scene\.fase='torre2-aim'/);
});
test('Player gets 3 voluntary switches per battle; forced KO is not a manual request',()=>{
 assert.equal(party.PLAYER_MANUAL_SWITCH_LIMIT,3);
 const state=core.createCampaign('squirtle');
 const match=party.createPartyMatch(state,{id:'rattata',level:5},true);
 assert.equal(match.playerManualSwitches,0);
 assert.equal(match.playerPotionUses,0);
 assert.equal(party.canPlayerManualSwitch(match,1),true);
 match.playerIndex=1;match.playerManualSwitches=1;
 assert.equal(party.canPlayerManualSwitch(match,0),true);
 match.playerIndex=0;match.playerManualSwitches=3;
 assert.equal(party.canPlayerManualSwitch(match,1),false);
 // Enemy tactical swaps and knocked-out Pokémon replacements are separate.
 assert.equal(match.changes,0);
 const source=fs.readFileSync(new URL('../tools/pokearena/torre2-party-battle.js',import.meta.url),'utf8');
 assert.match(source,/if\(side===0&&kind==='switch'\)/);
 assert.match(source,/if\(kind==='faint'\)/);
});
test('Arena top level-cap table removed without deleting Kanto level-cap rules',()=>{
 const source=fs.readFileSync(new URL('../tools/pokearena/torre2-campaign-scene.js',import.meta.url),'utf8');
 assert.doesNotMatch(source,/fillRoundedRect\(189,5,262,24,3\)/);
 assert.doesNotMatch(source,/'SEU NV\.'/);
 assert.match(source,/hardCap:currentLevelCap\(state.stage\)/);
});
