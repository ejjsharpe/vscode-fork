// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root.
// THROWAWAY: real renderer IPC; popup scheduling and invalid main events injected.
(async()=>{
 const req=process.getBuiltinModule('module').createRequire(process.cwd()+'/package.json');
 const assert=req('node:assert/strict'),{Menu,ipcMain}=req('electron'),life=req('./out/vs/base/parts/ipc/electron-main/prototypeLifetime.js');
 const s=replyProbe.service,w=s.prototypeWindows.get(100002),c=w.webContents,neighbour=s.prototypeWindows.get(100001).webContents;
 const wait=ms=>new Promise(r=>setTimeout(r,ms));
 const until=async predicate=>{const end=Date.now()+25000;while(!predicate()&&Date.now()<end)await wait(10);assert.ok(predicate());};
 await until(()=>life.prototypeLifecycleReady(c));
 const original=Menu.prototype.popup,originalClose=Menu.prototype.closePopup,menus=[];let closed=0,captured;
 const tap=(event,...args)=>{if(event.sender===c)captured={event,args};};
 ipcMain.prependListener('vscode:contextmenu',tap);
 Menu.prototype.popup=function(options){menus.push({menu:this,options});};
 Menu.prototype.closePopup=function(){closed++;};
 const send=async(id,channel=`vscode:onContextMenu${id}`,extra='')=>c.executeJavaScript(`vscode.ipcRenderer.send('vscode:contextmenu',${id},[{id:0,label:'Probe',enabled:true}],'${channel}',{}${extra});true;`);
 const listen=async id=>c.executeJavaScript(`globalThis.menuProbe=[];vscode.ipcRenderer.on('vscode:onContextMenu${id}',(_event,...args)=>menuProbe.push({kind:'click',args}));vscode.ipcRenderer.on('vscode:onCloseContextMenu',(_event,id)=>menuProbe.push({kind:'close',id}));true;`);
 const read=()=>c.executeJavaScript('menuProbe');
 const results=[];
 try {
  await listen(92000);await send(92000);await until(()=>menus.length===1);
  menus[0].menu.items[0].click({shiftKey:true},w.win,c);menus[0].options.callback();await wait(100);
  const current=await read();assert.ok(current.some(x=>x.kind==='click'&&x.args[0]===0));assert.ok(current.some(x=>x.kind==='close'&&x.id===92000));
  const count=current.length;menus[0].options.callback();menus[0].menu.items[0].click({},w.win,c);await wait(50);assert.equal((await read()).length,count);
  results.push({case:'own current request, injected native click and dismissal delivered once; post-dismissal callbacks inert',received:current});
  await send(92001,'vscode:unrelatedCallback');await send(92002,'vscode:onContextMenu92002',",'extra'");await wait(100);assert.equal(menus.length,1);
  const {event,args}=captured;
  ipcMain.emit('vscode:contextmenu',event,...args.slice(0,4));
  ipcMain.emit('vscode:contextmenu',{sender:c,senderFrame:null},92003,[{id:0,label:'Invalid'}],'vscode:onContextMenu92003',{},args.at(-1));
  assert.equal(menus.length,1);results.push({case:'arbitrary callback and extra arguments rejected on real wire; missing credential and non-main frame rejected by injected main events'});
  await send(92004);await until(()=>menus.length===2);const old=menus.at(-1),oldEvent=captured;
  const before=life.prototypeDocumentGeneration(c),neighbourBefore=life.prototypeDocumentGeneration(neighbour);
  c.reload();await until(()=>life.prototypeDocumentGeneration(c)!==before&&life.prototypeLifecycleReady(c));
  assert.equal(closed,1);await listen(92004);
  old.menu.items[0].click({},w.win,c);old.options.callback();await wait(100);assert.deepEqual(await read(),[]);
  ipcMain.emit('vscode:contextmenu',{sender:c,senderFrame:c.mainFrame},...oldEvent.args);assert.equal(menus.length,2);
  assert.equal(life.prototypeDocumentGeneration(neighbour),neighbourBefore);
  results.push({case:'real replacement closes old menu; old click/dismissal and injected expired request cannot affect new document; neighbour unchanged'});
  await send(92004);await until(()=>menus.length===3);menus.at(-1).options.callback();await wait(100);assert.ok((await read()).some(x=>x.kind==='close'));
  results.push({case:'fresh authorized request succeeds after replacement'});
  return {results,heldNativePopups:true,realRendererIPC:true,closedOnRevocation:closed};
 }finally{ipcMain.removeListener('vscode:contextmenu',tap);Menu.prototype.popup=original;Menu.prototype.closePopup=originalClose;}
})()
