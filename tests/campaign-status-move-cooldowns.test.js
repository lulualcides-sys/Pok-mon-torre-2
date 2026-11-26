import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const source=fs.readFileSync(
 path.join(process.cwd(),'tools/pokearena/torre2-move-pool.js'),'utf8'
);
const quickBlock=source.match(
 /export const KANTO_CAMPAIGN_QUICK_COOLDOWNS=Object\.freeze\(\{([\s\S]*?)\}\);/
);
assert.ok(quickBlock,'Campaign quick cooldown table must remain present');
const cooldowns=Object.fromEntries(
 [...quickBlock[1].matchAll(/['"]?([a-z0-9-]+)['"]?\s*:\s*(\d+(?:\.\d+)?)/g)]
  .map(match=>[match[1],Number(match[2])])
);

test('only Supersonic and Hypnosis use 15 seconds in the campaign',()=>{
 assert.equal(cooldowns.supersonic,15);
 assert.equal(cooldowns.hypnosis,15);
 const fifteenSecondMoves=Object.entries(cooldowns)
  .filter(([,seconds])=>seconds===15).map(([id])=>id).sort();
 assert.deepEqual(fifteenSecondMoves,['hypnosis','supersonic']);
});

test('other Sleep and Confusion moves keep their previous campaign cooldowns',()=>{
 assert.equal(cooldowns.sleep,2.5);
 assert.equal(cooldowns['sleep-powder'],2.5);
 for(const id of [
  'sing','lovely-kiss','spore','yawn','grass-whistle','dark-void',
  'confusion','confuse-ray','sweet-kiss','teeter-dance','swagger','flatter',
  'dynamic-punch','dizzy-punch','water-pulse','psybeam','signal-beam',
  'psychic','petal-dance','outrage','thrash'
 ]) assert.equal(Object.hasOwn(cooldowns,id),false,id+' must not receive the 15s override');
});

test('campaign practice ULT protection and other quick cooldowns remain intact',()=>{
 assert.match(source,/if\(move\.torre2IntroPractice&&/);
 assert.equal(cooldowns['charge-beam'],1.5);
 assert.equal(cooldowns.gust,1.2);
 assert.equal(cooldowns.thunderbolt,2);
});
