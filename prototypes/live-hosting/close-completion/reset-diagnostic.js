(async()=>{
 const w=globalThis.replyProbe.service.prototypeWindows.get(100001);
 const before=globalThis.replyProbe.requests.slice();
 const lifetime=process.getBuiltinModule('module').createRequire(process.cwd()+'/package.json')('./out/vs/base/parts/ipc/electron-main/prototypeLifetime.js');
 const generation=lifetime.prototypeDocumentGeneration(w.webContents);
 w.webContents.reload();
 const end=Date.now()+7000;
 while((!w.isReady||!(lifetime.prototypeDocumentGeneration(w.webContents)>generation))&&Date.now()<end) await new Promise(resolve=>setTimeout(resolve,50));
 return {before,ready:w.isReady,results:globalThis.replyProbe.results};
})()
