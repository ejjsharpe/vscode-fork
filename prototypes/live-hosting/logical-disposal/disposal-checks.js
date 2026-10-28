// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root.
(async () => {
 const require=process.getBuiltinModule('module').createRequire(process.cwd()+'/package.json');
 const assert=require('node:assert/strict');
 const electron=require('electron');
 const p=globalThis.recoveryProbe,s=p.service,expired=p.target;
 const host=electron.BrowserWindow.getAllWindows()[0];
 const oldHost=host.id;
 let stale;
 try { stale={accepted:true,id:expired.webContents.id}; } catch(error) { stale={accepted:false,error:String(error)}; }
 assert.equal(stale.accepted,false);
 assert.match(stale.error,/Expired hosted workbench/);
 await s.close(expired);await s.close(expired);
 assert.equal(s.windowCounter,2);
 assert.equal(host.contentView.children.length,2);
 assert.equal(s.pendingProjectCloses.size,0);
 const remaining=s.prototypeWindows.get(100001),agents=s.prototypeWindows.get(100000);
 const before={state:p.snapshot(),stale,agentsText:await agents.webContents.executeJavaScript('document.body.innerText.slice(0,160)'),projectText:await remaining.webContents.executeJavaScript('document.body.innerText.slice(0,160)')};
 // A real disposal failure after independent view/registry cleanup. Reenter while Close is still pending.
 const logger=remaining.loggerMainService,original=logger.deregisterLoggers;
 let notifications=0,reentrant,pendingDuringError=false,closing,coalescedDuringError;
 remaining.onDidClose(()=>{notifications++;});
 logger.deregisterLoggers=function(id) {
  if(id===remaining.id) {
   pendingDuringError=remaining.closePending && s.pendingProjectCloses.has(id);
   reentrant=s.close(remaining);
   coalescedDuringError=reentrant===closing;
   throw new Error('Injected logger cleanup failure');
  }
  return original.call(this,id);
 };
 let outerOutcome;
 try { closing=s.close(remaining);outerOutcome=await closing.then(()=>({ok:true}),error=>({ok:false,error:String(error)})); }
 finally {logger.deregisterLoggers=original;}
 const reentrantOutcome=await reentrant.then(()=>({ok:true}),error=>({ok:false,error:String(error)}));
 const result={before,pendingDuringError,coalescedDuringError,notifications,outerOutcome,reentrantOutcome,after:p.snapshot(),sameHost:host.id===oldHost,children:host.contentView.children.length,logicalDisposed:remaining.logicalDisposed,closed:remaining.logicallyClosed,shell:await host.webContents.executeJavaScript('document.body.innerText')};
 globalThis.disposalResult=result;
 globalThis.disposalTarget=remaining;
 assert.equal(pendingDuringError,true);
 assert.equal(outerOutcome.ok,false,'A genuine cleanup error must fail Close');
 assert.equal(result.sameHost,true);
 assert.equal(notifications,1);
 assert.equal(s.windowCounter,1);
 assert.equal(result.children,1);
 assert.equal(reentrantOutcome.ok,false,'Reentrant Close must not report success while the same disposal fails');
 assert.equal(coalescedDuringError,true,'Repeated Close must retain the pending outcome through cleanup');
 return result;
})()
