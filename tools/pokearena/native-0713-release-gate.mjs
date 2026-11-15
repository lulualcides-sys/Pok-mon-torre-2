// Original implementation: never call incomplete native assets "ready".
const SUPPORTED=Object.freeze({
 '0.70.0':Object.freeze({src:'src-3cc4979f18',forms:267}),
 '0.71.3':Object.freeze({src:'src-5ccc174cb8',forms:278})
});
export function verifyNativeVisualGate({alpha,src,forms,missing,unclearedRights=0,diagnostic=false}){
 const known=SUPPORTED[alpha];
 if(!known||src!==known.src)
  throw Error('Unverified native Alpha module fingerprint');
 if(forms!==known.forms)
  throw Error('Unexpected official form count: '+forms);
 if(!Number.isInteger(missing)||missing<0||missing>forms)
  throw Error('Invalid native missing form count');
 if(!Number.isInteger(unclearedRights)||unclearedRights<0||unclearedRights>forms)
  throw Error('Invalid native artwork rights count');
 if(unclearedRights&&!diagnostic)
  throw Error('Native release blocked: '+unclearedRights+' forms lack redistribution clearance');
 if(missing&&!diagnostic)
  throw Error('Native release blocked: '+missing+' forms lack artwork');
 return Object.freeze({alpha,src,forms,missing,
  unclearedRights,
  diagnosticOnly:missing>0||unclearedRights>0,
  releaseReady:missing===0&&unclearedRights===0});
}
