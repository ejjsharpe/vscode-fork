// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root.
// THROWAWAY: actual auxiliary IPC, controlled resolver returning a harmless sentinel.
(async()=>{
 const req=process.getBuiltinModule('module').createRequire(process.cwd()+'/package.json');
 const assert=req('node:assert/strict'),{BrowserWindow}=req('electron');
 const {CodeApplication}=req('./out/vs/code/electron-main/app.js');
 const original=CodeApplication.prototype.resolveShellEnvironment;let calls=0;
 CodeApplication.prototype.resolveShellEnvironment=async function(){calls++;return {PROTOTYPE_ENV:'sentinel'};};
 const aux=new BrowserWindow({show:false,webPreferences:{sandbox:true,contextIsolation:true,preload:process.cwd()+'/out/vs/base/parts/sandbox/electron-browser/preload-aux.js'}});
 try {
  await aux.loadURL('about:blank');
  const result=await aux.webContents.executeJavaScript(`vscode.ipcRenderer.invoke('vscode:fetchShellEnv').then(value=>({receivedSentinel:value.PROTOTYPE_ENV==='sentinel'}),error=>({rejected:true}))`);
  assert.equal(result.receivedSentinel,true);assert.equal(calls,1);
  return {unregisteredAuxiliary:true,realWire:true,controlledResolver:true,receivedSentinel:true,resolverCalls:calls};
 } finally {aux.destroy();CodeApplication.prototype.resolveShellEnvironment=original;}
})()
