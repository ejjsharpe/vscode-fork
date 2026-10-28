(async()=>{
 const req=process.getBuiltinModule('module').createRequire(process.cwd()+'/package.json');
 const electron=req('electron'),lifetime=req('./out/vs/base/parts/ipc/electron-main/prototypeLifetime.js');
 const windows=electron.webContents.getAllWebContents().filter(w=>w.getURL().startsWith('vscode-file:'));
 const host=electron.BrowserWindow.getAllWindows()[0];
 req('./out/vs/platform/windows/electron-main/prototypeWorkbenchHost.js').selectPrototypeWorkbench(100002);
 const target=windows.find(w=>w.getTitle().includes('multi'));
 const image=await target.capturePage();
 req('node:fs').writeFileSync('prototypes/live-hosting/interrupted-close/evidence/fresh-initial.png',image.toPNG());
 return {host:host.id,children:host.contentView.children.length,windows:windows.map(w=>({id:w.id,title:w.getTitle(),generation:lifetime.prototypeDocumentGeneration(w)}))};
})()
