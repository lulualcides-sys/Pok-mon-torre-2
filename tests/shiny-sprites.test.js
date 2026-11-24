// Original shiny PMD sprites (owner 2026-11-24: "quero os sprites deles todos").
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {shinyAnimations,installShinySpriteCollabAssets,SHINY_FOLDER} from '../tools/pokearena/install-shiny-sprites.mjs';
const read=f=>fs.readFileSync(new URL('../tools/pokearena/'+f,import.meta.url),'utf8');
const XML='<AnimData><Anims><Anim><Name>Idle</Name><FrameWidth>24</FrameWidth><FrameHeight>32</FrameHeight><Durations><Duration>40</Duration><Duration>8</Duration></Durations></Anim>'+
 '<Anim><Name>Walk</Name><FrameWidth>32</FrameWidth><FrameHeight>32</FrameHeight><Durations><Duration>8</Duration></Durations></Anim>'+
 '<Anim><Name>Hop</Name><CopyOf>Walk</CopyOf></Anim></Anims></AnimData>';
test('shiny AnimData becomes manifest anims inside NNNN-shinyt2',()=>{
 const a=shinyAnimations(XML,'0006',['Idle','Walk','Hop','Attack']);
 assert.equal(a.Idle.file,'0006-'+SHINY_FOLDER+'/Idle-Anim.png');
 assert.equal(a.Hop.file,'0006-shinyt2/Walk-Anim.png','CopyOf resolved');
 assert.equal(a.Attack,undefined,'no source → no entry');
 assert.deepEqual(a.Idle.durations,[40,8]);
});
test('installer is additive and records provenance (fake network)',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'shiny-'));fs.mkdirSync(path.join(dir,'assets/pmd/0006'),{recursive:true});
 const man={'0006':{anims:{Idle:{file:'0006/Idle-Anim.png'},Walk:{file:'0006/Walk-Anim.png'}},feet:0},'0007':{anims:{Idle:{file:'0007/Idle-Anim.png'}}}};
 fs.writeFileSync(path.join(dir,'assets/pmd/manifest.json'),JSON.stringify(man));
 fs.writeFileSync(path.join(dir,'assets/pmd/0006/Idle-Anim.png'),'native');
 const fetcher=async url=>{
  if(url.includes('/0007/'))return {ok:false,status:404};
  if(url.endsWith('AnimData.xml'))return {ok:true,arrayBuffer:async()=>new TextEncoder().encode(XML).buffer};
  return {ok:true,arrayBuffer:async()=>new Uint8Array([137,80,78,71]).buffer};
 };
 const r=await installShinySpriteCollabAssets(dir,{fetcher,range:[6,7]});
 assert.equal(r.species,1);assert.deepEqual(r.missing,['0007']);
 const out=JSON.parse(fs.readFileSync(path.join(dir,'assets/pmd/manifest.json'),'utf8'));
 assert.ok(out['0006-shinyt2'].anims.Idle);assert.equal(out['0007-shinyt2'],undefined);
 assert.equal(fs.readFileSync(path.join(dir,'assets/pmd/0006/Idle-Anim.png'),'utf8'),'native','native file untouched');
 assert.ok(fs.existsSync(path.join(dir,'assets/pmd/0006-shinyt2/portrait.png')));
 const prov=JSON.parse(fs.readFileSync(path.join(dir,'assets/pmd/SHINY-PROVENANCE.json'),'utf8'));
 assert.equal(prov.license,'CC BY-NC 4.0');
});
test('campaign and battle use the shiny sheet only for shiny individuals',()=>{
 const pub=read('publish-alpha0762.mjs'),scene=read('torre2-campaign-scene.js'),party=read('torre2-party-battle.js');
 assert.match(pub,/await installShinySpriteCollabAssets\(root\)/);
 assert.match(pub,/if\(dx&&m\[dx\+"-shinyt2"\]\)dexs\.add\(dx\+"-shinyt2"\)/);
 assert.match(scene,/if\(member\?\.shiny===true&&globalThis\.__pt2Game\?\.registry\?\.get\('manifiesto'\)\?\.\[dex\+'-shinyt2'\]\)return dex\+'-shinyt2'/);
 assert.match(scene,/match\.aspectos=\[sh\(firstPlayer\)\?'shinyt2':null,sh\(firstEnemy\)\?'shinyt2':null\]/);
 assert.match(scene,/\{aura:null,fx:'normal'\}/,'no native skin aura');
 assert.match(party,/actor\.aspecto=member\.shiny===true&&scene\.manifiesto\?\.\[memberDex\(member\)\+'-shinyt2'\]\?'shinyt2':null/);
 assert.match(scene,/torre2-dex-shiny-toggle/);
});
test('a shiny always has a hidden ability and at least 4 stars',async()=>{
 const {potentialOf,potentialStars,hiddenAbilityOf,HIDDEN_ABILITIES}=await import('../tools/pokearena/torre2-individuality.js');
 for(let i=0;i<300;i++){
  const m={uid:'u'+i,id:'pidgey',shiny:true};
  assert.ok(potentialStars(potentialOf(m))>=4,m.uid);
  assert.ok(HIDDEN_ABILITIES[hiddenAbilityOf(m)],m.uid);
 }
 const low={uid:'x',id:'rattata',shiny:true,potential:{hp:0,atk:3,def:1},hiddenAbility:null};
 assert.ok(potentialStars(potentialOf(low))>=4);assert.ok(hiddenAbilityOf(low));
 const high={uid:'y',shiny:true,potential:{hp:31,atk:31,def:31},hiddenAbility:'pressao'};
 assert.deepEqual(potentialOf(high),{hp:31,atk:31,def:31});assert.equal(hiddenAbilityOf(high),'pressao');
 const normal={uid:'z',potential:{hp:0,atk:0,def:0},hiddenAbility:null};
 assert.equal(potentialStars(potentialOf(normal)),1);assert.equal(hiddenAbilityOf(normal),null,'non-shiny unchanged');
});
test('Ficha bag: hover/one tap explains the item, EQUIPAR equips',()=>{
 const scene=read('torre2-campaign-scene.js');
 assert.match(scene,/zone\.on\('pointerover',\(\)=>\{if\(!pinned\)showTip\(k,x,y,false\)/);
 assert.match(scene,/'EQUIPAR',\(\)=>equip\(k\)/);
 assert.doesNotMatch(scene,/zone\.on\('pointerup',\(\)=>equip\(k\)\)/);
});
