(async () => {
 const p=globalThis.recoveryProbe,w=p.target;
 const require=process.getBuiltinModule('module').createRequire(process.cwd()+'/package.json');
 const electron=require('electron'),hostModule=require('./out/vs/platform/windows/electron-main/prototypeWorkbenchHost.js');
 const assert=require('node:assert/strict');
 const load=w.load;w.load=()=>{throw new Error('Injected replacement bootstrap failure');};
 await w.destroyWindow(true,false);w.load=load;
 const before=p.snapshot();
 let releaseValidation,validations=0;
 const validate=w.validateWorkspaceBeforeReload;
 w.validateWorkspaceBeforeReload=()=>{validations++;return new Promise(resolve=>{releaseValidation=()=>resolve(w.config.workspace);});};
 const first=w.destroyWindow(true,false),second=w.destroyWindow(true,false);
 // Delay the coordinator AFTER a real authorised before-unload response, to make the overlap repeatable.
 const beforeUnload=p.service.onBeforeUnloadWindowInRenderer;
 let releaseHost,entered;
 const atHostPhase=new Promise(resolve=>{entered=resolve;});
 let firstPhase=true;
 p.service.onBeforeUnloadWindowInRenderer=async function(...args) {
  const response=await beforeUnload.apply(this,args);
  if(firstPhase){firstPhase=false;entered();await new Promise(resolve=>{releaseHost=resolve;});}
  return response;
 };
 electron.BrowserWindow.getAllWindows()[0].close();
 await atHostPhase;
 const during={state:p.snapshot(),hostClosing:hostModule.prototypeHostClosing,recovering:!!w.recovery};
 const closing = p.service.close(w);
 const repeatedClose = p.service.close(w);
 const pending = w.closePending;
 const cancelledRecovery = !w.recovery;
 assert.equal(closing, repeatedClose);
 assert.equal(pending, true);
 assert.equal(cancelledRecovery, true);
 const afterCloseRequest={closed:w.logicallyClosed,state:p.snapshot()};
 releaseHost();
 const deadline=Date.now()+5000;
 while(hostModule.prototypeHostClosing&&Date.now()<deadline){await new Promise(resolve=>setTimeout(resolve,25));}
 p.service.onBeforeUnloadWindowInRenderer=beforeUnload;
 assert.equal(hostModule.prototypeHostClosing,false,'Host shutdown must finish/veto before releasing retry');
 const afterCanceledHost=p.snapshot();
 releaseValidation();await Promise.all([first,second,closing]);w.validateWorkspaceBeforeReload=validate;
 const after=p.snapshot();
 const result={before,during,afterCloseRequest,afterCanceledHost,after,validations,pending,cancelledRecovery,closeHonored:!after.windows.some(x=>x.id===w.id)};
 globalThis.recoveryProbe.closeRace=result;
 // Evidence records the failure instead of discarding state at the first assertion.
 assert.equal(validations,1);assert.equal(during.hostClosing,true);assert.equal(during.recovering,true);
 assert.equal(result.closeHonored,true,'Accepted Close must cancel recovery and remove only its project');
 assert.equal(after.hosts[0].children, 2);
 assert.deepEqual(after.windows.map(x=>x.id), before.windows.filter(x=>x.id!==w.id).map(x=>x.id));
 return result;
})()
