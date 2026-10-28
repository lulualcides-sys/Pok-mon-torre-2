import test from 'node:test';
import assert from 'node:assert/strict';
import {installLaboratoryControls} from '../tools/pokearena/torre2-laboratory.js';
const actor=()=>({hp:100,hpMax:100,ko:false,est:{}});
const stub=()=>({
 setStrokeStyle(){return this},setDepth(){return this},setInteractive(){return this},
 setOrigin(){return this},setText(){return this},on(){return this},destroy(){return this}
});
const scene=()=>({
 datos:{torre2:{laboratory:true,weather:'none'}},fase:'lucha',
 add:{rectangle:stub,text:stub},events:{once(){}},
 luchadores:[actor(),actor()],
 scene:{start(){}}
});
test('real laboratory always initializes original native damage accounting',()=>{
 const s=scene();
 installLaboratoryControls(s);
 assert.equal(s.__torre2LabInstalled,true);
 assert.deepEqual(s.registroDano,[]);
 assert.equal(s.comboActual,0);
 assert.equal(s.mejorCombo,0);
 assert.equal(s.ultimoGolpeEntreno,-Infinity);
 assert.equal(s.ultimoDano,0);
 // Native Combate.anotarEntreno will now be able to push a genuine hit.
 s.registroDano.push({t:8,d:12});s.comboActual=1;
 installLaboratoryControls(s);
 assert.equal(s.registroDano.length,1,'No duplicate init within one lab match');
 s.__torre2LabInstalled=false;
 installLaboratoryControls(s);
 assert.deepEqual(s.registroDano,[],'A new lab fight starts with a fresh ledger');
 assert.equal(s.comboActual,0);
});
test('normal campaign and Arena battles never receive laboratory bookkeeping',()=>{
 for(const data of [{torre2:{kind:'trainer'}},{modo:'cpu'},{torre2:{laboratory:false}}]){
  const s=scene();s.datos=data;
  installLaboratoryControls(s);
  assert.equal(s.registroDano,undefined);
  assert.equal(s.__torre2LabInstalled,undefined);
 }
});
