// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root.
(()=>{
const req=process.getBuiltinModule('module').createRequire(process.cwd()+'/package.json');
const {WindowsMainService}=req('./out/vs/platform/windows/electron-main/windowsMainService.js');
const original=WindowsMainService.prototype.open;
WindowsMainService.prototype.open=function(...args){globalThis.readinessWindows=this;WindowsMainService.prototype.open=original;return original.apply(this,args);};
return {installed:true};
})()
