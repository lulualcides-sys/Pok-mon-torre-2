import test from 'node:test';
import assert from 'node:assert/strict';
import {AUDIO_SETTINGS_KEY,DEFAULT_AUDIO_SETTINGS,normalizeAudioSettings,
 readAudioSettings,saveAudioSettings,applyAudioSettingsToGame,playOriginalMenuCue}
 from '../tools/pokearena/torre2-audio-settings.js';

test('T28 audio preferences default safely and reject invalid/unsafe values',()=>{
 assert.deepEqual(normalizeAudioSettings(null),DEFAULT_AUDIO_SETTINGS);
 const x=normalizeAudioSettings({master:-1,effects:2,music:NaN,muted:'yes'});
 assert.deepEqual(x,{master:0,effects:1,music:0.5,muted:false});
 assert.deepEqual(normalizeAudioSettings({master:Infinity,effects:'0.4',music:0.345,muted:true}),
  {master:0.7,effects:0.6,music:0.35,muted:true});
});
test('T28 preference storage roundtrip, broken JSON and disabled storage are safe',()=>{
 const db=new Map();
 const store={getItem:k=>db.get(k)||null,setItem:(k,v)=>db.set(k,v)};
 assert.deepEqual(readAudioSettings(store),DEFAULT_AUDIO_SETTINGS);
 assert.ok(saveAudioSettings({master:.4,effects:.2,music:0,muted:true},store));
 assert.equal(db.get(AUDIO_SETTINGS_KEY),JSON.stringify({
  master:.4,effects:.2,music:0,muted:true}));
 assert.deepEqual(readAudioSettings(store),{
  master:.4,effects:.2,music:0,muted:true});
 db.set(AUDIO_SETTINGS_KEY,'{broken');
 assert.deepEqual(readAudioSettings(store),DEFAULT_AUDIO_SETTINGS);
 const blocked={getItem(){throw Error('SecurityError')},setItem(){throw Error('QuotaExceededError')}};
 assert.deepEqual(readAudioSettings(blocked),DEFAULT_AUDIO_SETTINGS);
 assert.equal(saveAudioSettings({master:0},blocked),false);
});
test('T28 original Phaser sound bus honors saved global volume and mute',()=>{
 const bus={mute:false,volume:1},scene={game:{sound:bus}};
 const settings=applyAudioSettingsToGame(scene,{
  master:.3,effects:.9,music:.8,muted:true});
 assert.deepEqual(settings,{master:.3,effects:.9,music:.8,muted:true});
 assert.equal(bus.volume,.3);
 assert.equal(bus.mute,true);
 assert.deepEqual(applyAudioSettingsToGame(null,settings),settings);
});
test('T28 no browser audio, disabled SFX and muted cues do not throw',()=>{
 const st={getItem:()=>JSON.stringify({master:1,effects:1,music:1,muted:true})};
 assert.equal(playOriginalMenuCue(null,st),false);
 const normal={getItem:()=>JSON.stringify({master:1,effects:1,music:1,muted:false})};
 assert.equal(playOriginalMenuCue(null,normal),false);
});
