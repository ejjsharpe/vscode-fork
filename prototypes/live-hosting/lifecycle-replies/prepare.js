async page => {
 await page.evaluate(() => {
  window.lifetimeUnloadRequests = [];
  for (const channel of ['vscode:onBeforeUnload','vscode:onWillUnload']) {
   window.vscode.ipcRenderer.on(channel, (_event, request) => window.lifetimeUnloadRequests.push({channel,...request}));
  }
 });
 await page.keyboard.press('F1');
 await page.getByRole('textbox', {name:'Type the name of a command to run.'}).fill('>File: New Untitled Text File');
 await page.getByRole('option', {name:/^File: New Untitled Text File/}).first().click();
 await page.keyboard.type('Disposable lifecycle reply test');
 return await page.locator('body').innerText();
}
