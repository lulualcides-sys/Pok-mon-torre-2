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
export async function encodeSignal(desc){
 const json=JSON.stringify({type:desc.type,sdp:desc.sdp});
 const raw=new TextEncoder().encode(json);
 if(typeof CompressionStream==='function')
  return PREFIX+'z'+b64url(await pipe(raw,new CompressionStream('deflate-raw')));
 return PREFIX+'j'+b64url(raw);
}
export async function decodeSignal(code){
 const text=String(code||'').replace(/\s+/g,'');
 if(!text.startsWith(PREFIX))throw Error('Código inválido: confira se copiou tudo.');
 const kind=text[PREFIX.length],body=unb64url(text.slice(PREFIX.length+1));
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
