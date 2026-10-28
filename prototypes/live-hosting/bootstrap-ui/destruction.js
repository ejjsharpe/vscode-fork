// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root.
// THROWAWAY: actual scratch-view destruction; synthetic late main events.
(async()=>{
 const req=process.getBuiltinModule('module').createRequire(process.cwd()+'/package.json'),assert=req('node:assert/strict'),{ipcMain}=req('electron');
 const life=req('./out/vs/base/parts/ipc/electron-main/prototypeLifetime.js');
 const w=replyProbe.service.prototypeWindows.get(100002),c=w.webContents,n=replyProbe.service.prototypeWindows.get(100000).webContents;
 const handler=ipcMain._invokeHandlers.get('vscode:notifyZoomLevel');let credential;
 ipcMain.removeHandler('vscode:notifyZoomLevel');ipcMain.handle('vscode:notifyZoomLevel',(event,...args)=>{credential=args[1];return handler(event,...args);});
 try{
  await c.executeJavaScript(`vscode.ipcRenderer.invoke('vscode:notifyZoomLevel',1)`);
  const generation=life.prototypeDocumentGeneration(n);c.close();const end=Date.now()+10000;
  while(!c.isDestroyed()&&Date.now()<end)await new Promise(r=>setTimeout(r,20));assert.equal(c.isDestroyed(),true);
  await assert.rejects(handler({sender:c,senderFrame:null},2,credential),/unauthorized/);
  assert.doesNotThrow(()=>{ipcMain.emit('vscode:openDevTools',{sender:c,senderFrame:null},credential);ipcMain.emit('vscode:toggleDevTools',{sender:c,senderFrame:null},credential);});
  assert.equal(life.prototypeDocumentGeneration(n),generation);
  return {realScratchRendererDestroyed:true,injectedLateZoomRejected:true,injectedLateDevToolsIgnoredWithoutThrow:true,agentsGenerationUnchanged:true,notLogicalDisposalAcceptance:true};
 }finally{ipcMain.removeHandler('vscode:notifyZoomLevel');ipcMain.handle('vscode:notifyZoomLevel',handler);}
})()
