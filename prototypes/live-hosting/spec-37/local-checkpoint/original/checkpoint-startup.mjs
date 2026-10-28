import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { _electron } from './integration/node_modules/playwright/index.mjs';

const repo = path.resolve(import.meta.dirname, 'integration');
const runtime = "/tmp/esc-cp38-yc6pfhob";
const results = [];
for (const launch of ['first', 'repeat']) {
	const app = await _electron.launch({
		executablePath: path.join(repo, '.build/electron/escode.app/Contents/MacOS/escode'),
		cwd: repo,
		args: ['.', `--user-data-dir=${runtime}/user-data`, `--shared-data-dir=${runtime}/shared-data`, `--extensions-dir=${runtime}/extensions`, '--disable-workspace-trust', '--use-inmemory-secretstorage', '--disable-extension=vscode.vscode-api-tests'],
		env: { ...process.env, VSCODE_DEV: '1', VSCODE_CLI: '1', NODE_ENV: 'development' },
		timeout: 30000
	});
	const log = await fs.open(path.join(runtime, `${launch}.log`), 'w');
	app.process().stdout?.on('data', data => void log.write(data));
	app.process().stderr?.on('data', data => void log.write(data));
	try {
		const shell = await app.firstWindow();
		await shell.getByText('Agents', { exact: true }).waitFor({ timeout: 30000 });
		const deadline = Date.now() + 30000;
		let workbench;
		while (!workbench && Date.now() < deadline) {
			workbench = app.context().pages().find(page => page.url().includes('/vs/sessions/electron-browser/sessions'));
			if (!workbench) { await new Promise(resolve => setTimeout(resolve, 100)); }
		}
		assert.ok(workbench, 'Real Agents workbench must load');
		await workbench.locator('.monaco-workbench').waitFor({ timeout: 30000 });
		const windows = await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows().map(window => ({ title: window.getTitle(), destroyed: window.isDestroyed() })));
		assert.equal(windows.length, 1, 'Agents and shell share one native window');
		assert.equal(await shell.getByRole('button', { name: 'Agents', exact: true }).getAttribute('aria-pressed'), 'true', 'Fresh startup selects permanent Agents');
		assert.equal(await shell.getByRole('tab').count(), 0, 'Fresh startup has no project tabs');
		await shell.screenshot({ path: path.join(runtime, `${launch}-shell.png`) });
		await workbench.screenshot({ path: path.join(runtime, `${launch}-agents.png`) });
		results.push({ launch, passed: true, windows, pages: app.context().pages().map(page => page.url()), pid: app.process().pid });
		await fs.writeFile(path.join(runtime, 'startup-results.json'), JSON.stringify(results, null, 2) + '\n');
	} finally {
		await app.close();
		await log.close();
	}
}
await fs.writeFile(path.join(runtime, 'startup-results.json'), JSON.stringify(results, null, 2) + '\n');
console.log(JSON.stringify(results.map(({ launch, passed, windows }) => ({ launch, passed, windows }))));
