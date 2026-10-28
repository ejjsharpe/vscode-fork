(async()=>{
 const s=globalThis.replyProbe.service,w=s.prototypeWindows.get(100001);
 const req=process.getBuiltinModule('module').createRequire(process.cwd()+'/package.json');
 const lifetime=req('./out/vs/base/parts/ipc/electron-main/prototypeLifetime.js');
 const before=lifetime.prototypeDocumentGeneration(w.webContents),contents=w.webContents.id;
 await s.reload(w);
 const end=Date.now()+7000;
 while(!w.isReady&&Date.now()<end) await new Promise(resolve=>setTimeout(resolve,50));
 const after=lifetime.prototypeDocumentGeneration(w.webContents);
 req('node:assert/strict').ok(w.isReady&&after>before);
 return {contents,before,after,ready:w.isReady,requests:globalThis.replyProbe.requests,results:globalThis.replyProbe.results};
})()
