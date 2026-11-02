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
