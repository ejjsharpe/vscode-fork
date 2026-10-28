// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root.
(async()=>{
 const req=process.getBuiltinModule('module').createRequire(process.cwd()+'/package.json'),assert=req('node:assert/strict');
 const life=req('./out/vs/base/parts/ipc/electron-main/prototypeLifetime.js'),s=replyProbe.service,w=s.prototypeWindows.get(100002),c=w.webContents;
 const unload=s.unload,original=w.reload;let replacements=0;const failure=new Error('injected unload failure');
 w.reload=function(...args){replacements++;return original.apply(this,args);};s.unload=()=>Promise.reject(failure);
 try{
  const first=s.reload(w),second=s.reload(w);assert.equal(first,second);const outcomes=await Promise.allSettled([first,second]);
  assert.ok(outcomes.every(x=>x.status==='rejected'&&x.reason===failure));assert.equal(s.pendingProjectReloads.size,0);assert.equal(replacements,0);
  s.unload=unload;await s.reload(w);
  const deadline=Date.now()+20000;while(!life.prototypeLifecycleReady(c)&&Date.now()<deadline){await new Promise(r=>setTimeout(r,50));}
  assert.equal(replacements,1);assert.equal(life.prototypeLifecycleReady(c),true);
  return {injectedFailure:true,sharedPromise:first===second,outcomes:outcomes.map(x=>x.status),laterExplicitReplacements:replacements,ready:true,pending:s.pendingProjectReloads.size};
 }finally{s.unload=unload;w.reload=original;}
})()
