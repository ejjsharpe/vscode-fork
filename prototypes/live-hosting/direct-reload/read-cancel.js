// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root.
(()=>{
 const req=process.getBuiltinModule('module').createRequire(process.cwd()+'/package.json'),assert=req('node:assert/strict');
 const life=req('./out/vs/base/parts/ipc/electron-main/prototypeLifetime.js'),c=replyProbe.service.prototypeWindows.get(100002).webContents;
 const result={generation:life.prototypeDocumentGeneration(c),ready:life.prototypeLifecycleReady(c),requests:replyProbe.requests.slice(reloadCheck.start),results:replyProbe.results.slice(reloadCheck.resultStart),title:c.getTitle()};
 assert.equal(result.generation,reloadCheck.generation);assert.equal(result.requests.length,1);assert.equal(result.results[0].result,'cancel');assert.equal(result.ready,true);
 return result;
})()
