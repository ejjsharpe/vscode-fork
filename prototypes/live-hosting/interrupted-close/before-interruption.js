// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root.
(async()=>{
 const req=process.getBuiltinModule('module').createRequire(process.cwd()+'/package.json'),assert=req('node:assert/strict');
 const s=globalThis.replyProbe.service,w=(s.prototypeWindows.get(100003)??s.prototypeWindows.get(100002)),host=w.win;
 const lifetime=req('./out/vs/base/parts/ipc/electron-main/prototypeLifetime.js');
 const before={id:w.id,ready:w.isReady,generation:lifetime.prototypeDocumentGeneration(w.webContents),contents:w.webContents.id};
 assert.equal(before.ready,true);
 const send=w.send;
 let request,entered;
 const atBefore=new Promise(resolve=>entered=resolve);
 // Hold delivery of the real before-unload request; no approval or veto is fabricated.
 w.send=function(channel,...args){if(channel==='vscode:onBeforeUnload'){request=args[0];entered();}else{return send.call(this,channel,...args);}};
 let notifications=0;w.onDidClose(()=>notifications++);
 const first=s.close(w),second=s.close(w);
 const coalesced=first===second;
 await atBefore;w.send=send;
 const contents=w.webContents;
 contents.reload();
 const outcomes=await Promise.all([first,second].map(p=>p.then(()=>({resolved:true}),error=>({resolved:false,error:String(error)}))));
 const shell=await host.webContents.executeJavaScript('document.body.innerText');
 const result={before,coalesced,outcomes,notifications,registered:s.prototypeWindows.has(w.id),logicalDisposed:w.logicalDisposed,closePending:w.closePending,shell,requests:globalThis.replyProbe.requests,results:globalThis.replyProbe.results};
 globalThis.interruptionResult=result;
 assert.equal(result.registered,true);
 assert.equal(result.notifications,0);
 assert.equal(result.outcomes.every(outcome=>!outcome.resolved),true,'Interrupted Close must not resolve as successful completion or a genuine safeguard veto');
 assert.equal(shell.includes('Close cancelled'),false,'An interrupted document is not a genuine safeguard cancellation');
 return result;
})()
