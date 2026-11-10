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
