// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root.
(()=>{
 const req=process.getBuiltinModule('module').createRequire(process.cwd()+'/package.json'),{ipcMain}=req('electron');
 const handler=ipcMain._invokeHandlers.get('vscode:notifyZoomLevel');
 globalThis.zoomUI={handler,records:[]};
 ipcMain.removeHandler('vscode:notifyZoomLevel');ipcMain.handle('vscode:notifyZoomLevel',async(event,...args)=>{await handler(event,...args);zoomUI.records.push({value:args[0]??'configured',authenticated:typeof args[1]==='string',sender:event.sender.id});});
 return {observing:true};
})()
