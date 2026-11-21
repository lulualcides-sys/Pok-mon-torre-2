/* Pokémon Torre 2 — Multiplayer by code (owner request 2026-11-20).
 * Two friends play the base client's own 1v1 friendly match ("PLAY WITH A
 * ROOM CODE" room, free Pokémon choice, native online combat sync) WITHOUT
 * any game server:
 *  1. The host's game creates a WebRTC offer and shows it as a text code.
 *  2. The friend pastes it, the game answers with another code.
 *  3. The host pastes the answer: a direct DataChannel links both browsers.
 *  4. The host's browser plays the role of the base client's server for this
 *     one room: the native red.js keeps talking "to a server" through a
 *     socket object that is really this link. Room create/join, presence and
 *     message relay are emulated; everything else (lobby, ready, combat
 *     netcode, native P2P channels) is the untouched base client.
 * STUN servers are the same public ones the base client already uses.
 */
import {red,STUN} from '../red.js';

import {ROOM_CODE,PREFIX,CONTROL,encodeSignal,decodeSignal,createRoomServer,checkTeam,TEAM_SIZE,cleanIceServers,hasRelay,
 HISTORY_KEY,recordMatch,historySummary,profileFromSave,encodeProfile,decodeProfile,PROFILE_ROWS,
 ROOM_LEN,SIGNAL_URL,newRoomCode,parseRoomCode,hostPeerId,signalUrl} from './multiplayer-core.js';
import {TURN,TURN_URL} from './turn.js';
import {FUENTE_CSS,VERSION,ANCHO,texto} from '../config.js';
import {ROSTER} from '../datos.js';
import {aspectoJuego} from '../aspectos.js';
import {cosDe} from '../skins.js';

export {encodeSignal,decodeSignal,createRoomServer};

// Socket object that red.js treats as its open WebSocket.
function fakeSocket(send){
 return {readyState:1,send,close(){this.readyState=3}};
}
// STUN (same as the base client) + the optional TURN relay for 4G/5G.
let relayCache=null;
export async function iceServers(){
 if(!relayCache){
  relayCache=cleanIceServers(TURN);
  if(TURN_URL){
   try{const r=await fetch(TURN_URL,{signal:AbortSignal.timeout(5000)});
    if(r.ok)relayCache=[...relayCache,...cleanIceServers(await r.json())];
   }catch{}
  }
 }
 return relayCache;
}
const relayConfigured=()=>TURN.length>0||!!TURN_URL;
const nameOf=fallback=>{try{return localStorage.getItem('torre2-trainer-name')||fallback}catch{return fallback}};

