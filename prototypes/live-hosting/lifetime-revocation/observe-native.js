(async()=>{
 const electron = process.getBuiltinModule('module').createRequire(process.cwd()+'/package.json')('electron');
 globalThis.lifetimeNativeEvents = [];
 const host = electron.BrowserWindow.getAllWindows()[0];
 for(const name of ['focus','blur','minimize','restore']) { host.on(name,()=>globalThis.lifetimeNativeEvents.push({name,id:host.id,time:Date.now()})); }
 return {versions:process.versions,platform:process.platform,arch:process.arch,host:host.id,contents:electron.webContents.getAllWebContents().filter(c=>c.getType()!=='remote').map(c=>({id:c.id,pid:c.getOSProcessId(),type:c.getType()}))};
})()
