(async()=>{
 const {prototypeDocumentGeneration} = process.getBuiltinModule('module').createRequire(process.cwd()+'/package.json')('./out/vs/base/parts/ipc/electron-main/prototypeLifetime.js');
 const p=globalThis.replyProbe;
 return {requests:p.requests,results:p.results,generation:prototypeDocumentGeneration(p.window.webContents),title:p.window.webContents.getTitle()};
})()
