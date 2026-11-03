import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

// Guardrail: tracking an upstream move does not mean the move is playable.
const catalog=JSON.parse(readFileSync(new URL('../data/pokearena2d-source-moves.json',import.meta.url),'utf8'));
const delta=JSON.parse(readFileSync(new URL('../data/pokearena2d-source-changes.json',import.meta.url),'utf8'));

test('Poké Arena upstream catalog is a verified, unique, metadata-only inventory',()=>{
 assert.equal(catalog.source,'https://www.pokearena2d.com/');
 assert.match(catalog.sourceVersion,/^src-[0-9a-f]{10}$/);
 assert.match(catalog.siteVersion,/^src-[0-9a-f]{10}$/);
 assert.equal(catalog.originalMoveCount,catalog.moves.length);
 assert.equal(catalog.nativePokemonCount,catalog.nativePokemon.length);
 assert.equal(new Set(catalog.moves.map(move=>move.id)).size,catalog.moves.length);
 assert.equal(new Set(catalog.nativePokemon).size,catalog.nativePokemon.length);
 for(const move of catalog.moves){
   assert.ok(move.id&&move.name);
   assert.ok(Array.isArray(move.compatibleKantoByVerifiedLevelUp));
   assert.equal(move.integration,'native-source-metadata; not automatically equipped');
 }
});

test('last upstream difference points to real catalog entries, not claimed gameplay integrations',()=>{
 assert.equal(delta.source,catalog.source);
 assert.equal(delta.currentVersion,catalog.sourceVersion);
 assert.equal(delta.currentSiteVersion,catalog.siteVersion);
 assert.ok(['differential','initial-baseline'].includes(delta.comparison));
 const present=new Set(catalog.moves.map(move=>move.id));
 for(const key of ['additions','changed']){
   const rows=delta[key]||[];
   assert.equal(new Set(rows.map(move=>move.id)).size,rows.length);
   for(const entry of rows)assert.ok(present.has(entry.id),key+': '+entry.id);
 }
 for(const entry of delta.removals||[])assert.ok(!present.has(entry.id),'Removed move still present: '+entry.id);
});
