import test from 'node:test';
import assert from 'node:assert/strict';
import {regularLeaguesCleared,endgameLeagueAvailable,leagueOpponentAvailable,challengeAvailable}
 from '../tools/pokearena/torre2-league-0695.js';
import {backportLeague0695} from '../tools/pokearena/torre2-league-0695-compat.mjs';

const leagues=[
 {id:'forest',rivales:[{id:'pika'},{id:'zubat'}]},
 {id:'island',rivales:[{id:'slugma'}]},
 {id:'hell',conConexion:true,rivales:[{id:'boss'}]}
];
const rivals=l=>l.rivales;
const victories=new Set();
const won=id=>victories.has(id);
test('Alpha 0.69.5: all standard leagues accessible on a fresh save',()=>{
 for(const league of leagues.slice(0,2))
  assert.equal(leagueOpponentAvailable(league,leagues,rivals,won),true);
 assert.equal(leagueOpponentAvailable(leagues[2],leagues,rivals,won),false);
 assert.equal(challengeAvailable(leagues,rivals,won),false);
});
test('Hell League and Challenges unlock only when every regular rival is beaten',()=>{
 victories.add('pika');victories.add('slugma');
 assert.equal(regularLeaguesCleared(leagues,rivals,won),false);
 assert.equal(endgameLeagueAvailable(leagues,rivals,won),false);
 victories.add('zubat');
 assert.equal(regularLeaguesCleared(leagues,rivals,won),true);
 assert.equal(leagueOpponentAvailable(leagues[2],leagues,rivals,won),true);
 assert.equal(challengeAvailable(leagues,rivals,won),true);
 victories.clear();
});
test('Legacy progress, existing Hell victory and challenge records stay valid',()=>{
 assert.equal(endgameLeagueAvailable(leagues,rivals,won,true),true);
 assert.equal(challengeAvailable(leagues,rivals,won,false,[{melhor:1}]),false);
 assert.equal(challengeAvailable(leagues,rivals,won,false,[{mejor:1}]),true);
 victories.add('boss');
 assert.equal(endgameLeagueAvailable(leagues,rivals,won),true);
 victories.clear();
});
test('Empty invalid league set never unlocks Hell by accident',()=>{
 assert.equal(regularLeaguesCleared([],rivals,won),false);
 assert.equal(endgameLeagueAvailable([],rivals,won),false);
});
const base={
 league:'import{ROSTER}from"./datos.js";const LIGA={ligas:[]};function estadoRival(id){if(vencido(id))return"vencido";return"cerrado"}function vencer(id,conId){return conId};'.padEnd(210,' '),
 scene:'class Liga{copaCerrada(k){if(k===KR)return!retosAbiertos();const a=ligaAbierta();return a!==null&&k>a&&!progreso().abierta}cuentaCopa(k){return k}}'.padEnd(210,' '),
 challenges:'import{LIGA,rivalesDe,vencido}from"./liga.js";const RIVAL_LLAVE="mewtwo";const retosAbiertos=()=>vencido(RIVAL_LLAVE);'.padEnd(210,' ')
};
test('Adapter changes League gates but does not touch saves, kits, VFX or the roster',()=>{
 const patched=backportLeague0695(base);
 assert.ok(patched.league.includes('leagueOpponentAvailable(liga'));
 assert.ok(patched.scene.includes('endgameLeagueAvailable(LIGA.ligas'));
 assert.ok(patched.challenges.includes('challengeAvailable(LIGA.ligas'));
 assert.match(patched.challenges,/import\{LIGA,rivalesDe,vencido,progreso\}from"\.\/liga\.js";/);
 for(const source of Object.values(patched))
  assert.ok(!source.includes('localStorage.setItem('));
 assert.ok(patched.league.includes('const LIGA={ligas:[]}'));
});
test('Adapter refuses duplicate or incompatible native code rather than lying about a release',()=>{
 const patched=backportLeague0695(base);
 assert.throws(()=>backportLeague0695(patched),/already installed|Unrecognized/);
 assert.throws(()=>backportLeague0695({...base,scene:'unrecognized'.repeat(20)}),/structure|Unrecognized/);
 assert.throws(()=>backportLeague0695({...base,challenges:base.challenges.replace('vencido(RIVAL_LLAVE)','true')}),/Unrecognized/);
});
