import test from 'node:test';
import assert from 'node:assert/strict';
import {
 HURRICANE_PREVIEW,HURRICANE_PREVIEW_FORMS,hurricaneSweep,
 castHurricanePreview,paintHurricanePreview,paintHurricaneImpact
} from '../tools/pokearena/batch24/hurricane-preview.js';

function sample(y=100,mode='landed'){
 const parts=[];
 const scene={efectos:[],add:{graphics(){
  const g={dead:false,paint:0,setDepth(){return this},clear(){return this},
   fillStyle(){return this},fillRect(x,y,w,h){
    assert.ok([x,y,w,h].every(Number.isFinite));
    assert.ok(w>0&&w<=3&&h>0&&h<=3);
    this.paint++;return this;
   },destroy(){this.dead=true}};parts.push(g);return g;
 }}};
 const actor={x:100,y:100,alto:36,ax:180,ay:100,escena:scene,t:0,ko:false,animar(){}};
 const target={x:180,y,alto:36,ko:false,hp:1000,recibir(_l,h){
  if(mode==='blocked')return 'bloqueado';
  this.hp-=h.dano;return 'golpe';
 }};
 actor.rival=target;
 return {actor,target,scene,parts};
}
test('Original Hurricane remains preview only and does not auto-equip',()=>{
 assert.equal(HURRICANE_PREVIEW.approved,false);
 assert.equal(HURRICANE_PREVIEW.status,'original-preview-not-approved-not-equipped');
 assert.equal(typeof HURRICANE_PREVIEW_FORMS.torre2_hurricane_preview,'function');
 assert.equal(HURRICANE_PREVIEW.tipo,'FLYING');
});
test('Swept, aim-based contact is bounded and may miss',()=>{
 assert.ok(hurricaneSweep({x:100,y:82},{x:180,y:82},{x:180,y:100,alto:36,ko:false}));
 assert.equal(hurricaneSweep({x:100,y:82},{x:180,y:82},{x:180,y:250,alto:36,ko:false}),null);
 assert.equal(hurricaneSweep({x:100,y:82},{x:180,y:82},{x:180,y:100,alto:36,ko:true}),null);
});
test('The original 12-phase pixel hurricane paints bounded graphics',()=>{
 const s=sample();const g=s.scene.add.graphics();
 const variations=[];
 for(let f=0;f<12;f++){const prev=g.paint;paintHurricanePreview(g,180,82,f);variations.push(g.paint-prev);}
 assert.ok(variations.every(n=>n>=35&&n<=84));
 assert.equal(paintHurricaneImpact(g,180,82,.39),false);
 assert.equal(paintHurricaneImpact(g,180,82,.1),true);
});
test('Aimed Hurricane deals one real hit and cleans up after impact',()=>{
 const {actor,target,parts}=sample();
 const original=Math.random;Math.random=()=>0;
 try{
  const fx=castHurricanePreview(actor);
  for(let i=0;i<145;i++)fx.update(1/60);
  assert.equal(target.hp,1000-HURRICANE_PREVIEW.dano);
  assert.ok(parts[0].paint>0);
  assert.ok(parts[0].dead);
 }finally{Math.random=original;}
});
test('Hurricane avoids phantom impact and damage on bad aim or block',()=>{
 for(const [y,mode] of [[240,'landed'],[100,'blocked'],[100,'landed']]){
  const {actor,target,parts}=sample(y,mode);
  const original=Math.random;Math.random=()=>.99;
  try{
   const h=y===100&&mode==='landed'?HURRICANE_PREVIEW:{...HURRICANE_PREVIEW,precisao:100};
   const fx=castHurricanePreview(actor,h);
   for(let i=0;i<145;i++)fx.update(1/60);
   assert.equal(target.hp,1000);
   assert.ok(parts[0].dead);
  }finally{Math.random=original;}
 }
});
test('KO cancels preview and removes graphics without damage',()=>{
 const s=sample();const fx=castHurricanePreview(s.actor);
 s.actor.ko=true;
 assert.equal(fx.update(.1),false);
 assert.equal(s.target.hp,1000);
 assert.equal(s.parts[0].dead,true);
});
