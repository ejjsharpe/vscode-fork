// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root.
(async()=>{
 const req=process.getBuiltinModule('module').createRequire(process.cwd()+'/package.json');
 const life=req('./out/vs/base/parts/ipc/electron-main/prototypeLifetime.js'),c=replyProbe.service.prototypeWindows.get(100002).webContents;
 globalThis.reloadCheck={generation:life.prototypeDocumentGeneration(c),start:replyProbe.requests.length,resultStart:replyProbe.results.length};
 await c.executeJavaScript("vscode.ipcRenderer.send('vscode:reloadWindow')");
 return reloadCheck;
})()
