// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root.
// THROWAWAY: synthetic remote authority; real workbenches and IPC unless labelled injected.
(async () => {
 const req=process.getBuiltinModule('module').createRequire(process.cwd()+'/package.json');
 const assert=req('node:assert/strict'),{ipcMain}=req('electron');
 const {DiagnosticsMainService}=req('./out/vs/platform/diagnostics/electron-main/diagnosticsMainService.js');
 const life=req('./out/vs/base/parts/ipc/electron-main/prototypeLifetime.js');
 const s=replyProbe.service,w=s.prototypeWindows.get(100002),foreign=s.prototypeWindows.get(100001),c=w.webContents;
 const wait=ms=>new Promise(r=>setTimeout(r,ms));
 const until=async condition=>{const deadline=Date.now()+20000;while(!condition()&&Date.now()<deadline)await wait(25);assert.ok(condition());};
 await until(()=>w.isReady&&foreign.isReady&&life.prototypeLifecycleReady(c)&&life.prototypeLifecycleReady(foreign.webContents));
 const requests=[],warnings=[];
 let deliver=false,failSend=false,ready=true;
 const proxy=new Proxy(w,{get(object,key){
  if(key==='remoteAuthority')return 'diagnostic-probe';
  if(key==='isReady')return ready&&object.isReady;
  if(key==='send')return (channel,payload)=>{requests.push({channel,payload});if(failSend)throw new Error('injected send failure');if(deliver)object.send(channel,payload);};
  const value=Reflect.get(object,key,object);return typeof value==='function'?value.bind(object):value;
 }});
 const service=new DiagnosticsMainService({getWindows:()=>[proxy]}, {}, {trace(){},warn(message){warnings.push(message);}});
 const start=()=>{const pending=service.getRemoteDiagnostics({});return {pending,channel:requests.at(-1)?.payload.replyChannel};};
 const send=async (contents,channel,data,...extra)=>contents.executeJavaScript(`vscode.ipcRenderer.send(${JSON.stringify(channel)},${JSON.stringify(data)}${extra.map(x=>','+JSON.stringify(x)).join('')})`);
 const result=[];
 const own={hostName:'own-control',errorMessage:'controlled reply'};
 let op=start();
 await send(foreign.webContents,op.channel,{hostName:'foreign-forgery'});
 await send(c,op.channel,own,'extra');
 await wait(100);assert.equal(ipcMain.listenerCount(op.channel),1);
 await send(c,op.channel,own);
 assert.deepEqual(await op.pending,[own]);assert.equal(ipcMain.listenerCount(op.channel),0);
 result.push({case:'foreign and extra arguments rejected without consuming listener; own reply accepted',realWire:true});

 const a=start(),b=start();assert.notEqual(a.channel,b.channel);
 await send(c,b.channel,{...own,hostName:'second'});
 assert.equal(ipcMain.listenerCount(a.channel),1);
 await send(c,a.channel,{...own,hostName:'first'});
 assert.deepEqual((await Promise.all([a.pending,b.pending])).map(x=>x[0].hostName),['first','second']);
 await send(c,a.channel,{hostName:'duplicate'});
 assert.equal(ipcMain.listenerCount(a.channel),0);
 result.push({case:'concurrent operations use distinct channels and settle independently; duplicate ignored',realWire:true});

 op=start();let captured;
 const capture=(event,...args)=>{captured={event,nonce:args.at(-1)};};
 ipcMain.prependListener(op.channel,capture);
 try {
  await send(c,op.channel,own,'capture-only');await until(()=>!!captured);
  ipcMain.emit(op.channel,captured.event,own);
  ipcMain.emit(op.channel,captured.event,own,'guessed');
  ipcMain.emit(op.channel,{sender:c,senderFrame:null},own,captured.nonce);
  ipcMain.emit(op.channel,{sender:foreign.webContents,senderFrame:foreign.webContents.mainFrame},own,captured.nonce);
  assert.equal(ipcMain.listenerCount(op.channel),2);
  await send(c,op.channel,own);assert.deepEqual(await op.pending,[own]);
 } finally {ipcMain.removeListener(op.channel,capture);}
 result.push({case:'missing/guessed credential, non-main frame and wrong sender with copied credential rejected',injectedMainEvents:true});

 deliver=true;op=start();const noConnection=await op.pending;deliver=false;
 assert.match(noConnection[0].errorMessage,/Unable to resolve connection/);
 assert.equal(ipcMain.listenerCount(op.channel),0);
 result.push({case:'actual RemoteAgentDiagnosticListener replies without remote connection',realWire:true,result:noConnection});

 op=start();const timedOut=await op.pending;
 assert.match(timedOut[0].errorMessage,/could not be established/);assert.equal(ipcMain.listenerCount(op.channel),0);
 await send(c,op.channel,own);assert.equal(ipcMain.listenerCount(op.channel),0);
 result.push({case:'timeout removes listener; late reply ignored',realWire:true,result:timedOut});

 op=start();const before=life.prototypeDocumentGeneration(c),neighbourBefore=life.prototypeDocumentGeneration(foreign.webContents);
 c.reload();const interrupted=await op.pending;
 assert.match(interrupted[0].errorMessage,/interrupted/);assert.equal(ipcMain.listenerCount(op.channel),0);
 await until(()=>life.prototypeDocumentGeneration(c)!==before&&life.prototypeLifecycleReady(c));
 const next=start();
 ipcMain.emit(next.channel,{sender:c,senderFrame:c.mainFrame},own,captured.nonce);
 await send(c,op.channel,own);await wait(50);assert.equal(ipcMain.listenerCount(next.channel),1);
 await send(c,next.channel,own);assert.deepEqual(await next.pending,[own]);
 assert.equal(life.prototypeDocumentGeneration(foreign.webContents),neighbourBefore);
 result.push({case:'replacement interrupts old wait, expired credential and old channel cannot settle fresh wait; neighbour unchanged',unexpectedRealReplacement:true,expiredCredentialInjected:true,before,after:life.prototypeDocumentGeneration(c)});

 ready=false;const count=requests.length;const notReady=await service.getRemoteDiagnostics({});
 assert.match(notReady[0].errorMessage,/not ready/);ready=true;await wait(100);assert.equal(requests.length,count);
 result.push({case:'unready window returns error without queue or automatic replay',injectedReadiness:true});

 failSend=true;op=start();const failure=await op.pending;failSend=false;
 assert.match(failure[0].errorMessage,/Unable to request/);assert.equal(ipcMain.listenerCount(op.channel),0);
 result.push({case:'send exception removes listener and returns visible diagnostic error',injectedSendFailure:true});
 return {syntheticRemoteAuthority:true,remoteRuntimeTested:false,result,rejectionsLogged:warnings.length,remainingListeners:requests.reduce((n,r)=>n+ipcMain.listenerCount(r.payload.replyChannel),0)};
})()
