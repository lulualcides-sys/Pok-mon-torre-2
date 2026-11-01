import test from 'node:test';
import assert from 'node:assert/strict';
import {selectCaptureSource} from '../tools/pokearena/capture-source-selection.mjs';
const html='<script src="src-2755ffa8ef/main.js"></script>';
test('capture defaults to the verified client and makes upstream audits explicit',()=>{
 assert.equal(selectCaptureSource(html,'src-3a160064ab').selected,'src-97f03e6e1b');
 assert.equal(selectCaptureSource(html,'src-3a160064ab','latest').selected,'src-2755ffa8ef');
 const pinned=selectCaptureSource(html,'src-3a160064ab','src-97f03e6e1b');
 assert.equal(pinned.selected,'src-97f03e6e1b');
 assert.deepEqual(pinned.discovered,['src-2755ffa8ef']);
 assert.equal(pinned.html,'<script src="src-97f03e6e1b/main.js"></script>');
 assert.throws(()=>selectCaptureSource(html,null,'../../other'));
});
