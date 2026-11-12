import test from 'node:test';
import assert from 'node:assert/strict';
import {removeOnlineChatPreservingNativeResize} from '../tools/pokearena/torre2-offline-chat-resize.mjs';

test('Alpha 0.70 offline Phaser resize remains callable after online chat removal',()=>{
 const native='import{iniciarChat,tecladoChat}from"./chat.js";'+
  'let resizes=0;const ajustar=()=>{if(tecladoChat())return;resizes++};';
 const patched=removeOnlineChatPreservingNativeResize(native);
 assert.doesNotMatch(patched,/import\{iniciarChat/);
 assert.match(patched,/const tecladoChat=\(\)=>false/);
 const count=Function(patched+'ajustar();ajustar();return resizes;')();
 assert.equal(count,2,'window resize must run even with online chat removed');
});
test('standalone solo bootstrap removes only approved chat imports',()=>{
 const source='import{iniciarChat,reservaChat,tecladoChat}from"./chat.js";'+
  'const ajustar=()=>{if(tecladoChat())return;return reservaChat()};';
 const patched=removeOnlineChatPreservingNativeResize(source);
 assert.match(patched,/const tecladoChat=\(\)=>false/);
 assert.match(patched,/return 0/);
 assert.doesNotMatch(patched,/import\{/);
});
test('unexpected future native chat API is rejected rather than silently dropped',()=>{
 assert.throws(()=>removeOnlineChatPreservingNativeResize(
  'import{iniciarChat,tecladoChat,importantGameplayThing}from"./chat.js";'+
  'const ajustar=()=>{if(tecladoChat())return;}'),/Unknown native chat import/);
 assert.throws(()=>removeOnlineChatPreservingNativeResize(
  'const ajustar=()=>{if(tecladoChat())return;}'),/import changed/);
 assert.throws(()=>removeOnlineChatPreservingNativeResize(
  'import{iniciarChat}from"./chat.js";'+
  'const ajustar=()=>{if(tecladoChat())return;}'),/predicate absent/);
});
