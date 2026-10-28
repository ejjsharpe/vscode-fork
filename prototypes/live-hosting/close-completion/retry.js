(async()=>{
 const w=globalThis.disposalTarget,s=globalThis.recoveryProbe.service;
 const assert=process.getBuiltinModule('module').createRequire(process.cwd()+'/package.json')('node:assert/strict');
 const before={requests:globalThis.replyProbe.requests.length,count:s.windowCounter};
 let notifications=0;w.onDidClose(()=>notifications++);
 await s.close(w);
 await w.disposePrototypeWorkbench();
 const after={requests:globalThis.replyProbe.requests.length,count:s.windowCounter};
 assert.deepEqual(before,after);assert.equal(w.logicalDisposed,true);assert.equal(notifications,0);
 return {before,after,logicalDisposed:w.logicalDisposed,notifications};
})()
