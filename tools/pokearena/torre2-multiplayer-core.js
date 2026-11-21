/* Pokémon Torre 2 — Multiplayer by code: pure parts (no Phaser, no red.js).
 * Signal codes (WebRTC SDP <-> short text) and the emulated room server that
 * runs in the host's browser for the base client's 1v1 friendly match.
 */
export const ROOM_CODE='T2MP';
export const PREFIX='T2MP1:';
// Link control frames never reach red.js (their type starts with '#').
export const CONTROL='#';

// --- Signal codes (SDP) -----------------------------------------------------
const b64url=bytes=>{let s='';for(const b of bytes)s+=String.fromCharCode(b);
 return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')};
const unb64url=text=>{const s=atob(text.replace(/-/g,'+').replace(/_/g,'/'));
 return Uint8Array.from(s,c=>c.charCodeAt(0))};
async function pipe(bytes,stream){
 const out=new Response(new Blob([bytes]).stream().pipeThrough(stream));
 return new Uint8Array(await out.arrayBuffer());
}
// Short codes (owner request 2026-11-21: "código menor", errors when pasting).
// Only what WebRTC needs travels: ICE user/password, the DTLS fingerprint,
// the setup role and the UDP candidates (IPv4, IPv6 or mDNS name). The
// other side rebuilds a standard data-channel SDP. Text uses Base58 (letters
// and digits only): no "_" or "*" that WhatsApp turns into formatting, no
// look-alike 0/O/I/l. About 5× shorter than the old deflate+JSON code.
export const SHORT_PREFIX='T2';
const B58='123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
export function base58(bytes){
 let n=0n;for(const b of bytes)n=n*256n+BigInt(b);
 let out='';while(n>0n){out=B58[Number(n%58n)]+out;n/=58n}
 for(const b of bytes){if(b!==0)break;out='1'+out}
 return out;
}
export function unbase58(text){
 let n=0n;for(const ch of text){const i=B58.indexOf(ch);if(i<0)throw Error('bad char');n=n*58n+BigInt(i)}
 const bytes=[];while(n>0n){bytes.unshift(Number(n%256n));n/=256n}
 for(const ch of text){if(ch!=='1')break;bytes.unshift(0)}
 return Uint8Array.from(bytes);
}
const SETUP=['actpass','active','passive'],CTYPE=['host','srflx','relay'];
const hex=b=>b.toString(16).padStart(2,'0');
function addrBytes(addr){
 if(/^\d{1,3}(\.\d{1,3}){3}$/.test(addr))return [0,addr.split('.').map(Number)];
 const m=/^([0-9a-f]{8})-([0-9a-f]{4})-([0-9a-f]{4})-([0-9a-f]{4})-([0-9a-f]{12})\.local$/i.exec(addr);
 if(m){const h=m.slice(1).join('');return [2,h.match(/../g).map(x=>parseInt(x,16))]}
 if(addr.includes(':')){
  const [a,b='']=addr.split('::'),pa=a?a.split(':'):[],pb=b?b.split(':'):[];
  const parts=addr.includes('::')?[...pa,...Array(8-pa.length-pb.length).fill('0'),...pb]:pa;
  if(parts.length!==8)return null;
  return [1,parts.flatMap(x=>{const v=parseInt(x||'0',16);return [v>>8,v&255]})];
 }
 return null;
}
function addrText(kind,b){
 if(kind===0)return b.join('.');
 if(kind===2){const h=[...b].map(hex).join('');return `${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20)}.local`}
 const w=[];for(let i=0;i<16;i+=2)w.push(((b[i]<<8)|b[i+1]).toString(16));return w.join(':');
}
const ALEN=[4,16,16];
// One check byte: a code damaged while copying is refused, never half-used.
const checksum=list=>list.reduce((a,b)=>(a*31+b)&255,7);
export function packSdp(desc){
 const sdp=String(desc?.sdp||''),line=k=>(sdp.match(new RegExp('^a='+k+':(.*)$','m'))||[])[1]?.trim();
 const ufrag=line('ice-ufrag'),pwd=line('ice-pwd'),fp=(line('fingerprint')||'').split(' ');
 const setup=SETUP.indexOf(line('setup')),mid=line('mid')||'0';
 if(!ufrag||!pwd||fp[0]!=='sha-256'||!fp[1]||setup<0)throw Error('Descrição de conexão incompleta.');
 const fpb=fp[1].split(':').map(x=>parseInt(x,16));
 if(fpb.length!==32)throw Error('Impressão digital inesperada.');
 const cands=[];
 for(const m of sdp.matchAll(/^a=candidate:\S+ (\d+) (\S+) \d+ (\S+) (\d+) typ (\S+)/gm)){
  if(m[1]!=='1'||m[2].toLowerCase()!=='udp')continue;
  const t=CTYPE.indexOf(m[5]),a=addrBytes(m[3]);
  if(t<0||!a||cands.some(c=>c.key===m[3]+':'+m[4]))continue;
  cands.push({key:m[3]+':'+m[4],t,k:a[0],b:a[1],port:Number(m[4])});
 }
 const enc=t=>[...new TextEncoder().encode(t)];
 const u=enc(ufrag),p=enc(pwd),md=enc(mid);
 const keep=cands.slice(0,12);
 const out=[(desc.type==='answer'?1:0)|(setup<<1),u.length,...u,p.length,...p,md.length,...md,...fpb,keep.length];
 for(const c of keep)out.push((c.t<<2)|c.k,...c.b,c.port>>8,c.port&255);
 out.push(checksum(out));
 return Uint8Array.from(out);
}
export function unpackSdp(bytes){
 if(bytes.length<40||checksum([...bytes.slice(0,-1)])!==bytes[bytes.length-1])throw Error('checksum');
 bytes=bytes.slice(0,-1);
 let i=0;const need=n=>{if(i+n>bytes.length)throw Error('short');const s=bytes.slice(i,i+n);i+=n;return s};
 const dec=b=>new TextDecoder().decode(b);
 const head=need(1)[0],type=head&1?'answer':'offer',setup=SETUP[(head>>1)&3];
 if(!setup)throw Error('setup');
 const ufrag=dec(need(need(1)[0])),pwd=dec(need(need(1)[0])),mid=dec(need(need(1)[0]));
 const fp=[...need(32)].map(b=>hex(b).toUpperCase()).join(':');
 const n=need(1)[0],cands=[];
 for(let c=0;c<n;c++){
  const h=need(1)[0],t=h>>2,k=h&3;if(!CTYPE[t]||!ALEN[k])throw Error('cand');
  const addr=addrText(k,need(ALEN[k])),pp=need(2),port=(pp[0]<<8)|pp[1];
  const pref=[126,100,0][t],prio=(pref*16777216)+((65535-c)*256)+255;
  cands.push(`a=candidate:${c+1} 1 udp ${prio} ${addr} ${port} typ ${CTYPE[t]}${t?' raddr 0.0.0.0 rport 0':''}`);
 }
 if(i!==bytes.length)throw Error('trailing');
 if(!/^[A-Za-z0-9+/]{4,256}$/.test(ufrag)||!/^[A-Za-z0-9+/]{22,256}$/.test(pwd)||!/^[\w-]{1,32}$/.test(mid))throw Error('ice');
 const sdp=['v=0','o=- '+(Date.now()%1e9)+' 2 IN IP4 127.0.0.1','s=-','t=0 0','a=group:BUNDLE '+mid,'a=msid-semantic: WMS',
  'm=application 9 UDP/DTLS/SCTP webrtc-datachannel','c=IN IP4 0.0.0.0',...cands,'a=end-of-candidates',
  'a=ice-ufrag:'+ufrag,'a=ice-pwd:'+pwd,'a=ice-options:trickle','a=fingerprint:sha-256 '+fp,'a=setup:'+setup,
  'a=mid:'+mid,'a=sctp-port:5000','a=max-message-size:262144',''].join('\r\n');
 return {type,sdp};
}
export async function encodeSignal(desc){
 return SHORT_PREFIX+(desc.type==='answer'?'R':'O')+base58(packSdp(desc));
}
// Accepts the code inside any pasted text (WhatsApp adds names, times,
// line breaks). Old long codes (T2MP1:) still work.
export async function decodeSignal(code){
 const raw=String(code||'');
 // The code is one word: try it as typed first, then with line breaks removed
 // (a code split over lines); the check byte rejects a wrong cut.
 for(const text of [raw,raw.replace(/\s+/g,'')]){
  const re=/T2([OR])([1-9A-HJ-NP-Za-km-z]{40,})/g;let m;
  while((m=re.exec(text))){
   for(let cut=0;cut<=6&&m[2].length-cut>=40;cut++){
    let desc;try{desc=unpackSdp(unbase58(m[2].slice(0,m[2].length-cut)))}catch{continue}
    if((m[1]==='R')!==(desc.type==='answer'))continue;
    return desc;
   }
  }
 }
 if(/T2[OR]/.test(raw))throw Error('Código incompleto ou alterado: copie de novo, inteiro.');
 const text=raw.replace(/\s+/g,'');
 const at=text.indexOf(PREFIX);
 if(at<0)throw Error('Código inválido: confira se copiou tudo.');
 return decodeLongSignal(text.slice(at));
}
async function decodeLongSignal(text){
 const kind=text[PREFIX.length],body=unb64url(text.slice(PREFIX.length+1).replace(/[^A-Za-z0-9_-]+$/,''));
 const raw=kind==='z'?await pipe(body,new DecompressionStream('deflate-raw')):body;
 const desc=JSON.parse(new TextDecoder().decode(raw));
 if(!desc||!['offer','answer'].includes(desc.type)||typeof desc.sdp!=='string')throw Error('Código inválido.');
 return desc;
}

// --- Emulated room server (runs in the host's browser) -----------------------
// deliver(side,obj): side 'host' -> host red.js, 'guest' -> over the link.
export function createRoomServer(deliver,{hostName='Anfitrião',guestName='Amigo'}={}){
 const room={codigo:null,guest:false},names={hostName,guestName};
 const reply=(side,m,obj)=>deliver(side,m.rid!=null?{...obj,rid:m.rid}:obj);
 return {room,names,handle(side,m){
  if(!m||typeof m.t!=='string')return;
  const other=side==='host'?'guest':'host';
  if(!m.t.startsWith('$')){if(room.codigo&&room.guest)deliver(other,m);return}
  switch(m.t){
   case '$crear':
    if(side!=='host')return reply(side,m,{t:'$error',motivo:'ONLY THE HOST CAN CREATE THE ROOM'});
    room.codigo=ROOM_CODE;
    return reply(side,m,{t:'$sala',codigo:room.codigo,rol:'anfitrion'});
   case '$unirse':
    if(side!=='guest'||!room.codigo||String(m.codigo||'').toUpperCase()!==room.codigo)
     return reply(side,m,{t:'$error',motivo:'THAT ROOM NO LONGER EXISTS'});
    room.guest=true;
    reply(side,m,{t:'$sala',codigo:room.codigo,rol:'invitado',rival:names.hostName});
    return deliver('host',{t:'$rival',dentro:true,nombre:names.guestName});
   case '$salir':
    if(side==='guest'){room.guest=false;deliver('host',{t:'$rival',dentro:false})}
    else{if(room.guest)deliver('guest',{t:'$rival',dentro:false,cerrada:true});room.codigo=null;room.guest=false}
    return;
   case '$ping':return deliver(side,{t:'$pong',k:m.k,n:m.n});
   default:
    // Account/stats/ranking requests of the online server: acknowledged,
    // nothing is stored (friendly match only).
    if(m.rid!=null)reply(side,m,{t:m.t,ok:true});
  }
 }};
}


// 3x3: a team is exactly three different, known Pokémon.
export const TEAM_SIZE=3;
export function checkTeam(team,known=()=>true){
 if(!Array.isArray(team)||team.length!==TEAM_SIZE)return {ok:false,reason:'faltam Pokémon'};
 if(!team.every(id=>typeof id==='string'&&known(id)))return {ok:false,reason:'faltam Pokémon'};
 if(new Set(team).size!==TEAM_SIZE)return {ok:false,reason:'repetido'};
 return {ok:true,team:team.slice()};
}

// 4G/5G: mobile networks (CGNAT) usually block a direct link, so a TURN relay
// is needed. The relay is configured at publish time (secret TORRE2_TURN):
// either a JSON list of RTCIceServer entries or an https URL that returns one
// (e.g. a Metered "turn/credentials?apiKey=..." URL). Anything else is ignored.
const ICE_URL=/^(?:stun|turn|turns):[A-Za-z0-9.\-]+(?::\d{1,5})?(?:\?transport=(?:udp|tcp))?$/;
export function cleanIceServers(list){
 if(!Array.isArray(list))return [];
 const out=[];
 for(const s of list.slice(0,8)){
  const urls=(Array.isArray(s?.urls)?s.urls:[s?.urls]).filter(u=>typeof u==='string'&&ICE_URL.test(u)).slice(0,6);
  if(!urls.length)continue;
  const e={urls};
  if(typeof s.username==='string'&&s.username.length<=256)e.username=s.username;
  if(typeof s.credential==='string'&&s.credential.length<=256)e.credential=s.credential;
  if(urls.some(u=>!u.startsWith('stun:'))&&!(e.username&&e.credential))continue;
  out.push(e);
 }
 return out;
}
export function turnConfig(raw){
 const text=String(raw??'').trim();
 if(!text)return {servers:[],url:null};
 if(/^https:\/\/[A-Za-z0-9.\-]+(?::\d+)?\/[^\s"'<>`]*$/.test(text))return {servers:[],url:text};
 try{return {servers:cleanIceServers(JSON.parse(text)),url:null}}catch{return {servers:[],url:null}}
}
export const hasRelay=list=>list.some(s=>s.urls.some(u=>!u.startsWith('stun:')));

// --- Match history with friends (owner list item 6) -------------------------
export const HISTORY_KEY='torre2-multiplayer-historico';
export const HISTORY_MAX=50;
const clip=(v,n=16)=>String(v??'').replace(/[\u0000-\u001f<>]/g,'').slice(0,n);
const ids=t=>Array.isArray(t)?t.filter(x=>typeof x==='string').slice(0,TEAM_SIZE).map(x=>clip(x,24)):[];
export function recordMatch(history,{rival,won,fmt,score,mine,theirs,at}){
 const list=Array.isArray(history)?history.slice():[];
 list.unshift({at:Number.isFinite(at)?at:Date.now(),rival:clip(rival)||'Amigo',won:!!won,
  fmt:fmt==='3x3'?'3x3':'1x1',score:clip(score,12),mine:ids(mine),theirs:ids(theirs)});
 return list.slice(0,HISTORY_MAX);
}
export function historySummary(history){
 const by=new Map();
 for(const m of Array.isArray(history)?history:[]){
  const r=by.get(m.rival)||{rival:m.rival,wins:0,losses:0,last:0};
  if(m.won)r.wins++;else r.losses++;r.last=Math.max(r.last,m.at||0);by.set(m.rival,r);
 }
 return [...by.values()].sort((a,b)=>b.last-a.last);
}

// --- Compare with a friend by code (owner list item 9) ----------------------
export const PROFILE_PREFIX='T2CP1:';
const count=v=>Array.isArray(v)?new Set(v).size:0;
const int=(v,max=99999)=>Math.max(0,Math.min(max,Math.floor(Number(v)||0)));
export function profileFromSave(save,history,name){
 const s=save&&typeof save==='object'?save:{};
 const h=Array.isArray(history)?history:[];
 return {n:clip(name)||'Treinador',b:int(count(s.badges),8),c:int(count(s.dexCaught)),v:int(count(s.dexSeen)),
  sh:int(count(s.dexShinyCaught)),ch:s.champion?1:0,w:int(s.wins),l:int(s.losses),
  mw:int(h.filter(m=>m.won).length),ml:int(h.filter(m=>!m.won).length)};
}
const b64=t=>btoa(String.fromCharCode(...new TextEncoder().encode(t))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
const unb64=t=>new TextDecoder().decode(Uint8Array.from(atob(t.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0)));
export function encodeProfile(p){return PROFILE_PREFIX+b64(JSON.stringify(p))}
export function decodeProfile(code){
 const t=String(code??'').trim().replace(/\s+/g,'');
 if(!t.startsWith(PROFILE_PREFIX))throw Error('Esse não é um código de comparação do Torre 2.');
 let o;try{o=JSON.parse(unb64(t.slice(PROFILE_PREFIX.length)))}catch{throw Error('Código incompleto. Copie de novo.')}
 return {n:clip(o?.n)||'Amigo',b:int(o?.b,8),c:int(o?.c),v:int(o?.v),sh:int(o?.sh),ch:o?.ch?1:0,
  w:int(o?.w),l:int(o?.l),mw:int(o?.mw),ml:int(o?.ml)};
}
export const PROFILE_ROWS=[['b','Insígnias'],['c','Pokédex: capturados'],['v','Pokédex: vistos'],['sh','Shiny capturados'],
 ['ch','Campeão da Liga'],['w','Vitórias na campanha'],['mw','Vitórias no multiplayer']];
