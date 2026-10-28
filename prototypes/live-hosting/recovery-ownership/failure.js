(async () => {
 const p=globalThis.recoveryProbe,w=p.target;
 const original=w.load;
 const before=p.snapshot();
 w.load=()=>{throw new Error('Injected replacement bootstrap failure');};
 await w.destroyWindow(true,false);
 w.load=original;
 const after=p.snapshot();
 const electron=process.getBuiltinModule('module').createRequire(process.cwd()+'/package.json')('electron');
 const shell=await electron.BrowserWindow.getAllWindows()[0].webContents.executeJavaScript('document.body.innerText');
 const assert=process.getBuiltinModule('assert/strict');
 assert.equal(after.hosts.length,1);assert.equal(after.hosts[0].children,3);
 assert.equal(after.windows.find(x=>x.id===w.id).ready,false);
 assert.equal(after.windows.find(x=>x.id===w.id).generation,undefined);
 assert.match(shell,/Recovery failed/);assert.match(shell,/Retry/);assert.match(shell,/Close/);
 return {before,after,shell};
})()
