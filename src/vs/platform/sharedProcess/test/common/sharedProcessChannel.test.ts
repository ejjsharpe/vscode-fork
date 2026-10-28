/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import assert from 'assert';
import { DeferredPromise } from '../../../../base/common/async.js';
import { Emitter, Event } from '../../../../base/common/event.js';
import { upcastPartial } from '../../../../base/test/common/mock.js';
import { ensureNoDisposablesAreLeakedInTestSuite } from '../../../../base/test/common/utils.js';
import { IServerChannel } from '../../../../base/parts/ipc/common/ipc.js';
import { SharedProcessChannel } from '../../common/sharedProcessChannel.js';

suite('SharedProcessChannel', () => {
	const store = ensureNoDisposablesAreLeakedInTestSuite();
	test('allows named application capabilities but refuses auxiliary and inherited methods', async () => {
		let calls = 0;
		const channel = new SharedProcessChannel(upcastPartial<IServerChannel<string>>({ call: async <T>() => ++calls as T }), ctx => {
			if (ctx !== 'owner') { throw new Error('Auxiliary connection'); }
		}, ['getMachines'], []);
		assert.strictEqual(await channel.call('owner', 'getMachines'), 1);
		await assert.rejects(channel.call('auxiliary', 'getMachines'), /Auxiliary/);
		await assert.rejects(channel.call('owner', 'dispose'), /Unknown/);
		assert.strictEqual(calls, 1);
	});

	test('does not deliver a delayed result or buffered event after revocation', async () => {
		let live = true;
		const result = new DeferredPromise<string>();
		const events = store.add(new Emitter<string>());
		const channel = new SharedProcessChannel(upcastPartial<IServerChannel<string>>({ call: async <T>() => await result.p as T, listen: <T>() => events.event as unknown as Event<T> }), () => {
			if (!live) { throw new Error('Expired connection'); }
		}, ['getMachines'], ['onDidChange']);
		const received: string[] = [];
		store.add(channel.listen<string>('owner', 'onDidChange')(value => received.push(value)));
		events.fire('current');
		const pending = channel.call('owner', 'getMachines');
		const rejected = assert.rejects(pending, /Expired/);
		live = false;
		events.fire('late');
		await result.complete('late');
		await rejected;
		assert.deepStrictEqual(received, ['current']);
	});
});
