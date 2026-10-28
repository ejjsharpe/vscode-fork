/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// THROWAWAY: stage-one hosting/routing probe. No production lifecycle implementation.
import electron from 'electron';

let host: electron.BrowserWindow | undefined;
let nextId = 100000;
let selected: number | undefined;
const views = new Map<number, { view: electron.WebContentsView; label: string }>();

export function selectPrototypeWorkbench(id: number): void {
	const target = views.get(id);
	if (!target || target.view.webContents.isDestroyed() || !host) {
		throw new Error(`Unknown/disposed prototype workbench ${id}`);
	}
	selected = id;
	for (const [key, entry] of views) {
		entry.view.setVisible(key === id);
	}
	const [width, height] = host.getContentSize();
	target.view.setBounds({ x: 0, y: 42, width, height: Math.max(0, height - 42) });
	target.view.webContents.focus();
	console.log('[hosting-probe] selected', JSON.stringify({ id, nativeHost: host.id, webContents: target.view.webContents.id }));
}

function renderShell(): void {
	const links = [...views].map(([id, entry]) => `<a href="https://prototype.invalid/select/${id}">${entry.label} (${id})</a>`).join(' ');
	void host!.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(`<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'"><title>Disposable hosting probe</title><style>body{margin:0;background:#202020;color:white;font:14px system-ui}nav{height:42px;display:flex;align-items:center;gap:20px;padding:0 20px}a{color:white}</style><nav>${links}</nav>`));
}

export function createPrototypeWorkbench(options: electron.BrowserWindowConstructorOptions, agents: boolean) {
	if (!host) {
		host = new electron.BrowserWindow({ ...options, width: 1280, height: 900, titleBarStyle: 'default', webPreferences: { sandbox: true, contextIsolation: true, nodeIntegration: false } });
		host.webContents.on('will-navigate', (event, url) => {
			event.preventDefault();
			const match = /^https:\/\/prototype\.invalid\/select\/(\d+)$/.exec(url);
			if (match) { selectPrototypeWorkbench(Number(match[1])); }
		});
		host.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
		host.on('resize', () => { if (selected !== undefined) { selectPrototypeWorkbench(selected); } });
		// shortcut: shutdown coordination is unimplemented, keep this probe read-only until Stage 1 routing passes.
		host.on('close', event => { event.preventDefault(); console.log('[hosting-probe] host close blocked: coordinator unimplemented'); });
	}
	const id = nextId++;
	const view = new electron.WebContentsView({ webPreferences: { ...options.webPreferences, backgroundThrottling: false } });
	views.set(id, { view, label: agents ? 'Agents' : `Project ${views.size}` });
	host.contentView.addChildView(view);
	view.webContents.on('destroyed', () => { views.delete(id); });
	view.webContents.on('did-finish-load', () => {
		console.log('[hosting-probe] loaded', JSON.stringify({ id, nativeHost: host!.id, webContents: view.webContents.id, pid: view.webContents.getOSProcessId(), url: view.webContents.getURL() }));
	});
	renderShell();
	selectPrototypeWorkbench(id);
	return { host, view, id };
}
