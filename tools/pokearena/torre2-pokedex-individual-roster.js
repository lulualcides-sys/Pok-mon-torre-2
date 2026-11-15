/* One national species per Pokédex card. READ-ONLY view: battle roster,
 * Ditto transformations, evolution logic and save IDs remain unchanged. */
const asDex=v=>String(v??'').padStart(4,'0');
const realDex=v=>/^\d{4}$/.test(String(v??''));
const copyMoveKit=kit=>Object.fromEntries(Object.entries(kit||{}).map(([slot,h])=>
 [slot,h?{...h}:h]));
export function buildIndividualDexRoster(native,resolveStages,vidaGlobal=1){
 if(!Array.isArray(native)||typeof resolveStages!=='function'||!(vidaGlobal>0))
  throw Error('Invalid Pokédex native roster arguments');
 const own=new Set(native.map(p=>p.dex).filter(realDex));
 const result=[],seen=new Set();
 function push(p){
  if(!realDex(p.dex)||seen.has(p.dex))return;
  if(!p.kit||typeof p.kit!=='object')
   throw Error('Missing native move data for '+p.dex);
  seen.add(p.dex);result.push(p);
 }
 const sameDexPower=(p,start=0)=> {
  const anchor=start?String(p.evoluciones?.[start-1]?.dex):p.dex;
  const out=[];
  for(let i=start;i<(p.evoluciones?.length??0);i++){
   const e=p.evoluciones[i];
   if(e.dex!==anchor)break;
   out.push({...e,kit:copyMoveKit(e.kit)});
  }
  return out;
 };
 for(const p of native){
  if(p.id==='lago'&&p.dex==='0481'&&p.trio?.length===2){
   const forms=[...p.trio,{dex:p.dex,nombre:'MESPRIT'}]
    .sort((a,b)=>Number(a.dex)-Number(b.dex));
   if(forms.map(x=>x.dex).join(',')!=='0480,0481,0482')
    throw Error('Unrecognized Lake Guardians roster');
   for(const f of forms)push({...p,id:'dex-'+f.dex,
    dex:f.dex,nombre:f.nombre,kit:copyMoveKit(p.kit),
    evoluciones:sameDexPower(p).map(e=>({...e,dex:f.dex,nombre:f.nombre})),
    trio:null,formasAlt:[],torre2DexOnly:true,torre2DexOriginId:p.id,
    torre2DexNext:null});
   continue;
  }
  const next=p.evoluciones?.find(e=>e.dex!==p.dex);
  push({...p,kit:copyMoveKit(p.kit),
   evoluciones:sameDexPower(p),
   torre2DexNext:next?.nombre??null,
   torre2DexOriginId:p.id});
 }
 // Hidden native evolutions without their own battle slot receive separate
 // encyclopedia cards. Source moves are inherited from their exact native
 // evolution stage, including its approved kit overrides.
 for(const p of native){
  if(p.id==='lago')continue;
  const stages=resolveStages(p),evos=p.evoluciones||[];
  if(stages.length<evos.length+1)throw Error('Missing native evolution stages '+p.id);
  for(let i=0;i<evos.length;i++){
   const e=evos[i],stage=stages[i+1];
   if(!realDex(e.dex)||own.has(e.dex)||seen.has(e.dex))continue;
   if(stage.dex!==e.dex||!stage.kit||typeof stage.kit!=='object')
    throw Error('Unrecognized native evolution kit '+p.id+'/'+e.dex);
   const next=evos.slice(i+1).find(x=>x.dex!==e.dex);
   const clone={...p,id:'dex-'+e.dex,dex:e.dex,
    nombre:stage.nombre,kit:copyMoveKit(stage.kit),
    hp:stage.hp/vidaGlobal,vel:stage.vel,atk:stage.atk,def:stage.def,
    tipos:stage.tipos,rol:stage.rol||p.rol,regen:e.regen??p.regen,
    formasAlt:[],trio:null,evoluciones:sameDexPower(p,i+1),
    torre2DexOnly:true,torre2DexOriginId:p.id,
    torre2DexNext:next?.nombre??null};
   push(clone);
  }
 }
 result.sort((a,b)=>Number(a.dex)-Number(b.dex)||a.nombre.localeCompare(b.nombre));
 if(result.length!==seen.size)throw Error('Duplicate Pokédex card');
 for(const id of ['0152','0153','0154','0480','0481','0482','0128','0132']){
  if(!seen.has(id))throw Error('Missing required independent Pokédex card '+id);
 }
 return result;
}
