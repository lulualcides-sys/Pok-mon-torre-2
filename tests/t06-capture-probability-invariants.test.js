import test from 'node:test';
import assert from 'node:assert/strict';
import {CATCH_RATES,captureChance,captureThreshold,rollCapture,
 normalizedCaptureStatus,fighterCaptureStatus}
 from '../tools/pokearena/torre2-capture-mechanics.js';

// Audit all 151 canonical species using the actual FRLG integer shake formula.
// No production changes and no mocked species catch rates.
test('T06: all Kanto species obey ball, HP and status capture monotonicity',()=>{
 assert.equal(Object.keys(CATCH_RATES).length,151);
 for(const id of Object.keys(CATCH_RATES)){
  const base={id,wild:true,hpMax:100,hp:100,status:'none'};
  const hpLow={...base,hp:1};
  const sleepy={...hpLow,status:'sleep'};
  const poisoned={...hpLow,status:'poison'};
  const balls=['pokeball','greatball','ultraball'];
  const chance=balls.map(ball=>captureChance(base,ball));
  const weakened=balls.map(ball=>captureChance(hpLow,ball));
  const asleep=balls.map(ball=>captureChance(sleepy,ball));
  const psn=balls.map(ball=>captureChance(poisoned,ball));
  for(let i=0;i<balls.length;i++){
   for(const [name,v] of [['full',chance[i]],['weak',weakened[i]],
    ['sleep',asleep[i]],['poison',psn[i]]]){
    assert.ok(Number.isFinite(v)&&v>=0&&v<=1,
     id+' '+balls[i]+' '+name+' invalid chance '+v);
   }
   assert.ok(weakened[i]>=chance[i],id+' lower HP must not reduce catch chance');
   assert.ok(asleep[i]>=weakened[i],id+' sleep must not reduce chance');
   assert.ok(psn[i]>=weakened[i],id+' poison must not reduce chance');
   assert.ok(asleep[i]>=psn[i],id+' sleep must be at least poison bonus');
   if(i>0){
    assert.ok(chance[i]>=chance[i-1],id+' ball bonus must not reduce full HP chance');
    assert.ok(weakened[i]>=weakened[i-1],id+' ball bonus must not reduce low HP chance');
   }
  }
  assert.equal(captureThreshold({...base,wild:false},'ultraball'),0);
  assert.equal(captureChance(base,'masterball'),1);
  assert.equal(captureChance(base,'not-a-ball'),0);
 }
});
test('T06: four shake boundary exactly matches threshold for every species',()=>{
 for(const id of Object.keys(CATCH_RATES)){
  const target={id,wild:true,hp:20,hpMax:100,status:'none'};
  const threshold=captureThreshold(target,'pokeball');
  assert.ok(threshold>=0&&threshold<=65536);
  const good=rollCapture(target,'pokeball',()=>0);
  assert.equal(good.caught,true,id+' zero roll must catch');
  assert.equal(good.shakes,3);
  if(threshold<65536){
   const bad=rollCapture(target,'pokeball',()=>1);
   assert.equal(bad.caught,false,id+' max roll must fail');
   assert.equal(bad.shakes,0);
  }
  assert.equal(rollCapture(target,'masterball',()=>1).caught,true);
 }
});
test('T06: real Math.random shake frequencies track exact integer chance',()=>{
 const candidate={id:'pikachu',wild:true,hp:35,hpMax:100,status:'none'};
 const expected=captureChance(candidate,'pokeball');
 const n=12000;let caught=0;
 for(let i=0;i<n;i++)if(rollCapture(candidate,'pokeball').caught)caught++;
 const observed=caught/n;
 // 7 sigma tolerance plus small rounding margin, avoids flaky CI.
 const sigma=Math.sqrt(expected*(1-expected)/n);
 assert.ok(Math.abs(observed-expected)<7*sigma+.005,
  'observed='+observed+' expected='+expected+' sigma='+sigma);
});

test('T06: Gen3 saved status objects retain FireRed catch bonuses',()=>{
 const states=[
  ['sleep','dormido','sleep'],['freeze','congelado','sleep'],
  ['poison','veneno','paralyzed'],['burn','quemado','paralyzed'],
  ['paralyzed','paralizado','paralyzed']
 ];
 const base={id:'mewtwo',wild:true,hp:45,hpMax:100};
 for(const [display,kind,bonus] of states){
  const saved={kind,toxic:kind==='veneno',turns:2,elapsed:1};
  assert.equal(normalizedCaptureStatus(saved),bonus,
   'serialized Gen3 '+kind+' ignored by catch multiplier');
  assert.equal(captureThreshold({...base,status:saved},'pokeball'),
   captureThreshold({...base,status:display},'pokeball'),
   'stored '+kind+' does not match native '+display+' capture odds');
  assert.equal(normalizedCaptureStatus({nombre:display}),bonus);
  assert.equal(normalizedCaptureStatus({status:display}),bonus);
  assert.deepEqual(fighterCaptureStatus({status:saved}),saved,
   'native fighter fallback must supply saved status without losing metadata');
 }
 assert.equal(normalizedCaptureStatus({kind:'confuso'}),'none',
  'confusion does not alter Gen3 capture odds');
 assert.equal(normalizedCaptureStatus({kind:'unknown'}),'none');
 assert.equal(normalizedCaptureStatus({}),'none');
 assert.equal(normalizedCaptureStatus(null),'none');
 // Unmodified native battle status remains the highest priority over the
 // persisted fallback. The project must never award stacked multipliers.
 assert.equal(fighterCaptureStatus({est:{dormido:{torre2Status:true}},
  status:{kind:'veneno'}}),'sleep');
 for(const species of Object.keys(CATCH_RATES)){
  const candidate={id:species,wild:true,hp:45,hpMax:100};
  for(const [_,kind] of states){
   const mapped=normalizedCaptureStatus({kind});
   const canonical=mapped==='sleep'?'sleep':'paralyzed';
   assert.equal(captureThreshold({...candidate,status:{kind}},'ultraball'),
    captureThreshold({...candidate,status:canonical},'ultraball'),
    'Gen3 status odds mismatch for '+species+' '+kind);
  }
 }
});
