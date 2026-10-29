/* Kanto-only additive Pokémon family pagination. Preserve original
 * Poké Arena evo tabs and sprite rendering, keep 6x6 cards above pedestal.
 */
const once=(src,a,b)=>{
 if(!src.includes(a))throw Error('Pokédex upstream source unexpectedly changed '+a.slice(0,75));
 return src.replace(a,b);
};
export function normalizePokedexNameColumn(s){
 // New upstream builds measure translated role labels before placing names.
 // Preserve their clipping and dynamic width, while retaining Torre 2 labels.
 if(s.includes('const nx=TX+(esTactil()?52:38);')){
  s=once(s,'const nx=TX+(esTactil()?52:38);','const nx=TX+72;');
 }else{
  s=once(s,'const nx=Math.max(TX+(esTactil()?52:38),TX+6+Math.max(...etiquetas.map(t=>t.width))+8);',
   'const nx=Math.max(TX+72,TX+6+Math.max(...etiquetas.map(t=>t.width))+8);');
 }
 return s;
}
// The original Poké Arena now sometimes omits TIPOS from its Pokédex import.
// Our existing Kanto card renderer still needs the exported palette for the
// original dual-type pixel bars. Add ONLY the missing import; do not replace
// native palettes, graphics, scene state or Pokémon move metadata.
export function ensurePokedexTypePaletteImport(source){
 const s=String(source);
 const imports=[...s.matchAll(/import\s*\{([^}]+)\}\s*from\s*["']\.\.\/datos\.js["'];/g)];
 if(!imports.length)throw Error('Unrecognized original Pokédex datos import');
 if(imports.some(match=>match[1].split(',').map(x=>x.trim()).includes('TIPOS')))
  return s;
 return s.replace(imports[0][0],imports[0][0]+'import{TIPOS}from"../datos.js";');
}
export function paginateKantoPokedexSource(original){
 let s=ensurePokedexTypePaletteImport(original);
 s=once(s,
  'this.casillas=ROSTER.map((p,i)=>this.casilla(p,GX+i%COLS*CEL,GY+Math.floor(i/COLS)*CEL,i));',
  'this.dexPage=Math.floor(this.foco/36);this.dexPages=Math.ceil(ROSTER.length/36);this.casillas=ROSTER.map((p,i)=>this.casilla(p,GX+(i%36)%COLS*CEL,GY+Math.floor((i%36)/COLS)*CEL,i));');
 // Match the Kanto campaign's actual equipped attack names per evolution.
 // The native Poké Arena 2D Pokédex does not know about Torre 2 loadouts.
 // Only recognized Kanto forms are adapted; all other original entries,
 // Pokémon portraits, old evolution tabs and sprite animations are untouched.
 s=once(s,
  'import{describir}from"../guia.js";',
  'import{describir}from"../guia.js";'+
  'import{earlyKantoSlotPlan,nativeKantoEvolutionPlan}from"../torre2/early-kanto-species.js";'+
  'import{resolveLoadout,moveUnlockLevel,canonicalMoveKey,TEST_LIBRARY,campaignLearnset}from"../torre2/move-pool.js";'+
  'import{frlgMachineCompatible}from"../torre2/frlg-learnsets.js";'+
  'import{kanto151SlotPlan}from"../torre2/all-kanto-species.js";');
 const sync=String.raw`function kantoDexStages(def){
 const stages=etapasDe(def);
 return stages.map((stage,i)=>{
  if(stage.mega)return stage;
  const species=(i===0?def.id:(def.evoluciones?.[i-1]?.nombre||'')).toLowerCase();
  const plan=earlyKantoSlotPlan(species)||nativeKantoEvolutionPlan(species)||
   kanto151SlotPlan(species)||['lmb','rmb','q','e'].map(slot=>stage.kit?.[slot]?.nombre||null);
  if(!plan?.some(Boolean))return stage;
  // These are the same REAL stage kits as VS CPU/Training/Arena, never
  // the campaign level-100 chosen moves. Campaign level/TM data is
  // available separately through the GOLPES POR LEVEL overlay.
  const member={id:species,progression:{species,level:100}};
  // Newly introduced Kanto evolutions can inherit an invalid speed/attack
  // number from the original Poké Arena stage calculator. A NaN previously
  // left the right-hand Pokédex panel empty on Nidorino/Nidoking.
  // Normalize DISPLAY stats only: never change actual battle progression.
  const safe=(v,fallback)=>Number.isFinite(v)?v:fallback;
  const evo=def.evoluciones?.[i-1];
  const baseHp=safe(def.hp,90);
  const baseVel=safe(def.vel,110);
  const stageStats={
   hp:safe(stage.hp,safe(evo?.hp,baseHp)),
   vel:safe(stage.vel,safe(evo?.vel,Math.round(baseVel*(1+i*.09)))),
   atk:safe(stage.atk,safe(evo?.atk,safe(def.atk,1))),
   def:safe(stage.def,safe(evo?.def,safe(def.def,1))),
   regen:safe(stage.regen,safe(def.regen,4))
  };
  const original=resolveLoadout(member);
  const kit={...original},slots=['lmb','rmb','q','e'];
  for(let i=0;i<slots.length;i++){
   const slot=slots[i],named=canonicalMoveKey(plan[i]);
   const h=original[slot];
   if(!h?.nombre||!h?.forma){
    kit[slot]={nombre:'LOCKED',forma:'golpe',tipo:'NORMAL',dano:0,
     coste:0,cd:0,pendiente:true,torre2Unavailable:true};
    continue;
   }
   // No misleading campaign-lock labels in the OTHER-MODE Pokédex.
   // Its full learnset panel still lists true levels/TMs separately.
   kit[slot]={...h,pendiente:false,
    ...(slot==='e'?{ulti:true}:{})
   };
  }
  // Four attacks (ATK/HAB2/HAB3/ULT) are taken from the actual native
  // Arena kit. The separately documented fifth role is a defensive Dodge,
  // never an incidental fifth attacking native ESP such as Vine Whip.
  // Retain species-specific defensive visuals (e.g. flying dodge) when real.
  const priorDodge=original.esp;
  const isDefensive=priorDodge?.forma&&(!Number.isFinite(priorDodge.dano)||priorDodge.dano<=0)&&
   ['dash','vuelo','esquiva','teleport','blink','salto'].includes(priorDodge.forma);
  kit.esp={...(isDefensive?priorDodge:{
   forma:'dash',tipo:'NORMAL',dano:0,dist:95,dur:.20,cd:4.2,anim:'Walk'
  }),nombre:'Dodge',dano:0};
  return {...stage,...stageStats,kit};
 });
}`;
 s=once(s,'function cifras(slot,h){',sync+"function showKantoCampaignLearnset(scene){\n if(scene.__kantoMovesOverlay){scene.__kantoMovesOverlay.close();return;}\n const def=ROSTER[scene.foco],i=scene.etapa||0;\n const id=String(i===0?def.id:(def.evoluciones?.[i-1]?.nombre||def.id)).toLowerCase();\n const moves=campaignLearnset(id),items=[];\n let page=0;\n const add=o=>{o.setDepth(2600);items.push(o);return o};\n const close=()=>{for(const o of items.splice(0))o.destroy();scene.__kantoMovesOverlay=null};\n scene.__kantoMovesOverlay={close};\n const render=()=>{\n  for(const o of items.splice(0))o.destroy();\n  add(scene.add.rectangle(320,180,632,350,0x061426,.99)\n   .setStrokeStyle(2,0x94bad8).setInteractive());\n  add(texto(scene,28,14,'KANTO · GOLPES POR LEVEL',{tam:14,color:'#ffe5aa'}));\n  add(texto(scene,28,37,id.toUpperCase()+' · '+moves.length+' GOLPES INSTALADOS',\n   {tam:10,color:'#b8d9ef'}));\n  add(texto(scene,28,57,'3 GOLPES NV05 · ULT NV08 · GOLPES NOVOS ATE NV50',\n   {tam:9,color:'#7de5b1'}));\n  add(texto(scene,549,18,'FECHAR X',{tam:10,color:'#ffffff'})\n   .setInteractive({useHandCursor:true}).on('pointerdown',close));\n  moves.slice(page*18,page*18+18).forEach((m,j)=>{\n   const x=28+Math.floor(j/9)*302,y=82+(j%9)*25;\n   const prefix=m.level===null?'TM     ':m.practice&&m.slot==='e'?'ULT 08':'NV '+String(m.level).padStart(2,'0');\n   add(texto(scene,x,y,prefix+'  '+m.name.toUpperCase().slice(0,22),\n    {tam:9,color:m.method==='TM'?'#ffe1a0':m.practice?'#91e9ba':'#e0f2ff'}));\n   add(texto(scene,x,y+12,String(m.type||'').toUpperCase()+\n    (m.level===null?' · ENSINAR TM':m.practice?' · INICIAL COM POTÊNCIA AJUSTADA':' · LIBERA POR NIVEL'),\n    {tam:7,color:'#8faec7'}));\n  });\n  if(!moves.length)add(texto(scene,28,110,'SEM GOLPE INSTALADO PARA ESTA FORMA',\n   {tam:10,color:'#d5c0a6'}));\n  const total=Math.max(1,Math.ceil(moves.length/18));\n  add(texto(scene,292,322,(page+1)+' / '+total,{tam:10,color:'#ffe2ab'}));\n  if(page>0)add(texto(scene,28,322,'◀ ANTERIOR',{tam:10,color:'#cce9ff'})\n   .setInteractive({useHandCursor:true}).on('pointerdown',()=>{page--;render()}));\n  if(page+1<total)add(texto(scene,490,322,'PRÓXIMO ▶',{tam:10,color:'#cce9ff'})\n   .setInteractive({useHandCursor:true}).on('pointerdown',()=>{page++;render()}));\n };\n render();\n}\n"+'function cifras(slot,h){');
 s=once(s,'this.etapas=etapasDe(p);','this.etapas=kantoDexStages(p);');
 s=once(s,'const e=etapasDe(ROSTER[this.foco])[i];',
  'const e=kantoDexStages(ROSTER[this.foco])[i];');
 s=once(s,'this.etapa=i;sfx("confirmar");this.refrescar(true)}',
  'this.etapa=i;this.etapas=kantoDexStages(ROSTER[this.foco]);sfx("confirmar");this.refrescar(true)}');
 // Preserve exact original control mapping and all RANURAS while giving
 // the five battle roles the same visible labels as the campaign summary.
 s=once(s,
  'const BOTON_TACTIL={lmb:"BASIC",rmb:"SKILL",esp:"DASH",q:"Q",e:"ULT"};',
  'const BOTON_TACTIL={lmb:"ATK",rmb:"HAB 2",esp:"ESQUIVA",q:"HAB 3",e:"ULT"};');
 s=normalizePokedexNameColumn(s);
 s=once(s,'esTactil()?BOTON_TACTIL[slot]:tecla',
  'BOTON_TACTIL[slot]');
 const start=s.indexOf('casilla(p,x,y,i){'),end=s.indexOf('elegir(i){',start);
 if(start<0||end<0||!s.slice(start,end).includes('return{p,x,y,w:CEL-2,h:CEL-2}'))
  throw Error('Upstream Pokédex card shape unexpected');
 const card="casilla(p,x,y,i){"+
  "const g=this.add.graphics();g.fillStyle(0,1);g.fillRect(x,y,CEL-2,CEL-2);"+
  "const ancho=(CEL-2)/p.tipos.length;"+
  "p.tipos.forEach((t,k)=>{g.fillStyle(TIPOS[t],1);g.fillRect(x+k*ancho,y+CEL-4,ancho,2)});"+
  "const img=this.add.image(x+1,y+1,'retrato-'+p.dex).setOrigin(0).setDisplaySize(CEL-4,CEL-4);"+
  "const zone=this.add.zone(x+(CEL-2)/2,y+(CEL-2)/2,CEL-2,CEL-2).setInteractive({useHandCursor:true}).on('pointerdown',()=>this.elegir(i));"+
  "const show=Math.floor(i/36)===this.dexPage;"+
  "if(!show){g.setVisible(false);img.setVisible(false);zone.setVisible(false).disableInteractive();}"+
  "return{p,x,y,w:CEL-2,h:CEL-2,g,img,zone}}";
 s=s.slice(0,start)+card+s.slice(end);
 s=once(s,'elegir(i){if(i===this.foco)return;this.foco=i;',
  "elegir(i){if(i===this.foco)return;"+
  "const next=Math.floor(i/36);if(next!==this.dexPage){this.dexPage=next;"+
  "for(const [index,c] of this.casillas.entries()){"+
  "const shown=Math.floor(index/36)===next;c.g.setVisible(shown);c.img.setVisible(shown);c.zone.setVisible(shown);"+
  "if(shown)c.zone.setInteractive({useHandCursor:true});else c.zone.disableInteractive();}}"+
  "this.dexPageLabel?.setText((this.dexPage+1)+' / '+this.dexPages);this.foco=i;");
 s=once(s,
  'this.fila=0;this.time.addEvent({delay:700,loop:true,callback:()=>this.girar()});',
  "this.fila=0;"+
  "this.dexPageLabel=texto(this,114,276,(this.dexPage+1)+' / '+this.dexPages,{tam:10,color:'#c5ddf6'}).setDepth(22).setOrigin(.5);"+
  "texto(this,456,348,'GOLPES POR LEVEL',{tam:10,color:'#ffe1a1'}).setDepth(30).setOrigin(.5).setInteractive({useHandCursor:true}).on('pointerdown',()=>showKantoCampaignLearnset(this));"+
  "texto(this,35,276,'◀ ANTES',{tam:8,color:'#ffe1a1'}).setDepth(22).setInteractive({useHandCursor:true}).on('pointerdown',()=>this.elegir(Math.max(0,(this.dexPage-1)*36)));"+
  "texto(this,168,276,'PRÓX ▶',{tam:8,color:'#ffe1a1'}).setDepth(22).setInteractive({useHandCursor:true}).on('pointerdown',()=>this.elegir(Math.min(ROSTER.length-1,(this.dexPage+1)*36)));"+
  "this.time.addEvent({delay:700,loop:true,callback:()=>this.girar()});");
 // All Pokédex rendering paths must read the validated Kanto evolution
 // stages, not a second unsanitized upstream etapasDe() calculation.
 // The helper itself continues to call the original implementation.
 s=s.replaceAll('etapasDe(', 'kantoDexStages(')
  .replace('function kantoDexStages(', 'function etapasDe(')
  .replace('const stages=kantoDexStages(def);','const stages=etapasDe(def);');
 return s;
}
