import test from 'node:test';
import assert from 'node:assert/strict';
import {autoBattleAllowed,manualFighterControl,installAutoBattle,bindAutoBattleToScene,
 CAMPAIGN_AUTO_OFFENSIVE,campaignAutoProfile,pressureCampaignAutoInput,tuneCampaignAutoBrain,
 chooseCampaignAutoWeatherInput}
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
  add:{rectangle:(x,y)=>Object.assign(makeObject(),{x,y}),
   text:(x,y)=>Object.assign(makeObject(),{x,y}),
   zone:(x,y)=>Object.assign(makeObject(),{x,y})},
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
test('AUTO never appears when two humans share the local match',()=>{
 const s=scene({modo:'arena'});
 s.controles[1]={tipo:'kbm',l:s.luchadores[1],leer:()=>({mx:0,my:0})};
 assert.equal(installAutoBattle(s,()=>({leer:()=>({})})),null);
 assert.equal(s.__torre2AutoMode,undefined);
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
test('Campaign AUTO refreshes original AI once per Pokémon species after native party switch',()=>{
 const s=scene({torre2:{kind:'trainer',stage:1}}),control=s.controles[0];
 control.l.def={id:'ivysaur'};
 let constructions=0;
 const state=installAutoBattle(s,actor=>{
  assert.strictEqual(actor,control.l);
  const identity=actor.def.id,instance=++constructions;
  return {leer:()=>({mx:instance,my:0,from:identity,lmb:true})};
 });
 assert.equal(constructions,1);
 assert.equal(state.enabled,true);
 assert.equal(control.leer(.016).mx,1);
 // Native reiniciar() mutates the same actor, not the control or scene.
 control.l.def={id:'pikachu'};
 s.fase='torre2-sendout';
 assert.equal(control.leer(.016).mx,0,'Input paused during send-out');
 assert.equal(constructions,1,'No AI rebuild until the next live combat frame');
 s.fase='lucha';
 const second=control.leer(.016);
 assert.equal(second.mx,2);
 assert.equal(second.from,'pikachu');
 assert.equal(second.mega,false);
 assert.equal(state.autoSpecies,'pikachu:0');
 assert.equal(constructions,2,'Exactly one new native IA for Pikachu');
 control.leer(.016);control.leer(.016);
 assert.equal(constructions,2,'Do not recreate IA on every frame');
 control.l.def={id:'geodude'};
 assert.equal(control.leer(.016).from,'geodude');
 assert.equal(constructions,3);
 state.zone.handlers.get('pointerdown')(null,null,null,{stopPropagation(){}});
 control.l.def={id:'oddish'};
 assert.equal(control.leer(.016).mx,0,'AUTO OFF means original manual reader');
 assert.equal(constructions,3,'Never build AI while AUTO OFF');
 state.zone.handlers.get('pointerdown')(null,null,null,{stopPropagation(){}});
 assert.equal(control.leer(.016).from,'oddish');
 assert.equal(constructions,4);
 s.handlers.get('shutdown')();
});

test('Campaign AUTO also refreshes when evolution stage changes within one base family',()=>{
 const s=scene({torre2:{kind:'trainer'}}),control=s.controles[0];
 control.l.def={id:'squirtle'};control.l.etapa=0;
 let created=0;
 const state=installAutoBattle(s,actor=>{
  const stage=actor.etapa;created++;
  return {leer:()=>({mx:stage,my:0,lmb:true})};
 });
 assert.equal(state.enabled,true);
 assert.equal(control.leer(.016).mx,0);
 assert.equal(state.autoSpecies,'squirtle:0');
 control.l.etapa=1; // Wartortle: ROSTER def.id remains Squirtle.
 assert.equal(control.leer(.016).mx,1);
 assert.equal(created,2,'Wartortle must get a NEW native AI');
 assert.equal(state.autoSpecies,'squirtle:1');
 control.leer(.016);
 assert.equal(created,2,'No new IA each frame');
 s.handlers.get('shutdown')();
});

test('Original Arena AUTO does not recreate its controller when species changes',()=>{
 const s=scene({modo:'arena'}),control=s.controles[0];
 control.l.def={id:'ivysaur'};
 let creations=0;
 const state=installAutoBattle(s,()=>({leer:()=>({mx:++creations,my:0})}));
 assert.equal(creations,0);
 state.zone.handlers.get('pointerdown')(null,null,null,{stopPropagation(){}});
 control.leer(.016);
 control.l.def={id:'pikachu'};
 control.leer(.016);
 assert.equal(state.autoSpecies,'ivysaur:0','Keep existing Arena IA untouched');
 s.handlers.get('shutdown')();
});

test('AUTO OFF by default every new battle, no multiple button installs',()=>{
 const s=scene(),a=installAutoBattle(s,()=>({leer:()=>({})}));
 assert.equal(installAutoBattle(s,()=>({leer:()=>({})})),null);
 assert.equal(a.enabled,false);
 s.handlers.get('shutdown')();
 const next=scene(),b=installAutoBattle(next,()=>({leer:()=>({})}));
 assert.equal(b.enabled,false);
});
test('AUTO keyboard B toggles, and button stays within virtual screen on wide cameras',()=>{
 const s=scene(),a=installAutoBattle(s,()=>({leer:()=>({mx:0,my:0})}));
 s.cameras.main.width=760;
 s.handlers.get('postupdate')();
 assert.equal(a.button.x,579);
 assert.equal(a.zone.x,579);
 assert.equal(a.zone.y,146,'AUTO below Bag in the upper-right region');
 assert.ok(a.zone.x<640,'AUTO cannot leave logical 640px scene');
 assert.ok(a.zone.y-18>92+12,'AUTO does not intercept Bag target');
 s.keyboard.get('keydown-KeyB')({repeat:false,ctrlKey:false,altKey:false,metaKey:false});
 assert.equal(a.enabled,true);
 s.keyboard.get('keydown-KeyB')({repeat:true});
 assert.equal(a.enabled,true);
 s.fase='fin';s.handlers.get('postupdate')();
 assert.equal(a.enabled,false);assert.equal(a.zone.active,false);
 s.handlers.get('shutdown')();
 assert.equal(s.keyboard.size,0);
});
test('AUTO also installs in the Batalla subclass when base Combate is patched',()=>{
 class Solo{constructor(){Object.assign(this,scene())}create(){this.baseCreated=true}}
 class ArenaTeam extends Solo{create(){this.arenaCreated=true}}
 const Brain=class{constructor(actor){this.actor=actor}leer(){return{mx:.5,my:0,ax:200,ay:120}}};
 bindAutoBattleToScene(Solo,Brain);
 bindAutoBattleToScene(ArenaTeam,Brain);
 const first=new Solo();first.create();
 assert.equal(first.baseCreated,true);assert.ok(first.__torre2AutoMode);
 const arena=new ArenaTeam();arena.create();
 assert.equal(arena.arenaCreated,true);assert.ok(arena.__torre2AutoMode,
  'Batalla has its own create method; inherited marker must not prevent install');
 arena.__torre2AutoMode.zone.handlers.get('pointerdown')(null,null,null,null);
 assert.equal(arena.controles[0].leer(.1).mx,.5);
 arena.handlers.get('shutdown')();
 first.handlers.get('shutdown')();
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

test('Only Kanto campaign AUTO gets above-Hard offensive parameters without buffs',()=>{
 const tiers=[];
 const NativeBrain=class{constructor(_actor,tier){tiers.push(tier)}leer(){return{mx:1,my:0}}};
 class Kanto{constructor(){Object.assign(this,scene({torre2:{kind:'trainer',stage:1}}))}create(){}}
 class OriginalArena{constructor(){Object.assign(this,scene({modo:'arena'}))}create(){}}
 bindAutoBattleToScene(Kanto,NativeBrain);
 bindAutoBattleToScene(OriginalArena,NativeBrain);
 const k=new Kanto(),a=new OriginalArena();
 k.create();a.create();
 assert.deepEqual(tiers,[CAMPAIGN_AUTO_OFFENSIVE,'normal'],
  'Campaign uses offensive native tactics; original Arena remains normal');
 assert.strictEqual(campaignAutoProfile(k),CAMPAIGN_AUTO_OFFENSIVE);
 assert.equal(campaignAutoProfile(a),'normal');
 assert.equal(CAMPAIGN_AUTO_OFFENSIVE.ventaja,1,
  'Never import Maestro native 35% hidden damage advantage');
 assert.ok(CAMPAIGN_AUTO_OFFENSIVE.reaccion<.08,'Must react faster than native Hard');
 assert.ok(CAMPAIGN_AUTO_OFFENSIVE.basicos>.85,
  'Native cfg.basicos only controls ordinary-projectile awareness, NOT basic attack frequency');
 assert.equal(CAMPAIGN_AUTO_OFFENSIVE.agresividad,1);
 assert.equal(k.__torre2AutoMode.enabled,true,'Campaign AUTO is ON from battle start');
 assert.equal(a.__torre2AutoMode.enabled,false,'Arena still starts manual');
 k.__torre2AutoMode.zone.handlers.get('pointerdown')(null,null,null,null);
 assert.equal(k.__torre2AutoMode.enabled,false,'Player can disable AUTO');
 assert.deepEqual(k.controles[0].leer(.016),{mx:0,my:0,ax:0,ay:0,lmb:false},
  'Manual reader restored when player disables AUTO');
 k.__torre2AutoMode.zone.handlers.get('pointerdown')(null,null,null,null);
 assert.equal(k.__torre2AutoMode.enabled,true,'Player can re-enable AUTO');
 k.handlers.get('shutdown')();a.handlers.get('shutdown')();
});

test('AUTO attaches when campaign native controller arrives after create',()=>{
 const frames=new Map;
 class DelayedScene{
  constructor(){
   Object.assign(this,scene({torre2:{kind:'trainer'}}));
   this.controles=[];
   this.game={events:{
    on:(k,fn)=>frames.set(k,fn),
    off:(k,fn)=>{if(frames.get(k)===fn)frames.delete(k)}
   }};
   this.scene={isActive:()=>true};
  }
  create(){this.wasCreated=true}
 }
 const Brain=class{constructor(actor){this.actor=actor}leer(){return{mx:1,my:0}}};
 bindAutoBattleToScene(DelayedScene,Brain);
 const s=new DelayedScene();s.create();
 assert.equal(s.wasCreated,true);
 assert.equal(s.__torre2AutoMode,undefined);
 assert.equal(typeof frames.get('step'),'function');
 const human=scene().controles;
 s.controles=human;
 frames.get('step')();
 assert.ok(s.__torre2AutoMode,'AUTO installs when controller is ready');
 assert.equal(s.__torre2AutoMode.zone.x,579);
 assert.equal(frames.size,0,'no deferred listener left');
 s.handlers.get('shutdown')();
});

test('Campaign AUTO level 2 is more aggressive without any combat-stat cheat',()=>{
 assert.ok(CAMPAIGN_AUTO_OFFENSIVE.reaccion<=.025,'Level 2 reacts faster than the old 45 ms profile');
 assert.equal(CAMPAIGN_AUTO_OFFENSIVE.error,0);
 assert.equal(CAMPAIGN_AUTO_OFFENSIVE.basicos,1,
  'Native projectile awareness is independent of attack decisions');
 assert.equal(CAMPAIGN_AUTO_OFFENSIVE.ventaja,1,'No Maestro hidden 35% damage buff');
 assert.equal(CAMPAIGN_AUTO_OFFENSIVE.agresividad,1);
});
test('Only active campaign AUTO closes distance on idle frames; preserves skills, dodges and low HP',()=>{
 const actor={x:30,y:40,hp:90,hpMax:100,kit:{lmb:{alcance:60}}};
 const foe={x:210,y:40,hp:90,hpMax:100};
 const s={datos:{torre2:{kind:'trainer'}},fase:'lucha',luchadores:[actor,foe]};
 const idle={mx:0,my:0,ax:210,ay:40,lmb:false,rmb:false,q:false,e:false,esp:false};
 const input=pressureCampaignAutoInput(s,actor,idle);
 assert.deepEqual(input,{...idle,mx:1,my:0});
 assert.deepEqual(idle,{mx:0,my:0,ax:210,ay:40,lmb:false,rmb:false,q:false,e:false,esp:false},
  'Native AI input is never mutated');
 assert.strictEqual(pressureCampaignAutoInput({...s,datos:{modo:'arena'}},actor,idle),idle,
  'Arena AUTO must never inherit campaign level 2 pressure');
 assert.strictEqual(pressureCampaignAutoInput({...s,fase:'intro'},actor,idle),idle);
 for(const modified of [{...idle,esp:true},{...idle,q:true},{...idle,lmb:true},
  {...idle,mx:-1,my:0}]){
  assert.strictEqual(pressureCampaignAutoInput(s,actor,modified),modified,
   'Never override an AI dodge, real native cast or deliberate movement');
 }
 const fragile={...actor,hp:20};
 s.luchadores=[fragile,foe];
 assert.strictEqual(pressureCampaignAutoInput(s,fragile,idle),idle,
  'Low HP retains all native defensive decisions');
 actor.hp=90;foe.x=70;s.luchadores=[actor,foe];
 assert.strictEqual(pressureCampaignAutoInput(s,actor,idle),idle,
  'Do not force movement at close range');
});

test('Level 3 uses real native attack thresholds, not cfg.basicos as a fake offensive knob',()=>{
 const native={c:{pBasico:.30,pConGanas:.30,pSinGanas:.50,pSeguro:.85,
  pAhorro:.50,reservaEnergia:60,energiaTope:95,pPlantarse:.50,
  rodeo:.60,lateral:.25,rangoBanda:25,combos:[{usar:'q',prioridad:2}]}};
 const original={...native.c};
 const campaign=scene({torre2:{kind:'trainer'}});
 const ret=tuneCampaignAutoBrain(campaign,native);
 assert.strictEqual(ret,native);
 assert.deepEqual(native.c.combos,original.combos,'Preserve official species combo rules');
 assert.equal(native.c.pBasico,.14,'Basic attack hit confidence threshold is actually lowered');
 assert.equal(native.c.pConGanas,.20,'Offensive skill confidence threshold is lowered');
 assert.equal(native.c.pSinGanas,.34);
 assert.equal(native.c.pAhorro,.08,'Native skill energy conservation reduced');
 assert.equal(native.c.reservaEnergia,30);
 assert.equal(native.c.energiaTope,72);
 assert.equal(native.c.pPlantarse,.22,'Reduce passive standing decisions');
 assert.equal(native.c.rodeo,.36,'Less circling, more forward pursuit');
 assert.equal(native.c.lateral,.14);
 assert.deepEqual(original,{pBasico:.30,pConGanas:.30,pSinGanas:.50,pSeguro:.85,
  pAhorro:.50,reservaEnergia:60,energiaTope:95,pPlantarse:.50,
  rodeo:.60,lateral:.25,rangoBanda:25,combos:[{usar:'q',prioridad:2}]},
  'Per-species native brain must not be modified globally');
 const arena={c:{pBasico:.3}};
 assert.strictEqual(tuneCampaignAutoBrain(scene({modo:'arena'}),arena),arena);
 assert.equal(arena.c.pBasico,.3,'Arena native AI unchanged');
});

test('Only campaign AUTO fires ready native LMB at reachable enemies with enough energy',()=>{
 const actor={x:0,y:0,t:5,hp:90,hpMax:100,energia:85,calor:20,
  cd:{lmb:0},kit:{lmb:{alcance:180,coste:8,pendiente:false}},est:{}};
 const enemy={x:100,y:0,hp:100,hpMax:100,est:{}};
 const b={datos:{torre2:{kind:'wild'}},fase:'lucha',luchadores:[actor,enemy]};
 const idle={mx:0,my:0,ax:100,ay:0,lmb:false,rmb:false,q:false,e:false,esp:false};
 const brain={c:{calorTope:80}};
 assert.equal(pressureCampaignAutoInput(b,actor,idle,brain).lmb,true);
 assert.equal(idle.lmb,false,'Native controller input must not be mutated');
 for(const props of [{cd:{lmb:.8}},{energia:2},{calor:85},
  {kit:{lmb:{alcance:180,coste:8,pendiente:true}}},
  {accion:{bloquea:true}},{est:{aturdido:{hasta:8}}}]){
  const damaged={...actor,...props};
  const src={...b,luchadores:[damaged,enemy]};
  assert.equal(pressureCampaignAutoInput(src,damaged,idle,brain).lmb,false,
   'No cast during native cooldown, low energy, heat, locked animation, status or unlearned move');
 }
 assert.strictEqual(pressureCampaignAutoInput({...b,datos:{modo:'arena'}},actor,idle,brain),idle);
 assert.strictEqual(pressureCampaignAutoInput({...b,fase:'capturando'},actor,idle,brain),idle);
 for(const input of [{...idle,q:true},{...idle,rmb:true},{...idle,e:true},{...idle,esp:true}]){
  assert.strictEqual(pressureCampaignAutoInput(b,actor,input,brain),input,
   'Never override native skills or evasion');
 }
 enemy.est.invul={hasta:12};
 assert.equal(pressureCampaignAutoInput(b,actor,idle,brain).lmb,false,
  'Do not waste attacks during opponent invulnerability');
});

test('Level 3 pursues sideways native movement only when safe and in the Kanto campaign',()=>{
 const actor={x:0,y:0,hp:90,hpMax:100,kit:{lmb:{alcance:70}}};
 const enemy={x:300,y:0,hp:100,est:{}};
 const s={datos:{torre2:{}},fase:'lucha',luchadores:[actor,enemy]};
 const sidestep={mx:0,my:1,ax:300,ay:0};
 const force=pressureCampaignAutoInput(s,actor,sidestep);
 assert.ok(force.mx>.5,'Native circling now becomes actual forward offensive pressure');
 assert.ok(force.my>0&&force.my<.6,'Keep some native strafing');
 assert.deepEqual(sidestep,{mx:0,my:1,ax:300,ay:0},'Do not mutate AI input');
 assert.strictEqual(pressureCampaignAutoInput({...s,datos:{modo:'arena'}},actor,sidestep),sidestep);
 const retreat={...sidestep,mx:-1,my:0};
 assert.strictEqual(pressureCampaignAutoInput(s,actor,retreat),retreat,'Keep intentional retreats');
 const danger={vivo:true,dueno:enemy,x:15,y:15};
 assert.strictEqual(pressureCampaignAutoInput({...s,efectos:[danger]},actor,sidestep),sidestep,
  'Do not override native evasion near hostile projectiles');
});

test('Campaign AUTO tactically uses ready approved Rain Dance only in a legal normal slot',()=>{
 const actor={x:110,y:110,hp:90,hpMax:100,energia:100,calor:0,
  tipos:['WATER'],kit:{lmb:{nombre:'Tackle'},rmb:{
   nombre:'Rain Dance',forma:'torre2_finale_raindance',coste:35
  }},cd:{rmb:0},est:{}};
 const foe={x:220,y:110,hp:100,hpMax:100,tipos:['FIRE'],est:{}};
 actor.rival=foe;
 const rain={kind:'none',remaining:0},s={
  datos:{torre2:{kind:'trainer'}},fase:'lucha',luchadores:[actor,foe],
  __torre2Weather:rain
 };
 const native={mx:0,my:1,lmb:true,rmb:false,q:false,e:false,
  esp:false,mega:false,ax:foe.x,ay:foe.y};
 const out=chooseCampaignAutoWeatherInput(s,actor,native);
 assert.equal(out.rmb,true,'AUTO casts equipped rain before normal LMB when tactically favorable');
 assert.equal(out.lmb,false,'Never cast two moves from one tactical input');
 assert.equal(out.e,false,'Weather cannot steal charged ULT');
 assert.strictEqual(native.lmb,true,'Native AI input is not mutated');
 // Native weather activation will update the SAME state after an actual cast.
 rain.kind='rain';rain.remaining=18;
 assert.strictEqual(chooseCampaignAutoWeatherInput(s,actor,native),native,
  'No redundant early recast under live Rain Dance');
 rain.remaining=3;
 assert.equal(chooseCampaignAutoWeatherInput(s,actor,native).rmb,true,
  'May refresh only as weather expires, if native CD allows');
 actor.cd.rmb=4;
 assert.strictEqual(chooseCampaignAutoWeatherInput(s,actor,native),native,
  'Native cooldown is mandatory for refreshes');
 actor.cd.rmb=0;
 actor.energia=18;
 assert.strictEqual(chooseCampaignAutoWeatherInput(s,actor,native),native,
  'Cannot use Rain Dance without real energy');
 actor.energia=100;
 foe.tipos=['WATER'];
 rain.kind='none';rain.remaining=0;
 assert.strictEqual(chooseCampaignAutoWeatherInput(s,actor,native),native,
  'Do not waste a turn on a weather that favors both equally');
 foe.tipos=['FIRE'];actor.tipos=['FIRE'];
 assert.strictEqual(chooseCampaignAutoWeatherInput(s,actor,native),native,
  'Do not choose a harmful weather for the user');
});
test('Campaign weather AUTO respects dodge, teammate changes, manual/Arena and unapproved slots',()=>{
 const actor={x:0,y:0,hp:90,hpMax:100,tipos:['ELECTRIC'],
  energia:100,calor:0,kit:{q:{nombre:'Rain Dance',
    forma:'torre2_finale_raindance',coste:35}},cd:{q:0}};
 const enemy={x:100,y:0,hp:100,tipos:['ROCK']};actor.rival=enemy;
 const scene={datos:{torre2:{kind:'wild'}},fase:'lucha',
  __torre2Weather:{kind:'none',remaining:0},luchadores:[actor,enemy]};
 const quiet={mx:0,my:0,lmb:false,q:false,rmb:false,e:false,esp:false};
 assert.equal(chooseCampaignAutoWeatherInput(scene,actor,quiet).q,true,
  'AUTO casts real Q weather for electric species against rock opposition');
 for(const input of [{...quiet,esp:true},{...quiet,rmb:true},
  {...quiet,e:true},{...quiet,q:true}]){
  assert.strictEqual(chooseCampaignAutoWeatherInput(scene,actor,input),input,
   'Native escape or a selected normal/ULT cast must take priority');
 }
 for(const modified of [
  {...scene,datos:{modo:'arena'}},{...scene,fase:'capturando'},
  {...scene,__torre2Changing:true},{...scene,pausado:true}
 ]){
  assert.strictEqual(chooseCampaignAutoWeatherInput(modified,actor,quiet),quiet,
   'Only unblocked live campaign AUTO may plan weather');
 }
 const statuses=[{aturdido:true},{dormido:true},{congelado:true},{recarga:true}];
 for(const status of statuses){
  actor.est=status;
  assert.strictEqual(chooseCampaignAutoWeatherInput(scene,actor,quiet),quiet);
 }
 actor.est={};
 actor.accion={bloquea:true};
 assert.strictEqual(chooseCampaignAutoWeatherInput(scene,actor,quiet),quiet);
 actor.accion=null;
 actor.kit.q.pendiente=true;
 assert.strictEqual(chooseCampaignAutoWeatherInput(scene,actor,quiet),quiet,
  'No missing visual or pending ability allowed');
 actor.kit.q.pendiente=false;
 actor.kit.q.nombre='Sunny Day';
 assert.strictEqual(chooseCampaignAutoWeatherInput(scene,actor,quiet),quiet,
  'Do not cast unavailable weather just because the motor supports its name');
 actor.kit.q.nombre='Rain Dance';
 actor.hp=25;
 assert.strictEqual(chooseCampaignAutoWeatherInput(scene,actor,quiet),quiet,
  'Do not sacrifice survival for weather at critical health');
 actor.hp=90;
 scene.efectos=[{vivo:true,dueno:enemy,x:2,y:3}];
 assert.strictEqual(chooseCampaignAutoWeatherInput(scene,actor,quiet),quiet,
  'Nearby hostile projectile takes precedence over weather setup');
});
test('AUTO may replace harmful active climate but never a favorable one with a worse spell',()=>{
 const self={x:0,y:0,hp:100,hpMax:100,energia:100,calor:0,
  tipos:['FIRE'],kit:{rmb:{nombre:'Sunny Day',forma:'native_sun',coste:30}},
  cd:{rmb:0}};
 const foe={x:100,y:0,hp:100,tipos:['WATER']};self.rival=foe;
 const s={datos:{torre2:{}},fase:'lucha',
  __torre2Weather:{kind:'rain',remaining:9},luchadores:[self,foe]};
 const native={lmb:true,q:false,rmb:false,e:false,esp:false};
 assert.equal(chooseCampaignAutoWeatherInput(s,self,native).rmb,true,
  'An installed and ready sun can counter rain disadvantage');
 self.kit.rmb.nombre='Rain Dance';
 assert.strictEqual(chooseCampaignAutoWeatherInput(s,self,native),native,
  'Do not refresh enemy-friendly climate');
});
