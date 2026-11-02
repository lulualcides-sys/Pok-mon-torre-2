// Fail closed on missing boot modules; retry only files essential to Phaser.
// Pure dependency injection keeps network errors testable without the public site.
const REQUIRED=Object.freeze([
  'main.js','config.js','datos.js','sprites.js',
  'escenas/carga.js','escenas/titulo.js','escenas/seleccion.js',
  'escenas/combate.js','escenas/pokedex.js','escenas/jefe.js'
]);
export function requiredCaptureFiles(version){
  if(!/^src-[0-9a-f]{10}$/.test(version||''))
    throw new Error('Missing or invalid versioned Phaser source directory');
  return REQUIRED.map(name=>version+'/'+name);
}
export function missingCaptureFiles(version,captured){
  const files=captured instanceof Set?captured:new Set(captured);
  return requiredCaptureFiles(version).filter(name=>!files.has(name));
}
export async function recoverCriticalCapture({
  version,captured,fetchFile,saveFile,maxAttempts=3,wait=async()=>{}
}){
  if(!Number.isInteger(maxAttempts)||maxAttempts<1)
    throw new Error('Invalid retry count');
  const recovered=[];
  for(const name of missingCaptureFiles(version,captured)){
    let failure;
    for(let attempt=1;attempt<=maxAttempts;attempt++){
      try{
        const response=await fetchFile(name);
        if(!response?.data?.length)throw new Error('Empty critical module');
        await saveFile(name,response);
        captured.add(name);
        recovered.push({path:name,attempts:attempt});
        failure=null;
        break;
      }catch(error){
        failure=error;
        if(attempt<maxAttempts)await wait(attempt*1000);
      }
    }
    if(failure)throw new Error(
      'Critical Phaser client module unavailable: '+name+
      ' after '+maxAttempts+' attempts: '+String(failure?.message||failure)
    );
  }
  return recovered;
}

// A missing transitive ES module can break Phaser boot even when all nine
// entry modules were captured. Do not treat optional images as boot blockers.
export function unresolvedImportedModules(unavailable,captured){
  const present=captured instanceof Set?captured:new Set(captured);
  return [...new Set(unavailable
    .filter(item=>item.source==='relative module import'&&
      typeof item.path==='string'&&item.path.endsWith('.js')&&
      !present.has(item.path))
    .map(item=>item.path))];
}
