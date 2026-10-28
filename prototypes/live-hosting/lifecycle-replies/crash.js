(async()=>{
 const require=process.getBuiltinModule('module').createRequire(process.cwd()+'/package.json');
 const electron=require('electron'),assert=require('node:assert/strict');
 const p=globalThis.replyProbe,w=p.window,c=w.webContents;
 const beforeCrash=electron.webContents.getAllWebContents().map(c=>({id:c.id,pid:c.getOSProcessId(),url:c.getURL()}));
 let request;const original=w.send;w.send=(_channel,args)=>{request=args;};
 const wait=p.service.waitForPrototypeLifecycle(w,'vscode:probeWill',3,false);w.send=original;
 c.forcefullyCrashRenderer();
 const result=await wait;
 assert.equal(result,'interrupted');
 assert.equal(electron.ipcMain.listenerCount(request.replyChannel),0);
 return {beforeCrash,target:c.id,result,listeners:electron.ipcMain.listenerCount(request.replyChannel)};
})()
