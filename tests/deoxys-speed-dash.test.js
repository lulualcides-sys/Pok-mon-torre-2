import test from 'node:test';
import assert from 'node:assert/strict';
import {
 permitSpeedDeoxysUltimateDash,installSpeedDeoxysUltimateDash
} from '../tools/pokearena/torre2-deoxys-speed-dash.js';

function makeFighter({id='deoxys',form='SPEED DEOXYS',
 slot='e',block=true,campaign=false,ko=false,permit=null}={}){
 return {def:{id},alt:{nombre:form},ko,escena:{datos:{torre2:campaign}},
  accion:{slot,bloquea:block,permite:permit},kit:{esp:{cd:3,forma:'dash'},
   e:{cd:12,forma:'ultimate'}},cd:{esp:0,e:0},est:{}};
}
test('only Speed Deoxys may use the native ESP while ULT is blocking',()=>{
 const f=makeFighter();
 const oldKit=f.kit,oldCd=f.cd,oldAction=f.accion;
 assert.equal(permitSpeedDeoxysUltimateDash(f),true);
 assert.deepEqual(f.accion.permite,['esp']);
 assert.strictEqual(f.accion,oldAction,'no action replacement');
 assert.strictEqual(f.kit,oldKit,'never rewrite native attacks');
 assert.strictEqual(f.cd,oldCd,'never change approved cooldowns');
 assert.equal(permitSpeedDeoxysUltimateDash(f),false,'idempotent');
 assert.deepEqual(f.accion.permite,['esp']);
});
test('other forms, species and campaign never gain a dash allowance',()=>{
 for(const f of [
  makeFighter({id:'riolu'}),makeFighter({id:'lucario'}),
  makeFighter({form:'ATTACK DEOXYS'}),
  makeFighter({form:'DEFENSE DEOXYS'}),
  makeFighter({form:'DEOXYS'}),
  makeFighter({campaign:true}),makeFighter({ko:true}),
  makeFighter({slot:'rmb'}),makeFighter({slot:'lmb'}),
  makeFighter({block:false}),makeFighter({permit:'unsafe-native-field'})
 ]){
  const old=f.accion.permite;
  assert.equal(permitSpeedDeoxysUltimateDash(f),false,
   JSON.stringify({id:f.def?.id,form:f.alt?.nombre,slot:f.accion?.slot}));
  assert.strictEqual(f.accion.permite,old);
 }
 assert.equal(permitSpeedDeoxysUltimateDash(null),false);
 assert.equal(permitSpeedDeoxysUltimateDash({def:{id:'deoxys'}}),false);
});
test('preserve original action slot allowances and avoid duplicates',()=>{
 const f=makeFighter({permit:['q']});
 assert.equal(permitSpeedDeoxysUltimateDash(f),true);
 assert.deepEqual(f.accion.permite,['q','esp']);
 assert.equal(permitSpeedDeoxysUltimateDash(f),false);
 const native=makeFighter({permit:['esp']});
 assert.equal(permitSpeedDeoxysUltimateDash(native),false);
 assert.deepEqual(native.accion.permite,['esp']);
});
test('native input still honors stuns, cooldowns, and does not interrupt ULT',()=>{
 let ticks=0,executed=0;
 class Luchador{
  constructor(f){Object.assign(this,f)}
  update(dt,input={}){
   ticks++;
   if(input.esp&&this.accion?.bloquea&&
      !this.accion.permite?.includes('esp'))return false;
   if(input.esp&&(this.est.sinDash||this.est.aturdido||this.cd.esp>0))
    return false;
   if(input.esp){
    executed++;
    const action=this.accion;
    // Original native dash preserves actions with action.permite.includes(esp).
    if(!action?.permite?.includes('esp'))this.accion=null;
    return true;
   }
   return false;
  }
 }
 assert.equal(installSpeedDeoxysUltimateDash(Luchador),true);
 assert.equal(installSpeedDeoxysUltimateDash(Luchador),false);
 const sample=new Luchador(makeFighter());
 assert.equal(sample.update(.016,{esp:true}),true);
 assert.equal(ticks,1);
 assert.equal(executed,1);
 assert.equal(sample.accion.slot,'e','ULT continues after dash');
 assert.equal(sample.cd.esp,0);
 assert.equal(sample.cd.e,0);
 const form=new Luchador(makeFighter({form:'ATTACK DEOXYS'}));
 assert.equal(form.update(.016,{esp:true}),false);
 const campaign=new Luchador(makeFighter({campaign:true}));
 assert.equal(campaign.update(.016,{esp:true}),false);
 const status=new Luchador(makeFighter());
 status.est.sinDash=true;
 assert.equal(status.update(.016,{esp:true}),false);
 status.est.sinDash=false;status.cd.esp=5;
 assert.equal(status.update(.016,{esp:true}),false);
 assert.equal(executed,1,'No bypass of native cooldown or stun checks');
});
test('fail closed when native update hook contract is unknown',()=>{
 assert.throws(()=>installSpeedDeoxysUltimateDash(class Luchador{}),
  /recognized native fighter\.update/);
});
test('build-preview installs module in Phaser without campaign mutations',async()=>{
 const fs=await import('node:fs/promises');
 const s=await fs.readFile(new URL('../tools/pokearena/build-preview.mjs',import.meta.url),'utf8');
 assert.ok(s.includes("['tools/pokearena/torre2-deoxys-speed-dash.js','deoxys-speed-dash.js']"));
 assert.ok(s.includes('installSpeedDeoxysUltimateDash(Luchador)'));
 assert.ok(s.includes('installArenaMovePolicy(Luchador,__torre2ArenaRoster'));
 const module=await fs.readFile(new URL('../tools/pokearena/torre2-deoxys-speed-dash.js',import.meta.url),'utf8');
 assert.ok(module.includes('fighter.escena?.datos?.torre2'));
 assert.ok(!module.includes('saveState'),'No save editing');
});
