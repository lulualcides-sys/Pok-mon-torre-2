/* Pokémon Torre 2 — end of a friendly online match (owner list 2026-11-20,
 * items 3/5/6): two hooks in the base client's resultadoOnline():
 *  - placar: the score line can show team K.O.s ("3-0 K.O.") in 3x3;
 *  - fim: runs after the native REMATCH/ROOM buttons (history, TROCAR TIME).
 * Both are optional calls to globalThis.__torre2Fim; without it the native
 * screen is byte-for-byte the same. Ranked results are not touched.
 * Refuses to patch if the base client changed.
 */
const H='globalThis.__torre2Fim';
const fail=label=>{throw Error('Online result patch: unexpected '+label+' (base client changed)')};
export function patchOnlineResult(source){
 const s=String(source);
 const start=s.indexOf('resultadoOnline(ganador){');
 const end=s.indexOf('}resultadoRanked(',start);
 if(start<0||end<0||s.indexOf('resultadoOnline(ganador){',start+1)>=0)fail('resultadoOnline');
 let body=s.slice(start,end);
 const score='texto(this,ANCHO/2,128,`${l.nombre} ${this.victorias[ganador]}-${this.victorias[1-ganador]}`,{tam:8})';
 if(body.split(score).length!==2)fail('score line');
 body=body.replace(score,`texto(this,ANCHO/2,128,${H}?.placar?.(this,ganador)??\`\${l.nombre} \${this.victorias[ganador]}-\${this.victorias[1-ganador]}\`,{tam:8})`);
 const tail='alTeclado(this,"keydown-R",()=>this.pedirRevancha())';
 if(!body.endsWith(tail))fail('end of the online result');
 body+=`;${H}?.fim?.(this,ganador)`;
 return s.slice(0,start)+body+s.slice(end);
}
