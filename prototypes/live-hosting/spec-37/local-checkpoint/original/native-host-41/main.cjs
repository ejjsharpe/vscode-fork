const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { app } = require('electron');
app.setPath('userData', path.join(__dirname, 'profile'));
app.on('window-all-closed', () => {});
app.whenReady().then(async () => {
 const root = process.env.ESCODE_CHECK_ROOT;
 const hosting = await import(pathToFileURL(path.join(root, 'out/vs/platform/windows/electron-main/prototypeWorkbenchHost.js')).href);
 const options = { show: false, webPreferences: { sandbox: true, contextIsolation: true, nodeIntegration: false } };
 let nativeHost;
 try {
  const agents = hosting.createPrototypeWorkbench(options, true);
  nativeHost = agents.host;
  const project = hosting.createPrototypeWorkbench(options, false);
  const neighbour = hosting.createPrototypeWorkbench(options, false);
  assert.deepStrictEqual(nativeHost.contentView.children, [neighbour.view], 'Only the selected project is attached');
  assert.equal(project.view.webContents.isDestroyed(), false, 'Inactive execution remains live');
  hosting.selectPrototypeWorkbench(project.id);
  assert.deepStrictEqual(nativeHost.contentView.children, [project.view], 'Switch attaches the retained view only');
  const replacement = hosting.replacePrototypeWorkbench(neighbour.id, options);
  assert.deepStrictEqual(nativeHost.contentView.children, [project.view], 'Inactive recovery stays detached');
  assert.equal(replacement.webContents.isDestroyed(), false, 'Inactive replacement is retained');
  hosting.removePrototypeWorkbench(neighbour.id);
  assert.deepStrictEqual(nativeHost.contentView.children, [project.view], 'Inactive disposal preserves selection');
  hosting.removePrototypeWorkbench(project.id);
  assert.deepStrictEqual(nativeHost.contentView.children, [agents.view], 'Final project disposal reveals permanent Agents');
  console.log('PASS: selected-only native attachment, retained inactive lifetime, replacement and disposal');
 } finally {
  if (nativeHost && !nativeHost.isDestroyed()) nativeHost.destroy();
 }
}).then(() => app.exit(0), error => { console.error(error); app.exit(1); });