// --- Link (one per session) ---------------------------------------------------
export class MultiLink{
 constructor({onState,onReady}={}){
  this.onState=onState||(()=>{});this.onReady=onReady||(()=>{});
  this.pc=null;this.dc=null;this.role=null;this.server=null;this.closed=false;
 }
 state(s,extra){this.onState(s,extra)}
 newPeer(relay=[]){
  this.relay=relay;
  const pc=new RTCPeerConnection({iceServers:[...STUN,...relay]});
  pc.onconnectionstatechange=()=>{
   if(['failed','closed','disconnected'].includes(pc.connectionState))this.lost();
  };
  this.pc=pc;return pc;
 }
 async gathered(pc){
  if(pc.iceGatheringState==='complete')return;
  await new Promise(done=>{const t=setTimeout(done,4000);
   pc.addEventListener('icegatheringstatechange',()=>{if(pc.iceGatheringState==='complete'){clearTimeout(t);done()}})});
 }
 // Host: step 1, returns the code to send to the friend.
 async createOffer(){
  this.role='host';const pc=this.newPeer(await iceServers());
  this.wire(pc.createDataChannel('torre2',{ordered:true}));
  await pc.setLocalDescription(await pc.createOffer());
  await this.gathered(pc);
  return encodeSignal(pc.localDescription);
 }
 // Guest: step 2, takes the host code, returns the answer code.
 async acceptOffer(code){
  this.role='guest';const desc=await decodeSignal(code);
  if(desc.type!=='offer')throw Error('Esse é o código de resposta. Cole o código de quem criou a sala.');
  // A second try (new code): drop the previous attempt without ending the link.
  if(this.pc){this.pc.onconnectionstatechange=null;try{this.pc.close()}catch{}}
  const pc=this.newPeer(await iceServers());
  pc.ondatachannel=e=>this.wire(e.channel);
  try{await pc.setRemoteDescription(desc)}
  catch{throw Error('Esse código não abriu a sala. Peça ao seu amigo para criar a sala de novo.')}
  await pc.setLocalDescription(await pc.createAnswer());
  await this.gathered(pc);
  return encodeSignal(pc.localDescription);
 }
 // Host: step 3, takes the friend's answer.
 async acceptAnswer(code){
  const desc=await decodeSignal(code);
  if(desc.type!=='answer')throw Error('Esse é o seu próprio código. Cole a resposta do seu amigo.');
  // The game went to the background (WhatsApp) and the phone closed it.
  if(!this.pc||this.pc.signalingState!=='have-local-offer')
   throw Error('Essa sala não existe mais neste aparelho. Toque em VOLTAR, crie a sala de novo e mande o código novo.');
  try{await this.pc.setRemoteDescription(desc)}
  catch{throw Error('Essa resposta não é da sala atual. Peça ao seu amigo para colar o código novo e mandar outra resposta.')}
  this.state('connecting');
  // No link after 25 s: almost always both phones on mobile data.
  clearTimeout(this.slow);
  this.slow=setTimeout(()=>{if(!this.dc||this.dc.readyState!=='open')this.state('slow')},25000);
 }
 wire(dc){
  this.dc=dc;
  dc.onopen=()=>this.opened();
  dc.onclose=()=>this.lost();
  dc.onmessage=e=>this.incoming(e.data);
 }
 sendRaw(obj){if(this.dc?.readyState==='open')this.dc.send(typeof obj==='string'?obj:JSON.stringify(obj))}
 toRed(obj){setTimeout(()=>red.recibir(JSON.stringify(obj),'servidor'),0)}
 opened(){
  this.everOpen=true;clearTimeout(this.slow);
  // Never touch the real online server while linked.
  red.mantener=false;red.salir?.();
  // Same message the base client's server sends: native P2P also gets the relay.
  const relay=(this.relay||[]).filter(s=>hasRelay([s]));
  if(relay.length)red.recibir(JSON.stringify({t:'$turn',ice:relay}),'servidor');
  if(this.role==='host'){
   this.server=createRoomServer((side,obj)=>side==='host'?this.toRed(obj):this.sendRaw(obj),
    {hostName:nameOf('Anfitrião'),guestName:'Amigo'});
   red.ws=fakeSocket(text=>{try{this.server.handle('host',JSON.parse(text))}catch{}});
   red.crearSala().then(()=>{
    this.sendRaw({t:CONTROL+'sala',codigo:red.codigo,nombre:nameOf('Anfitrião')});
    this.state('linked');this.onReady({role:'host',codigo:red.codigo});
   },e=>this.state('error',e));
  }else{
   red.ws=fakeSocket(text=>this.sendRaw(text));
   this.sendRaw({t:CONTROL+'hola',nombre:nameOf('Amigo')});
  }
 }
 incoming(text){
  let m;try{m=JSON.parse(text)}catch{return}
  if(typeof m?.t!=='string')return;
  if(m.t.startsWith(CONTROL)){
   if(m.t===CONTROL+'sala'&&this.role==='guest'){this.state('linked');this.onReady({role:'guest',codigo:m.codigo})}
   if(m.t===CONTROL+'hola'&&this.server&&m.nombre)this.server.names.guestName=String(m.nombre).slice(0,16);
   return;
  }
  if(this.role==='host')this.server?.handle('guest',m);
  else red.recibir(text,'servidor');
 }
 lost(){
  if(this.closed)return;this.closed=true;
  if(!this.everOpen){this.state('failed');return}
  if(red.ws?.readyState===1&&red.ws.send&&!(red.ws instanceof WebSocket)){red.ws.close();red.ws=null}
  red.codigo=null;red.rol=null;red.rivalDentro=false;red.cerrarP2P?.();
  red.emitir?.('caida',{});
  this.state('lost');
 }
 close(){try{this.dc?.close()}catch{}try{this.pc?.close()}catch{}this.lost()}
}

