// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root.
(async()=>{
 const req=process.getBuiltinModule('module').createRequire(process.cwd()+'/package.json');
 const assert=req('node:assert/strict'),{ipcMain}=req('electron');
 const life=req('./out/vs/base/parts/ipc/electron-main/prototypeLifetime.js');
 const c=replyProbe.service.prototypeWindows.get(100002).webContents;
 const handler=ipcMain._invokeHandlers.get('vscode:fetchShellEnv'),requests=[];let script;
 ipcMain.removeHandler('vscode:fetchShellEnv');ipcMain.handle('vscode:fetchShellEnv',async(event,...args)=>{
  if(event.sender!==c)return handler(event,...args);
  const entry={credentialType:typeof args[0],argsLength:args.length};requests.push(entry);
  try{const result=await handler(event,...args);entry.resolved=true;return result;}catch(error){entry.rejected=true;throw error;}
 });
 assert.equal(c.debugger.isAttached(),false);c.debugger.attach('1.3');
 try{
  await c.debugger.sendCommand('Page.enable');
  script=await c.debugger.sendCommand('Page.addScriptToEvaluateOnNewDocument',{source:`document.addEventListener('DOMContentLoaded',()=>{globalThis.earlyEnv=vscode.ipcRenderer.invoke('vscode:fetchShellEnv').then(()=>false,()=>true);},{once:true});`});
  const before=life.prototypeDocumentGeneration(c);c.reload();const end=Date.now()+35000;
  while((life.prototypeDocumentGeneration(c)===before||!life.prototypeLifecycleReady(c))&&Date.now()<end)await new Promise(r=>setTimeout(r,25));
  assert.ok(life.prototypeLifecycleReady(c));
  assert.equal(await c.executeJavaScript('earlyEnv'),true);
  assert.equal(await c.executeJavaScript(`vscode.process.shellEnv().then(x=>!!x&&typeof x==='object')`),true);
  assert.deepEqual(requests,[{credentialType:'undefined',argsLength:1,rejected:true},{credentialType:'string',argsLength:1,resolved:true}]);
  return {realWire:true,requests,earlyExplicitRequestRejected:true,preloadWaitsForAuthorization:true,noReplayOfExplicitRequest:true,genuineResolver:true};
 }finally{if(script)await c.debugger.sendCommand('Page.removeScriptToEvaluateOnNewDocument',{identifier:script.identifier});c.debugger.detach();ipcMain.removeHandler('vscode:fetchShellEnv');ipcMain.handle('vscode:fetchShellEnv',handler);}
})()
