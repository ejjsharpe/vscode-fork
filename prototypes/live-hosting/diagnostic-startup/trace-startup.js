// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root.
// THROWAWAY: actual replacement and IPC, synthetic remote authority only.
(async () => {
 const req=process.getBuiltinModule('module').createRequire(process.cwd()+'/package.json');
 const assert=req('node:assert/strict'),{ipcMain}=req('electron');
 const {DiagnosticsMainService}=req('./out/vs/platform/diagnostics/electron-main/diagnosticsMainService.js');
 const life=req('./out/vs/base/parts/ipc/electron-main/prototypeLifetime.js');
 const s=replyProbe.service,w=s.prototypeWindows.get(100002),c=w.webContents,neighbour=s.prototypeWindows.get(100001).webContents;
 const wait=ms=>new Promise(r=>setTimeout(r,ms));
 const until=async condition=>{const deadline=Date.now()+20000;while(!condition()&&Date.now()<deadline)await wait(5);assert.ok(condition(),'bounded readiness deadline');};
 const events=globalThis.diagnosticStartupEvents=[],channels=[];
 const onConsole=(_event,details,message)=>{const text=typeof details==='object'?details.message:message;if(text?.includes('[diagnostic-startup-trace]'))events.push({kind:'renderer',message:text,at:Date.now()});};
 c.on('console-message',onConsole);
 const proxy=new Proxy(w,{get(object,key){
  if(key==='remoteAuthority')return 'startup-probe';
  if(key==='send')return (channel,payload)=>{events.push({kind:'dispatch',at:Date.now()});channels.push(payload.replyChannel);object.send(channel,payload);};
  const value=Reflect.get(object,key,object);return typeof value==='function'?value.bind(object):value;
 }});
 const service=new DiagnosticsMainService({getWindows:()=>[proxy]}, {}, {trace(){},warn(){}});
 try {
  await until(()=>life.prototypeLifecycleReady(c));
  const before=life.prototypeDocumentGeneration(c),neighbourBefore=life.prototypeDocumentGeneration(neighbour);
  c.reload();
  await until(()=>life.prototypeDocumentGeneration(c)!==before&&life.prototypeLifecycleReady(c));
  events.push({kind:'lifecycle-ready',at:Date.now()});
  const first=await service.getRemoteDiagnostics({});events.push({kind:'first-outcome',at:Date.now(),result:first});
  await until(()=>events.some(e=>e.message?.includes('receiver installed')));
  const later=await service.getRemoteDiagnostics({});events.push({kind:'later-outcome',at:Date.now(),result:later});
  assert.match(later[0].errorMessage,/Unable to resolve connection/);
  assert.equal(life.prototypeDocumentGeneration(neighbour),neighbourBefore);
  assert.ok(channels.every(channel=>ipcMain.listenerCount(channel)===0));
  const passed=/Unable to resolve connection/.test(first[0].errorMessage);
  return {startupPassed:passed,events,remainingListeners:channels.map(channel=>ipcMain.listenerCount(channel)),neighbourUnchanged:true,syntheticRemoteAuthority:true};
 } finally {c.removeListener('console-message',onConsole);}
})()
