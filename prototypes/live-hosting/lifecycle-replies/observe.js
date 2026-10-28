(async () => {
 const electron = process.getBuiltinModule('module').createRequire(process.cwd()+'/package.json')('electron');
 const {LifecycleMainService} = process.getBuiltinModule('module').createRequire(process.cwd()+'/package.json')('./out/vs/platform/lifecycle/electron-main/lifecycleMainService.js');
 const original = LifecycleMainService.prototype.waitForPrototypeLifecycle;
 globalThis.replyProbe = {requests: [], results: []};
 LifecycleMainService.prototype.waitForPrototypeLifecycle = function(window, channel, reason, before) {
  globalThis.replyProbe.service = this;
  globalThis.replyProbe.window = window;
  globalThis.replyProbe.requests.push({windowId:window.id, contents:window.webContents.id, channel, before});
  return original.call(this, window, channel, reason, before).then(result => {
   globalThis.replyProbe.results.push({windowId:window.id,channel,result});
   return result;
  });
 };
 return electron.webContents.getAllWebContents().map(w=>({id:w.id,url:w.getURL(),title:w.getTitle()}));
})()
