// Multiplayer 3x3 (owner request 2026-11-20): friendly-room hooks + team check.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const __dirname=path.dirname(fileURLToPath(import.meta.url));

const ROOM='class Sala{vistaSala(){this.pintarSala();this.saludar(true)}panelJugador(x){}'+
 'pintarSala(){this.pintarConexion();const distintas=1}'+
 'saludar(pide){red.enviar({t:"hola",id:this.miId,pide:pide?1:0})}alRival(m){}'+
 'alHola(m){this.rival=m.id??null;this.pintarSala()}'+
 'comprobarInicio(){const m={t:"empezar",p1:this.miId,p2:this.rival,arena:this.arena};red.enviar(m);this.empezarCombate(m)}'+
 'empezarCombate(m){run(()=>this.scene.start("combate",{p1:m.p1,nombres:red.lado===0?[yo,otro]:[otro,yo]}))}async compartir(){}}';

test('room patch adds every hook once and keeps the native code',async()=>{
 const {patchFriendlyRoomTeams}=await import('../tools/pokearena/torre2-sala-teams-patch.mjs');
 const out=patchFriendlyRoomTeams(ROOM);
 for(const hook of ['vista','pintar','hola','alHola','empezar','combate'])
  assert.equal(out.split('globalThis.__torre2Sala?.'+hook+'?.(').length,2,hook);
 // Native statements are still there, unchanged.
 for(const part of ['red.enviar(m);this.empezarCombate(m)','this.rival=m.id??null;','this.saludar(true)}panelJugador('])
  assert.ok(out.includes(part),part);
 // A changed base client is refused instead of patched blindly.
 assert.throws(()=>patchFriendlyRoomTeams(ROOM.replace('pide:pide?1:0})}alRival(','pide:pide})}alRival(')),/base client changed/);
 assert.throws(()=>patchFriendlyRoomTeams(out),/base client changed/);
});

test('room patch is a no-op without the Torre 2 hook object',async()=>{
 const {patchFriendlyRoomTeams}=await import('../tools/pokearena/torre2-sala-teams-patch.mjs');
 const out=patchFriendlyRoomTeams(ROOM);
 const sent=[];let started=null;
 const red={lado:0,enviar:m=>sent.push(m)};
 const Sala=new Function('red','yo','otro','run',out+';return Sala')(red,'A','B',f=>f());
 const s=new Sala();
 s.miId='pikachu';s.rival='eevee';s.arena='estadio';
 s.scene={start:(k,d)=>{started=d}};
 s.comprobarInicio();
 assert.deepEqual(sent,[{t:'empezar',p1:'pikachu',p2:'eevee',arena:'estadio'}]);
 assert.deepEqual(Object.keys(started),['p1','nombres']);
});

test('3x3 team: exactly three different known Pokémon',async()=>{
 const {checkTeam,TEAM_SIZE}=await import('../tools/pokearena/torre2-multiplayer-core.js');
 assert.equal(TEAM_SIZE,3);
 const known=id=>['a','b','c','d'].includes(id);
 assert.deepEqual(checkTeam(['a','b','c'],known),{ok:true,team:['a','b','c']});
 assert.equal(checkTeam(['a','b'],known).ok,false);
 assert.equal(checkTeam(['a','b','x'],known).ok,false);
 assert.equal(checkTeam(['a','a','b'],known).reason,'repetido');
 assert.equal(checkTeam(null,known).ok,false);
});

test('publisher installs the room hooks in the published copy only',()=>{
 const pub=fs.readFileSync(path.join(__dirname,'../tools/pokearena/publish-alpha0762.mjs'),'utf8');
 assert.match(pub,/patchFriendlyRoomTeams\(await read\(path\.join\(original,'escenas\/sala\.js'\)\)\)/);
 assert.match(pub,/fs\.writeFile\(path\.join\(dest,'escenas\/sala\.js'\),salaPatched\)/);
 assert.ok(!/writeFile\(path\.join\(original/.test(pub),'original tree must stay untouched');
 const wf=fs.readFileSync(path.join(__dirname,'../.github/workflows/torre2-alpha0762-publish.yml'),'utf8');
 assert.equal(wf.split("'tools/pokearena/torre2-sala-teams-patch.mjs'").length,3);
});

test('4G/5G relay config: only valid TURN/STUN entries or an https URL',async()=>{
 const {turnConfig,cleanIceServers,hasRelay}=await import('../tools/pokearena/torre2-multiplayer-core.js');
 assert.deepEqual(turnConfig(''),{servers:[],url:null});
 assert.deepEqual(turnConfig(undefined),{servers:[],url:null});
 const ok=turnConfig(JSON.stringify([{urls:['turn:relay.example.com:3478','turns:relay.example.com:443?transport=tcp'],username:'u',credential:'p'}]));
 assert.equal(ok.servers.length,1);assert.ok(hasRelay(ok.servers));
 // TURN without credentials, scripts and bad schemes are dropped.
 assert.deepEqual(cleanIceServers([{urls:'turn:relay.example.com'}]),[]);
 assert.deepEqual(cleanIceServers([{urls:'javascript:alert(1)',username:'a',credential:'b'}]),[]);
 assert.deepEqual(cleanIceServers('x'),[]);
 assert.equal(turnConfig('{not json').servers.length,0);
 assert.deepEqual(turnConfig('https://app.metered.live/api/v1/turn/credentials?apiKey=abc'),
  {servers:[],url:'https://app.metered.live/api/v1/turn/credentials?apiKey=abc'});
 assert.equal(turnConfig('http://insecure.example/x').url,null);
 assert.equal(turnConfig('https://x.example/"+alert(1)+"').url,null);
 assert.ok(!hasRelay(cleanIceServers([{urls:'stun:stun.l.google.com:19302'}])));
});
