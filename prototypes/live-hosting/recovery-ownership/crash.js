(async () => {
 const p=globalThis.recoveryProbe;
 p.before=p.snapshot();
 const before=p.before;
 p.oldContents=p.target.webContents;
 p.oldContents.forcefullyCrashRenderer();
 await new Promise(resolve=>setTimeout(resolve,500));
 return {before,afterCrash:p.snapshot()};
})()
