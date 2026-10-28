/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import assert from 'assert';
import { DeferredPromise } from '../../../../base/common/async.js';
import { Emitter } from '../../../../base/common/event.js';
import { upcastPartial } from '../../../../base/test/common/mock.js';
import { ensureNoDisposablesAreLeakedInTestSuite } from '../../../../base/test/common/utils.js';
import { ISharedProcessTunnelService } from '../../../remote/common/sharedProcessTunnelService.js';
import { SharedProcessTunnelChannel } from '../../node/sharedProcessTunnelChannel.js';

suite('SharedProcessTunnelChannel', () => {
	const store = ensureNoDisposablesAreLeakedInTestSuite();
	test('tunnel handles require their creator and matching project authority', async () => {
		const removed = store.add(new Emitter<{ ctx: string }>());
		let starts = 0;
		let destroys = 0;
		const channel = store.add(new SharedProcessTunnelChannel(removed.event, upcastPartial<ISharedProcessTunnelService>({ createTunnel: async () => ({ id: 'owned' }), startTunnel: async () => { starts++; return { tunnelLocalPort: 1234, localAddress: 'localhost:1234' }; }, destroyTunnel: async () => { destroys++; } }), () => ({ role: 'project', workbench: 1, generation: 1, remoteAuthority: 'ssh-remote+own' })));
		assert.deepStrictEqual(await channel.call('one', 'createTunnel'), { id: 'owned' });
		await assert.rejects(channel.call('two', 'destroyTunnel', ['owned']), /Foreign/);
		await assert.rejects(channel.call('one', 'startTunnel', ['ssh-remote+other', 'owned']), /authority/);
		await channel.call('one', 'startTunnel', ['ssh-remote+own', 'owned', 'localhost', 80, 'localhost']);
		assert.strictEqual(starts, 1);
		removed.fire({ ctx: 'one' });
		assert.strictEqual(destroys, 1);
	});

	test('late tunnel allocation is destroyed instead of handed to a replacement connection', async () => {
		const removed = store.add(new Emitter<{ ctx: string }>());
		const allocated = new DeferredPromise<{ id: string }>();
		let live = true;
		const destroyed: string[] = [];
		const channel = store.add(new SharedProcessTunnelChannel(removed.event, upcastPartial<ISharedProcessTunnelService>({ createTunnel: () => allocated.p, destroyTunnel: async id => { destroyed.push(id); } }), () => { if (!live) { throw new Error('Expired'); } return undefined; }));
		const pending = channel.call('one', 'createTunnel');
		const rejected = assert.rejects(pending, /Expired/);
		live = false;
		await allocated.complete({ id: 'late' });
		await rejected;
		assert.deepStrictEqual(destroyed, ['late']);
	});
});
