/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// THROWAWAY: retained-view recovery and logical lifetime experiment.
import electron from 'electron';
import { localize } from '../../../nls.js';
import { registerPrototypeDocument } from '../../../base/parts/ipc/electron-main/prototypeLifetime.js';

let host: electron.BrowserWindow | undefined;
let nextId = 100000;
let selected: number | undefined;
const views = new Map<number, { view: electron.WebContentsView; label: string; state?: string; retry?: () => void; close?: () => void }>();
export let prototypeHostClosing = false;
export function setPrototypeHostClosing(value: boolean): void { prototypeHostClosing = value; }

export function setPrototypeRecovery(id: number, state: string | undefined, retry?: () => void, close?: () => void): void {
	const entry = views.get(id);
	if (!entry) { return; }
	Object.assign(entry, { state, retry, close });
	renderShell();
}

export function removePrototypeWorkbench(id: number): void {
	const entry = views.get(id);
	if (!entry) { return; }
	const ids = [...views.keys()];
	const index = ids.indexOf(id);
	views.delete(id);
	if (host && !host.isDestroyed()) { host.contentView.removeChildView(entry.view); }
	if (!entry.view.webContents.isDestroyed()) { entry.view.webContents.close({ waitForBeforeUnload: false }); }
	if (selected === id) {
		selected = ids[index + 1] ?? ids[index - 1];
		if (selected !== undefined && host && !host.isDestroyed()) { selectPrototypeWorkbench(selected); }
	}
	renderShell();
}

export function replacePrototypeWorkbench(id: number, options: electron.BrowserWindowConstructorOptions): electron.WebContentsView {
	const entry = views.get(id);
	if (!entry || !host || host.isDestroyed() || prototypeHostClosing) { throw new Error('Recovery owner no longer available'); }
	const old = entry.view;
	const view = new electron.WebContentsView({ webPreferences: { ...options.webPreferences, backgroundThrottling: false } });
	registerPrototypeDocument(view.webContents, id);
	entry.view = view;
	host.contentView.removeChildView(old);
	if (!old.webContents.isDestroyed()) { old.webContents.close({ waitForBeforeUnload: false }); }
	host.contentView.addChildView(view);
	view.setVisible(selected === id);
	if (selected === id) { selectPrototypeWorkbench(id); }
	return view;
}

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
	if (!host || host.isDestroyed()) { return; }
	const links = [...views].map(([id, entry]) => {
		const status = entry.state ? ` <span role="status">${entry.state}</span>` : '';
		const retry = entry.retry ? ` <a href="https://prototype.invalid/retry/${id}">${localize('retry', "Retry")}</a>` : '';
		const close = entry.close ? ` <a href="https://prototype.invalid/close/${id}">${localize('close', "Close")}</a>` : '';
		return `<span><a href="https://prototype.invalid/select/${id}">${entry.label} (${id})</a>${status}${retry}${close}</span>`;
	}).join(' ');
	void host.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(`<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'"><title>Disposable hosting probe</title><style>body{margin:0;background:#202020;color:white;font:14px system-ui}nav{height:42px;display:flex;align-items:center;gap:20px;padding:0 20px;overflow:auto;white-space:nowrap}a{color:inherit}a:focus-visible{outline:2px solid currentColor;outline-offset:2px}</style><nav>${links}</nav>`));
}

export function createPrototypeWorkbench(options: electron.BrowserWindowConstructorOptions, agents: boolean) {
	if (!host) {
		host = new electron.BrowserWindow({ ...options, width: 1280, height: 900, titleBarStyle: 'default', webPreferences: { sandbox: true, contextIsolation: true, nodeIntegration: false } });
		host.webContents.on('will-navigate', (event, url) => {
			event.preventDefault();
			const match = /^https:\/\/prototype\.invalid\/(select|retry|close)\/(\d+)$/.exec(url);
			if (!match || prototypeHostClosing) { return; }
			const id = Number(match[2]);
			if (match[1] === 'select') { selectPrototypeWorkbench(id); }
			else if (match[1] === 'retry') { views.get(id)?.retry?.(); }
			else { views.get(id)?.close?.(); }
		});
		host.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
		host.on('resize', () => { if (selected !== undefined) { selectPrototypeWorkbench(selected); } });
		host.once('closed', () => {
			const entries = [...views.keys()];
			host = undefined;
			for (const id of entries) { removePrototypeWorkbench(id); }
			selected = undefined;
			prototypeHostClosing = false;
		});
	}
	const id = nextId++;
	const view = new electron.WebContentsView({ webPreferences: { ...options.webPreferences, backgroundThrottling: false } });
	registerPrototypeDocument(view.webContents, id);
	views.set(id, { view, label: agents ? 'Agents' : `Project ${views.size}` });
	host.contentView.addChildView(view);

	view.webContents.on('did-finish-load', () => {
		console.log('[hosting-probe] loaded', JSON.stringify({ id, nativeHost: host!.id, webContents: view.webContents.id, pid: view.webContents.getOSProcessId(), url: view.webContents.getURL() }));
	});
	renderShell();
	selectPrototypeWorkbench(id);
	return { host, view, id };
}

// Main-owned registry: a client's handshake cannot choose its workbench or role.
export function prototypeContext(contents: electron.WebContents): string {
	for (const [id, entry] of views) {
		if (entry.view.webContents === contents) { return `window:${id}`; }
	}
	return `unregistered:${contents.id}`;
}
