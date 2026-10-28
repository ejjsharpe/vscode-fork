(async()=>{
 const require = process.getBuiltinModule('module').createRequire(process.cwd()+'/package.json');
 const electron=require('electron');
 const assert=require('node:assert/strict');
 const lifetime=require('./out/vs/base/parts/ipc/electron-main/prototypeLifetime.js');
 const p=globalThis.replyProbe, window=p.window, target=window.webContents;
 const source=electron.webContents.getAllWebContents().find(w=>w.id!==target.id&&w.getURL().includes('/workbench-dev.html'));
 const results=[];
 const send=async (contents,channel,id=window.id)=>{
  const received=new Promise(resolve=>electron.ipcMain.once(channel,()=>resolve()));
  await contents.executeJavaScript(`window.vscode.ipcRenderer.send(${JSON.stringify(channel)},${id})`);
  await received;
  await new Promise(r=>setTimeout(r,20));
 };
 const begin=(before)=>{
  let request;
  const original=window.send;
  window.send=(channel,args)=>{request=args;};
  const wait=p.service.waitForPrototypeLifecycle(window,before?'vscode:probeBefore':'vscode:probeWill',3,before);
  window.send=original;
  return {request,wait};
 };
 for(const before of [true,false]) {
  const {request,wait}=begin(before), channel=before?request.okChannel:request.replyChannel;
  await send(source,channel);
  assert.equal(electron.ipcMain.listenerCount(channel),1);
  await send(target,channel,-1);
  assert.equal(electron.ipcMain.listenerCount(channel),1);
  await send(target,channel);
  assert.equal(await wait,'ok');
  assert.equal(electron.ipcMain.listenerCount(channel),0);
  const next=begin(before), nextChannel=before?next.request.okChannel:next.request.replyChannel;
  await send(target,channel);
  assert.equal(electron.ipcMain.listenerCount(nextChannel),1);
  await send(target,before?next.request.cancelChannel:nextChannel);
  assert.equal(await next.wait,before?'cancel':'ok');
  results.push({phase:before?'before':'will',foreignRejected:true,wrongIdRejected:true,authorized:true,duplicateDidNotSettleNext:true});
 }
 const old=begin(false), generation=lifetime.prototypeDocumentGeneration(target);
 target.reload();
 const result=await old.wait;
 assert.equal(result,'interrupted');
 assert.equal(electron.ipcMain.listenerCount(old.request.replyChannel),0);
 globalThis.replyProbe.oldRequest=old.request;
 results.push({phase:'will',unexpectedReplacement:result,generation});
 return results;
})()
