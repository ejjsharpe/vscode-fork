// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root.
(async()=>{
 const req=process.getBuiltinModule('module').createRequire(process.cwd()+'/package.json');
 const electron=req('electron'),assert=req('node:assert/strict');
 const life=req('./out/vs/base/parts/ipc/electron-main/prototypeLifetime.js');
 let target;const deadline=Date.now()+35000;
 while(Date.now()<deadline){target=electron.webContents.getAllWebContents().find(w=>w.getTitle().includes('multi'));if(target&&life.prototypeLifecycleReady(target))break;await new Promise(r=>setTimeout(r,50));}
 assert.ok(target&&life.prototypeLifecycleReady(target));
 req('./out/vs/platform/windows/electron-main/prototypeWorkbenchHost.js').selectPrototypeWorkbench(100002);
 req('node:fs').writeFileSync('../bootstrap-ui-candidate.png',(await target.capturePage()).toPNG());
 return {versions:process.versions,platform:process.platform,arch:process.arch,ready:true};
})()
