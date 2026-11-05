/* Native title and Pokedex startup adapters.
 * UI only: preserve ROSTER indices, saves, slots, animations, combat and HUD.
 */
const replaceOnce=(src,from,to,label)=>{
 const count=src.split(from).length-1;
 if(count!==1)throw Error('Torre2 UI: upstream changed '+label+' ('+count+')');
 return src.replace(from,to);
};

export function removeCustomizeTitleOption(original){
 let source=String(original);
 const found=[...source.matchAll(/\btxt\s*:\s*(["'])CUSTOMIZE\1/gi)];
 if(!found.length)return source;
 if(found.length!==1)throw Error('Ambiguous CUSTOMIZE menu options');
 const at=found[0].index,start=source.lastIndexOf('{id:',at);
 if(start<0||at-start>220)throw Error('CUSTOMIZE not found in native menu');
 let depth=0,quote='',escaped=false,end=-1;
 for(let i=start;i<source.length;i++){
  const c=source[i];
  if(quote){
   if(escaped){escaped=false;continue;}
   if(c==='\\'){escaped=true;continue;}
   if(c===quote)quote='';
   continue;
  }
  if(c==='"'||c==="'"||c.charCodeAt(0)===96){quote=c;continue;}
  if(c==='{')depth++;
  else if(c==='}'&&!--depth){end=i;break;}
 }
 if(end<0||at>end)throw Error('Unknown CUSTOMIZE menu syntax');
 const entry=source.slice(start,end+1);
 if(!/^\{id\s*:/.test(entry)||!/\btxt\s*:\s*(["'])CUSTOMIZE\1/i.test(entry))
  throw Error('CUSTOMIZE is not a standalone button');
 let from=start,to=end+1;
 if(source[to]===',')to++;
 else if(source[from-1]===',')from--;
 else if(source[from-1]!=='['||source[to]!==']')
  throw Error('Unknown CUSTOMIZE menu delimiter');
 source=source.slice(0,from)+source.slice(to);
 if(/\btxt\s*:\s*(["'])CUSTOMIZE\1/i.test(source))
  throw Error('CUSTOMIZE menu entry survived patch');
 return source;
}

export function preloadPokedexOnePage(original){
 let source=String(original);
 const oldPreload='preload(){const m=this.registry.get("manifiesto");this._torre2DexForms=soloFormas(m,new Set(ROSTER.map(p=>p.dex)));cargarPMD(this,this._torre2DexForms,["Idle"]);}create(){crearAnimsPMD(this,this._torre2DexForms,["Idle"]);';
 const fastPreload=[
  'preload(){torre2DexEnsureOrder();',
  'const rank=TORRE2_DEX_RANK[this.foco],start=Math.floor(rank/36)*36;',
  'const first=TORRE2_DEX_ORDER.slice(start,start+36).map(i=>ROSTER[i].dex);',
  'const m=this.registry.get("manifiesto");',
  'this._torre2DexForms=soloFormas(m,new Set(first));',
  'cargarPMD(this,this._torre2DexForms,["Idle"]);}',
  'torre2DexLoadPage(page){',
  'const requested=this.__torre2DexPageRequests??=new Set();',
  'if(requested.has(page))return;requested.add(page);',
  'const m=this.registry.get("manifiesto");',
  'const ids=TORRE2_DEX_ORDER.slice(page*36,(page+1)*36).map(i=>ROSTER[i].dex);',
  'const forms=soloFormas(m,new Set(ids));',
  'const ready=()=>{if(!this.scene.isActive())return;',
  'crearAnimsPMD(this,forms,["Idle"]);',
  'for(let j=0;j<(this.casillas?.length||0);j++){',
  'if(Math.floor(TORRE2_DEX_RANK[j]/36)!==page)continue;',
  'const c=this.casillas[j],key="retrato-"+c.p.dex;',
  'if(this.textures.exists(key))c.img.setTexture(key);}',
  'if(this.dexPage===page)this.refrescar(true);};',
  'const pending=cargarPMD(this,forms,["Idle"]);',
  'if(pending){this.load.once("complete",ready);',
  'if(!this.load.isLoading())this.load.start();}else ready();}',
  'create(){crearAnimsPMD(this,this._torre2DexForms,["Idle"]);'
 ].join('');
 source=replaceOnce(source,oldPreload,fastPreload,'Pokédex first-page preload');
 const oldChoose='const next=Math.floor(TORRE2_DEX_RANK[i]/36);if(next!==this.dexPage){';
 const fastChoose='const next=Math.floor(TORRE2_DEX_RANK[i]/36);if(next!==this.dexPage){this.torre2DexLoadPage(next);';
 source=replaceOnce(source,oldChoose,fastChoose,'Pokédex navigation');
 return source;
}
