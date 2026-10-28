// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root.
// THROWAWAY: real replacement and startup requests; injected old credentials.
(async()=>{
 const req=process.getBuiltinModule('module').createRequire(process.cwd()+'/package.json');
 const assert=req('node:assert/strict'),{ipcMain}=req('electron');
 const life=req('./out/vs/base/parts/ipc/electron-main/prototypeLifetime.js');
 const w=replyProbe.service.prototypeWindows.get(100002),c=w.webContents,n=replyProbe.service.prototypeWindows.get(100001).webContents;
 const zoomHandler=ipcMain._invokeHandlers.get('vscode:notifyZoomLevel'),channels=['vscode:openDevTools','vscode:toggleDevTools'];
 let captured,script;const zoomRequests=[],toolRequests=[];
 ipcMain.removeHandler('vscode:notifyZoomLevel');ipcMain.handle('vscode:notifyZoomLevel',async(event,...args)=>{
  if(event.sender!==c)return zoomHandler(event,...args);
  captured??={event,args};const entry={credentialType:typeof args[1]};zoomRequests.push(entry);
  try{await zoomHandler(event,...args);entry.resolved=true;}catch(error){entry.rejected=true;throw error;}
 });
 const listeners=channels.map(channel=>{const fn=(event,...args)=>{if(event.sender===c)toolRequests.push({channel,credentialType:typeof args[0]});};ipcMain.on(channel,fn);return [channel,fn];});
 const originals=channels.map((channel,i)=>[i===0?'openDevTools':'toggleDevTools',c[i===0?'openDevTools':'toggleDevTools']]);let effects=0;
 for(const [method] of originals)c[method]=()=>effects++;
 const until=async predicate=>{const end=Date.now()+35000;while(!predicate()&&Date.now()<end)await new Promise(r=>setTimeout(r,20));assert.ok(predicate(),'bounded observed condition');};
 const saved=w.customZoomLevel;
 assert.equal(c.debugger.isAttached(),false);c.debugger.attach('1.3');
 try{
  await c.executeJavaScript(`vscode.ipcRenderer.invoke('vscode:notifyZoomLevel',1)`);
  const old=captured;zoomRequests.length=0;
  await c.debugger.sendCommand('Page.enable');
  script=await c.debugger.sendCommand('Page.addScriptToEvaluateOnNewDocument',{source:`document.addEventListener('DOMContentLoaded',()=>{vscode.ipcRenderer.send('vscode:openDevTools');vscode.ipcRenderer.send('vscode:toggleDevTools');globalThis.earlyZoom=vscode.ipcRenderer.invoke('vscode:notifyZoomLevel',2).then(()=>false,()=>true);},{once:true});`});
  const generation=life.prototypeDocumentGeneration(c),neighbour=life.prototypeDocumentGeneration(n);
  c.reload();await until(()=>life.prototypeDocumentGeneration(c)!==generation&&life.prototypeLifecycleReady(c));
  assert.equal(await c.executeJavaScript('earlyZoom'),true);
  assert.deepEqual(zoomRequests,[{credentialType:'undefined',rejected:true}]);
  assert.deepEqual(toolRequests,channels.map(channel=>({channel,credentialType:'undefined'})));
  assert.equal(effects,0);assert.equal(w.customZoomLevel,1);
  const freshEvent={sender:c,senderFrame:c.mainFrame};
  await assert.rejects(zoomHandler(freshEvent,2,old.args[1]),/unauthorized/);
  for(const channel of channels)ipcMain.emit(channel,freshEvent,old.args[1]);
  assert.equal(effects,0);
  await c.executeJavaScript(`vscode.ipcRenderer.send('vscode:openDevTools');vscode.ipcRenderer.send('vscode:toggleDevTools');vscode.ipcRenderer.invoke('vscode:notifyZoomLevel',2)`);
  assert.equal(effects,2);assert.equal(w.customZoomLevel,2);assert.equal(life.prototypeDocumentGeneration(n),neighbour);
  assert.equal(zoomRequests.length,2);assert.equal(toolRequests.length,6);
  return {actualReplacement:true,realPrebootstrapRequestsRejected:true,noAutomaticReplay:true,injectedExpiredCredentialsRejected:true,freshExplicitCallsSucceeded:true,neighbourGenerationUnchanged:true,controlledDevToolsEffectCounter:true};
 }finally{if(script)await c.debugger.sendCommand('Page.removeScriptToEvaluateOnNewDocument',{identifier:script.identifier});c.debugger.detach();for(const [channel,fn]of listeners)ipcMain.removeListener(channel,fn);for(const [method,fn]of originals)c[method]=fn;ipcMain.removeHandler('vscode:notifyZoomLevel');ipcMain.handle('vscode:notifyZoomLevel',zoomHandler);w.customZoomLevel=saved;}
})()
