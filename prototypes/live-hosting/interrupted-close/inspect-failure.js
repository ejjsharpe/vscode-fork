(async()=>{
 const req=process.getBuiltinModule('module').createRequire(process.cwd()+'/package.json'),s=globalThis.replyProbe.service,w=s.prototypeWindows.get(100002);
 const h=w.win,c=w.webContents;
 req('node:fs').writeFileSync('prototypes/live-hosting/interrupted-close/evidence/repeat-project.png',(await c.capturePage()).toPNG());
 const text=await c.executeJavaScript('document.body.innerText');
 return {time:new Date().toISOString(),pending:s.pendingProjectCloses.has(w.id),ready:w.isReady,loading:c.isLoading(),text,hostDestroyed:h.isDestroyed(),children:h.contentView.children.length,results:globalThis.replyProbe.results};
})()
