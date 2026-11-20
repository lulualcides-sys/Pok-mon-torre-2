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

import {ROOM_CODE,PREFIX,CONTROL,encodeSignal,decodeSignal,createRoomServer} from './multiplayer-core.js';
import {FUENTE_CSS} from '../config.js';
export {encodeSignal,decodeSignal,createRoomServer};

// Socket object that red.js treats as its open WebSocket.
function fakeSocket(send){
 return {readyState:1,send,close(){this.readyState=3}};
}
const nameOf=fallback=>{try{return localStorage.getItem('torre2-trainer-name')||fallback}catch{return fallback}};

// --- Link (one per session) ---------------------------------------------------
export class MultiLink{
 constructor({onState,onReady}={}){
  this.onState=onState||(()=>{});this.onReady=onReady||(()=>{});
  this.pc=null;this.dc=null;this.role=null;this.server=null;this.closed=false;
 }
 state(s,extra){this.onState(s,extra)}
 newPeer(){
  const pc=new RTCPeerConnection({iceServers:[...STUN]});
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
  this.role='host';const pc=this.newPeer();
  this.wire(pc.createDataChannel('torre2',{ordered:true}));
  await pc.setLocalDescription(await pc.createOffer());
  await this.gathered(pc);
  return encodeSignal(pc.localDescription);
 }
 // Guest: step 2, takes the host code, returns the answer code.
 async acceptOffer(code){
  this.role='guest';const desc=await decodeSignal(code);
  if(desc.type!=='offer')throw Error('Esse é o código de resposta. Cole o código de quem criou a sala.');
  const pc=this.newPeer();
  pc.ondatachannel=e=>this.wire(e.channel);
  await pc.setRemoteDescription(desc);
  await pc.setLocalDescription(await pc.createAnswer());
  await this.gathered(pc);
  return encodeSignal(pc.localDescription);
 }
 // Host: step 3, takes the friend's answer.
 async acceptAnswer(code){
  const desc=await decodeSignal(code);
  if(desc.type!=='answer')throw Error('Esse é o seu próprio código. Cole a resposta do seu amigo.');
  await this.pc.setRemoteDescription(desc);
  this.state('connecting');
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
  // Never touch the real online server while linked.
  red.mantener=false;red.salir?.();
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
  if(red.ws?.readyState===1&&red.ws.send&&!(red.ws instanceof WebSocket)){red.ws.close();red.ws=null}
  red.codigo=null;red.rol=null;red.rivalDentro=false;red.cerrarP2P?.();
  red.emitir?.('caida',{});
  this.state('lost');
 }
 close(){try{this.dc?.close()}catch{}try{this.pc?.close()}catch{}this.lost()}
}

