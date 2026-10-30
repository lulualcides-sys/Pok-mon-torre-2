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
const records=new Map();
globalThis.localStorage={
 getItem:key=>records.get(key)??null,
 setItem:(key,value)=>records.set(key,String(value)),
 removeItem:key=>records.delete(key)
};

test('Misty's grass uses the actual random wild species, not leader Staryu',()=>{
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
 assert.match(capture,/const fieldBallScale=1\.6/);
 assert.match(lineup,/drawCaptureBall\(g,x,y,'pokeball',\.84\)/);
});
