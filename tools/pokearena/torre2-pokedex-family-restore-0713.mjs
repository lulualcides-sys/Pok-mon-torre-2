/* Alpha 0.71.3 modern Pokédex: restore original family evolution tabs.
 * For every visible card and its stages, load only verified same-origin PNGs.
 * All 278 loose Idle and portrait files are already in the audited artifact.
 */
const replace=(s,a,b)=>{
 if(s.split(a).length!==2)throw Error('Pokédex family contract changed: '+a.slice(0,70));
 return s.replace(a,b);
};
export function restoreFamiliesAndMissingSprites0713(source,alpha){
 if(alpha!=='0.71.3')return source;
 if(typeof source!=='string'||!source.includes('class Pokedex extends Phaser.Scene')||
  !source.includes('const ROSTER=buildIndividualDexRoster(')||
  !source.includes('torre2CargarPagina(page){'))
  throw Error('Expected proven native individual Pokédex before family restoration');
 let s=replace(source,
  'import{buildIndividualDexRoster}from"../torre2/pokedex-individual-roster.js";',
  'import{buildIndividualDexRoster}from"../torre2/pokedex-individual-roster.js";'+
  'import{buildFamilyDexRoster}from"../torre2/pokedex-family-cards.js";'+
  'import{buildPokedexFamilies}from"../torre2/pokedex-families.js";'+
  'import{JOHTO_100_ROWS}from"../torre2/johto-100-data.js";');
 s=replace(s,'const ROSTER=buildIndividualDexRoster(BATTLE_ROSTER,etapasDe,REGLAS.vidaGlobal);',
  'const FULL_ROSTER=buildIndividualDexRoster(BATTLE_ROSTER,etapasDe,REGLAS.vidaGlobal);'+
  'const ROSTER=buildFamilyDexRoster(FULL_ROSTER,BATTLE_ROSTER,JOHTO_100_ROWS,etapasDe,buildPokedexFamilies);');
 s=replace(s,'this.etapas=etapasDe(p);const et=this.vista=conForma(p,this.etapas[this.etapa]',
  'this.etapas=p.torre2DexStages??etapasDe(p);const et=this.vista=conForma(p,this.etapas[this.etapa]');
 const tick=String.fromCharCode(96),dollar=String.fromCharCode(36);
 s=replace(s,'cabecera(this,"POKÉDEX",'+tick+dollar+'{ROSTER.length} POKÉMON'+tick+')',
  'cabecera(this,"POKÉDEX",'+tick+dollar+'{FULL_ROSTER.length} POKÉMON'+tick+')');
 s=replace(s,'ROSTER.filter(p=>{const n=Number(p.dex);return n>=152&&n<=251})',
  'FULL_ROSTER.filter(p=>{const n=Number(p.dex);return n>=152&&n<=251})');
 const direct='torre2DirectLocal(forms){'+
  'this._torre2QueuedLocal??=new Set();let count=0;'+
  'for(const[dex,form]of Object.entries(forms)){'+
   'const idle=form.anims?.Idle;'+
   'if(!idle?.file||!Number.isFinite(idle.fw)||!Number.isFinite(idle.fh))continue;'+
   'const sprite="pmd-"+dex+"-Idle";'+
   'if(!this.textures.exists(sprite)&&!this._torre2QueuedLocal.has(sprite)){'+
    'this._torre2QueuedLocal.add(sprite);'+
    'this.load.spritesheet(sprite,"assets/pmd/"+idle.file,{frameWidth:idle.fw,frameHeight:idle.fh});count++;}'+
   'const portrait="retrato-"+dex;'+
   'if(!this.textures.exists(portrait)&&!this._torre2QueuedLocal.has(portrait)){'+
    'this._torre2QueuedLocal.add(portrait);'+
    'this.load.image(portrait,"assets/pmd/"+dex+"/portrait.png");count++;}'+
  '}return count;}';
 s=replace(s,'torre2CargarPagina(page){',direct+'torre2CargarPagina(page){');
 const old='const count=cargarPMD(this,forms,["Idle"]);';
 if(s.split(old).length!==3)throw Error('Two native page/selected evolution loaders required');
 s=s.replaceAll(old,'const count=this.torre2DirectLocal(forms);');
 s=replace(s,'cargarPMD(this,this._torre2FirstForms,["Idle"]);this._torre2JohtoForms=',
  'this.torre2DirectLocal(this._torre2FirstForms);this._torre2JohtoForms=');
 const start='for(const[dex,form]of Object.entries(this._torre2JohtoForms)){';
 const end='}create(){';
 const i=s.indexOf(start),j=s.indexOf(end,i);
 if(i<0||j<0||s.indexOf(start,i+1)!==-1)throw Error('Johto preload sequence changed');
 s=s.slice(0,i)+'this.torre2DirectLocal(this._torre2JohtoForms);'+s.slice(j);
 s=replace(s,
  'const info=p.torre2DexNext?"EVOLVES INTO "+p.torre2DexNext+" WHEN EXP IS FULL":et.mega?',
  'const info=(this.etapas?.slice(this.etapa+1).find(x=>x.dex!==et.dex))?'+
  '"EVOLVES INTO "+this.etapas.slice(this.etapa+1).find(x=>x.dex!==et.dex).nombre+" WHEN EXP IS FULL":et.mega?');
 return s;
}