// --- 3x3 in the friendly room ------------------------------------------------
// Hooks called by the patched native room (torre2-sala-teams-patch.mjs). They
// only act while the code link is open; otherwise the native room is unchanged.
// The host picks 1x1 or 3x3. In 3x3 the native "CHANGE POKÉMON" button picks
// the lead and two extra slot buttons pick the 2nd and 3rd Pokémon. The match
// starts with the base client's own team battle (Equipo, synced switches).
const linkOpen=()=>{const l=globalThis.__torre2MultiLink;return !!(l&&!l.closed&&l.dc?.readyState==='open')};
const known=id=>ROSTER.some(p=>p.id===id);
const nameOf3=(id,max=12)=>{const p=ROSTER.find(r=>r.id===id);return p?p.nombre.slice(0,max):'?'};
const fmtOf=reg=>reg.get('torre2SalaFmt')==='3x3'?'3x3':'1x1';
const teamOf=sala=>{const t=sala.registry.get('torre2SalaEq');return Array.isArray(t)?t.slice(0,TEAM_SIZE):[]};
export const salaTeams={
 vista(sala){
  if(!linkOpen())return;
  const reg=sala.registry,team=teamOf(sala);
  const slot=reg.get('torre2SalaSlot');
  if(slot===1||slot===2){
   reg.remove('torre2SalaSlot');
   team[slot]=sala.miId;sala.miId=known(team[0])?team[0]:sala.miId;
   try{localStorage.setItem('pa-pokemon-online',sala.miId)}catch{}
  }
  team[0]=sala.miId;reg.set('torre2SalaEq',team);
  // TROCAR TIME (end screen): pick the lead, then (3x3) the 2nd and 3rd in a row.
  const seq=reg.get('torre2TrocaSeq');
  if(seq){
   const fmt3=fmtOf(reg)==='3x3';
   const next=seq==='lead'?(fmt3?'slot1':null):seq==='slot1'?'slot2':null;
   if(next)reg.set('torre2TrocaSeq',next);else reg.remove('torre2TrocaSeq');
   sala.time.delayedCall(200,()=>{
    if(sala.vista!=='sala')return;
    if(seq==='lead')sala.cambiarPokemon();else this.escolher(sala,seq==='slot1'?1:2);
   });
  }
  const fmt=fmtOf(reg);
  if(red.anfitrion)
   sala.boton(80,96,120,22,'MODO '+fmt,()=>{reg.set('torre2SalaFmt',fmt==='3x3'?'1x1':'3x3');sala.vistaSala()});
  else sala.pon(texto(sala,80,96,'MODO '+fmt,{tam:8,color:'#ffd23c'}).setOrigin(.5));
  sala.torre2Slots=[];
  if(fmt==='3x3')for(const k of [1,2]){
   sala.torre2Slots[k]=sala.boton(84,k===1?146:186,100,18,'+ '+(k+1)+'º',()=>this.escolher(sala,k));
  }
  sala.torre2Rival=sala.pon(texto(sala,485,247,'',{tam:8,color:'#8fb3e6'}).setOrigin(.5,0));
  sala.pintarSala();
 },
 escolher(sala,k){
  const team=teamOf(sala);
  sala.registry.set('torre2SalaSlot',k);
  red.enviar({t:'hola',v:VERSION,id:null,listo:false});
  sala.scene.start('seleccion',{previo:{modo:'online',p1:known(team[k])?team[k]:sala.miId,arena:sala.arena,mandos:[sala.dispositivo,'pad0']}});
 },
 pintar(sala){
  if(!linkOpen()||!sala.torre2Rival?.active)return;
  const team=teamOf(sala),fmt=fmtOf(sala.registry);
  for(const k of [1,2])sala.torre2Slots?.[k]?.texto?.(known(team[k])?(k+1)+'º '+nameOf3(team[k],10):'+ '+(k+1)+'º');
  const rv=sala.torre2RivalEq;
  sala.torre2Rival.setText(fmt==='3x3'&&sala.rival?(rv?.length===TEAM_SIZE?'+ '+nameOf3(rv[1])+' · '+nameOf3(rv[2]):'MONTANDO O TIME...'):'');
 },
 hola(sala){
  if(!linkOpen())return {};
  const out={t2eq:teamOf(sala)};
  if(globalThis.__torre2MultiLink.role==='host')out.t2fmt=fmtOf(sala.registry);
  return out;
 },
 alHola(sala,m){
  if(!linkOpen())return;
  sala.torre2RivalEq=Array.isArray(m.t2eq)?m.t2eq.slice(0,TEAM_SIZE).filter(known):null;
  if(globalThis.__torre2MultiLink.role!=='host'&&(m.t2fmt==='1x1'||m.t2fmt==='3x3')&&m.t2fmt!==fmtOf(sala.registry)){
   sala.registry.set('torre2SalaFmt',m.t2fmt);
   sala.time.delayedCall(0,()=>{if(sala.vista==='sala')sala.vistaSala()});
  }
 },
 empezar(sala,m){
  if(!linkOpen()||fmtOf(sala.registry)!=='3x3')return true;
  const mine=checkTeam(teamOf(sala),known),theirs=checkTeam(sala.torre2RivalEq,known);
  if(!mine.ok){sala.aviso('ESCOLHA OS 3 POKÉMON DO SEU TIME ('+mine.reason+')','#f2c230');return false}
  if(!theirs.ok){sala.aviso('ESPERANDO O TIME 3x3 DO SEU AMIGO','#f2c230');return false}
  m.equipos=[mine.team,theirs.team];m.p1=mine.team[0];m.p2=theirs.team[0];
  return true;
 },
 combate(sala,m){
  if(!Array.isArray(m?.equipos)||m.equipos.length!==2)return {};
  const lado=red.lado===1?1:0;
  const eq=m.equipos.map(t=>t.slice(0,TEAM_SIZE));
  const none=()=>eq[0].map(()=>null);
  const mineAsp=eq[lado].map(id=>aspectoJuego(id)??null),mineCos=eq[lado].map(id=>cosDe(id));
  return {equipos:eq,
   aspectosEq:lado===0?[mineAsp,none()]:[none(),mineAsp],
   cosEq:lado===0?[mineCos,none()]:[none(),mineCos]};
 },
};
globalThis.__torre2Sala=salaTeams;

