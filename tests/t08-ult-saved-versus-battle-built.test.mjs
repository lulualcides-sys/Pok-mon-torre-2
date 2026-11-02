/* Regression for the user's Beedrill/Vulpix/Ivysaur editor screenshots.
 * Never mistake a saved preview row for the actual battle action. No VFX changes.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const root=path.resolve(process.env.PREVIEW_ROOT||'_site','arena2d');
const {modules}=JSON.parse(fs.readFileSync(path.join(root,'version.json'),'utf8'));
const {availableMoves,defaultLoadout,selectedMoves,resolveLoadout,
 campaignMoveSlotReason,equipMove,canonicalMoveKey}=await import(
 pathToFileURL(path.join(root,modules,'torre2/move-pool.js')).href);
const make=(id,level)=>({id,progression:{species:id,level},tmMoves:[]});
const resolved=(member)=>resolveLoadout(member).e;

const vulpix=make('vulpix',23);
const vulpixE=resolved(vulpix);
assert.equal(canonicalMoveKey(vulpixE.torre2IntroSource||vulpixE.nombre),'fire-blast',
 'Lv23 Vulpix needs Fire Blast energy-gated thematic ULT, not Flamethrower');
assert.ok(vulpixE.ulti&&vulpixE.dano<=12&&vulpixE.cd>=8);
assert.ok(!availableMoves(vulpix).some(move=>move.id==='fire-blast'),
 'Native full-power Fire Blast must remain locked until earned');
assert.ok(availableMoves(make('vulpix',50)).some(move=>move.id==='fire-blast'),
 'Fire Blast never unlocked at its authorized late campaign level');

const ivysaur=make('ivysaur',26);
const ivysaurE=resolved(ivysaur);
assert.equal(canonicalMoveKey(ivysaurE.torre2IntroSource||ivysaurE.nombre),'solar-beam',
 'Lv26 Ivysaur must keep its legal Solar Beam ULT preview');
assert.ok(ivysaurE.ulti&&ivysaurE.dano<=12);
assert.ok(!availableMoves(ivysaur).some(move=>move.id==='solar-beam'),
 'Full-power Solar Beam granted before its actual learn level');
// A user's explicit selection must be reflected identically in the battle
// runtime, even if some alternative default would normally be chosen.
for(const specimen of [vulpix,ivysaur]){
 const available=availableMoves(specimen);
 const preview=available.find(move=>move.torre2IntroSlot==='e');
 assert.ok(preview?.forma&&preview.ulti);
 specimen.moves=defaultLoadout(specimen);
 specimen.movePlanSpecies=specimen.id;
 assert.equal(equipMove(specimen,3,preview.id),true,'Cannot select E '+specimen.id);
 assert.equal(selectedMoves(specimen)[3],preview.id);
 assert.equal(resolved(specimen).id,preview.id,'Equipped E is replaced invisibly in battle');
 assert.equal(campaignMoveSlotReason(specimen,1,preview),'SÓ ULT (E)');
}
const beedrill=make('beedrill',28),moves=availableMoves(beedrill);
const status=moves.find(m=>canonicalMoveKey(m.nombre)==='harden');
if(status)assert.ok(campaignMoveSlotReason(beedrill,3,status),
 'A zero-damage Harden action must not be a meter-gated ULT');
const weak=moves.find(m=>m.forma&&!m.torre2IntroPractice&&
 Number(m.dano)>0&&Number(m.dano)<7&&!m.ulti);
if(weak)assert.ok(campaignMoveSlotReason(beedrill,3,weak),
 'An ordinary low-damage attack cannot serve as the finisher');
const beedrillKit=resolveLoadout(beedrill);
assert.ok(beedrillKit.e?.ulti,'Beedrill lost its charged finisher');
assert.ok(campaignMoveSlotReason(beedrill,1,beedrillKit.e)||
 beedrillKit.e?.torre2IntroPractice,'Beedrill finisher is usable on a normal HAB');
const gloom=make('gloom',21);
assert.notEqual(canonicalMoveKey(resolved(gloom)?.torre2IntroSource),'solar-beam',
 'Gloom must not inherit an unlearned evolved Solar Beam preview');
console.log('PASS_T08_ULT_EDITOR_SAVED_BATTLE',JSON.stringify({
 vulpix:vulpixE.nombre,ivysaur:ivysaurE.nombre,beedrill:beedrillKit.e.nombre,
 explicitE:true,nativeVfxUntouched:true
}));
