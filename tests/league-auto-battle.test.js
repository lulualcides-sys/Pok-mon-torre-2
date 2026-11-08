import test from 'node:test';
import assert from 'node:assert/strict';
import {
 isLeagueAutoBattle,autoBattleAllowed,LEAGUE_AUTO_TACTICAL,
 tuneLeagueAutoBrain,improveLeagueAutoInput,installAutoBattle
} from '../tools/pokearena/torre2-auto-battle.js';

const ui=()=>{
 const handlers=new Map();
 const x={handlers,destroyed:false};
 for(const name of ['setStrokeStyle','setDepth','setOrigin','setFillStyle','setX',
  'setInteractive','setText','setColor','setVisible','setActive'])
  x[name]=function(...args){if(name==='setText')this.text=args[0];return this;};
 x.on=(name,cb)=>{handlers.set(name,cb);return x;};
 x.removeAllListeners=()=>handlers.clear();
 x.destroy=()=>{x.destroyed=true;};
 return x;
};
const fighter=(id='squirtle',etapa=0)=>({
 def:{id},etapa,x:100,y:100,hp:90,hpMax:100,energia:80,calor:0,
 cd:{lmb:0,rmb:0,q:0,e:0},
 tipos:['WATER'],t:10,
 kit:{
  lmb:{nombre:'Water Gun',forma:'proyectil',tipo:'WATER',dano:9,alcance:100,coste:5},
  rmb:{nombre:'Hydro Pump',forma:'proyectil',tipo:'WATER',dano:31,alcance:230,coste:20},
  q:{nombre:'Ice Beam',forma:'proyectil',tipo:'ICE',dano:20,alcance:175,coste:15}
 }
});
const fixture=(options={})=>{
 const handlers=new Map(),p=fighter(),foe=fighter('geodude');
 foe.x=275;foe.y=100;foe.tipos=['ROCK','GROUND'];foe.lado=1;p.lado=0;
 p.rival=foe;foe.rival=p;
 const human={tipo:'tactil',l:p,leer:()=>({mx:0,my:0,lmb:false,mega:false})};
 const enemy={tipo:'ia',l:foe,leer:()=>({})};
 return {datos:{modo:'liga',...options},controles:[human,enemy],
  luchadores:[p,foe],fase:'lucha',sim:false,red:null,enLinea:false,
  pausado:false,
  add:{rectangle:()=>ui(),text:()=>ui(),zone:()=>ui()},
  input:{keyboard:{on(){},off(){}}},
  events:{on:(name,cb)=>handlers.set(name,cb),
   off:(name,cb)=>{if(handlers.get(name)===cb)handlers.delete(name);},
   once:(name,cb)=>handlers.set(name,cb)},
  handlers};
};

test('League is allowed only offline and never expands to PvP or Kanto',()=>{
 for(const m of ['liga','league']){
  const s=fixture({modo:m});
  assert.equal(isLeagueAutoBattle(s),true);
  assert.equal(autoBattleAllowed(s),true);
 }
 assert.equal(isLeagueAutoBattle(fixture({modo:'cpu'})),false);
 assert.equal(isLeagueAutoBattle(fixture({modo:'cpu',torre2:{kind:'campaign'}})),false);
 const marked=fixture({modo:'cpu',liga:{round:2}});
 assert.equal(isLeagueAutoBattle(marked),true);
 for(const key of ['sim','enLinea','red']){
  const s=fixture();s[key]=key==='red'?{}:true;
  assert.equal(autoBattleAllowed(s),false,key);
 }
 for(const modo of ['online','versus','demo','replay']){
  const s=fixture({modo});
  assert.equal(autoBattleAllowed(s),false,modo);
 }
});

test('League native brain is tactical without damage/stat bonuses or mutation of defaults',()=>{
 const brain={c:{pBasico:.6,pConGanas:.5,pSinGanas:.6,pAhorro:.8,reservaEnergia:80,
  pPlantarse:.8,rangoBanda:34,foo:77}};
 tuneLeagueAutoBrain(fixture(),brain);
 assert.equal(brain.c.foo,77);
 assert.equal(brain.c.pBasico,.17);
 assert.equal(brain.c.reservaEnergia,35);
 assert.equal(brain.c.pAhorro,.14);
 assert.ok(LEAGUE_AUTO_TACTICAL.reaccion<.05);
 assert.equal(LEAGUE_AUTO_TACTICAL.error,0);
 assert.equal('dano' in LEAGUE_AUTO_TACTICAL,false);
 const untouched={c:{pBasico:.6}};
 tuneLeagueAutoBrain(fixture({modo:'arena'}),untouched);
 assert.equal(untouched.c.pBasico,.6);
});

