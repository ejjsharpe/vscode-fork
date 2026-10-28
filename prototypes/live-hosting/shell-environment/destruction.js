// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root.
// THROWAWAY: deliberately destroy a scratch renderer while resolution is pending.
(async()=>{
 const req=process.getBuiltinModule('module').createRequire(process.cwd()+'/package.json');
 const assert=req('node:assert/strict'),{ipcMain}=req('electron');
 const {CodeApplication}=req('./out/vs/code/electron-main/app.js');
 const life=req('./out/vs/base/parts/ipc/electron-main/prototypeLifetime.js');
 const s=replyProbe.service,w=s.prototypeWindows.get(100002),c=w.webContents,n=s.prototypeWindows.get(100000).webContents;
 const original=CodeApplication.prototype.resolveShellEnvironment,handler=ipcMain._invokeHandlers.get('vscode:fetchShellEnv');
 let release;const outcomes=[];
 CodeApplication.prototype.resolveShellEnvironment=async function(){return new Promise(r=>release=r);};
 ipcMain.removeHandler('vscode:fetchShellEnv');ipcMain.handle('vscode:fetchShellEnv',async(event,...args)=>{try{const r=await handler(event,...args);outcomes.push('resolved');return r;}catch(error){outcomes.push(error.message);throw error;}});
 try{
  const generation=life.prototypeDocumentGeneration(n);
  await c.executeJavaScript(`vscode.ipcRenderer.invoke('vscode:fetchShellEnv').catch(()=>{});true`);
  for(let i=0;!release&&i<200;i++)await new Promise(r=>setTimeout(r,10));assert.ok(release);
  c.close({waitForBeforeUnload:false});
  for(let i=0;!c.isDestroyed()&&i<500;i++)await new Promise(r=>setTimeout(r,10));
  assert.ok(c.isDestroyed());release({PROTOTYPE_ENV:'expired'});
  for(let i=0;!outcomes.length&&i<200;i++)await new Promise(r=>setTimeout(r,10));
  assert.deepEqual(outcomes,['Shell environment request interrupted']);assert.equal(life.prototypeDocumentGeneration(n),generation);
  return {realDestruction:true,injectedResolverDelay:true,outcomes,neighbourUnchanged:true,logicalCloseAcceptance:false};
 }finally{if(release)release({});CodeApplication.prototype.resolveShellEnvironment=original;ipcMain.removeHandler('vscode:fetchShellEnv');ipcMain.handle('vscode:fetchShellEnv',handler);}
})()
