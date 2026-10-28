// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root.
// Real host cleanup completes for two workbenches, then the final document is replaced.
(async()=>{
 const req=process.getBuiltinModule('module').createRequire(process.cwd()+'/package.json'),assert=req('node:assert/strict');
 const s=globalThis.replyProbe.service,windows=[...s.prototypeWindows.values()],w=windows.at(-1),c=w.webContents,host=w.win;
 const lifetime=req('./out/vs/base/parts/ipc/electron-main/prototypeLifetime.js');
 let reached;const held=new Promise(r=>reached=r),send=w.send;
 w.send=function(channel,...args){if(channel==='vscode:onWillUnload'){reached();}else{return send.call(this,channel,...args);}};
 const hostAttempt=s.closePrototypeHost(host);await held;
 const close=s.close(w),outcome=close.then(()=>({ok:true}),e=>({ok:false,error:String(e)}));
 const completed=[...s.completedHostCleanup.keys()];
 w.send=send;c.reload();await hostAttempt;
 const result={completed,outcome:await outcome,hostAlive:!host.isDestroyed(),states:windows.map(x=>({id:x.id,failed:x.recoveryFailed,ready:lifetime.prototypeLifecycleReady(x.webContents)})),shell:await host.webContents.executeJavaScript('document.body.innerText')};
 assert.equal(result.outcome.ok,false);assert.match(result.outcome.error,/Close interrupted/);assert.deepEqual(completed,windows.slice(0,-1).map(x=>x.id));assert.equal(result.hostAlive,true);
 const phases=globalThis.replyProbe.requests.length;
 for(const x of windows.slice(0,-1)){await s.close(x);}
 result.completedCleanupReplay=globalThis.replyProbe.requests.length-phases;
 assert.equal(result.completedCleanupReplay,0);
 // Explicit Retry is a user action here, not automatic recovery on readiness.
 await w.destroyWindow(true,false);
 result.recovered=lifetime.prototypeLifecycleReady(w.webContents);assert.equal(result.recovered,true);
 await s.close(w);result.remaining=s.prototypeWindows.size;result.hostAliveAfterLastClose=!host.isDestroyed();
 assert.equal(result.remaining,0);return result;
})()
