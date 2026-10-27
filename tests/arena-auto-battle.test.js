import test from 'node:test';
import assert from 'node:assert/strict';
import {autoBattleAllowed,manualFighterControl,installAutoBattle,bindAutoBattleToScene}
 from '../tools/pokearena/torre2-auto-battle.js';
const makeObject=()=>{
 const handlers=new Map;
 const obj={handlers,destroyed:false,active:true,visible:true};
 for(const method of ['setStrokeStyle','setDepth','setOrigin','setFillStyle','setX','setInteractive',
 'setText','setColor','setVisible','setActive'])obj[method]=function(...args){
  if(method==='setText')this.text=args[0];
  if(method==='setX')this.x=args[0];
  if(method==='setActive')this.active=args[0];
  if(method==='setVisible')this.visible=args[0];
  if(method==='setFillStyle')this.fill=args[0];
  return this;
 };
 obj.on=function(name,fn){handlers.set(name,fn);return this};
 obj.removeAllListeners=()=>handlers.clear();
 obj.destroy=function(){this.destroyed=true};
 return obj;
};
function scene(options={}){
 const handlers=new Map(),keyboard=new Map(),player={t:12,cd:{lmb:0},rival:{x:120,y:100}};
 const human={tipo:'tactil',l:player,leer(){return{mx:0,my:0,ax:0,ay:0,lmb:false}}};
 const target={tipo:'ia',l:player.rival,leer(){return{mx:0,my:0}}};
 return {datos:{modo:'cpu',...options},sim:false,red:null,enLinea:false,fase:'lucha',
  pausado:false,controles:[human,target],luchadores:[player,player.rival],
  add:{rectangle:()=>makeObject(),text:()=>makeObject(),zone:()=>makeObject()},
  input:{keyboard:{on:(k,fn)=>keyboard.set(k,fn),off:(k,fn)=>{if(keyboard.get(k)===fn)keyboard.delete(k)}}},
  cameras:{main:{width:640,zoom:1}},
  events:{on:(k,fn)=>handlers.set(k,fn),off:(k,fn)=>{if(handlers.get(k)===fn)handlers.delete(k)},
   once:(k,fn)=>handlers.set(k,fn)},
  handlers,keyboard};
}
test('AUTO only appears in solo battles, not PvP, online or replay',()=>{
 for(const mode of ['online','versus','demo','replay'])
  assert.equal(autoBattleAllowed(scene({modo:mode})),false,mode);
 for(const mode of ['cpu','entreno','arena'])
  assert.equal(autoBattleAllowed(scene({modo:mode})),true,mode);
 const s=scene();s.sim=true;assert.equal(autoBattleAllowed(s),false);
 s.sim=false;s.red={};assert.equal(autoBattleAllowed(s),false);
 assert.equal(autoBattleAllowed(scene({torre2:{kind:'campaign'},modo:'cpu'})),true);
});
test('Native human controller is selected, never an enemy controller',()=>{
 const s=scene();assert.strictEqual(manualFighterControl(s),s.controles[0]);
 s.controles=[s.controles[1]];assert.strictEqual(manualFighterControl(s),null);
});
test('AUTO switches input to the original native AI and back without editing attacks',()=>{
 const s=scene(),control=s.controles[0],original=control.leer;let dtUsed=0,aiCalls=0;
 const state=installAutoBattle(s,actor=>{
  assert.strictEqual(actor,control.l);
  return {leer(dt){dtUsed=dt;aiCalls++;return{mx:1,my:0,ax:55,ay:60,lmb:true,mega:true}}};
 });
 assert.ok(state);assert.equal(state.enabled,false);assert.equal(state.label.text,'AUTO');
 assert.deepEqual(control.leer(.1),{mx:0,my:0,ax:0,ay:0,lmb:false});
 state.zone.handlers.get('pointerdown')(null,null,null,{stopPropagation(){}});
 assert.equal(state.enabled,true);assert.equal(state.label.text,'AUTO ✓');
 const auto=control.leer(.033);
 assert.equal(aiCalls,1);assert.equal(dtUsed,.033);
 assert.deepEqual(auto,{mx:1,my:0,ax:55,ay:60,lmb:true,mega:false});
 assert.equal(control.l.cd.lmb,0,'Never bypass move cooldown');
 s.fase='intro';assert.deepEqual(control.leer(.016),{mx:0,my:0,ax:0,ay:0,lmb:false});
 s.fase='lucha';s.pausado=true;
 assert.equal(control.leer(.016).lmb,false,'Do not move during pause');
 s.pausado=false;state.zone.handlers.get('pointerdown')(null,null,null,{stopPropagation(){}});
 assert.equal(state.enabled,false);assert.deepEqual(control.leer(.016),original.call(control,.016));
 s.events.once; s.handlers.get('shutdown')();
 assert.strictEqual(control.leer,original,'Restore original exact reader on scene exit');
 assert.equal(state.button.destroyed,true);assert.equal(state.label.destroyed,true);
 assert.equal(state.zone.destroyed,true);assert.equal(s.__torre2AutoMode,null);
});
test('AUTO OFF by default every new battle, no multiple button installs',()=>{
 const s=scene(),a=installAutoBattle(s,()=>({leer:()=>({})}));
 assert.equal(installAutoBattle(s,()=>({leer:()=>({})})),null);
 assert.equal(a.enabled,false);
 s.handlers.get('shutdown')();
 const next=scene(),b=installAutoBattle(next,()=>({leer:()=>({})}));
 assert.equal(b.enabled,false);
});
test('AUTO keyboard B toggles, and button moves with wide-screen camera',()=>{
 const s=scene(),a=installAutoBattle(s,()=>({leer:()=>({mx:0,my:0})}));
 s.cameras.main.width=760;
 s.handlers.get('postupdate')();
 assert.equal(a.button.x,699);
 assert.equal(a.zone.x,699);
 s.keyboard.get('keydown-KeyB')({repeat:false,ctrlKey:false,altKey:false,metaKey:false});
 assert.equal(a.enabled,true);
 s.keyboard.get('keydown-KeyB')({repeat:true});
 assert.equal(a.enabled,true);
 s.fase='fin';s.handlers.get('postupdate')();
 assert.equal(a.enabled,false);assert.equal(a.zone.active,false);
 s.handlers.get('shutdown')();
 assert.equal(s.keyboard.size,0);
});
test('Scene prototype wrapping preserves original create and delegates AI',()=>{
 class FakeScene{constructor(){Object.assign(this,scene())}create(){this.wasCreated=true}}
 const before=FakeScene.prototype.create;
 bindAutoBattleToScene(FakeScene,class{constructor(actor){this.actor=actor}leer(){return{mx:.5,my:0}}});
 assert.notStrictEqual(before,FakeScene.prototype.create);
 const s=new FakeScene();s.create();
 assert.equal(s.wasCreated,true);assert.ok(s.__torre2AutoMode);
 s.__torre2AutoMode.zone.handlers.get('pointerdown')(null,null,null,null);
 assert.equal(s.controles[0].leer(.1).mx,.5);
 s.handlers.get('shutdown')();
});
