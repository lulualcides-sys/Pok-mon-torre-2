import fs from 'node:fs/promises';
import {pathToFileURL} from 'node:url';

const SOURCE = 'https://www.pokearena2d.com/';
const CATALOG = 'data/pokearena2d-source-moves.json';
const RUNS = ['pokearena-source-snapshot.yml', 'pokearena-native-moves-watch.yml'];
export function fingerprint(html) {return html.match(/src-[0-9a-f]{10}/i)?.[0]?.toLowerCase() ?? null;}
export function compare(current, known) {
  if (!current || !known) return 'unverified';
  return current === known ? 'same-fingerprint' : 'new-fingerprint';
}
export function health(runs) {
  const r = runs?.find(x => x.status === 'completed');
  if (!r) return {status: 'unknown'};
  return {status: r.conclusion === 'success' ? 'passed' : 'failed', url: r.html_url ?? null};
}
async function get(url, headers = {}, fetcher = fetch) {
  let error;
  for (let i=0; i<2; i++) {
    try {
      const response=await fetcher(url, {headers, signal: AbortSignal.timeout(12000)});
      if (!response.ok) throw Error('HTTP '+response.status);
      return await response.text();
    } catch(e) {error=e;}
  }
  throw error;
}
export async function probe(fetcher = fetch, read = fs.readFile, token = '', repository = '') {
  const result={source: SOURCE, observed: null, catalogued: null, alpha: null, status: 'unverified', error: null, captures: {}};
  try {result.catalogued=JSON.parse(await read(CATALOG, 'utf8')).siteVersion ?? null;}
  catch(e) {result.error='Catalog unavailable: '+String(e.message || e);}
  try {result.observed=fingerprint(await get(SOURCE, {}, fetcher));
    if (!result.observed) result.error='Public HTML fingerprint missing';}
  catch(e) {result.error='Source inaccessible: '+String(e.message || e);}
  result.status=compare(result.observed, result.catalogued);
  if (token && /^[^/]+\/[^/]+$/.test(repository)) for (const name of RUNS) {
    try {
      const url='https://api.github.com/repos/'+repository+'/actions/workflows/'+name+'/runs?per_page=5';
      const json=JSON.parse(await get(url, {'Authorization':'Bearer '+token,'Accept':'application/vnd.github+json'}, fetcher));
      result.captures[name]=health(json.workflow_runs);
    } catch(e) {result.captures[name]={status:'unknown',error:String(e.message || e)};}
  }
  result.needsAttention=result.status!=='same-fingerprint' || Object.values(result.captures).some(c=>c.status==='failed');
  return result;
}
export function incident(r) {
  return [
    '<!-- torre2-upstream-monitor -->',
    '## Cliente Poké Arena 2D: atualização pendente',
    '',
    '- Origem: '+r.source,
    '- Fonte HTML observada: '+(r.observed || 'indisponível'),
    '- Fonte HTML catalogada: '+(r.catalogued || 'indisponível'),
    '- Estado: **'+r.status+'**',
    '- Versão Alpha: **não verificada**. Hash src-... não representa a versão Alpha.',
    '- Erro: '+(r.error || 'nenhum na leitura do HTML'),
    '',
    '### Últimas capturas',
    ...RUNS.map(name=>'- '+name+': '+(r.captures[name]?.status || 'indisponível')+' '+(r.captures[name]?.url || '')),
    '',
    '### Correção necessária',
    'Validar Alpha com config.js/REA autorizado; capturar arquivos completos, comparar com cliente base, testar Phaser/WebGL e saves; nunca publicar só mudando o número nem contornar HTTP 403.',
    'A issue só deve ser fechada após integração validada; não apenas por HTML acessível.',
    '',
  ].join('\n');
}
async function main() {
  const r=await probe(fetch, fs.readFile, process.env.GH_TOKEN || '', process.env.GITHUB_REPOSITORY || '');
  await fs.mkdir('site-capture', {recursive:true});
  await fs.writeFile('site-capture/upstream-watch.json', JSON.stringify(r,null,2)+'\n');
  console.log(JSON.stringify(r,null,2));
  if (process.env.GITHUB_OUTPUT) await fs.appendFile(process.env.GITHUB_OUTPUT,'attention='+(r.needsAttention?'true':'false')+'\n');
  if (process.env.GITHUB_STEP_SUMMARY) await fs.appendFile(process.env.GITHUB_STEP_SUMMARY,
    '## Monitor Poké Arena 2D\nFonte: '+(r.observed || 'indisponível')+'\nStatus: '+r.status+'\nVersão Alpha: não verificada\n');
}
if (process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href) main().catch(e=>{console.error(e);process.exitCode=1;});