// --- End of a match (owner list items 3, 5, 6) -------------------------------
const readJSON=(key,fallback)=>{try{const v=JSON.parse(localStorage.getItem(key));return v??fallback}catch{return fallback}};
export const fimPartida={
 placar(c,ganador){
  if(!linkOpen()||!c.equipo?.kos)return undefined;
  const k=c.equipo.kos();return `${k[ganador]}-${k[1-ganador]} K.O.`;
 },
 fim(c,ganador){
  // Once per match: the scene object is reused on REMATCH, fighters are not.
  const run=c.luchadores?.[0];
  if(!linkOpen()||!run||run.__torre2Fim)return;
  run.__torre2Fim=true;
  const d=c.datos||{},lado=d.lado===1?1:0;
  const eq=Array.isArray(d.equipos)?d.equipos:null;
  const score=eq&&c.equipo?.kos?c.equipo.kos():c.victorias||[0,0];
  try{localStorage.setItem(HISTORY_KEY,JSON.stringify(recordMatch(readJSON(HISTORY_KEY,[]),{
   rival:d.nombres?.[1-lado]||red.rivalNombre,won:ganador===lado,fmt:eq?'3x3':'1x1',
   score:`${score[lado]}-${score[1-lado]}`,mine:eq?eq[lado]:[lado===0?d.p1:d.p2],theirs:eq?eq[1-lado]:[lado===0?d.p2:d.p1]})))}catch{}
  c.botonTexto?.(ANCHO/2,276,'TROCAR TIME',()=>{c.registry.set('torre2TrocaSeq','lead');c.salir()})?.setDepth?.(8002);
 },
};
globalThis.__torre2Fim=fimPartida;

// --- Quick room: 4-letter code via a public PeerJS signaling server ---------
// Only the connection setup (the same short codes as before) passes through
// the server; the match is the direct link. Socket closed once linked.
class QuickSignal{
 constructor(id,onMessage){this.id=id;this.onMessage=onMessage;this.ws=null;this.beat=null}
 open(){
  const base=globalThis.__torre2SignalUrl||SIGNAL_URL,token=Math.random().toString(36).slice(2,12);
  return new Promise((ok,fail)=>{
   const ws=this.ws=new WebSocket(signalUrl(base,this.id,token));
   const t=setTimeout(()=>{fail(Error('timeout'));try{ws.close()}catch{}},9000);
   ws.onmessage=e=>{let m;try{m=JSON.parse(e.data)}catch{return}
    if(m.type==='OPEN'){clearTimeout(t);this.beat=setInterval(()=>this.raw({type:'HEARTBEAT'}),5000);ok()}
    else if(m.type==='ID-TAKEN'){clearTimeout(t);fail(Error('taken'))}
    else if(m.type==='ERROR'){clearTimeout(t);fail(Error('server'))}
    else this.onMessage(m)};
   ws.onerror=()=>{clearTimeout(t);fail(Error('server'))};
   ws.onclose=()=>clearInterval(this.beat);
  });
 }
 raw(o){if(this.ws?.readyState===1)this.ws.send(JSON.stringify(o))}
 send(type,dst,payload){this.raw({type,dst,payload})}
 close(){clearInterval(this.beat);try{this.ws?.close()}catch{}this.ws=null}
}
const SERVER_DOWN='O servidor de salas não respondeu. Tente de novo ou use CÓDIGO LONGO.';

