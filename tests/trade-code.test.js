import test from 'node:test';
import assert from 'node:assert/strict';
import {encodeTradeCode,decodeTradeCode,canSend} from '../tools/pokearena/torre2-trade-code.js';
test('trade code round-trips and rejects tampering',()=>{
 const code=encodeTradeCode({id:'nidoran-f',level:23,shiny:true,from:'Ash <script>',tradeId:'abc123'});
 assert.match(code,/^T2P-[A-Za-z0-9_-]+-[a-z0-9]{4}$/);
 assert.deepEqual(decodeTradeCode(code),{tradeId:'abc123',id:'nidoran-f',level:23,shiny:true,from:'Ash script'});
 const parts=code.split('-');const body=parts.slice(1,-1).join('-');
 const tampered='T2P-'+body.slice(0,-2)+(body.at(-2)==='A'?'B':'A')+body.at(-1)+'-'+parts.at(-1);
 assert.equal(decodeTradeCode(tampered),null);
 assert.equal(decodeTradeCode('T2-abc-1234'),null,'trainer codes are not trade codes');
 assert.equal(decodeTradeCode(''),null);
});
test('cannot send the last team member',()=>{
 const s={team:[{uid:'a'}],box:[{uid:'b'}]};
 assert.equal(canSend(s,'a').ok,false);
 assert.deepEqual(canSend(s,'b'),{ok:true,where:'box',index:0});
 assert.equal(canSend({team:[{uid:'a'},{uid:'c'}],box:[]},'a').ok,true);
 assert.equal(canSend(s,'zz').ok,false);
});
