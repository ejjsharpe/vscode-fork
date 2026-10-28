// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root.
// Disposable scheduling probe: no lifecycle approval, cancellation or completion is fabricated.
(async()=>{
 const req=process.getBuiltinModule('module').createRequire(process.cwd()+'/package.json'),assert=req('node:assert/strict');
 const s=globalThis.replyProbe.service,w=s.prototypeWindows.get(100002),c=w.webContents;
 const lifetime=req('./out/vs/base/parts/ipc/electron-main/prototypeLifetime.js');
 assert.equal(w.isReady,true);
 const send=w.send;let entered;
 const held=new Promise(r=>entered=r);
 w.send=function(channel,...args){if(channel==='vscode:onBeforeUnload'){entered();}else{return send.call(this,channel,...args);}};
 const first=s.close(w);const original=first.then(()=>({resolved:true}),e=>({resolved:false,error:String(e)}));
 await held;w.send=send;
 let retryAtBootstrap,retryResult={pending:true},request;
 c.once('dom-ready',()=>{
  retryAtBootstrap={ready:w.isReady,lifecycleReady:lifetime.prototypeLifecycleReady(c),generation:lifetime.prototypeDocumentGeneration(c)};
  w.send=function(channel,...args){if(channel==='vscode:onBeforeUnload'){request={channel,generation:lifetime.prototypeDocumentGeneration(c),loading:c.isLoading()};}return send.call(this,channel,...args);};
  const one=s.close(w),two=s.close(w),direct=w.disposePrototypeWorkbench();
  retryResult.samePromise=one===two && two===direct;
  const samePromise=retryResult.samePromise;
  Promise.allSettled([one,two,direct]).then(outcomes=>retryResult={samePromise,outcomes:outcomes.map(o=>({status:o.status,error:String(o.reason)}))});
 });
 c.reload();
 const originalOutcome=await original;
 await new Promise(r=>setTimeout(r,6000));
 w.send=send;
 const result={originalOutcome,retryAtBootstrap,request,retryResult,ready:w.isReady,loading:c.isLoading(),generation:lifetime.prototypeDocumentGeneration(c),pending:s.pendingProjectCloses.has(w.id),shell:await w.win.webContents.executeJavaScript('document.body.innerText'),requests:globalThis.replyProbe.requests,results:globalThis.replyProbe.results};
 globalThis.bootstrapRetryResult=result;
 assert.equal(result.retryAtBootstrap.lifecycleReady,false);
 assert.equal(result.request,undefined);
 assert.equal(result.retryResult.samePromise,true);
 assert.equal(result.retryResult.outcomes.length,3);
 for(const o of result.retryResult.outcomes){assert.equal(o.status,'rejected');assert.match(o.error,/Close interrupted/);}
 assert.equal(result.pending,false);
 assert.equal(lifetime.prototypeLifecycleReady(c),true);
 assert.equal(s.prototypeWindows.has(w.id),true);
 assert.match(result.shell,/Close interrupted/);
 return result;
})()
