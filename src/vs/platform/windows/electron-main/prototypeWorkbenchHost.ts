/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// Retained workbench views share one native host and keep independent lifetimes.
import electron from 'electron';
import { randomUUID } from 'crypto';
import { escape } from '../../../base/common/strings.js';
import { basename } from '../../../base/common/resources.js';
import { IWorkspaceIdentifier, ISingleFolderWorkspaceIdentifier, isWorkspaceIdentifier } from '../../workspace/common/workspace.js';
import { localize } from '../../../nls.js';
import { Emitter } from '../../../base/common/event.js';
import { registerPrototypeDocument } from '../../../base/parts/ipc/electron-main/prototypeLifetime.js';

let host: electron.BrowserWindow | undefined;
let nextId = 100000;
let selected: number | undefined;
const selectionChanged = new Emitter<{ previous: number | undefined; id: number }>();
export const onDidSelectPrototypeWorkbench = selectionChanged.event;

/** Resolves a native host to its selected logical workbench, including shell focus. */
export function getSelectedPrototypeWorkbench(window: electron.BrowserWindow): number | undefined {
	return window === host && selected !== undefined && views.has(selected) ? selected : undefined;
}
let shellReady = false;
let helpHint = true;
const views = new Map<number, { view: electron.WebContentsView; contents: electron.WebContents; label: string; path: string; agents: boolean; state?: string; retry?: () => void; close?: () => void }>();
const removals = new Map<number, { entry: NonNullable<ReturnType<typeof views.get>>; detached: boolean; selected: boolean }>();
let closeFailure: string | undefined;
export function reportPrototypeCloseFailure(id: number): void {
	closeFailure = localize('projectCleanupFailed', "Project {0}: Close failed", id);
	renderShell();
}
export let prototypeHostClosing = false;
export function setPrototypeHostClosing(value: boolean): void { prototypeHostClosing = value; }

export function setPrototypeRecovery(id: number, state: string | undefined, retry?: () => void, close?: () => void): void {
	const entry = views.get(id);
	if (!entry) { return; }
	Object.assign(entry, { state, retry, close });
	renderShell();
}

export function removePrototypeWorkbench(id: number): void {
	let removal = removals.get(id);
	if (!removal) {
		const entry = views.get(id);
		if (!entry) { return; }
		removal = { entry, detached: false, selected: selected === id };
		removals.set(id, removal);
		const ids = [...views.keys()];
		const index = ids.indexOf(id);
		views.delete(id);
		if (selected === id) { selected = ids[index + 1] ?? ids[index - 1]; }
	}
	const errors: unknown[] = [];
	try {
		if (!removal.detached && host && !host.isDestroyed()) { host.contentView.removeChildView(removal.entry.view); }
		removal.detached = true;
	} catch (error) { errors.push(error); }
	try {
		if (!removal.entry.contents.isDestroyed()) { removal.entry.contents.close({ waitForBeforeUnload: false }); }
	} catch (error) { errors.push(error); }
	try {
		if (removal.selected && selected !== undefined && host && !host.isDestroyed()) { selectPrototypeWorkbench(selected); }
		renderShell();
	} catch (error) { errors.push(error); }
	if (errors.length) { throw new AggregateError(errors, 'Project view cleanup failed'); }
	removals.delete(id);
}

export function replacePrototypeWorkbench(id: number, options: electron.BrowserWindowConstructorOptions): electron.WebContentsView {
	const entry = views.get(id);
	if (!entry || !host || host.isDestroyed() || prototypeHostClosing) { throw new Error('Recovery owner no longer available'); }
	const old = entry.view;
	const oldContents = entry.contents;
	const view = new electron.WebContentsView({ webPreferences: { ...options.webPreferences, backgroundThrottling: false } });
	registerPrototypeDocument(view.webContents, id, { role: entry.agents ? 'agents' : 'project' });
	entry.view = view;
	entry.contents = view.webContents;
	host.contentView.removeChildView(old);
	if (!oldContents.isDestroyed()) { oldContents.close({ waitForBeforeUnload: false }); }
	view.setVisible(false);
	if (selected === id) { selectPrototypeWorkbench(id); }
	return view;
}

