(async()=>{
 const electron = process.getBuiltinModule('module').createRequire(process.cwd()+'/package.json')('electron');
 const target = electron.webContents.fromId(4);
 const source = electron.webContents.fromId(3);
 const requests = await target.executeJavaScript('window.lifetimeUnloadRequests');
 const request = requests.at(-1);
 if(!request || !/^vscode:cancel\d+$/.test(request.cancelChannel)) {throw new Error('No pending real unload request');}
 const before = electron.ipcMain.listenerCount(request.cancelChannel);
 if(before !== 1) {throw new Error(`Expected one pending lifecycle listener, got ${before}`);}
 const received = new Promise(resolve=>electron.ipcMain.once(request.cancelChannel,event=>resolve({sender:event.sender.id,url:event.senderFrame.url})));
 await source.executeJavaScript(`window.vscode.ipcRenderer.send(${JSON.stringify(request.cancelChannel)})`);
 const sender = await received;
 await new Promise(resolve=>setTimeout(resolve,100));
 return {targetWebContents:target.id,sourceWebContents:source.id,request,before,after:electron.ipcMain.listenerCount(request.cancelChannel),sender,targetTitle:target.getTitle()};
})()
