import test from 'node:test';
import assert from 'node:assert/strict';
import {encodeSignal,decodeSignal,createRoomServer,ROOM_CODE} from '../tools/pokearena/torre2-multiplayer-core.js';

test('signal codes round-trip and stay short enough for a chat message',async()=>{
 const sdp='v=0\r\no=- 1 2 IN IP4 127.0.0.1\r\n'+'a=candidate:1 1 udp 2122260223 192.168.0.10 50000 typ host\r\n'.repeat(4);
 const code=await encodeSignal({type:'offer',sdp});
 assert.ok(code.startsWith('T2MP1:'));
 assert.ok(code.length<sdp.length,'compressed');
 assert.deepEqual(await decodeSignal(code+'\n '),{type:'offer',sdp});
 await assert.rejects(()=>decodeSignal('qualquer coisa'),/inválido/);
});

test('emulated room server: create, join, relay, ping and leave like the base server',()=>{
 const out={host:[],guest:[]};
 const srv=createRoomServer((side,m)=>out[side].push(m),{hostName:'Alcide',guestName:'Amigo'});
 srv.handle('guest',{t:'$crear',rid:1});
 assert.equal(out.guest.pop().t,'$error','only the host creates');
 srv.handle('host',{t:'$crear',rid:2});
 assert.deepEqual(out.host.pop(),{t:'$sala',codigo:ROOM_CODE,rol:'anfitrion',rid:2});
 srv.handle('guest',{t:'$unirse',rid:3,codigo:'XXXX'});
 assert.equal(out.guest.pop().motivo,'THAT ROOM NO LONGER EXISTS');
 srv.names.guestName='Bia';
 srv.handle('guest',{t:'$unirse',rid:4,codigo:ROOM_CODE.toLowerCase()});
 assert.deepEqual(out.guest.pop(),{t:'$sala',codigo:ROOM_CODE,rol:'invitado',rival:'Alcide',rid:4});
 assert.deepEqual(out.host.pop(),{t:'$rival',dentro:true,nombre:'Bia'});
 // game messages are relayed to the other side untouched
 srv.handle('host',{t:'empezar',p1:'pikachu',p2:'eevee',arena:'estadio'});
 assert.deepEqual(out.guest.pop(),{t:'empezar',p1:'pikachu',p2:'eevee',arena:'estadio'});
 srv.handle('guest',{t:'s',k:[1,2]});assert.deepEqual(out.host.pop(),{t:'s',k:[1,2]});
 srv.handle('host',{t:'$ping',k:'srv',n:5});assert.deepEqual(out.host.pop(),{t:'$pong',k:'srv',n:5});
 srv.handle('guest',{t:'$resultado',rid:9,gana:0});assert.deepEqual(out.guest.pop(),{t:'$resultado',ok:true,rid:9});
 srv.handle('guest',{t:'$salir'});assert.deepEqual(out.host.pop(),{t:'$rival',dentro:false});
 srv.handle('host',{t:'hola'});assert.equal(out.guest.length,0,'no relay once the friend left');
});
