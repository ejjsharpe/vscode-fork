/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import assert from 'assert';
import type { Session } from 'inspector';
import { DeferredPromise } from '../../../../base/common/async.js';
import { upcastPartial } from '../../../../base/test/common/mock.js';
import { ensureNoDisposablesAreLeakedInTestSuite } from '../../../../base/test/common/utils.js';
import { SelfProfilingService } from '../../node/selfProfilingService.js';

suite('SelfProfilingService', () => {
	const store = ensureNoDisposablesAreLeakedInTestSuite();

	test('profiles its own process and refuses a foreign handle', async () => {
		const profile = { nodes: [], startTime: 1, endTime: 2 };
		let connected = false;
		const session = upcastPartial<Session>({
			connect: () => { connected = true; },
			disconnect: () => { connected = false; },
			post: (...args: unknown[]) => (args.at(-1) as (error: Error | null, result?: object) => void)(null, { profile })
		});
		const service = store.add(new SelfProfilingService(() => session));
		const id = await service.startProfiling();
		await assert.rejects(service.stopProfiling('foreign'), /Unknown profile/);
		assert.deepStrictEqual({ profile: await service.stopProfiling(id), connected }, { profile, connected: false });
	});

	test('disposal during initialization releases the inspector without publishing a handle', async () => {
		const enabled = new DeferredPromise<void>();
		let connected = false;
		const session = upcastPartial<Session>({
			connect: () => { connected = true; },
			disconnect: () => { connected = false; },
			post: (...args: unknown[]) => { void enabled.p.then(() => (args.at(-1) as (error: Error | null) => void)(null)); }
		});
		const service = store.add(new SelfProfilingService(() => session));
		const pending = service.startProfiling();
		const rejected = assert.rejects(pending, /expired/);
		service.dispose();
		await enabled.complete();
		await rejected;
		assert.strictEqual(connected, false);
	});
});
