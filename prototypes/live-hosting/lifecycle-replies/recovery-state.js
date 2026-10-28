(async()=>{
 const require=process.getBuiltinModule('module').createRequire(process.cwd()+'/package.json');
 const electron=require('electron');
 const {prototypeDocumentGeneration}=require('./out/vs/base/parts/ipc/electron-main/prototypeLifetime.js');
 return {versions:process.versions,windows:electron.BrowserWindow.getAllWindows().map(w=>({id:w.id,destroyed:w.isDestroyed(),title:w.getTitle()})),contents:electron.webContents.getAllWebContents().map(c=>({id:c.id,pid:c.getOSProcessId(),destroyed:c.isDestroyed(),crashed:c.isCrashed(),generation:prototypeDocumentGeneration(c),title:c.getTitle(),url:c.getURL()}))};
})()
