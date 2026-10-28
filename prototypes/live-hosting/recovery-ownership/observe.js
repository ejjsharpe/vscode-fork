(async () => {
 const require = process.getBuiltinModule('module').createRequire(process.cwd()+'/package.json');
 const electron = require('electron');
 const {prototypeDocumentGeneration} = require('./out/vs/base/parts/ipc/electron-main/prototypeLifetime.js');
 const {prototypeContext} = require('./out/vs/platform/windows/electron-main/prototypeWorkbenchHost.js');
 const service = globalThis.replyProbe.service;
 if (!service) { throw new Error('Run the real reload control after installing the lifecycle observer'); }
 const digest = value => require('node:crypto').createHash('sha256').update(JSON.stringify(value)).digest('hex');
 const snapshot = () => ({
  versions:process.versions,
  hosts:electron.BrowserWindow.getAllWindows().map(w=>({id:w.id,contents:w.webContents.id,children:w.contentView.children.length})),
  windows:[...service.prototypeWindows.values()].map(w=>({id:w.id,ready:w.isReady,contents:w.webContents.id,pid:w.webContents.getOSProcessId(),generation:prototypeDocumentGeneration(w.webContents),context:prototypeContext(w.webContents),workspace:w.config.workspace,profile:w.config.profiles.profile.id,environmentHash:digest(w.config.userEnv),backupPath:w.config.backupPath,title:w.webContents.getTitle()})),
  contents:electron.webContents.getAllWebContents().map(c=>({id:c.id,pid:c.getOSProcessId(),type:c.getType(),crashed:c.isCrashed(),generation:prototypeDocumentGeneration(c),context:prototypeContext(c)})),
  metrics:electron.app.getAppMetrics().map(m=>({pid:m.pid,type:m.type,name:m.name,serviceName:m.serviceName})),
  windowCounter:service.windowCounter,
  requests:globalThis.replyProbe.requests,
  results:globalThis.replyProbe.results
 });
 globalThis.recoveryProbe={service,snapshot,before:snapshot(),target:service.prototypeWindows.get(100002)};
 return globalThis.recoveryProbe.before;
})()
