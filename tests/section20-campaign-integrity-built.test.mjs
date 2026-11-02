import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const root=path.resolve(process.env.PREVIEW_ROOT||'_site','arena2d');
const ver=JSON.parse(fs.readFileSync(path.join(root,'version.json'),'utf8')).modules;
const core=await import(pathToFileURL(path.join(root,ver,'torre2/campaign-core.js')).href);
const {createPartyMatch}=await import(pathToFileURL(path.join(root,ver,'torre2/party-battle.js')).href);
function storage(){
 const kv=new Map();
 return {getItem:k=>kv.get(k)??null,setItem:(k,v)=>kv.set(k,String(v)),removeItem:k=>kv.delete(k)};
}
test('Unconscious active Pokémon is replaced by existing healthy reserve, never revived',()=>{
 const st=storage();globalThis.localStorage=st;
 const s=core.createCampaign('bulbasaur');
 s.team[0].hp=0;s.team[1].hp=29;
 const before={hp:s.team.map(p=>p.hp),uid:s.team.map(p=>p.uid),money:s.money,stage:s.stage,trainer:s.trainer};
 const match=core.startBattle(s);
 assert.equal(match.p1,'mewtwo');assert.equal(s.active,1);
 assert.deepEqual(s.team.map(p=>p.hp),before.hp);
 assert.deepEqual(s.team.map(p=>p.uid),before.uid);
 assert.equal(s.money,before.money);
 const foes=createPartyMatch(s,core.currentOpponent(s));
 assert.equal(foes.playerIndex,1);
 assert.equal(foes.friend[0].hp,0);
 assert.equal(foes.friend[1].hp,29);
 assert.equal(core.readCampaign(st).active,1,'Reserve selection persists without resetting game');
});
test('Whole party fainted cannot launch trainer or wild battle and must visit Center',()=>{
 const st=storage();globalThis.localStorage=st;
 const s=core.createCampaign('charmander');s.team.forEach(p=>p.hp=0);
 const baseline=JSON.stringify(s);
 assert.equal(core.ensureConsciousActive(s),false);
 assert.throws(()=>core.startBattle(s),/Centro Pokémon/);
 s.pendingWild={id:'rattata',stage:0,trainer:0,level:4};
 assert.throws(()=>core.startWildBattle(s),/Centro Pokémon/);
 assert.equal(s.wins,0);assert.equal(s.losses,0);
 assert.equal(s.team.every(p=>p.hp===0),true);
 assert.equal(s.trainer,0);
 assert.equal(JSON.stringify({...s,pendingWild:null}),baseline);
});
test('Brock records only Geodude on start; reserve Onix is not falsely seen',()=>{
 const st=storage();globalThis.localStorage=st;
 const s=core.createCampaign('squirtle');s.trainer=core.TRAINERS_PER_GYM(0);
 const info=core.currentOpponent(s);
 assert.equal(info.id,'onix');
 assert.equal(info.leader,true);
 core.startBattle(s);
 assert.ok(s.dexSeen.includes('geodude'));
 assert.ok(!s.dexSeen.includes('onix'),'Brock ace is unseen until sent to arena');
 const party=createPartyMatch(s,info);
 assert.deepEqual(party.foes.map(x=>x.id),['geodude','onix']);
 assert.deepEqual(party.foes.map(x=>x.level),[12,14]);
});
test('Champion starts with actual Pidgeot, never marks unseen Charizard early',()=>{
 const st=storage();globalThis.localStorage=st;
 const s=core.createCampaign('bulbasaur');s.stage=12;s.trainer=core.TRAINERS_PER_GYM(12);
 const opponent=core.currentOpponent(s);
 assert.equal(opponent.id,'charizard');
 core.startBattle(s);
 const match=createPartyMatch(s,opponent);
 assert.equal(match.foes[0].id,'pidgeot');
 assert.equal(match.foes.at(-1).id,'charizard');
 assert.ok(s.dexSeen.includes('pidgeot'));
 assert.ok(!s.dexSeen.includes('charizard'));
 assert.equal(s.wins,0);
});
test('Regular route trainer keeps its actual first opponent and correct level',()=>{
 const st=storage();globalThis.localStorage=st;
 const s=core.createCampaign('charmander');
 const foe=core.currentOpponent(s);
 core.startBattle(s);
 assert.ok(s.dexSeen.includes(foe.id));
 assert.equal(createPartyMatch(s,foe).foes[0].id,foe.id);
});
