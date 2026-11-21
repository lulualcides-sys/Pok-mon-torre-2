import test from 'node:test';
import assert from 'node:assert/strict';
import {encodeSignal,decodeSignal,createRoomServer,ROOM_CODE} from '../tools/pokearena/torre2-multiplayer-core.js';

// Real Chromium data-channel offer/answer (mDNS host candidate).
const OFFER='v=0\r\no=- 5871762795932698882 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\na=group:BUNDLE 0\r\na=extmap-allow-mixed\r\na=msid-semantic: WMS\r\nm=application 9 UDP/DTLS/SCTP webrtc-datachannel\r\nc=IN IP4 0.0.0.0\r\n'+
 'a=candidate:3573799634 1 udp 2113937151 f1683800-3382-4009-ba86-9aec62638c58.local 39420 typ host generation 0 network-cost 999\r\n'+
 'a=candidate:9 1 udp 1677729535 177.10.20.30 51234 typ srflx raddr 0.0.0.0 rport 0\r\n'+
 'a=candidate:8 1 udp 1677729535 2804:14c:65:8b00::1 51235 typ srflx raddr :: rport 0\r\n'+
 'a=candidate:7 1 tcp 1518280447 192.168.0.10 9 typ host tcptype active\r\n'+
 'a=ice-ufrag:7tKY\r\na=ice-pwd:/ZYH9NgR5WmqR+lRrGhpb74A\r\na=ice-options:trickle\r\n'+
 'a=fingerprint:sha-256 A4:DF:AE:4E:C0:9F:CC:08:1B:4D:95:D9:56:1F:81:00:05:E5:17:B9:AB:68:C3:87:AE:7D:C6:77:DF:0E:62:83\r\n'+
 'a=setup:actpass\r\na=mid:0\r\na=sctp-port:5000\r\na=max-message-size:262144\r\n';
test('short codes: letters and digits only, about 5× shorter, essential SDP kept',async()=>{
 const code=await encodeSignal({type:'offer',sdp:OFFER});
 assert.match(code,/^T2O[1-9A-HJ-NP-Za-km-z]+$/,'no _ * ~ or look-alike characters');
 assert.ok(code.length<200,'short: '+code.length);
 const d=await decodeSignal(code);
 assert.equal(d.type,'offer');
 for(const part of ['a=ice-ufrag:7tKY','a=ice-pwd:/ZYH9NgR5WmqR+lRrGhpb74A','a=setup:actpass','a=mid:0',
  'a=fingerprint:sha-256 A4:DF:AE:4E:C0:9F:CC:08:1B:4D:95:D9:56:1F:81:00:05:E5:17:B9:AB:68:C3:87:AE:7D:C6:77:DF:0E:62:83',
  ' f1683800-3382-4009-ba86-9aec62638c58.local 39420 typ host',' 177.10.20.30 51234 typ srflx',' 2804:14c:65:8b00:0:0:0:1 51235 typ srflx',
  'm=application 9 UDP/DTLS/SCTP webrtc-datachannel'])assert.ok(d.sdp.includes(part),part);
 assert.ok(!d.sdp.includes(' tcp '),'TCP candidates are dropped');
});
test('short codes: found inside a WhatsApp message, damaged codes refused',async()=>{
 const code=await encodeSignal({type:'answer',sdp:OFFER.replace('a=setup:actpass','a=setup:active')});
 assert.ok(code.startsWith('T2R'));
 for(const pasted of [code,'[21:30, 20/11] João: '+code,'João: '+code+'21',code.slice(0,50)+'\n'+code.slice(50)+'\n '])
  assert.equal((await decodeSignal(pasted)).type,'answer',pasted.slice(0,30));
 await assert.rejects(()=>decodeSignal(code.slice(0,-4)),/incompleto/);
 await assert.rejects(()=>decodeSignal(code.slice(0,40)+'x'+code.slice(41)),/incompleto|inválido/);
 await assert.rejects(()=>decodeSignal('qualquer coisa'),/inválido/);
});
test('old long codes (T2MP1:) are still read',async()=>{
 const json=JSON.stringify({type:'offer',sdp:'v=0\r\n'});
 const old='T2MP1:j'+Buffer.from(json).toString('base64url');
 assert.deepEqual(await decodeSignal('oi '+old),{type:'offer',sdp:'v=0\r\n'});
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

test('quick room: 4 letters without look-alikes, typed in any case',async()=>{
 const {newRoomCode,parseRoomCode,hostPeerId,signalUrl,ROOM_LETTERS,SIGNAL_URL}=await import('../tools/pokearena/torre2-multiplayer-core.js');
 assert.ok(!/[IOZ01]/.test(ROOM_LETTERS));
 let r=0;const code=newRoomCode(()=>(r=(r+.37)%1));
 assert.match(code,/^[A-HJ-NP-Y]{4}$/);
 assert.equal(parseRoomCode(' '+code.toLowerCase()+' '),code);
 assert.equal(parseRoomCode('AB C-D'),'ABCD');
 assert.equal(parseRoomCode('ABC'),null);assert.equal(parseRoomCode('ABIO'),null);
 assert.equal(hostPeerId('ABCD'),'torre2-abcd');
 assert.equal(SIGNAL_URL,'wss://0.peerjs.com/peerjs');
 assert.equal(signalUrl(SIGNAL_URL,'torre2-abcd','t1'),'wss://0.peerjs.com/peerjs?key=peerjs&id=torre2-abcd&token=t1&version=1.5.4');
});
test('quick room screens: create/enter by 4 letters, long code kept as fallback',async()=>{
 const fs=await import('node:fs');
 const src=fs.readFileSync(new URL('../tools/pokearena/torre2-multiplayer.js',import.meta.url),'utf8');
 for(const part of ["'CRIAR SALA',()=>this.quickHost()","'ENTRAR NA SALA',()=>this.quickGuest()","'CÓDIGO LONGO (SEM SERVIDOR)',()=>this.manual()",
  "if(m.type==='OPEN')","this.raw({type:'HEARTBEAT'})","this.signal?.close();this.signal=null;"])assert.ok(src.includes(part),part);
});
