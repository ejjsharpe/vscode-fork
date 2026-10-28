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
  retryAtBootstrap={ready:w.isReady,generation:lifetime.prototypeDocumentGeneration(c)};
  w.send=function(channel,...args){if(channel==='vscode:onBeforeUnload'){request={channel,generation:lifetime.prototypeDocumentGeneration(c),loading:c.isLoading()};}return send.call(this,channel,...args);};
  s.close(w).then(()=>retryResult={resolved:true},e=>retryResult={resolved:false,error:String(e)});
 });
 c.reload();
 const originalOutcome=await original;
 await new Promise(r=>setTimeout(r,6000));
 w.send=send;
 const result={originalOutcome,retryAtBootstrap,request,retryResult,ready:w.isReady,loading:c.isLoading(),generation:lifetime.prototypeDocumentGeneration(c),pending:s.pendingProjectCloses.has(w.id),shell:await w.win.webContents.executeJavaScript('document.body.innerText'),requests:globalThis.replyProbe.requests,results:globalThis.replyProbe.results};
 globalThis.bootstrapRetryResult=result;
 return result;
})()
