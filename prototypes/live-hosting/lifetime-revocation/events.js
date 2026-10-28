async page => {
 return await page.evaluate(async () => {
  const base = location.href.slice(0, location.href.indexOf('/out/') + 5);
  const {Client} = await import(base+'vs/base/parts/ipc/electron-browser/ipc.electron.js');
  const own = window.vscode.context.configuration().windowId;
  const client = new Client(`window:${own}`);
  const channel = client.getChannel('nativeHost');
  const events = [];
  const subscriptions = ['onDidBlurMainWindow','onDidFocusMainWindow','onDidMaximizeWindow','onDidUnmaximizeWindow'].map(name=>channel.listen(name)(value=>events.push({name,value})));
  await channel.call('getProcessId',[own]);
  await channel.call('focusWindow',[own,{mode:2}]);
  await new Promise(resolve=>setTimeout(resolve,400));
  await channel.call('maximizeWindow',[own]);
  await new Promise(resolve=>setTimeout(resolve,400));
  await channel.call('unmaximizeWindow',[own]);
  await new Promise(resolve=>setTimeout(resolve,400));
  await channel.call('minimizeWindow',[own]);
  await new Promise(resolve=>setTimeout(resolve,400));
  await channel.call('focusWindow',[own,{mode:2}]);
  await new Promise(resolve=>setTimeout(resolve,800));
  subscriptions.forEach(subscription=>subscription.dispose());
  client.dispose();
  return {own,events};
 });
}
