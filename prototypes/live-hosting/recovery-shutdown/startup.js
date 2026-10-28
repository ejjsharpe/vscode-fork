// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root.
(async () => {
 const require=process.getBuiltinModule('module').createRequire(process.cwd()+'/package.json');
 const electron=require('electron'),assert=require('node:assert/strict');
 const lifetime=require('./out/vs/base/parts/ipc/electron-main/prototypeLifetime.js');
 const host=require('./out/vs/platform/windows/electron-main/prototypeWorkbenchHost.js');
 const native=electron.BrowserWindow.getAllWindows();
 const contents=electron.webContents.getAllWebContents().filter(w=>w.getURL().startsWith('vscode-file:'));
 const identities=contents.map(w=>({id:w.id,pid:w.getOSProcessId(),context:host.prototypeContext(w),generation:lifetime.prototypeDocumentGeneration(w),title:w.getTitle()}));
 assert.equal(native.length,1);assert.equal(native[0].contentView.children.length,3);assert.equal(contents.length,3);
 assert.equal(identities.every(w=>w.generation>0),true);
 const before=identities.map(w=>[w.id,w.generation]);
 for(const id of [100000,100001,100002,100000,100002])host.selectPrototypeWorkbench(id);
 assert.deepEqual(contents.map(w=>[w.id,lifetime.prototypeDocumentGeneration(w)]),before);
 return {identities,nativeHost:native[0].id,children:3,tabSwitchPreservesGenerations:true,versions:process.versions};
})()
