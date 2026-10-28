async page => {
 return await page.evaluate(async () => {
  const base = location.href.slice(0, location.href.indexOf('/out/') + 5);
  const {Client} = await import(base+'vs/base/parts/ipc/electron-browser/ipc.electron.js');
  const own = window.vscode.context.configuration().windowId;
  const client = new Client(`window:${own}`);
  const oldHost = sessionStorage.getItem('lifetimeOldHost');
  let stale;
  try { stale = {accepted:true,result:await client.getChannel('extensionHostStarter').call('enableInspectPort',[oldHost])}; }
  catch(error) { stale = {accepted:false,rejected:String(error)}; }
  const fresh = await client.getChannel('extensionHostStarter').call('createExtensionHost',[]);
  const control = await client.getChannel('extensionHostStarter').call('enableInspectPort',[fresh.id]);
  client.dispose();
  return {own,oldHost,stale,fresh,control};
 });
}
