// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root.
(async () => {
 const req=process.getBuiltinModule('module').createRequire(process.cwd()+'/package.json'),assert=req('node:assert/strict');
 const {ipcMain}=req('electron'),life=req('./out/vs/base/parts/ipc/electron-main/prototypeLifetime.js');
 const s=replyProbe.service,w=s.prototypeWindows.get(100002),c=w.webContents,neighbour=s.prototypeWindows.get(100001).webContents;
 const original=s.reload;let calls=0;let saved;
 s.reload=function(...args){calls++;return original.apply(this,args);};
 const capture=(event,...args)=>{if(event.sender===c && args[0]==='capture'){saved={event,nonce:args[1]};}};
 ipcMain.prependListener('vscode:reloadWindow',capture);
 try {
  const before=life.prototypeDocumentGeneration(c),neighbourGeneration=life.prototypeDocumentGeneration(neighbour);
  await c.executeJavaScript("vscode.ipcRenderer.send('vscode:reloadWindow','capture')");
  await new Promise(r=>setTimeout(r,100));assert.ok(saved);assert.equal(calls,0);
  ipcMain.emit('vscode:reloadWindow',saved.event);
  ipcMain.emit('vscode:reloadWindow',saved.event,'guessed');
  ipcMain.emit('vscode:reloadWindow',{sender:neighbour,senderFrame:neighbour.mainFrame},saved.nonce);
  ipcMain.emit('vscode:reloadWindow',{sender:c,senderFrame:null},saved.nonce);
  assert.equal(calls,0);
  const requestStart=replyProbe.requests.length;
  await c.executeJavaScript("vscode.ipcRenderer.send('vscode:reloadWindow')");
  const deadline=Date.now()+20000;
  while((life.prototypeDocumentGeneration(c)===before || !life.prototypeLifecycleReady(c)) && Date.now()<deadline){await new Promise(r=>setTimeout(r,50));}
  assert.equal(calls,1);assert.notEqual(life.prototypeDocumentGeneration(c),before);assert.equal(life.prototypeLifecycleReady(c),true);
  ipcMain.emit('vscode:reloadWindow',{sender:c,senderFrame:c.mainFrame},saved.nonce);
  assert.equal(calls,1);assert.equal(life.prototypeDocumentGeneration(neighbour),neighbourGeneration);
  const requests=replyProbe.requests.slice(requestStart);assert.equal(requests.length,2);
  return {rejected:['extra renderer argument','missing credential','guessed credential','foreign credential','non-main frame','expired credential after replacement'],realWireReloadCalls:calls,before,after:life.prototypeDocumentGeneration(c),neighbourGeneration,requests,results:replyProbe.results};
 } finally {s.reload=original;ipcMain.removeListener('vscode:reloadWindow',capture);}
})()
