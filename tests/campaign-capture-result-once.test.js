import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source=fs.readFileSync('tools/pokearena/torre2-campaign-scene.js','utf8');
const renderStart=source.indexOf('// A capture result belongs to one capture event');
const renderEnd=source.indexOf('// Destroyed when another screen clears the scene',renderStart);
const renderHook=source.slice(renderStart,renderEnd);
const resultStart=source.indexOf('captureResultScreen(state){');
const resultEnd=source.indexOf('// The single place each battle item',resultStart);
const result=source.slice(resultStart,resultEnd);

test('capture result is shown once per captured Pokémon, not on every campaign redraw',()=>{
 assert.ok(renderStart>=0&&renderEnd>renderStart,'capture result render hook must exist');
 assert.match(renderHook,/this\.__torre2CaptureResultShownUid!==lc\.uid/);
 assert.match(renderHook,/this\.__torre2CaptureResultShownUid=lc\.uid/);
});

test('dismissing capture result consumes both saved and stale in-memory event',()=>{
 assert.ok(resultStart>=0&&resultEnd>resultStart,'capture result screen must exist');
 assert.match(result,/delete next\.lastCapture;\s*saveCampaign\(next\)/);
 assert.match(result,/if\(state\?\.lastCapture\?\.uid===lc\.uid\)delete state\.lastCapture/);
 assert.match(result,/if\(this\.__torre2CaptureResultShownUid===lc\.uid\)this\.__torre2CaptureResultShownUid=null/);
});
