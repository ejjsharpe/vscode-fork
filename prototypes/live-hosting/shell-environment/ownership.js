// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root.
// THROWAWAY: real IPC plus explicit main-handler injection; no environment values leave the process.
(async()=>{
 const req=process.getBuiltinModule('module').createRequire(process.cwd()+'/package.json');
 const assert=req('node:assert/strict'),{BrowserWindow,ipcMain}=req('electron');
 const {CodeApplication}=req('./out/vs/code/electron-main/app.js');
 const life=req('./out/vs/base/parts/ipc/electron-main/prototypeLifetime.js');
 const windows=[...replyProbe.service.prototypeWindows.values()];const w=windows.find(w=>w.id===100002),c=w.webContents;
 const original=CodeApplication.prototype.resolveShellEnvironment,handler=ipcMain._invokeHandlers.get('vscode:fetchShellEnv');
 let calls=0,captured;const selected=[];
 const wrapped=async(event,...args)=>{captured={event,args};return handler(event,...args);};
 ipcMain.removeHandler('vscode:fetchShellEnv');ipcMain.handle('vscode:fetchShellEnv',wrapped);
 CodeApplication.prototype.resolveShellEnvironment=async function(args,env){calls++;selected.push({ownArgs:windows.some(w=>w.config===args),ownEnv:env.PROTOTYPE_ENV});return {PROTOTYPE_ENV:env.PROTOTYPE_ENV};};
 const aux=new BrowserWindow({show:false,webPreferences:{sandbox:true,contextIsolation:true,preload:process.cwd()+'/out/vs/base/parts/sandbox/electron-browser/preload-aux.js'}});
 const saved=windows.map(w=>[w,w.config.userEnv.PROTOTYPE_ENV]);
 try {
  for(const target of windows){target.config.userEnv.PROTOTYPE_ENV=String(target.id);const result=await target.webContents.executeJavaScript(`vscode.ipcRenderer.invoke('vscode:fetchShellEnv').then(x=>x.PROTOTYPE_ENV)`);assert.equal(result,String(target.id));}
  assert.equal(calls,3);assert.ok(selected.every(x=>x.ownArgs));
  const own=captured;const before=calls;
  await aux.loadURL('about:blank');
  assert.equal(await aux.webContents.executeJavaScript(`vscode.ipcRenderer.invoke('vscode:fetchShellEnv').then(()=>false,()=>true)`),true);
  assert.equal(await c.executeJavaScript(`vscode.ipcRenderer.invoke('vscode:fetchShellEnv','extra').then(()=>false,()=>true)`),true);
  for(const credential of [undefined,'guessed'])await assert.rejects(handler(own.event,credential),/unauthorized/);
  await assert.rejects(handler({sender:windows[1].webContents,senderFrame:windows[1].webContents.mainFrame},...own.args),/unauthorized/);
  await assert.rejects(handler({sender:c,senderFrame:null},...own.args),/unauthorized/);
  assert.equal(calls,before);
  return {realWireOwnProjectsAndAgents:3,ownConfigurationAndEnvironment:true,realWireUnregisteredAuxiliaryRejected:true,realWireExtraArgumentRejected:true,injectedMissingGuessedForeignFrameRejected:true,noUnauthorizedResolverCalls:true};
 }finally{aux.destroy();CodeApplication.prototype.resolveShellEnvironment=original;ipcMain.removeHandler('vscode:fetchShellEnv');ipcMain.handle('vscode:fetchShellEnv',handler);for(const [target,value] of saved){if(value===undefined)delete target.config.userEnv.PROTOTYPE_ENV;else target.config.userEnv.PROTOTYPE_ENV=value;}}
})()
