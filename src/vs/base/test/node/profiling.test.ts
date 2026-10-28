/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import assert from 'assert';
import type { Client } from 'chrome-remote-interface';
import { DeferredPromise } from '../../common/async.js';
import { startProfiling } from '../../node/profiling.js';
import { upcastPartial } from '../common/mock.js';
import { ensureNoDisposablesAreLeakedInTestSuite } from '../common/utils.js';

suite('Owned inspector profiling', () => {
	ensureNoDisposablesAreLeakedInTestSuite();

	test('expiry while enabling the external profiler prevents later sampling and start effects', async () => {
		const entered = new DeferredPromise<void>();
		const enabled = new DeferredPromise<object>();
		let live = true;
		let closed = 0;
		const effects: string[] = [];
		const client: Client = upcastPartial<Client>({
			on: () => client,
			close: async () => { closed++; },
			Debugger: upcastPartial<Client['Debugger']>({ enable: async () => ({ debuggerId: 'debugger' }) }),
			Profiler: upcastPartial<Client['Profiler']>({
				enable: async () => { void entered.complete(); return enabled.p; },
				setSamplingInterval: async () => { effects.push('sampling'); return {}; },
				start: async () => { effects.push('start'); return {}; }
			})
		});
		const pending = startProfiling({ port: 1, checkForPaused: true, validateOwner: () => { if (!live) { throw new Error('Expired'); } } }, async () => client);
		await entered.p;
		const rejected = assert.rejects(pending, /Expired/);
		live = false;
		await enabled.complete({});
		await rejected;
		assert.deepStrictEqual(effects, []);
		assert.strictEqual(closed, 1);
	});
	test('a connection that opens after expiry closes before any debugger command', async () => {
		const connected = new DeferredPromise<Client>();
		let live = true;
		let closed = 0;
		const pending = startProfiling({ port: 1, validateOwner: () => { if (!live) { throw new Error('Expired'); } } }, () => connected.p);
		const rejected = assert.rejects(pending, /Expired/);
		live = false;
		await connected.complete(upcastPartial<Client>({ close: async () => { closed++; } }));
		await rejected;
		assert.strictEqual(closed, 1);
	});

	test('an existing developer debugger pause is preserved', async () => {
		let event: ((message: { method: string }) => void) | undefined;
		let closed = 0;
		const client: Client = upcastPartial<Client>({
			on: (...args: unknown[]) => { event = args[1] as typeof event; return client; },
			close: async () => { closed++; },
			Debugger: upcastPartial<Client['Debugger']>({ enable: async () => { event?.({ method: 'Debugger.paused' }); return { debuggerId: 'debugger' }; } })
		});
		await assert.rejects(startProfiling({ port: 1, checkForPaused: true }, async () => client), /runtime is paused/);
		assert.strictEqual(closed, 0);
	});

});
