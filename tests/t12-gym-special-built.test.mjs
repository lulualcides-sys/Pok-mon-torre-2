import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';

const root=path.resolve(process.env.PREVIEW_ROOT||'_site','arena2d');
const version=JSON.parse(fs.readFileSync(path.join(root,'version.json'),'utf8')).modules;
const basedir=path.join(root,version);
const load=async p=>import(pathToFileURL(path.join(basedir,p)).href);
const core=await load('torre2/campaign-core.js');
const partyMod=await load('torre2/party-battle.js');
const tactics=await load('torre2/trainer-strategy.js');
const {GEN3_TYPES}=await load('torre2/gen3-types.js');
const {buscar,etapaDe}=await load('datos.js');

test('T12 all eight actual compiled gym rosters expose real moves and some useful RMB/Q opportunities',()=>{
 let rendered=0,eligible=0,coverage=[];
 for(let stage=0;stage<8;stage++){
  const save=core.createCampaign('bulbasaur');
  save.stage=stage;save.trainer=core.TRAINERS_PER_GYM(stage);
  const opponent=core.currentOpponent(save);
  const party=partyMod.createPartyMatch(save,opponent);
  const initial=JSON.stringify(party);
  assert.equal(party.gymLeader,true);
  let stageCast=0;
  for(const member of party.foes){
   const {def,etapa}=buscar(member.id);
   const types=etapaDe(def,etapa).tipos||[];
   for(const targetType of GEN3_TYPES){
    const actor={x:0,y:0,t:6,hp:100,hpMax:100,tipos:types,
     energia:300,calor:0,cd:{lmb:0,rmb:0,q:0,e:0},est:{},kit:member.loadout};
    const foe={x:75,y:0,hp:100,hpMax:100,tipos:[targetType],est:{}};
    const scene={fase:'lucha',t:6,datos:{torre2:{party:{gymLeader:true}}}};
    const state={nextBasicAt:0,nextSpecialAt:0};
    const input={mx:0,my:0};
    const result=tactics.pressureGymLeaderInput(scene,actor,foe,input,state);
    rendered++;
    if(result?.rmb||result?.q){
     eligible++;stageCast++;
     assert.equal(result.e,false);
     assert.equal(state.nextSpecialAt,8.3);
     assert.ok(['rmb','q'].some(slot=>result[slot]&&member.loadout[slot]?.forma));
     assert.equal(actor.energia,300,'No free energy consumption or bonus damage');
    }
   }
  }
  coverage.push({stage,casts:stageCast,pokemon:party.foes.length});
  assert.equal(JSON.stringify(party),initial,'Tactics cannot edit authored gym loadouts');
 }
 assert.equal(coverage.length,8);
 assert.ok(eligible>0,'Actual built gym kits should expose a legitimate secondary cast');
 assert.ok(rendered>100);
});

test('T12 browser modules should only trigger assists for campaign leaders',()=>{
 const actor={x:0,y:0,t:6,hp:100,hpMax:100,
  energia:60,calor:0,cd:{lmb:0,rmb:0,q:0},tipos:['FIRE'],
  kit:{lmb:{forma:'native',tipo:'FIRE',dano:4,alcance:150,coste:0},
   rmb:{forma:'native',tipo:'FIRE',dano:20,alcance:150,coste:1}}};
 const foe={x:70,y:0,hp:100,tipos:['GRASS'],est:{}};
 const input={mx:0,my:0};
 for(const config of [{modo:'arena'},{modo:'versus'},
  {torre2:{party:{gymLeader:false}}}]){
  const scene={fase:'lucha',t:6,datos:config};
  assert.strictEqual(tactics.pressureGymLeaderInput(scene,actor,foe,input,{}),input);
 }
});
