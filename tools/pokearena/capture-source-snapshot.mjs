import {readFile} from 'node:fs/promises';
import {gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
export const SNAPSHOT_VERSION='src-97f03e6e1b';
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
export function parseClientSnapshot(bytes,version){
 const value=JSON.parse(gunzipSync(bytes,{maxOutputLength:4*1024*1024}).toString('utf8'));
 if(value.version!==version||value.source!=='https://www.pokearena2d.com')
  throw Error('Wrong captured client identity');
 const entries=Object.entries(value.files||{});
 if(entries.length<20||entries.length>200)throw Error('Incomplete client snapshot');
 for(const [file,entry]of entries){
  if(file!=='index.html'&&(!file.startsWith(version+'/')||
   !/^[a-zA-Z0-9_./-]+\.js$/.test(file)||file.split('/').includes('..')))
   throw Error('Unsafe captured module path');
  if(typeof entry.text!=='string'||hash(Buffer.from(entry.text))!==entry.sha256)
   throw Error('Captured module hash mismatch: '+file);
 }
 if(!value.files['index.html']?.text.includes(version+'/main.js'))
  throw Error('Captured homepage does not select its module version');
 return value;
}
export async function loadClientSnapshot(version){
 if(version!==SNAPSHOT_VERSION)return null;
 const bytes=await readFile(new URL('../../reference-assets/pokearena-client/source-'+version+'.json.gz',import.meta.url));
 return{...parseClientSnapshot(bytes,version),archiveSha256:hash(bytes)};
}
