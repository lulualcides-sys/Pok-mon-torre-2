import test from 'node:test';
import assert from 'node:assert/strict';
import {
 parseOfficialVersion,parseOfficialNotes,findSiteHash,
 distinguishStatus,makeSnapshotReport
} from '../tools/pokearena/rea-snapshot-report.mjs';

test('never confuse Alpha version with src hash',()=>{
 assert.equal(parseOfficialVersion('const VERSION="0.65.1";'), '0.65.1');
 assert.equal(parseOfficialVersion('const VERSION="0.68.0";'), '0.68.0');
 assert.equal(parseOfficialVersion('const site="src-e20c1e16eb";'),null);
 assert.equal(findSiteHash('<script src="src-e20c1e16eb/main.js"></script>'),'src-e20c1e16eb');
});
test('archived release data is not live release evidence',()=>{
 const config='const VERSION="0.65.1";';
 const notes='const NOTAS=[{version:"0.65.1",fecha:"6 NOV 2026",titulo:"2 VS 2 FIXES"},'+
  '{version:"0.65.0",fecha:"6 NOV 2026",titulo:"RAYQUAZA"}];';
 assert.equal(parseOfficialNotes(notes).length,2);
 const r=makeSnapshotReport({
  config,notes,sourceData:{siteVersion:'src-43a0198bd6',
   sourceVersion:'src-968afec4c1',moves:[{id:'foo'}]},
  archive:{source:'offline-fixture'},siteHash:'src-e20c1e16eb',siteStatus:200
 });
 assert.equal(r.alpha.lastConfirmedFromArchivedConfig,'0.65.1');
 assert.equal(r.alpha.currentLive,null);
 assert.equal(r.site.hashComparison,'homepage-hash-changed-alpha-unverified');
 assert.equal(r.archivedNotes[1].title,'RAYQUAZA');
 assert.equal(r.baseCatalog.moveCount,1);
 assert.ok(r.limitations.some(x=>x.includes('403')));
});
test('unknown website version fails closed without invented update',()=>{
 assert.equal(findSiteHash('<html>Loading...</html>'),null);
 assert.equal(distinguishStatus('src-43a0198bd6',null),'site-version-not-verified');
 assert.equal(distinguishStatus('src-43a0198bd6','src-43a0198bd6'),'homepage-hash-unchanged');
 assert.throws(()=>makeSnapshotReport({
  config:'// no release',notes:'',sourceData:{},archive:{}
 }),/Version missing/);
});
