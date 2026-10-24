import{COLOR,texto,estiloFuente,MOVIL}from"../config.js";import{ROSTER,TIPOS,RANURAS,ROLES,REGLAS,etapaDe}from"../datos.js";import{describir}from"../guia.js";import{earlyKantoSlotPlan,nativeKantoEvolutionPlan}from"../torre2/early-kanto-species.js";import{resolveLoadout,moveUnlockLevel,canonicalMoveKey,TEST_LIBRARY,campaignLearnset}from"../torre2/move-pool.js";import{frlgMachineCompatible}from"../torre2/frlg-learnsets.js";import{kanto151SlotPlan}from"../torre2/all-kanto-species.js";import{sfx}from"../sonido.js";import{esTactil}from"../tactil.js";import{cabecera,capsulas,leerMando,teclas,escalaFicha,marco}from"../ui.js";import{atacarEnMenu,cargarPMD,crearAnimsPMD,soloFormas}from"../sprites.js";const COLS=6,CEL=36,GX=10,GY=36;const PX=236,PW=396,PY=32,PH=322;const TX=PX+8,TW=PW-16;const STATS=[["HP","hp",120*REGLAS.vidaGlobal,COLOR.vida],["SPD","vel",180,4892927],["ATK","atk",1.4,16743002],["DEF","def",1.4,16303176]];const BOTON_TACTIL={lmb:"ATK",rmb:"HAB 2",esp:"ESQUIVA",q:"HAB 3",e:"ULT"};const EFECTOS=[["quema","BURN"],["aturde","STUN"],["aturdeFinal","STUN"],["duerme","SLEEP"],["confunde","CONFUSE"],["ralentiza","SLOW"],["frena","SLOW"],["drenaje","DRAIN"],["roba","LIFESTEAL"],["cura","HEAL"],["escudo","SHIELD"],["blindaje","ARMORED"],["debilita","WEAKEN"],["disipa","DISPEL"],["recoil","SELF-DMG"],["teledirigido","HOMING"]];const num=v=>String(+(+v).toFixed(2));function etapasDe(def){const evos=def.evoluciones??[];const mezclar=(...capas)=>Object.fromEntries(Object.entries(def.kit).map(([k,v])=>[k,Object.assign({},v,...capas.map(c=>c?.[k]??{}))]));const lista=[def,...evos].map((_,i)=>{const f=etapaDe(def,i);const powerUp=i>0&&f.dex===etapaDe(def,i-1).dex;const nPower=[def,...evos].filter((_2,j)=>j>0&&etapaDe(def,j).dex===etapaDe(def,j-1).dex).length;return{etiqueta:powerUp?nPower>1?`POWER UP ${i}`:"POWER UP":f.nombre,nombre:f.nombre,dex:f.dex,tipos:f.tipos,rol:f.rol??def.rol,hp:Math.round(f.hp*REGLAS.vidaGlobal),vel:f.vel,atk:f.atk,def:f.def,kit:i?mezclar(f.kit):def.kit,powerUp}});const ultima=evos.at(-1),mega=ultima?.mega;if(mega){const base=lista.at(-1);lista.push({...base,etiqueta:mega.nombre.split(" ")[0],nombre:mega.nombre,dex:mega.dex,tipos:mega.tipos??base.tipos,atk:base.atk+(mega.atk??0),def:base.def+(mega.def??0),vel:base.vel+(mega.vel??0),kit:mezclar(ultima.kit,mega.kit),mega:true})}return lista}function kantoDexStages(def){
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
}function showKantoCampaignLearnset(scene){
 if(scene.__kantoMovesOverlay){scene.__kantoMovesOverlay.close();return;}
 const def=ROSTER[scene.foco],i=scene.etapa||0;
 const id=String(i===0?def.id:(def.evoluciones?.[i-1]?.nombre||def.id)).toLowerCase();
 const moves=campaignLearnset(id),items=[];
 let page=0;
 const add=o=>{o.setDepth(2600);items.push(o);return o};
 const close=()=>{for(const o of items.splice(0))o.destroy();scene.__kantoMovesOverlay=null};
 scene.__kantoMovesOverlay={close};
 const render=()=>{
  for(const o of items.splice(0))o.destroy();
  add(scene.add.rectangle(320,180,632,350,0x061426,.99)
   .setStrokeStyle(2,0x94bad8).setInteractive());
  add(texto(scene,28,14,'KANTO · GOLPES POR LEVEL',{tam:14,color:'#ffe5aa'}));
  add(texto(scene,28,37,id.toUpperCase()+' · '+moves.length+' GOLPES INSTALADOS',
   {tam:10,color:'#b8d9ef'}));
  add(texto(scene,28,57,'ATK · HAB 2 · HAB 3 · ULT · ESQUIVA',
   {tam:9,color:'#7de5b1'}));
  add(texto(scene,549,18,'FECHAR X',{tam:10,color:'#ffffff'})
   .setInteractive({useHandCursor:true}).on('pointerdown',close));
  moves.slice(page*18,page*18+18).forEach((m,j)=>{
   const x=28+Math.floor(j/9)*302,y=82+(j%9)*25;
   const prefix=m.level===null?'TM     ':'NV '+String(m.level).padStart(2,'0');
   add(texto(scene,x,y,prefix+'  '+m.name.toUpperCase().slice(0,22),
    {tam:9,color:m.method==='TM'?'#ffe1a0':'#e0f2ff'}));
   add(texto(scene,x,y+12,String(m.type||'').toUpperCase()+
    (m.level===null?' · ENSINAR TM':' · DESBLOQUEIA POR LV'),
    {tam:7,color:'#8faec7'}));
  });
  if(!moves.length)add(texto(scene,28,110,'SEM GOLPE INSTALADO PARA ESTA FORMA',
   {tam:10,color:'#d5c0a6'}));
  const total=Math.max(1,Math.ceil(moves.length/18));
  add(texto(scene,292,322,(page+1)+' / '+total,{tam:10,color:'#ffe2ab'}));
  if(page>0)add(texto(scene,28,322,'◀ ANTERIOR',{tam:10,color:'#cce9ff'})
   .setInteractive({useHandCursor:true}).on('pointerdown',()=>{page--;render()}));
  if(page+1<total)add(texto(scene,490,322,'PRÓXIMO ▶',{tam:10,color:'#cce9ff'})
   .setInteractive({useHandCursor:true}).on('pointerdown',()=>{page++;render()}));
 };
 render();
}
function cifras(slot,h){const out=slot==="e"?["ULT"]:[];if(h.torre2Unavailable)out.push("INATIVO");else if(h.torre2RequiresTM)out.push("ENSINAR TM");else if(Number.isInteger(h.torre2UnlockLevel))out.push("DESBLOQUEIA LV "+h.torre2UnlockLevel);if(h.pendiente&&h.torre2UnlockEvolution)out.push("EVOLVE "+h.torre2UnlockEvolution);const veces=h.golpes>1?h.golpes:h.rafaga>1?h.rafaga:0;if(h.dano)out.push(veces?`${veces}x${num(h.dano)} DMG`:`${num(h.dano)} DMG`);if(h.combo>1)out.push(`COMBO x${h.combo}`);if(slot!=="e"&&h.coste)out.push(`${h.coste} ENERGY`);if((slot==="rmb"||slot==="esp"||slot==="q")&&h.cd)out.push(`COOLDOWN ${num(h.cd)} S`);for(const[k,et]of EFECTOS)if(h[k]&&!out.includes(et))out.push(et);return out.join(" · ")}class Pokedex extends Phaser.Scene{constructor(){super("pokedex")}init(datos){this.foco=Math.max(0,ROSTER.findIndex(p=>p.id===datos?.id));this.etapa=0}preload(){const m=this.registry.get("manifiesto");this._torre2DexForms=soloFormas(m,new Set(ROSTER.map(p=>p.dex)));cargarPMD(this,this._torre2DexForms,["Idle"]);}create(){crearAnimsPMD(this,this._torre2DexForms,["Idle"]);this.manifiesto=this.registry.get("manifiesto");cabecera(this,"POKÉDEX",`${ROSTER.length} POKÉMON`);this.dexPage=Math.floor(this.foco/36);this.dexPages=Math.ceil(ROSTER.length/36);this.casillas=ROSTER.map((p,i)=>this.casilla(p,GX+(i%36)%COLS*CEL,GY+Math.floor((i%36)/COLS)*CEL,i));this.marco=this.add.graphics().setDepth(5);const g=this.add.graphics();marco(g,PX,PY,PW,PH,"panel",{alfa:.94});this.peanaX=GX+(COLS*CEL-2)/2;this.peanaY=322;g.fillStyle(1718892,1);g.fillEllipse(this.peanaX,this.peanaY+2,96,18);g.fillStyle(2774676,1);g.fillEllipse(this.peanaX,this.peanaY,84,13);this.lema=texto(this,this.peanaX,340,"",{tam:8,color:"#8fb3e6"}).setOrigin(.5,0).setDepth(6);this.fila=0;this.dexPageLabel=texto(this,114,276,(this.dexPage+1)+' / '+this.dexPages,{tam:10,color:'#c5ddf6'}).setDepth(22).setOrigin(.5);texto(this,456,348,'GOLPES POR LEVEL',{tam:10,color:'#ffe1a1'}).setDepth(30).setOrigin(.5).setInteractive({useHandCursor:true}).on('pointerdown',()=>showKantoCampaignLearnset(this));texto(this,35,276,'◀ ANTES',{tam:8,color:'#ffe1a1'}).setDepth(22).setInteractive({useHandCursor:true}).on('pointerdown',()=>this.elegir(Math.max(0,(this.dexPage-1)*36)));texto(this,168,276,'PRÓX ▶',{tam:8,color:'#ffe1a1'}).setDepth(22).setInteractive({useHandCursor:true}).on('pointerdown',()=>this.elegir(Math.min(ROSTER.length-1,(this.dexPage+1)*36)));this.time.addEvent({delay:700,loop:true,callback:()=>this.girar()});const izq=()=>this.mover(-1),der=()=>this.mover(1),arr=()=>this.mover(-COLS),aba=()=>this.mover(COLS);teclas(this,{LEFT:izq,A:izq,RIGHT:der,D:der,UP:arr,W:arr,DOWN:aba,S:aba,Q:()=>this.cambiarEtapa(-1),E:()=>this.cambiarEtapa(1),TAB:()=>this.cambiarEtapa(1)});this.refrescar()}casilla(p,x,y,i){const g=this.add.graphics();g.fillStyle(0,1);g.fillRect(x,y,CEL-2,CEL-2);const ancho=(CEL-2)/p.tipos.length;p.tipos.forEach((t,k)=>{g.fillStyle(TIPOS[t],1);g.fillRect(x+k*ancho,y+CEL-4,ancho,2)});const img=this.add.image(x+1,y+1,'retrato-'+p.dex).setOrigin(0).setDisplaySize(CEL-4,CEL-4);const zone=this.add.zone(x+(CEL-2)/2,y+(CEL-2)/2,CEL-2,CEL-2).setInteractive({useHandCursor:true}).on('pointerdown',()=>this.elegir(i));const show=Math.floor(i/36)===this.dexPage;if(!show){g.setVisible(false);img.setVisible(false);zone.setVisible(false).disableInteractive();}return{p,x,y,w:CEL-2,h:CEL-2,g,img,zone}}elegir(i){if(i===this.foco)return;const next=Math.floor(i/36);if(next!==this.dexPage){this.dexPage=next;for(const [index,c] of this.casillas.entries()){const shown=Math.floor(index/36)===next;c.g.setVisible(shown);c.img.setVisible(shown);c.zone.setVisible(shown);if(shown)c.zone.setInteractive({useHandCursor:true});else c.zone.disableInteractive();}}this.dexPageLabel?.setText((this.dexPage+1)+' / '+this.dexPages);this.foco=i;this.etapa=0;sfx("seleccion");this.refrescar()}mover(d){const n=ROSTER.length;let f=this.foco+d;if(Math.abs(d)>1)f=f<0?f+Math.ceil(n/COLS)*COLS:f>=n?f%COLS:f;this.elegir(Math.min(n-1,(f+n)%n))}cambiarEtapa(d){const n=this.etapas.length;if(n<2)return;this.irEtapa((this.etapa+d+n)%n)}irEtapa(i){if(i===this.etapa)return;const e=kantoDexStages(ROSTER[this.foco])[i];if(!e)return;const m=this.registry.get("manifiesto"),forms=soloFormas(m,new Set([e.dex]));if(forms[e.dex]&&!this.anims.exists(`${e.dex}-Idle-0`)){const waiting=cargarPMD(this,forms,["Idle"]);if(waiting){this.load.once("complete",()=>{if(!this.scene.isActive())return;crearAnimsPMD(this,forms,["Idle"]);this.irEtapa(i)});if(!this.load.isLoading())this.load.start();return;}crearAnimsPMD(this,forms,["Idle"]);}this.etapa=i;this.etapas=kantoDexStages(ROSTER[this.foco]);sfx("confirmar");this.refrescar(true)}girar(){const s=this.sprite;if(!s?.active||this.atacando)return;this.fila=(this.fila+1)%8;const clave=`${s.dex}-Idle-${this.fila}`;if(this.anims.exists(clave))s.play(clave)}refrescar(celebrar=false){const p=ROSTER[this.foco];this.etapas=kantoDexStages(p);const et=this.etapas[this.etapa];const c=this.casillas[this.foco];this.marco.clear();this.marco.lineStyle(2,16777215,1);this.marco.strokeRect(c.x-1,c.y-1,c.w+2,c.h+2);this.lema.setText(p.lema??"");this.peana(et,celebrar);this.ficha(p,et)}peana(et,celebrar){this.sprite?.destroy();const m=this.manifiesto[et.dex];if(!m)return;const zoom=escalaFicha(m,64);const s=this.add.sprite(this.peanaX,this.peanaY-(m.feet??5)*zoom,`pmd-${et.dex}-Idle`).setScale(zoom).setDepth(4);s.dex=et.dex;s.play(`${et.dex}-Idle-${this.fila}`);this.sprite=s;this.atacando=false;if(celebrar&&m.anims.Attack){this.atacando=true;atacarEnMenu(this,s,et.dex,2,this.fila,()=>{this.atacando=false})}}ficha(p,et){this.contenido?.destroy(true);const c=this.add.container(0,0).setDepth(3);this.contenido=c;let x=TX;this.pestanas=this.etapas.map((e,i)=>{const t=texto(this,x+5,PY+6,e.etiqueta,{tam:8,color:i===this.etapa?"#000000":"#ffffff"});const w=t.width+10,g=this.add.graphics();marco(g,x,PY+3,w,14,i===this.etapa?"oro":"azul");const z=this.add.zone(x+w/2,PY+10,w,14).setInteractive({useHandCursor:true}).on("pointerdown",()=>this.irEtapa(i));c.add([g,t,z]);const r={x:x+w/2,y:PY+10};x+=w+4;return r});c.add(texto(this,TX,PY+24,et.nombre,{tam:16}).setShadow(1,1,"#000000",0,true,true));c.add(texto(this,PX+PW-8,PY+28,`Nº ${et.dex.slice(0,4)}`,{tam:8,color:"#4a6a9c"}).setOrigin(1,0));const caps=capsulas(this,TX+1,PY+45,et.tipos);c.add(caps);let rx=caps.length?caps.at(-1).x+caps.at(-1).width+10:TX;const R=ROLES[et.rol];if(R){const t=texto(this,rx+3,PY+46,R.nombre,{tam:8,color:"#000000"});const g=this.add.graphics();g.fillStyle(0,1);g.fillRect(rx-1,PY+44,t.width+8,12);g.fillStyle(R.color,1);g.fillRect(rx,PY+45,t.width+6,10);c.add([g,t])}STATS.forEach(([nom,campo,max,col],k)=>{const sx=TX+k%2*196,sy=PY+61+Math.floor(k/2)*10;c.add(texto(this,sx,sy,nom,{tam:8,color:"#8fb3e6"}));const b=this.add.graphics();b.fillStyle(0,1);b.fillRect(sx+32,sy+1,102,6);b.fillStyle(2250391,1);b.fillRect(sx+33,sy+2,100,4);b.fillStyle(col,1);b.fillRect(sx+33,sy+2,Math.round(100*Math.min(1,et[campo]/max)),4);c.add(b);c.add(texto(this,sx+140,sy,campo==="hp"||campo==="vel"?String(Math.round(et[campo])):et[campo].toFixed(2),{tam:8}))});const evos=p.evoluciones??[];const info=et.mega?"ACTIVATES IN BATTLE WITH A FULL ULT":this.etapa<evos.length?evos[this.etapa].dex===etapaDe(p,this.etapa).dex?"POWERS UP IN BATTLE WHEN EXP IS FULL":`EVOLVES INTO ${evos[this.etapa].nombre} WHEN EXP IS FULL`:evos.length?"FINAL FORM":"DOES NOT EVOLVE";c.add(texto(this,TX,PY+83,info,{tam:8,color:"#7dd3fc"}));for(const tam of MOVIL.activo?[8,7,6.5]:[8]){this.movs?.destroy(true);this.movs=this.add.container(0,0);c.add(this.movs);this.finFicha=this.movimientos(this.movs,p,et,tam);if(this.finFicha<=PY+PH-4)break}}movimientos(c,p,et,tam){let y=PY+95;const nx=TX+72;RANURAS.forEach(({slot,tecla},k)=>{const h=et.kit[slot],y0=y;const fondo=this.add.graphics();c.add(fondo);c.add(texto(this,TX+6,y+3,BOTON_TACTIL[slot],{tam:8,color:"#f8c448"}));c.add(texto(this,nx,y+3,h.nombre,{tam:8}));const tipo=texto(this,0,0,h.tipo,{tam:8});const tw=tipo.width+6;const gt=this.add.graphics();gt.fillStyle(TIPOS[h.tipo]??5592422,1);gt.fillRect(PX+PW-10-tw,y+2,tw,10);tipo.setPosition(PX+PW-7-tw,y+3).setShadow(1,1,"#000000",0,true,true);c.add([gt,tipo]);const desc=this.add.text(TX+6,y+13,describir(p.id,h.nombre),estiloFuente(tam,{color:"#c9c2e6",lineSpacing:0})).setWordWrapWidth(TW-10,true);c.add(desc);const fin=this.add.text(TX+6,desc.y+desc.height+1,cifras(slot,h),estiloFuente(tam,{color:"#a68a4a",lineSpacing:0})).setWordWrapWidth(TW-10,true);c.add(fin);y=fin.y+fin.height+2;fondo.fillStyle(k%2?1190482:1321295,1);fondo.fillRect(TX,y0,TW,y-y0-2);fondo.fillStyle(TIPOS[h.tipo]??5592422,1);fondo.fillRect(TX,y0,2,y-y0-2)});return y}update(){leerMando(this,b=>{if(b==="izq")this.mover(-1);else if(b==="der")this.mover(1);else if(b==="arr")this.mover(-COLS);else if(b==="aba")this.mover(COLS);else if(b==="lb"||b==="x")this.cambiarEtapa(-1);else if(b==="rb"||b==="y"||b==="a")this.cambiarEtapa(1)})}}export{Pokedex,cifras,etapasDe};
