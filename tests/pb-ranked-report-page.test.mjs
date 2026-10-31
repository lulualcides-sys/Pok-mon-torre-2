import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {auditPbRanked} from '../tools/dev/pb-ranked-audit-core.mjs';
import {renderPbAuditHtml} from '../tools/dev/pb-ranked-report-page.mjs';
const read=file=>JSON.parse(fs.readFileSync(new URL('../'+file,import.meta.url),'utf8'));
const report=auditPbRanked(
 read('reference-library/pb-ranked/derived-move-index.json'),
 read('data/pokearena2d-source-moves.json'),
 read('data/move-reuse-policy.json'));
test('standalone HTML includes 283-move queryable index and clear uncertainty labels',()=>{
 const html=renderPbAuditHtml(report);
 assert.ok(html.startsWith('<!doctype html>'));
 assert.match(html,/lang="pt-BR"/);
 assert.match(html,/id="pb-audit-data"/);
 assert.match(html,/id="query"/);
 assert.match(html,/id="type"/);
 assert.match(html,/id="evidence"/);
 assert.match(html,/Relato agregado, confiança baixa/);
 assert.match(html,/Não|não consta desta lista/);
 assert.ok(html.length>35000);
 const payload=JSON.parse(html.match(/<script id="pb-audit-data" type="application\/json">([\s\S]*?)<\/script>/)?.[1]||'null');
 assert.equal(payload.moves.length,283);
 assert.equal(payload.totals.reported,70);
 assert.equal(payload.moves.filter(x=>x.protected).length,report.totals.protected);
 assert.ok(!html.includes('https://cdn.'));
});
test('JSON embedding escapes HTML tags and cannot introduce injected script',()=>{
 const hacked=structuredClone(report);
 hacked.moves[0].name='</script><img src=x onerror=alert(1)>';
 const html=renderPbAuditHtml(hacked);
 assert.ok(!html.includes('</script><img'));
 assert.ok(!html.includes('<img src=x'));
 assert.match(html,/\\u003c\/script\\u003e/);
});
test('report generator never exposes a game write or creates an external URL',()=>{
 const html=renderPbAuditHtml(report);
 for(const forbidden of ['fetch(', 'XMLHttpRequest','localStorage.', 'eval(','window.location=', 'contentEditable']) {
  assert.ok(!html.includes(forbidden),'forbidden '+forbidden);
 }
});
