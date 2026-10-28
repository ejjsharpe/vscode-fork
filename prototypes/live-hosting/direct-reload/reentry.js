// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root.
(async()=>{
 const req=process.getBuiltinModule('module').createRequire(process.cwd()+'/package.json'),assert=req('node:assert/strict');
 const life=req('./out/vs/base/parts/ipc/electron-main/prototypeLifetime.js'),s=replyProbe.service,w=s.prototypeWindows.get(100002),c=w.webContents;
 const unload=s.unload;let joined,first;let calls=0;
 s.unload=function(...args){calls++;joined=s.reload(w);return unload.apply(this,args);};
 try{
  first=s.reload(w);const second=s.reload(w);assert.equal(first,second);await first;assert.equal(joined,first);assert.equal(calls,1);
  const deadline=Date.now()+20000;while(!life.prototypeLifecycleReady(c)&&Date.now()<deadline){await new Promise(r=>setTimeout(r,50));}
  assert.equal(life.prototypeLifecycleReady(c),true);assert.equal(s.pendingProjectReloads.size,0);
  return {sameScheduledPromise:first===second,sameReentrantPromise:first===joined,unloadCalls:calls,ready:true,pending:s.pendingProjectReloads.size};
 }finally{s.unload=unload;}
})()
