import assert from 'node:assert/strict';
import fs from 'node:fs';
const root='../_site/arena2d/';
const version=JSON.parse(fs.readFileSync(new URL(root+'version.json',import.meta.url))).modules;
const load=name=>import(new URL(root+version+'/'+name,import.meta.url));
const [{buscar,etapaDe},{KANTO_151},{resolveLoadout},{createCampaign,resolveBattle,attemptCapture,readCampaign,saveCampaign,SAVE_KEY}]=await Promise.all([
 load('datos.js'),load('torre2/all-kanto-species.js'),load('torre2/move-pool.js'),load('torre2/campaign-core.js')]);
const data=new Map();globalThis.localStorage={getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)};
for(const p of KANTO_151){
 const {def,etapa}=buscar(p.id);const form=etapaDe(def,etapa);
 for(const key of ['hp','atk','def','vel','regen'])assert.ok(Number.isFinite(form[key]),p.id+' finite '+key);
}
const state=createCampaign('bulbasaur');saveCampaign(state);
resolveBattle(state,true,()=>0);
assert.equal(state.pendingCapture,null,'No trainer reward capture');
const count=state.inventory.pokeball;
state.pendingCapture={id:'mewtwo',level:50};
assert.equal(attemptCapture(state,()=>0).ok,false);assert.equal(state.inventory.pokeball,count);
saveCampaign(state);assert.equal(readCampaign().pendingCapture,null,'legacy capture offer safely removed');
const hp=(id,ball='pokeball')=>({id,stage:0,level:5,hpPercent:10});
state.pendingWild=hp('caterpie');state.stage=0;saveCampaign(state);
assert.equal(attemptCapture(state,()=>0,'pokeball',{duringBattle:true,hp:1,hpMax:100,hpPercent:1,status:'poison',persistentStatus:{kind:'veneno',toxic:false,turns:null,elapsed:2}}).ok,true);
assert.equal(state.inventory.pokeball,count-1);
const caught=state.team.find(m=>m.id==='caterpie');assert.equal(caught.hp,1);assert.equal(caught.status.kind,'veneno');saveCampaign(state);assert.equal(readCampaign().team.find(m=>m.uid===caught.uid).status.kind,'veneno');
for(const species of ['rattata','raticate']){
 const kit=resolveLoadout({id:species,progression:{species,level:40}});
 assert.ok(!Object.values(kit).some(h=>h.nombre==='Blizzard'),species+' no unlearned Blizzard');
}
console.log('PASS: 151 forms have finite battle stats, trainer capture rejection, legacy saves, wild inventory and coherent rat kits');
