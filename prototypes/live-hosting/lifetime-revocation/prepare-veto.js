async page => {
 await page.evaluate(() => {
  window.lifetimeUnloadRequests = [];
  window.vscode.ipcRenderer.on('vscode:onBeforeUnload', (_event, request) => window.lifetimeUnloadRequests.push(request));
 });
 await page.keyboard.press('Meta+n');
 await page.keyboard.type('Disposable lifetime veto probe');
 return await page.locator('body').innerText();
}
