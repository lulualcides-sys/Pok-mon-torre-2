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
  "preload(){torre2DexEnsureOrder();",
  "this.__torre2DexPageRequests=new Set();this.__torre2DexIdleRequests=new Set();",
  "const rank=TORRE2_DEX_RANK[this.foco]??0,start=Math.floor(rank/36)*36;",
  "const first=TORRE2_DEX_ORDER.slice(start,start+36).map(i=>ROSTER[i].dex);",
  "const m=this.registry.get(\"manifiesto\");",
  "this._torre2DexForms=soloFormas(m,new Set(first));",
  "cargarPMD(this,this._torre2DexForms,[\"Idle\"]);}",
  "torre2DexEnsureIdle(dex){",
  "const key=\"pmd-\"+dex+\"-Idle\",m=this.registry.get(\"manifiesto\");",
  "const forms=soloFormas(m,new Set([dex]));",
  "if(!forms[dex])return;",
  "if(this.textures.exists(key)){crearAnimsPMD(this,forms,[\"Idle\"]);return;}",
  "if(this.__torre2DexIdleRequests.has(dex))return;",
  "this.__torre2DexIdleRequests.add(dex);",
  "const loaded=fileKey=>{if(fileKey!==key)return;",
  "this.load.off(\"filecomplete\",loaded);",
  "this.__torre2DexIdleRequests.delete(dex);",
  "crearAnimsPMD(this,forms,[\"Idle\"]);",
  "if(this.scene.isActive()&&this.etapas?.[this.etapa]?.dex===dex)this.refrescar(false);};",
  "this.load.on(\"filecomplete\",loaded);",
  "const count=cargarPMD(this,forms,[\"Idle\"]);",
  "if(count&&!this.load.isLoading())this.load.start();",
  "if(!count&&!this.load.isLoading()){",
  "this.load.off(\"filecomplete\",loaded);this.__torre2DexIdleRequests.delete(dex);",
  "if(this.textures.exists(key))loaded(key);}}",
  "torre2DexLoadPage(page){",
  "if(!Number.isInteger(page)||page<0||page>=Math.ceil(ROSTER.length/36))return;",
  "if(this.__torre2DexPageRequests.has(page))return;",
  "this.__torre2DexPageRequests.add(page);",
  "const ids=TORRE2_DEX_ORDER.slice(page*36,(page+1)*36).map(i=>ROSTER[i].dex);",
  "const forms=soloFormas(this.registry.get(\"manifiesto\"),new Set(ids));",
  "const visible=()=>this.dexPage===page;",
  "const progress=()=>{if(!this.scene.isActive()||!visible())return;",
  "const loaded=ids.filter(id=>this.textures.exists(\"retrato-\"+id)).length;",
  "const label=this.__torre2DexLoadingLabel??(",
  "this.__torre2DexLoadingLabel=this.add.text(12,291,\"\",",
  "{fontFamily:\"Pixelify Sans,monospace\",fontSize:\"10px\",color:\"#ffe5ad\"}).setDepth(30));",
  "label.setText(loaded===ids.length?\"\":\"SPRITES \"+loaded+\" / \"+ids.length);};",
  "const apply=()=>{if(!this.scene.isActive())return;",
  "for(const c of this.casillas||[]){",
  "if(Math.floor(TORRE2_DEX_RANK[this.casillas.indexOf(c)]/36)!==page)continue;",
  "const key=\"retrato-\"+c.p.dex;",
  "if(this.textures.exists(key)&&c.img.texture?.key!==key)c.img.setTexture(key);",
  "c.img.setVisible(visible()&&this.textures.exists(key));}",
  "progress();};",
  "const onFile=(key)=>{if(key.startsWith(\"retrato-\")&&ids.some(id=>key===\"retrato-\"+id))apply();};",
  "this.load.on(\"filecomplete\",onFile);",
  "const finish=()=>{this.load.off(\"filecomplete\",onFile);",
  "this.__torre2DexPageRequests.delete(page);apply();",
  "if(this.scene.isActive()&&visible()&&this.etapas?.[this.etapa])this.torre2DexEnsureIdle(this.etapas[this.etapa].dex);};",
  "const count=cargarPMD(this,forms,[]);",
  "progress();",
  "if(count||this.load.isLoading()){this.load.once(\"complete\",finish);",
  "if(count&&!this.load.isLoading())this.load.start();}",
  "else finish();}",
  "create(){crearAnimsPMD(this,this._torre2DexForms,[\"Idle\"]);"
 ].join('');
 source=replaceOnce(source,oldPreload,fastPreload,'Pokédex first-page preload');
 const oldChoose='const next=Math.floor(TORRE2_DEX_RANK[i]/36);if(next!==this.dexPage){';
 const fastChoose='const next=Math.floor(TORRE2_DEX_RANK[i]/36);if(next!==this.dexPage){this.torre2DexLoadPage(next);';
 source=replaceOnce(source,oldChoose,fastChoose,'Pokédex navigation');
 const oldPedestal='peana(et,celebrar){this.sprite?.destroy();const m=this.manifiesto[et.dex];';
 const safePedestal='peana(et,celebrar){this.sprite?.destroy();if(!this.textures.exists("pmd-"+et.dex+"-Idle")){this.torre2DexEnsureIdle(et.dex);return;}const m=this.manifiesto[et.dex];';
 source=replaceOnce(source,oldPedestal,safePedestal,'Pokédex selected sprite guard');
 return source;
}
