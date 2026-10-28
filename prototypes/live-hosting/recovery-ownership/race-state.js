(() => {
 const p=globalThis.recoveryProbe;
 const require=process.getBuiltinModule('module').createRequire(process.cwd()+'/package.json');
 return {snapshot:p.snapshot(),hostClosing:require('./out/vs/platform/windows/electron-main/prototypeWorkbenchHost.js').prototypeHostClosing,pendingUnloads:[...p.service.mapWindowIdToPendingUnload.keys()],closingProjects:[...p.service.closingProjects],targetClosed:p.target.logicallyClosed,recovering:!!p.target.recovery};
})()
