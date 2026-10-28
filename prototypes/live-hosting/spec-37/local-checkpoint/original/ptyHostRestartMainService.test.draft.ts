/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import assert from 'assert';
import { EventEmitter } from 'events';
import type { BrowserWindow, IpcMainEvent, MessageBoxOptions, MessageBoxReturnValue, WebContents, WebFrameMain } from 'electron';
import sinon from 'sinon';
import { DeferredPromise } from '../../../../base/common/async.js';
import { URI } from '../../../../base/common/uri.js';
import { prototypeRequestContext, registerPrototypeDocument } from '../../../../base/parts/ipc/electron-main/prototypeLifetime.js';
import { upcastPartial } from '../../../../base/test/common/mock.js';
import { ensureNoDisposablesAreLeakedInTestSuite } from '../../../../base/test/common/utils.js';
import { IDialogMainService } from '../../../dialogs/electron-main/dialogMainService.js';
import { ICodeWindow } from '../../../window/electron-main/window.js';
import { IWindowsMainService } from '../../../windows/electron-main/windows.js';
import { PtyHostRestartMainService } from '../../electron-main/ptyHostRestartMainService.js';

type NodeListener = Parameters<EventEmitter['on']>[1];

suite('Terminal host restart coordinator', () => {
	ensureNoDisposablesAreLeakedInTestSuite();
	const cleanups: (() => void)[] = [];
	let log: sinon.SinonStub;
	setup(() => { log = sinon.stub(console, 'log'); });
	teardown(() => { cleanups.splice(0).forEach(dispose => dispose()); log.restore(); });

	function project(id: number) {
		const events = new EventEmitter();
		const frame = upcastPartial<WebFrameMain>({});
		let nonce: string | undefined;
		const contents: WebContents = upcastPartial<WebContents>({ id, mainFrame: frame,
			on: (event: string, listener: NodeListener) => { events.on(event, listener); return contents; },
			once: (event: string, listener: NodeListener) => { events.once(event, listener); return contents; },
			isDestroyed: () => false, send: (_channel: string, value: string) => { nonce = value; }
		});
		registerPrototypeDocument(contents, id, { role: 'project' });
		events.emit('dom-ready');
		cleanups.push(() => events.emit('destroyed'));
		const context = prototypeRequestContext(upcastPartial<IpcMainEvent>({ sender: contents, senderFrame: frame }), nonce);
		const window = upcastPartial<ICodeWindow>({ id, webContents: contents, openedWorkspace: { id: String(id), uri: URI.file(`/scratch/project-${id}`) }, win: upcastPartial<BrowserWindow>({ isDestroyed: () => false }) });
		return { window, context, replaceDocument: () => events.emit('dom-ready') };
	}

	function fixture() {
		const one = project(951);
		const two = project(952);
		const liveTerminals = new Set([951, 952]);
		const shown = new DeferredPromise<MessageBoxOptions>();
		const decision = new DeferredPromise<MessageBoxReturnValue>();
		let restarts = 0;
		const coordinator = new PtyHostRestartMainService(upcastPartial<IWindowsMainService>({ getWindows: () => [one.window, two.window], getWindowById: id => [one.window, two.window].find(window => window.id === id) }), upcastPartial<IDialogMainService>({
			showMessageBox: async (options, _window, validate) => { validate!(); await shown.complete(options); const result = await decision.p; validate!(); return result; }
		}), async () => { liveTerminals.clear(); restarts++; });
		return { one, two, liveTerminals, shown, decision, coordinator, restartCount: () => restarts };
	}

	test('the current recovery control confirms all-project effects and coalesces overlapping requests', async () => {
		const f = fixture();
		const first = f.coordinator.request(f.one.context);
		const second = f.coordinator.request(f.two.context);
		const options = await f.shown.p;
		assert.strictEqual(options.defaultId, options.cancelId);
		assert.ok(options.detail?.includes('project-951') && options.detail.includes('project-952'));
		assert.deepStrictEqual([...f.liveTerminals], [951, 952]);
		await f.decision.complete({ response: 0, checkboxChecked: false });
		await Promise.all([first, second]);
		assert.deepStrictEqual([...f.liveTerminals], []);
		assert.strictEqual(f.restartCount(), 1);
	});

	test('cancel preserves processes in every project', async () => {
		const f = fixture();
		const pending = f.coordinator.request(f.one.context);
		await f.shown.p;
		await f.decision.complete({ response: 1, checkboxChecked: false });
		await pending;
		assert.deepStrictEqual([...f.liveTerminals], [951, 952]);
		assert.strictEqual(f.restartCount(), 0);
	});

	test('a changed affected document invalidates pending native confirmation', async () => {
		const f = fixture();
		const pending = f.coordinator.request(f.one.context);
		const rejected = assert.rejects(pending, /Projects changed/);
		await f.shown.p;
		f.two.replaceDocument();
		await f.decision.complete({ response: 0, checkboxChecked: false });
		await rejected;
		assert.deepStrictEqual([...f.liveTerminals], [951, 952]);
		assert.strictEqual(f.restartCount(), 0);
	});
});
