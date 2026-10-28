/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import assert from 'assert';
import { DeferredPromise } from '../../../../base/common/async.js';
import { ProfilingSession } from '../../../../base/node/profiling.js';
import { ensureNoDisposablesAreLeakedInTestSuite } from '../../../../base/test/common/utils.js';
import { ExtensionHostProfiling } from '../../node/extensionHostProfiling.js';

suite('ExtensionHostProfiling', () => {
	const store = ensureNoDisposablesAreLeakedInTestSuite();
	const ready = { type: 'vscode:extension-host-inspector', nonce: 'main-issued', pid: 123, endpoint: 'ws://127.0.0.1:4321/actual-child' };
	const profile = { nodes: [], startTime: 1, endTime: 2 };

	test('only its actual child startup can establish the target and only its own handle can stop', async () => {
		let stops = 0;
		const target = store.add(new ExtensionHostProfiling('main-issued', () => 123, () => {}, async () => ({ stop: async () => { stops++; return { profile }; } })));
		assert.strictEqual(target.acceptStartupMessage({ ...ready, nonce: 'foreign' }), false);
		assert.strictEqual(target.acceptStartupMessage({ ...ready, pid: 456 }), false);
		await assert.rejects(target.startCpuProfile(), /unavailable/);
		assert.strictEqual(target.acceptStartupMessage(ready), true);
		assert.strictEqual(target.acceptStartupMessage({ ...ready, endpoint: 'ws://127.0.0.1:4321/replacement' }), false);
		const id = await target.startCpuProfile();
		await assert.rejects(target.stopCpuProfile('foreign'), /Unknown/);
		assert.deepStrictEqual(await target.stopCpuProfile(id), profile);
		assert.strictEqual(stops, 1);
	});

	test('revocation during inspector connection closes the late session without issuing a handle', async () => {
		const started = new DeferredPromise<ProfilingSession>();
		let live = true;
		let stops = 0;
		const target = store.add(new ExtensionHostProfiling('main-issued', () => 123, () => { if (!live) { throw new Error('Expired'); } }, () => started.p));
		target.acceptStartupMessage(ready);
		const pending = target.startCpuProfile();
		const rejected = assert.rejects(pending, /Expired/);
		live = false;
		await started.complete({ stop: async () => { stops++; return { profile }; } });
		await rejected;
		assert.strictEqual(stops, 1);
	});
	test('an old attestation cannot be adopted by a replacement process', async () => {
		let pid = 123;
		const target = store.add(new ExtensionHostProfiling('main-issued', () => pid, () => {}));
		assert.strictEqual(target.acceptStartupMessage(ready), true);
		pid = 456;
		await assert.rejects(target.startCpuProfile(), /expired/);
	});

});
