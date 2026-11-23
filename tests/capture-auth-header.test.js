// Monitor e preflight PMD enviam X-Torre2-Capture somente ao site original,
// somente quando o segredo existe, recusam redirecionamento e não vazam o token.
import test from 'node:test';
import assert from 'node:assert/strict';
import {probe} from '../tools/pokearena/watch-upstream.mjs';
import {publicPmdPreflight} from '../tools/pokearena/pmd-source-preflight.mjs';

const TOKEN='t2cap_probe_ABCDEFGHIJKLMNOP';
const res=(status,body='',hdr={})=>({ok:status>=200&&status<300,status,headers:new Headers(hdr),
  text:async()=>body,json:async()=>JSON.parse(body||'{}')});
async function withToken(value,fn){
  const prev=process.env.TORRE2_CAPTURE_TOKEN;
  if(value==null)delete process.env.TORRE2_CAPTURE_TOKEN;else process.env.TORRE2_CAPTURE_TOKEN=value;
  try{return await fn();}finally{if(prev==null)delete process.env.TORRE2_CAPTURE_TOKEN;else process.env.TORRE2_CAPTURE_TOKEN=prev;}
}
const read=async()=>'{}';

test('monitor envia o cabeçalho ao site e registra Ray ID sem o token',async()=>{
  const calls=[];
  const r=await withToken(TOKEN,()=>probe(async(u,o)=>{calls.push([u,o]);return res(403,'blocked',{'cf-ray':'r1-IAD',server:'cloudflare'});},read));
  const site=calls.find(([u])=>u.startsWith('https://www.pokearena2d.com/'));
  assert.equal(site[1].headers['X-Torre2-Capture'],TOKEN);
  assert.equal(site[1].redirect,'error');
  assert.match(r.error,/HTTP 403 \(cf-ray=r1-IAD.*auth-header=sent\)/);
  assert.ok(!JSON.stringify(r).includes(TOKEN));
});
test('monitor sem segredo não envia cabeçalho extra',async()=>{
  const calls=[];
  await withToken(null,()=>probe(async(u,o)=>{calls.push(o);return res(403);},read));
  assert.ok(calls.every(o=>!o.headers||!('X-Torre2-Capture' in o.headers)));
});
test('preflight PMD envia o cabeçalho e relata Ray ID',async()=>{
  let opt;
  const r=await withToken(TOKEN,()=>publicPmdPreflight(async(u,o)=>{opt=o;return res(403,'',{'cf-ray':'r2-IAD'});}));
  assert.equal(opt.headers['X-Torre2-Capture'],TOKEN);
  assert.equal(opt.redirect,'error');
  assert.equal(r.cfRay,'r2-IAD');assert.equal(r.authHeader,'sent');
  assert.ok(!JSON.stringify(r).includes(TOKEN));
});
