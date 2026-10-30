'use strict';
/**
 * Permit a fresh PUBLIC Chromium audit only when its prior attempt failed
 * exclusively because GitHub Pages returned transient HTTP 503 assets.
 * Never accept a test as passed: this process only authorizes a full rerun.
 */
const fs=require('node:fs');
const PUBLIC_BASE='https://lulualcides-sys.github.io/Pok-mon-torre-2/arena2d/';
const REPORTS=[
 'test-evidence/pokedex-public-boot-diagnostic.json',
 'test-evidence/pokedex-public-live-audit.json'
];
function retryable(reports){
 if(!Array.isArray(reports)||reports.length!==1)return false;
 const report=reports[0];
 if(!report||!Array.isArray(report.missing)||report.missing.length===0)return false;
 if(report.missing.some(item=>
  !Array.isArray(item)||item[0]!==503||
  typeof item[1]!=='string'||!item[1].startsWith(PUBLIC_BASE)))return false;
 if(!Array.isArray(report.errors)||report.errors.length!==0)return false;
 const failures=report.failedRequests||[];
 if(!Array.isArray(failures)||failures.some(item=>
  !report.missing.some(m=>m[1]===item?.url)))return false;
 if(report.failure&&!String(report.failure).includes('TimeoutError'))return false;
 return true;
}
function loadReports(paths=REPORTS){
 const reports=[];
 for(const path of paths){
  if(!fs.existsSync(path))continue;
  try{reports.push(JSON.parse(fs.readFileSync(path,'utf8')))}
  catch{return []}
 }
 return reports;
}
if(require.main===module){
 const ok=retryable(loadReports());
 console.log(ok?
  'Pages HTTP 503 isolado: repetir auditoria COMPLETA; nenhum gate dispensado.':
  'Falha não transitória/comprovação insuficiente: manter CI vermelha.');
 process.exitCode=ok?0:1;
}
module.exports={retryable,loadReports,PUBLIC_BASE};
