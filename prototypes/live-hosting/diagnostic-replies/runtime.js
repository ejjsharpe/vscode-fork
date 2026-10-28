// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root.
(() => {
 const req=process.getBuiltinModule('module').createRequire(process.cwd()+'/package.json'),{BrowserWindow}=req('electron');
 const life=req('./out/vs/base/parts/ipc/electron-main/prototypeLifetime.js');
 return {versions:process.versions,platform:process.platform,arch:process.arch,nativeHosts:BrowserWindow.getAllWindows().length,workbenches:[...replyProbe.service.prototypeWindows.values()].map(w=>({id:w.id,webContents:w.webContents.id,rendererPid:w.webContents.getOSProcessId(),generation:life.prototypeDocumentGeneration(w.webContents),lifecycleReady:life.prototypeLifecycleReady(w.webContents)}))};
})()
