// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root.
(async()=>{
 const req=process.getBuiltinModule('module').createRequire(process.cwd()+'/package.json'),assert=req('node:assert/strict');
 const life=req('./out/vs/base/parts/ipc/electron-main/prototypeLifetime.js'),w=replyProbe.service.prototypeWindows.get(100002),c=w.webContents;
 const original=w.reload;let replacements=0;w.reload=function(...args){replacements++;return original.apply(this,args);};
 try {
  const before=life.prototypeDocumentGeneration(c),start=replyProbe.requests.length;
  await c.executeJavaScript("vscode.ipcRenderer.send('vscode:reloadWindow');vscode.ipcRenderer.send('vscode:reloadWindow')");
  const deadline=Date.now()+20000;while((life.prototypeDocumentGeneration(c)===before||!life.prototypeLifecycleReady(c))&&Date.now()<deadline){await new Promise(r=>setTimeout(r,50));}
  const result={replacements,before,after:life.prototypeDocumentGeneration(c),ready:life.prototypeLifecycleReady(c),requests:replyProbe.requests.slice(start)};
  req('node:fs').writeFileSync('prototypes/live-hosting/direct-reload/evidence/overlap-observed.json',JSON.stringify(result,null,2));
  assert.equal(replacements,1);assert.equal(result.ready,true);return result;
 }finally{w.reload=original;}
})()
