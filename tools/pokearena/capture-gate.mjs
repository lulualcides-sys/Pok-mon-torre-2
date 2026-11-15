/* Public source update gate. A push to our repo is NOT an upstream update.
 * Never recapture just because a build changed, and never infer Alpha from src-*.
 * A blocked original source is reported, not replaced by unlicensed assets.
 */
import fs from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {probe} from './watch-upstream.mjs';
import {publicPmdPreflight,requireCriticalPmd} from './pmd-source-preflight.mjs';

export function captureDecision(report,approved,eventName='schedule'){
 if(eventName==='workflow_dispatch')
  return {capture:true,reason:'explicit-manual-recheck',attention:true};
 if(!approved?.approvedAlpha||!/^src-[0-9a-f]{10}$/.test(approved.approvedSource||''))
  return {capture:false,reason:'approved-baseline-unverified',attention:true};
 if(!report?.observed||!report?.alpha||!report?.alphaProof)
  return {capture:false,reason:'upstream-version-unverified',attention:true};
 if(report.observed===approved.approvedSource&&report.alpha===approved.approvedAlpha)
  return {capture:false,reason:'no-verified-upstream-change',attention:false};
 return {capture:true,reason:'verified-upstream-change',attention:true};
}

async function main(){
 const approved=JSON.parse(await fs.readFile('data/pokearena-approved-alpha.json','utf8'));
 const observed=await probe();
 const proposed=captureDecision(observed,approved,process.env.GITHUB_EVENT_NAME);
 const pmd=proposed.capture?await publicPmdPreflight():null;
 const decision=requireCriticalPmd(proposed,pmd);
 const report={
  mode:'official-public-source-probe-only',decision,criticalPmd:pmd,
  observed:{fingerprint:observed.observed,alpha:observed.alpha,alphaProof:observed.alphaProof,
    error:observed.error,alphaError:observed.alphaError},
  approved:{fingerprint:approved.approvedSource,alpha:approved.approvedAlpha,
    publishedCommit:approved.publishedCommit}
 };
 await fs.mkdir('site-capture',{recursive:true});
 await fs.writeFile('site-capture/capture-gate.json',JSON.stringify(report,null,2)+'\n');
 const summary=[
  '### Captura REA — verificação de origem independente',
  '- Decisão: **'+decision.reason+'**',
  '- Captura requerida: **'+decision.capture+'**',
  '- Fonte observada: '+(observed.observed||'indisponível'),
  '- Alpha comprovada via config.js: '+(observed.alpha||'indisponível'),
  '- Última aprovada: '+approved.approvedAlpha+' / '+approved.approvedSource,
  '- Observação: gate sem captura NÃO significa que nova Alpha passou na QA.',
  '- Erro de origem: '+(observed.alphaError||observed.error||'não identificado'),
  '- Manifesto PMD crítico: '+(pmd?JSON.stringify(pmd):'não consultado; captura desnecessária')
 ].join('\n')+'\n';
 if(process.env.GITHUB_OUTPUT)
  await fs.appendFile(process.env.GITHUB_OUTPUT,'capture='+decision.capture+'\n');
 if(process.env.GITHUB_STEP_SUMMARY)
  await fs.appendFile(process.env.GITHUB_STEP_SUMMARY,summary);
 if(decision.attention&&!decision.capture)
  console.log('::warning::External capture blocked or unverified; audited Pages game is not changed');
 console.log('REA_CAPTURE_GATE',JSON.stringify(report));
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)
 main().catch(error=>{console.error(error);process.exitCode=1});
