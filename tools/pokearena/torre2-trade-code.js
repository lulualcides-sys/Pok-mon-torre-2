/* Pokémon Torre 2 — Pokémon trade by code (campaign). Pure, no Phaser/DOM.
 * Sending turns ONE Pokémon into a code and removes it from the sender's save
 * (a trade moves the Pokémon, it never clones it). The friend pastes the code
 * once; each code has its own id so it can be received only once per save.
 * Code: "T2P-" + base64url(JSON) + "-" + 4-char checksum.
 */
const list=v=>Array.isArray(v)?v:[];
const B64='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
function sum(str){let h=2166136261;for(const ch of 'T2P|'+str){h^=ch.codePointAt(0);h=Math.imul(h,16777619)>>>0}return h.toString(36).slice(-4).padStart(4,'0')}
function toB64(text){const bytes=new TextEncoder().encode(text);let out='',bits=0,acc=0;
 for(const b of bytes){acc=(acc<<8)|b;bits+=8;while(bits>=6){bits-=6;out+=B64[(acc>>bits)&63]}}
 if(bits)out+=B64[(acc<<(6-bits))&63];return out}
function fromB64(code){const bytes=[];let bits=0,acc=0;
 for(const ch of code){const v=B64.indexOf(ch);if(v<0)throw Error('bad');acc=((acc<<6)|v)&0xffffff;bits+=6;if(bits>=8){bits-=8;bytes.push((acc>>bits)&255)}}
 return new TextDecoder().decode(new Uint8Array(bytes))}
const cleanName=v=>String(v||'Treinador').replace(/[^\p{L}\p{N} ._-]/gu,'').slice(0,12)||'Treinador';
export function encodeTradeCode({id,level,shiny=false,from='Treinador',tradeId}){
 const t=String(tradeId||Math.random().toString(36).slice(2,10)).replace(/[^a-z0-9]/gi,'').slice(0,12);
 const body=JSON.stringify({v:1,t,id:String(id),lv:Math.max(1,Math.min(100,Math.round(Number(level)||5))),sh:shiny?1:0,ot:cleanName(from)});
 const b=toB64(body);return 'T2P-'+b+'-'+sum(b);
}
export function decodeTradeCode(code){
 const m=String(code||'').trim().match(/^T2P-([A-Za-z0-9_-]+)-([a-z0-9]{4})$/);
 if(!m||sum(m[1])!==m[2])return null;
 try{const d=JSON.parse(fromB64(m[1]));
  if(d?.v!==1||typeof d.id!=='string'||!/^[a-z0-9-]{2,24}$/.test(d.id)||typeof d.t!=='string'||!d.t)return null;
  return {tradeId:d.t,id:d.id,level:Math.max(1,Math.min(100,d.lv|0)),shiny:d.sh===1,from:cleanName(d.ot)};
 }catch{return null}
}
// Can this member leave the save? Keeps at least one Pokémon in the team.
export function canSend(s,uid){
 const inTeam=list(s?.team).findIndex(m=>m?.uid===uid),inBox=list(s?.box).findIndex(m=>m?.uid===uid);
 if(inTeam<0&&inBox<0)return {ok:false,reason:'Pokémon não encontrado.'};
 if(inTeam>=0&&list(s.team).length<=1)return {ok:false,reason:'Você precisa manter pelo menos 1 Pokémon na equipe.'};
 return {ok:true,where:inTeam>=0?'team':'box',index:inTeam>=0?inTeam:inBox};
}
