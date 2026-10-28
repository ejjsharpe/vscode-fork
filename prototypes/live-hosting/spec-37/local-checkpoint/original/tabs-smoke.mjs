import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { _electron } from './integration/node_modules/playwright/index.mjs';

const repo = path.resolve(import.meta.dirname, 'integration');
const fixtures = path.resolve(import.meta.dirname, 'runtime');
const runtime = path.join(fixtures, 'tabs');
await fs.mkdir(path.join(runtime, 'user-data/User'), { recursive: true });
await fs.mkdir(path.join(runtime, 'shared-data'), { recursive: true });
await fs.mkdir(path.join(runtime, 'extensions'), { recursive: true });
await fs.copyFile(path.join(fixtures, 'user-data/User/settings.json'), path.join(runtime, 'user-data/User/settings.json'));
const app = await _electron.launch({
	executablePath: path.join(repo, '.build/electron/escode.app/Contents/MacOS/escode'),
	cwd: repo,
	args: ['.', `--user-data-dir=${runtime}/user-data`, `--shared-data-dir=${runtime}/shared-data`, `--extensions-dir=${runtime}/extensions`, '--disable-workspace-trust', '--use-inmemory-secretstorage', '--disable-extension=vscode.vscode-api-tests', '--new-window', path.join(fixtures, 'single'), path.join(fixtures, 'multi.code-workspace')],
	env: { ...process.env, VSCODE_DEV: '1', VSCODE_CLI: '1', NODE_ENV: 'development' }, timeout: 30000
});
const log = await fs.open(path.join(runtime, 'runtime.log'), 'w');
app.process().stdout?.on('data', data => void log.write(data));
app.process().stderr?.on('data', data => void log.write(data));
try {
	const shell = await app.firstWindow();
	console.log('Primary shell:', shell.url().startsWith('data:'));
	await shell.getByRole('tab', { name: /^single/ }).waitFor({ timeout: 30000 });
	await shell.getByRole('tab', { name: /^multi.code-workspace/ }).waitFor({ timeout: 30000 });
	assert.equal(await shell.getByRole('tab').count(), 2);
	assert.equal(await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows().length), 1);
	const loaded = Date.now() + 30000;
	while (app.context().pages().filter(page => /\/(workbench|sessions)-dev\.html/.test(page.url())).length !== 3 && Date.now() < loaded) {
		await new Promise(resolve => setTimeout(resolve, 100));
	}
	for (const page of app.context().pages().filter(page => /\/(workbench|sessions)-dev\.html/.test(page.url()))) {
		await page.locator('.monaco-workbench').waitFor({ state: 'attached', timeout: 30000 });
	}
	const before = await app.evaluate(({ webContents }) => webContents.getAllWebContents().filter(contents => /\/(workbench|sessions)-dev\.html/.test(contents.getURL())).map(contents => ({ id: contents.id, url: contents.getURL(), pid: contents.getOSProcessId() })));
	assert.equal(before.length, 3);
	for (let iteration = 0; iteration < 3; iteration++) {
		for (const name of [/^single/, /^multi.code-workspace/]) {
			const tab = shell.getByRole('tab', { name });
			await tab.dispatchEvent('click');
			await shell.getByRole('tab', { name, selected: true }).waitFor();
			assert.equal(await tab.getAttribute('aria-selected'), 'true');
			await shell.getByRole('button', { name: 'Agents', exact: true }).dispatchEvent('click');
			await shell.getByRole('button', { name: 'Agents', exact: true, pressed: true }).waitFor();
			assert.equal(await shell.getByRole('button', { name: 'Agents', exact: true }).getAttribute('aria-pressed'), 'true');
		}
	}
	const after = await app.evaluate(({ webContents }) => webContents.getAllWebContents().filter(contents => /\/(workbench|sessions)-dev\.html/.test(contents.getURL())).map(contents => ({ id: contents.id, url: contents.getURL(), pid: contents.getOSProcessId() })));
	assert.deepEqual(after, before, 'Switches retain the original renderer contents/processes');
	await shell.getByRole('tab', { name: /^single/ }).dispatchEvent('click');
	await shell.getByRole('tab', { name: /^single/, selected: true }).waitFor();
	await shell.screenshot({ path: path.join(runtime, 'shell.png') });
	const pages = await Promise.all(app.context().pages().filter(page => !page.url().startsWith('data:')).map(async page => ({ title: await page.title(), url: page.url() })));
	await fs.writeFile(path.join(runtime, 'results.json'), JSON.stringify({ passed: true, iterations: 3, before, after, tabs: await shell.getByRole('tab').allTextContents(), pages }, null, 2) + '\n');
	console.log('Two project tabs and Agents switched repeatedly; original renderers retained.');
} catch (error) {
	await fs.writeFile(path.join(runtime, 'failure.txt'), String(error.stack ?? error));
	throw error;
} finally {
	let closeTimer;
	await Promise.race([
		app.close(),
		new Promise(resolve => { closeTimer = setTimeout(() => { app.process().kill('SIGTERM'); console.log('Fixture cleanup required SIGTERM; no host shutdown pass claimed.'); resolve(); }, 10000); })
	]);
	clearTimeout(closeTimer);
	await log.close();
}
