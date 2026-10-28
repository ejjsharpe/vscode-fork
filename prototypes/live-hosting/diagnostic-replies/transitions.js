// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root.
(async()=>{
 const req=process.getBuiltinModule('module').createRequire(process.cwd()+'/package.json');
 const assert=req('node:assert/strict'),{ipcMain,BrowserWindow}=req('electron');
 const {DiagnosticsMainService}=req('./out/vs/platform/diagnostics/electron-main/diagnosticsMainService.js');
 const life=req('./out/vs/base/parts/ipc/electron-main/prototypeLifetime.js');
 const w=replyProbe.service.prototypeWindows.get(100002),c=w.webContents;
 const requests=[],rejected=[];let release;
 const wait=ms=>new Promise(r=>setTimeout(r,ms));
 const until=async condition=>{const end=Date.now()+20000;while(!condition()&&Date.now()<end)await wait(25);assert.ok(condition());};
 const proxy=new Proxy(w,{get(object,key){
  if(key==='remoteAuthority')return 'diagnostic-probe';
  if(key==='send')return (channel,payload)=>requests.push({channel,payload});
  const value=Reflect.get(object,key,object);return typeof value==='function'?value.bind(object):value;
 }});
 const service=new DiagnosticsMainService({getWindows:()=>[proxy]},{resolveLocalWorkspace:()=>new Promise(r=>release=r)},{trace(){},warn(message){rejected.push(message);}});
 assert.ok(w.openedWorkspace.configPath);
 const before=life.prototypeDocumentGeneration(c);
 const preparation=service.getRemoteDiagnostics({includeWorkspaceMetadata:true});
 assert.ok(release);assert.equal(requests.length,0);
 c.reload();await until(()=>life.prototypeDocumentGeneration(c)!==before);
 release({folders:[]});const interrupted=await preparation;
 assert.match(interrupted[0].errorMessage,/interrupted/);assert.equal(requests.length,0);
 await until(()=>life.prototypeLifecycleReady(c));

 const pending=service.getRemoteDiagnostics({}),channel=requests.at(-1).payload.replyChannel;
 const aux=new BrowserWindow({show:false,webPreferences:{sandbox:true,contextIsolation:true,preload:process.cwd()+'/out/vs/base/parts/sandbox/electron-browser/preload-aux.js'}});
 try {
  await aux.loadURL('about:blank');
  await aux.webContents.executeJavaScript(`vscode.ipcRenderer.send(${JSON.stringify(channel)},{hostName:'aux-forgery'},'guessed')`);
  await wait(100);assert.equal(ipcMain.listenerCount(channel),1);assert.equal(rejected.length,1);
  await c.executeJavaScript(`vscode.ipcRenderer.send(${JSON.stringify(channel)},{hostName:'own-control',errorMessage:'expected'})`);
  assert.equal((await pending)[0].hostName,'own-control');assert.equal(ipcMain.listenerCount(channel),0);
 } finally {aux.destroy();}
 return {syntheticRemoteAuthority:true,metadataPreparation:{injectedDelay:true,realReplacement:true,dispatches:0,result:interrupted},auxiliary:{realWire:true,isolatedAuxiliaryPreloadWindow:true,registeredAppAuxiliary:false,foreignReplyRejected:true,legitimateWaitPreserved:true},remainingListeners:requests.reduce((n,r)=>n+ipcMain.listenerCount(r.payload.replyChannel),0)};
})()
