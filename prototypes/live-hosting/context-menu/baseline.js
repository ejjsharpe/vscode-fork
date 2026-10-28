// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root.
// THROWAWAY: real menu IPC, deliberately held native popup callbacks.
(async()=>{
 const req=process.getBuiltinModule('module').createRequire(process.cwd()+'/package.json');
 const assert=req('node:assert/strict'),{Menu}=req('electron'),life=req('./out/vs/base/parts/ipc/electron-main/prototypeLifetime.js');
 const w=replyProbe.service.prototypeWindows.get(100002),c=w.webContents;
 const wait=ms=>new Promise(r=>setTimeout(r,ms));
 const until=async predicate=>{const end=Date.now()+25000;while(!predicate()&&Date.now()<end)await wait(10);assert.ok(predicate());};
 await until(()=>life.prototypeLifecycleReady(c));
 const original=Menu.prototype.popup;let menu,options;
 Menu.prototype.popup=function(o){menu=this;options=o;};
 try {
  await c.executeJavaScript(`vscode.ipcRenderer.send('vscode:contextmenu',91420,[{id:0,label:'Held old-document action'}],'vscode:onContextMenu91420',{})`);
  await until(()=>!!menu);
  const before=life.prototypeDocumentGeneration(c);c.reload();
  await until(()=>life.prototypeDocumentGeneration(c)!==before&&life.prototypeLifecycleReady(c));
  await c.executeJavaScript(`globalThis.menuProbe=[];vscode.ipcRenderer.on('vscode:onContextMenu91420',(_event,...args)=>menuProbe.push({kind:'click',args}));vscode.ipcRenderer.on('vscode:onCloseContextMenu',(_event,id)=>menuProbe.push({kind:'close',id}));true;`);
  menu.items[0].click(menu.items[0],w.win,{shiftKey:true});options.callback();
  await wait(100);
  const received=await c.executeJavaScript('menuProbe');
  return {replacementReceivedOldCallbacks:received.length>0,received,realRendererIPC:true,nativePopupHeldAndCallbacksInvokedByProbe:true};
 }finally{Menu.prototype.popup=original;}
})()
