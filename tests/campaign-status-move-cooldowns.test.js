import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const source=fs.readFileSync(
 path.join(process.cwd(),'tools/pokearena/torre2-move-pool.js'),'utf8'
);
const statusBlock=source.match(
 /export const KANTO_CAMPAIGN_SLEEP_AND_CONFUSION_COOLDOWNS=Object\\.freeze\\(\\{([\\s\\S]*?)\\}\\);/
);
assert.ok(statusBlock,'Campaign Sleep/Confusion cooldown table must exist');
const cooldowns=Object.fromEntries(
 [...statusBlock[1].matchAll(/['"]?([a-z0-9-]+)['"]?\\s*:\\s*(\\d+(?:\\.\\d+)?)/g)]
  .map(match=>[match[1],Number(match[2])])
);

const sleepMoves=[
 'sleep','rest','sleep-powder','hypnosis','sing','lovely-kiss',
 'spore','yawn','grass-whistle','dark-void'
];
const confusionMoves=[
 'confusion','confuse-ray','supersonic','sweet-kiss','teeter-dance',
 'swagger','flatter','dynamic-punch','dizzy-punch','water-pulse',
 'psybeam','signal-beam','psychic','petal-dance','outrage','thrash'
];

test('all Sleep and Confusion moves use a 15-second campaign cooldown',()=>{
 for(const id of [...sleepMoves,...confusionMoves])
  assert.equal(cooldowns[id],15,id+' must have a 15s cooldown');
 assert.ok(Object.values(cooldowns).every(value=>value===15),
  'No move in the status cooldown table may use a different duration');
});

test('status cooldown overrides also apply to campaign practice ULTs',()=>{
 const start=source.indexOf('export function balanceCampaignQuickCooldown(move){');
 const end=source.indexOf('export function resolveLoadout(member){',start);
 assert.ok(start>=0&&end>start,'Campaign cooldown resolver must exist');
 const resolver=source.slice(start,end);
 const statusIndex=resolver.indexOf('const statusCd=');
 const practiceGuardIndex=resolver.indexOf('if(move.torre2IntroPractice&&');
 assert.ok(statusIndex>=0&&practiceGuardIndex>statusIndex,
  '15s status cooldown must be applied before the practice-ULT exception');
});

test('quick-cooldown table no longer overrides Sleep/Confusion durations',()=>{
 const quickBlock=source.match(
  /export const KANTO_CAMPAIGN_QUICK_COOLDOWNS=Object\\.freeze\\(\\{([\\s\\S]*?)\\}\\);/
 );
 assert.ok(quickBlock,'Other campaign cooldown table must remain present');
 for(const id of [...sleepMoves,...confusionMoves])
  assert.doesNotMatch(quickBlock[1],new RegExp('(?:^|[\\n,])\\s*[\'"]?'+id+'[\'"]?\\s*:'),
   id+' must be governed by the 15s status table');
});
