/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import assert from 'assert';
import type { Session } from 'inspector';
import { Emitter, Event } from '../../../../base/common/event.js';
import { DisposableStore } from '../../../../base/common/lifecycle.js';
import { upcastPartial } from '../../../../base/test/common/mock.js';
import { ensureNoDisposablesAreLeakedInTestSuite } from '../../../../base/test/common/utils.js';
import { SelfProfilingService } from '../../../profiling/node/selfProfilingService.js';
import { createAgentHostManagementChannel } from '../../node/agentHostManagementChannel.js';

suite('Agent Host management authority', () => {
	const store = ensureNoDisposablesAreLeakedInTestSuite();

	test('project diagnostics profile only this process and cannot use provider management or another handle', async () => {
		const profile = { nodes: [], startTime: 1, endTime: 2 };
		const disconnected = store.add(new Emitter<string>());
		let connected = false;
		const channel = createAgentHostManagementChannel({
			call: async <T>() => 'provider-result' as T,
			listen: () => Event.None
		}, () => ({ role: 'project', workbench: 51, generation: 1 }), disconnected.event, store.add(new DisposableStore()), () => new SelfProfilingService(() => upcastPartial<Session>({
			connect: () => { connected = true; },
			disconnect: () => { connected = false; },
			post: ((_method: string, _params: object, callback: (error: Error | null, result: unknown) => void) => callback(null, { profile })) as Session['post']
		})));
		const handle = await channel.call<string>('one', 'startCpuProfile', []);
		await assert.rejects(channel.call('two', 'stopCpuProfile', [handle]), /owner/);
		await assert.rejects(channel.call('one', 'shutdown', []), /non-owner/);
		assert.deepStrictEqual(await channel.call('one', 'stopCpuProfile', [handle]), profile);
		await channel.call('one', 'startCpuProfile', []);
		disconnected.fire('one');
		assert.strictEqual(connected, false);
	});
});
