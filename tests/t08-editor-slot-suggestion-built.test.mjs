/* T08: the editor must guide invalid slots without equipping automatically.
 * Real versioned native Phaser moves, no mocked move renderer. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const base=path.resolve(process.env.PREVIEW_ROOT||'_site','arena2d');
const {modules}=JSON.parse(fs.readFileSync(path.join(base,'version.json'),'utf8'));
const pool=await import(pathToFileURL(path.join(base,modules,'torre2/move-pool.js')).href);
const member=(id,level)=>({id,progression:{species:id,level},tmMoves:[]});
const {availableMoves,campaignMoveSlotReason,suggestedCampaignMoveSlot,
 isCampaignUltimateOnlyMove}=pool;
const ivy=member('ivysaur',16);
const weak=availableMoves(ivy).find(m=>m.torre2IntroSlot==='rmb');
assert.ok(weak?.forma,'No real HAB2 renderer in Ivysaur preview');
assert.ok(campaignMoveSlotReason(ivy,0,weak));
assert.equal(suggestedCampaignMoveSlot(ivy,0,weak),1);
assert.equal(suggestedCampaignMoveSlot(ivy,1,weak),1);
const finisher=availableMoves(ivy).find(m=>m.torre2IntroSlot==='e');
assert.ok(finisher?.forma,'Lv16 Ivysaur missing charged E preview');
assert.equal(suggestedCampaignMoveSlot(ivy,1,finisher),3);
assert.equal(suggestedCampaignMoveSlot(ivy,2,finisher),3);
const porygon=member('porygon',70);
const tri=availableMoves(porygon).find(m=>m.id==='tri-attack');
assert.ok(tri?.forma&&isCampaignUltimateOnlyMove(tri),
 'Tri Attack must remain an installed charged ultimate');
assert.equal(suggestedCampaignMoveSlot(porygon,2,tri),3);
assert.equal(suggestedCampaignMoveSlot(porygon,3,tri),3);
// A missing effect, unfinished visual, or unearned E is NOT made selectable
// by the guidance system; it only navigates to genuinely legal slots.
const blocked={id:'fake',nombre:'Unavailable',forma:null};
assert.equal(suggestedCampaignMoveSlot(ivy,0,blocked),null);
assert.equal(suggestedCampaignMoveSlot(ivy,-1,weak),null);
const before=JSON.stringify(ivy);
for(let level=5;level<=50;level+=3){
 const sample=member('ivysaur',level);
 for(const move of availableMoves(sample)){
  for(let slot=0;slot<4;slot++){
   const target=suggestedCampaignMoveSlot(sample,slot,move);
   if(target!==null)assert.equal(campaignMoveSlotReason(sample,target,move),null,
    'Suggested a forbidden role '+level+' '+move.id+' '+target);
  }
 }
}
assert.equal(JSON.stringify(ivy),before,'The editor suggestion mutated the Pokémon');
console.log('PASS_T08_EDITOR_SLOT_GUIDANCE',JSON.stringify({
 normal:'HAB2',charged:'E',noAutoEquip:true,noIllegalSuggestion:true,
 levels:'5-50',previewRenderer:weak.forma
}));
