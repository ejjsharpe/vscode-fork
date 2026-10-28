// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root.
(async()=>{
 const req=process.getBuiltinModule('module').createRequire(process.cwd()+'/package.json');
 const assert=req('node:assert/strict'),s=globalThis.replyProbe.service,w=s.prototypeWindows.get(100001),host=w.win;
 const view=w.hostedView,remove=host.contentView.removeChildView;
 let notifications=0,detaches=0,logs=0,direct;
 w.onDidClose(()=>notifications++);
 const logger=w.loggerMainService,originalLogger=logger.deregisterLoggers;
 logger.deregisterLoggers=function(id){if(id===w.id)logs++;return originalLogger.call(this,id);};
 host.contentView.removeChildView=function(child){
  if(child===view){detaches++;direct=w.disposePrototypeWorkbench();throw new Error('Injected view detachment failure');}
  return remove.call(this,child);
 };
 let outcome,directOutcome;
 try {
  outcome=await s.close(w).then(()=>({ok:true}),error=>({ok:false,error:String(error)}));
  directOutcome=await direct.then(()=>({ok:true}),error=>({ok:false,error:String(error)}));
 }finally{host.contentView.removeChildView=remove;logger.deregisterLoggers=originalLogger;}
 const failure={outcome,directOutcome,notifications,detaches,logs,logicalDisposed:w.logicalDisposed,count:s.windowCounter,children:host.contentView.children.length};
 globalThis.detachResult={failure};
 assert.equal(outcome.ok,false);assert.equal(directOutcome.ok,false);assert.equal(logs,1);assert.equal(notifications,1);assert.equal(w.logicalDisposed,false);
 const phases=globalThis.replyProbe.requests.length;
 await s.close(w);
 const retry={logicalDisposed:w.logicalDisposed,count:s.windowCounter,children:host.contentView.children.length,phasesReplayed:globalThis.replyProbe.requests.length-phases,notifications};
 globalThis.detachResult.retry=retry;
 assert.deepEqual(retry,{logicalDisposed:true,count:1,children:1,phasesReplayed:0,notifications:1});
 return globalThis.detachResult;
})()
