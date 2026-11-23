import test from 'node:test';
import assert from 'node:assert/strict';
import {getPublicClientResource} from '../tools/pokearena/public-client-http.mjs';

const ROOT='https://www.pokearena2d.com/';
const makeResponse=(status,body='OK',url=ROOT,type='text/html')=>({
  url,ok:status>=200&&status<300,status,
  headers:new Headers({'content-type':type,'content-length':String(Buffer.byteLength(body))}),
  arrayBuffer:async()=>Buffer.from(body)
});
test('ordinary public GET sends no custom user-agent, cookies or authentication',async()=>{
  let options;
  const got=await getPublicClientResource(ROOT,2048,async(u,o)=>{
    options=o;assert.equal(u,ROOT);return makeResponse(200,'<html>ok</html>');
  });
  assert.equal(got.data.toString(),'<html>ok</html>');
  assert.equal(options.credentials,'omit');
  assert.equal(options.headers,undefined);
  assert.equal(options.redirect,'follow');
});
test('403 is never bypassed or silently replaced',async()=>{
  let called=0;
  await assert.rejects(getPublicClientResource(ROOT,1024,async()=>{called++;return makeResponse(403)}),/HTTP 403/);
  assert.equal(called,1);
});
test('off-origin fetch is prohibited',async()=>{
  await assert.rejects(getPublicClientResource('https://example.com/file'),/Off-origin source request/);
});
test('cross-site redirects are prohibited',async()=>{
  await assert.rejects(getPublicClientResource(ROOT,1024,async()=>makeResponse(200,'x','https://evil.example/')),/Off-origin redirect/);
});
test('HTML returned in place of config.js is rejected',async()=>{
  await assert.rejects(getPublicClientResource(ROOT+'src-abcdef1234/config.js',1024,async()=>makeResponse(200,'<html></html>',ROOT+'src-abcdef1234/config.js')),/HTML fallback/);
});
test('size cap is enforced',async()=>{
  await assert.rejects(getPublicClientResource(ROOT,2,async()=>makeResponse(200,'12345')),/too large|exceeds cap/i);
});
test('real script content is accepted',async()=>{
  const p=ROOT+'src-abcdef1234/config.js';
  const body="const VERSION='0.67.0';";
  const got=await getPublicClientResource(p,1024,async()=>makeResponse(200,body,p,'text/javascript'));
  assert.equal(got.data.toString(),body);
});

// --- Autorização da captura (X-Torre2-Capture via segredo TORRE2_CAPTURE_TOKEN) ---
const TOKEN='t2cap_0123456789abcdefSECRET';
const withHeaders=(status,body,url,extra)=>{const r=makeResponse(status,body,url);for(const [k,v] of Object.entries(extra||{}))r.headers.set(k,v);return r;};
const noSleep=async()=>{};
test('sem segredo nenhum cabeçalho é enviado (comportamento anterior preservado)',async()=>{
  let options;
  await getPublicClientResource(ROOT,2048,async(u,o)=>{options=o;return makeResponse(200,'<html>ok</html>');},{env:{}});
  assert.equal(options.headers,undefined);
  assert.equal(options.redirect,'follow');
});
test('com segredo envia X-Torre2-Capture e não segue redirect automaticamente',async()=>{
  let options;
  await getPublicClientResource(ROOT,2048,async(u,o)=>{options=o;return makeResponse(200,'<html>ok</html>');},{env:{TORRE2_CAPTURE_TOKEN:TOKEN}});
  assert.deepEqual(options.headers,{'X-Torre2-Capture':TOKEN});
  assert.equal(options.redirect,'manual');
  assert.equal(options.credentials,'omit');
});
test('o token nunca aparece na mensagem de erro; diagnóstico traz Ray ID',async()=>{
  const err=await getPublicClientResource(ROOT,1024,async()=>withHeaders(403,'blocked',ROOT,{'cf-ray':'abc123-IAD',server:'cloudflare'}),{env:{TORRE2_CAPTURE_TOKEN:TOKEN}}).catch(e=>e);
  assert.match(err.message,/HTTP 403 \(cf-ray=abc123-IAD, server=cloudflare, cf-mitigated=-, auth-header=sent\)/);
  assert.ok(!err.message.includes(TOKEN));
});
test('token nunca é levado para outra origem por redirecionamento',async()=>{
  const calls=[];
  const r=await getPublicClientResource(ROOT,1024,async(u,o)=>{calls.push(u);return withHeaders(302,'',u,{location:'https://evil.example/x'});},{env:{TORRE2_CAPTURE_TOKEN:TOKEN}}).catch(e=>e);
  assert.match(r.message,/Off-origin redirect/);
  assert.deepEqual(calls,[ROOT]);
});
test('redirecionamento na mesma origem é seguido mantendo o cabeçalho',async()=>{
  const seen=[];
  const target=ROOT+'index.html';
  const got=await getPublicClientResource(ROOT,1024,async(u,o)=>{seen.push([u,o.headers['X-Torre2-Capture']]);
    return u===ROOT?withHeaders(301,'',u,{location:'/index.html'}):makeResponse(200,'<html>x</html>',target);},{env:{TORRE2_CAPTURE_TOKEN:TOKEN}});
  assert.equal(got.url,target);
  assert.deepEqual(seen,[[ROOT,TOKEN],[target,TOKEN]]);
});
test('erros temporários (503/rede) têm novas tentativas; 403 não',async()=>{
  let n=0;
  const got=await getPublicClientResource(ROOT,1024,async()=>{n++;if(n===1)throw Error('ECONNRESET');if(n===2)return makeResponse(503,'x');return makeResponse(200,'<html>ok</html>');},{env:{},sleep:noSleep});
  assert.equal(n,3);assert.equal(got.data.toString(),'<html>ok</html>');
  let m=0;
  await assert.rejects(getPublicClientResource(ROOT,1024,async()=>{m++;return makeResponse(403);},{env:{TORRE2_CAPTURE_TOKEN:TOKEN},sleep:noSleep}),/HTTP 403/);
  assert.equal(m,1);
});
test('segredo malformado é recusado sem ser impresso',async()=>{
  const bad='tem espaço e curto';
  const err=await getPublicClientResource(ROOT,1024,async()=>makeResponse(200,'x'),{env:{TORRE2_CAPTURE_TOKEN:bad}}).catch(e=>e);
  assert.match(err.message,/TORRE2_CAPTURE_TOKEN inválido/);
  assert.ok(!err.message.includes(bad));
});
