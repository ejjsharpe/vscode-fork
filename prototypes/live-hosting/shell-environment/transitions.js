// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root.
// THROWAWAY: real document replacement with controlled async resolver delay.
(async()=>{
 const req=process.getBuiltinModule('module').createRequire(process.cwd()+'/package.json');
 const assert=req('node:assert/strict'),{ipcMain}=req('electron');
 const {CodeApplication}=req('./out/vs/code/electron-main/app.js');
 const life=req('./out/vs/base/parts/ipc/electron-main/prototypeLifetime.js');
 const c=replyProbe.service.prototypeWindows.get(100002).webContents,n=replyProbe.service.prototypeWindows.get(100001).webContents;
 const original=CodeApplication.prototype.resolveShellEnvironment,handler=ipcMain._invokeHandlers.get('vscode:fetchShellEnv');
 const outcomes=[];let hold=true,release,captured;
 const wait=ms=>new Promise(r=>setTimeout(r,ms));
 const until=async predicate=>{const end=Date.now()+35000;while(!predicate()&&Date.now()<end)await wait(20);assert.ok(predicate(),'bounded observed condition');};
 CodeApplication.prototype.resolveShellEnvironment=async function(){if(hold){hold=false;return new Promise(r=>release=r);}return {PROTOTYPE_ENV:'fresh'};};
 ipcMain.removeHandler('vscode:fetchShellEnv');ipcMain.handle('vscode:fetchShellEnv',async(event,...args)=>{
  const first=!captured;if(first)captured={event,args};
  try{const result=await handler(event,...args);if(first)outcomes.push('resolved');return result;}catch(error){if(first)outcomes.push(error.message);throw error;}
 });
 try{
  await c.executeJavaScript(`vscode.ipcRenderer.invoke('vscode:fetchShellEnv').catch(()=>{});true`);await until(()=>!!release);
  const generation=life.prototypeDocumentGeneration(c),neighbour=life.prototypeDocumentGeneration(n);
  c.reload();await until(()=>life.prototypeDocumentGeneration(c)!==generation&&life.prototypeLifecycleReady(c));
  release({PROTOTYPE_ENV:'expired'});await until(()=>outcomes.length===1);
  assert.deepEqual(outcomes,['Shell environment request interrupted']);
  await assert.rejects(handler({sender:c,senderFrame:c.mainFrame},...captured.args),/unauthorized/);
  assert.equal(await c.executeJavaScript(`vscode.process.shellEnv().then(x=>x.PROTOTYPE_ENV)`),'fresh');
  assert.equal(await c.executeJavaScript(`vscode.ipcRenderer.invoke('vscode:fetchShellEnv').then(x=>x.PROTOTYPE_ENV)`),'fresh');
  assert.equal(life.prototypeDocumentGeneration(n),neighbour);
  return {realReplacement:true,injectedResolverDelay:true,oldHandlerOutcome:outcomes[0],injectedExpiredCredentialRejected:true,freshPreloadEnvironmentResolved:true,freshExplicitRequestSucceeded:true,neighbourUnchanged:true};
 }finally{if(release)release({});CodeApplication.prototype.resolveShellEnvironment=original;ipcMain.removeHandler('vscode:fetchShellEnv');ipcMain.handle('vscode:fetchShellEnv',handler);}
})()
