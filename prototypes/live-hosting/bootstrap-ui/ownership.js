// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root.
// THROWAWAY: actual IPC controls plus explicitly injected credential/frame cases.
(async()=>{
 const req=process.getBuiltinModule('module').createRequire(process.cwd()+'/package.json');
 const assert=req('node:assert/strict'),{BrowserWindow,ipcMain}=req('electron');
 const windows=[...replyProbe.service.prototypeWindows.values()],w=windows.at(-1),c=w.webContents;
 const handler=ipcMain._invokeHandlers.get('vscode:notifyZoomLevel');
 const channels=['vscode:openDevTools','vscode:toggleDevTools'];
 const events=new Map();const listeners=channels.map(channel=>{const fn=(event,...args)=>events.set(channel,{event,args});ipcMain.on(channel,fn);return [channel,fn];});
 let zoom;ipcMain.removeHandler('vscode:notifyZoomLevel');ipcMain.handle('vscode:notifyZoomLevel',(event,...args)=>{zoom={event,args};return handler(event,...args);});
 const saved=windows.map(w=>[w,w.customZoomLevel]);
 const until=async predicate=>{const end=Date.now()+5000;while(!predicate()&&Date.now()<end)await new Promise(r=>setTimeout(r,20));assert.ok(predicate(),'bounded observed condition');};
 const aux=new BrowserWindow({show:false,webPreferences:{sandbox:true,contextIsolation:true,preload:process.cwd()+'/out/vs/base/parts/sandbox/electron-browser/preload-aux.js'}});
 try{
  for(const target of windows){
   await target.webContents.executeJavaScript(`vscode.ipcRenderer.invoke('vscode:notifyZoomLevel',1.5)`);assert.equal(target.customZoomLevel,1.5);
   await target.webContents.executeJavaScript(`vscode.ipcRenderer.invoke('vscode:notifyZoomLevel',undefined)`);assert.equal(target.customZoomLevel,undefined);
   await target.webContents.executeJavaScript(`vscode.ipcRenderer.send('vscode:openDevTools');true`);await until(()=>target.webContents.isDevToolsOpened());
   await target.webContents.executeJavaScript(`vscode.ipcRenderer.send('vscode:toggleDevTools');true`);await until(()=>!target.webContents.isDevToolsOpened());
  }
  const ownZoom=zoom,ownEvents=new Map(events);
  for(const value of ["'invalid'",'NaN','Infinity','null','{}'])assert.equal(await c.executeJavaScript(`vscode.ipcRenderer.invoke('vscode:notifyZoomLevel',${value}).then(()=>false,()=>true)`),true);
  assert.equal(await c.executeJavaScript(`vscode.ipcRenderer.invoke('vscode:notifyZoomLevel',2,'extra').then(()=>false,()=>true)`),true);
  assert.equal(w.customZoomLevel,undefined);
  for(const credential of [undefined,'guessed'])await assert.rejects(handler(ownZoom.event,2,credential),/unauthorized/);
  await assert.rejects(handler({sender:windows[0].webContents,senderFrame:windows[0].webContents.mainFrame},2,ownZoom.args[1]),/unauthorized/);
  await assert.rejects(handler({sender:c,senderFrame:null},2,ownZoom.args[1]),/unauthorized/);
  await aux.loadURL('about:blank');
  assert.equal(await aux.webContents.executeJavaScript(`vscode.ipcRenderer.invoke('vscode:notifyZoomLevel',2).then(()=>false,()=>true)`),true);
  // Count effects while rejecting real-wire extra arguments and auxiliary requests.
  const targets=[...windows.map(w=>w.webContents),aux.webContents],restore=[];let effects=0;
  for(const target of targets)for(const method of ['openDevTools','toggleDevTools']){restore.push([target,method,target[method]]);target[method]=()=>effects++;}
  try{
   for(const channel of channels){
    await c.executeJavaScript(`vscode.ipcRenderer.send('${channel}','extra');true`);
    await aux.webContents.executeJavaScript(`vscode.ipcRenderer.send('${channel}');true`);
    const own=ownEvents.get(channel);
    for(const credential of [undefined,'guessed'])ipcMain.emit(channel,own.event,credential);
    ipcMain.emit(channel,{sender:windows[0].webContents,senderFrame:windows[0].webContents.mainFrame},...own.args);
    ipcMain.emit(channel,{sender:c,senderFrame:null},...own.args);
   }
   // Invokes provide a real-wire round-trip barrier for each sender.
   await c.executeJavaScript(`vscode.ipcRenderer.invoke('vscode:notifyZoomLevel',undefined)`);
   await aux.webContents.executeJavaScript(`vscode.ipcRenderer.invoke('vscode:notifyZoomLevel',2).catch(()=>{})`);
   assert.equal(effects,0);
  }finally{for(const [target,method,original] of restore)target[method]=original;}
  return {realWireAgentsAndProjects:3,realDevToolsOpenAndToggle:true,realZoomNumberAndUndefined:true,realInvalidZoomRejected:5,realExtraArgumentsRejected:true,realUnregisteredAuxiliaryRejected:true,injectedMissingGuessedForeignFrameRejected:true,unauthorizedDevToolsEffects:0};
 }finally{aux.destroy();for(const [channel,fn] of listeners)ipcMain.removeListener(channel,fn);ipcMain.removeHandler('vscode:notifyZoomLevel');ipcMain.handle('vscode:notifyZoomLevel',handler);for(const [target,value] of saved){target.customZoomLevel=value;if(!target.webContents.isDestroyed())target.webContents.closeDevTools();}}
})()
