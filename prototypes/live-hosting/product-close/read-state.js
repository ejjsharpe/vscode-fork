// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root.
// THROWAWAY: read native visibility without replacing IPC or lifecycle handlers.
(() => {
 const electron=process.getBuiltinModule('module').createRequire(process.cwd()+'/package.json')('electron');
 return {runtime:{electron:process.versions.electron,node:process.versions.node,platform:process.platform,arch:process.arch},hosts:electron.BrowserWindow.getAllWindows().map(host=>({id:host.id,views:host.contentView.children.map(view=>({contents:view.webContents?.id,title:view.webContents?.getTitle(),visible:view.getVisible()}))}))};
})()
