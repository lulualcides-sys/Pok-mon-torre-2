/* Pokémon Torre 2 — 3x3 in the friendly room (owner request 2026-11-20:
 * "revanche rápida com troca de Pokémon, 3x3").
 * The base client's combat already plays 3-Pokémon teams online (native
 * Equipo + Enlace "cambio" sync, used by its ranked draft). Its friendly room
 * only picks one Pokémon. These hooks let the Torre 2 multiplayer module
 * (torre2-multiplayer.js, globalThis.__torre2Sala) add a 1x1/3x3 choice and
 * two extra team slots to that room. Without the hook object every call is a
 * no-op, so the native room is unchanged. Refuses to patch if the base client
 * changed.
 */
const once=(src,from,to,label)=>{
 if(src.split(from).length!==2)throw Error('Room teams patch: unexpected '+label+' (base client changed)');
 return src.replace(from,to);
};
const H='globalThis.__torre2Sala';
export function patchFriendlyRoomTeams(source){
 let s=String(source);
 s=once(s,'this.pintarSala();this.saludar(true)}panelJugador(',
  `this.pintarSala();${H}?.vista?.(this);this.saludar(true)}panelJugador(`,'room view');
 s=once(s,'this.pintarConexion();const distintas=',
  `this.pintarConexion();${H}?.pintar?.(this);const distintas=`,'room paint');
 s=once(s,'pide:pide?1:0})}alRival(',
  `pide:pide?1:0,...(${H}?.hola?.(this)??{})})}alRival(`,'hello message');
 s=once(s,'alHola(m){this.rival=m.id??null;',
  `alHola(m){this.rival=m.id??null;${H}?.alHola?.(this,m);`,'hello handler');
 s=once(s,'const m={t:"empezar",p1:this.miId,p2:this.rival,arena:this.arena};red.enviar(m);',
  `const m={t:"empezar",p1:this.miId,p2:this.rival,arena:this.arena};if(${H}?.empezar?.(this,m)===false)return;red.enviar(m);`,'match start');
 s=once(s,'nombres:red.lado===0?[yo,otro]:[otro,yo]}))}async compartir(',
  `nombres:red.lado===0?[yo,otro]:[otro,yo],...(${H}?.combate?.(this,m)??{})}))}async compartir(`,'combat data');
 return s;
}