/** Focus only the shell belonging to a live hosted caller. */
export function focusPrototypeProjectTabs(id: number): boolean {
	if (!views.has(id) || !host || host.isDestroyed()) { return false; }
	host.webContents.focus();
	return true;
}

export function selectPrototypeWorkbench(id: number): void {
	const target = views.get(id);
	if (!target || target.contents.isDestroyed() || !host) {
		throw new Error(`Unknown/disposed prototype workbench ${id}`);
	}
	const previous = selected;
	selected = id;
	for (const [key, entry] of views) {
		if (key !== id) {
			entry.view.setVisible(false);
			host.contentView.removeChildView(entry.view);
		}
	}
	host.contentView.addChildView(target.view);
	target.view.setVisible(true);
	const [width, height] = host.getContentSize();
	target.view.setBounds({ x: 0, y: 42, width, height: Math.max(0, height - 42) });
	target.contents.focus();
	if (previous !== id) { selectionChanged.fire({ previous, id }); }
	renderShell();
}

function escapeHtml(value: string): string {
	return escape(value).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/** Updates shell labels from the same exact workspace configuration the view loads. */
export function updatePrototypeWorkbench(id: number, workspace: IWorkspaceIdentifier | ISingleFolderWorkspaceIdentifier | undefined, remoteAuthority: string | undefined, accessibilityHelpHint: boolean): void {
	const entry = views.get(id);
	if (!entry) { return; }
	helpHint = accessibilityHelpHint;
	if (!entry.agents) {
		const uri = workspace && (isWorkspaceIdentifier(workspace) ? workspace.configPath : workspace.uri);
		entry.label = uri ? basename(uri) : localize('emptyProject', "Empty Project");
		entry.path = uri ? uri.scheme === 'file' ? uri.fsPath : uri.toString(true) : '';
		if (remoteAuthority) { entry.path = `${remoteAuthority} · ${entry.path}`; }
	}
	renderShell();
}

function reorderWorkbench(id: number, targetId: number): void {
	const entries = [...views];
	const from = entries.findIndex(([key]) => key === id);
	const to = entries.findIndex(([key]) => key === targetId);
	if (from < 0 || to < 0 || views.get(id)!.agents || views.get(targetId)!.agents) { return; }
	entries.splice(to, 0, ...entries.splice(from, 1));
	views.clear();
	for (const [key, entry] of entries) { views.set(key, entry); }
	renderShell();
}

// These functions run only in the sandboxed shell, without a preload or native service access.
function updateShell(markup: string, restoreFocus: boolean): void {
	const focused = document.activeElement?.id;
	const strip = document.getElementById('projects');
	const scroll = strip?.scrollLeft ?? 0;
	const selected = strip?.querySelector('[aria-selected="true"]')?.id;
	document.querySelector('nav')!.innerHTML = markup;
	const nextStrip = document.getElementById('projects')!;
	nextStrip.scrollLeft = scroll;
	const nextSelected = nextStrip.querySelector<HTMLElement>('[aria-selected="true"]');
	if (selected !== nextSelected?.id) { nextSelected?.scrollIntoView({ block: 'nearest', inline: 'nearest' }); }
	if (restoreFocus && focused) { document.getElementById(focused)?.focus({ preventScroll: true }); }
}

function installShellControls(): void {
	const navigate = (action: string, id: string, target?: string) => {
		location.href = `https://prototype.invalid/${action}/${id}${target ? '/' + target : ''}`;
	};
	document.addEventListener('click', event => {
		const button = (event.target as Element).closest<HTMLElement>('[data-action]');
		if (button) { navigate(button.dataset.action!, button.dataset.id!); }
	});
	document.addEventListener('keydown', event => {
		if (event.altKey && event.key === 'F1') { event.preventDefault(); navigate('help', '0'); return; }
		const tab = (event.target as Element).closest<HTMLElement>('[role="tab"]');
		if (!tab || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) { return; }
		event.preventDefault();
		const tabs = [...document.querySelectorAll<HTMLElement>('[role="tab"]')];
		const index = tabs.indexOf(tab);
		const direction = event.key === 'ArrowLeft' ? -1 : 1;
		const next = tabs[event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (index + direction + tabs.length) % tabs.length];
		for (const candidate of tabs) { candidate.tabIndex = candidate === next ? 0 : -1; }
		next.focus();
		next.scrollIntoView({ block: 'nearest', inline: 'nearest' });
	});
	let dragged: string | undefined;
	document.addEventListener('dragstart', event => {
		const tab = (event.target as Element).closest<HTMLElement>('[draggable]');
		dragged = tab?.dataset.id;
		if (dragged) { event.dataTransfer?.setData('text/plain', dragged); }
	});
	document.addEventListener('dragover', event => {
		if (dragged && (event.target as Element).closest('[draggable]')) { event.preventDefault(); }
	});
	document.addEventListener('drop', event => {
		const target = (event.target as Element).closest<HTMLElement>('[draggable]');
		if (dragged && target) { event.preventDefault(); navigate('reorder', dragged, target.dataset.id); }
		dragged = undefined;
	});
	document.addEventListener('dragend', () => { dragged = undefined; });
}

function renderShell(): void {
	if (!host || host.isDestroyed() || !shellReady) { return; }
	const hint = helpHint ? ' aria-describedby="shell-help-hint"' : '';
	const firstProject = [...views].find(([, candidate]) => !candidate.agents)?.[0];
	const control = (id: number, entry: NonNullable<ReturnType<typeof views.get>>) => {
		const label = escapeHtml(entry.label);
		const path = escapeHtml(entry.path);
		const status = entry.state ? ` <span role="status">${escapeHtml(entry.state)}</span>` : '';
		const retry = entry.retry ? ` <button data-action="retry" data-id="${id}">${escapeHtml(localize('retry', "Retry"))}</button>` : '';
		const close = !entry.agents && entry.close ? ` <button data-action="close" data-id="${id}">${escapeHtml(localize('close', "Close"))}</button>` : '';
		const tabbable = selected === id || views.get(selected ?? -1)?.agents && id === firstProject;
		const attributes = entry.agents ? `aria-pressed="${selected === id}"` : `role="tab" aria-selected="${selected === id}" tabindex="${tabbable ? 0 : -1}"`;
		return `<div class="${entry.agents ? 'agents' : 'project'}" ${entry.agents ? '' : 'draggable="true"'} data-id="${id}"><button id="view-${id}" data-action="select" data-id="${id}" ${attributes}${hint} title="${path || label}" aria-label="${label}${path ? ' · ' + path : ''}">${label}${path ? `<small>${path}</small>` : ''}</button>${status}${retry}${close}</div>`;
	};
	const agents = [...views].filter(([, entry]) => entry.agents).map(([id, entry]) => control(id, entry)).join('');
	const projects = [...views].filter(([, entry]) => !entry.agents).map(([id, entry]) => control(id, entry)).join('');
	const markup = `${agents}<div id="projects" role="tablist" aria-label="${escapeHtml(localize('openProjects', "Open Projects"))}">${projects}</div><span class="sr-only" id="shell-help-hint">${escapeHtml(localize('projectTabsHelpHint', "Press Alt+F1 for project navigation help."))}</span>${closeFailure ? `<span role="alert">${escapeHtml(closeFailure)}</span>` : ''}`;
	void host.webContents.executeJavaScript(`(${updateShell.toString()})(${JSON.stringify(markup)}, ${host.webContents.isFocused()})`).catch(error => console.error('Shell update failed', error));
}

export function createPrototypeWorkbench(options: electron.BrowserWindowConstructorOptions, agents: boolean) {
	if (!host) {
		host = new electron.BrowserWindow({ ...options, width: 1280, height: 900, titleBarStyle: 'default', webPreferences: { sandbox: true, contextIsolation: true, nodeIntegration: false } });
		host.webContents.on('will-navigate', (event, url) => {
			event.preventDefault();
			const match = /^https:\/\/prototype\.invalid\/(select|retry|close|reorder|help)\/(?<id>\d+)(?:\/(?<target>\d+))?$/.exec(url);
			if (!match || (prototypeHostClosing && match[1] !== 'close')) { return; }
			const id = Number(match.groups!.id);
			if (match[1] !== 'help' && !views.has(id)) { return; }
			if (match[1] === 'select') { selectPrototypeWorkbench(id); }
			else if (match[1] === 'reorder') {
				if (match.groups!.target) { reorderWorkbench(id, Number(match.groups!.target)); }
			}
			else if (match[1] === 'help') {
				const helpHost = host!;
				void electron.dialog.showMessageBox(helpHost, {
					type: 'info', buttons: [localize('closeHelp', "Close")],
					message: localize('projectNavigationHelp', "Project Navigation"),
					detail: localize('projectNavigationHelpDetail', "Agents is always available to the left of the project tabs. Tab and Shift+Tab move between controls. Left and Right arrows, Home and End move through project tabs; Enter or Space selects the focused project. Drag a project tab to reorder it. Each project retains its editors and running work when you switch. Escape closes this help.")
				}).then(() => { if (host === helpHost && !helpHost.isDestroyed()) { helpHost.webContents.focus(); } });
			}
			else if (match[1] === 'retry') { views.get(id)?.retry?.(); }
			else { views.get(id)?.close?.(); }
		});
		host.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
		host.on('focus', () => {
			const contents = selected === undefined ? undefined : views.get(selected)?.contents;
			if (contents && !contents.isDestroyed()) { contents.focus(); }
		});
		host.on('resize', () => {
			const view = selected === undefined ? undefined : views.get(selected)?.view;
			const [width, height] = host!.getContentSize();
			view?.setBounds({ x: 0, y: 42, width, height: Math.max(0, height - 42) });
		});
		host.webContents.on('did-finish-load', () => { shellReady = true; renderShell(); });
		const nonce = randomUUID();
		void host.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(`<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}'"><title>escode</title><style>
			:root{color-scheme:dark;--shell:#181818;--raised:#2b2b2b;--text:#ccc;--muted:#aaa;--line:#3c3c3c;--accent:#4daafc;font:13px -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}*{box-sizing:border-box;scrollbar-color:#555 var(--shell);scrollbar-width:thin}body{margin:0;background:var(--shell);color:var(--text)}nav{height:42px;display:flex;align-items:stretch;gap:4px;padding:4px 12px 0;border-bottom:1px solid var(--line)}button{font:inherit;color:inherit;background:transparent;border:1px solid transparent;border-radius:4px;padding:6px 10px;cursor:pointer;white-space:nowrap}button:hover{background:var(--raised)}button:focus-visible{outline:2px solid var(--accent);outline-offset:-2px}button[aria-selected="true"],button[aria-pressed="true"]{background:#303030;border-color:#555}.agents{display:flex;flex:none;min-width:90px}#projects{display:flex;overflow-x:auto;flex:1;min-width:0;gap:4px}.project{display:flex;flex:none;max-width:300px;background:#202020;border-radius:7px 7px 0 0}.project>button:first-child{min-width:100px;overflow:hidden;text-overflow:ellipsis;text-align:left;border-radius:7px 7px 0 0}.project small{color:var(--muted);margin-left:9px}nav [role="status"]{align-self:center}::selection{background:#264f78}.sr-only{position:absolute;width:1px;height:1px;padding:0;overflow:hidden;clip-path:inset(50%);white-space:nowrap}
		</style></head><body><nav aria-label="${escapeHtml(localize('projectNavigation', "Project Navigation"))}"></nav><script nonce="${nonce}">(${installShellControls.toString()})()</script></body></html>`));
		host.once('closed', () => {
			const entries = [...views.keys()];
			host = undefined;
			shellReady = false;
			for (const id of entries) { removePrototypeWorkbench(id); }
			selected = undefined;
			prototypeHostClosing = false;
		});
	}
	const id = nextId++;
	const view = new electron.WebContentsView({ webPreferences: { ...options.webPreferences, backgroundThrottling: false } });
	registerPrototypeDocument(view.webContents, id, { role: agents ? 'agents' : 'project' });
	views.set(id, { view, contents: view.webContents, label: agents ? localize('agents', "Agents") : localize('emptyProject', "Empty Project"), path: '', agents });
	host.contentView.addChildView(view);

	renderShell();
	selectPrototypeWorkbench(id);
	return { host, view, id };
}
