(async()=>{
 const electron = process.getBuiltinModule('module').createRequire(process.cwd()+'/package.json')('electron');
 const target = globalThis.replyProbe.window.webContents;
 const source = electron.webContents.getAllWebContents().find(w=>w.id!==target.id && w.getURL().includes('/workbench-dev.html'));
 const request = (await target.executeJavaScript('window.lifetimeUnloadRequests')).at(-1);
 if(!request?.cancelChannel) {throw new Error('No pending real before-unload request');}
 const results=[];
 for(const channel of [request.okChannel,request.cancelChannel,'vscode:ok0','vscode:reply0']) {
  const before=electron.ipcMain.listenerCount(request.cancelChannel);
  const received=new Promise(resolve=>electron.ipcMain.once(channel,e=>resolve(e.sender.id)));
  await source.executeJavaScript(`window.vscode.ipcRenderer.send(${JSON.stringify(channel)},${globalThis.replyProbe.window.id})`);
  const sender=await received;
  await new Promise(r=>setTimeout(r,40));
  const after=electron.ipcMain.listenerCount(request.cancelChannel);
  results.push({channel,sender,before,after});
  if(before!==1||after!==1) {throw new Error(JSON.stringify(results));}
 }
 return {target:target.id,source:source.id,request,results,lifecycleResults:globalThis.replyProbe.results};
})()
