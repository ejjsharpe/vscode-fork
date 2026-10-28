// Product invariant: an explicit Close must not stay orphaned after replacement readiness.
(()=>{
 const req=process.getBuiltinModule('module').createRequire(process.cwd()+'/package.json');
 req('node:assert/strict').equal(globalThis.replyProbe.service.pendingProjectCloses.has(100002),false,'Explicit Close remained pending after the replacement workbench became ready');
 return {passed:true};
})()