// --- Screen (main menu → MULTIPLAYER) -----------------------------------------
// DOM panel over the canvas (same approach as the base client's code box).
const CSS=`.t2mp{position:fixed;inset:0;z-index:50;display:flex;align-items:center;justify-content:center;
background:rgba(4,10,30,.82);font-family:${FUENTE_CSS};color:#fff}
.t2mp .box{width:min(640px,94vw);max-height:92vh;overflow:auto;background:#13254f;border:3px solid #5f86bd;
border-radius:10px;padding:14px 16px;box-shadow:0 0 0 3px #0a1838}
.t2mp h2{margin:0 0 6px;color:#ffd23c;font-size:20px;text-align:center}
.t2mp p{margin:6px 0;font-size:13px;line-height:1.4;color:#d7e4ff}
.t2mp textarea{width:100%;height:84px;box-sizing:border-box;font-size:11px;border-radius:6px;border:2px solid #5f86bd;
background:#f4f1e6;color:#202020;padding:6px;word-break:break-all}
.t2mp .row{display:flex;gap:8px;flex-wrap:wrap;margin-top:8px}
.t2mp button{flex:1;min-width:130px;padding:10px 8px;font-size:14px;border-radius:6px;border:2px solid #0a1838;
background:#2f5aa8;color:#fff;cursor:pointer;font-family:${FUENTE_CSS}}
.t2mp button.gold{background:#f2c230;color:#202020}
.t2mp .msg{min-height:18px;color:#ffd47a;font-size:12px;margin-top:6px}`;
export class Torre2Multi extends Phaser.Scene{
 constructor(){super({key:'torre2Multi'})}
 create(){
  this.cameras.main.setBackgroundColor('#0b1838');
  if(!document.getElementById('t2mp-css')){const st=document.createElement('style');st.id='t2mp-css';st.textContent=CSS;document.head.appendChild(st)}
  const root=this.root=document.createElement('div');root.className='t2mp';root.dataset.torre2Multi='1';
  document.body.appendChild(root);
  this.events.once('shutdown',()=>root.remove());
  this.link=window.__torre2MultiLink=new MultiLink({
   onState:(s,e)=>this.status(s==='connecting'?'Conectando...':s==='linked'?'Conectado! Abrindo a sala...':
    s==='lost'?'Conexão perdida.':s==='error'?String(e?.message||e):''),
   onReady:({role,codigo})=>{
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
 home(){
  const box=this.panel('MULTIPLAYER',`<p>Lute com um amigo, cada um no seu aparelho, sem servidor.</p>
   <p><b>1.</b> Um cria a sala e manda o código (WhatsApp).<br><b>2.</b> O outro cola e manda a resposta.<br>
   <b>3.</b> Quem criou cola a resposta. Depois cada um escolhe o Pokémon e toca em READY.</p>
   <p style="color:#9fb6e6;font-size:11px">Funciona melhor com os dois no Wi-Fi. Em algumas redes de celular a conexão direta é bloqueada.</p>
   <div class="row"></div>`);
  this.button(box,'CRIAR SALA',()=>this.host(),true);
  this.button(box,'ENTRAR COM CÓDIGO',()=>this.guest());
  this.button(box,'VOLTAR',()=>{this.link.close();this.scene.start('titulo',{})});
 }
 copyArea(code){
  return `<textarea readonly data-t2mp-code>${code}</textarea>`;
 }
 async copy(text){try{await navigator.clipboard.writeText(text);this.status('Código copiado!')}catch{this.status('Selecione o código e copie.')}}
 async host(){
  this.panel('CRIAR SALA','<p>Gerando o seu código...</p>');
  const code=await this.link.createOffer();
  const box=this.panel('CRIAR SALA',`<p><b>1.</b> Mande este código para o seu amigo:</p>${this.copyArea(code)}
   <div class="row" data-r1></div><p><b>2.</b> Cole aqui a resposta dele:</p><textarea data-t2mp-answer placeholder="T2MP1:..."></textarea><div class="row" data-r2></div>`);
  const r1=box.querySelector('[data-r1]'),r2=box.querySelector('[data-r2]');
  const b1=document.createElement('button');b1.textContent='COPIAR CÓDIGO';b1.onclick=()=>this.copy(code);r1.appendChild(b1);
  if(navigator.share){const s=document.createElement('button');s.textContent='COMPARTILHAR';s.onclick=()=>navigator.share({text:code}).catch(()=>{});r1.appendChild(s)}
  const ok=document.createElement('button');ok.className='gold';ok.textContent='CONECTAR';ok.setAttribute('data-t2mp-connect','1');
  ok.onclick=async()=>{try{await this.link.acceptAnswer(box.querySelector('[data-t2mp-answer]').value)}catch(e){this.status(e.message)}};
  r2.appendChild(ok);
  const back=document.createElement('button');back.textContent='VOLTAR';back.onclick=()=>{this.link.close();this.scene.restart()};r2.appendChild(back);
 }
 guest(){
  const box=this.panel('ENTRAR COM CÓDIGO',`<p><b>1.</b> Cole o código que seu amigo mandou:</p>
   <textarea data-t2mp-offer placeholder="T2MP1:..."></textarea><div class="row" data-r1></div>`);
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
  r1.appendChild(go);
  const back=document.createElement('button');back.textContent='VOLTAR';back.onclick=()=>this.home();r1.appendChild(back);
 }
}
