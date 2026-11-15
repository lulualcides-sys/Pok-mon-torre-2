#!/usr/bin/env bash
# Regression QA for the approved and archived Alpha 0.71.3 release.
# This is NOT a live source capture or evidence of a newer upstream version.
set -euo pipefail
: "${GH_TOKEN:?GH_TOKEN is required to read the audited archive}"
export GH_REPO="${GH_REPO:-${GITHUB_REPOSITORY:-lulualcides-sys/Pok-mon-torre-2}}"
site="${TORRE2_SITE_ROOT:-_site}"
if [[ -e "$site/arena2d" ]]; then
 echo "::error::QA output is not empty; use a clean checkout" >&2
 exit 1
fi
mkdir -p "$site"
bash tools/pokearena/restore-audited-alpha0713.sh site "$site"
TORRE2_SITE_ROOT="$site" node tools/pokearena/publish-hotfix-on-alpha0713.mjs
TORRE2_SITE_ROOT="$site" node --input-type=module <<'VERIFY'
import fs from 'node:fs';
import path from 'node:path';
const site=process.env.TORRE2_SITE_ROOT||'_site';
const root=path.join(site,'arena2d');
const release=JSON.parse(fs.readFileSync(path.join(site,'RELEASE-0713-HOTFIX.json'),'utf8'));
const version=JSON.parse(fs.readFileSync(path.join(root,'version.json'),'utf8'));
const fail=message=>{throw Error('AUDITED_QA_INTEGRITY: '+message)};
if(release.alpha!=='0.71.3'||release.source!=='src-5ccc174cb8'||
  version.src!==release.source||version.modules!==release.modules||
  !/^src-[a-f0-9]{10}$/.test(version.modules)||release.baseModules===release.modules)
  fail('wrong pinned source or module tree');
if(!process.env.GITHUB_SHA||release.patchCommit!==process.env.GITHUB_SHA)
  fail('candidate commit differs from GitHub Actions SHA');
const modules=path.join(root,version.modules);
const native=fs.readFileSync(path.join(modules,'config.js'),'utf8');
if(!/\bVERSION\s*=\s*['"]0\.71\.3['"]/.test(native))
  fail('official VERSION is not Alpha 0.71.3');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'assets/pmd/manifest.json'),'utf8'));
if(Object.keys(manifest).length<278||!manifest['0467']?.anims?.Idle)
  fail('critical native PMD entries missing');
for(const name of ['lib/phaser.min.js','rights-audit-0713.json','CONTRIBUTOR-CREDITS-0713.md']){
  const file=path.join(root,name);
  if(!fs.existsSync(file)||fs.statSync(file).size<30)fail('missing '+name);
}
for(const name of ['torre2/campaign-core.js','torre2/progression.js','torre2/batch24/runtime.js']){
  if(!fs.existsSync(path.join(modules,name)))fail('missing '+name);
}
const impact=fs.readFileSync(path.join(modules,'torre2/batch24/runtime.js'),'utf8');
const campaign=fs.readFileSync(path.join(modules,'torre2/campaign-core.js'),'utf8');
if(!impact.includes('if(hit.landed)hitPoints.push({x:contact.x,y:contact.y})')||
   !impact.includes('for(const r of batch24AreaTargets(l))'))
  fail('Earth Power AoE correction missing');
if(!campaign.includes('const encounter=regionalTrainer(s.stage,s.trainer)')||
   !campaign.includes('const tier=campaignDifficultyTier(s.stage,opponent.leader,opponent.kind)'))
  fail('regional campaign correction missing');
if(!fs.existsSync(path.join(root,release.baseModules,'habilidades.js')))
  fail('rollback snapshot missing');
console.log('AUDITED_QA_RELEASE_READY',JSON.stringify({
 mode:'immutable-approved-snapshot',alpha:release.alpha,source:release.source,
 modules:release.modules,commit:release.patchCommit,pmdForms:Object.keys(manifest).length
}));
VERIFY