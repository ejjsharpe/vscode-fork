// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root.
// THROWAWAY: ordinary UI actions only; run via the named Playwright CLI session.
async page => {
 const pages = page.context().pages();
 const shell = pages.find(p => p.url().startsWith('data:text/html'));
 let projectOne, projectTwo, agents;
 for (const candidate of pages) {
  const title = await candidate.title();
  if (title.includes('single')) projectOne = candidate;
  if (title.includes('multi')) projectTwo = candidate;
  if (title === 'Agents') agents = candidate;
 }
 if (!shell || !projectOne || !projectTwo || !agents) throw new Error('Expected shell, Agents and two project workbenches');
 const text = async p => (await p.locator('.editor-instance .view-line').allTextContents()).join('\n').replaceAll('\u00a0', ' ');
 const select = async label => {
  const point = await shell.evaluate(name => { const element=[...document.links].find(a=>a.textContent===name);if(!element)throw new Error('Missing project tab');const r=element.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}; },label);
  await shell.mouse.click(point.x,point.y);
  const selected = label.startsWith('Agents') ? agents : label.startsWith('Project 1') ? projectOne : projectTwo;
  // Playwright emulates focus; this does not certify native keyboard focus.
  await selected.waitForFunction(()=>document.hasFocus());
 };
 for (const [label,project,value] of [['Project 1 (100001)',projectOne,'single unsaved work'],['Project 2 (100002)',projectTwo,'multi unsaved work']]) {
  await select(label);
  const noSignIn = project.getByRole('button',{name:'Continue without Signing In',exact:true});
  if (await noSignIn.isVisible()) {
   await noSignIn.click(); await project.getByRole('button',{name:'Get Started',exact:true}).click();
  }
  await project.keyboard.press('Escape');
  await project.keyboard.press('Meta+Shift+p');
  await project.locator('.quick-input-widget input').fill('>File: New Untitled Text File');
  await project.getByRole('option',{name:/^File: New Untitled Text File/}).click();
  await project.locator('.editor-instance .monaco-editor').first().waitFor({state:'visible'});
  await project.keyboard.type(value);
  await project.waitForFunction(expected => [...document.querySelectorAll('.editor-instance .view-line')].map(x=>x.textContent).join('\n').replaceAll('\u00a0',' ')===expected,value);
  if ((await text(project)) !== value) throw new Error('Project edit did not land');
 }
 const firstTitle = await projectOne.title(), secondTitle = await projectTwo.title();
 for (let i=0;i<3;i++) {
  await select('Agents (100000)');
  await select('Project 2 (100002)');
  if ((await text(projectTwo)) !== 'multi unsaved work') throw new Error('Multi project editor changed during switching');
  await select('Project 1 (100001)');
  if ((await text(projectOne)) !== 'single unsaved work') throw new Error('Single project editor changed during switching');
 }
 if (await projectOne.title() !== firstTitle || await projectTwo.title() !== secondTitle) throw new Error('Project editor titles changed');
 return {ordinaryUI:true,switchCycles:3,dirtySingleEditorPreserved:true,dirtyMultiEditorPreserved:true,bothTitlesRetainDirtyMarker:firstTitle.includes('•')&&secondTitle.includes('•'),agentsStillPresent:!agents.isClosed(),nativeCloseCancelSavePending:true};
}
