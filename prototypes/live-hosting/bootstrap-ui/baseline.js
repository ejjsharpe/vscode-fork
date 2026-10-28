// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root.
// THROWAWAY: actual auxiliary IPC and injected stale zoom event.
(async()=>{
 const req=process.getBuiltinModule('module').createRequire(process.cwd()+'/package.json');
 const assert=req('node:assert/strict'),{BrowserWindow,ipcMain}=req('electron');
 const w=replyProbe.service.prototypeWindows.get(100002),c=w.webContents;
 const aux=new BrowserWindow({show:false,webPreferences:{sandbox:true,contextIsolation:true,preload:process.cwd()+'/out/vs/base/parts/sandbox/electron-browser/preload-aux.js'}});
 const original=w.customZoomLevel;
 try{
  await aux.loadURL('about:blank');
  await aux.webContents.executeJavaScript(`vscode.ipcRenderer.send('vscode:openDevTools');true`);
  const deadline=Date.now()+5000;while(!aux.webContents.isDevToolsOpened()&&Date.now()<deadline)await new Promise(r=>setTimeout(r,20));
  assert.equal(aux.webContents.isDevToolsOpened(),true);
  const handler=ipcMain._invokeHandlers.get('vscode:notifyZoomLevel');
  await handler({sender:c,senderFrame:c.mainFrame},2,'invalid-document');
  assert.equal(w.customZoomLevel,2);
  await c.executeJavaScript(`vscode.ipcRenderer.invoke('vscode:notifyZoomLevel','not-a-number')`);
  assert.equal(w.customZoomLevel,'not-a-number');
  return {realWireUnregisteredAuxiliaryOpenedDevTools:true,injectedInvalidCredentialChangedZoom:true,realWireInvalidZoomStored:true};
 }finally{w.customZoomLevel=original;aux.destroy();}
})()
