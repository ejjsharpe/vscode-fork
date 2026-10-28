/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import assert from 'assert';
import { DeferredPromise } from '../../../../base/common/async.js';
import { Emitter } from '../../../../base/common/event.js';
import { ensureNoDisposablesAreLeakedInTestSuite } from '../../../../base/test/common/utils.js';
import { upcastPartial } from '../../../../base/test/common/mock.js';
import { NullLogService } from '../../../log/common/log.js';
import { IUserDataProfilesService } from '../../../userDataProfile/common/userDataProfile.js';
import { IUserDataManualSyncTask, IUserDataSyncService } from '../../common/userDataSync.js';
import { UserDataSyncServiceChannel } from '../../common/userDataSyncServiceIpc.js';

suite('UserDataSyncServiceChannel ownership', () => {
	const store = ensureNoDisposablesAreLeakedInTestSuite();

	test('manual tasks reject foreign control and stop when the owning connection expires', async () => {
		const removed = store.add(new Emitter<{ ctx: string }>());
		let merges = 0;
		let stops = 0;
		const task = upcastPartial<IUserDataManualSyncTask>({ id: 'task-1', merge: async () => { merges++; }, stop: async () => { stops++; } });
		const channel = store.add(new UserDataSyncServiceChannel(upcastPartial<IUserDataSyncService>({ createManualSyncTask: async () => task }), upcastPartial<IUserDataProfilesService>({}), new NullLogService(), { validate: () => {}, onDidRemoveConnection: removed.event }));
		const id = await channel.call('one', 'createManualSyncTask');
		await assert.rejects(channel.call('two', 'manualSync/merge', [id]), /Foreign/);
		await channel.call('one', 'manualSync/merge', [id]);
		assert.strictEqual(merges, 1);
		removed.fire({ ctx: 'one' });
		await assert.rejects(channel.call('one', 'manualSync/merge', [id]), /not found/);
		assert.strictEqual(stops, 1);
	});

	test('a task created after revocation is stopped without publishing its handle', async () => {
		const created = new DeferredPromise<IUserDataManualSyncTask>();
		let live = true;
		let stops = 0;
		const channel = store.add(new UserDataSyncServiceChannel(upcastPartial<IUserDataSyncService>({ createManualSyncTask: () => created.p }), upcastPartial<IUserDataProfilesService>({}), new NullLogService(), { validate: () => { if (!live) { throw new Error('Expired'); } } }));
		const pending = channel.call('one', 'createManualSyncTask');
		const rejected = assert.rejects(pending, /Expired/);
		live = false;
		await created.complete(upcastPartial<IUserDataManualSyncTask>({ id: 'late', stop: async () => { stops++; } }));
		await rejected;
		assert.strictEqual(stops, 1);
	});
});