// --- Screen (main menu → MULTIPLAYER) -----------------------------------------
// DOM panel over the canvas (same approach as the base client's code box).
const CSS=`.t2mp{position:fixed;inset:0;z-index:50;display:flex;align-items:center;justify-content:center;
background:rgba(4,10,30,.82);font-family:${FUENTE_CSS};color:#fff}
.t2mp .box{width:min(640px,94vw);max-height:92vh;overflow:auto;background:#13254f;border:3px solid #5f86bd;
border-radius:10px;padding:14px 16px;box-shadow:0 0 0 3px #0a1838}
.t2mp h2{margin:0 0 6px;color:#ffd23c;font-size:20px;text-align:center}
.t2mp p{margin:6px 0;font-size:13px;line-height:1.4;color:#d7e4ff}
.t2mp textarea{width:100%;height:72px;box-sizing:border-box;font-size:14px;letter-spacing:.5px;border-radius:6px;border:2px solid #5f86bd;
background:#f4f1e6;color:#202020;padding:6px;word-break:break-all}
.t2mp .row{display:flex;gap:8px;flex-wrap:wrap;margin-top:8px}
.t2mp button{flex:1;min-width:130px;padding:10px 8px;font-size:14px;border-radius:6px;border:2px solid #0a1838;
background:#2f5aa8;color:#fff;cursor:pointer;font-family:${FUENTE_CSS}}
.t2mp button.gold{background:#f2c230;color:#202020}
.t2mp .msg{min-height:18px;color:#ffd47a;font-size:12px;margin-top:6px}
.t2mp .t2tab{width:100%;border-collapse:collapse;font-size:13px;margin:6px 0}
.t2mp .t2tab td,.t2mp .t2tab th{padding:5px 6px;border-bottom:1px solid #2c4a80;text-align:left}
.t2mp .w{color:#7dff8a}.t2mp .l{color:#ff8a7a}
.t2mp .t2list{margin:4px 0;padding-left:18px;font-size:12px;line-height:1.4}`;
export class Torre2Multi extends Phaser.Scene{
 constructor(){super({key:'torre2Multi'})}
 create(){
  this.cameras.main.setBackgroundColor('#0b1838');
  if(!document.getElementById('t2mp-css')){const st=document.createElement('style');st.id='t2mp-css';st.textContent=CSS;document.head.appendChild(st)}
  const root=this.root=document.createElement('div');root.className='t2mp';root.dataset.torre2Multi='1';
  document.body.appendChild(root);
  this.events.once('shutdown',()=>{root.remove();this.signal?.close();clearTimeout(this.waitTimer)});
  this.link=window.__torre2MultiLink=new MultiLink({
   onState:(s,e)=>this.status(s==='connecting'?'Conectando...':s==='linked'?'Conectado! Abrindo a sala...':
    s==='slow'?(relayConfigured()?'Ainda conectando... confira a internet dos dois aparelhos.':'Não conectou. Se os dois estão no 4G/5G, coloque um deles no Wi-Fi e tente de novo.'):
    s==='failed'?'Não deu para conectar os dois aparelhos. Isso acontece quando os dois estão no 4G/5G: coloque um deles no Wi-Fi e tente de novo.':
    s==='lost'?'Conexão perdida.':s==='error'?String(e?.message||e):''),
   onReady:({role,codigo})=>{
    this.signal?.close();this.signal=null;
    if(role==='guest')this.registry.set('salaPendiente',codigo);
    this.scene.start('sala',{});
   }});
  this.home();
 }
 panel(title,html){
  this.root.innerHTML=`<div class="box"><h2>${title}</h2>${html}<div class="msg"></div></div>`;
  return this.root.querySelector('.box');
 }
 status(text){const m=this.root?.querySelector('.msg');if(m)m.textContent=text||''}
 button(box,label,fn,gold=false){const b=document.createElement('button');b.textContent=label;if(gold)b.className='gold';
  b.onclick=async()=>{b.disabled=true;try{await fn()}catch(e){this.status(String(e?.message||e))}finally{b.disabled=false}};
  (box.querySelector('.row')||box).appendChild(b);return b}
 history(){
  const h=readJSON(HISTORY_KEY,[]),sum=historySummary(h);
  const esc=t=>String(t).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const name=id=>esc(ROSTER.find(r=>r.id===id)?.nombre||id);
  const rows=sum.length?sum.map(r=>`<tr><td>${esc(r.rival)}</td><td class="w">${r.wins} V</td><td class="l">${r.losses} D</td></tr>`).join(''):'<tr><td>Nenhuma partida ainda.</td></tr>';
  const last=h.slice(0,10).map(m=>`<li><b class="${m.won?'w':'l'}">${m.won?'VITÓRIA':'DERROTA'}</b> ${m.fmt} ${esc(m.score)} contra ${esc(m.rival)}<br><small>${m.mine.map(name).join(', ')} × ${m.theirs.map(name).join(', ')} · ${new Date(m.at).toLocaleDateString('pt-BR')}</small></li>`).join('');
  const box=this.panel('HISTÓRICO',`<table class="t2tab">${rows}</table>${last?`<p><b>Últimas partidas</b></p><ul class="t2list">${last}</ul>`:''}<div class="row"></div>`);
  this.button(box,'VOLTAR',()=>this.home());
 }
 compare(){
  const save=readJSON('pokemon-torre-2-kanto-campaign-v1',{});
  const mine=profileFromSave(save,readJSON(HISTORY_KEY,[]),nameOf('Treinador'));
  const code=encodeProfile(mine);
  const box=this.panel('COMPARAR COM AMIGO',`<p><b>1.</b> Mande o seu código:</p>${this.copyArea(code)}<div class="row" data-r1></div>
   <p><b>2.</b> Cole o código do seu amigo:</p><textarea data-t2cp-friend placeholder="T2CP1:..."></textarea><div class="row" data-r2></div><div data-t2cp-out></div>`);
  const r1=box.querySelector('[data-r1]'),r2=box.querySelector('[data-r2]');
  const c=document.createElement('button');c.textContent='COPIAR CÓDIGO';c.onclick=()=>this.copy(code);r1.appendChild(c);
  if(navigator.share){const sh=document.createElement('button');sh.textContent='COMPARTILHAR';sh.onclick=()=>navigator.share({text:code}).catch(()=>{});r1.appendChild(sh)}
  const go=document.createElement('button');go.className='gold';go.textContent='COMPARAR';go.setAttribute('data-t2cp-go','1');
  go.onclick=()=>{
   try{
    const f=decodeProfile(box.querySelector('[data-t2cp-friend]').value);
    const esc=t=>String(t).replace(/[&<>"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]));
    const show=(k,v)=>k==='ch'?(v?'SIM':'—'):v;
    let a=0,b=0;
    const rows=PROFILE_ROWS.map(([k,label])=>{const x=mine[k],y=f[k];if(x>y)a++;else if(y>x)b++;
     return `<tr><td>${label}</td><td class="${x>y?'w':''}">${show(k,x)}</td><td class="${y>x?'w':''}">${show(k,y)}</td></tr>`}).join('');
    box.querySelector('[data-t2cp-out]').innerHTML=`<table class="t2tab"><tr><th></th><th>${esc(mine.n)}</th><th>${esc(f.n)}</th></tr>${rows}</table>
     <p style="text-align:center"><b>${a>b?esc(mine.n)+' está na frente!':b>a?esc(f.n)+' está na frente!':'Empate!'}</b> (${a} × ${b})</p>`;
    this.status('');
   }catch(e){this.status(e.message)}
  };
  r2.appendChild(go);
  const back=document.createElement('button');back.textContent='VOLTAR';back.onclick=()=>this.home();r2.appendChild(back);
 }
 home(){
  const box=this.panel('MULTIPLAYER',`<p>Lute com um amigo, cada um no seu aparelho.</p>
   <p><b>Criar sala:</b> você recebe um código de ${ROOM_LEN} letras e manda para o amigo.<br>
   <b>Entrar:</b> o amigo digita o código e pronto.</p>
   <p style="color:#9fb6e6;font-size:11px">${relayConfigured()?'Funciona no Wi-Fi e no 4G/5G.':'Funciona melhor com pelo menos um dos dois no Wi-Fi.'}</p>
   <div class="row"></div>`);
  this.button(box,'CRIAR SALA',()=>this.quickHost(),true).setAttribute('data-t2mp-quick-host','1');
  this.button(box,'ENTRAR NA SALA',()=>this.quickGuest()).setAttribute('data-t2mp-quick-guest','1');
  this.button(box,'HISTÓRICO',()=>this.history());
  this.button(box,'COMPARAR COM AMIGO',()=>this.compare());
  this.button(box,'CÓDIGO LONGO (SEM SERVIDOR)',()=>this.manual()).setAttribute('data-t2mp-manual','1');
  this.button(box,'VOLTAR',()=>{this.link.close();this.scene.start('titulo',{})});
 }
 manual(){
  const box=this.panel('CÓDIGO LONGO',`<p>Use se a sala rápida não funcionar: um manda o código, o outro devolve a resposta.</p><div class="row"></div>`);
  this.button(box,'CRIAR SALA',()=>this.host(),true);
  this.button(box,'ENTRAR COM CÓDIGO',()=>this.guest());
  this.button(box,'VOLTAR',()=>this.home());
 }
 retryRow(box,again){
  const row=box.querySelector('[data-rr]')||box;
  const a=document.createElement('button');a.className='gold';a.textContent='TENTAR DE NOVO';a.onclick=()=>{this.signal?.close();this.link.close();this.scene.restart()};
  a.setAttribute('data-t2mp-retry','1');row.appendChild(a);
  const b=document.createElement('button');b.textContent='VOLTAR';b.onclick=()=>{this.link.close();this.scene.restart()};row.appendChild(b);
 }
 // Host: a free 4-letter code, then wait for the friend.
 async quickHost(){
  this.panel('CRIAR SALA','<p>Criando a sala...</p>');
  let code=null;
  for(let i=0;i<5&&!code;i++){
   const c=newRoomCode(),sig=new QuickSignal(hostPeerId(c),m=>this.onHostSignal(m));
   try{await sig.open();code=c;this.signal=sig}
   catch(e){sig.close();if(e.message!=='taken'){const b=this.panel('CRIAR SALA','<div class="row" data-rr></div>');this.status(SERVER_DOWN);this.retryRow(b);return}}
  }
  if(!code){this.status(SERVER_DOWN);return}
  this.roomCode=code;
  const box=this.panel('SUA SALA',`<p style="text-align:center">Mande este código para o seu amigo:</p>
   <div data-t2mp-room style="text-align:center;font-size:44px;letter-spacing:10px;color:#ffd23c;margin:8px 0">${code}</div>
   <p style="text-align:center">Esperando o amigo entrar...</p><div class="row" data-r1></div>`);
  const r1=box.querySelector('[data-r1]');
  const msg='Entra na minha sala no Pokémon Torre 2: MULTIPLAYER → ENTRAR NA SALA → '+code;
  if(navigator.share){const sh=document.createElement('button');sh.className='gold';sh.textContent='MANDAR NO WHATSAPP';sh.onclick=()=>navigator.share({text:msg}).catch(()=>{});r1.appendChild(sh)}
  const cp=document.createElement('button');cp.textContent='COPIAR';cp.onclick=()=>this.copy(code);r1.appendChild(cp);
  const back=document.createElement('button');back.textContent='VOLTAR';back.onclick=()=>{this.signal?.close();this.link.close();this.scene.restart()};r1.appendChild(back);
 }
 async onHostSignal(m){
  try{
   if(m.type==='OFFER'&&m.payload?.hello&&!this.guestId){
    this.guestId=m.src;this.status('Amigo encontrado! Conectando...');
    const offer=await this.link.createOffer();
    this.signal?.send('OFFER',m.src,{code:offer});
   }else if(m.type==='ANSWER'&&m.src===this.guestId&&m.payload?.code){
    await this.link.acceptAnswer(m.payload.code);
   }
  }catch(e){this.status(String(e?.message||e))}
 }
 // Guest: type the 4 letters.
 quickGuest(){
  const box=this.panel('ENTRAR NA SALA',`<p style="text-align:center">Digite o código que o seu amigo mandou:</p>
   <input data-t2mp-room-input maxlength="8" autocomplete="off" autocapitalize="characters" spellcheck="false"
    style="display:block;margin:8px auto;width:220px;text-align:center;font-size:40px;letter-spacing:10px;text-transform:uppercase;border-radius:8px;border:3px solid #5f86bd;background:#f4f1e6;color:#202020;font-family:inherit">
   <div class="row" data-r1></div>`);
  const input=box.querySelector('[data-t2mp-room-input]');
  const go=async()=>{
   const code=parseRoomCode(input.value);
   if(!code)return this.status('O código tem '+ROOM_LEN+' letras. Confira e tente de novo.');
   this.status('Procurando a sala '+code+'...');
   const sig=this.signal=new QuickSignal('torre2g-'+Math.random().toString(36).slice(2,10),m=>this.onGuestSignal(m,code));
   try{await sig.open()}catch{return this.status(SERVER_DOWN)}
   sig.send('OFFER',hostPeerId(code),{hello:true,name:nameOf('Amigo')});
   clearTimeout(this.waitTimer);
   this.waitTimer=setTimeout(()=>{if(!this.hostFound)this.status('Sala '+code+' não encontrada. Confira o código e se o amigo está com a sala aberta.')},12000);
  };
  const r1=box.querySelector('[data-r1]');
  const ok=document.createElement('button');ok.className='gold';ok.textContent='ENTRAR';ok.setAttribute('data-t2mp-room-go','1');
  ok.onclick=async()=>{ok.disabled=true;try{await go()}finally{ok.disabled=false}};r1.appendChild(ok);
  input.addEventListener('keydown',e=>{if(e.key==='Enter')ok.click()});
  input.addEventListener('input',()=>this.status(''));
  const back=document.createElement('button');back.textContent='VOLTAR';back.onclick=()=>{this.signal?.close();this.home()};r1.appendChild(back);
  setTimeout(()=>input.focus(),50);
 }
 async onGuestSignal(m,code){
  try{
   if(m.type==='OFFER'&&m.payload?.code&&m.src===hostPeerId(code)&&!this.hostFound){
    this.hostFound=true;this.status('Sala encontrada! Conectando...');
    const answer=await this.link.acceptOffer(m.payload.code);
    this.signal?.send('ANSWER',m.src,{code:answer});
   }else if(m.type==='EXPIRE'&&!this.hostFound){
    this.status('Sala '+code+' não encontrada. Confira o código e se o amigo está com a sala aberta.');
   }
  }catch(e){this.status(String(e?.message||e))}
 }
 copyArea(code){
  return `<textarea readonly data-t2mp-code>${code}</textarea>`;
 }
 // COLAR: read the clipboard into a box (falls back to a long-press paste).
 pasteButton(row,box,selector){
  if(!navigator.clipboard?.readText)return;
  const b=document.createElement('button');b.textContent='COLAR';
  b.onclick=async()=>{try{box.querySelector(selector).value=await navigator.clipboard.readText();this.status('')}
   catch{this.status('Toque e segure na caixa e escolha Colar.')}};
  row.appendChild(b);
 }
 async copy(text){try{await navigator.clipboard.writeText(text);this.status('Código copiado!')}catch{this.status('Selecione o código e copie.')}}
 async host(){
  this.panel('CRIAR SALA','<p>Gerando o seu código...</p>');
  const code=await this.link.createOffer();
  const box=this.panel('CRIAR SALA',`<p><b>1.</b> Mande este código para o seu amigo:</p>${this.copyArea(code)}
   <div class="row" data-r1></div><p><b>2.</b> Cole aqui a resposta dele:</p><textarea data-t2mp-answer placeholder="T2..."></textarea><div class="row" data-r2></div>`);
  const r1=box.querySelector('[data-r1]'),r2=box.querySelector('[data-r2]');
  const b1=document.createElement('button');b1.textContent='COPIAR CÓDIGO';b1.onclick=()=>this.copy(code);r1.appendChild(b1);
  if(navigator.share){const s=document.createElement('button');s.textContent='COMPARTILHAR';s.onclick=()=>navigator.share({text:code}).catch(()=>{});r1.appendChild(s)}
  const ok=document.createElement('button');ok.className='gold';ok.textContent='CONECTAR';ok.setAttribute('data-t2mp-connect','1');
  ok.onclick=async()=>{try{await this.link.acceptAnswer(box.querySelector('[data-t2mp-answer]').value)}catch(e){this.status(e.message)}};
  this.pasteButton(r2,box,'[data-t2mp-answer]');
  r2.appendChild(ok);
  const back=document.createElement('button');back.textContent='VOLTAR';back.onclick=()=>{this.link.close();this.scene.restart()};r2.appendChild(back);
 }
 guest(){
  const box=this.panel('ENTRAR COM CÓDIGO',`<p><b>1.</b> Cole o código que seu amigo mandou:</p>
   <textarea data-t2mp-offer placeholder="T2..."></textarea><div class="row" data-r1></div>`);
  const r1=box.querySelector('[data-r1]');
  const go=document.createElement('button');go.className='gold';go.textContent='GERAR RESPOSTA';go.setAttribute('data-t2mp-reply','1');
  go.onclick=async()=>{
   try{this.status('Gerando a resposta...');
    const answer=await this.link.acceptOffer(box.querySelector('[data-t2mp-offer]').value);
    const b2=this.panel('ENTRAR COM CÓDIGO',`<p><b>2.</b> Mande esta resposta para o seu amigo e espere ele conectar:</p>${this.copyArea(answer)}<div class="row" data-r2></div>`);
    const r2=b2.querySelector('[data-r2]');
    const c=document.createElement('button');c.textContent='COPIAR RESPOSTA';c.onclick=()=>this.copy(answer);r2.appendChild(c);
    if(navigator.share){const s=document.createElement('button');s.textContent='COMPARTILHAR';s.onclick=()=>navigator.share({text:answer}).catch(()=>{});r2.appendChild(s)}
    const back=document.createElement('button');back.textContent='VOLTAR';back.onclick=()=>{this.link.close();this.scene.restart()};r2.appendChild(back);
    this.status('Esperando seu amigo conectar...');
   }catch(e){this.status(e.message)}};
  this.pasteButton(r1,box,'[data-t2mp-offer]');
  r1.appendChild(go);
  const back=document.createElement('button');back.textContent='VOLTAR';back.onclick=()=>this.home();r1.appendChild(back);
 }
}
