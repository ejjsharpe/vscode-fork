// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root.
(async()=>{
 const req=process.getBuiltinModule('module').createRequire(process.cwd()+'/package.json'),assert=req('node:assert/strict');
 const life=req('./out/vs/base/parts/ipc/electron-main/prototypeLifetime.js'),c=replyProbe.service.prototypeWindows.get(100002).webContents;
 const deadline=Date.now()+20000;while(!life.prototypeLifecycleReady(c)&&Date.now()<deadline){await new Promise(r=>setTimeout(r,50));}
 const result={generation:life.prototypeDocumentGeneration(c),ready:life.prototypeLifecycleReady(c),requests:replyProbe.requests.slice(reloadCheck.start),results:replyProbe.results.slice(reloadCheck.resultStart),saved:req('node:fs').readFileSync('prototypes/live-hosting/replacement-readiness/scratch/multi-a/direct-reload-final.txt','utf8'),title:c.getTitle()};
 assert.notEqual(result.generation,reloadCheck.generation);assert.equal(result.requests.length,2);assert.deepEqual(result.results.map(x=>x.result),['ok','ok']);assert.equal(result.saved,'Disposable lifecycle reply test');assert.equal(result.ready,true);
 return result;
})()
