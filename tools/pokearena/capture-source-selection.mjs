// The patch set and approved native HUD target this verified module version.
// Upstream discovery is opt-in for compatibility audits, never a surprise
// production upgrade. Shared unversioned assets remain independently checked.
export const APPROVED_CLIENT_SOURCE='src-97f03e6e1b';
export function selectCaptureSource(html,inventory,pinned=APPROVED_CLIENT_SOURCE){
 if(pinned==='latest')pinned='';
 const discovered=[...new Set([...html.matchAll(/src-[0-9a-f]{10}/g)].map(m=>m[0]))];
 if(pinned&&!/^src-[0-9a-f]{10}$/.test(pinned))throw Error('Invalid source version pin');
 const selected=pinned||discovered[0]||inventory;
 if(!selected)throw Error('No source version discovered');
 const pinnedHtml=pinned?html.replace(/src-[0-9a-f]{10}/g,pinned):html;
 return{discovered,inventory,selected,pinned:pinned||null,html:pinnedHtml};
}

// Verify the approved immutable client BEFORE requesting the large asset graph.
// Never silently replace it with the upstream homepage's newer version.
export async function preflightPinnedSource(version,fetchModule,{
 attempts=2,wait=ms=>new Promise(resolve=>setTimeout(resolve,ms))
}={}){
 if(!/^src-[0-9a-f]{10}$/.test(version||''))
  throw Error('Invalid pinned Phaser source');
 if(!Number.isInteger(attempts)||attempts<1||attempts>5)
  throw Error('Invalid preflight retry count');
 const path=version+'/config.js';
 let lastError;
 for(let attempt=1;attempt<=attempts;attempt++){
  try{
   const response=await fetchModule(path);
   if(!response?.data?.length)throw Error('Empty critical module');
   return {path,response};
  }catch(error){
   lastError=error;
   if(attempt<attempts)await wait(400*attempt);
  }
 }
 throw Error('Pinned Phaser source '+version+' unavailable; refusing automatic upstream version swap: '+String(lastError?.message||lastError));
}
