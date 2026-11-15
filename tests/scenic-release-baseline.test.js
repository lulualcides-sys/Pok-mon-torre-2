import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const current=fileURLToPath(new URL('../tools/dev/check-scenic-boundary.mjs',import.meta.url));
function cmd(cwd,command,args,env={}){
 const result=spawnSync(command,args,{cwd,encoding:'utf8',env:{...process.env,...env}});
 return {status:result.status,stdout:result.stdout,stderr:result.stderr};
}

test('future scenic PRs accept unchanged approved publisher and reject silent release edits',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'torre2-scenic-baseline-'));
 try{
  for(const dir of ['tools/dev','tools/pokearena'])
   fs.mkdirSync(path.join(root,dir),{recursive:true});
  fs.copyFileSync(current,path.join(root,'tools/dev/check-scenic-boundary.mjs'));
  fs.writeFileSync(path.join(root,'package.json'),'{"type":"module"}\n');
  const publisher=path.join(root,'tools/pokearena/publish-hotfix-on-alpha0713.mjs');
  const cards=path.join(root,'tools/pokearena/torre2-trainer-cards.js');
  fs.writeFileSync(publisher,'// Already reviewed release publisher\n');
  const cardBody='export const LEADER_DIALOGUE={};\nconst TX={};\n'+
   'export function trainerCardEntries(){return []}\nfunction status(){return ""}\n';
  fs.writeFileSync(cards,cardBody);
  for(const args of [['init','-q'],['config','user.name','CI'],
    ['config','user.email','ci@example.com'],['add','.'],
    ['commit','-qm','approved main baseline']]){
   const r=cmd(root,'git',args);assert.equal(r.status,0,r.stderr);
  }
  const sha=cmd(root,'git',['rev-parse','HEAD']).stdout.trim();
  const run=()=>cmd(root,process.execPath,['tools/dev/check-scenic-boundary.mjs'],
    {SCENIC_BASE_SHA:sha});
  assert.equal(run().status,0,'Approved publisher identical to base must be accepted');
  fs.appendFileSync(cards,'// Unrelated decorative card spacing preview\n');
  assert.equal(run().status,0,'Unchanged protected rosters survive visual-only edits');
  fs.appendFileSync(publisher,'// Unreviewed release mutation\n');
  const forbidden=run();
  assert.notEqual(forbidden.status,0,'Publisher changes after the approved baseline fail closed');
  assert.match(forbidden.stderr,/Release guard anchor drift|Unreviewed publisher logic/);
  fs.writeFileSync(publisher,'// Already reviewed release publisher\n');
  fs.writeFileSync(cards,cardBody.replace('LEADER_DIALOGUE={}','LEADER_DIALOGUE={unsafe:true}'));
  const protectedChange=run();
  assert.notEqual(protectedChange.status,0,'Changing locked trainer dialogue remains blocked');
 }finally{fs.rmSync(root,{recursive:true,force:true})}
});
