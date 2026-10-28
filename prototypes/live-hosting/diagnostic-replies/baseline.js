// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root.
// THROWAWAY: synthetic remote authority, real hosted renderers and actual IPC.
(async () => {
 const req=process.getBuiltinModule('module').createRequire(process.cwd()+'/package.json');
 const assert=req('node:assert/strict'),{ipcMain}=req('electron');
 const {DiagnosticsMainService}=req('./out/vs/platform/diagnostics/electron-main/diagnosticsMainService.js');
 const windows=[...replyProbe.service.prototypeWindows.values()];
 const target=windows.find(w=>w.id===100002),foreign=windows.find(w=>w.id===100001);
 const requests=[];
 const proxy=new Proxy(target,{get(object,key){
  if(key==='remoteAuthority')return 'diagnostic-probe';
  if(key==='sendWhenReady')return (channel,token,payload)=>requests.push({channel,payload});
  const value=Reflect.get(object,key,object);return typeof value==='function'?value.bind(object):value;
 }});
 const service=new DiagnosticsMainService({getWindows:()=>[proxy]}, {}, {trace(){}});
 const pending=service.getRemoteDiagnostics({});
 assert.equal(requests.length,1);
 const channel=requests[0].payload.replyChannel;
 await foreign.webContents.executeJavaScript(`vscode.ipcRenderer.send(${JSON.stringify(channel)}, {hostName:'foreign-forgery',errorMessage:'foreign accepted'})`);
 const result=await pending;
 assert.equal(result[0].hostName,'foreign-forgery');
 const timeout=service.getRemoteDiagnostics({});
 const timeoutChannel=requests[1].payload.replyChannel;
 const timedOut=await timeout;
 const leaked=ipcMain.listenerCount(timeoutChannel);
 assert.equal(leaked,1);
 // Only this disposable service owns this channel after the first request settled.
 ipcMain.removeAllListeners(timeoutChannel);
 return {syntheticRemoteAuthority:true,realWireForeignReply:true,result,timedOut,leakedAfterTimeout:leaked};
})()
