/** Alpha 0.71.3: starting a LOCAL battle must not wait indefinitely for
 * selection's decorative portrait loader. The battle scene has its OWN
 * preload() and creates every required animation before create().
 * Keep PvP online/ranked ticket, boss script, ranked and campaign semantics.
 */
const strict=(s,from,to)=>{
 if(s.split(from).length!==2)throw Error('Changed Arena/League start contract: '+from.slice(0,64));
 return s.replace(from,to);
};
export function unblockLocalBattleStarts(source,alpha){
 if(alpha!=='0.71.3')return source;
 if(typeof source!=='string'||!source.includes('class Seleccion extends Phaser.Scene'))
  throw Error('Unrecognized native selection module');
 let s=source;
 // Preserve online ticket checks and async boss story loading.
 s=strict(s,'const datos=datosReto(this.dispositivos,this.eleccion[0]);alTerminarCarga(this,()=>this.scene.start("combate",datos));return',
   'const datos=datosReto(this.dispositivos,this.eleccion[0]);this.scene.start("combate",datos);return');
 s=strict(s,'alTerminarCarga(this,()=>this.scene.start("combate",{p1:this.eleccion[0],p2:this.liga.pokemon??this.liga.rival,arena:this.liga.arena,nivel:this.liga.nivel,modo:"cpu",mandos:[...this.dispositivos],liga:this.liga,aspectos,jefes,etapas,cerebros:cerebrosJefe(rivalLiga(this.liga.rival))}));return',
   'this.scene.start("combate",{p1:this.eleccion[0],p2:this.liga.pokemon??this.liga.rival,arena:this.liga.arena,nivel:this.liga.nivel,modo:"cpu",mandos:[...this.dispositivos],liga:this.liga,aspectos,jefes,etapas,cerebros:cerebrosJefe(rivalLiga(this.liga.rival))});return');
 s=strict(s,'alTerminarCarga(this,()=>this.scene.start("combate",{p1:this.eleccion[0],p2:this.eleccion[1],arena:this.arena,nivel:this.nivel,modo:this.modo,mandos:[...this.dispositivos],aspectos}))',
   'this.scene.start("combate",{p1:this.eleccion[0],p2:this.eleccion[1],arena:this.arena,nivel:this.nivel,modo:this.modo,mandos:[...this.dispositivos],aspectos})');
 return s;
}
