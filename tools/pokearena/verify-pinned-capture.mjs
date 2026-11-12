#!/usr/bin/env node
/* Validate an immutable, user-authorized original P2 capture from GitHub
 * Actions before using it as a fallback for a 403 from the public site.
 * Do not use incomplete sources, unsigned substitutes or mock assets.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';

const ROOT=path.resolve('site-capture/pokearena-client');
const REPORT=path.resolve('site-capture/CAPTURE-REPORT.json');
const PIN='src-17c11341bf';
const required=['index.html','lib/phaser.min.js',PIN+'/datos.js'];
const sha256=data=>createHash('sha256').update(data).digest('hex');
const report=JSON.parse(await fs.readFile(REPORT,'utf8'));
assert.equal(report.sourceVersions?.selected,PIN,
 'Pinned fallback is from an unreviewed P2 source revision');
assert.ok(report.totalFiles>=3300,'Incomplete cached original P2 capture');
assert.ok(Array.isArray(report.retrieved)&&report.retrieved.length>=3300,
 'Missing source file manifest');
assert.equal(report.referencedAssets?.missing?.length??0,0,
 'Source is missing referenced game assets');
const manifest=new Map();
let bytes=0;
for(const entry of report.retrieved){
 assert.ok(typeof entry.path==='string'&&typeof entry.sha256==='string',
  'Capture entry lacks source/hash provenance');
 const file=path.resolve(ROOT,entry.path);
 assert.ok(file.startsWith(ROOT+path.sep),
  'Capture entry attempts path traversal');
 assert.ok(!manifest.has(entry.path),'Duplicate source path: '+entry.path);
 const data=await fs.readFile(file);
 assert.equal(sha256(data),entry.sha256,
  'Original source hash mismatch: '+entry.path);
 manifest.set(entry.path,data.length);
 bytes+=data.length;
}
for(const critical of required){
 assert.ok(manifest.has(critical),'Original Phaser asset missing: '+critical);
 assert.ok(manifest.get(critical)>1024,'Original Phaser asset empty: '+critical);
}
console.log('PINNED_POKEARENA_CAPTURE_VERIFIED',JSON.stringify({
 source:PIN,files:manifest.size,bytes,critical:required
}));
