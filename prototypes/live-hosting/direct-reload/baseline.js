// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root.
(async () => {
 const req = process.getBuiltinModule('module').createRequire(process.cwd()+'/package.json');
 const assert = req('node:assert/strict');
 const life = req('./out/vs/base/parts/ipc/electron-main/prototypeLifetime.js');
 const w = globalThis.replyProbe.service.prototypeWindows.get(100002), c = w.webContents;
 const before = life.prototypeDocumentGeneration(c), count = replyProbe.requests.length;
 await c.executeJavaScript("vscode.ipcRenderer.send('vscode:reloadWindow')");
 const deadline = Date.now()+20000;
 while ((life.prototypeDocumentGeneration(c) === before || !life.prototypeLifecycleReady(c)) && Date.now()<deadline) { await new Promise(r=>setTimeout(r,50)); }
 const result = {before, after:life.prototypeDocumentGeneration(c), ready:life.prototypeLifecycleReady(c), lifecycleRequests:replyProbe.requests.slice(count)};
 assert.notEqual(result.after,before); assert.equal(result.ready,true); assert.equal(result.lifecycleRequests.length,0);
 return result;
})()
