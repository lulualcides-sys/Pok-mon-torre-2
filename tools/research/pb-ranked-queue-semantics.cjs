'use strict';
// Read public JavaScript to compare menu and queue language, storing metadata only.
const fs=require('node:fs'),crypto=require('node:crypto');
const ROOT='https://ranked.pokemonbattlegrounds.com';
const urls=['/app.js','/bundles/03413a73844b301c.js'];
const patterns=[
['practiceBot',/practice\s*(?:vs|v\.?s\.?)?\s*bot/ig],
['unrankedBattle',/find\s+unranked\s+battle/ig],
['practiceLevels',/pracLevels/ig],
['serverFull',/the server is full right now/ig],
['queueBot',/bot\s+level\s+1/ig],
['queueLabelUnranked',/unranked/ig],
['queueLabelPractice',/practice/ig],
['playerVsBot',/vsbot|practicebot|botpractice|botLevel|botDifficulty|practiceMode|practiceLevel|practiceDifficulty/ig],
['findMatch',/findMatch|startMatch|joinMatch|queueMatch|startPractice|beginPractice|joinQueue|queueForMatch/ig]
];
const output={date:new Date().toISOString(),files:[],method:'Public JS string/identifier search. This index does not prove runtime routing/queue semantics.',warnings:['No game source or art is stored','Neither an unranked UI chip nor the Practice button establishes opponent type; verify battle or server-side protocol','Source snippets are deliberately omitted']};
for(const path of urls){
 const response=await fetch(ROOT+path,{signal:AbortSignal.timeout(50000)});
 if(!response.ok)throw Error(path+': '+response.status);
 const js=await response.text();if(js.length>15000000)throw Error('Unexpectedly large file');
 const lineBreaks=[];for(let i=0;i<js.length;i++)if(js[i]==='\n')lineBreaks.push(i);
 const result={url:ROOT+path,size:js.length,sha256:crypto.createHash('sha256').update(js).digest('hex'),patterns:{}};
 for(const [key,regex] of patterns){
   const hits=[];for(const m of js.matchAll(regex)){const idx=m.index;if(hits.length>=80)break;
     const left=js.slice(Math.max(0,idx-300),idx),right=js.slice(idx+m[0].length,idx+m[0].length+300);
     const classNames=[...new Set([...left.matchAll(/\b(?:function|class|const|let)\s+([A-Za-z_$][\w$]{1,60})/g)].map(m=>m[1]))].slice(-8);
     const varHints=[...new Set([...right.matchAll(/\b(?:botLevel|practice|unranked|queue|bot|level|ranked|mode|matchType|matchmaking|difficulty|activeMatch)\b/ig)].map(m=>m[0]))].slice(0,12);
     const sameWindow={practice:/practice/i.test(left+right),unranked:/unranked/i.test(left+right),bot:/\bbot\b|botLevel|practicebot/i.test(left+right),queue:/queue|finding an opponent|server full/i.test(left+right)};
     hits.push({offset:idx,line:1+lineBreaks.filter(p=>p<idx).length,nearestDecl:classNames,varHints,sameWindow});
   }result.patterns[key]={count: hits.length===80?'80+':hits.length,hits:hits.slice(0,25)};
 }
 output.files.push(result);
 console.log('STATUS',path,js.length,JSON.stringify(Object.fromEntries(Object.entries(result.patterns).map(([k,v])=>[k,v.count]))));
}
fs.mkdirSync('reference-library/pb-ranked',{recursive:true});
fs.writeFileSync('reference-library/pb-ranked/SEMANTICA-FILA-PRACTICE-VS-UNRANKED.json',JSON.stringify(output,null,2)+'\n');
console.log('Saved metadata, no JS source included');
