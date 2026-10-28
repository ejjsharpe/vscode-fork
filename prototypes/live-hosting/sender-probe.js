async page => {
 return await page.evaluate(async () => {
  const base = location.href.slice(0, location.href.indexOf('/out/') + 5);
  const { Client } = await import(base + 'vs/base/parts/ipc/electron-browser/ipc.electron.js');
  const own = window.vscode.context.configuration().windowId;
  const client = new Client(`window:${own}`);
  try {
   const channel = client.getChannel('nativeHost');
   const results = [];
   for (const target of [100000,100001,100002,999999]) {
    try { results.push({target, pid: await channel.call('getProcessId',[target]) ?? null}); }
    catch(error) { results.push({target,rejected:String(error)}); }
   }
   return {callerWorkbench:own,results};
  } finally { client.dispose(); }
 });
}
