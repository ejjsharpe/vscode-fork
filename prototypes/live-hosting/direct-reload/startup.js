// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root.
(async()=>{
 const req=process.getBuiltinModule('module').createRequire(process.cwd()+'/package.json'),assert=req('node:assert/strict');
 const life=req('./out/vs/base/parts/ipc/electron-main/prototypeLifetime.js'),s=replyProbe.service,w=s.prototypeWindows.get(100002),c=w.webContents;
 const original=w.reload,unload=s.unload;let replacements=0;const outcomes=[];let atBootstrap;let settled;
 const sent=new Promise(r=>settled=r);
 w.reload=function(...args){replacements++;return original.apply(this,args);};
 s.unload=function(...args){return unload.apply(this,args).then(value=>{outcomes.push(value);return value;});};
 c.once('dom-ready',async()=>{
  try{atBootstrap={ready:life.prototypeLifecycleReady(c),generation:life.prototypeDocumentGeneration(c)};await c.executeJavaScript("vscode.ipcRenderer.send('vscode:reloadWindow')");}
  catch(error){atBootstrap.error=String(error);}finally{settled();}
 });
 try{
  await s.reload(w);await sent;
  const deadline=Date.now()+20000;while(!life.prototypeLifecycleReady(c)&&Date.now()<deadline){await new Promise(r=>setTimeout(r,50));}
  await new Promise(r=>setTimeout(r,250));
  const result={atBootstrap,outcomes,replacements,ready:life.prototypeLifecycleReady(c),pending:s.pendingProjectReloads.size};
  req('node:fs').writeFileSync('prototypes/live-hosting/direct-reload/evidence/startup-observed.json',JSON.stringify(result,null,2));
  assert.equal(atBootstrap.ready,false);assert.equal(atBootstrap.error,undefined);assert.deepEqual(outcomes,[false,'interrupted']);assert.equal(replacements,1);assert.equal(result.ready,true);assert.equal(result.pending,0);return result;
 }finally{w.reload=original;s.unload=unload;}
})()
