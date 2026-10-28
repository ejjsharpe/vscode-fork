// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root.
// Real renderer popup adapter and native popup; programmatic native dismissal.
(async()=>{
 const req=process.getBuiltinModule('module').createRequire(process.cwd()+'/package.json');
 const assert=req('node:assert/strict'),{Menu}=req('electron');
 const c=replyProbe.service.prototypeWindows.get(100002).webContents;
 const module='vscode-file://vscode-app'+process.cwd()+'/out/vs/base/parts/contextmenu/electron-browser/contextmenu.js';
 const original=Menu.prototype.popup;let menu;
 Menu.prototype.popup=function(options){menu=this;return original.call(this,options);};
 try {
  await c.executeJavaScript(`(async()=>{const {popup}=await import(${JSON.stringify(module)});globalThis.nativeMenuProbe={hidden:0,clicked:0};popup([{label:'Disposable native menu',click:()=>nativeMenuProbe.clicked++}],undefined,()=>nativeMenuProbe.hidden++);return true;})()`);
  const deadline=Date.now()+5000;while(!menu&&Date.now()<deadline)await new Promise(r=>setTimeout(r,10));assert.ok(menu);
  await new Promise(r=>setTimeout(r,200));menu.closePopup();
  let result;for(let i=0;i<100;i++){result=await c.executeJavaScript('nativeMenuProbe');if(result.hidden)break;await new Promise(r=>setTimeout(r,20));}
  assert.deepEqual(result,{hidden:1,clicked:0});return {realRendererPopupAdapter:true,realNativeMenu:true,programmaticNativeDismissal:true,result};
 }finally{Menu.prototype.popup=original;menu?.closePopup();}
})()
