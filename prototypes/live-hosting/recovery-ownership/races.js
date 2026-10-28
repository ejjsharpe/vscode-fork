(async () => {
 const p=globalThis.recoveryProbe,w=p.target;
 const require=process.getBuiltinModule('module').createRequire(process.cwd()+'/package.json');
 const electron=require('electron'),assert=require('node:assert/strict');
 // Use a failed bootstrap to put the project in its real failed/retry state.
 const load=w.load;w.load=()=>{throw new Error('Injected bootstrap failure before retry race');};
 await w.destroyWindow(true,false);w.load=load;
 const before=p.snapshot();
 const validate=w.validateWorkspaceBeforeReload;
 let release,validations=0;
 w.validateWorkspaceBeforeReload=()=>{validations++;return new Promise(resolve=>{release=()=>resolve(w.config.workspace);});};
 const first=w.destroyWindow(true,false),second=w.destroyWindow(true,false);
 // Host shutdown during this in-flight recovery must veto without tearing down any view.
 electron.BrowserWindow.getAllWindows()[0].close();
 await new Promise(resolve=>setTimeout(resolve,1000));
 const during=p.snapshot();
 assert.equal(during.hosts.length,1);assert.equal(during.hosts[0].children,3);
 // Close the failed project before the delayed replacement can be created.
 await p.service.close(w);
 release();await Promise.all([first,second]);w.validateWorkspaceBeforeReload=validate;
 const after=p.snapshot();
 assert.equal(validations,1);
 assert.equal(after.hosts.length,1);assert.equal(after.hosts[0].children,2);
 assert.deepEqual(after.windows.map(w=>w.id),[100000,100001]);
 assert.equal(after.windowCounter,2);
 assert.equal(after.contents.some(c=>c.context==='window:100002'),false);
 for(const id of [100000,100001]) {assert.equal(after.windows.find(w=>w.id===id).generation,before.windows.find(w=>w.id===id).generation);}
 return {before,during,after,validations};
})()
