/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import assert from 'assert';
import { EventEmitter } from 'events';
import sinon from 'sinon';
import type { WebContents } from 'electron';
import { Event } from '../../../../base/common/event.js';
import { DisposableStore, toDisposable } from '../../../../base/common/lifecycle.js';
import { IServerChannel } from '../../../../base/parts/ipc/common/ipc.js';
import { bindPrototypeConnection, registerPrototypeDocument, revokePrototypeConnection } from '../../../../base/parts/ipc/electron-main/prototypeLifetime.js';
import { upcastPartial } from '../../../../base/test/common/mock.js';
import { ensureNoDisposablesAreLeakedInTestSuite } from '../../../../base/test/common/utils.js';
import { IAuxiliaryWindowsMainService } from '../../../auxiliaryWindow/electron-main/auxiliaryWindows.js';
import { IAuxiliaryWindow } from '../../../auxiliaryWindow/electron-main/auxiliaryWindow.js';
import { ICodeWindow } from '../../../window/electron-main/window.js';
import { prototypeExtensionChannel, prototypeNativeChannel } from '../../electron-main/prototypeNativeChannel.js';
import { IWindowsMainService } from '../../electron-main/windows.js';

suite('Hosted native command ownership', () => {
	const store = ensureNoDisposablesAreLeakedInTestSuite();
	let nextId = 0;
	setup(() => sinon.stub(console, 'log'));
	teardown(() => sinon.restore());

	function createDocument(workbench: number) {
		const events = new EventEmitter();
		let nonce: unknown;
		let destroyed = false;
		const contents: WebContents = upcastPartial<WebContents>({
			id: ++nextId,
			on: (name, listener) => { events.on(name, listener); return contents; },
			once: (name, listener) => { events.once(name, listener); return contents; },
			isDestroyed: () => destroyed,
			send: (_channel, value) => { nonce = value; }
		});
		registerPrototypeDocument(contents, workbench);
		events.emit('dom-ready');
		store.add(toDisposable(() => { destroyed = true; events.emit('destroyed'); }));
		const context = bindPrototypeConnection(contents, nonce)!;
		return { contents, context };
	}

	function fixture() {
		const parent = createDocument(10);
		const child = createDocument(10);
		const window = upcastPartial<ICodeWindow>({ id: 10, webContents: parent.contents });
		const auxiliary = upcastPartial<IAuxiliaryWindow>({ id: 50, parentId: 10, webContents: child.contents });
		const windows = upcastPartial<IWindowsMainService>({ getWindowById: id => id === 10 ? window : undefined });
		const auxiliaries = upcastPartial<IAuxiliaryWindowsMainService>({
			getWindows: () => [auxiliary],
			getWindowByWebContents: contents => contents === child.contents ? auxiliary : undefined
		});
		const effects: string[] = [];
		const service: IServerChannel<string> = {
			async call<T>(_context: string, command: string) { effects.push(command); return 'accepted' as T; },
			listen: () => Event.None
		};
		return { parent, child, windows, auxiliaries, service, effects };
	}

	test('permits own auxiliary controls and rejects foreign nested targets before effects', async () => {
		const { parent, windows, auxiliaries, service, effects } = fixture();
		const channel = prototypeNativeChannel(service, windows, auxiliaries);
		assert.strictEqual(await channel.call(parent.context, 'focusWindow', [10, { targetWindowId: 50 }]), 'accepted');
		await assert.rejects(channel.call(parent.context, 'focusWindow', [10, { nested: { targetWindowId: 51 } }]), /foreign\/unknown target/);
		assert.deepStrictEqual(effects, ['focusWindow']);
	});

	test('an auxiliary document cannot impersonate its parent', async () => {
		const { child, windows, auxiliaries, service, effects } = fixture();
		await assert.rejects(prototypeNativeChannel(service, windows, auxiliaries).call(child.context, 'focusWindow', [10]), /unregistered or stale caller/);
		assert.deepStrictEqual(effects, []);
	});

	test('expired connections cannot dispatch to their surviving workbench', async () => {
		const { parent, windows, auxiliaries, service, effects } = fixture();
		revokePrototypeConnection(parent.context);
		await assert.rejects(prototypeNativeChannel(service, windows, auxiliaries).call(parent.context, 'focusWindow', [10]), /revoked document\/connection/);
		assert.deepStrictEqual(effects, []);
	});
	test('extension profiling targets only an owned process and expires with its connection', async () => {
		const parent = createDocument(10);
		const other = createDocument(20);
		const windows = upcastPartial<IWindowsMainService>({ getWindowById: id => id === 10 ? upcastPartial<ICodeWindow>({ id, webContents: parent.contents }) : id === 20 ? upcastPartial<ICodeWindow>({ id, webContents: other.contents }) : undefined });
		const effects: string[] = [];
		const source: IServerChannel<string> = {
			async call<T>(_ctx: string, command: string) {
				effects.push(command);
				return (command === 'createExtensionHost' ? { id: 'owned-process' } : 'owned-profile') as T;
			},
			listen: () => Event.None
		};
		const channel = prototypeExtensionChannel(source, windows, store.add(new DisposableStore()));
		await channel.call(parent.context, 'createExtensionHost', []);
		await assert.rejects(channel.call(other.context, 'startCpuProfile', ['owned-process']), /extension-host owner\/lifetime/);
		assert.strictEqual(await channel.call(parent.context, 'startCpuProfile', ['owned-process']), 'owned-profile');
		revokePrototypeConnection(parent.context);
		await assert.rejects(channel.call(parent.context, 'stopCpuProfile', ['owned-process', 'owned-profile']), /revoked document\/connection/);
		assert.deepStrictEqual(effects, ['createExtensionHost', 'startCpuProfile', 'kill']);
	});

});
