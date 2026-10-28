// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root.
// THROWAWAY: create dirty text using the current workbench's ordinary UI.
async page => {
 const title=await page.title();
 const value=title.includes('single')?'single unsaved work':'multi unsaved work';
 const skip=page.getByRole('button',{name:'Continue without Signing In',exact:true});
 if(await skip.isVisible()) {
  await skip.click();
  await page.getByRole('button',{name:'Get Started',exact:true}).click();
 }
 await page.keyboard.press('Escape');
 await page.getByRole('button',{name:'Open Quick Access',exact:true}).click();
 await page.locator('.quick-input-widget input').fill('>File: New Untitled Text File');
 await page.getByRole('option',{name:/^File: New Untitled Text File/}).click();
 await page.locator('.editor-instance .monaco-editor').first().waitFor({state:'visible'});
 await page.keyboard.type(value);
 await page.waitForFunction(expected=>[...document.querySelectorAll('.editor-instance .view-line')].map(x=>x.textContent).join('\n').replaceAll('\u00a0',' ')===expected,value);
 return {title:await page.title(),expected:value,dirtyTextConfirmed:true};
}
