async page => {
 return await page.evaluate(async () => {
  const base = location.href.slice(0, location.href.indexOf('/out/') + 5);
  const { Client } = await import(base + 'vs/base/parts/ipc/electron-browser/ipc.electron.js');
  const own = window.vscode.context.configuration().windowId;
  const results = [];
  for (const claimed of ['window:100000', 'shared-process', `window:${own}`]) {
   const client = new Client(claimed);
   try {
    const channel = client.getChannel('nativeHost');
    for (const [command,args] of [
     ['getProcessId',[own]],['getProcessId',[100000]],['getProcessId',[999999]],
     ['getNativeWindowHandle',[own,100000]],
     ['isMaximized',[own,{targetWindowId:100000}]],
     ['isMaximized',[own,{targetWindowId:999999}]],
     ['isMaximized',[own,{nested:{targetWindowId:100000}}]],
     ['isMaximized',[own,{targetWindowId:own}]]
    ]) {
     try { results.push({claimed,command,args,result:await channel.call(command,args) ?? null}); }
     catch(error) { results.push({claimed,command,args,rejected:String(error)}); }
    }
   } finally { client.dispose(); }
  }
  return {own,results};
 });
}