test('League AUTO is on at battle start and keeps native evolution input',()=>{
 const s=fixture(),control=s.controles[0];let calls=0;
 const state=installAutoBattle(s,actor=>{
  assert.strictEqual(actor,s.controles[0].l);calls++;
  return {c:{pBasico:.9},leer:()=>({mx:0,my:0,mega:true,lmb:false})};
 });
 assert.ok(state);assert.equal(state.enabled,true);
 assert.equal(state.ai.c.pBasico,.17);
 assert.equal(control.leer(.016).mega,true);
 assert.equal(calls,1);
 state.zone.handlers.get('pointerdown')(null,null,null,{stopPropagation(){}});
 assert.equal(state.enabled,false);
 assert.equal(control.leer(.016).mega,false,'Manual reader restored when AUTO is off');
 s.handlers.get('shutdown')();
 assert.equal(s.__torre2AutoMode,null);
});

test('AUTO evolves native League forms when engine says ready, without changing moves',()=>{
 const s=fixture(),p=s.controles[0].l;
 p.puedeEvolucionar=true;
 const originalKit=p.kit;
 const state=installAutoBattle(s,()=>({
  leer:()=>({mx:0,my:0,lmb:true,mega:false})}));
 const cmd=s.controles[0].leer(.016);
 assert.equal(cmd.mega,true);
 assert.equal(cmd.lmb,false,'Evolution has priority over a basic');
 const forced=improveLeagueAutoInput(s,p,{mx:0,my:0,lmb:false,q:true,mega:false});
 assert.equal(forced.mega,true,'Evolution outranks offensive skill when native getter is ready');
 assert.equal(forced.q,false,'Evolution input never overlaps an attacking cast');
 assert.strictEqual(p.kit,originalKit);
 p.puedeEvolucionar=false;p.puedeMega=true;
 assert.equal(s.controles[0].leer(.016).mega,true,'Native Mega allowed');
 p.puedeMega=false;
 assert.equal(s.controles[0].leer(.016).mega,false);
 s.handlers.get('shutdown')();
});

test('Evolution rebinds the original IA exactly once after the stage changes',()=>{
 const s=fixture(),p=s.controles[0].l;let constructions=0;
 const state=installAutoBattle(s,actor=>{
  constructions++;
  const stage=actor.etapa;
  return {leer:()=>({mx:stage,my:0,lmb:false,fromStage:stage})};
 });
 assert.equal(constructions,1);
 assert.equal(s.controles[0].leer(.016).fromStage,0);
 p.etapa=1;
 assert.equal(s.controles[0].leer(.016).fromStage,1);
 assert.equal(constructions,2);
 s.controles[0].leer(.016);
 assert.equal(constructions,2);
 assert.equal(state.autoSpecies,'squirtle:1');
 s.handlers.get('shutdown')();
});

test('League tactics respect cooldown, energy, native dodge, attack and immunity',()=>{
 const s=fixture(),p=s.controles[0].l,foe=s.luchadores[1];
 let i={mx:0,my:0,lmb:false,mega:false};
 let result=improveLeagueAutoInput(s,p,i);
 assert.equal(result.rmb,true,'Ready ranged water skill should beat idle');
 assert.equal(result.ax,foe.x);
 assert.ok(result.mx>0,'Healthy League AI closes distance');
 p.cd.rmb=2;p.energia=5;
 result=improveLeagueAutoInput(s,p,i);
 assert.equal(result.rmb,undefined,'Do not bypass cooldown');
 assert.equal(result.q,undefined,'Do not bypass energy');
 p.cd.rmb=0;p.energia=60;
 assert.deepEqual(improveLeagueAutoInput(s,p,{...i,esp:true}),{...i,esp:true});
 assert.deepEqual(improveLeagueAutoInput(s,p,{...i,q:true}),{...i,q:true});
 p.accion={bloquea:true};
 assert.strictEqual(improveLeagueAutoInput(s,p,i),i);
 p.accion=null;
 p.hp=20;
 result=improveLeagueAutoInput(s,p,i);
 assert.equal(result.mx,0,'Do not chase recklessly while low HP');
 foe.tipos=['WATER'];
 p.kit.rmb.tipo='ELECTRIC';p.kit.q.tipo='ELECTRIC';
 // Neutral opponent cannot be damaged by the Ground-immune electric move.
 foe.tipos=['GROUND'];
 result=improveLeagueAutoInput(s,p,i);
 assert.equal(result.rmb,undefined);
 assert.equal(result.q,undefined);
});

test('Other Arena/CPU automatic inputs still suppress EVO and stay manual by default',()=>{
 for(const modo of ['arena','cpu','entreno']){
  const s=fixture({modo}),p=s.controles[0].l;
  p.puedeEvolucionar=true;
  const state=installAutoBattle(s,()=>({leer:()=>({mega:true,lmb:true})}));
  assert.equal(state.enabled,false,modo);
  state.zone.handlers.get('pointerdown')(null,null,null,{stopPropagation(){}});
  assert.equal(s.controles[0].leer(.016).mega,false,modo);
  s.handlers.get('shutdown')();
 }
});
