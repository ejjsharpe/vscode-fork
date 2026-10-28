// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root.
// Invoke the real reuse/open caller during an approved reload's replacement bootstrap.
(async()=>{
 const req=process.getBuiltinModule('module').createRequire(process.cwd()+'/package.json'),assert=req('node:assert/strict');
 const s=globalThis.replyProbe.service,w=s.prototypeWindows.get(100002),c=w.webContents,windows=globalThis.readinessWindows;
 const lifetime=req('./out/vs/base/parts/ipc/electron-main/prototypeLifetime.js');
 const doOpen=windows.doOpenInBrowserWindow;let opens=0,atBootstrap;let completed;const done=new Promise(r=>completed=r);
 windows.doOpenInBrowserWindow=function(...args){opens++;return doOpen.apply(this,args);};
 c.once('dom-ready',async()=>{
  try {
   atBootstrap={ready:w.isReady,lifecycleReady:lifetime.prototypeLifecycleReady(c),generation:lifetime.prototypeDocumentGeneration(c)};
   assert.equal(atBootstrap.ready,false);assert.equal(atBootstrap.lifecycleReady,false);
   await s.reload(w);
   await windows.openInBrowserWindow({windowToUse:w,cli:{_:[]},workspace:w.openedWorkspace,userEnv:{}});
   await new Promise(r=>setTimeout(r,20));completed();
  } catch(error) {atBootstrap.error=String(error);completed();}
 });
 await s.reload(w);await done;const deadline=Date.now()+20000;while(!lifetime.prototypeLifecycleReady(c)&&Date.now()<deadline){await new Promise(r=>setTimeout(r,50));}windows.doOpenInBrowserWindow=doOpen;
 assert.equal(atBootstrap.error,undefined);assert.equal(opens,0);assert.equal(lifetime.prototypeLifecycleReady(c),true);
 return {atBootstrap,opens,ready:w.isReady,lifecycleReady:lifetime.prototypeLifecycleReady(c),windows:s.prototypeWindows.size,results:globalThis.replyProbe.results};
})()
