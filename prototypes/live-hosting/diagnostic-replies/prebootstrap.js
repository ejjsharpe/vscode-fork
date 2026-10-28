// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root.
(async()=>{
 const req=process.getBuiltinModule('module').createRequire(process.cwd()+'/package.json');
 const assert=req('node:assert/strict'),{ipcMain}=req('electron');
 const life=req('./out/vs/base/parts/ipc/electron-main/prototypeLifetime.js');
 const c=replyProbe.service.prototypeWindows.get(100002).webContents;
 const channel='vscode:getDiagnosticInfoResponsePrebootstrapProbe',received=[];
 const listener=(event,data,nonce)=>received.push({senderMatches:event.sender===c,credentialType:typeof nonce,readyState:data.readyState});
 assert.equal(c.debugger.isAttached(),false);c.debugger.attach('1.3');
 ipcMain.on(channel,listener);let script;
 try {
  await c.debugger.sendCommand('Page.enable');
  script=await c.debugger.sendCommand('Page.addScriptToEvaluateOnNewDocument',{source:`document.addEventListener('DOMContentLoaded',()=>vscode.ipcRenderer.send('${channel}',{readyState:document.readyState}),{once:true});`});
  const before=life.prototypeDocumentGeneration(c);c.reload();
  const deadline=Date.now()+20000;
  while((!received.length||life.prototypeDocumentGeneration(c)===before||!life.prototypeLifecycleReady(c))&&Date.now()<deadline)await new Promise(r=>setTimeout(r,25));
  await new Promise(r=>setTimeout(r,200));
  assert.deepEqual(received,[{senderMatches:true,credentialType:'undefined',readyState:'interactive'}]);
  assert.equal(life.prototypeLifecycleReady(c),true);
  return {realWirePrebootstrapSend:true,received,noDelayedCredentialledReplay:true};
 } finally {
  if(script)await c.debugger.sendCommand('Page.removeScriptToEvaluateOnNewDocument',{identifier:script.identifier});
  c.debugger.detach();ipcMain.removeListener(channel,listener);
 }
})()
