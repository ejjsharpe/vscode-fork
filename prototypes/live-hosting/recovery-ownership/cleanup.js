(() => {
 const electron=process.getBuiltinModule('module').createRequire(process.cwd()+'/package.json')('electron');
 setTimeout(()=>electron.app.exit(0),200);
 return {cleanup:'app.exit(0)',gracefulShutdownTest:false};
})()
