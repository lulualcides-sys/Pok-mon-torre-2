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
