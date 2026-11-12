import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {installRaichuElectroBall0700,upgradeRaichuElectroKit,
 RAICHU_ELECTRO_FORM,RAICHU_ELECTRO_RULES,sweptElectroContact,
 raichuElectroBall0700} from '../tools/pokearena/torre2-raichu-electro-ball-0700.js';
const oldKit=()=>({lmb:{nombre:'Thunder Shock'},rmb:{
 nombre:'Electro Ball',forma:'proyectil',dano:14.5,cd:6,hoja:'electroball'},
 esp:{nombre:'Volt Tackle'},e:{nombre:'Thunder'}});
const fighter=(form='RAICHU',campaign=false)=>({etapa:2,forma:{nombre:form},
 def:{id:'pichu'},escena:{datos:{torre2:campaign}}});
test('0.70.0 backport adds real triple-hit phase only to older Raichu Arena kit',()=>{
 const f=fighter(),native=oldKit(),result=upgradeRaichuElectroKit(f,native);
 assert.notStrictEqual(result,native);
 assert.equal(result.rmb.forma,RAICHU_ELECTRO_FORM);
 assert.equal(result.rmb.golpes,3);
 assert.equal(result.rmb.cada,.1);
 assert.equal(result.rmb.final.dano,9);
 assert.equal(result.rmb.rayito.dano,2);
 assert.equal(result.rmb.cd,4);
 assert.strictEqual(result.lmb,native.lmb);
 assert.strictEqual(result.e,native.e);
 assert.equal(native.rmb.forma,'proyectil','native asset/kit stays immutable');
});
test('new official 0.70 native, other Pokemon and campaign are never overwritten',()=>{
 const native=oldKit(),official={...native,rmb:{nombre:'Electro Ball',forma:'bolaSombra'}};
 assert.strictEqual(upgradeRaichuElectroKit(fighter(),official),official);
 assert.strictEqual(upgradeRaichuElectroKit(fighter('PIKACHU'),native),native);
 assert.strictEqual(upgradeRaichuElectroKit(fighter('RAICHU',true),native),native);
 assert.strictEqual(upgradeRaichuElectroKit({...fighter(),etapa:0},native),native);
 assert.strictEqual(upgradeRaichuElectroKit(fighter(),null),null);
});
test('native kitActual hook is reversible by branch and idempotent',()=>{
 class Luchador{kitActual(){return this._kit}}
 assert.equal(installRaichuElectroBall0700(Luchador),true);
 assert.equal(installRaichuElectroBall0700(Luchador),false);
 const a=Object.assign(new Luchador(),fighter(),{_kit:oldKit()});
 assert.equal(a.kitActual().rmb.forma,RAICHU_ELECTRO_FORM);
 const b=Object.assign(new Luchador(),fighter('PIKACHU'),{_kit:oldKit()});
 assert.strictEqual(b.kitActual(),b._kit);
 assert.throws(()=>installRaichuElectroBall0700(class Bad{}),/kitActual/);
});
test('swept contact catches fast projectiles and excludes KO/far targets',()=>{
 const a={x:0,y:-18},b={x:200,y:-18},target={x:90,y:0,alto:36,ko:false};
 assert.equal(sweptElectroContact(a,b,target,9),true);
 assert.equal(sweptElectroContact(a,b,{...target,y:90},9),false);
 assert.equal(sweptElectroContact(a,b,{...target,ko:true},9),false);
});
function scenario({targetX=115,targetY=0,hit=true,koAt=0}={}){
 const draw={clear(){return this},fillStyle(){return this},fillRect(){return this},
  setDepth(){return this},destroy(){this.destroyed=true}};
 const scene={datos:{torre2:false},efectos:[],add:{graphics:()=>draw}};
 let events=0;
 const target={x:targetX,y:targetY,alto:36,hp:100,ko:false,
  recibir(_actor,attack){events++;if(!hit)return 'miss';
   this.hp=Math.max(0,this.hp-attack.dano);
   if(koAt&&events>=koAt)this.ko=true;
   return 'golpe';
  }};
 const actor={x:0,y:0,alto:36,t:20,ko:false,escena:scene,rival:target,
  animar(){this.animated=true}};
 const h={...RAICHU_ELECTRO_RULES,carga:.55,vel:380,alcance:300,
  radio:9,golpes:3,cada:.1,dano:3.5,final:{dano:9,empuje:120},
  rayito:{dano:2,aturde:.5}};
 const fx=raichuElectroBall0700(actor,h,{slot:'rmb'});
 for(let i=0;i<160&&!draw.destroyed;i++)fx.update(.016);
 return {events,hp:target.hp,destroyed:draw.destroyed,scene,actor,fx};
}
test('Phaser Graphics path delivers 3 contact pulses, finisher and spark',()=>{
 const r=scenario();
 assert.equal(r.events,5,'three pulses, finishing strike and contact-gated spark');
 assert.ok(Math.abs(r.hp-78.5)<.000001);
 assert.equal(r.destroyed,true);
 assert.equal(r.scene.efectos.length,1);
 assert.equal(r.actor.animated,true);
 assert.equal(r.actor.accion.bloquea,true);
});
test('miss, invalid contact and KO never fabricate damage/extra hits',()=>{
 const far=scenario({targetX:400});
 assert.equal(far.events,0);
 assert.equal(far.hp,100);
 assert.equal(far.destroyed,true);
 const missed=scenario({hit:false});
 assert.equal(missed.hp,100);
 assert.equal(missed.events,3,'no finisher or spark without landed hit');
 const ko=scenario({koAt:1});
 assert.equal(ko.events,1,'stop on KO');
});
test('build actually wires adapter after approved policy and original Phaser FX',async()=>{
 const build=await readFile(new URL('../tools/pokearena/build-preview.mjs',import.meta.url),'utf8');
 const forms=await readFile(new URL('../tools/pokearena/torre2-signature-fx.js',import.meta.url),'utf8');
 assert.ok(build.includes("['tools/pokearena/torre2-raichu-electro-ball-0700.js','raichu-electro-ball-0700.js']"));
 assert.ok(build.includes('installRaichuElectroBall0700(Luchador)'));
 assert.ok(build.indexOf('installArenaMovePolicy(Luchador')<build.indexOf('installRaichuElectroBall0700(Luchador)'));
 assert.ok(forms.includes('...RAICHU_0700_FORMS'));
 assert.ok(!build.includes('approvedAlpha="0.70.0"'));
});
