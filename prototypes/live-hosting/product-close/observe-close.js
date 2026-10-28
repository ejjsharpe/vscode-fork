// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root.
// THROWAWAY: observe destruction without replacing handlers or initiating shutdown.
(() => {
 const req=process.getBuiltinModule('module').createRequire(process.cwd()+'/package.json');
 const electron=req('electron');
 const host=electron.BrowserWindow.getAllWindows()[0];
 const views=host.contentView.children.map(view=>view.webContents);
 const result={source:'a330d2a1016',host:host.id,originalViews:views.map(c=>c.id),destroyed:[]};
 for(const contents of views)contents.once('destroyed',()=>result.destroyed.push(contents.id));
 host.once('closed',()=>{
  result.hostDestroyed=host.isDestroyed();
  result.allOriginalViewsDestroyed=views.every(c=>c.isDestroyed());
  result.remainingHosts=electron.BrowserWindow.getAllWindows().length;
  req('node:fs').writeFileSync('prototypes/live-hosting/product-close/evidence/completed-close.json',JSON.stringify(result,null,2)+'\n');
 });
 return {observing:true,host:host.id,viewCount:views.length};
})()
