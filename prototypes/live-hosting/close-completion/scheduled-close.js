// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root.
(async()=>{
 const p=globalThis.recoveryProbe,s=p.service,w=s.prototypeWindows.get(100001);
 const req=process.getBuiltinModule('module').createRequire(process.cwd()+'/package.json'),assert=req('node:assert/strict');
 const original=s.onWillUnloadWindowInRenderer;
 let release,entered;
 const atCleanup=new Promise(resolve=>entered=resolve);
 s.onWillUnloadWindowInRenderer=async function(window,...args){
  const result=await original.call(this,window,...args);
  if(window===w){entered();await new Promise(resolve=>release=resolve);}
  return result;
 };
 let settled=false;
 const first=s.close(w);first.then(()=>settled=true,()=>settled=true);
 await atCleanup;
 const second=await new Promise(resolve=>setTimeout(()=>resolve({promise:s.close(w)}),0));
 const direct=w.disposePrototypeWorkbench();
 const pending={settled,sameClose:first===second.promise,sameDirect:first===direct,registered:s.prototypeWindows.has(w.id)};
 assert.deepEqual(pending,{settled:false,sameClose:true,sameDirect:true,registered:true});
 release();
 await Promise.all([first,second.promise,direct]);
 s.onWillUnloadWindowInRenderer=original;
 const count=s.windowCounter;
 await s.close(w);await w.disposePrototypeWorkbench();
 assert.equal(s.windowCounter,count);assert.equal(w.logicalDisposed,true);
 return {pending,completed:true,logicalDisposed:w.logicalDisposed,count,requests:globalThis.replyProbe.requests,results:globalThis.replyProbe.results};
})()
