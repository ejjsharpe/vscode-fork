(async()=>{
 const require=process.getBuiltinModule('module').createRequire(process.cwd()+'/package.json');
 const electron=require('electron'),assert=require('node:assert/strict');
 const {prototypeDocumentGeneration}=require('./out/vs/base/parts/ipc/electron-main/prototypeLifetime.js');
 const p=globalThis.replyProbe,w=p.window,c=w.webContents;
 const generation=prototypeDocumentGeneration(c);
 let request;const original=w.send;w.send=(_channel,args)=>{request=args;};
 const wait=p.service.waitForPrototypeLifecycle(w,'vscode:probeBefore',3,true);w.send=original;
 await c.executeJavaScript(`window.vscode.ipcRenderer.send(${JSON.stringify(p.oldRequest.replyChannel)},${w.id})`);
 await new Promise(r=>setTimeout(r,30));
 assert.equal(electron.ipcMain.listenerCount(request.okChannel),1);
 c.reload();
 assert.equal(await wait,'interrupted');
 assert.equal(electron.ipcMain.listenerCount(request.okChannel),0);
 assert.equal(electron.ipcMain.listenerCount(request.cancelChannel),0);
 return {generation,oldCompletionCannotAffectFreshWait:true,beforeReplacement:'interrupted',listenersRemoved:true};
})()
