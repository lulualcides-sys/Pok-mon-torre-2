/* Source adapter only; native combat roster and official Pokémon moves
 * remain intact. The Pokédex gets one independent card per real species.
 */
const swap=(s,a,b)=>{
 if(s.split(a).length!==2)throw Error('Changed 0.71.3 Pokédex contract: '+a.slice(0,74));
 return s.replace(a,b);
};
export function installIndividualPokedex0713(source,alpha){
 if(alpha!=='0.71.3')return source;
 if(typeof source!=='string'||!source.includes('const PAGE_SIZE=COLS*5;')||
   !source.includes('torre2CargarPagina(page){')||
   !source.includes('class Pokedex extends Phaser.Scene{'))
  throw Error('Unrecognized 0.71.3 national Pokédex source');
 let s=swap(source,'import{ROSTER,RANURAS,ROLES,REGLAS,etapaDe}from"../datos.js";',
 'import{ROSTER as BATTLE_ROSTER,RANURAS,ROLES,REGLAS,etapaDe}from"../datos.js";'+
 'import{buildIndividualDexRoster}from"../torre2/pokedex-individual-roster.js";');
 s=swap(s,'}class Pokedex extends Phaser.Scene{',
  '}const ROSTER=buildIndividualDexRoster(BATTLE_ROSTER,etapasDe,REGLAS.vidaGlobal);'+
  'class Pokedex extends Phaser.Scene{');
 s=swap(s,'describir(p.id,h.nombre,h.forma)',
  'describir(p.torre2DexOriginId??p.id,h.nombre,h.forma)');
 s=swap(s,'const info=et.mega?',
  'const info=p.torre2DexNext?"EVOLVES INTO "+p.torre2DexNext+" WHEN EXP IS FULL":et.mega?');
 // The confirmed 100 Johto portrait/Idle PNGs weigh only ~1.1 MiB total.
 // Preload them inside the Pokédex so page changes and Chikorita evolutions
 // don't render empty cells while an asynchronous loader is still active.
 const from='this._torre2FirstForms=soloFormas(m,new Set(ROSTER.slice(start,start+PAGE_SIZE).map(p=>p.dex)));cargarPMD(this,this._torre2FirstForms,["Idle"])';
 const to='this._torre2FirstForms=soloFormas(m,new Set(ROSTER.slice(start,start+PAGE_SIZE).map(p=>p.dex)));'+
  'cargarPMD(this,this._torre2FirstForms,["Idle"]);'+
  // These 100 compact PNG sets are BUILD-VERIFIED as local files. Go to
  // assets/pmd directly: the native packed-PMD index may refer to remote
  // binary names that do not contain Torre2-added Johto files.
  'this._torre2JohtoForms=soloFormas(m,new Set(ROSTER.filter(p=>{const n=Number(p.dex);return n>=152&&n<=251}).map(p=>p.dex)));'+
  'for(const[dex,form]of Object.entries(this._torre2JohtoForms)){'+
  'const idle=form.anims?.Idle;if(!idle?.file)throw Error("Missing Johto PMD Idle: "+dex);'+
  'const key="pmd-"+dex+"-Idle";'+
  'if(!this.textures.exists(key))this.load.spritesheet(key,"assets/pmd/"+idle.file,{frameWidth:idle.fw,frameHeight:idle.fh});'+
  'const portrait="retrato-"+dex;'+
  'if(!this.textures.exists(portrait))this.load.image(portrait,"assets/pmd/"+dex+"/portrait.png");'+
  '}';
 s=swap(s,from,to);
 s=swap(s,'crearAnimsPMD(this,this._torre2FirstForms,["Idle"]);cabecera(this,',
  'crearAnimsPMD(this,this._torre2FirstForms,["Idle"]);'+
  'crearAnimsPMD(this,this._torre2JohtoForms,["Idle"]);cabecera(this,');
 return s;
}
