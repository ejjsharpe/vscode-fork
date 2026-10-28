// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root.
// THROWAWAY: actual replacement and bootstrap IPC, with explicit credential/frame injections.
(async () => {
 const req = process.getBuiltinModule('module').createRequire(process.cwd() + '/package.json');
 const assert = req('node:assert/strict'), {ipcMain} = req('electron');
 const life = req('./out/vs/base/parts/ipc/electron-main/prototypeLifetime.js');
 const w = replyProbe.service.prototypeWindows.get(100002), c = w.webContents;
 const neighbour = replyProbe.service.prototypeWindows.get(100001).webContents;
 const channel = w.configObjectUrl.resource.toString(), handler = ipcMain._invokeHandlers.get(channel);
 const requests = []; let captured, script;
 const until = async predicate => { const deadline = Date.now()+35000; while (!predicate() && Date.now()<deadline) await new Promise(r=>setTimeout(r,20)); assert.ok(predicate(), 'bounded observed condition'); };
 ipcMain.removeHandler(channel);
 ipcMain.handle(channel, async (event, ...args) => {
  const record = {authenticated:typeof args[0] === 'string'}; requests.push(record);
  captured ??= {event, args};
  try { const value = await handler(event, ...args); record.accepted = true; return value; }
  catch (error) { record.accepted = false; throw error; }
 });
 assert.equal(c.debugger.isAttached(), false); c.debugger.attach('1.3');
 try {
  assert.equal(await c.executeJavaScript(`vscode.ipcRenderer.invoke(${JSON.stringify(channel)}).then(v=>v.windowId)`), w.id);
  const old = captured;
  for (const args of [[], ['guessed'], [...old.args, 'extra']]) await assert.rejects(handler({sender:c,senderFrame:c.mainFrame},...args), /unauthorized/);
  await assert.rejects(handler({sender:neighbour,senderFrame:neighbour.mainFrame}, ...old.args), /unauthorized/);
  await assert.rejects(handler({sender:c,senderFrame:undefined}, ...old.args), /unauthorized/);
  requests.length = 0;
  await c.debugger.sendCommand('Page.enable');
  script = await c.debugger.sendCommand('Page.addScriptToEvaluateOnNewDocument', {source:`document.addEventListener('DOMContentLoaded',()=>{globalThis.earlyConfiguration=vscode.ipcRenderer.invoke(${JSON.stringify(channel)}).then(()=>false,()=>true);},{once:true});`});
  const previous = life.prototypeDocumentGeneration(c), neighbourGeneration = life.prototypeDocumentGeneration(neighbour);
  c.reload();
  await until(()=>life.prototypeDocumentGeneration(c)!==previous && life.prototypeLifecycleReady(c));
  assert.equal(await c.executeJavaScript('earlyConfiguration'), true);
  assert.deepEqual(requests, [{authenticated:false,accepted:false},{authenticated:true,accepted:true}]);
  await assert.rejects(handler({sender:c,senderFrame:c.mainFrame}, ...old.args), /unauthorized/);
  assert.equal(await c.executeJavaScript(`vscode.ipcRenderer.invoke(${JSON.stringify(channel)}).then(v=>v.windowId)`), w.id);
  assert.equal(await c.executeJavaScript('vscode.context.configuration().windowId'), w.id);
  assert.equal(life.prototypeDocumentGeneration(neighbour), neighbourGeneration);
  return {actualReplacement:true,earlyExplicitRequestRejected:true,preloadBootstrapSucceeded:true,noExplicitReplay:true,freshExplicitRequestSucceeded:true,injectedMissingGuessedExtraForeignFrameAndExpiredRejected:true,neighbourGenerationPreserved:true,requests};
 } finally {
  if(script) await c.debugger.sendCommand('Page.removeScriptToEvaluateOnNewDocument',{identifier:script.identifier});
  c.debugger.detach(); ipcMain.removeHandler(channel); ipcMain.handle(channel,handler);
 }
})()
