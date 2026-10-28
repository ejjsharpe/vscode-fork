(async()=>{
 const req=process.getBuiltinModule('module').createRequire(process.cwd()+'/package.json');
 const host=req('electron').BrowserWindow.getAllWindows()[0];
 const png=await host.webContents.capturePage();
 req('node:fs').writeFileSync('prototypes/live-hosting/close-completion/evidence/interrupted-shell.png',png.toPNG());
 return {text:await host.webContents.executeJavaScript('document.body.innerText'),hostDestroyed:host.isDestroyed()};
})()
