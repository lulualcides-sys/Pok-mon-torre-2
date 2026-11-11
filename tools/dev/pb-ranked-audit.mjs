#!/usr/bin/env node
/**
 * Usage:
 *   node tools/dev/pb-ranked-audit.mjs --format=summary
 *   node tools/dev/pb-ranked-audit.mjs --format=json --out=/tmp/pb-audit.json
 *   node tools/dev/pb-ranked-audit.mjs --format=md --out=/tmp/pb-audit.md
 *   node tools/dev/pb-ranked-audit.mjs --format=html --out=/tmp/pb-audit.html
 * No network calls, no writes unless --out is provided, no game mutation.
 */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {auditPbRanked, summarizeAudit} from './pb-ranked-audit-core.mjs';
import {renderPbAuditHtml} from './pb-ranked-report-page.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const file=name=>JSON.parse(fs.readFileSync(path.join(root,name),'utf8'));
export function loadCurrentAudit() {
 return auditPbRanked(
  file('reference-library/pb-ranked/derived-move-index.json'),
  file('data/pokearena2d-source-moves.json'),
  file('data/move-reuse-policy.json'));
}
const outputArg=flag=>process.argv.find(arg=>arg.startsWith('--'+flag+'='))
 ?.slice(flag.length+3);
export function toMarkdown(report) {
 const data=summarizeAudit(report);
 const lines=[
 '# Auditoria de 283 golpes — PB Ranked e Pokémon Torre 2',
 '',
 'Análise de metadados públicos **somente leitura**. Nenhum golpe é criado ou liberado automaticamente.',
 '',
 '- Nomes do cliente público: **'+data.researchMoves+'**; em elenco público: **'+data.rosterMoves+'**; fora do elenco: **'+data.staticOnly+'**.',
 '- Uso em bot relatado: **'+data.agentReported+'**, incluindo **'+data.lowConfidence+'** relatórios agregados de baixa confiança; **0 quadros VFX arquivados**.',
 '- Catálogo nativo Poké Arena 2D: **'+data.sourceMoves+'** nomes; sobreposição nominal: **'+data.nativeSourceOverlap+'**.',
 '- Registros protegidos por aprovações/baseline: **'+data.protected+'**. Nunca substituir automaticamente.',
 '',
 '## Fila de triagem (não é implantação)',
 '',
 '| Golpe | Tipo | Família inferida | Ação | Evidência | Fonte P2 | Protegido |',
 '| --- | --- | --- | --- | --- | --- | --- |',
 ];
 for (const m of report.moves) {
  lines.push('| '+[m.name,m.type||'—',m.family,m.action,m.evidenceLevel,
   m.nativeSourceMoveIdCurrent||'—',m.policyProtectedCurrent?'SIM':'não']
    .map(s=>String(s).replaceAll('|','/')).join(' | ')+' |');
 }
 lines.push('','## Limitações','');
 for(const item of report.limitations)lines.push('- '+item);
 lines.push('','Relatório gerado por tools/dev/pb-ranked-audit.mjs. Não altera save, campanha, Arena ou VFX.','');
 return lines.join('\n');
}
function main(){
 if(process.argv.includes('--help')){
  console.log('Use --format=summary|json|md|html [--out=path] [--fail-on-policy-drift]');
  return;
 }
 const format=outputArg('format')||'summary';
 if(!['summary','json','md','html'].includes(format))throw Error('Unsupported format '+format);
 const audit=loadCurrentAudit();
 const body=format==='json'?JSON.stringify(audit,null,2)+'\n':
  format==='html'?renderPbAuditHtml(audit):
  format==='md'?toMarkdown(audit):
  JSON.stringify(summarizeAudit(audit),null,2)+'\n';
 const out=outputArg('out');
 if(out){
  const full=path.resolve(process.cwd(),out);
  fs.mkdirSync(path.dirname(full),{recursive:true});
  fs.writeFileSync(full,body,'utf8');
  console.log('WROTE '+full);
 }else process.stdout.write(body);
 if(process.argv.includes('--fail-on-policy-drift')&&audit.totals.policyDrift>0){
  console.error('Policy drift for '+audit.totals.policyDrift+' moves. Manual review required.');
  process.exitCode=2;
 }
}
if(process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url))main();
