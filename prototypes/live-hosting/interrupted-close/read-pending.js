(async()=>{
 const req=process.getBuiltinModule('module').createRequire(process.cwd()+'/package.json');
 const s=globalThis.replyProbe.service,w=s.prototypeWindows.get(100002),lifetime=req('./out/vs/base/parts/ipc/electron-main/prototypeLifetime.js');
 const host=w.win;
 const result={ready:w.isReady,generation:lifetime.prototypeDocumentGeneration(w.webContents),loading:w.webContents.isLoading(),contents:w.webContents.id,pendingClose:s.pendingProjectCloses.has(w.id),pendingUnload:s.mapWindowIdToPendingUnload.has(w.id),requests:globalThis.replyProbe.requests,results:globalThis.replyProbe.results,shell:await host.webContents.executeJavaScript('document.body.innerText'),renderer:await w.webContents.executeJavaScript('({state:document.readyState,workbench:!!document.querySelector(".monaco-workbench")})')};
 req('node:fs').writeFileSync('prototypes/live-hosting/interrupted-close/evidence/pending-shell.png',(await host.webContents.capturePage()).toPNG());
 return result;
})()
