(async()=>{
 const electron = process.getBuiltinModule('module').createRequire(process.cwd()+'/package.json')('electron');
 return {metrics:electron.app.getAppMetrics().map(({pid,type,name})=>({pid,type,name})),contents:electron.webContents.getAllWebContents().map(c=>({id:c.id,title:c.getTitle(),loading:c.isLoading(),destroyed:c.isDestroyed()}))};
})()
