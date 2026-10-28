// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root.
// THROWAWAY: invoke the ordinary selected-workbench Close Window command.
async page => {
 await page.keyboard.press('Escape');
 await page.getByRole('button',{name:'Open Quick Access',exact:true}).click();
 await page.locator('.quick-input-widget input').fill('>Close Window');
 await page.getByRole('option',{name:/^Close Window,/}).click();
 const warning=page.getByText('Unclassified/coordinator-only native operation: closeWindow',{exact:true});
 const workbenches=page.context().pages().filter(p=>p.url().startsWith('vscode-file:'));
 await Promise.race([warning.waitFor({state:'visible'}),...workbenches.map(p=>p.getByRole('button',{name:/^(Save|Terminate)$/}).waitFor({state:'visible'}))]);
 if(await warning.isVisible())throw new Error('Ordinary Close Window rejected as an unclassified operation');
 for(const workbench of workbenches) {
  if(await workbench.getByRole('button',{name:/^(Save|Terminate)$/}).isVisible())return {ordinaryCommand:true,safeguardVisible:true,safeguardButton:await workbench.getByRole('button',{name:/^(Save|Terminate)$/}).innerText(),safeguardWorkbench:await workbench.title()};
 }
 throw new Error('Expected real save or terminal safeguard');
}
