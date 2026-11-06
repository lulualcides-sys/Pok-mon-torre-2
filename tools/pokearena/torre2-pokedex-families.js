/* Pokédex-only family index. Never reorder or mutate the battle ROSTER.
 * Both native Poké Arena nested evolutions and Johto/Kanto added forms belong
 * to one entry per family; each genuine form remains available in its tab.
 */
const norm=v=>String(v??'').trim().toLowerCase();
const num=v=>{const n=Number(v);return Number.isInteger(n)&&n>0?n:null};
export function buildPokedexFamilies(roster,johtoRows=[],evolutions={}){
 const dexById=new Map(),rosterByDex=new Map(),nestedOwner=new Map();
 for(const [i,p] of roster.entries()){
  const dex=num(p.dex);
  if(dex&&!rosterByDex.has(dex))rosterByDex.set(dex,i);
  if(dex&&p.id)dexById.set(norm(p.id),dex);
  if(dex&&p.nombre)dexById.set(norm(p.nombre),dex);
  for(const evo of p.evoluciones||[]){
   const child=num(evo.dex);
   if(child&&evo.nombre)dexById.set(norm(evo.nombre),child);
   if(child&&child!==dex&&!nestedOwner.has(child))nestedOwner.set(child,i);
  }
 }
 for(const row of johtoRows||[]){
  const dex=num(row[0]);if(dex&&row[1])dexById.set(norm(row[1]),dex);
 }
 const parent=new Map();
 // Official Johto family relations, including branches and baby Pokémon.
 for(const row of johtoRows||[]){
  const child=num(row[0]),before=num(row[9]);
  if(child&&before&&child!==before)parent.set(child,before);
 }
 // Kanto campaign evolution names are a supplementary relation source.
 // They do not alter Johto parent data or in-game battle progression.
 for(const [from,rules] of Object.entries(evolutions||{})){
  const before=dexById.get(norm(from));
  if(!before)continue;
  for(const rule of rules||[]){
   const child=dexById.get(norm(rule.to));
   if(child&&before!==child&&!parent.has(child))parent.set(child,before);
  }
 }
 // Native Poké Arena nested stages are authoritative when no relation exists.
 for(const [child,i] of nestedOwner){
  const before=num(roster[i].dex);
  if(before&&before!==child&&!parent.has(child))parent.set(child,before);
 }
 const rootIndexForIndex=roster.map((p,i)=>{
  let current=num(p.dex),chosen=i;
  const seen=new Set();
  while(current&&!seen.has(current)){
   seen.add(current);
   if(rosterByDex.has(current))chosen=rosterByDex.get(current);
   else if(nestedOwner.has(current))chosen=nestedOwner.get(current);
   current=parent.get(current);
  }
  return chosen;
 });
 // A descendant can be chosen as an intermediate because its ancestor is a
 // nested stage rather than a top-level ROSTER entry. Resolve to fixed point.
 for(let pass=0;pass<roster.length;pass++){
  let changed=false;
  for(let i=0;i<roster.length;i++){
   const r=rootIndexForIndex[i],next=rootIndexForIndex[r];
   if(next!==r){rootIndexForIndex[i]=next;changed=true}
  }
  if(!changed)break;
 }
 const membersByRoot=new Map();
 rootIndexForIndex.forEach((root,i)=>{
  if(!membersByRoot.has(root))membersByRoot.set(root,[]);
  membersByRoot.get(root).push(i);
 });
 const order=[...membersByRoot.keys()].sort((a,b)=>{
  const x=num(roster[a].dex)??100000+a,y=num(roster[b].dex)??100000+b;
  return x-y||a-b;
 });
 const rank=Array(roster.length),rootSet=new Set(order);
 order.forEach((root,k)=>{for(const i of membersByRoot.get(root))rank[i]=k});
 return {order,rank,rootSet,rootIndexForIndex,membersByRoot};
}
