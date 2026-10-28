// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root.
(async()=>{
 const req=process.getBuiltinModule('module').createRequire(process.cwd()+'/package.json'),assert=req('node:assert/strict');
 const s=globalThis.replyProbe.service,windows=[...s.prototypeWindows.values()],host=windows[0].win;
 const result={before:windows.map(w=>({id:w.id,contents:w.webContents.id})),notifications:[]};
 for(const w of windows){w.onDidClose(()=>result.notifications.push(w.id));}
 // The inspector may disconnect when the final native host closes; persist from main first.
 req('electron').app.on('window-all-closed',()=>{
  result.after={remaining:s.prototypeWindows.size,hostDestroyed:host.isDestroyed(),logicalDisposed:windows.map(w=>w.logicalDisposed),requests:globalThis.replyProbe.requests,results:globalThis.replyProbe.results};
  req('node:fs').writeFileSync('prototypes/live-hosting/replacement-readiness/evidence/host-success.json',JSON.stringify(result,null,2));
 });
 setTimeout(()=>host.close(),100);return {started:true};
})()
