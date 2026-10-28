// Test setup only: capture the lifecycle service through its native host listener without starting shutdown.
(async()=>{
 const require=process.getBuiltinModule('module').createRequire(process.cwd()+'/package.json');
 const {LifecycleMainService}=require('./out/vs/platform/lifecycle/electron-main/lifecycleMainService.js');
 const electron=require('electron');
 const original=LifecycleMainService.prototype.closePrototypeHost;
 LifecycleMainService.prototype.closePrototypeHost=async function(){globalThis.replyProbe.service=this;};
 try {electron.BrowserWindow.getAllWindows()[0].close();}
 finally {LifecycleMainService.prototype.closePrototypeHost=original;}
 const s=globalThis.replyProbe.service;
 globalThis.replyProbe.window=s.prototypeWindows.get(100002);
 return {captured:!!s,windows:[...s.prototypeWindows.values()].map(w=>({id:w.id,ready:w.isReady}))};
})()
