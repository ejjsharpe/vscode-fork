async page => {
 return await page.evaluate(async () => {
  const base = location.href.slice(0, location.href.indexOf('/out/') + 5);
  const {Client} = await import(base+'vs/base/parts/ipc/electron-browser/ipc.electron.js');
  const own = window.vscode.context.configuration().windowId;
  const client = new Client(`window:${own}`);
  try {
   try { return {own,oldHost:'5',accepted:true,result:await client.getChannel('extensionHostStarter').call('enableInspectPort',['5'])}; }
   catch(error) { return {own,oldHost:'5',accepted:false,rejected:String(error)}; }
  } finally {client.dispose();}
 });
}
