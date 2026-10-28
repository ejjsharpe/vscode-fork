// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root.
// Disposable scheduling probe: all lifecycle replies come from real renderers.
(async()=>{
 const req=process.getBuiltinModule('module').createRequire(process.cwd()+'/package.json'),assert=req('node:assert/strict');
 const s=globalThis.replyProbe.service,w=s.prototypeWindows.get(100002),c=w.webContents,host=w.win;
 const lifetime=req('./out/vs/base/parts/ipc/electron-main/prototypeLifetime.js');
 const contexts=req('node:fs').readFileSync(JSON.parse(req('node:fs').readFileSync('prototypes/live-hosting/replacement-readiness/scratch/launch.json')).logFile,'utf8').match(/window:100002:document:\d+:connection:\d+/g);
 const oldContext=contexts.at(-1),generation=lifetime.prototypeDocumentGeneration(c);
 let state,done;const completed=new Promise(r=>done=r);
 c.once('dom-ready',async()=>{
  try {
   assert.equal(lifetime.prototypeLifecycleReady(c),false);
   assert.throws(()=>lifetime.markPrototypeLifecycleReady(oldContext),/revoked/);
   assert.equal(lifetime.prototypeLifecycleReady(c),false);
   const unload=await s.unload(w,3); assert.equal(unload,'interrupted');
   const hostAttempt=s.closePrototypeHost(host);
   const close=s.close(w),direct=w.disposePrototypeWorkbench();
   const outcomes=await Promise.allSettled([close,direct]); await hostAttempt;
   state={oldContext,generation,newGeneration:lifetime.prototypeDocumentGeneration(c),unload,samePromise:close===direct,outcomes:outcomes.map(o=>({status:o.status,error:String(o.reason)})),hostAlive:!host.isDestroyed(),count:s.prototypeWindows.size};
   assert.equal(state.samePromise,true);assert.equal(state.hostAlive,true);assert.equal(state.count,3);
   for(const o of state.outcomes){assert.equal(o.status,'rejected');assert.match(o.error,/Close interrupted/);}
   done();
  }catch(e){state={error:String(e),stack:e.stack};done();}
 });
 c.reload();await completed;await new Promise(r=>setTimeout(r,4500));
 state.laterReady=lifetime.prototypeLifecycleReady(c);state.pending=s.pendingProjectCloses.has(w.id);state.shell=await host.webContents.executeJavaScript('document.body.innerText');
 assert.equal(state.error,undefined);assert.equal(state.pending,false);assert.equal(state.laterReady,true);return state;
})()
