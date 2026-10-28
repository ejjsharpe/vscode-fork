/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import assert from 'assert';
import { EventEmitter } from 'events';
import type { IpcMainEvent, WebContents, WebFrameMain } from 'electron';
import sinon from 'sinon';
import { DeferredPromise } from '../../../../base/common/async.js';
import { Event } from '../../../../base/common/event.js';
import { DisposableStore } from '../../../../base/common/lifecycle.js';
import { prototypeRequestContext, registerPrototypeDocument, revokePrototypeConnection } from '../../../../base/parts/ipc/electron-main/prototypeLifetime.js';
import { upcastPartial } from '../../../../base/test/common/mock.js';
import { ensureNoDisposablesAreLeakedInTestSuite } from '../../../../base/test/common/utils.js';
import { IWindowsMainService } from '../../electron-main/windows.js';
import { ICodeWindow } from '../../../window/electron-main/window.js';
import { prototypeWorkerChannel } from '../../electron-main/prototypeNativeChannel.js';

type NodeListener = Parameters<EventEmitter['on']>[1];

suite('Native worker authority', () => {
	const store = ensureNoDisposablesAreLeakedInTestSuite();

	test('overwrites peer context and cleans only the revoked connection without killing a later worker', async () => {
		const log = sinon.stub(console, 'log');
		const events = new EventEmitter();
		const frame = upcastPartial<WebFrameMain>({});
		let nonce: string | undefined;
		const contents: WebContents = upcastPartial<WebContents>({
			id: 716,
			mainFrame: frame,
			on: (event: string, listener: NodeListener) => { events.on(event, listener); return contents; },
			once: (event: string, listener: NodeListener) => { events.once(event, listener); return contents; },
			isDestroyed: () => false,
			send: (_channel: string, value: string) => { nonce = value; }
		});
		registerPrototypeDocument(contents, 51, { role: 'project', workspaceId: 'one' });
		events.emit('dom-ready');
		const request = upcastPartial<IpcMainEvent>({ sender: contents, senderFrame: frame });
		const first = prototypeRequestContext(request, nonce);
		const second = prototypeRequestContext(request, nonce);
		const terminated = new DeferredPromise<void>();
		const active = new Set<string>();
		const pendingCreations: string[] = [];
		const channel = prototypeWorkerChannel({
			call: async <T>(_context: string, command: string, args: unknown[]) => {
				const context = (args[0] as { nativeConnectionContext: string }).nativeConnectionContext;
				if (command === 'createWorker') { active.add(context); pendingCreations.push(context); await terminated.p; }
				else { active.delete(context); }
				return undefined as T;
			},
			listen: () => Event.None
		}, upcastPartial<IWindowsMainService>({ getWindowById: () => upcastPartial<ICodeWindow>({ id: 51, webContents: contents }) }), store.add(new DisposableStore()));
		const configuration = { nativeConnectionContext: 'main', process: { moduleId: 'vs/platform/files/node/watcher/watcherMain' }, reply: { windowId: 51, channel: 'vscode:worker', nonce: 'reply' } };
		try {
			const old = channel.call(first, 'createWorker', [configuration]);
			const oldResult = assert.rejects(old, /Revoked|revoked|connection/);
			revokePrototypeConnection(first);
			const current = channel.call(second, 'createWorker', [configuration]);
			await terminated.complete();
			await oldResult;
			await current;
			assert.deepStrictEqual(pendingCreations, [first, second]);
			assert.deepStrictEqual([...active], [second]);
		} finally {
			events.emit('destroyed');
			log.restore();
		}
	});
});
