'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {retryable,PUBLIC_BASE}=require('../tools/dev/pages-public-503-retry.cjs');
const missing=[[503,PUBLIC_BASE+'src-616165d778/torre2/laboratory.js']];
const clean={missing,errors:[],failedRequests:[{url:missing[0][1],error:'net::ERR_ABORTED'}],
 failure:'TimeoutError: page.waitForFunction: Timeout 90000ms exceeded.'};
test('503 isolado permite SOMENTE nova execução completa',()=>{
 assert.equal(retryable([clean]),true);
 assert.equal(retryable([{missing,errors:[]}]),true);
});
test('ausência de diagnóstico ou múltiplos relatórios nunca autoriza retry',()=>{
 assert.equal(retryable([]),false);
 assert.equal(retryable([{},clean]),false);
 assert.equal(retryable([{missing:[],errors:[]}]),false);
});
test('404, 500, 503 externo e respostas mistas mantêm CI vermelha',()=>{
 for(const bad of [
  [[404,missing[0][1]]],
  [[500,missing[0][1]]],
  [[503,'https://example.org/torre2/laboratory.js']],
  [...missing,[404,PUBLIC_BASE+'assets/vfx/hilo.png']]
 ])assert.equal(retryable([{...clean,missing:bad}]),false);
});
test('erro Phaser ou requisição falha adicional não é mascarado',()=>{
 assert.equal(retryable([{...clean,errors:['Uncaught TypeError']}]),false);
 assert.equal(retryable([{...clean,failedRequests:[{url:PUBLIC_BASE+'other.js'}]}]),false);
 assert.equal(retryable([{...clean,failure:'AssertionError: incorrect slots'}]),false);
});
