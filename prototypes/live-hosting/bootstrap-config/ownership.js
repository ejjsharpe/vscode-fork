// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root.
// THROWAWAY: real renderer requests; never return configuration or credential contents.
(async () => {
 const req = process.getBuiltinModule('module').createRequire(process.cwd() + '/package.json');
 const assert = req('node:assert/strict'), { BrowserWindow } = req('electron');
 const windows = [...replyProbe.service.prototypeWindows.values()];
 const target = windows.find(w => w.id === 100002);
 const channel = target.configObjectUrl.resource.toString();
 const invoke = (contents, name, extra = '') => contents.executeJavaScript(`vscode.ipcRenderer.invoke(${JSON.stringify(name)}${extra}).then(value => ({accepted:true,own:value.windowId === vscode.context?.configuration()?.windowId}), () => ({accepted:false}))`);
 const own = await invoke(target.webContents, channel);
 const foreign = await invoke(windows.find(w => w.id === 100001).webContents, channel);
 const auxiliary = new BrowserWindow({ show:false, webPreferences:{ sandbox:true, contextIsolation:true, preload:process.cwd() + '/out/vs/base/parts/sandbox/electron-browser/preload-aux.js' } });
 let aux;
 try {
  await auxiliary.loadURL('about:blank');
  aux = await invoke(auxiliary.webContents, channel);
 } finally { auxiliary.destroy(); }
 const extra = await invoke(target.webContents, channel, ',"unexpected"');
 const allOwn = [];
 for (const window of windows) allOwn.push(await invoke(window.webContents, window.configObjectUrl.resource.toString()));
 const result = { own, foreign, auxiliary:aux, extra, allOwn };
 globalThis.bootstrapConfigOwnership = result;
 assert.deepEqual(own, {accepted:true,own:true});
 assert.deepEqual(allOwn, windows.map(() => ({accepted:true,own:true})));
 assert.equal(foreign.accepted, false, 'Neighbour must not retrieve target configuration');
 assert.equal(aux.accepted, false, 'Unregistered auxiliary must not retrieve configuration');
 assert.equal(extra.accepted, false, 'Unexpected arguments must reject');
 return result;
})()
