// Explicit pins are useful for isolating a visual regression from upstream
// releases. Invalid pins fail; never silently substitute a different client.
export function selectCaptureSource(html,inventory,pinned=''){
 const discovered=[...new Set([...html.matchAll(/src-[0-9a-f]{10}/g)].map(m=>m[0]))];
 if(pinned&&!/^src-[0-9a-f]{10}$/.test(pinned))throw Error('Invalid source version pin');
 const selected=pinned||discovered[0]||inventory;
 if(!selected)throw Error('No source version discovered');
 const pinnedHtml=pinned?html.replace(/src-[0-9a-f]{10}/g,pinned):html;
 return{discovered,inventory,selected,pinned:pinned||null,html:pinnedHtml};
}
