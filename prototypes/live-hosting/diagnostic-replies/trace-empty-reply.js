// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root.
(async()=>{
 const req=process.getBuiltinModule('module').createRequire(process.cwd()+'/package.json'),{ipcMain}=req('electron');
 const c=replyProbe.service.prototypeWindows.get(100002).webContents;
 const channel='vscode:getDiagnosticInfoResponseTrace';
 return await new Promise((resolve,reject)=>{
  const timeout=setTimeout(()=>{ipcMain.removeListener(channel,listener);reject(new Error('No diagnostic reply'));},5000);
  const listener=(event,...args)=>{clearTimeout(timeout);ipcMain.removeListener(channel,listener);resolve({senderMatches:event.sender===c,argCount:args.length,types:args.map(x=>typeof x)});};
  ipcMain.on(channel,listener);
  c.send('vscode:getDiagnosticInfo',{replyChannel:channel,args:{}});
 });
})()
