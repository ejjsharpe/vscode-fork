// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root.
(()=>{
 const req=process.getBuiltinModule('module').createRequire(process.cwd()+'/package.json'),{ipcMain}=req('electron'),assert=req('node:assert/strict');
 try{
  assert.deepEqual(zoomUI.records.map(({value,authenticated})=>({value,authenticated})),[{value:1,authenticated:true},{value:'configured',authenticated:true}]);
  assert.equal(replyProbe.service.prototypeWindows.get(100002).customZoomLevel,undefined);
  return {realWorkbenchZoomAndResetCommands:true,records:zoomUI.records};
 }finally{ipcMain.removeHandler('vscode:notifyZoomLevel');ipcMain.handle('vscode:notifyZoomLevel',zoomUI.handler);delete globalThis.zoomUI;}
})()
