/* Kanto-only additive Pokémon family pagination. Preserve original
 * Poké Arena evo tabs and sprite rendering, keep 6x6 cards above pedestal.
 */
const once=(src,a,b)=>{
 if(!src.includes(a))throw Error('Pokédex upstream source unexpectedly changed '+a.slice(0,75));
 return src.replace(a,b);
};
export function paginateKantoPokedexSource(original){
 let s=String(original);
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
  'import{resolveLoadout}from"../torre2/move-pool.js";');
 const sync=String.raw`function kantoDexStages(def){
 const stages=etapasDe(def);
 return stages.map((stage,i)=>{
  if(stage.mega)return stage;
  const species=(i===0?def.id:(def.evoluciones?.[i-1]?.nombre||'')).toLowerCase();
  const plan=earlyKantoSlotPlan(species)||nativeKantoEvolutionPlan(species);
  if(!plan)return stage;
  // The Pokédex documents the COMPLETE moveset of this form, not the
  // current XP of an individual Pokémon in a saved campaign.
  const member={id:species,progression:{species,level:100}};
  const equipped=resolveLoadout(member);
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
  const original=stage.kit||{};
  const kit={...original};
  for(const slot of ['lmb','rmb','q','e']){
   const h=equipped[slot];
   if(h?.nombre&&h?.forma)kit[slot]={...h};
  }
  // Show the fifth defensive action explicitly, never as a fifth attack.
  if(equipped.esp?.forma)kit.esp={...equipped.esp};
  return {...stage,...stageStats,kit};
 });
}`;
 s=once(s,'function cifras(slot,h){',sync+'function cifras(slot,h){');
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
 s=once(s,'const nx=TX+(esTactil()?52:38);',
  'const nx=TX+72;');
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
