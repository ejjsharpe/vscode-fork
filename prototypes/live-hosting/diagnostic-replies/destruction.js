// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root.
// Run last: deliberately destroys one disposable project view with no unsaved work.
(async()=>{
 const req=process.getBuiltinModule('module').createRequire(process.cwd()+'/package.json');
 const assert=req('node:assert/strict'),{ipcMain}=req('electron');
 const {DiagnosticsMainService}=req('./out/vs/platform/diagnostics/electron-main/diagnosticsMainService.js');
 const life=req('./out/vs/base/parts/ipc/electron-main/prototypeLifetime.js');
 const s=replyProbe.service,w=s.prototypeWindows.get(100002),c=w.webContents,neighbour=s.prototypeWindows.get(100001).webContents;
 const host=w.win,neighbourBefore=life.prototypeDocumentGeneration(neighbour);let channel;
 const proxy=new Proxy(w,{get(object,key){
  if(key==='remoteAuthority')return 'diagnostic-probe';
  if(key==='send')return (_channel,payload)=>channel=payload.replyChannel;
  const value=Reflect.get(object,key,object);return typeof value==='function'?value.bind(object):value;
 }});
 const service=new DiagnosticsMainService({getWindows:()=>[proxy]},{},{trace(){},warn(){}});
 const pending=service.getRemoteDiagnostics({});assert.ok(channel);
 c.close({waitForBeforeUnload:false});
 const result=await pending;assert.match(result[0].errorMessage,/interrupted/);
 assert.equal(ipcMain.listenerCount(channel),0);assert.equal(neighbour.isDestroyed(),false);
 assert.equal(life.prototypeDocumentGeneration(neighbour),neighbourBefore);
 assert.equal(host.isDestroyed(),false);
 return {realViewDestruction:true,syntheticRemoteAuthority:true,bypassedSafeguardsForDestructionProbe:true,result,remainingListener:ipcMain.listenerCount(channel),neighbourGenerationUnchanged:true,hostDestroyed:host.isDestroyed()};
})()
