// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root.
// Hold a real will-unload delivery, then unexpectedly replace its document.
(async()=>{
 const req=process.getBuiltinModule('module').createRequire(process.cwd()+'/package.json'),assert=req('node:assert/strict');
 const s=globalThis.replyProbe.service,w=s.prototypeWindows.get(100001),c=w.webContents;
 const lifetime=req('./out/vs/base/parts/ipc/electron-main/prototypeLifetime.js');
 assert.equal(lifetime.prototypeLifecycleReady(c),true);
 const send=w.send;let reached;const held=new Promise(r=>reached=r);let notifications=0;const listener=w.onDidClose(()=>notifications++);
 w.send=function(channel,...args){if(channel==='vscode:onWillUnload'){reached();}else{return send.call(this,channel,...args);}};
 const first=s.close(w),second=w.disposePrototypeWorkbench();
 const outcomes=Promise.allSettled([first,second]);
 await held;w.send=send;c.reload();
 const settled=(await outcomes).map(o=>({status:o.status,error:String(o.reason)}));
 await new Promise(r=>setTimeout(r,5000));listener.dispose();
 for(const o of settled){assert.equal(o.status,'rejected');assert.match(o.error,/Close interrupted/);}
 assert.equal(first===second,true);assert.equal(notifications,0);assert.equal(s.prototypeWindows.has(w.id),true);assert.equal(s.pendingProjectCloses.has(w.id),false);assert.equal(lifetime.prototypeLifecycleReady(c),true);
 return {settled,samePromise:first===second,notifications,ready:lifetime.prototypeLifecycleReady(c),shell:await w.win.webContents.executeJavaScript('document.body.innerText'),results:globalThis.replyProbe.results};
})()
