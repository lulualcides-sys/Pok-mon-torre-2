/* Pokémon Torre 2 — read-only Kanto collection presentation.
 * PC filters use original box indices; no save data or battle state changes.
 * The Kanto Dex's display names are not necessarily the species save IDs.
 */
export const PC_FILTERS=Object.freeze(['ALL','SHINY','KO','STATUS']);
const STATUS_TAGS=Object.freeze({
 veneno:'VEN',toxico:'TOX',paralizado:'PAR',dormido:'SON',
 quemado:'QUE',congelado:'CON'
});
const clamp=(n,min,max)=>Math.max(min,Math.min(max,Number.isFinite(Number(n))?Number(n):min));

export function kantoDexSpeciesId(name){
 const label=String(name??'').trim().toLowerCase();
 if(label==='nidoran♀'||label==='nidoran-f'||label==='nidoran female')
  return 'nidoran-f';
 if(label==='nidoran♂'||label==='nidoran-m'||label==='nidoran male')
  return 'nidoran-m';
 if(['mrmime','mr-mime','mr. mime','mr mime','mr.mime'].includes(label))
  return 'mr-mime';
 if(["farfetchd","farfetch'd","farfetch’d"].includes(label))
  return 'farfetchd';
 return label.replace(/\s+/g,'-');
}

function idSet(items){
 return new Set(Array.isArray(items)?items.map(kantoDexSpeciesId).filter(Boolean):[]);
}
export function kantoDexPageModel(state,dex,supported=[],requestedPage=0,pageSize=22){
 const entries=Array.isArray(dex)?dex.map((name,index)=>({
  index,name,id:kantoDexSpeciesId(name)
 })):[];
 const allowed=new Set(entries.map(x=>x.id));
 const onlyKanto=items=>new Set([...idSet(items)].filter(id=>allowed.has(id)));
 const caught=onlyKanto(state?.dexCaught);
 const seen=onlyKanto(state?.dexSeen);
 const shinyCaught=onlyKanto(state?.dexShinyCaught);
 const shinySeen=onlyKanto(state?.dexShinySeen);
 for(const id of caught)seen.add(id);
 for(const id of shinySeen)seen.add(id);
 for(const id of shinyCaught){seen.add(id);shinySeen.add(id)}
 const available=idSet(supported);
 const safeSize=Math.max(1,Math.floor(Number(pageSize)||22));
 const pages=Math.max(1,Math.ceil(entries.length/safeSize));
 const page=Math.floor(clamp(requestedPage,0,pages-1));
 const rows=entries.slice(page*safeSize,(page+1)*safeSize).map(entry=>({
  ...entry,ready:available.has(entry.id),seen:seen.has(entry.id),
  caught:caught.has(entry.id),shinySeen:shinySeen.has(entry.id),
  shinyCaught:shinyCaught.has(entry.id)
 }));
 return{page,pages,rows,totals:{seen:seen.size,caught:caught.size,
  shinySeen:shinySeen.size,shinyCaught:shinyCaught.size,all:entries.length}};
}

export function pcCondition(member){
 const hp=clamp(member?.hp,0,100);
 const raw=String(member?.status?.kind||'').toLowerCase();
 const status=STATUS_TAGS[raw]||(raw?raw.slice(0,3).toUpperCase():'');
 const confused=!!member?.confusion;
 return{hp,ko:hp<=0,status:status||(confused?'CONF':''),shiny:member?.shiny===true};
}
export function pcMemberLabel(member,{active=false,selected=false}={}){
 const condition=pcCondition(member);
 const level=Number.isFinite(member?.progression?.level)?member.progression.level:'?';
 const id=String(member?.id||'DESCONHECIDO').toUpperCase();
 const state=condition.ko?'KO':Math.round(condition.hp)+'%';
 return(active?'◆ ':'')+id+' NV.'+level+' · '+state+
  (condition.status?' '+condition.status:'')+
  (condition.shiny?' ✦':'')+(selected?' ✓':'');
}
export function pcPageModel(state,requestedPage=0,requestedFilter='ALL',pageSize=6){
 const box=Array.isArray(state?.box)?state.box:[];
 const filter=PC_FILTERS.includes(requestedFilter)?requestedFilter:'ALL';
 const rows=box.map((member,actualIndex)=>({member,actualIndex,condition:pcCondition(member)}));
 const selected=rows.filter(row=>filter==='ALL'||
  (filter==='SHINY'&&row.condition.shiny)||
  (filter==='KO'&&row.condition.ko)||
  (filter==='STATUS'&&!!row.condition.status));
 const safeSize=Math.max(1,Math.floor(Number(pageSize)||6));
 const pages=Math.max(1,Math.ceil(selected.length/safeSize));
 const page=Math.floor(clamp(requestedPage,0,pages-1));
 return{filter,page,pages,total:box.length,matched:selected.length,
  shiny:rows.filter(row=>row.condition.shiny).length,
  rows:selected.slice(page*safeSize,(page+1)*safeSize)};
}
