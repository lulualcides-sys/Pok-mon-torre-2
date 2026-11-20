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

