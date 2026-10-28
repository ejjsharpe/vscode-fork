/*---------------------------------------------------------------------------------------------
	*  Copyright (c) Microsoft Corporation. All rights reserved.
	*  Licensed under the MIT License. See License.txt in the project root for license information.
	*--------------------------------------------------------------------------------------------*/

// Run with Electron from the repository root and a fresh ESCODE_CHECK_PROFILE.
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { app } = require('electron');
assert.ok(process.env.ESCODE_CHECK_PROFILE, 'Set ESCODE_CHECK_PROFILE to isolated scratch state');
app.setPath('userData', process.env.ESCODE_CHECK_PROFILE);
app.on('window-all-closed', () => {});
app.whenReady().then(async () => {
	const root = process.cwd();
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
		assert.equal(hosting.getSelectedPrototypeWorkbench(nativeHost), neighbour.id, 'Native focus resolves the selected logical workbench');
		await project.view.webContents.loadURL('data:text/html,<script>globalThis.progress=0;setInterval(()=>progress++,10)</script>');
		const before = await project.view.webContents.executeJavaScript('progress');
		await new Promise(resolve => setTimeout(resolve, 80));
		assert.ok(await project.view.webContents.executeJavaScript('progress') > before, 'Detached workbench keeps making background progress');
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
