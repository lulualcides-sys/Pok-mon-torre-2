import {createHash} from 'node:crypto';
/* Diagnostic data, not permission to apply speculative source rewrites. */
export function recordNativeAdapterMismatch({audit,filename,anchor,source,issues}){
 if(!audit)throw Error('Unrecognized upstream client in '+filename+': '+anchor.slice(0,60));
 if(!Array.isArray(issues)||typeof source!=='string'||typeof anchor!=='string'||
    !/^[a-z0-9_/-]+\.js$/.test(filename))throw Error('Invalid adapter drift evidence');
 issues.push({filename,expectedAnchor:anchor.slice(0,160),
  sourceSha256:createHash('sha256').update(source).digest('hex')});
 return true;
}
